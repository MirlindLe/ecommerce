import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ordersApi } from "../lib/api";
import type { Order, PaginatedResponse, OrderStatus } from "../lib/types";
import {
  formatPrice,
  formatDate,
  formatRelativeTime,
  getOrderStatusColor,
  cn,
} from "../lib/utils";
import { Spinner, Pagination, Modal } from "../components/UI";
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

export default function OrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { addNotification } = useNotificationStore();

  const page = Number(searchParams.get("page")) || 1;
  const status = searchParams.get("status") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const response = await ordersApi.getAll({
          page,
          limit: 10,
          status: status || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        });

        const data = response.data as PaginatedResponse<Order>;
        setOrders(data.items || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalItems(data.meta?.total || 0);
      } catch (error) {
        console.error("Error fetching orders:", error);
        addNotification({ type: "error", title: "Failed to load orders" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [page, status, startDate, endDate, addNotification]);

  const updateParams = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    if (!updates.page) {
      params.delete("page");
    }
    setSearchParams(params);
  };

  const openStatusModal = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNote("");
  };

  const closeStatusModal = () => {
    setSelectedOrder(null);
    setNewStatus("");
    setStatusNote("");
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    setIsUpdating(true);
    try {
      await ordersApi.updateStatus(selectedOrder.id, newStatus);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === selectedOrder.id ? { ...o, status: newStatus } : o
        )
      );
      addNotification({ type: "success", title: "Order status updated" });
      closeStatusModal();
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={startDate}
            onChange={(e) => updateParams({ startDate: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={endDate}
            onChange={(e) => updateParams({ endDate: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="End Date"
          />

          <button
            onClick={() => setSearchParams(new URLSearchParams())}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 text-gray-400 mx-auto mb-4"
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No orders found
            </h3>
            <p className="text-gray-500">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Order
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Customer
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Items
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Total
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Payment
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Date
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map((order) => {
                    const statusColor = getOrderStatusColor(order.status);
                    return (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="py-4 px-4">
                          <Link
                            to={`/orders/${order.id}`}
                            className="font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {order.user?.firstName} {order.user?.lastName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.user?.email}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">
                          {order.items?.length || 0} items
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900">
                            {formatPrice(order.total)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => openStatusModal(order)}
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                              statusColor.bg,
                              statusColor.text
                            )}
                          >
                            <span
                              className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                statusColor.dot
                              )}
                            />
                            {order.status}
                          </button>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={cn(
                              "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                              order.paymentStatus === "PAID"
                                ? "bg-green-100 text-green-700"
                                : order.paymentStatus === "FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            )}
                          >
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="text-gray-900">
                              {formatDate(order.createdAt)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatRelativeTime(order.createdAt)}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              to={`/orders/${order.id}`}
                              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title="View Details"
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
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 10 + 1} to{" "}
                {Math.min(page * 10, totalItems)} of {totalItems} orders
              </p>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={(newPage) =>
                  updateParams({ page: newPage.toString() })
                }
              />
            </div>
          </>
        )}
      </div>

      {/* Update Status Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={closeStatusModal}
        title="Update Order Status"
        footer={
          <>
            <button
              onClick={closeStatusModal}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateStatus}
              disabled={
                isUpdating || !newStatus || newStatus === selectedOrder?.status
              }
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
            <p className="text-sm text-gray-500 mb-2">
              Order:{" "}
              <span className="font-medium text-gray-900">
                {selectedOrder?.orderNumber}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Current Status:{" "}
              <span className="font-medium text-gray-900">
                {selectedOrder?.status}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Status
            </label>
            {selectedOrder &&
            getValidNextStatuses(selectedOrder.status).length > 0 ? (
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select Status</option>
                {getValidNextStatuses(selectedOrder.status).map((s) => (
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
