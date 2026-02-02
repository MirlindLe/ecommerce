import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, Cart, CartItem, WishlistItem } from "./types";
import { authApi, cartApi, wishlistApi } from "./api";

// Auth Store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login({ email, password });
          const { tokens, user } = response.data;
          const { accessToken, refreshToken } = tokens;
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          await authApi.register(data);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore errors
        } finally {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          set({ user: null, isAuthenticated: false });
        }
      },

      fetchUser: async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          set({ user: null, isAuthenticated: false });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.me();
          set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      setUser: (user) => set({ user, isAuthenticated: !!user }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Cart Store
interface CartState {
  cart: Cart | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity: number) => Promise<void>;
  updateItem: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  itemCount: number;
}

export const useCartStore = create<CartState>()((set, get) => ({
  cart: null,
  isLoading: false,
  itemCount: 0,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const response = await cartApi.get();
      const cart = response.data;
      set({
        cart,
        isLoading: false,
        itemCount:
          cart?.items?.reduce(
            (sum: number, item: CartItem) => sum + item.quantity,
            0
          ) || 0,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId: string, quantity: number) => {
    set({ isLoading: true });
    try {
      await cartApi.addItem({ productId, quantity });
      await get().fetchCart();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateItem: async (itemId: string, quantity: number) => {
    set({ isLoading: true });
    try {
      await cartApi.updateItem(itemId, quantity);
      await get().fetchCart();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeItem: async (itemId: string) => {
    set({ isLoading: true });
    try {
      await cartApi.removeItem(itemId);
      await get().fetchCart();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  clearCart: async () => {
    set({ isLoading: true });
    try {
      await cartApi.clear();
      set({ cart: null, isLoading: false, itemCount: 0 });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

// Wishlist Store
interface WishlistState {
  items: WishlistItem[];
  isLoading: boolean;
  itemCount: number;
  fetchWishlist: () => Promise<void>;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  moveToCart: (productId: string) => Promise<void>;
}

export const useWishlistStore = create<WishlistState>()((set, get) => ({
  items: [],
  isLoading: false,
  itemCount: 0,

  fetchWishlist: async () => {
    set({ isLoading: true });
    try {
      const response = await wishlistApi.get();
      const items = response.data.items || [];
      set({ items, isLoading: false, itemCount: items.length });
    } catch {
      set({ items: [], isLoading: false, itemCount: 0 });
    }
  },

  addItem: async (productId: string) => {
    set({ isLoading: true });
    try {
      await wishlistApi.add(productId);
      await get().fetchWishlist();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  removeItem: async (productId: string) => {
    set({ isLoading: true });
    try {
      await wishlistApi.remove(productId);
      await get().fetchWishlist();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  isInWishlist: (productId: string) => {
    const items = get().items;
    return (
      Array.isArray(items) &&
      items.some((item) => item.product?.id === productId)
    );
  },

  moveToCart: async (productId: string) => {
    set({ isLoading: true });
    try {
      await wishlistApi.moveToCart(productId);
      await get().fetchWishlist();
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

// UI Store
interface UIState {
  isCartOpen: boolean;
  isMobileMenuOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  openMobileMenu: () => void;
  closeMobileMenu: () => void;
  toggleMobileMenu: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isCartOpen: false,
  isMobileMenuOpen: false,

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),

  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  toggleMobileMenu: () =>
    set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
}));
