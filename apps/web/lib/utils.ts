export function formatPrice(
  price: number | string | { toNumber?: () => number } | null | undefined
): string {
  // Handle null/undefined
  if (price == null) return "$0.00";

  // Handle Prisma Decimal objects
  if (typeof price === "object" && price !== null && "toNumber" in price) {
    const numValue = price.toNumber?.() ?? 0;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(numValue);
  }

  // Handle string numbers
  const numPrice =
    typeof price === "string" ? parseFloat(price) : (price as number);

  // Handle NaN
  if (isNaN(numPrice)) return "$0.00";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numPrice);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export function classNames(
  ...classes: (string | boolean | undefined)[]
): string {
  return classes.filter(Boolean).join(" ");
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PROCESSING: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    REFUNDED: "bg-gray-100 text-gray-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function calculateDiscount(
  price: number,
  compareAtPrice: number
): number {
  if (!compareAtPrice || compareAtPrice <= price) return 0;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/**
 * Check if a URL is a valid image URL
 * Must be http/https and have an image extension or be from known image hosts
 */
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;

  // Check for common image extensions
  const imageExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".avif",
  ];
  const lowerUrl = url.toLowerCase();

  // Check if URL has image extension
  if (imageExtensions.some((ext) => lowerUrl.includes(ext))) {
    return true;
  }

  // Check for known image hosting services
  const imageHosts = [
    "images.unsplash.com",
    "unsplash.com",
    "picsum.photos",
    "via.placeholder.com",
    "placekitten.com",
    "placehold.co",
    "loremflickr.com",
    "cloudinary.com",
    "res.cloudinary.com",
    "imgur.com",
    "i.imgur.com",
    "cdn.shopify.com",
    "images.pexels.com",
  ];

  try {
    const urlObj = new URL(url);
    if (imageHosts.some((host) => urlObj.hostname.includes(host))) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}
