// frontend/src/pages/Dashboard/Dashboard.tsx
import React, { useEffect, useState } from "react";
import { getDashboardMetrics, getAllDepartments } from "../../services/dashboardService";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle, Package } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
import { RingLoader } from "react-spinners";
import toast from "react-hot-toast";
import Select from "react-select";
import type {
  Department,
  Option,
  DashboardMetrics,
  AggregatedStatus,
  StatusOverviewSource,
  DetailedRow,
  DeptSpendItem
} from "../../types/Dashboard";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<Option[]>([]);
  const [subscriptionType, setSubscriptionType] = useState("all");
  const [status, setStatus] = useState("all");

  const loadDepartments = async () => {
    try {
      const data = await getAllDepartments();
      setDepartments(data.map((d: Department) => ({
        id: d.id,
        department_name: d.department_name,
      })));
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      toast.error("Failed to load departments");
    }
  };

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const filters = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        departments: selectedDepartments.map(d => d.value),
        subscriptionType: subscriptionType !== "all" ? subscriptionType : undefined,
        status: status !== "all" ? status : undefined,
      };

      const data = await getDashboardMetrics(filters);
      setMetrics(data);
    } catch (err: unknown) {
      console.error("Failed to fetch metrics:", err);
      toast.error("Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    loadMetrics();
  };

  const departmentOptions: Option[] = departments.map(d => ({
    value: String(d.id),
    label: d.department_name,
  }));

  const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <RingLoader size={80} color="#3b82f6" />
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const { kpis, charts, detailedData } = metrics;

  // Transform statusOverview data for the chart
  const aggregatedStatusData: AggregatedStatus[] = charts.statusOverview.reduce((acc: AggregatedStatus[], curr: StatusOverviewSource) => {
    const existing = acc.find(item => item.department_name === curr.department_name);
    if (existing) {
      existing[curr.status] = curr.count;
    } else {
      acc.push({
        department_name: curr.department_name,
        [curr.status]: curr.count,
      });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Subscription Management Overview</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Range */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Multi-select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Departments</label>
            <Select
              isMulti
              options={departmentOptions}
              value={selectedDepartments}
              onChange={(selected) => setSelectedDepartments(selected as Option[])}
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Select departments"
            />
          </div>

          {/* Subscription Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Subscription Type</label>
            <select
              value={subscriptionType}
              onChange={(e) => setSubscriptionType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="Monthly">Monthly</option>
              <option value="Yearly">Yearly</option>
              <option value="Lifetime">Lifetime</option>
            </select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleApplyFilters}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 font-medium cursor-pointer"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Active Subscriptions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="text-blue-600" size={24} />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${kpis.totalActiveSubscriptions.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {kpis.totalActiveSubscriptions.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {kpis.totalActiveSubscriptions.percentage && Math.abs(kpis.totalActiveSubscriptions.percentage)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{kpis.totalActiveSubscriptions.value}</h3>
          <p className="text-sm text-gray-600 mt-1">Total Active Subscriptions</p>
        </div>

        {/* Total Spend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="text-green-600" size={24} />
            </div>
            <div className={`flex items-center gap-1 text-sm font-medium ${kpis.totalSpend.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
              {kpis.totalSpend.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {kpis.totalSpend.percentage && Math.abs(kpis.totalSpend.percentage)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">₹ {kpis.totalSpend.value.toLocaleString()}</h3>
          <p className="text-sm text-gray-600 mt-1">Total Monthly/Annual Spend</p>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="text-orange-600" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{kpis.subscriptionsExpiringSoon.value}</h3>
          <p className="text-sm text-gray-600 mt-1">Subscriptions Expiring Soon</p>
          <p className="text-xs text-gray-500 mt-1">(Next 30 Days)</p>
        </div>

        {/* Average Cost */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="text-purple-600" size={24} />
            </div>
            <button
              onClick={() => navigate("/subscription")}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
            >
              View Details →
            </button>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ₹ {kpis.averageCostPerDepartment?.value.toLocaleString() ?? 0}
          </h3>
          <p className="text-sm text-gray-600 mt-1">Average Cost per Department</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Spend Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Department-wise Spend Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={charts.departmentSpendDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => {
                  const item = entry as unknown as DeptSpendItem;
                  return `${item.department_name} (${item.percentage.toFixed(1)}%)`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="total_spend"
              >
                {charts.departmentSpendDistribution.map((_, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Subscription Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aggregatedStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department_name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Active" fill="#10b981" />
              <Bar dataKey="Inactive" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* More Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Expensive */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Most Expensive Subscriptions</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.topExpensive} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="subsc_name" type="category" width={150} />
              <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
              <Bar dataKey="subsc_price" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Renewals (Next 60 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.upcomingRenewals}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Recent Subscriptions</h3>
          <button
            onClick={() => navigate("/subscription")}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
          >
            View All →
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subscription Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Renewal Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {detailedData.map((item: DetailedRow) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{item.subsc_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.department_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.renew_date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      item.subsc_status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {item.subsc_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;






// // frontend/src/pages/Dashboard/Dashboard.tsx
// import React, { useEffect, useState } from "react";
// import { getDashboardMetrics, getAllDepartments } from "../../services/dashboardService";
// import { useNavigate } from "react-router-dom";
// import { TrendingUp, TrendingDown, Calendar, DollarSign, AlertCircle, Package } from "lucide-react";
// import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from "recharts";
// import { RingLoader } from "react-spinners";
// import toast from "react-hot-toast";
// import Select from "react-select";

// interface Department {
//   id: number;
//   department_name: string;
// }

// const Dashboard: React.FC = () => {
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(true);
//   const [metrics, setMetrics] = useState<any>(null);
//   const [departments, setDepartments] = useState<Department[]>([]);

//   // Filters
//   const [startDate, setStartDate] = useState("");
//   const [endDate, setEndDate] = useState("");
//   const [selectedDepartments, setSelectedDepartments] = useState<{ value: string; label: string }[]>([]);
//   const [subscriptionType, setSubscriptionType] = useState("all");
//   const [status, setStatus] = useState("all");

//   const loadDepartments = async () => {
//     try {
//       const data = await getAllDepartments();
//       setDepartments(data.map((d: any) => ({
//         id: d.id,
//         department_name: d.department_name,
//       })));
//     } catch (err) {
//       console.error("Failed to fetch departments:", err);
//       toast.error("Failed to load departments");
//     }
//   };

//   const loadMetrics = async () => {
//     try {
//       setLoading(true);
//       const filters = {
//         startDate: startDate || undefined,
//         endDate: endDate || undefined,
//         departments: selectedDepartments.map(d => d.value),
//         subscriptionType: subscriptionType !== "all" ? subscriptionType : undefined,
//         status: status !== "all" ? status : undefined,
//       };

//       const data = await getDashboardMetrics(filters);
//       setMetrics(data);
//     } catch (err: any) {
//       console.error("Failed to fetch metrics:", err);
//       toast.error("Failed to load dashboard metrics");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadDepartments();
//     loadMetrics();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, []);

//   const handleApplyFilters = () => {
//     loadMetrics();
//   };

//   const departmentOptions = departments.map(d => ({
//     value: String(d.id),
//     label: d.department_name,
//   }));

//   const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"];

//   if (loading) {
//     return (
//       <div className="min-h-screen flex justify-center items-center">
//         <RingLoader size={80} color="#3b82f6" />
//       </div>
//     );
//   }

//   if (!metrics) {
//     return (
//       <div className="min-h-screen flex justify-center items-center">
//         <p className="text-gray-500">No data available</p>
//       </div>
//     );
//   }

//   const { kpis, charts, detailedData } = metrics;

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div>
//         <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
//         <p className="text-gray-600 mt-1">Subscription Management Overview</p>
//       </div>

//       {/* Filters */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//         <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//           {/* Date Range */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">Start Date</label>
//             <input
//               type="date"
//               value={startDate}
//               onChange={(e) => setStartDate(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">End Date</label>
//             <input
//               type="date"
//               value={endDate}
//               onChange={(e) => setEndDate(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           {/* Department Multi-select */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">Departments</label>
//             <Select
//               isMulti
//               options={departmentOptions}
//               value={selectedDepartments}
//               onChange={(selected) => setSelectedDepartments(selected as any)}
//               className="basic-multi-select"
//               classNamePrefix="select"
//               placeholder="Select departments"
//             />
//           </div>

//           {/* Subscription Type */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">Subscription Type</label>
//             <select
//               value={subscriptionType}
//               onChange={(e) => setSubscriptionType(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All Types</option>
//               <option value="Monthly">Monthly</option>
//               <option value="Yearly">Yearly</option>
//               <option value="Lifetime">Lifetime</option>
//             </select>
//           </div>

//           {/* Status */}
//           <div className="space-y-2">
//             <label className="block text-sm font-medium text-gray-700">Status</label>
//             <select
//               value={status}
//               onChange={(e) => setStatus(e.target.value)}
//               className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
//             >
//               <option value="all">All Status</option>
//               <option value="active">Active</option>
//               <option value="inactive">Inactive</option>
//             </select>
//           </div>
//         </div>
//         <div className="mt-4 flex justify-end">
//           <button
//             onClick={handleApplyFilters}
//             className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 font-medium cursor-pointer"
//           >
//             Apply Filters
//           </button>
//         </div>
//       </div>

//       {/* KPIs */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {/* Total Active Subscriptions */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-3 bg-blue-100 rounded-lg">
//               <Package className="text-blue-600" size={24} />
//             </div>
//             <div className={`flex items-center gap-1 text-sm font-medium ${kpis.totalActiveSubscriptions.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
//               {kpis.totalActiveSubscriptions.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
//               {Math.abs(kpis.totalActiveSubscriptions.percentage)}%
//             </div>
//           </div>
//           <h3 className="text-2xl font-bold text-gray-900">{kpis.totalActiveSubscriptions.value}</h3>
//           <p className="text-sm text-gray-600 mt-1">Total Active Subscriptions</p>
//         </div>

//         {/* Total Spend */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-3 bg-green-100 rounded-lg">
//               <DollarSign className="text-green-600" size={24} />
//             </div>
//             <div className={`flex items-center gap-1 text-sm font-medium ${kpis.totalSpend.trend === 'up' ? 'text-red-600' : 'text-green-600'}`}>
//               {kpis.totalSpend.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
//               {Math.abs(kpis.totalSpend.percentage)}%
//             </div>
//           </div>
//           <h3 className="text-2xl font-bold text-gray-900">₹ {kpis.totalSpend.value.toLocaleString()}</h3>
//           <p className="text-sm text-gray-600 mt-1">Total Monthly/Annual Spend</p>
//         </div>

//         {/* Expiring Soon */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-3 bg-orange-100 rounded-lg">
//               <AlertCircle className="text-orange-600" size={24} />
//             </div>
//           </div>
//           <h3 className="text-2xl font-bold text-gray-900">{kpis.subscriptionsExpiringSoon.value}</h3>
//           <p className="text-sm text-gray-600 mt-1">Subscriptions Expiring Soon</p>
//           <p className="text-xs text-gray-500 mt-1">(Next 30 Days)</p>
//         </div>

//         {/* Average Cost */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
//           <div className="flex items-center justify-between mb-4">
//             <div className="p-3 bg-purple-100 rounded-lg">
//               <Calendar className="text-purple-600" size={24} />
//             </div>
//             <button
//               onClick={() => navigate("/subscription")}
//               className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
//             >
//               View Details →
//             </button>
//           </div>
//           <h3 className="text-2xl font-bold text-gray-900">₹ {kpis.averageCostPerDepartment.value.toLocaleString()}</h3>
//           <p className="text-sm text-gray-600 mt-1">Average Cost per Department</p>
//         </div>
//       </div>

//       {/* Charts Section */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Department-wise Spend Distribution */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">Department-wise Spend Distribution</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <PieChart>
//               <Pie
//                 data={charts.departmentSpendDistribution}
//                 cx="50%"
//                 cy="50%"
//                 labelLine={false}
//                 label={(entry) => `${entry.department_name} (${entry.percentage.toFixed(1)}%)`}
//                 outerRadius={100}
//                 fill="#8884d8"
//                 dataKey="total_spend"
//               >
//                 {charts.departmentSpendDistribution.map((_: any, index: number) => (
//                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                 ))}
//               </Pie>
//               <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
//             </PieChart>
//           </ResponsiveContainer>
//         </div>

//         {/* Status Overview */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">Subscription Status Overview</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart
//               data={charts.statusOverview.reduce((acc: any[], curr: any) => {
//                 const existing = acc.find(item => item.department_name === curr.department_name);
//                 if (existing) {
//                   existing[curr.status] = curr.count;
//                 } else {
//                   acc.push({
//                     department_name: curr.department_name,
//                     [curr.status]: curr.count,
//                   });
//                 }
//                 return acc;
//               }, [])}
//             >
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="department_name" angle={-45} textAnchor="end" height={100} />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Bar dataKey="Active" fill="#10b981" />
//               <Bar dataKey="Inactive" fill="#ef4444" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* More Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Top 5 Expensive */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Most Expensive Subscriptions</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={charts.topExpensive} layout="vertical">
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis type="number" />
//               <YAxis dataKey="subsc_name" type="category" width={150} />
//               <Tooltip formatter={(value: number) => `₹${value.toLocaleString()}`} />
//               <Bar dataKey="subsc_price" fill="#3b82f6" />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>

//         {/* Upcoming Renewals */}
//         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//           <h3 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Renewals (Next 60 Days)</h3>
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={charts.upcomingRenewals}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
//               <YAxis />
//               <Tooltip />
//               <Legend />
//               <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </div>

//       {/* Detailed Table Preview */}
//       <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold text-gray-800">Recent Subscriptions</h3>
//           <button
//             onClick={() => navigate("/subscription")}
//             className="text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
//           >
//             View All →
//           </button>
//         </div>
//         <div className="overflow-x-auto">
//           <table className="w-full">
//             <thead>
//               <tr className="bg-gray-50 border-b border-gray-200">
//                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subscription Name</th>
//                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Department</th>
//                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Renewal Date</th>
//                 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200">
//               {detailedData.map((item: any) => (
//                 <tr key={item.id} className="hover:bg-gray-50">
//                   <td className="px-6 py-4 text-sm text-gray-900">{item.subsc_name}</td>
//                   <td className="px-6 py-4 text-sm text-gray-600">{item.department_name}</td>
//                   <td className="px-6 py-4 text-sm text-gray-600">{item.renew_date}</td>
//                   <td className="px-6 py-4">
//                     <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
//                       item.subsc_status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                     }`}>
//                       {item.subsc_status}
//                     </span>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
