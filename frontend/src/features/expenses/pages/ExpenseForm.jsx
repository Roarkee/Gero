import React, { useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { ArrowLeft, Save } from "lucide-react";
import { useExpenses } from "../hooks/useExpenses";
import { useExpense } from "../hooks/useExpense";
import { useExpenseCategories } from "../hooks/useExpenseCategories";
import { useQuery } from "@tanstack/react-query";
import api from "../../../api/client";
import { API_ENDPOINTS } from "../../../api/endpoints";
import toast from "react-hot-toast";

function FieldError({ message }) {
  if (!message) return null;
  return <p className="text-xs text-rose-500 mt-1">{message}</p>;
}

function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      {children}
      <FieldError message={error?.message} />
    </div>
  );
}

const inputClass =
  "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors";

export default function ExpenseForm() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!expenseId;

  const { expense, isLoading: loadingExpense, updateExpense } = useExpense(expenseId);
  const { createExpense } = useExpenses();
  const { categories } = useExpenseCategories();

  const projectsQuery = useQuery({
    queryKey: ["projects", "list-simple"],
    queryFn: async () => {
      const res = await api.get(API_ENDPOINTS.PROJECTS);
      const raw = res.data;
      return raw?.results ?? (Array.isArray(raw) ? raw : []);
    },
  });
  const projects = projectsQuery.data ?? [];

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      title: "",
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      project: "",
      receipt_url: "",
      is_recurring: false,
    },
  });

  useEffect(() => {
    if (isEdit && expense) {
      reset({
        title: expense.title ?? "",
        description: expense.description ?? "",
        amount: expense.amount ?? "",
        date: expense.date ?? "",
        category: expense.category ?? "",
        project: expense.project ?? "",
        receipt_url: expense.receipt_url ?? "",
        is_recurring: expense.is_recurring ?? false,
      });
    }
  }, [isEdit, expense, reset]);

  const onSubmit = async (data) => {
    // Strip empty project so backend accepts null
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
      project: data.project || null,
    };

    const handleErrors = (err) => {
      const respData = err?.response?.data;
      if (respData && typeof respData === "object") {
        Object.entries(respData).forEach(([field, messages]) => {
          const msg = Array.isArray(messages) ? messages[0] : messages;
          setError(field, { message: msg });
        });
        toast.error("Please fix the errors below.");
      } else {
        toast.error("An unexpected error occurred.");
      }
    };

    if (isEdit) {
      updateExpense.mutate(payload, {
        onSuccess: () => {
          toast.success("Expense updated");
          navigate(`/expenses/${expenseId}`);
        },
        onError: handleErrors,
      });
    } else {
      createExpense.mutate(payload, {
        onSuccess: (res) => {
          toast.success("Expense created");
          navigate(`/expenses/${res.data.id}`);
        },
        onError: handleErrors,
      });
    }
  };

  if (isEdit && loadingExpense) {
    return <div className="p-12 text-center text-gray-400 animate-pulse">Loading expense...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to={isEdit ? `/expenses/${expenseId}` : "/expenses/list"}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEdit ? "Edit Expense" : "New Expense"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isEdit ? "Update the expense details below." : "Fill in the details to record a new expense."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 space-y-6">
        <FormField label="Title" required error={errors.title}>
          <input
            type="text"
            placeholder="e.g. AWS hosting bill"
            {...register("title", { required: "Title is required" })}
            className={inputClass}
          />
        </FormField>

        <FormField label="Description" error={errors.description}>
          <textarea
            rows={3}
            placeholder="Optional notes..."
            {...register("description")}
            className={`${inputClass} resize-none`}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Amount" required error={errors.amount}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">GH₵</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("amount", { required: "Amount is required", min: { value: 0.01, message: "Must be > 0" } })}
                className={`${inputClass} pl-7`}
              />
            </div>
          </FormField>

          <FormField label="Date" required error={errors.date}>
            <input
              type="date"
              {...register("date", { required: "Date is required" })}
              className={inputClass}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Category" required error={errors.category}>
            <select
              {...register("category", { required: "Category is required" })}
              className={inputClass}
            >
              <option value="">Select category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Project" error={errors.project}>
            <select {...register("project")} className={inputClass}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Receipt URL" error={errors.receipt_url}>
          <input
            type="url"
            placeholder="https://..."
            {...register("receipt_url")}
            className={inputClass}
          />
        </FormField>

        <div className="flex items-center gap-3 py-2">
          <input
            type="checkbox"
            id="is_recurring"
            {...register("is_recurring")}
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="is_recurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Recurring expense
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            to={isEdit ? `/expenses/${expenseId}` : "/expenses/list"}
            className="flex-1 text-center px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                {isEdit ? "Save Changes" : "Create Expense"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
