import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FiPlus, FiTrendingUp, FiCalendar, FiTag } from "react-icons/fi";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../services/api";
import toast from "react-hot-toast";

const ExpensesPage = () => {
  const [expenses, setExpenses] = useState([]);
  const [stats, setStats] = useState({ monthly: 0, categories: [], trend: [] });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    description: "",
    amount: "",
    category: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, statsRes, categoriesRes] = await Promise.all([
        api.get("/expenses/"),
        api.get("/expenses/dashboard_stats/"),
        api.get("/expense-categories/"),
      ]);
      setExpenses(expensesRes.data.results || []);
      setStats(statsRes.data);
      setCategories(categoriesRes.data.results || []);
    } catch (error) {
      toast.error("Failed to fetch expenses data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post("/expenses/", newExpense);
      toast.success("Expense created successfully!");
      setShowCreateModal(false);
      setNewExpense({
        title: "",
        description: "",
        amount: "",
        category: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create expense");
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post("/expense-categories/", newCategory);
      toast.success("Category created successfully!");
      setShowCreateCategoryModal(false);
      setNewCategory({
        name: "",
        description: "",
        color: "#3B82F6",
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to create category");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600">
            Track and manage your business expenses
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateCategoryModal(true)}
            className="btn-secondary flex items-center"
          >
            <FiTag className="w-4 h-4 mr-2" />
            New Category
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
            disabled={categories.length === 0}
          >
            <FiPlus className="w-4 h-4 mr-2" />
            Add Expense
          </button>
        </div>
      </div>

      {/* No categories message */}
      {categories.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <FiTag className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800">
              You need to create at least one expense category before you can
              add expenses.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-500">
              <FiTrendingUp className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.monthly_expenses?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-500">
              <FiTag className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.category_expenses?.length || 0}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-500">
              <FiCalendar className="w-6 h-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Expenses
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {expenses.length}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Monthly Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.monthly_trend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, "Expenses"]} />
              <Bar dataKey="total" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Category Breakdown
          </h3>
          <div className="space-y-4">
            {stats.category_expenses?.map((category, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div
                    className="w-4 h-4 rounded-full mr-3"
                    style={{
                      backgroundColor: category.category__color || "#3B82F6",
                    }}
                  />
                  <span className="text-sm font-medium text-gray-900">
                    {category.category__name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ${category.total}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Expenses */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Expenses
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {expenses.slice(0, 10).map((expense, index) => (
                <motion.tr
                  key={expense.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {expense.title}
                    </div>
                    {expense.description && (
                      <div className="text-sm text-gray-500">
                        {expense.description}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {expense.category_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      ${expense.amount}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(expense.date).toLocaleDateString()}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Create Expense Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Add New Expense
            </h2>
            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  value={newExpense.title}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, title: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, amount: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, category: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    No categories available. Create one first.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, date: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      description: e.target.value,
                    })
                  }
                  className="input-field"
                  rows="3"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Expense
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Category Modal */}
      {showCreateCategoryModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Create Expense Category
            </h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory({ ...newCategory, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Office Supplies, Travel, Software"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, color: e.target.value })
                    }
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <span className="text-sm text-gray-500">
                    Choose a color for charts and visualization
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) =>
                    setNewCategory({
                      ...newCategory,
                      description: e.target.value,
                    })
                  }
                  className="input-field"
                  rows="3"
                  placeholder="Optional description for this category"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateCategoryModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Create Category
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default ExpensesPage;
