import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { reviewsApi } from "../lib/api";
import type { Review, PaginatedResponse } from "../lib/types";
import { formatRelativeTime, cn } from "../lib/utils";
import { Spinner, Pagination, ConfirmDialog } from "../components/UI";
import { useNotificationStore } from "../lib/store";

export default function ReviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteReview, setDeleteReview] = useState<Review | null>(null);
  const { addNotification } = useNotificationStore();

  const page = Number(searchParams.get("page")) || 1;
  const rating = searchParams.get("rating") || "";

  useEffect(() => {
    const fetchReviews = async () => {
      setIsLoading(true);
      try {
        const response = await reviewsApi.getAll({
          page,
          limit: 10,
          rating: rating ? Number(rating) : undefined,
        });

        const data = response.data as PaginatedResponse<Review>;
        setReviews(data.items || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalItems(data.meta?.total || 0);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        addNotification({ type: "error", title: "Failed to load reviews" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, [page, rating, addNotification]);

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

  const handleDelete = async () => {
    if (!deleteReview) return;

    try {
      await reviewsApi.delete(deleteReview.id);
      addNotification({
        type: "success",
        title: "Review deleted successfully",
      });
      setReviews((prev) => prev.filter((r) => r.id !== deleteReview.id));
    } catch (error) {
      console.error("Error deleting review:", error);
      addNotification({ type: "error", title: "Failed to delete review" });
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={cn(
              "w-4 h-4",
              star <= rating ? "text-yellow-400" : "text-gray-300"
            )}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={rating}
            onChange={(e) => updateParams({ rating: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          <button
            onClick={() => setSearchParams(new URLSearchParams())}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No reviews found
            </h3>
            <p className="text-gray-500">Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <div key={review.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-medium flex-shrink-0">
                        {review.user?.firstName?.charAt(0)}
                        {review.user?.lastName?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {review.user?.firstName} {review.user?.lastName}
                          </span>
                          {review.isVerifiedPurchase && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Verified Purchase
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mb-2">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-500">
                            {formatRelativeTime(review.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          Product:{" "}
                          <span className="text-gray-700 font-medium">
                            {review.product?.name}
                          </span>
                        </p>
                        {review.title && (
                          <h4 className="font-medium text-gray-900 mb-1">
                            {review.title}
                          </h4>
                        )}
                        {review.comment && (
                          <p className="text-gray-700">{review.comment}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setDeleteReview(review)}
                      className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Delete Review"
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
                </div>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * 10 + 1} to{" "}
                {Math.min(page * 10, totalItems)} of {totalItems} reviews
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

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteReview}
        onClose={() => setDeleteReview(null)}
        onConfirm={handleDelete}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
