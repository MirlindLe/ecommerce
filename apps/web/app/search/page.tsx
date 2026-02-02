"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { productsApi, categoriesApi } from "@/lib/api";
import { Product, Category, PaginatedResponse } from "@/lib/types";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters } from "@/components/products/ProductFilters";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const query = searchParams.get("q") || "";
  const page = Number(searchParams.get("page")) || 1;
  const categoryId = searchParams.get("categoryId") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(query);

  // Fetch categories for filter
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesApi.getAll();
        setCategories(response.data);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch search results
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await productsApi.getAll({
          search: query,
          categoryId: categoryId || undefined,
          page,
          limit: 12,
          sortBy,
          sortOrder,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
        });

        const data = response.data;
        setProducts(data.data || []);
        setTotalProducts(data.meta?.total || 0);
        setTotalPages(data.meta?.totalPages || 1);
      } catch (error) {
        console.error("Error searching products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [query, page, categoryId, sortBy, sortOrder, minPrice, maxPrice]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("q", searchQuery);
    params.delete("page");
    router.push(`/search?${params.toString()}`);
  };

  const handleFilterChange = (filters: {
    categoryId?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

    router.push(`/search?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/search?${params.toString()}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    router.push("/search");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <form onSubmit={handleSearch} className="max-w-2xl">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {query && (
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Search results for &quot;{query}&quot;
            </h1>
            <p className="text-gray-500 mt-1">
              {totalProducts} product{totalProducts !== 1 ? "s" : ""} found
            </p>
          </div>
        )}

        {!query && (
          <div className="mt-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Search Products
            </h1>
            <p className="text-gray-500 mt-1">
              Enter a search term to find products
            </p>
          </div>
        )}
      </div>

      {/* Popular Searches */}
      {!query && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Popular Searches</h2>
          <div className="flex flex-wrap gap-2">
            {[
              "Electronics",
              "Clothing",
              "Home & Garden",
              "Books",
              "Toys",
              "Sports",
            ].map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="px-4 py-2 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 rounded-full text-sm font-medium transition-colors"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Browse by Category */}
      {!query && categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Browse by Category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories
              .filter((c) => !c.parentId)
              .slice(0, 6)
              .map((category) => (
                <Link
                  key={category.id}
                  href={`/categories/${category.slug}`}
                  className="p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-2 bg-indigo-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {category.name}
                  </span>
                </Link>
              ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {query && (
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <ProductFilters
              categories={categories}
              currentFilters={{
                categoryId,
                minPrice,
                maxPrice,
                sortBy,
                sortOrder,
              }}
              onFilterChange={handleFilterChange}
            />
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            <ProductGrid products={products} loading={isLoading} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-2">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      (p >= page - 1 && p <= page + 1)
                  )
                  .map((p, index, arr) => (
                    <span key={p}>
                      {index > 0 && arr[index - 1] !== p - 1 && (
                        <span className="px-2 text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(p)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                          p === page
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {p}
                      </button>
                    </span>
                  ))}

                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                >
                  Next
                </button>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && products.length === 0 && query && (
              <div className="text-center py-16">
                <svg
                  className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-500 mb-4">
                  No products match &quot;{query}&quot;. Try different keywords.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Suggestions:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Check your spelling</li>
                    <li>• Try more general terms</li>
                    <li>• Try fewer keywords</li>
                  </ul>
                </div>
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded w-full max-w-2xl mb-8" />
            <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl overflow-hidden shadow-sm"
                >
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-6 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <SearchContent />
    </Suspense>
  );
}
