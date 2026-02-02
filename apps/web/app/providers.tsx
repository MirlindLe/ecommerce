"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore, useCartStore, useWishlistStore } from "@/lib/store";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { fetchUser, isAuthenticated } = useAuthStore();
  const { fetchCart } = useCartStore();
  const { fetchWishlist } = useWishlistStore();

  // Don't fetch user on auth pages
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname?.startsWith("/auth/");

  useEffect(() => {
    if (!isAuthPage) {
      fetchUser();
    }
  }, [fetchUser, isAuthPage]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
      fetchWishlist();
    }
  }, [isAuthenticated, fetchCart, fetchWishlist]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInitializer>{children}</AuthInitializer>
    </QueryClientProvider>
  );
}
