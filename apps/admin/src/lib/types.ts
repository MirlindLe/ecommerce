// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "USER" | "ADMIN";
  isActive: boolean;
  isEmailVerified: boolean;
  avatar?: string;
  phone?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    orders?: number;
    reviews?: number;
  };
}

// Product types
export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  sku?: string;
  stock: number;
  images: string[];
  categoryId?: string;
  category?: Category;
  isActive: boolean;
  isFeatured: boolean;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  tags: string[];
  metaTitle?: string;
  metaDescription?: string;
  avgRating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt: string;
}

// Category types
export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  isActive: boolean;
  _count?: {
    products?: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Order types
export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  user: User;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress?: Address;
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  paymentIntentId?: string;
  notes?: string;
  trackingNumber?: string;
  cancelReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export type OrderStatus =
  | "PENDING"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED"
  | "REFUNDED";

export type PaymentStatus =
  | "PENDING"
  | "PAID"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

// Address types
export interface Address {
  id?: string;
  firstName: string;
  lastName: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone?: string;
  isDefault?: boolean;
}

// Review types
export interface Review {
  id: string;
  userId: string;
  user: User;
  productId: string;
  product: Product;
  rating: number;
  title?: string;
  comment?: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

// Dashboard types
export interface DashboardStats {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  totalCustomers: number;
  customersChange: number;
  totalProducts: number;
  productsChange: number;
  recentOrders: Order[];
  topProducts: Array<{
    product: Product;
    totalSold: number;
    revenue: number;
  }>;
  lowStockProducts: Product[];
  salesByDay: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
  }>;
}

export interface Analytics {
  revenue: {
    total: number;
    byMonth: Array<{
      month: string;
      revenue: number;
    }>;
    byCategory: Array<{
      category: string;
      revenue: number;
    }>;
  };
  orders: {
    total: number;
    byStatus: Array<{
      status: string;
      count: number;
    }>;
    averageValue: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    returningRate: number;
  };
  products: {
    total: number;
    outOfStock: number;
    lowStock: number;
    topSelling: Array<{
      product: Product;
      sold: number;
    }>;
  };
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items?: T[];
  data?: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Form types
export interface ProductFormData {
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
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  tags: string[];
  metaTitle: string;
  metaDescription: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
  image: string;
  parentId: string;
  isActive: boolean;
}

// Filter types
export interface ProductFilters {
  search: string;
  categoryId: string;
  isActive: string;
  isFeatured: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface OrderFilters {
  status: string;
  startDate: string;
  endDate: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}

export interface UserFilters {
  search: string;
  role: string;
  isActive: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
}
