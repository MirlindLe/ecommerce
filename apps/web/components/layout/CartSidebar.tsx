"use client";

import Link from "next/link";
import Image from "next/image";
import { useCartStore, useUIStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

export function CartSidebar() {
  const { cart, isLoading, updateItem, removeItem } = useCartStore();
  const { isCartOpen, closeCart } = useUIStore();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={closeCart} />

      {/* Sidebar */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Shopping Cart</h2>
          <button
            onClick={closeCart}
            className="p-2 hover:bg-gray-100 rounded-lg"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : !cart?.items?.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg
                className="w-16 h-16 text-gray-300 mb-4"
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
              <p className="text-gray-500 mb-4">Your cart is empty</p>
              <button
                onClick={closeCart}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-4 pb-4 border-b">
                  <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="text-sm font-medium text-gray-900 hover:text-indigo-600 line-clamp-2"
                      onClick={closeCart}
                    >
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-indigo-600 font-medium mt-1">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border rounded">
                        <button
                          onClick={() =>
                            updateItem(item.id, Math.max(1, item.quantity - 1))
                          }
                          className="px-2 py-1 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          className="px-2 py-1 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart?.items?.length ? (
          <div className="border-t p-6 space-y-4">
            <div className="flex justify-between text-base font-medium">
              <span>Subtotal</span>
              <span>{formatPrice(cart.subtotal || 0)}</span>
            </div>
            <p className="text-sm text-gray-500">
              Shipping and taxes calculated at checkout.
            </p>
            <Link
              href="/checkout"
              onClick={closeCart}
              className="block w-full bg-indigo-600 text-white text-center py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Checkout
            </Link>
            <Link
              href="/cart"
              onClick={closeCart}
              className="block w-full text-center py-3 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View Cart
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
