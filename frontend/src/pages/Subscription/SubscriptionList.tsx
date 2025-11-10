import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  getSubscriptions,
  deleteSubscription,
  toggleSubscriptionStatus,
  exportSubscriptionsCSV,
} from "../../services/subscriptionService";
import type { Subscription } from "../../types/Subscription";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
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
  const skipNextSearch = useRef(false);

  const loadSubscriptions = useCallback(
    async (
      filterColumn?: string,
      filterValue?: string,
      page: number = 1,
      newLimit: number = limit,
      sb?: string,
      so?: "asc" | "desc"
    ) => {
      try {
        setLoading(true);
        const data = await getSubscriptions(
          filterValue,
          filterColumn,
          page,
          newLimit,
          sb ?? sortBy,
          so ?? sortOrder
        );

        setSubscriptions(data.subscriptions || []);
        setTotalSubscriptions(data.total || 0);
        setTotalPages(data.totalPages ?? 1);
      } catch (err) {
        console.error("Failed to fetch subscriptions:", err);
        toast.error("Failed to load subscriptions");
      } finally {
        setLoading(false);
      }
    },
    [limit, sortBy, sortOrder]
  );

  // Debounced search + status
  useEffect(() => {
    if (!didMountSearch.current) {
      didMountSearch.current = true;
      return;
    }

    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      let column: string | undefined;
      let value: string | undefined;

      const columnMap: Record<string, string> = {
        subsc_name: "subsc_name",
        subsc_type: "subsc_type",
        subsc_price: "subsc_price",
        subsc_currency: "subsc_currency",
        department_name: "department_name",
      };

      column = Object.keys(searchValues).find(
        (key) => searchValues[key as keyof typeof searchValues]
      );

      value = column
        ? searchValues[column as keyof typeof searchValues]
        : undefined;
      column = column ? columnMap[column] : undefined;

      if (statusFilter !== "all") {
        column = "subsc_status";
        value = statusFilter;
      }

      loadSubscriptions(column, value, 1, limit, sortBy, sortOrder);
    }, 500);

    return () => clearTimeout(timeout);
  }, [searchValues, statusFilter, loadSubscriptions, limit, sortBy, sortOrder]);

  const handleSort = (columnKey: string) => {
    const newOrder: "asc" | "desc" =
      sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(columnKey);
    setSortOrder(newOrder);
    skipNextSearch.current = true;

    let column: string | undefined = undefined;
    let value: string | undefined = undefined;
    if (statusFilter !== "all") {
      column = "subsc_status";
      value = statusFilter;
    }

    loadSubscriptions(column, value, 1, limit, columnKey, newOrder);
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

  const handleToggle = async (id: number, newStatus: "active" | "inactive") => {
    try {
      await toggleSubscriptionStatus(id, newStatus);
      setSubscriptions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, subsc_status: newStatus } : s))
      );
      toast.success(
        newStatus === "active"
          ? "Subscription marked as active"
          : "Subscription marked as inactive"
      );
    } catch (err) {
      console.error("Status update failed:", err);
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    loadSubscriptions(undefined, undefined, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const SortArrow = ({ column }: { column: string }) => {
    const active = sortBy === column;

    return (
      <span className="inline-flex flex-col items-center ml-1 leading-none cursor-pointer">
        {/* Up Arrow (gray when desc active, black when asc active) */}
        <span
          className={`text-[10px] ${
            active && sortOrder === "asc" ? "text-black" : "text-gray-300"
          }`}
        >
          ▲
        </span>

        {/* Small gap */}
        <span className="h-[1px]" />

        {/* Down Arrow (black when desc active, gray when asc active) */}
        <span
          className={`text-[10px] ${
            active && sortOrder === "desc" ? "text-black" : "text-gray-300"
          }`}
        >
          ▼
        </span>
      </span>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Subscriptions</h2>
        <div className="flex gap-2">
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
            className={`${
              exporting
                ? "bg-green-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 cursor-pointer"
            } text-white px-4 py-2 rounded`}
          >
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
          <button
            onClick={() => nav("/subscription/add")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 cursor-pointer"
          >
            Add Subscription
          </button>
        </div>
      </div>

      <Toaster position="top-right" reverseOrder={false} />

      <div className="bg-white rounded shadow overflow-auto mt-4">
        {loading ? (
          <div className="min-h-[500px] flex justify-center items-center">
            <RingLoader size={80} />
          </div>
        ) : (
          <>
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left">#</th>
                  <th className="p-3 text-left">
                    <button
                      className="flex items-center"
                      onClick={() => handleSort("subsc_name")}
                    >
                      Name <SortArrow column="subsc_name" />
                    </button>
                  </th>
                  <th className="p-3 text-left">
                    <button
                      className="flex items-center"
                      onClick={() => handleSort("subsc_type")}
                    >
                      Type <SortArrow column="subsc_type" />
                    </button>
                  </th>
                  <th className="p-3 text-left">
                    <button
                      className="flex items-center"
                      onClick={() => handleSort("subsc_price")}
                    >
                      Price <SortArrow column="subsc_price" />
                    </button>
                  </th>
                  <th className="p-3 text-left">
                    <button
                      className="flex items-center"
                      onClick={() => handleSort("subsc_currency")}
                    >
                      Currency <SortArrow column="subsc_currency" />
                    </button>
                  </th>
                  <th className="p-3 text-left">
                    <button
                      className="flex items-center"
                      onClick={() => handleSort("department_name")}
                    >
                      Department <SortArrow column="department_name" />
                    </button>
                  </th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
                <tr className="bg-gray-100">
                  <th></th>
                  <th className="p-2">
                    <input
                      type="text"
                      placeholder="Search Name"
                      value={searchValues.subsc_name}
                      onKeyDown={(e) => {
                        if (e.key === " ") e.preventDefault(); // 🚫 block spacebar
                      }}
                      onChange={(e) =>
                        setSearchValues((prev) => ({
                          ...prev,
                          subsc_name: e.target.value,
                        }))
                      }
                      className="w-full p-1 border rounded"
                    />
                  </th>
                  <th className="p-2">
                    <input
                      type="text"
                      placeholder="Search Type"
                      value={searchValues.subsc_type}
                        onKeyDown={(e) => {
    if (e.key === " ") e.preventDefault(); // 🚫 block spacebar
  }}
                      onChange={(e) =>
                        setSearchValues((prev) => ({
                          ...prev,
                          subsc_type: e.target.value,
                        }))
                      }
                      className="w-full p-1 border rounded"
                    />
                  </th>
                  <th className="p-2">
                    <input
                      type="text"
                      placeholder="Search Price"
                      value={searchValues.subsc_price}
                        onKeyDown={(e) => {
    if (e.key === " ") e.preventDefault(); // 🚫 block spacebar
  }}
                      onChange={(e) =>
                        setSearchValues((prev) => ({
                          ...prev,
                          subsc_price: e.target.value,
                        }))
                      }
                      className="w-full p-1 border rounded"
                    />
                  </th>
                  <th className="p-2">
                    <input
                      type="text"
                      placeholder="Search Currency"
                      value={searchValues.subsc_currency}
                        onKeyDown={(e) => {
    if (e.key === " ") e.preventDefault(); // 🚫 block spacebar
  }}
                      onChange={(e) =>
                        setSearchValues((prev) => ({
                          ...prev,
                          subsc_currency: e.target.value,
                        }))
                      }
                      className="w-full p-1 border rounded"
                    />
                  </th>
                  <th className="p-2">
                    <input
                      type="text"
                      placeholder="Search Department"
                      value={searchValues.department_name}
                        onKeyDown={(e) => {
    if (e.key === " ") e.preventDefault(); // 🚫 block spacebar
  }}
                      onChange={(e) =>
                        setSearchValues((prev) => ({
                          ...prev,
                          department_name: e.target.value,
                        }))
                      }
                      className="w-full p-1 border rounded"
                    />
                  </th>
                  <th>
                    <select
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(
                          e.target.value as "all" | "active" | "inactive"
                        )
                      }
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="all">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center p-4 text-gray-500 italic"
                    >
                      No subscriptions found.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((s, index) => (
                    <tr key={s.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        {(currentPage - 1) * limit + index + 1}
                      </td>
                      <td className="p-3">{s.subsc_name || "-"}</td>
                      <td className="p-3 capitalize">{s.subsc_type || "-"}</td>
                      <td className="p-3">{s.subsc_price || "-"}</td>
                      <td className="p-3 uppercase">
                        {s.subsc_currency || "-"}
                      </td>
                      <td className="p-3 capitalize">
                        {s.department_name || "-"}
                      </td>

                      <td className="p-3">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={s.subsc_status?.toLowerCase() === "active"}
                            onChange={(e) =>
                              handleToggle(
                                s.id,
                                e.target.checked ? "active" : "inactive"
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                        </label>
                      </td>

                      <td className="p-3 text-center space-x-3">
                        <button
                          onClick={() => nav(`/subscription/edit/${s.id}`)}
                          className="text-yellow-600 hover:text-yellow-800 cursor-pointer"
                          title="Edit Subscription"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => confirmDelete(s.id)}
                          className="text-red-600 hover:text-red-800 cursor-pointer"
                          title="Delete Subscription"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Total Subscriptions: {totalSubscriptions}
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => {
                  skipNextSearch.current = true;
                  setCurrentPage(p);
                  let column: string | undefined = undefined;
                  let value: string | undefined = undefined;
                  if (statusFilter !== "all") {
                    column = "subsc_status";
                    value = statusFilter;
                  }
                  loadSubscriptions(column, value, p, limit, sortBy, sortOrder);
                }}
                limit={limit}
                onLimitChange={(newLimit) => {
                  skipNextSearch.current = true;
                  setLimit(newLimit);
                  setCurrentPage(1);
                  let column: string | undefined = undefined;
                  let value: string | undefined = undefined;
                  if (statusFilter !== "all") {
                    column = "subsc_status";
                    value = statusFilter;
                  }
                  loadSubscriptions(
                    column,
                    value,
                    1,
                    newLimit,
                    sortBy,
                    sortOrder
                  );
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
  );
};

export default SubscriptionList;
