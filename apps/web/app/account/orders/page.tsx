"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ordersApi } from "@/lib/api";
import { Order } from "@/lib/types";
import {
  formatPrice,
  formatDate,
  getOrderStatusColor,
  getPaymentStatusColor,
} from "@/lib/utils";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ordersApi
      .getAll()
      .then((res) => setOrders(res.data.orders || res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <svg
          className="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <h2 className="text-lg font-semibold mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-4">
          Start shopping to see your orders here.
        </p>
        <Link
          href="/products"
          className="inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Order History</h2>
      </div>

      <div className="divide-y">
        {orders.map((order) => (
          <div
            key={order.id}
            className="p-6 hover:bg-gray-50 transition-colors"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <p className="font-medium">{order.orderNumber}</p>
                <p className="text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}
                >
                  {order.status}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}
                >
                  {order.paymentStatus}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 mb-4">
              {order.items?.slice(0, 3).map((item) => (
                <div key={item.id} className="text-sm text-gray-600">
                  {item.product?.name} × {item.quantity}
                </div>
              ))}
              {order.items && order.items.length > 3 && (
                <span className="text-sm text-gray-500">
                  +{order.items.length - 3} more
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <p className="font-semibold text-indigo-600">
                {formatPrice(order.total)}
              </p>
              <Link
                href={`/account/orders/${order.id}`}
                className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                View Details →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
