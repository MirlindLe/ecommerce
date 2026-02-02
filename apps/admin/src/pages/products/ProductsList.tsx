import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { productsApi, categoriesApi } from "../../lib/api";
import type { Product, Category, PaginatedResponse } from "../../lib/types";
import { formatPrice, formatDate, cn } from "../../lib/utils";
import { Spinner, Pagination, ConfirmDialog } from "../../components/UI";
import { useNotificationStore } from "../../lib/store";

export default function ProductsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const { addNotification } = useNotificationStore();

  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const isActive = searchParams.get("isActive") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

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

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await productsApi.getAll({
          page,
          limit: 10,
          search: search || undefined,
          categoryId: categoryId || undefined,
          isActive: isActive ? isActive === "true" : undefined,
          sortBy,
          sortOrder,
        });

        const data = response.data as PaginatedResponse<Product>;
        setProducts(data.data || data.items || []);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalItems(data.meta?.total || 0);
      } catch (error) {
        console.error("Error fetching products:", error);
        addNotification({ type: "error", title: "Failed to load products" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [page, search, categoryId, isActive, sortBy, sortOrder, addNotification]);

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
    if (!deleteProduct) return;

    try {
      await productsApi.delete(deleteProduct.id);
      addNotification({
        type: "success",
        title: "Product deleted successfully",
      });
      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
    } catch (error) {
      console.error("Error deleting product:", error);
      addNotification({ type: "error", title: "Failed to delete product" });
    }
  };

  const toggleProductStatus = async (product: Product) => {
    try {
      await productsApi.update(product.id, { isActive: !product.isActive });
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, isActive: !p.isActive } : p
        )
      );
      addNotification({
        type: "success",
        title: `Product ${product.isActive ? "deactivated" : "activated"}`,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      addNotification({ type: "error", title: "Failed to update product" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          to="/products/new"
          className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors flex items-center gap-2"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Product
        </Link>
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
              placeholder="Search products..."
              value={search}
              onChange={(e) => updateParams({ search: e.target.value })}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <select
            value={categoryId}
            onChange={(e) => updateParams({ categoryId: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
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

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split("-");
              updateParams({ sortBy: newSortBy, sortOrder: newSortOrder });
            }}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="price-asc">Price Low to High</option>
            <option value="price-desc">Price High to Low</option>
            <option value="stock-asc">Stock Low to High</option>
            <option value="stock-desc">Stock High to Low</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : products.length === 0 ? (
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-500 mb-4">
              Try adjusting your filters or add a new product.
            </p>
            <Link
              to="/products/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Product
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Product
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Category
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Price
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Stock
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Status
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Created
                    </th>
                    <th className="text-right text-xs font-medium text-gray-500 uppercase py-3 px-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            {product.images?.[0] ? (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          <div>
                            <Link
                              to={`/products/${product.id}/edit`}
                              className="font-medium text-gray-900 hover:text-indigo-600"
                            >
                              {product.name}
                            </Link>
                            {product.sku && (
                              <p className="text-sm text-gray-500">
                                SKU: {product.sku}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {product.category?.name || "-"}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <span className="font-medium text-gray-900">
                            {formatPrice(product.price)}
                          </span>
                          {product.compareAtPrice &&
                            product.compareAtPrice > product.price && (
                              <span className="text-sm text-gray-400 line-through ml-2">
                                {formatPrice(product.compareAtPrice)}
                              </span>
                            )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={cn("font-medium", {
                            "text-red-600": product.stock === 0,
                            "text-yellow-600":
                              product.stock > 0 && product.stock <= 10,
                            "text-green-600": product.stock > 10,
                          })}
                        >
                          {product.stock}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleProductStatus(product)}
                          className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                            product.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          )}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-gray-500 text-sm">
                        {formatDate(product.createdAt)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/products/${product.id}/edit`}
                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
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
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                          </Link>
                          <button
                            onClick={() => setDeleteProduct(product)}
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
                {Math.min(page * 10, totalItems)} of {totalItems} products
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
        isOpen={!!deleteProduct}
        onClose={() => setDeleteProduct(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
