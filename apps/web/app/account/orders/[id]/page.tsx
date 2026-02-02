"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import Image from "next/image";
import { ordersApi } from "@/lib/api";
import { Order } from "@/lib/types";
import {
  formatPrice,
  formatDateTime,
  getOrderStatusColor,
  getPaymentStatusColor,
} from "@/lib/utils";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    ordersApi
      .getById(id)
      .then((res) => setOrder(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancelOrder = async () => {
    if (!order || !confirm("Are you sure you want to cancel this order?"))
      return;

    setCancelling(true);
    try {
      const response = await ordersApi.cancel(order.id);
      setOrder(response.data);
    } catch (error) {
      console.error("Failed to cancel order:", error);
      alert("Failed to cancel order. Please try again.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-8 text-center">
        <h2 className="text-lg font-semibold mb-2">Order not found</h2>
        <Link
          href="/account/orders"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Link
              href="/account/orders"
              className="text-indigo-600 hover:text-indigo-700 text-sm font-medium mb-2 inline-block"
            >
              ← Back to Orders
            </Link>
            <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
            <p className="text-gray-500">{formatDateTime(order.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getOrderStatusColor(order.status)}`}
            >
              {order.status}
            </span>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getPaymentStatusColor(order.paymentStatus)}`}
            >
              {order.paymentStatus}
            </span>
          </div>
        </div>

        {order.status === "PENDING" && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Order Items</h2>
        </div>
        <div className="divide-y">
          {order.items?.map((item) => {
            const images = Array.isArray(item.product?.images)
              ? item.product.images
              : [];
            const imageUrl =
              images[0] &&
              typeof images[0] === "string" &&
              images[0].startsWith("http")
                ? images[0]
                : null;

            return (
              <div key={item.id} className="p-6 flex gap-4">
                <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.product?.name || "Product"}
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
                <div className="flex-1">
                  <Link
                    href={`/products/${item.product?.slug}`}
                    className="font-medium text-gray-900 hover:text-indigo-600"
                  >
                    {item.product?.name}
                  </Link>
                  <p className="text-sm text-gray-500">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-sm text-gray-500">
                    Price: {formatPrice(item.price)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    {formatPrice(Number(item.price) * item.quantity)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary & Address */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
          <div className="space-y-3">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{formatPrice(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax</span>
              <span>{formatPrice(order.tax)}</span>
            </div>
            <hr />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total</span>
              <span className="text-indigo-600">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Shipping Address</h2>
          {order.shippingAddress ? (
            <div className="text-gray-600">
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.zipCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          ) : (
            <p className="text-gray-500">No shipping address</p>
          )}
        </div>
      </div>
    </div>
  );
}
