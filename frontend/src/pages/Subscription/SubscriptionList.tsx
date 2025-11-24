import React, { useEffect, useState, useCallback } from "react";
import {
  getSubscriptions,
  deleteSubscription,
  exportSubscriptionsCSV,
} from "../../services/subscriptionService";
import type { Subscription } from "../../types/Subscription";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import Pagination from "../../components/common/Pagination";
import { RingLoader } from "react-spinners";
import { motion } from "framer-motion";
import { confirmAlert } from "react-confirm-alert";

const SubscriptionList: React.FC = () => {
  // ==================== STATE ====================
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Sorting
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const nav = useNavigate();

  // ==================== FUNCTIONS ====================

  /**
   * Load subscriptions from API
   */
  const loadSubscriptions = useCallback(
    async (pageNum: number) => {
      try {
        setLoading(true);

        const params = {
          page: pageNum,
          limit,
          sortBy,
          sortOrder,
          search:
            searchTerm && searchTerm.trim() !== ""
              ? searchTerm.trim()
              : undefined,
        };

        const response = await getSubscriptions(params);
        setSubscriptions(response.subscriptions || []);
        setTotalSubscriptions(response.total || 0);
        setTotalPages(response.totalPages ?? 1);
      } catch (err) {
        console.error("Error fetching subscriptions:", err);
        toast.error("Failed to load subscriptions");
      } finally {
        setLoading(false);
      }
    },
    [limit, sortBy, sortOrder, searchTerm]
  );

  /**
   * Handle search button click or Enter key press
   */
  const handleSearch = () => {
    setCurrentPage(1);
    loadSubscriptions(1);
  };

  /**
   * Handle Enter key in search input
   */
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  /**
   * Clear search and reload
   */
  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
  };

  /**
   * Handle delete confirmation
   */
  const handleDeleteConfirmed = async (id: number, onClose?: () => void) => {
    try {
      await deleteSubscription(id);
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
      toast.success("Subscription deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete subscription");
    } finally {
      if (onClose) onClose();
    }
  };

  /**
   * Show delete confirmation dialog
   */
  const confirmDelete = (id: number) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
              Delete Subscription?
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConfirmed(id, onClose)}
                className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ),
    });
  };

  /**
   * Handle column sort
   */
  const handleSort = (columnKey: string) => {
    const newOrder: "asc" | "desc" =
      sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(columnKey);
    setSortOrder(newOrder);
  };

  /**
   * Export to CSV
   */
  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const res = await exportSubscriptionsCSV();
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "subscriptions_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Subscriptions exported successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export subscriptions");
    } finally {
      setExporting(false);
    }
  };

  // ==================== EFFECTS ====================

  /**
   * Load subscriptions on mount and when dependencies change
   */
  useEffect(() => {
    loadSubscriptions(currentPage);
  }, [currentPage, limit, sortBy, sortOrder, loadSubscriptions]);


  // ==================== RENDER COMPONENTS ====================

  const SortArrow = ({ column }: { column: string }) => (
    <span className="inline-flex flex-col items-center ml-1 leading-none">
      <span
        className={`text-[10px] ${
          sortBy === column && sortOrder === "asc"
            ? "text-blue-600"
            : "text-gray-300"
        }`}
      >
        ▲
      </span>
      <span className="h-[1px]" />
      <span
        className={`text-[10px] ${
          sortBy === column && sortOrder === "desc"
            ? "text-blue-600"
            : "text-gray-300"
        }`}
      >
        ▼
      </span>
    </span>
  );

  // ==================== RENDER ====================

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Subscriptions</h2>
            <p className="text-gray-600 mt-1">Manage company subscriptions</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Search Box */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
              <button
                onClick={handleSearch}
                disabled={!searchTerm.trim()}
                className={`px-4 py-2 rounded-lg transition-all ${
                  searchTerm.trim()
                    ? "bg-white border border-gray-300 hover:bg-gray-50 cursor-pointer"
                    : "bg-gray-200 border border-gray-200 cursor-not-allowed text-gray-400"
                }`}
                style={{
                  pointerEvents: searchTerm.trim() ? "auto" : "none",
                }}
                title="Search"
              >
                🔎
              </button>

              <button
                onClick={handleClearSearch}
                disabled={!searchTerm.trim()}
                className={`p-2 rounded-lg transition-all ${
                  searchTerm.trim()
                    ? "text-gray-700 hover:bg-gray-100 cursor-pointer border border-gray-300"
                    : "text-gray-300 cursor-not-allowed border border-gray-200"
                }`}
                title="Clear search"
              >
                <X size={18} />
              </button>
            </div>

            {/* Export & Add Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleExport}
                disabled={exporting}
                className={`px-5 py-2 rounded-lg font-medium transition-all shadow-sm ${
                  exporting
                    ? "bg-green-400 cursor-not-allowed"
                    : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
                }`}
              >
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
              <button
                onClick={() => nav("/subscription/add")}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 font-medium cursor-pointer"
              >
                Add Subscription
              </button>
            </div>
          </div>
        </div>

        <Toaster position="top-right" reverseOrder={false} />

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="min-h-[500px] flex justify-center items-center">
              <RingLoader size={80} color="#3b82f6" />
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  {/* Table Header */}
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => handleSort("subsc_name")}
                        >
                          Name <SortArrow column="subsc_name" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => handleSort("subsc_type")}
                        >
                          Type <SortArrow column="subsc_type" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => handleSort("subsc_price")}
                        >
                          Price <SortArrow column="subsc_price" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => handleSort("subsc_currency")}
                        >
                          Currency <SortArrow column="subsc_currency" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          className="flex items-center hover:text-blue-600 transition-colors cursor-pointer"
                          onClick={() => handleSort("department_name")}
                        >
                          Department <SortArrow column="department_name" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-gray-200">
                    {subscriptions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center p-8 text-gray-500 italic"
                        >
                          No subscriptions found.
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map((subscription, index) => (
                        <tr
                          key={subscription.id}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(currentPage - 1) * limit + index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {subscription.subsc_name || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {subscription.subsc_type || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {subscription.subsc_price || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 uppercase font-medium">
                            {subscription.subsc_currency || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {subscription.department_name || "-"}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold ${
                                subscription.subsc_status?.toLowerCase() ===
                                "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {subscription.subsc_status?.toLowerCase() ===
                              "active"
                                ? "Active"
                                : "Expired"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() =>
                                  nav(`/subscription/edit/${subscription.id}`)
                                }
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => confirmDelete(subscription.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Total:{" "}
                  <span className="font-semibold">{totalSubscriptions}</span>
                </div>
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  limit={limit}
                  onLimitChange={(newLimit) => {
                    setLimit(newLimit);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </>
          )}
        </div>

        {/* Export Loading Overlay */}
        {exporting && (
          <div className="fixed inset-0 bg-green-900/90 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center text-center text-white space-y-6 p-8 rounded-lg"
            >
              <RingLoader color="#fff" size={100} />
              <p className="text-3xl font-semibold tracking-wide">
                CREATING FILE...
              </p>
              <p className="text-xl">Please wait</p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionList;
