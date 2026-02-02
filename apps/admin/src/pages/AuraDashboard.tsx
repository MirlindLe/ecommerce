import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../lib/store";
import { cn } from "../lib/utils";

// Types
interface KPICardProps {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
}

interface Order {
  id: string;
  customer: string;
  email: string;
  status: "Paid" | "Pending" | "Shipped" | "Cancelled";
  amount: number;
  date: string;
}

interface TopProduct {
  id: string;
  name: string;
  image: string;
  units: number;
  revenue: number;
}

// Navigation items
const primaryNavItems = [
  { name: "Dashboard", href: "/", icon: DashboardIcon },
  { name: "Orders", href: "/orders", icon: OrdersIcon },
  { name: "Products", href: "/products", icon: ProductsIcon },
  { name: "Customers", href: "/customers", icon: CustomersIcon },
  { name: "Analytics", href: "/analytics", icon: AnalyticsIcon },
];

// Mock data
const recentOrders: Order[] = [
  {
    id: "ORD-7352",
    customer: "Sarah Johnson",
    email: "sarah@example.com",
    status: "Paid",
    amount: 245.99,
    date: "2 min ago",
  },
  {
    id: "ORD-7351",
    customer: "Michael Chen",
    email: "michael@example.com",
    status: "Shipped",
    amount: 189.5,
    date: "15 min ago",
  },
  {
    id: "ORD-7350",
    customer: "Emily Davis",
    email: "emily@example.com",
    status: "Pending",
    amount: 432.0,
    date: "1 hour ago",
  },
  {
    id: "ORD-7349",
    customer: "James Wilson",
    email: "james@example.com",
    status: "Paid",
    amount: 78.25,
    date: "2 hours ago",
  },
  {
    id: "ORD-7348",
    customer: "Anna Martinez",
    email: "anna@example.com",
    status: "Cancelled",
    amount: 156.8,
    date: "3 hours ago",
  },
];

const topProducts: TopProduct[] = [
  {
    id: "1",
    name: "Wireless Earbuds Pro",
    image: "/placeholder.jpg",
    units: 234,
    revenue: 23400,
  },
  {
    id: "2",
    name: "Smart Watch Series X",
    image: "/placeholder.jpg",
    units: 186,
    revenue: 37200,
  },
  {
    id: "3",
    name: "Premium Leather Bag",
    image: "/placeholder.jpg",
    units: 145,
    revenue: 14500,
  },
  {
    id: "4",
    name: "Minimalist Desk Lamp",
    image: "/placeholder.jpg",
    units: 128,
    revenue: 6400,
  },
];

// Icon Components
function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 5a1 1 0 011-1h4a1 1 0 011 1v5a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 12a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1h-4a1 1 0 01-1-1v-7z"
      />
    </svg>
  );
}

function OrdersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
      />
    </svg>
  );
}

function ProductsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
      />
    </svg>
  );
}

function CustomersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  );
}

function AnalyticsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

// KPI Card Component
function KPICard({ title, value, change, changeLabel, icon }: KPICardProps) {
  const isPositive = change >= 0;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {value}
          </p>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                isPositive
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              )}
            >
              {isPositive ? (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 10l7-7m0 0l7 7m-7-7v18"
                  />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              )}
              {Math.abs(change)}%
            </span>
            <span className="text-xs text-gray-500">{changeLabel}</span>
          </div>
        </div>
        <div className="p-3 bg-purple-50 rounded-xl">{icon}</div>
      </div>
    </div>
  );
}

// Status Badge Component
function StatusBadge({ status }: { status: Order["status"] }) {
  const styles = {
    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Shipped: "bg-blue-50 text-blue-700 border-blue-200",
    Cancelled: "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}

// Area Chart Placeholder
function AreaChartPlaceholder() {
  return (
    <div className="h-64 flex items-end justify-between gap-2 px-4">
      {[40, 65, 45, 80, 55, 75, 90, 60, 85, 70, 95, 80].map((height, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t-sm opacity-80"
            style={{ height: `${height}%` }}
          />
          <span className="text-[10px] text-gray-400">
            {
              [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
              ][i]
            }
          </span>
        </div>
      ))}
    </div>
  );
}

// Main Dashboard Component
export default function AuraDashboard() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<
    "Daily" | "Weekly" | "Monthly"
  >("Monthly");
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-gray-50 font-['Inter',sans-serif]">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col bg-slate-900 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-slate-800">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="flex items-center gap-3 w-full"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            {!sidebarCollapsed && (
              <span className="text-base font-bold text-white tracking-wide whitespace-nowrap">
                AURA COMMERCE
              </span>
            )}
          </button>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {primaryNavItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                isActive(item.href)
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="px-3 py-4 border-t border-slate-800 space-y-1">
          <Link
            to="/settings"
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
              isActive("/settings")
                ? "bg-purple-600 text-white"
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
            )}
          >
            <SettingsIcon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">Settings</span>
            )}
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-3 rounded-lg w-full text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-200"
          >
            <LogoutIcon className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">Logout</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          {/* Search */}
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, products, customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm">
              <PlusIcon className="w-4 h-4" />
              <span className="text-sm font-medium">New Sale</span>
            </button>

            {/* Notifications */}
            <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
              <BellIcon className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-medium">
                {user?.firstName?.charAt(0)}
                {user?.lastName?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome back! Here's what's happening with your store.
            </p>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <KPICard
              title="Total Revenue"
              value="$45,230"
              change={12.5}
              changeLabel="vs last month"
              icon={
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
            />
            <KPICard
              title="Active Orders"
              value="124"
              change={8.2}
              changeLabel="vs last week"
              icon={
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              }
            />
            <KPICard
              title="New Customers"
              value="89"
              change={-2.4}
              changeLabel="vs last month"
              icon={
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
              }
            />
            <KPICard
              title="Conversion Rate"
              value="3.2%"
              change={0.8}
              changeLabel="vs last week"
              icon={
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              }
            />
          </div>

          {/* Sales Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Sales over time
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Revenue performance for the selected period
                </p>
              </div>
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                {(["Daily", "Weekly", "Monthly"] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setChartPeriod(period)}
                    className={cn(
                      "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                      chartPeriod === period
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    )}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            <AreaChartPlaceholder />
          </div>

          {/* Bottom Section - Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Orders - 2/3 width */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Recent Orders
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Latest transactions from your store
                    </p>
                  </div>
                  <Link
                    to="/orders"
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    View all →
                  </Link>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Order ID
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Customer
                      </th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Status
                      </th>
                      <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {order.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {order.customer}
                            </p>
                            <p className="text-xs text-gray-500">
                              {order.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-sm font-semibold text-gray-900">
                            ${order.amount.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Selling Products - 1/3 width */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                      Top Selling
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      Best performers this month
                    </p>
                  </div>
                  <Link
                    to="/products"
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors"
                  >
                    View all →
                  </Link>
                </div>
              </div>
              <div className="p-4 space-y-4">
                {topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg text-sm font-semibold text-gray-600">
                      {index + 1}
                    </div>
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {product.units} units sold
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        ${(product.revenue / 1000).toFixed(1)}k
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
