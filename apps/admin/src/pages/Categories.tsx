import { useState, useEffect } from "react";
import { categoriesApi } from "../lib/api";
import type { Category } from "../lib/types";
import { formatDate, cn } from "../lib/utils";
import { Spinner, ConfirmDialog, Modal } from "../components/UI";
import { useNotificationStore } from "../lib/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional(),
  image: z.string().url().optional().or(z.literal("")),
  parentId: z.string().optional(),
  isActive: z.boolean(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { addNotification } = useNotificationStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      description: "",
      image: "",
      parentId: "",
      isActive: true,
    },
  });

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await categoriesApi.getAll();
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      addNotification({ type: "error", title: "Failed to load categories" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (category?: Category) => {
    if (category) {
      setEditCategory(category);
      reset({
        name: category.name,
        description: category.description || "",
        image: category.image || "",
        parentId: category.parentId || "",
        isActive: category.isActive,
      });
    } else {
      setEditCategory(null);
      reset({
        name: "",
        description: "",
        image: "",
        parentId: "",
        isActive: true,
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditCategory(null);
    reset();
  };

  const onSubmit = async (data: CategoryFormData) => {
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        image: data.image || undefined,
        parentId: data.parentId || undefined,
      };

      if (editCategory) {
        await categoriesApi.update(editCategory.id, payload);
        addNotification({
          type: "success",
          title: "Category updated successfully",
        });
      } else {
        await categoriesApi.create(payload);
        addNotification({
          type: "success",
          title: "Category created successfully",
        });
      }
      closeModal();
      fetchCategories();
    } catch (error) {
      console.error("Error saving category:", error);
      addNotification({
        type: "error",
        title: `Failed to ${editCategory ? "update" : "create"} category`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;

    try {
      await categoriesApi.delete(deleteCategory.id);
      addNotification({
        type: "success",
        title: "Category deleted successfully",
      });
      setCategories((prev) => prev.filter((c) => c.id !== deleteCategory.id));
    } catch (error) {
      console.error("Error deleting category:", error);
      addNotification({ type: "error", title: "Failed to delete category" });
    }
  };

  const toggleCategoryStatus = async (category: Category) => {
    try {
      await categoriesApi.update(category.id, { isActive: !category.isActive });
      setCategories((prev) =>
        prev.map((c) =>
          c.id === category.id ? { ...c, isActive: !c.isActive } : c
        )
      );
      addNotification({
        type: "success",
        title: `Category ${category.isActive ? "deactivated" : "activated"}`,
      });
    } catch (error) {
      console.error("Error updating category:", error);
      addNotification({ type: "error", title: "Failed to update category" });
    }
  };

  // Build category tree
  const rootCategories = categories.filter((c) => !c.parentId);
  const getChildren = (parentId: string) =>
    categories.filter((c) => c.parentId === parentId);

  const renderCategory = (category: Category, level: number = 0) => {
    const children = getChildren(category.id);

    return (
      <div key={category.id}>
        <div
          className={cn(
            "flex items-center justify-between py-4 px-4 hover:bg-gray-50 border-b border-gray-100",
            level > 0 && "bg-gray-50/50"
          )}
          style={{ paddingLeft: `${level * 24 + 16}px` }}
        >
          <div className="flex items-center gap-3">
            {children.length > 0 && (
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
                  d="M9 5l7 7-7 7"
                />
              </svg>
            )}
            {children.length === 0 && level > 0 && <div className="w-4" />}
            <div className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
              {category.image ? (
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
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
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{category.name}</h3>
              {category.description && (
                <p className="text-sm text-gray-500 line-clamp-1">
                  {category.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {category._count?.products || 0} products
            </span>
            <button
              onClick={() => toggleCategoryStatus(category)}
              className={cn(
                "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium",
                category.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              )}
            >
              {category.isActive ? "Active" : "Inactive"}
            </button>
            <span className="text-sm text-gray-500">
              {formatDate(category.createdAt)}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => openModal(category)}
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
              </button>
              <button
                onClick={() => setDeleteCategory(category)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Delete"
                disabled={children.length > 0}
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
        </div>
        {children.map((child) => renderCategory(child, level + 1))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <button
          onClick={() => openModal()}
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
          Add Category
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" />
          </div>
        ) : categories.length === 0 ? (
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No categories found
            </h3>
            <p className="text-gray-500 mb-4">
              Create your first category to organize products.
            </p>
            <button
              onClick={() => openModal()}
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
              Add Category
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-700/50">
            {rootCategories.map((category) => renderCategory(category))}
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editCategory ? "Edit Category" : "New Category"}
        size="lg"
        footer={
          <>
            <button
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              disabled={isSaving}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && <Spinner size="sm" className="text-white" />}
              {editCategory ? "Save Changes" : "Create Category"}
            </button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <input
              type="text"
              {...register("name")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter category name"
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register("description")}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter category description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              type="url"
              {...register("image")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="https://example.com/image.jpg"
            />
            {errors.image && (
              <p className="text-sm text-red-600 mt-1">
                {errors.image.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Category
            </label>
            <select
              {...register("parentId")}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">No Parent (Root Category)</option>
              {categories
                .filter((c) => c.id !== editCategory?.id && !c.parentId)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("isActive")}
                className="w-5 h-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-medium text-gray-900">Active</span>
            </label>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteCategory?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
