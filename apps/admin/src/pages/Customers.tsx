import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usersApi } from "../lib/api";
import type { User, PaginatedResponse } from "../lib/types";
import { formatDate, formatRelativeTime, getInitials, cn } from "../lib/utils";
import { Spinner, Pagination, ConfirmDialog, Modal } from "../components/UI";
import { useNotificationStore } from "../lib/store";

export default function CustomersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const { addNotification } = useNotificationStore();

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const isActive = searchParams.get("isActive") || "";

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await usersApi.getAll({
          page,
          limit: 10,
          search: search || undefined,
          role: role || undefined,
          isActive: isActive ? isActive === "true" : undefined,
        });

        const data = response.data as PaginatedResponse<User>;
        setUsers(data.data || data.items || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalItems(data.meta?.total || 0);
      } catch (error) {
        console.error("Error fetching users:", error);
        addNotification({ type: "error", title: "Failed to load customers" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [page, search, role, isActive, addNotification]);

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

  const handleToggleStatus = async (user: User) => {
    try {
      await usersApi.updateStatus(user.id, !user.isActive);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isActive: !u.isActive } : u
        )
      );
      addNotification({
        type: "success",
        title: `User ${user.isActive ? "deactivated" : "activated"}`,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      addNotification({ type: "error", title: "Failed to update user status" });
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !newRole) return;

    setIsUpdating(true);
    try {
      await usersApi.updateRole(selectedUser.id, newRole);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === selectedUser.id ? { ...u, role: newRole as User["role"] } : u
        )
      );
      addNotification({ type: "success", title: "User role updated" });
      setSelectedUser(null);
      setNewRole("");
    } catch (error) {
      console.error("Error updating role:", error);
      addNotification({ type: "error", title: "Failed to update user role" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;

    try {
      await usersApi.delete(deleteUser.id);
      addNotification({ type: "success", title: "User deleted successfully" });
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser.id));
    } catch (error) {
      console.error("Error deleting user:", error);
      addNotification({ type: "error", title: "Failed to delete user" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => updateParams({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <select
            value={role}
            onChange={(e) => updateParams({ role: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>

          <select
            value={isActive}
            onChange={(e) => updateParams({ isActive: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <button
            onClick={() => setSearchParams(new URLSearchParams())}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : users.length === 0 ? (
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
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No customers found
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
                      Customer
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Role
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Orders
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Joined
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium">
                            {user.avatar ? (
                              <img
                                src={user.avatar}
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              getInitials(user.firstName, user.lastName)
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/customers/${user.id}`}
                              className="font-medium text-gray-900 hover:text-indigo-600"
                            >
                              {user.firstName} {user.lastName}
                            </Link>
                            <p className="text-sm text-gray-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewRole(user.role);
                          }}
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                            user.role === "ADMIN"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {user.role}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {user._count?.orders || 0} orders
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                            user.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          )}
                        >
                          {user.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="text-gray-900">
                            {formatDate(user.createdAt)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatRelativeTime(user.createdAt)}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/customers/${user.id}`}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View"
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
                          <button
                            onClick={() => setDeleteUser(user)}
                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Delete"
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
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 10 + 1} to{" "}
                {Math.min(page * 10, totalItems)} of {totalItems} customers
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

      {/* Update Role Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => {
          setSelectedUser(null);
          setNewRole("");
        }}
        title="Update User Role"
        footer={
          <>
            <button
              onClick={() => {
                setSelectedUser(null);
                setNewRole("");
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateRole}
              disabled={
                isUpdating || !newRole || newRole === selectedUser?.role
              }
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isUpdating && <Spinner size="sm" className="text-white" />}
              Update Role
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500 mb-2">
              User:{" "}
              <span className="font-medium text-gray-900">
                {selectedUser?.firstName} {selectedUser?.lastName}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              Current Role:{" "}
              <span className="font-medium text-gray-900">
                {selectedUser?.role}
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="USER">User</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteUser?.firstName} ${deleteUser?.lastName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
