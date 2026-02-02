import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { productsApi, categoriesApi } from "../../lib/api";
import type { Category } from "../../lib/types";
import { Spinner } from "../../components/UI";
import { useNotificationStore } from "../../lib/store";
import { generateSlug } from "../../lib/utils";

const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be positive"),
  compareAtPrice: z.coerce.number().min(0).optional().nullable(),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0, "Stock must be positive"),
  categoryId: z.string().optional(),
  images: z.array(z.string()).optional(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  weight: z.coerce.number().min(0).optional().nullable(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [imageInput, setImageInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const { addNotification } = useNotificationStore();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      compareAtPrice: null,
      sku: "",
      stock: 0,
      categoryId: "",
      images: [] as string[],
      isActive: true,
      isFeatured: false,
      weight: null,
      tags: [] as string[],
      metaTitle: "",
      metaDescription: "",
    },
  });

  const images = watch("images") || [];
  const tags = watch("tags") || [];
  const name = watch("name");

  // Fetch categories
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

  // Fetch product data when editing
  useEffect(() => {
    if (isEditing) {
      const fetchProduct = async () => {
        setIsLoading(true);
        try {
          const response = await productsApi.getById(id);
          const product = response.data;
          reset({
            name: product.name,
            description: product.description || "",
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            sku: product.sku || "",
            stock: product.stock,
            categoryId: product.categoryId || "",
            images: product.images || [],
            isActive: product.isActive,
            isFeatured: product.isFeatured,
            weight: product.weight,
            tags: product.tags || [],
            metaTitle: product.metaTitle || "",
            metaDescription: product.metaDescription || "",
          });
        } catch (error) {
          console.error("Error fetching product:", error);
          addNotification({ type: "error", title: "Failed to load product" });
          navigate("/products");
        } finally {
          setIsLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEditing, reset, addNotification, navigate]);

  const onSubmit = async (data: ProductFormData) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        compareAtPrice: data.compareAtPrice || undefined,
        weight: data.weight || undefined,
        categoryId: data.categoryId || undefined,
      };

      if (isEditing) {
        await productsApi.update(id, payload);
        addNotification({
          type: "success",
          title: "Product updated successfully",
        });
      } else {
        await productsApi.create(payload);
        addNotification({
          type: "success",
          title: "Product created successfully",
        });
      }
      navigate("/products");
    } catch (error) {
      console.error("Error saving product:", error);
      addNotification({
        type: "error",
        title: `Failed to ${isEditing ? "update" : "create"} product`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addImage = () => {
    if (imageInput.trim()) {
      setValue("images", [...images, imageInput.trim()]);
      setImageInput("");
    }
  };

  const removeImage = (index: number) => {
    setValue(
      "images",
      images.filter((_, i) => i !== index)
    );
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tag)
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-2"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Products
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEditing ? "Edit Product" : "New Product"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                {...register("name")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
              {name && (
                <p className="text-sm text-gray-500 mt-1">
                  Slug: {generateSlug(name)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register("description")}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter product description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  {...register("categoryId")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">No Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  {...register("sku")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Product SKU"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Pricing & Inventory */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Pricing & Inventory</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register("price")}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.price.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Compare at Price
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  {...register("compareAtPrice")}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                {...register("stock")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.stock.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                step="0.01"
                {...register("weight")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Images</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="url"
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter image URL"
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addImage())
                }
              />
              <button
                type="button"
                onClick={addImage}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg
                        className="w-4 h-4"
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Tags</h2>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter tag"
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), addTag())
                }
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="w-4 h-4"
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
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">Status</h2>
          <div className="space-y-4">
            <Controller
              name="isActive"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Active</span>
                    <p className="text-sm text-gray-500">
                      Product is visible to customers
                    </p>
                  </div>
                </label>
              )}
            />

            <Controller
              name="isFeatured"
              control={control}
              render={({ field }) => (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={field.onChange}
                    className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="font-medium text-gray-900">Featured</span>
                    <p className="text-sm text-gray-500">
                      Show on homepage featured section
                    </p>
                  </div>
                </label>
              )}
            />
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold mb-4">SEO</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Title
              </label>
              <input
                type="text"
                {...register("metaTitle")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="SEO title (max 60 characters)"
                maxLength={60}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta Description
              </label>
              <textarea
                {...register("metaDescription")}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="SEO description (max 160 characters)"
                maxLength={160}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <Spinner size="sm" className="text-white" />}
            {isEditing ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
