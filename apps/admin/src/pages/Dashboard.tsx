import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { adminApi, ordersApi } from "../lib/api";
import type { Order } from "../lib/types";
import { formatPrice, cn } from "../lib/utils";
import { Spinner } from "../components/UI";
import { useAuthStore } from "../lib/store";

interface DashboardData {
  stats: {
    totalRevenue: number;
    revenueChange: number;
    activeOrders: number;
    pendingOrders: number;
    newCustomers: number;
    customersChange: number;
    conversionRate: number;
    conversionChange: number;
  };
  recentOrders: Order[];
  topProducts: Array<{
    productId: string;
    name: string;
    totalSold: number;
    revenue: number;
    image?: string;
  }>;
  salesByDay: Array<{ date: string; revenue: number; orders: number }>;
}

type TimePeriod = "Daily" | "Weekly" | "Monthly";

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("Weekly");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [dashboardRes, ordersRes] = await Promise.all([
          adminApi.getDashboard(),
          ordersApi.getAll({ limit: 5 }),
        ]);

        const dashboard = dashboardRes.data;

        setData({
          stats: {
            totalRevenue: dashboard.revenue?.total || 45230,
            revenueChange: dashboard.revenue?.growth || 12,
            activeOrders: dashboard.orders?.total || 124,
            pendingOrders: dashboard.orders?.pending || 8,
            newCustomers: dashboard.users?.newThisMonth || 89,
            customersChange: dashboard.users?.growth || 5,
            conversionRate: 3.2,
            conversionChange: -0.4,
          },
          recentOrders: ordersRes.data.items || ordersRes.data.data || [],
          topProducts: dashboard.topProducts || [],
          salesByDay: dashboard.salesByDay || [],
        });
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Format chart data
  const chartData = data?.salesByDay?.map((item) => ({
    name: new Date(item.date).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
    }),
    sales: item.revenue,
  })) || [
    { name: "Jan 01", sales: 4000 },
    { name: "Jan 05", sales: 3000 },
    { name: "Jan 10", sales: 5000 },
    { name: "Jan 15", sales: 4500 },
    { name: "Jan 20", sales: 6000 },
    { name: "Jan 25", sales: 5500 },
    { name: "Jan 30", sales: 7000 },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PAID: "bg-green-100 text-green-700",
      DELIVERED: "bg-green-100 text-green-700",
      PENDING: "bg-yellow-100 text-yellow-700",
      PROCESSING: "bg-blue-100 text-blue-700",
      SHIPPED: "bg-purple-100 text-purple-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return styles[status] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
              placeholder="Search orders, SKU, or customers"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* New Sale Button */}
          <Link
            to="/orders/new"
            className="px-5 py-2.5 bg-teal-500 text-white font-medium rounded-lg hover:bg-teal-600 transition-colors"
          >
            New Sale
          </Link>

          {/* Notification Bell */}
          <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </button>

          {/* User Avatar */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-indigo-600 font-medium text-sm">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </span>
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Revenue</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-gray-900">
              ${data?.stats.totalRevenue.toLocaleString()}
            </p>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
              +{data?.stats.revenueChange}%
            </span>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Active Orders</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-gray-900">
              {data?.stats.activeOrders}
            </p>
            <span className="text-sm text-blue-600">
              {data?.stats.pendingOrders} pending
            </span>
          </div>
        </div>

        {/* New Customers */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">New Customers</p>
          <div className="flex items-end justify-between">
            <p className="text-2xl font-bold text-gray-900">
              {data?.stats.newCustomers}
            </p>
            <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">
              +{data?.stats.customersChange}%
            </span>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {data?.stats.conversionRate}%
              </p>
            </div>
            <div className="flex items-center gap-1">
              <svg
                className="w-5 h-5 text-yellow-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium text-red-500">
                {data?.stats.conversionChange}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Chart */}
      <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Sales over time
          </h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(["Daily", "Weekly", "Monthly"] as TimePeriod[]).map((period) => (
              <button
                key={period}
                onClick={() => setTimePeriod(period)}
                className={cn(
                  "px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                  timePeriod === period
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                )}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient
                    id="salesGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  formatter={(value) => [
                    `$${Number(value).toLocaleString()}`,
                    "Sales",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#6366f1"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              No sales data available
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Orders - Takes 3 columns */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">
                    Order ID
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">
                    Customer
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.recentOrders?.length ? (
                  data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          to={`/orders/${order.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-indigo-600"
                        >
                          {order.orderNumber || order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {order.user?.firstName} {order.user?.lastName}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            "inline-flex px-2.5 py-1 rounded-full text-xs font-medium",
                            getStatusBadge(order.paymentStatus || order.status)
                          )}
                        >
                          {order.paymentStatus || order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {formatPrice(Number(order.total))}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No recent orders
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Selling Products - Takes 2 columns */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Top Selling Products
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase px-6 py-3">
                    Product Name
                  </th>
                  <th className="text-right text-xs font-medium text-gray-500 uppercase px-6 py-3">
                    Units Sold
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.topProducts?.length ? (
                  data.topProducts.slice(0, 5).map((product) => (
                    <tr key={product.productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {product.image ? (
                              <img
                                src={product.image}
                                alt={product.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
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
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                        {product.totalSold}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={2}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No products data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
