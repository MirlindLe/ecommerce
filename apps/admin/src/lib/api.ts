import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: AxiosError) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null
) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't try to refresh token for auth endpoints
    const isAuthEndpoint = originalRequest.url?.includes("/auth/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: resolve as (token: string) => void,
            reject,
          });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post("/auth/register", data),
  logout: () => api.post("/auth/logout"),
  refreshToken: (refreshToken: string) =>
    api.post("/auth/refresh", { refreshToken }),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, password: string) =>
    api.post("/auth/reset-password", { token, password }),
  getMe: () => api.get("/auth/me"),
  getProfile: () => api.get("/auth/me"),
  updateProfile: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  }) => api.patch("/users/me", data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post("/auth/change-password", { currentPassword, newPassword }),
};

// Admin Dashboard API
export const adminApi = {
  getDashboard: () => api.get("/admin/dashboard"),
  getAnalytics: (params?: { startDate?: string; endDate?: string }) =>
    api.get("/admin/analytics", { params }),
  getSalesReport: (params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: string;
  }) => api.get("/admin/reports/sales", { params }),
  getInventoryReport: () => api.get("/admin/reports/inventory"),
  getCustomersReport: () => api.get("/admin/reports/customers"),
};

// Products API
export const productsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    categoryId?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    minPrice?: number;
    maxPrice?: number;
    isActive?: boolean;
    isFeatured?: boolean;
  }) => api.get("/products", { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  getFeatured: (limit?: number) =>
    api.get("/products/featured", { params: { limit } }),
  getLowStock: (threshold?: number) =>
    api.get("/products/low-stock", { params: { threshold } }),
  search: (query: string) =>
    api.get("/products/search", { params: { q: query } }),
  getRelated: (id: string, limit?: number) =>
    api.get(`/products/${id}/related`, { params: { limit } }),
  create: (data: {
    name: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    sku?: string;
    stock: number;
    categoryId?: string;
    images?: string[];
    isActive?: boolean;
    isFeatured?: boolean;
    weight?: number;
    dimensions?: { length?: number; width?: number; height?: number };
    tags?: string[];
    metaTitle?: string;
    metaDescription?: string;
  }) => api.post("/products", data),
  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      compareAtPrice: number;
      sku: string;
      stock: number;
      categoryId: string;
      images: string[];
      isActive: boolean;
      isFeatured: boolean;
      weight: number;
      dimensions: { length?: number; width?: number; height?: number };
      tags: string[];
      metaTitle: string;
      metaDescription: string;
    }>
  ) => api.patch(`/products/${id}`, data),
  updateStock: (id: string, stock: number) =>
    api.patch(`/products/${id}/stock`, { stock }),
  delete: (id: string) => api.delete(`/products/${id}`),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get("/categories/admin/all"),
  getById: (id: string) => api.get(`/categories/${id}`),
  getBySlug: (slug: string) => api.get(`/categories/slug/${slug}`),
  create: (data: {
    name: string;
    description?: string;
    image?: string;
    parentId?: string;
    isActive?: boolean;
  }) => api.post("/categories", data),
  update: (
    id: string,
    data: Partial<{
      name: string;
      description: string;
      image: string;
      parentId: string;
      isActive: boolean;
    }>
  ) => api.patch(`/categories/${id}`, data),
  delete: (id: string) => api.delete(`/categories/${id}`),
};

// Orders API
export const ordersApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get("/orders/all", { params }),
  getById: (id: string) => api.get(`/orders/admin/${id}`),
  getStats: () => api.get("/orders/stats"),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }),
  cancel: (id: string, reason?: string) =>
    api.post(`/orders/${id}/cancel`, { reason }),
};

// Users API
export const usersApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isActive?: boolean;
  }) => api.get("/users", { params }),
  getById: (id: string) => api.get(`/users/${id}`),
  updateStatus: (id: string, isActive: boolean) =>
    api.patch(`/users/${id}/status`, { isActive }),
  updateRole: (id: string, role: string) =>
    api.patch(`/users/${id}/role`, { role }),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Reviews API
export const reviewsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    productId?: string;
    rating?: number;
    isApproved?: boolean;
  }) => api.get("/reviews/all", { params }),
  getByProduct: (
    productId: string,
    params?: { page?: number; limit?: number }
  ) => api.get(`/reviews/product/${productId}`, { params }),
  getProductStats: (productId: string) =>
    api.get(`/reviews/product/${productId}/stats`),
  delete: (id: string) => api.delete(`/reviews/${id}/admin`),
};

// Payments API
export const paymentsApi = {
  refund: (paymentIntentId: string, amount?: number) =>
    api.post("/payments/refund", { paymentIntentId, amount }),
};

export default api;
