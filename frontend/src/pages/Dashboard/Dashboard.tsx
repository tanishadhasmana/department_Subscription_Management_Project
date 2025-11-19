// frontend/src/pages/Dashboard/Dashboard.tsx
import React, { useEffect, useState } from "react";
import {
  getDashboardMetrics,
  getAllDepartments,
} from "../../services/dashboardService";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  IndianRupee,
  AlertCircle,
  Package,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { RingLoader } from "react-spinners";
import toast from "react-hot-toast";
// for multi select dropdown
import Select from "react-select";
import type {
  Department,
  Option,
  DashboardMetrics,
  AggregatedStatus,
  StatusOverviewSource,
  DetailedRow,
  DeptSpendItem,
} from "../../types/Dashboard";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // used to shwow loading spinner till data is fetched
  const [loading, setLoading] = useState(true);
  // state to hold the fetched metrics data from backend
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  // state to hold all departments for multiselect filter dropdown
  const [departments, setDepartments] = useState<Department[]>([]);

  // Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedDepartments, setSelectedDepartments] = useState<Option[]>([]);
  const [subscriptionType, setSubscriptionType] = useState("all");
  const [status, setStatus] = useState("all");

  const isFilterEmpty =
    !startDate &&
    !endDate &&
    selectedDepartments.length === 0 &&
    subscriptionType === "all" &&
    status === "all";

  const handleClearFilters = () => {
    setStartDate("");
    setEndDate("");
    setSelectedDepartments([]);
    setSubscriptionType("all");
    setStatus("all");
  };

  const loadDepartments = async () => {
    try {
      const data = await getAllDepartments();
      setDepartments(
        data.map((d: Department) => ({
          id: d.id,
          department_name: d.department_name,
        }))
      );
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
        departments: selectedDepartments.map((d) => d.value),
        subscriptionType:
          subscriptionType !== "all" ? subscriptionType : undefined,
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

  // date formating fucntion
  const formatDateTime = (isoString: string): string => {
    // creates js date obj of iso
    const date = new Date(isoString);
    // get day return day of month (1-31), 02 ensure 2 chars like 01,09 etc
    const day = date.getDate().toString().padStart(2, "0");
    // month as 0-11, so +1, pad to 2 chars
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    // return full year in number.
    const year = date.getFullYear();
    // get hours 0-23
    let hours = date.getHours();
    // get minutes 0-59, pad to 2 chars
    const minutes = date.getMinutes().toString().padStart(2, "0");
    // determine AM/PM
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12; // Convert 0 → 12

    return `${day}-${month}-${year}, ${hours}:${minutes} ${ampm}`;
  };

  // Runs once on mount to fetch departments and metrics
  useEffect(() => {
    loadDepartments();
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // triggered when apply filters button is clicked
  const handleApplyFilters = () => {
    loadMetrics();
  };
  // like for 1-HR, for 2-Finance etc
  const departmentOptions: Option[] = departments.map((d) => ({
    value: String(d.id),
    label: d.department_name,
  }));

  const COLORS = [
    "#3b82f6",
    "#ef4444",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
  ];

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
  // access to data returned by backend
  const { kpis, charts, detailedData } = metrics;

  // reduce loop through an arr and build single final arr, named acc to store final arr
  const aggregatedStatusData: AggregatedStatus[] = charts.statusOverview.reduce(
    (acc: AggregatedStatus[], curr: StatusOverviewSource) => {
      // check if dept already exists in acc
      const existing = acc.find(
        (item) => item.department_name === curr.department_name
      );
      // if exists, update the count only
      if (existing) {
        existing[curr.status] = curr.count;
      } else {
        // if not previously exists, add new obj to acc with dept name and status count
        acc.push({
          department_name: curr.department_name,
          [curr.status]: curr.count,
        });
      }
      return acc;
    },
    []
  );

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
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Department Multi-select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Departments
            </label>
            <Select
              isMulti
              options={departmentOptions}
              value={selectedDepartments}
              onChange={(selected) =>
                setSelectedDepartments(selected as Option[])
              }
              className="basic-multi-select"
              classNamePrefix="select"
              placeholder="Select departments"
            />
          </div>

          {/* Subscription Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Subscription Type
            </label>
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
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
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
        <div className="mt-4 flex justify-end gap-3">
          {/* Clear Button */}
          <button
            onClick={handleClearFilters}
            disabled={isFilterEmpty}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all
      ${
        isFilterEmpty
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : "bg-gray-200 text-gray-700 hover:bg-gray-300 cursor-pointer"
      }
    `}
          >
            Clear
          </button>

          {/* Apply Button */}
          <button
            onClick={handleApplyFilters}
            disabled={isFilterEmpty}
            className={`px-6 py-2.5 text-white rounded-lg font-medium transition-all shadow-lg
      ${
        isFilterEmpty
          ? "bg-blue-300 cursor-not-allowed"
          : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-blue-500/30 cursor-pointer"
      }
    `}
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
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                kpis.totalActiveSubscriptions.trend === "up"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {kpis.totalActiveSubscriptions.trend === "up" ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              {/* like if -10 etc so convert to 10, absolute */}
              {/* {kpis.totalActiveSubscriptions.percentage &&
                Math.abs(kpis.totalActiveSubscriptions.percentage)}
              % */}
              {Math.abs(kpis.totalActiveSubscriptions.percentage ?? 0)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {kpis.totalActiveSubscriptions.value}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Total Active Subscriptions
          </p>
        </div>

        {/* Total Spend */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <IndianRupee className="text-green-600" size={24} />
            </div>
            <div
              className={`flex items-center gap-1 text-sm font-medium ${
                kpis.totalSpend.trend === "up"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {kpis.totalSpend.trend === "up" ? (
                <TrendingUp size={16} />
              ) : (
                <TrendingDown size={16} />
              )}
              {Math.abs(kpis.totalSpend.percentage ?? 0)}%
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            ₹ {kpis.totalSpend.value.toLocaleString()}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Total Monthly/Annual Spend
          </p>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="text-orange-600" size={24} />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">
            {kpis.subscriptionsExpiringSoon.value}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Subscriptions Expiring Soon
          </p>
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
          <p className="text-sm text-gray-600 mt-1">
            Average Cost per Department
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department-wise Spend Distribution */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Department-wise Spend Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={charts.departmentSpendDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => {
                  const item = entry as unknown as DeptSpendItem;
                  return `${item.department_name} (${item.percentage.toFixed(
                    1
                  )}%)`;
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="total_spend"
              >
                {charts.departmentSpendDistribution.map((_, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString()}`}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Status Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Subscription Status Overview
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={aggregatedStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="department_name"
                angle={-45}
                textAnchor="end"
                height={100}
              />
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Top 5 Most Expensive Subscriptions
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={charts.topExpensive} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="subsc_name" type="category" width={150} />
              <Tooltip
                formatter={(value: number) => `₹${value.toLocaleString()}`}
              />
              <Bar dataKey="subsc_price" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Upcoming Renewals */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Upcoming Renewals (Next 60 Days)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={charts.upcomingRenewals}>
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="date"
                tickFormatter={(value) => formatDateTime(value)}
                angle={-45}
                textAnchor="end"
                height={80}
              />

              <YAxis />
              <Tooltip labelFormatter={(value) => formatDateTime(value)} />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#3b82f6"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table Preview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Recent Subscriptions
          </h3>
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Subscription Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Renewal Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {detailedData.map((item: DetailedRow) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.subsc_name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {item.department_name}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateTime(item.renew_date)}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        item.subsc_status === "Active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
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
