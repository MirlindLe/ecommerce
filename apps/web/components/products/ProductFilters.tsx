"use client";

import { useState, useEffect } from "react";
import { Category } from "@/lib/types";
import { categoriesApi } from "@/lib/api";

interface ProductFiltersProps {
  onFilterChange: (filters: FilterValues) => void;
  initialFilters?: FilterValues;
  currentFilters?: FilterValues;
  categories?: Category[];
}

export interface FilterValues {
  categoryId?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export function ProductFilters({
  onFilterChange,
  initialFilters = {},
  currentFilters,
  categories: externalCategories,
}: ProductFiltersProps) {
  const [categories, setCategories] = useState<Category[]>(
    externalCategories || []
  );
  const [filters, setFilters] = useState<FilterValues>(
    currentFilters || initialFilters
  );
  const [priceRange, setPriceRange] = useState({
    min: currentFilters?.minPrice || "",
    max: currentFilters?.maxPrice || "",
  });

  useEffect(() => {
    if (!externalCategories) {
      categoriesApi.getAll().then((res) => setCategories(res.data));
    }
  }, [externalCategories]);

  const handleCategoryChange = (categoryId: string) => {
    const newFilters = { ...filters, categoryId: categoryId || undefined };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSortChange = (value: string) => {
    let sortBy: string | undefined;
    let sortOrder: "asc" | "desc" | undefined;

    switch (value) {
      case "price-asc":
        sortBy = "price";
        sortOrder = "asc";
        break;
      case "price-desc":
        sortBy = "price";
        sortOrder = "desc";
        break;
      case "name-asc":
        sortBy = "name";
        sortOrder = "asc";
        break;
      case "newest":
        sortBy = "createdAt";
        sortOrder = "desc";
        break;
      default:
        sortBy = undefined;
        sortOrder = undefined;
    }

    const newFilters = { ...filters, sortBy, sortOrder };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handlePriceFilter = () => {
    const newFilters = {
      ...filters,
      minPrice: priceRange.min || undefined,
      maxPrice: priceRange.max || undefined,
    };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    setPriceRange({ min: "", max: "" });
    onFilterChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Categories</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="category"
              checked={!filters.categoryId}
              onChange={() => handleCategoryChange("")}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">All Categories</span>
          </label>
          {categories.map((category) => (
            <label key={category.id} className="flex items-center">
              <input
                type="radio"
                name="category"
                checked={filters.categoryId === category.id}
                onChange={() => handleCategoryChange(category.id)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">{category.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Price Range</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={priceRange.min}
            onChange={(e) =>
              setPriceRange({ ...priceRange, min: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <span className="text-gray-500">-</span>
          <input
            type="number"
            placeholder="Max"
            value={priceRange.max}
            onChange={(e) =>
              setPriceRange({ ...priceRange, max: e.target.value })
            }
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          onClick={handlePriceFilter}
          className="mt-2 w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
          Apply
        </button>
      </div>

      {/* Sort */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Sort By</h3>
        <select
          value={filters.sortBy ? `${filters.sortBy}-${filters.sortOrder}` : ""}
          onChange={(e) => handleSortChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Default</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Clear Filters */}
      <button
        onClick={clearFilters}
        className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        Clear All Filters
      </button>
    </div>
  );
}
