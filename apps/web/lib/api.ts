import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't try to refresh for auth endpoints
    const isAuthEndpoint = originalRequest.url?.includes("/auth/");

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        // Only redirect if not already on login/register pages
        if (typeof window !== "undefined") {
          const currentPath = window.location.pathname;
          if (
            !currentPath.includes("/login") &&
            !currentPath.includes("/register")
          ) {
            window.location.href = "/login";
          }
        }
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  forgotPassword: (email: string) =>
    api.post("/auth/forgot-password", { email }),
  resetPassword: (data: { token: string; password: string }) =>
    api.post("/auth/reset-password", data),
  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),
};

// Products API
export const productsApi = {
  getAll: (params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => api.get("/products", { params }),
  getById: (id: string) => api.get(`/products/${id}`),
  getBySlug: (slug: string) => api.get(`/products/slug/${slug}`),
  getFeatured: () => api.get("/products/featured"),
  getRelated: (id: string) => api.get(`/products/${id}/related`),
  search: (query: string) =>
    api.get("/products/search", { params: { q: query } }),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get("/categories"),
  getById: (id: string) => api.get(`/categories/${id}`),
  getBySlug: (slug: string) => api.get(`/categories/slug/${slug}`),
};

// Cart API
export const cartApi = {
  get: () => api.get("/cart"),
  addItem: (data: { productId: string; quantity: number }) =>
    api.post("/cart/items", data),
  updateItem: (itemId: string, quantity: number) =>
    api.patch(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete("/cart"),
};

// Orders API
export const ordersApi = {
  getAll: () => api.get("/orders"),
  getById: (id: string) => api.get(`/orders/${id}`),
  create: (data: { addressId: string; notes?: string }) =>
    api.post("/orders", data),
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
};

// Payments API
export const paymentsApi = {
  createIntent: (orderId: string) =>
    api.post("/payments/create-intent", { orderId }),
  confirmPayment: (paymentIntentId: string) =>
    api.get(`/payments/confirm/${paymentIntentId}`),
  getMethods: () => api.get("/payments/methods"),
};

// Users API
export const usersApi = {
  getProfile: () => api.get("/users/profile"),
  updateProfile: (data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) => api.patch("/users/profile", data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post("/users/change-password", data),
  getAddresses: () => api.get("/users/addresses"),
  addAddress: (data: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    isDefault?: boolean;
  }) => api.post("/users/addresses", data),
  updateAddress: (
    addressId: string,
    data: Partial<{
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
      isDefault?: boolean;
    }>
  ) => api.patch(`/users/addresses/${addressId}`, data),
  deleteAddress: (addressId: string) =>
    api.delete(`/users/addresses/${addressId}`),
  setDefaultAddress: (addressId: string) =>
    api.patch(`/users/addresses/${addressId}/default`),
  getOrders: () => api.get("/users/orders"),
};

// Reviews API
export const reviewsApi = {
  getByProduct: (productId: string) => api.get(`/reviews/product/${productId}`),
  getStats: (productId: string) =>
    api.get(`/reviews/product/${productId}/stats`),
  getMyReviews: () => api.get("/reviews/my-reviews"),
  create: (data: { productId: string; rating: number; comment?: string }) =>
    api.post("/reviews", data),
  update: (id: string, data: { rating?: number; comment?: string }) =>
    api.patch(`/reviews/${id}`, data),
  delete: (id: string) => api.delete(`/reviews/${id}`),
};

// Wishlist API
export const wishlistApi = {
  get: () => api.get("/wishlist"),
  add: (productId: string) => api.post("/wishlist", { productId }),
  remove: (productId: string) => api.delete(`/wishlist/${productId}`),
  check: (productId: string) => api.get(`/wishlist/check/${productId}`),
  moveToCart: (productId: string) =>
    api.post(`/wishlist/${productId}/move-to-cart`),
  clear: () => api.delete("/wishlist"),
};

export default api;
