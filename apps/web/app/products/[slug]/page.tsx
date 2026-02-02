"use client";

import { useState, useEffect, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { productsApi, reviewsApi } from "@/lib/api";
import { Product, Review, ReviewStats } from "@/lib/types";
import { useAuthStore, useCartStore, useWishlistStore } from "@/lib/store";
import { formatPrice, formatDate, calculateDiscount } from "@/lib/utils";
import { ProductGrid } from "@/components/products";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const {
    isInWishlist,
    addItem: addToWishlist,
    removeItem: removeFromWishlist,
  } = useWishlistStore();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description"
  );

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const productRes = await productsApi.getBySlug(slug);
        setProduct(productRes.data);

        if (productRes.data.id) {
          const [relatedRes, reviewsRes, statsRes] = await Promise.all([
            productsApi
              .getRelated(productRes.data.id)
              .catch(() => ({ data: [] })),
            reviewsApi
              .getByProduct(productRes.data.id)
              .catch(() => ({ data: [] })),
            reviewsApi
              .getStats(productRes.data.id)
              .catch(() => ({ data: null })),
          ]);
          setRelatedProducts(relatedRes.data);
          setReviews(reviewsRes.data);
          setReviewStats(statsRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (!product) return;

    setIsAddingToCart(true);
    try {
      await addItem(product.id, quantity);
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }
    if (!product) return;

    try {
      if (isInWishlist(product.id)) {
        await removeFromWishlist(product.id);
      } else {
        await addToWishlist(product.id);
      }
    } catch (error) {
      console.error("Failed to toggle wishlist:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/2">
              <div className="aspect-square bg-gray-200 rounded-lg" />
            </div>
            <div className="lg:w-1/2 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-6 bg-gray-200 rounded w-1/4" />
              <div className="h-20 bg-gray-200 rounded" />
              <div className="h-12 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
        <p className="text-gray-500 mb-8">
          The product you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/products"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back to Products
        </Link>
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const discount = product.compareAtPrice
    ? calculateDiscount(product.price, product.compareAtPrice)
    : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-indigo-600">
          Home
        </Link>
        <span>/</span>
        <Link href="/products" className="hover:text-indigo-600">
          Products
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link
              href={`/categories/${product.category.slug}`}
              className="hover:text-indigo-600"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-gray-900">{product.name}</span>
      </nav>

      {/* Product details */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Images */}
        <div className="lg:w-1/2">
          <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4">
            {product.images?.[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg
                  className="w-24 h-24"
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
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded">
                -{discount}%
              </span>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${
                    selectedImage === index
                      ? "border-indigo-600"
                      : "border-transparent"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="lg:w-1/2">
          {product.category && (
            <Link
              href={`/categories/${product.category.slug}`}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {product.category.name}
            </Link>
          )}
          <h1 className="text-3xl font-bold mt-2 mb-4">{product.name}</h1>

          {/* Rating */}
          {reviewStats && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-5 h-5 ${
                      star <= (reviewStats.averageRating || 0)
                        ? "text-yellow-400"
                        : "text-gray-300"
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {reviewStats.averageRating?.toFixed(1)} (
                {reviewStats.totalReviews} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-bold text-gray-900">
              {formatPrice(product.price)}
            </span>
            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
          </div>

          {/* Stock status */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="inline-flex items-center gap-1 text-green-600">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                In Stock ({product.stock} available)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-red-600">
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Out of Stock
              </span>
            )}
          </div>

          {/* Quantity & Add to Cart */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center border rounded-lg">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-4 py-3 hover:bg-gray-100"
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="px-6 py-3 font-medium">{quantity}</span>
              <button
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                className="px-4 py-3 hover:bg-gray-100"
                disabled={quantity >= product.stock}
              >
                +
              </button>
            </div>
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart || product.stock === 0}
              className="flex-1 bg-indigo-600 text-white py-3 px-8 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </button>
            <button
              onClick={handleToggleWishlist}
              className={`p-3 rounded-lg border transition-colors ${
                inWishlist
                  ? "bg-red-50 border-red-200 text-red-500"
                  : "hover:bg-gray-50"
              }`}
            >
              <svg
                className="w-6 h-6"
                fill={inWishlist ? "currentColor" : "none"}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>

          {/* SKU */}
          <p className="text-sm text-gray-500 mb-6">
            SKU: <span className="text-gray-900">{product.sku}</span>
          </p>

          {/* Features */}
          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              <span className="text-sm">Free shipping on orders over $50</span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span className="text-sm">30-day return policy</span>
            </div>
            <div className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-indigo-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span className="text-sm">Secure checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-16">
        <div className="border-b">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("description")}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === "description"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`py-4 border-b-2 font-medium transition-colors ${
                activeTab === "reviews"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Reviews ({reviews.length})
            </button>
          </div>
        </div>

        <div className="py-8">
          {activeTab === "description" ? (
            <div className="prose max-w-none">
              <p className="text-gray-600 whitespace-pre-wrap">
                {product.description}
              </p>
            </div>
          ) : (
            <div>
              {/* Review stats */}
              {reviewStats && reviewStats.totalReviews > 0 && (
                <div className="flex flex-col md:flex-row gap-8 mb-8 pb-8 border-b">
                  <div className="text-center">
                    <div className="text-5xl font-bold">
                      {reviewStats.averageRating?.toFixed(1)}
                    </div>
                    <div className="flex justify-center text-yellow-400 my-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (reviewStats.averageRating || 0)
                              ? "text-yellow-400"
                              : "text-gray-300"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      {reviewStats.totalReviews} reviews
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <div key={rating} className="flex items-center gap-2">
                        <span className="w-8 text-sm text-gray-500">
                          {rating}
                        </span>
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-yellow-400"
                            style={{
                              width: `${
                                reviewStats.totalReviews
                                  ? ((reviewStats.ratingDistribution?.[
                                      rating as keyof typeof reviewStats.ratingDistribution
                                    ] || 0) /
                                      reviewStats.totalReviews) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-sm text-gray-500 text-right">
                          {reviewStats.ratingDistribution?.[
                            rating as keyof typeof reviewStats.ratingDistribution
                          ] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews list */}
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b pb-6 last:border-0"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-medium">
                          {review.user?.firstName?.charAt(0)}
                          {review.user?.lastName?.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">
                              {review.user?.firstName} {review.user?.lastName}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatDate(review.createdAt)}
                            </span>
                          </div>
                          <div className="flex text-yellow-400 mb-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          {review.comment && (
                            <p className="text-gray-600">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    No reviews yet. Be the first to review this product!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold mb-8">Related Products</h2>
          <ProductGrid products={relatedProducts.slice(0, 4)} />
        </div>
      )}
    </div>
  );
}
