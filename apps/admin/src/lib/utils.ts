import { format, formatDistanceToNow, parseISO } from "date-fns";
import type { OrderStatus, PaymentStatus } from "./types";

// Format price
export function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

// Format date
export function formatDate(
  date: string | Date,
  formatStr: string = "MMM dd, yyyy"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr);
}

// Format date time
export function formatDateTime(date: string | Date): string {
  return formatDate(date, "MMM dd, yyyy HH:mm");
}

// Format relative time
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

// Format number with commas
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-US").format(num);
}

// Format percentage
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(decimals)}%`;
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

// Generate slug from text
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

// Class names utility (like clsx)
type ClassValue = string | boolean | undefined | null | Record<string, boolean>;

export function cn(...classes: ClassValue[]): string {
  return classes
    .flatMap((cls) => {
      if (!cls) return [];
      if (typeof cls === "string") return cls;
      if (typeof cls === "object") {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key);
      }
      return [];
    })
    .join(" ");
}

// Get order status color
export function getOrderStatusColor(status: OrderStatus): {
  bg: string;
  text: string;
  dot: string;
} {
  const colors: Record<OrderStatus, { bg: string; text: string; dot: string }> =
    {
      PENDING: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        dot: "bg-yellow-500",
      },
      PROCESSING: {
        bg: "bg-indigo-100",
        text: "text-indigo-800",
        dot: "bg-indigo-500",
      },
      SHIPPED: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        dot: "bg-purple-500",
      },
      DELIVERED: {
        bg: "bg-green-100",
        text: "text-green-800",
        dot: "bg-green-500",
      },
      CANCELLED: { bg: "bg-red-100", text: "text-red-800", dot: "bg-red-500" },
      REFUNDED: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        dot: "bg-gray-500",
      },
    };
  return colors[status] || colors.PENDING;
}

// Get payment status color
export function getPaymentStatusColor(status: PaymentStatus): {
  bg: string;
  text: string;
} {
  const colors: Record<PaymentStatus, { bg: string; text: string }> = {
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-800" },
    PAID: { bg: "bg-green-100", text: "text-green-800" },
    FAILED: { bg: "bg-red-100", text: "text-red-800" },
    REFUNDED: { bg: "bg-gray-100", text: "text-gray-800" },
    PARTIALLY_REFUNDED: { bg: "bg-orange-100", text: "text-orange-800" },
  };
  return colors[status] || colors.PENDING;
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Debounce function
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// File size formatter
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Get initials from name
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0)?.toUpperCase() || "";
  const last = lastName?.charAt(0)?.toUpperCase() || "";
  return first + last || "?";
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

// Download as CSV
export function downloadCSV(
  data: Record<string, unknown>[],
  filename: string
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value ?? "");
          if (stringValue.includes(",") || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Calculate percentage change
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
