import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  FiDollarSign,
  FiTrendingUp,
  FiUsers,
  FiAlertCircle,
  FiFolder,
  FiClock,
} from "react-icons/fi";
import api from "../services/api";

const Dashboard = () => {
  const [stats, setStats] = useState({
    revenue: {
      total_revenue: 0,
      monthly_revenue: 0,
      unpaid_invoices: 0,
      overdue_count: 0,
    },
    expenses: { monthly_expenses: 0, category_expenses: [], monthly_trend: [] },
    projects: { total: 0, active: 0, completed: 0 },
    clients: { total: 0, active: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch basic data first, then try dashboard stats
      const [projectsRes, clientsRes] = await Promise.all([
        api.get("/projects/"),
        api.get("/client/"),
      ]);

      let revenueData = {
        total_revenue: 0,
        monthly_revenue: 0,
        unpaid_invoices: 0,
        overdue_count: 0,
      };
      let expensesData = {
        monthly_expenses: 0,
        category_expenses: [],
        monthly_trend: [],
      };

      // Try to fetch dashboard stats, but don't fail if they don't exist
      try {
        const revenueRes = await api.get("/invoices/dashboard_stats/");
        revenueData = revenueRes.data;
      } catch (error) {
        console.log("Invoice stats not available:", error.response?.status);
      }

      try {
        const expensesRes = await api.get("/expenses/dashboard_stats/");
        expensesData = expensesRes.data;
      } catch (error) {
        console.log("Expense stats not available:", error.response?.status);
      }

      setStats({
        revenue: revenueData,
        expenses: expensesData,
        projects: {
          total: projectsRes.data.results?.length || 0,
          active:
            projectsRes.data.results?.filter((p) => p.status === "active")
              .length || 0,
          completed:
            projectsRes.data.results?.filter((p) => p.completed).length || 0,
        },
        clients: {
          total: clientsRes.data.results?.length || 0,
          active:
            clientsRes.data.results?.filter((c) => c.status === "active")
              .length || 0,
        },
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-full ${color} flex-shrink-0`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">
          Welcome back! Here's what's happening with your business.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={`$${(stats.revenue.total_revenue || 0).toLocaleString()}`}
          icon={FiDollarSign}
          color="bg-green-500"
          subtitle="All time earnings"
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${(stats.revenue.monthly_revenue || 0).toLocaleString()}`}
          icon={FiTrendingUp}
          color="bg-blue-500"
          subtitle="This month"
        />
        <StatCard
          title="Active Projects"
          value={stats.projects.active}
          icon={FiFolder}
          color="bg-purple-500"
          subtitle={`${stats.projects.total} total projects`}
        />
        <StatCard
          title="Active Clients"
          value={stats.clients.active}
          icon={FiUsers}
          color="bg-indigo-500"
          subtitle={`${stats.clients.total} total clients`}
        />
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Alerts & Notifications
          </h3>
          <div className="space-y-3">
            {stats.revenue.overdue_count > 0 && (
              <div className="flex items-center p-3 bg-red-50 rounded-lg">
                <FiAlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    {stats.revenue.overdue_count} overdue invoice
                    {stats.revenue.overdue_count > 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-red-600">
                    Requires immediate attention
                  </p>
                </div>
              </div>
            )}

            {stats.revenue.unpaid_invoices > 0 && (
              <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                <FiDollarSign className="w-5 h-5 text-yellow-500 mr-3 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    ${(stats.revenue.unpaid_invoices || 0).toLocaleString()} in
                    unpaid invoices
                  </p>
                  <p className="text-xs text-yellow-600">
                    Follow up with clients
                  </p>
                </div>
              </div>
            )}

            {stats.revenue.overdue_count === 0 &&
              stats.revenue.unpaid_invoices === 0 && (
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <FiTrendingUp className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      All caught up!
                    </p>
                    <p className="text-xs text-green-600">
                      No urgent items need attention
                    </p>
                  </div>
                </div>
              )}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Overview
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-600">Total Projects</span>
              <span className="font-semibold text-gray-900">
                {stats.projects.total}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100">
              <span className="text-gray-600">Completed Projects</span>
              <span className="font-semibold text-gray-900">
                {stats.projects.completed}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100">
              <span className="text-gray-600">Total Clients</span>
              <span className="font-semibold text-gray-900">
                {stats.clients.total}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-t border-gray-100">
              <span className="text-gray-600">Monthly Expenses</span>
              <span className="font-semibold text-gray-900">
                ${(stats.expenses.monthly_expenses || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {/* Generate activity from existing data */}
          {stats.projects.total > 0 && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <FiFolder className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  You have{" "}
                  <span className="font-medium">
                    {stats.projects.active} active projects
                  </span>
                </p>
                <p className="text-xs text-gray-500">Project management</p>
              </div>
              <span className="text-xs text-gray-400">Today</span>
            </div>
          )}

          {stats.clients.total > 0 && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <FiUsers className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  You have{" "}
                  <span className="font-medium">
                    {stats.clients.total} clients
                  </span>{" "}
                  in your system
                </p>
                <p className="text-xs text-gray-500">Client management</p>
              </div>
              <span className="text-xs text-gray-400">Today</span>
            </div>
          )}

          {stats.revenue.total_revenue > 0 && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiDollarSign className="w-4 h-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Total revenue:{" "}
                  <span className="font-medium">
                    ${stats.revenue.total_revenue.toLocaleString()}
                  </span>
                </p>
                <p className="text-xs text-gray-500">Financial overview</p>
              </div>
              <span className="text-xs text-gray-400">Updated</span>
            </div>
          )}

          {stats.expenses.monthly_expenses > 0 && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <FiTrendingUp className="w-4 h-4 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">
                  Monthly expenses:{" "}
                  <span className="font-medium">
                    ${stats.expenses.monthly_expenses.toLocaleString()}
                  </span>
                </p>
                <p className="text-xs text-gray-500">Expense tracking</p>
              </div>
              <span className="text-xs text-gray-400">This month</span>
            </div>
          )}

          {/* Show placeholder if no activity */}
          {stats.projects.total === 0 &&
            stats.clients.total === 0 &&
            stats.revenue.total_revenue === 0 && (
              <div className="text-center py-8">
                <FiClock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No activity yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  Start by creating clients and projects to see activity here
                </p>
              </div>
            )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
