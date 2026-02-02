"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ordersApi } from "@/lib/api";
import { Order } from "@/lib/types";
import { formatPrice } from "@/lib/utils";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      ordersApi
        .getById(orderId)
        .then((res) => setOrder(res.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-2">Thank You!</h1>
        <p className="text-gray-500 mb-6">
          Your order has been placed successfully.
        </p>

        {order && (
          <div className="text-left bg-gray-50 rounded-xl p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-semibold">{order.orderNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-semibold text-indigo-600">
                  {formatPrice(order.total)}
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-500 mb-2">
                Items ({order.items?.length || 0})
              </p>
              <div className="space-y-2">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.product?.name} × {item.quantity}
                    </span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {order.shippingAddress && (
              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-gray-500 mb-2">Shipping Address</p>
                <p className="text-sm">
                  {order.shippingAddress.street}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                  {order.shippingAddress.zipCode}
                  <br />
                  {order.shippingAddress.country}
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={order ? `/account/orders/${order.id}` : "/account/orders"}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
          >
            View Order Details
          </Link>
          <Link
            href="/products"
            className="border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>

      <p className="text-sm text-gray-500 mt-6">
        A confirmation email has been sent to your email address.
      </p>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        }
      >
        <CheckoutSuccessContent />
      </Suspense>
    </div>
  );
}
