import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../lib/store";

// Types
type TimePeriod = "Daily" | "Weekly" | "Monthly";
type OrderStatus = "Paid" | "Pending" | "Shipped";

interface Order {
  id: string;
  customer: string;
  status: OrderStatus;
  amount: string;
}

interface Product {
  name: string;
  unitsSold: number;
  image: string;
}

// Mock Data matching Figma exactly
const recentOrders: Order[] = [
  { id: "22120000", customer: "Just Garnin", status: "Paid", amount: "$35.30" },
  {
    id: "22130001",
    customer: "Duin Pxincn",
    status: "Pending",
    amount: "$10.00",
  },
  {
    id: "22120002",
    customer: "Custom-Cannen",
    status: "Shipped",
    amount: "$23.00",
  },
];

const topProducts: Product[] = [
  { name: "Product Name 1", unitsSold: 18, image: "" },
  { name: "Product Name 2", unitsSold: 13, image: "" },
  { name: "Product Name 3", unitsSold: 6, image: "" },
];

// Navigation items matching Figma
const primaryNavItems = [
  { name: "Dashboard", href: "/", icon: "dashboard" },
  { name: "Orders", href: "/orders", icon: "orders" },
  { name: "Products", href: "/products", icon: "products" },
  { name: "Customers", href: "/customers", icon: "customers" },
  { name: "Analytics", href: "/analytics", icon: "analytics" },
];

const secondaryNavItems = [
  { name: "Discounts", href: "/discounts", icon: "discounts" },
  { name: "Reviews", href: "/reviews", icon: "reviews" },
  { name: "Marketing", href: "/marketing", icon: "marketing" },
];

const bottomNavItems = [
  { name: "Settings", href: "/settings", icon: "settings" },
  { name: "Support", href: "/support", icon: "support" },
];

// Icon Components
function NavIcon({ name, className }: { name: string; className?: string }) {
  const icons: Record<string, JSX.Element> = {
    dashboard: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="4" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="11" width="7" height="10" rx="1" />
      </svg>
    ),
    orders: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        <path d="M9 12h6M9 16h6" />
      </svg>
    ),
    products: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    customers: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
    analytics: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    discounts: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    reviews: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    marketing: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    settings: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    support: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    logout: (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
      </svg>
    ),
  };
  return icons[name] || null;
}

// Status Badge Component
function StatusBadge({ status }: { status: OrderStatus }) {
  const styles: Record<OrderStatus, string> = {
    Paid: "bg-emerald-50 text-emerald-600",
    Pending: "bg-amber-50 text-amber-600",
    Shipped: "bg-blue-50 text-blue-600",
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

// KPI Card Component
function KPICard({
  title,
  value,
  subValue,
  change,
  isWarning,
  pill,
}: {
  title: string;
  value: string;
  subValue?: string;
  change?: { value: string; positive: boolean };
  isWarning?: boolean;
  pill?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {isWarning && (
          <svg
            className="w-5 h-5 text-amber-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <p className="text-3xl font-bold tracking-tight text-gray-900 leading-none">
            {value}
          </p>
          {subValue && (
            <p className="text-sm text-gray-400 font-medium">{subValue}</p>
          )}
          {pill && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
              {pill}
            </span>
          )}
        </div>

        {change && (
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
              change.positive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-red-50 text-red-500"
            }`}
          >
            {change.positive ? (
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M12 19V5M5 12l7-7 7 7" />
              </svg>
            ) : null}
            {change.value}
          </span>
        )}
        {isWarning && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-500 flex items-center gap-1">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
            0.4%
          </span>
        )}
      </div>
    </div>
  );
}

// Sales Chart Component (updated with smoother bezier curves and taller height)
function SalesChart({ period }: { period: TimePeriod }) {
  return (
    <div className="relative h-96 w-full mt-6">
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <line
            key={i}
            x1="0"
            y1={i * 70 + 40}
            x2="1000"
            y2={i * 70 + 40}
            stroke="#f1f5f9"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Area fill - Smooth Bezier Curve */}
        <path
          d="M0,350 C200,340 300,320 400,280 C550,220 700,180 850,140 C950,110 980,80 1000,60 L1000,400 L0,400 Z"
          fill="url(#chartGradient)"
        />

        {/* Line - Matching Bezier Curve */}
        <path
          d="M0,350 C200,340 300,320 400,280 C550,220 700,180 850,140 C950,110 980,80 1000,60"
          fill="none"
          stroke="#8b5cf6"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function AuraDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("Daily");
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActiveRoute = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-950 flex flex-col fixed h-full">
        {/* Logo */}
        <div className="px-5 py-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">
              AURA COMMERCE.
            </span>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-4 mt-4">
          <ul className="space-y-2">
            {primaryNavItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActiveRoute(item.href)
                      ? "bg-indigo-600 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <NavIcon name={item.icon} className="w-5 h-5" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* Secondary Section */}
          <div className="mt-10">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Secondary
            </p>
            <ul className="space-y-2">
              {secondaryNavItems.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActiveRoute(item.href)
                        ? "bg-indigo-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                    }`}
                  >
                    <NavIcon name={item.icon} className="w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Bottom Navigation */}
        <div className="px-4 pb-6 mt-auto pt-6">
          <ul className="space-y-2">
            {bottomNavItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <NavIcon name={item.icon} className="w-5 h-5" />
                  {item.name}
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors w-full"
              >
                <NavIcon name="logout" className="w-5 h-5" />
                Logout
                <span className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></span>
              </button>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-60">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center justify-between px-8 py-5">
            {/* Title */}
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>

            {/* Search */}
            <div className="flex-1 max-w-md mx-8">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
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
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-4">
              {/* New Sale Button */}
              <button className="bg-[#8b5cf6] hover:bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-indigo-200">
                New Sale
              </button>

              {/* Notification Bell */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
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
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 hover:bg-gray-100 rounded-lg p-1.5 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-semibold">
                      {user?.firstName?.charAt(0) || "A"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Admin User
                  </span>
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
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Profile Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <KPICard
              title="Total Revenue"
              value="$45,230"
              change={{ value: "12%", positive: true }}
            />
            <KPICard title="Active Orders" value="124" pill="8 pending" />
            <KPICard
              title="New Customers"
              value="89"
              change={{ value: "5%", positive: true }}
            />
            <KPICard title="Conversion Rate" value="3.2%" isWarning={true} />
          </div>

          {/* Sales Chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Sales over time
              </h2>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                {(["Daily", "Weekly", "Monthly"] as TimePeriod[]).map(
                  (period) => (
                    <button
                      key={period}
                      onClick={() => setTimePeriod(period)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        timePeriod === period
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {period}
                    </button>
                  ),
                )}
              </div>
            </div>
            <SalesChart period={timePeriod} />
          </div>

          {/* Bottom Section: Recent Orders & Top Products */}
          <div className="grid grid-cols-3 gap-6">
            {/* Recent Orders - Takes 2 columns */}
            <div className="col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Recent Orders
              </h2>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-4">Order ID</th>
                    <th className="pb-4">Customer</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="text-sm hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4 text-gray-900 font-medium">
                        {order.id}
                      </td>
                      <td className="py-4 text-gray-600">{order.customer}</td>
                      <td className="py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="py-4 text-right text-gray-900 font-medium">
                        {order.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Top Selling Products - Takes 1 column */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Top Selling Products
              </h2>
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="pb-4">Product Name</th>
                    <th className="pb-4 text-right">Units Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topProducts.map((product, index) => (
                    <tr
                      key={index}
                      className="text-sm hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
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
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <span className="text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="py-4 text-right text-gray-900 font-medium">
                        {product.unitsSold}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
