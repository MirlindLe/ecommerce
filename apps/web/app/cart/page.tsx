"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore, useAuthStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

export default function CartPage() {
  const { cart, isLoading, updateItem, removeItem } = useCartStore();
  const { isAuthenticated } = useAuthStore();

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
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h1 className="text-2xl font-bold mb-4">Sign in to view your cart</h1>
        <p className="text-gray-500 mb-8">
          Please sign in to add items to your cart and checkout.
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
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 bg-white rounded-lg">
                <div className="w-24 h-24 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!cart?.items?.length) {
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
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <p className="text-gray-500 mb-8">
          Looks like you haven&apos;t added any items yet.
        </p>
        <Link
          href="/products"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart items */}
        <div className="flex-1">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-500">
                    Product
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-gray-500 hidden sm:table-cell">
                    Price
                  </th>
                  <th className="text-left py-4 px-4 font-medium text-gray-500">
                    Quantity
                  </th>
                  <th className="text-right py-4 px-6 font-medium text-gray-500">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {cart.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="relative w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product.images?.[0] ? (
                            <Image
                              src={item.product.images[0]}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <svg
                                className="w-8 h-8"
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
                        </div>
                        <div>
                          <Link
                            href={`/products/${item.product.slug}`}
                            className="font-medium text-gray-900 hover:text-indigo-600 line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-sm text-red-500 hover:text-red-600 mt-1"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <span className="text-gray-900">
                        {formatPrice(item.price)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center border rounded-lg w-fit">
                        <button
                          onClick={() =>
                            updateItem(item.id, Math.max(1, item.quantity - 1))
                          }
                          className="px-3 py-1 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-4 py-1">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          className="px-3 py-1 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <span className="font-medium text-gray-900">
                        {formatPrice(Number(item.price) * item.quantity)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <Link
              href="/products"
              className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order summary */}
        <div className="lg:w-96">
          <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
            <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatPrice(cart.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className="text-green-600">Free</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>Calculated at checkout</span>
              </div>
              <hr />
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span>{formatPrice(cart.total || cart.subtotal || 0)}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="block w-full bg-indigo-600 text-white text-center py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Proceed to Checkout
            </Link>

            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Secure checkout
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
