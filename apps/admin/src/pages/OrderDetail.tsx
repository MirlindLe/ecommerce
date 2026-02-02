import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ordersApi } from "../lib/api";
import type { Order, OrderStatus } from "../lib/types";
import {
  formatPrice,
  formatDateTime,
  getOrderStatusColor,
  getPaymentStatusColor,
  cn,
} from "../lib/utils";
import { Spinner, Modal } from "../components/UI";
import { useNotificationStore } from "../lib/store";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

// Valid status transitions based on backend validation
const VALID_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

// Get valid next statuses for a given current status
const getValidNextStatuses = (currentStatus: OrderStatus): OrderStatus[] => {
  return VALID_STATUS_TRANSITIONS[currentStatus] || [];
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const fetchOrder = async () => {
      if (!id) return;
      setIsLoading(true);
      try {
        const response = await ordersApi.getById(id);
        setOrder(response.data);
      } catch (error) {
        console.error("Error fetching order:", error);
        addNotification({ type: "error", title: "Failed to load order" });
        navigate("/orders");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id, navigate, addNotification]);

  const handleUpdateStatus = async () => {
    if (!order || !newStatus) return;

    setIsUpdating(true);
    try {
      await ordersApi.updateStatus(order.id, newStatus);
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      addNotification({ type: "success", title: "Order status updated" });
      setIsStatusModalOpen(false);
      setNewStatus("");
      setStatusNote("");
    } catch (error) {
      console.error("Error updating order:", error);
      addNotification({
        type: "error",
        title: "Failed to update order status",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Order not found
        </h2>
        <Link to="/orders" className="text-indigo-600 hover:text-indigo-700">
          Back to Orders
        </Link>
      </div>
    );
  }

  const statusColor = getOrderStatusColor(order.status);
  const paymentStatusColor = getPaymentStatusColor(order.paymentStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-2"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Orders
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            Order {order.orderNumber}
          </h1>
          <p className="text-gray-500 mt-1">
            Placed on {formatDateTime(order.createdAt)}
          </p>
        </div>
        <button
          onClick={() => {
            setNewStatus(order.status);
            setIsStatusModalOpen(true);
          }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Update Status
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Order Status</p>
          <div className="flex items-center gap-2">
            <span className={cn("w-3 h-3 rounded-full", statusColor.dot)} />
            <span className={cn("text-lg font-semibold", statusColor.text)}>
              {order.status}
            </span>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Payment Status</p>
          <span
            className={cn(
              "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
              paymentStatusColor.bg,
              paymentStatusColor.text
            )}
          >
            {order.paymentStatus}
          </span>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500 mb-1">Order Total</p>
          <span className="text-2xl font-bold text-gray-900">
            {formatPrice(order.total)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Order Items</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product?.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
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
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                    <p className="text-sm text-gray-500">
                      {formatPrice(item.price)} × {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatPrice(item.total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="text-gray-900">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-900">
                    {formatPrice(order.tax)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span className="text-gray-900">
                    {formatPrice(order.shipping)}
                  </span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Discount</span>
                    <span className="text-green-600">
                      -{formatPrice(order.discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span>Total</span>
                  <span>{formatPrice(order.total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer & Shipping Info */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Customer</h2>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                  {order.user?.firstName?.charAt(0)}
                  {order.user?.lastName?.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {order.user?.firstName} {order.user?.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{order.user?.email}</p>
                </div>
              </div>
              <Link
                to={`/customers/${order.userId}`}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                View Customer Profile →
              </Link>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Shipping Address</h2>
            </div>
            <div className="p-6">
              <p className="font-medium text-gray-900">
                {order.shippingAddress?.firstName}{" "}
                {order.shippingAddress?.lastName}
              </p>
              {order.shippingAddress?.company && (
                <p className="text-gray-500">{order.shippingAddress.company}</p>
              )}
              <p className="text-gray-500">{order.shippingAddress?.address1}</p>
              {order.shippingAddress?.address2 && (
                <p className="text-gray-500">
                  {order.shippingAddress.address2}
                </p>
              )}
              <p className="text-gray-500">
                {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
                {order.shippingAddress?.postalCode}
              </p>
              <p className="text-gray-500">{order.shippingAddress?.country}</p>
              {order.shippingAddress?.phone && (
                <p className="text-gray-500 mt-2">
                  Phone: {order.shippingAddress.phone}
                </p>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold">Payment</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="text-gray-900">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <span
                  className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                    paymentStatusColor.bg,
                    paymentStatusColor.text
                  )}
                >
                  {order.paymentStatus}
                </span>
              </div>
              {order.paymentIntentId && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment ID</span>
                  <span className="text-gray-900 text-sm font-mono">
                    {order.paymentIntentId.slice(0, 20)}...
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tracking */}
          {order.trackingNumber && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Tracking</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-1">Tracking Number</p>
                <p className="font-medium text-gray-900 font-mono">
                  {order.trackingNumber}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold">Order Notes</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Cancel Reason */}
          {order.cancelReason && (
            <div className="bg-red-50 rounded-xl shadow-sm border border-red-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-red-200">
                <h2 className="text-lg font-semibold text-red-800">
                  Cancellation Reason
                </h2>
              </div>
              <div className="p-6">
                <p className="text-red-700">{order.cancelReason}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Update Order Status"
        footer={
          <>
            <button
              onClick={() => setIsStatusModalOpen(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={isUpdating || !newStatus || newStatus === order.status}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating && <Spinner size="sm" className="text-white" />}
              Update Status
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Status
            </label>
            {getValidNextStatuses(order.status).length > 0 ? (
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Status</option>
                {getValidNextStatuses(order.status).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-sm text-gray-500 italic">
                No further status transitions available for this order.
              </p>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
