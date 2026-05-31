import React, { useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, Save, CalendarDays, Info } from "lucide-react";
import { useBudgets } from "../hooks/useBudgets";
import { useExpenseCategories } from "../hooks/useExpenseCategories";
import toast from "react-hot-toast";
import { format, addDays, addWeeks, addMonths, addYears, endOfMonth, endOfQuarter, endOfYear, startOfMonth } from "date-fns";

const inputClass =
  "w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors";

const PERIODS = [
  { value: "daily",       label: "Daily" },
  { value: "weekly",      label: "Weekly (7 days)" },
  { value: "fortnightly", label: "Fortnightly (14 days)" },
  { value: "monthly",     label: "Monthly (calendar month)" },
  { value: "quarterly",   label: "Quarterly (3 months)" },
  { value: "yearly",      label: "Yearly (calendar year)" },
];

const PERIOD_HINTS = {
  daily:       "Budget resets daily.",
  weekly:      "Must span exactly 7 days. End date is auto-calculated.",
  fortnightly: "Must span exactly 14 days. End date is auto-calculated.",
  monthly:     "Must cover exactly one calendar month. Pick the 1st of a month.",
  quarterly:   "Must span exactly one quarter (3 months).",
  yearly:      "Must span exactly one calendar year.",
};

/**
 * Calculate end date from period + start date using the same logic as Django's model.clean().
 * Returns ISO date string or null if start is invalid.
 */
function calcEndDate(period, startStr) {
  if (!startStr || !period) return null;
  const start = new Date(startStr + "T00:00:00");
  if (isNaN(start.getTime())) return null;

  let end;
  switch (period) {
    case "daily":
      end = start;
      break;
    case "weekly":
      end = addDays(start, 6);
      break;
    case "fortnightly":
      end = addDays(start, 13);
      break;
    case "monthly":
      // Snap start to first of month, end to last day of that month
      end = endOfMonth(start);
      break;
    case "quarterly":
      end = endOfQuarter(start);
      break;
    case "yearly":
      end = endOfYear(start);
      break;
    default:
      return null;
  }
  return format(end, "yyyy-MM-dd");
}

/**
 * For monthly budgets, snap start date to first of the month automatically.
 */
function snapStartDate(period, startStr) {
  if (!startStr) return startStr;
  if (period === "monthly") {
    const d = new Date(startStr + "T00:00:00");
    if (!isNaN(d.getTime())) {
      return format(startOfMonth(d), "yyyy-MM-dd");
    }
  }
  return startStr;
}

export default function BudgetForm() {
  const navigate = useNavigate();
  const { createBudget } = useBudgets();
  const { categories } = useExpenseCategories();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      category: "",
      period: "monthly",
      amount: "",
      start_date: format(startOfMonth(new Date()), "yyyy-MM-dd"),
      end_date: format(endOfMonth(new Date()), "yyyy-MM-dd"),
    },
  });

  const period = useWatch({ control, name: "period" });
  const startDate = useWatch({ control, name: "start_date" });

  // Auto-calculate end date whenever period or start date changes
  useEffect(() => {
    const snappedStart = snapStartDate(period, startDate);
    if (snappedStart !== startDate) {
      setValue("start_date", snappedStart);
    }
    const end = calcEndDate(period, snappedStart ?? startDate);
    if (end) setValue("end_date", end);
  }, [period, startDate, setValue]);

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      amount: parseFloat(data.amount),
    };

    createBudget.mutate(payload, {
      onSuccess: (res) => {
        toast.success("Budget created");
        navigate(`/expenses/budgets/${res.data.id}`);
      },
      onError: (err) => {
        const respData = err?.response?.data;
        if (respData && typeof respData === "object") {
          // Map backend field errors
          Object.entries(respData).forEach(([field, messages]) => {
            const msg = Array.isArray(messages) ? messages[0] : messages;
            // non_field_errors comes from model.clean()
            if (field === "non_field_errors") {
              setError("start_date", { message: msg });
            } else {
              setError(field, { message: msg });
            }
          });
          toast.error("Please fix the errors below.");
        } else {
          toast.error("An unexpected error occurred.");
        }
      },
    });
  };

  const endDateDisplay = useWatch({ control, name: "end_date" });
  const formattedEnd = endDateDisplay
    ? format(new Date(endDateDisplay + "T00:00:00"), "MMMM d, yyyy")
    : "—";
  const formattedStart = startDate
    ? format(new Date(startDate + "T00:00:00"), "MMMM d, yyyy")
    : "—";

  return (
    <div className="max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-3 mb-8">
        <Link
          to="/expenses/budgets"
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Budget</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Set a spending limit for a category.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 space-y-6"
      >
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Category <span className="text-rose-500">*</span>
          </label>
          <select
            {...register("category", { required: "Category is required" })}
            className={inputClass}
          >
            <option value="">Select a category...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {errors.category && (
            <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Budget Amount <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              {...register("amount", {
                required: "Budget amount is required",
                min: { value: 0.01, message: "Amount must be greater than 0" },
              })}
              className={`${inputClass} pl-7`}
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>
          )}
        </div>

        {/* Period */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Period <span className="text-rose-500">*</span>
          </label>
          <select
            {...register("period", { required: "Period is required" })}
            className={inputClass}
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          {period && (
            <div className="flex items-start gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-indigo-400" />
              {PERIOD_HINTS[period]}
            </div>
          )}
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Start Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            {...register("start_date", { required: "Start date is required" })}
            className={inputClass}
          />
          {errors.start_date && (
            <p className="text-xs text-rose-500 mt-1">{errors.start_date.message}</p>
          )}
        </div>

        {/* Auto-calculated End Date preview */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-indigo-500" />
            <h4 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              Budget Period Preview
            </h4>
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <div>
              <p className="text-xs text-indigo-500/70 dark:text-indigo-400/70 mb-1 uppercase tracking-wider">
                Start
              </p>
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                {formattedStart}
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <div className="h-px bg-indigo-300 dark:bg-indigo-700 flex-1" />
                <span className="text-xs text-indigo-400 font-medium px-2 bg-indigo-50 dark:bg-indigo-900/20">
                  {PERIOD_LABELS_SHORT[period] ?? period}
                </span>
                <div className="h-px bg-indigo-300 dark:bg-indigo-700 flex-1" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-indigo-500/70 dark:text-indigo-400/70 mb-1 uppercase tracking-wider">
                End (auto)
              </p>
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-100">
                {formattedEnd}
              </p>
            </div>
          </div>
          {/* Hidden end_date field — submitted but read-only */}
          <input type="hidden" {...register("end_date")} />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            to="/expenses/budgets"
            className="flex-1 text-center px-4 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl font-medium transition-colors text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || createBudget.isPending}
            className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {createBudget.isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Create Budget
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const PERIOD_LABELS_SHORT = {
  daily: "1 day",
  weekly: "7 days",
  fortnightly: "14 days",
  monthly: "1 month",
  quarterly: "1 quarter",
  yearly: "1 year",
};
