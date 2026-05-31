import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Edit, Trash2, Tag } from "lucide-react";
import { useExpenseCategories } from "../hooks/useExpenseCategories";
import CategoryModal from "../components/CategoryModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import toast from "react-hot-toast";

const formatCurrency = (v) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v ?? 0);

export default function CategoriesPage() {
  const { categories, isLoading, createCategory, updateCategory, deleteCategory } = useExpenseCategories();
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleSubmit = (data) => {
    if (editTarget) {
      updateCategory.mutate(
        { id: editTarget.id, ...data },
        {
          onSuccess: () => { toast.success("Category updated"); setModalOpen(false); setEditTarget(null); },
          onError: (err) => toast.error(err?.response?.data?.name?.[0] ?? "Failed to update"),
        }
      );
    } else {
      createCategory.mutate(data, {
        onSuccess: () => { toast.success("Category created"); setModalOpen(false); },
        onError: (err) => toast.error(err?.response?.data?.name?.[0] ?? "Failed to create"),
      });
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteCategory.mutate(deleteTarget.id, {
      onSuccess: () => { toast.success("Category deleted"); setDeleteTarget(null); },
      onError: () => toast.error("Cannot delete category — it may have expenses attached."),
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            Organise your expenses into spending categories.
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setModalOpen(true); }}
          className="inline-flex items-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Category
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
          <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400 mb-6">No categories yet.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            Create your first category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Color bar */}
              <div className="h-2" style={{ backgroundColor: cat.color ?? "#6366f1" }} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${cat.color ?? "#6366f1"}22` }}
                    >
                      <Tag className="w-5 h-5" style={{ color: cat.color ?? "#6366f1" }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">{cat.name}</h3>
                      {cat.description && (
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{cat.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Total Spent</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatCurrency(cat.total_spent)}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <Link
                    to={`/expenses/categories/${cat.id}`}
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    View details →
                  </Link>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditTarget(cat); setModalOpen(true); }}
                      className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(cat)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSubmit={handleSubmit}
        category={editTarget}
        isSubmitting={createCategory.isPending || updateCategory.isPending}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Category"
        description={`Delete "${deleteTarget?.name}"? Expenses in this category will be affected. This cannot be undone.`}
        isDeleting={deleteCategory.isPending}
      />
    </div>
  );
}
