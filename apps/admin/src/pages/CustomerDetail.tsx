import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { usersApi, ordersApi } from "../lib/api";
import type { User, Order } from "../lib/types";
import {
  formatPrice,
  formatDate,
  formatRelativeTime,
  getInitials,
  cn,
} from "../lib/utils";
import { Spinner, ConfirmDialog } from "../components/UI";
import { useNotificationStore } from "../lib/store";

export default function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    const fetchCustomerData = async () => {
      if (!id) return;

      setIsLoading(true);
      try {
        const [userRes, ordersRes] = await Promise.all([
          usersApi.getById(id),
          ordersApi.getAll({ userId: id, limit: 10 }),
        ]);

        setCustomer(userRes.data);
        setOrders(ordersRes.data.items || ordersRes.data.data || []);
      } catch (error) {
        console.error("Error fetching customer:", error);
        addNotification({
          type: "error",
          title: "Failed to load customer data",
        });
        navigate("/customers");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, [id, navigate, addNotification]);

  const handleToggleStatus = async () => {
    if (!customer) return;

    setIsUpdating(true);
    try {
      await usersApi.updateStatus(customer.id, !customer.isActive);
      setCustomer({ ...customer, isActive: !customer.isActive });
      addNotification({
        type: "success",
        title: `Customer ${customer.isActive ? "deactivated" : "activated"}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      addNotification({ type: "error", title: "Failed to update status" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!customer) return;

    try {
      await usersApi.delete(customer.id);
      addNotification({
        type: "success",
        title: "Customer deleted successfully",
      });
      navigate("/customers");
    } catch (error) {
      console.error("Error deleting customer:", error);
      addNotification({ type: "error", title: "Failed to delete customer" });
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: "bg-green-100 text-green-700",
      DELIVERED: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      PROCESSING: "bg-blue-100 text-blue-700",
      SHIPPED: "bg-purple-100 text-purple-700",
      CANCELLED: "bg-red-100 text-red-700",
      REFUNDED: "bg-gray-100 text-gray-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <p className="text-gray-500 mb-4">Customer not found</p>
        <Link
          to="/customers"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Back to Customers
        </Link>
      </div>
    );
  }

  const totalSpent = orders.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/customers"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Customer Details</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleToggleStatus}
            disabled={isUpdating}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              customer.isActive
                ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            )}
          >
            {customer.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            onClick={() => setIsDeleteOpen(true)}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Profile Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-2xl font-semibold mb-4">
              {customer.avatar ? (
                <img
                  src={customer.avatar}
                  alt={`${customer.firstName} ${customer.lastName}`}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                getInitials(customer.firstName, customer.lastName)
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h2>
            <p className="text-gray-500 mb-3">{customer.email}</p>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  customer.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                )}
              >
                {customer.isActive ? "Active" : "Inactive"}
              </span>
              <span
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  customer.role === "ADMIN"
                    ? "bg-indigo-100 text-indigo-700"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {customer.role}
              </span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
            {customer.phone && (
              <div className="flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <span className="text-gray-600">{customer.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-gray-600">
                Joined {formatDate(customer.createdAt)}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-gray-600">
                Last active{" "}
                {formatRelativeTime(customer.updatedAt || customer.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Stats and Orders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.length}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">Total Spent</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(totalSpent)}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm text-gray-500 mb-1">Avg. Order</p>
              <p className="text-2xl font-bold text-gray-900">
                {orders.length > 0
                  ? formatPrice(totalSpent / orders.length)
                  : "$0.00"}
              </p>
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Orders
              </h3>
              <Link
                to={`/orders?userId=${customer.id}`}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View All
              </Link>
            </div>

            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <svg
                  className="w-12 h-12 text-gray-300 mx-auto mb-3"
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
                <p className="text-gray-500">No orders yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">
                        Order
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">
                        Date
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">
                        Total
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Link
                            to={`/orders/${order.id}`}
                            className="font-medium text-indigo-600 hover:text-indigo-700"
                          >
                            {order.orderNumber}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={cn(
                              "px-2.5 py-1 rounded-full text-xs font-medium",
                              getStatusBadge(order.status)
                            )}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">
                          {formatPrice(Number(order.total))}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/orders/${order.id}`}
                            className="text-gray-500 hover:text-indigo-600"
                          >
                            <svg
                              className="w-5 h-5 inline"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Addresses */}
          {customer.addresses && customer.addresses.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">
                  Addresses
                </h3>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                {customer.addresses.map((address, index) => (
                  <div
                    key={address.id || index}
                    className={cn(
                      "p-4 rounded-lg border",
                      address.isDefault
                        ? "border-indigo-200 bg-indigo-50"
                        : "border-gray-200 bg-gray-50"
                    )}
                  >
                    {address.isDefault && (
                      <span className="inline-block px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded mb-2">
                        Default
                      </span>
                    )}
                    <p className="font-medium text-gray-900">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {address.street}
                      {address.apartment && `, ${address.apartment}`}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {address.city}, {address.state} {address.postalCode}
                    </p>
                    <p className="text-gray-600 text-sm">{address.country}</p>
                    {address.phone && (
                      <p className="text-gray-500 text-sm mt-1">
                        {address.phone}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Customer"
        message={`Are you sure you want to delete "${customer.firstName} ${customer.lastName}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
