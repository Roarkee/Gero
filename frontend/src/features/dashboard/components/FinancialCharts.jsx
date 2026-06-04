import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = {
  draft: "#94a3b8",   // slate-400
  sent: "#3b82f6",    // blue-500
  overdue: "#ef4444", // red-500
  paid: "#10b981",    // emerald-500
};

export default function FinancialCharts({ financialSummary }) {
  if (!financialSummary) return null;

  const { revenue_vs_expenses, outstanding_invoice_breakdown } = financialSummary;

  // Transform pie chart data
  const pieData = Object.keys(outstanding_invoice_breakdown)
    .map((key) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: parseFloat(outstanding_invoice_breakdown[key]),
      key,
    }))
    .filter((item) => item.value > 0);

  // Format Y Axis for money
  const formatYAxis = (tickItem) => {
    if (tickItem >= 1000) {
      return `$${tickItem / 1000}k`;
    }
    return `$${tickItem}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Bar Chart - 6 Month Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
        <h3 className="font-bold text-gray-800 mb-6">Revenue vs Expenses (6 Mos)</h3>
        
        {revenue_vs_expenses?.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenue_vs_expenses}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month_name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={formatYAxis} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  formatter={(value) => [`$${value}`, undefined]}
                />
                <Legend iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                <Bar dataKey="revenue" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                <Bar dataKey="expenses" name="Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-400">
            No financial data available for the last 6 months.
          </div>
        )}
      </div>

      {/* Donut Chart - Invoice Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-6">Invoice Status</h3>
        
        {pieData.length > 0 ? (
          <div className="h-72 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.key] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value) => [`$${value}`, undefined]}
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  wrapperStyle={{fontSize: '12px'}}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-72 flex items-center justify-center text-gray-400 text-center">
            No invoices found.<br/>Create one to see the breakdown.
          </div>
        )}
      </div>
    </div>
  );
}
