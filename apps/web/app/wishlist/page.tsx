"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlistStore, useCartStore, useAuthStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore();
  const { items, isLoading, removeItem, moveToCart } = useWishlistStore();
  const { addItem, fetchCart } = useCartStore();

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <svg
          className="w-20 h-20 text-gray-300 mx-auto mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <h1 className="text-2xl font-bold mb-4">
          Sign in to view your wishlist
        </h1>
        <p className="text-gray-500 mb-8">
          Please sign in to save items to your wishlist.
        </p>
        <Link
          href="/login"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-sm"
              >
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-6 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <svg
          className="w-20 h-20 text-gray-300 mx-auto mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
        <h1 className="text-2xl font-bold mb-4">Your wishlist is empty</h1>
        <p className="text-gray-500 mb-8">
          Save items you love to your wishlist.
        </p>
        <Link
          href="/products"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  const handleMoveToCart = async (productId: string) => {
    try {
      await moveToCart(productId);
      await fetchCart(); // Refresh cart state
    } catch {
      // Fallback: add to cart and remove from wishlist
      await addItem(productId, 1);
      await removeItem(productId);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">
        My Wishlist ({items.length} items)
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-xl overflow-hidden shadow-sm"
          >
            <Link href={`/products/${item.product.slug}`}>
              <div className="relative aspect-square bg-gray-100 overflow-hidden">
                {item.product.images?.[0] &&
                item.product.images[0].startsWith("http") ? (
                  <Image
                    src={item.product.images[0]}
                    alt={item.product.name}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-16 h-16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                {item.product.stock === 0 && (
                  <span className="absolute top-2 left-2 bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded">
                    Out of Stock
                  </span>
                )}
              </div>
            </Link>

            <div className="p-4">
              <Link href={`/products/${item.product.slug}`}>
                <h3 className="font-medium text-gray-900 hover:text-indigo-600 transition-colors line-clamp-2 min-h-[2.5rem]">
                  {item.product.name}
                </h3>
              </Link>

              <div className="mt-2 flex items-center gap-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(item.product.price)}
                </span>
                {item.product.compareAtPrice &&
                  item.product.compareAtPrice > item.product.price && (
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(item.product.compareAtPrice)}
                    </span>
                  )}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => handleMoveToCart(item.product.id)}
                  disabled={item.product.stock === 0}
                  className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {item.product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
