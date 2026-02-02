"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { categoriesApi, productsApi } from "@/lib/api";
import { Category, Product, PaginatedResponse } from "@/lib/types";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters } from "@/components/products/ProductFilters";

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryLoading, setCategoryLoading] = useState(true);

  const page = Number(searchParams.get("page")) || 1;
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";

  // Fetch category data
  useEffect(() => {
    const fetchCategory = async () => {
      setCategoryLoading(true);
      try {
        const response = await categoriesApi.getBySlug(slug);
        setCategory(response.data);

        // Fetch subcategories
        const allCategories = await categoriesApi.getAll();
        const subs = allCategories.data.filter(
          (c: Category) => c.parentId === response.data.id
        );
        setSubcategories(subs);
      } catch (error) {
        console.error("Error fetching category:", error);
        setCategory(null);
      } finally {
        setCategoryLoading(false);
      }
    };

    fetchCategory();
  }, [slug]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      if (!category) return;

      setIsLoading(true);
      try {
        const response = await productsApi.getAll({
          categoryId: category.id,
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
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [category, page, sortBy, sortOrder, minPrice, maxPrice]);

  const handleFilterChange = (filters: {
    categoryId?: string;
    minPrice?: string;
    maxPrice?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }) => {
    const params = new URLSearchParams();
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.sortBy) params.set("sortBy", filters.sortBy);
    if (filters.sortOrder) params.set("sortOrder", filters.sortOrder);

    router.push(`/categories/${slug}?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/categories/${slug}?${params.toString()}`);
  };

  if (categoryLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-96 mb-8" />
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
    );
  }

  if (!category) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
        <p className="text-gray-500 mb-8">
          The category you're looking for doesn't exist.
        </p>
        <Link
          href="/products"
          className="inline-block bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
        >
          Browse All Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-indigo-600 transition-colors">
          Home
        </Link>
        <svg
          className="w-4 h-4 mx-2"
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
        <Link
          href="/products"
          className="hover:text-indigo-600 transition-colors"
        >
          Products
        </Link>
        {category.parent && (
          <>
            <svg
              className="w-4 h-4 mx-2"
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
            <Link
              href={`/categories/${category.parent.slug}`}
              className="hover:text-indigo-600 transition-colors"
            >
              {category.parent.name}
            </Link>
          </>
        )}
        <svg
          className="w-4 h-4 mx-2"
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
        <span className="text-gray-900">{category.name}</span>
      </nav>

      {/* Category Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-gray-600 max-w-2xl">{category.description}</p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          {totalProducts} product{totalProducts !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Subcategories */}
      {subcategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Subcategories</h2>
          <div className="flex flex-wrap gap-3">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/categories/${sub.slug}`}
                className="px-4 py-2 bg-gray-100 hover:bg-indigo-100 text-gray-700 hover:text-indigo-600 rounded-full text-sm font-medium transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <ProductFilters
            currentFilters={{
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
          {!isLoading && products.length === 0 && (
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
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No products found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or browse all products.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
