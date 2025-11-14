import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  getSubscriptions,
  deleteSubscription,
  toggleSubscriptionStatus,
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

  // Unified fetch that accepts page and explicit filters (no reliance on closure for currentPage)
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
    // keep dependencies to the core params that should recreate this function when changed
    [limit, sortBy, sortOrder]
  );

  // Immediate fetch when currentPage, limit, sortBy or sortOrder changes
  useEffect(() => {
    // load the page using current filters (no debounce)
    loadSubscriptions(currentPage, { searchValues, statusFilter });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, limit, sortBy, sortOrder, loadSubscriptions]);

  // Debounced effect for typing in search fields and status filter changes.
  // This sets page to 1 and performs a debounced fetch.
  useEffect(() => {
    if (!didMountSearch.current) {
      didMountSearch.current = true;
      // On first mount we don't want the debounce (we already load in the other effect)
      return;
    }

    const timer = setTimeout(() => {
      setCurrentPage(1); // reset to first page on search/filter change
      // call loadSubscriptions for page 1 using the latest searchValues/statusFilter
      loadSubscriptions(1, { searchValues, statusFilter });
    }, 500);

    return () => clearTimeout(timer);
    // only run when search-related things change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValues, statusFilter]);

  const handleSort = (columnKey: string) => {
    const newOrder: "asc" | "desc" =
      sortBy === columnKey && sortOrder === "asc" ? "desc" : "asc";
    setSortBy(columnKey);
    setSortOrder(newOrder);
    // sorting changes are handled by the effect that watches sortBy/sortOrder (immediate)
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

  // initial mount: load page 1 (this runs because currentPage/limit/sort effect will run)
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
            active && sortOrder === "asc" ? "text-black" : "text-gray-300"
          }`}
        >
          ▲
        </span>
        <span className="h-[1px]" />
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
            <div className="bg-white rounded shadow overflow-x-auto mt-4">
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
                        onKeyDown={preventLeadingSpace}
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
                          if (e.key === " ") e.preventDefault();
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
                          if (e.key === " ") e.preventDefault();
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
                        onKeyDown={preventLeadingSpace}
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
                        onKeyDown={preventLeadingSpace}
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

                    <th className="text-center">
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
                        className={`p-1 rounded-full transition ${
                          Object.values(searchValues).some((v) => v.trim() !== "")
                            ? "text-black hover:bg-gray-200 cursor-pointer"
                            : "text-gray-300 cursor-not-allowed"
                        }`}
                        title="Clear all search fields"
                      >
                        <X size={18} />
                      </button>
                    </th>
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
                        <td className="p-3 capitalize">
                          {s.subsc_type || "-"}
                        </td>
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
                              checked={
                                s.subsc_status?.toLowerCase() === "active"
                              }
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
            </div>

            <div className="flex justify-between items-center mt-4">
              <span className="text-sm text-gray-600">
                Total Subscriptions: {totalSubscriptions}
              </span>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => {
                  // only update the page here; the effect watching currentPage will fetch
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
  );
};

export default SubscriptionList;
