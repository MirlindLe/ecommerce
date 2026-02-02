import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "./types";
import { authApi } from "./api";

// Auth Store
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (accessToken, refreshToken) => {
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
        } else {
          localStorage.removeItem("accessToken");
        }
        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        } else {
          localStorage.removeItem("refreshToken");
        }
        set({ accessToken, refreshToken });
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(email, password);
          const { user, tokens } = response.data;
          const { accessToken, refreshToken } = tokens;

          // Check if user is admin
          if (user.role !== "ADMIN") {
            throw new Error("Access denied. Admin privileges required.");
          }

          get().setTokens(accessToken, refreshToken);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : (error as { response?: { data?: { message?: string } } })
                  ?.response?.data?.message || "Login failed";
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch {
          // Ignore logout errors
        } finally {
          get().setTokens(null, null);
          set({ user: null, isAuthenticated: false });
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await authApi.getMe();
          const user = response.data;

          // Check if user is admin
          if (user.role !== "ADMIN") {
            get().setTokens(null, null);
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }

          set({ user, isAuthenticated: true, isLoading: false });
        } catch {
          get().setTokens(null, null);
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "admin-auth",
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);

// UI Store
interface UIState {
  sidebarCollapsed: boolean;
  sidebarMobileOpen: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleMobileSidebar: () => void;
  setTheme: (theme: "light" | "dark") => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      sidebarMobileOpen: false,
      theme: "light",

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleMobileSidebar: () =>
        set((state) => ({ sidebarMobileOpen: !state.sidebarMobileOpen })),

      setTheme: (theme) => {
        document.documentElement.classList.remove("light", "dark");
        document.documentElement.classList.add(theme);
        set({ theme });
      },
    }),
    {
      name: "admin-ui",
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
      }),
    }
  )
);

// Notification Store
interface Notification {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationState {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],

  addNotification: (notification) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };

    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto remove after duration
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      }, duration);
    }
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () => set({ notifications: [] }),
}));
