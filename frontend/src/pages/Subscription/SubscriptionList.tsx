import React, { useEffect, useState, useCallback, useRef } from "react";
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [limit, setLimit] = useState(10);
  const [totalSubscriptions, setTotalSubscriptions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchValues, setSearchValues] = useState({
    id: "",
    subsc_name: "",
    subsc_type: "",
    subsc_price: "",
    subsc_currency: "",
    department_name: "",
  });
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const nav = useNavigate();
  const didMountSearch = useRef(false);

  const loadSubscriptions = useCallback(
    async (
      page: number,
      options?: {
        searchValues?: typeof searchValues;
        statusFilter?: "all" | "active" | "inactive";
      }
    ) => {
      try {
        setLoading(true);

        const sv = options?.searchValues ?? searchValues;
        const sf = options?.statusFilter ?? statusFilter;

        const params = {
          page,
          limit,
          sortBy,
          sortOrder,
          subsc_name: sv.subsc_name?.trim() || undefined,
          subsc_type: sv.subsc_type?.trim() || undefined,
          subsc_price: sv.subsc_price?.trim() || undefined,
          subsc_currency: sv.subsc_currency?.trim() || undefined,
          department_name: sv.department_name?.trim() || undefined,
          subsc_status: sf !== "all" ? sf : undefined,
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
    [limit, sortBy, sortOrder]
  );

  useEffect(() => {
    loadSubscriptions(currentPage, { searchValues, statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit, sortBy, sortOrder, loadSubscriptions]);

  useEffect(() => {
    if (!didMountSearch.current) {
      didMountSearch.current = true;
      return;
    }

    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadSubscriptions(1, { searchValues, statusFilter });
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValues, statusFilter]);

  const handleSort = (columnKey: string) => {
    const newOrder: "asc" | "desc" =
      sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(columnKey);
    setSortOrder(newOrder);
  };

  const handleDeleteConfirmed = async (id: number, onClose?: () => void) => {
    try {
      await deleteSubscription(id);
      setSubscriptions((prev) =>
        prev.filter((subscription) => subscription.id !== id)
      );
      toast.success("Subscription deleted successfully");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete subscription");
    } finally {
      if (onClose) onClose();
    }
  };

  const confirmDelete = (id: number) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scaleIn">
            <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">
              Are you sure you want to delete this subscription?
            </h3>
            <p className="text-gray-600 mb-6 text-center">
              You won't be able to revert this action.
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


  useEffect(() => {
    loadSubscriptions(currentPage, { searchValues, statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const SortArrow = ({ column }: { column: string }) => {
    const active = sortBy === column;

    return (
      <span className="inline-flex flex-col items-center ml-1 leading-none cursor-pointer">
        <span
          className={`text-[10px] ${
            active && sortOrder === "asc" ? "text-blue-600" : "text-gray-300"
          }`}
        >
          ▲
        </span>
        <span className="h-[1px]" />
        <span
          className={`text-[10px] ${
            active && sortOrder === "desc" ? "text-blue-600" : "text-gray-300"
          }`}
        >
          ▼
        </span>
      </span>
    );
  };

  const preventLeadingSpace = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === " ") {
      const input = e.currentTarget;
      const caretPos = input.selectionStart ?? 0;
      if (caretPos === 0 || input.value.length === 0) {
        e.preventDefault();
      }
    }
  };

  return (
    // <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
    //   <div className="max-w-7xl mx-auto space-y-6">

    <div className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Subscriptions</h2>
            <p className="text-gray-600 mt-1">Manage company subscriptions</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (exporting) return;
                setExporting(true);
                try {
                  const res = await exportSubscriptionsCSV();
                  const blob = new Blob([res.data], {
                    type: "text/csv;charset=utf-8;",
                  });
                  const url = window.URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.setAttribute("download", "subscriptions_export.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  toast.success("All subscriptions exported successfully");
                } catch (err) {
                  console.error(err);
                  toast.error("Failed to export subscriptions");
                } finally {
                  setExporting(false);
                }
              }}
              disabled={exporting}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm ${
                exporting
                  ? "bg-green-400 cursor-not-allowed"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 cursor-pointer"
              }`}
            >
              {exporting ? "Exporting..." : "Export CSV"}
            </button>
            <button
              onClick={() => nav("/subscription/add")}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg shadow-blue-500/30 font-medium cursor-pointer"
            >
              Add Subscription
            </button>
          </div>
        </div>

        <Toaster position="top-right" reverseOrder={false} />

        {/* Search & Filter Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <input
              type="text"
              placeholder="Search Name"
              value={searchValues.subsc_name}
              onKeyDown={preventLeadingSpace}
              onChange={(e) =>
                setSearchValues((prev) => ({
                  ...prev,
                  subsc_name: e.target.value,
                }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <input
              type="text"
              placeholder="Search Type"
              value={searchValues.subsc_type}
              onKeyDown={(e) => {
                if (e.key === " ") e.preventDefault();
              }}
              onChange={(e) =>
                setSearchValues((prev) => ({
                  ...prev,
                  subsc_type: e.target.value,
                }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <input
              type="text"
              placeholder="Search Price"
              value={searchValues.subsc_price}
              onKeyDown={(e) => {
                if (e.key === " ") e.preventDefault();
              }}
              onChange={(e) =>
                setSearchValues((prev) => ({
                  ...prev,
                  subsc_price: e.target.value,
                }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <input
              type="text"
              placeholder="Search Currency"
              value={searchValues.subsc_currency}
              onKeyDown={preventLeadingSpace}
              onChange={(e) =>
                setSearchValues((prev) => ({
                  ...prev,
                  subsc_currency: e.target.value,
                }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <input
              type="text"
              placeholder="Search Department"
              value={searchValues.department_name}
              onKeyDown={preventLeadingSpace}
              onChange={(e) =>
                setSearchValues((prev) => ({
                  ...prev,
                  department_name: e.target.value,
                }))
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "active" | "inactive"
                  )
                }
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <button
                type="button"
                onClick={() =>
                  setSearchValues({
                    id: "",
                    subsc_name: "",
                    subsc_type: "",
                    subsc_price: "",
                    subsc_currency: "",
                    department_name: "",
                  })
                }
                disabled={
                  !Object.values(searchValues).some((v) => v.trim() !== "")
                }
                className={`p-2 rounded-lg transition-all ${
                  Object.values(searchValues).some((v) => v.trim() !== "")
                    ? "text-gray-700 hover:bg-gray-100 cursor-pointer border border-gray-300"
                    : "text-gray-300 cursor-not-allowed border border-gray-200"
                }`}
                title="Clear all search fields"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="min-h-[500px] flex justify-center items-center">
              <RingLoader size={80} color="#3b82f6" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        #
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          className="flex items-center hover:text-blue-600 transition-colors"
                          onClick={() => handleSort("subsc_name")}
                        >
                          Name <SortArrow column="subsc_name" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          className="flex items-center hover:text-blue-600 transition-colors"
                          onClick={() => handleSort("subsc_type")}
                        >
                          Type <SortArrow column="subsc_type" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          className="flex items-center hover:text-blue-600 transition-colors"
                          onClick={() => handleSort("subsc_price")}
                        >
                          Price <SortArrow column="subsc_price" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          className="flex items-center hover:text-blue-600 transition-colors"
                          onClick={() => handleSort("subsc_currency")}
                        >
                          Currency <SortArrow column="subsc_currency" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        <button
                          className="flex items-center hover:text-blue-600 transition-colors"
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
                      subscriptions.map((s, index) => (
                        <tr
                          key={s.id}
                          className="hover:bg-blue-50/50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {(currentPage - 1) * limit + index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900">
                              {s.subsc_name || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {s.subsc_type || "-"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {s.subsc_price || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 uppercase font-medium">
                            {s.subsc_currency || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {s.department_name || "-"}
                          </td>

                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-4 py-2 rounded-full text-xs font-semibold transition-colors ${
                                s.subsc_status?.toLowerCase() === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {s.subsc_status?.toLowerCase() === "active"
                                ? "Active"
                                : "Expired"}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-3">
                              <button
                                onClick={() =>
                                  nav(`/subscription/edit/${s.id}`)
                                }
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit Subscription"
                              >
                                <Edit size={18} />
                              </button>
                              <button
                                onClick={() => confirmDelete(s.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                title="Delete Subscription"
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
                  Total Subscriptions:{" "}
                  <span className="font-semibold text-gray-900">
                    {totalSubscriptions}
                  </span>
                </div>

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={(p) => {
                    setCurrentPage(p);
                  }}
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
                YOUR FILE IS BEING CREATED
              </p>
              <p className="text-xl">
                Please don't close or refresh this window until process is
                finished
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionList;
