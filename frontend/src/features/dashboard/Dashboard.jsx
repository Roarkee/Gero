import { useProjects } from "../../api/queries/useProjects";
import { useAuthStore } from "../../store/authStore";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  DollarSign,
  Briefcase,
  FileText,
  ArrowUpRight,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

const mockData = [
  { name: "Jan", revenue: 4000 },
  { name: "Feb", revenue: 3000 },
  { name: "Mar", revenue: 2000 },
  { name: "Apr", revenue: 2780 },
  { name: "May", revenue: 1890 },
  { name: "Jun", revenue: 2390 },
  { name: "Jul", revenue: 3490 },
];

export default function Dashboard() {
  const { data: projects, isLoading } = useProjects();
  const { user } = useAuthStore();

  const activeProjects =
    projects?.filter((p) => p.status === "active")?.length || 0;
  // Mock stats for now since we don't have invoices/finance backend ready
  const totalRevenue = 12450;
  const pendingInvoices = 3;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="font-sans space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
          Welcome back, {user?.first_name || "User"} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl">
              <Briefcase className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12%
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Active Projects
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {activeProjects}
          </p>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-colors"></div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="flex items-center text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
              <TrendingUp className="w-3 h-3 mr-1" />
              +8%
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Total Revenue
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            ${totalRevenue.toLocaleString()}
          </p>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-orange-50 dark:bg-orange-900/30 rounded-xl">
              <FileText className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="flex items-center text-xs font-semibold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-lg">
              Pending
            </span>
          </div>
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            Invoices Pending
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
            {pendingInvoices}
          </p>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors"></div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Revenue Overview
            </h3>
            <select className="text-sm border-none bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-1 focus:ring-0 text-gray-600">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9CA3AF", fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Recent Projects
            </h3>
            <Link
              to="/projects"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
            >
              View All
            </Link>
          </div>

          <div className="space-y-4">
            {projects?.slice(0, 4).map((project) => (
              <Link
                key={project.id}
                to={`/board/${project.id}`}
                className="flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-2xl transition-colors group"
              >
                <div
                  className={`h-10 w-10 rounded-xl flex items-center justify-center text-sm font-bold mr-4 ${
                    [
                      "bg-blue-100 text-blue-600",
                      "bg-indigo-100 text-indigo-600",
                      "bg-purple-100 text-purple-600",
                    ][project.id % 3]
                  }`}
                >
                  {project.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-indigo-600 transition-colors">
                    {project.name}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    Updated {format(new Date(project.updated_at), "MMM d")}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 transition-colors" />
              </Link>
            ))}

            {(!projects || projects.length === 0) && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500">No projects yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
