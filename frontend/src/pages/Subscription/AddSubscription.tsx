// src/pages/Subscriptions/AddSubscription.tsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { getSubscriptionById } from "../../services/subscriptionService";
import type { Subscription } from "../../types/Subscription";

export const urlRegex =
  // eslint-disable-next-line no-useless-escape
  /^(https?:\/\/)([\w\-]+(\.[\w\-]+)+)([\/\w\-.,@?^=%&:;+#]*)?$/;

type SubscriptionFormData = Omit<Subscription, "id">;

const AddSubscription: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const editing = Boolean(id);
  const nav = useNavigate();

  const [departments, setDepartments] = useState<
    { id: number; name: string }[]
  >([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<SubscriptionFormData>({
    mode: "all",
  });

  const isSubmitting = false;

  const watchedPurchaseDate = watch("purchase_date");
  const watchedType = watch("subsc_type");

  useEffect(() => {
    if (!watchedPurchaseDate) {
      if (watchedType !== "Lifetime") setValue("renew_date", "");
      return;
    }

    if (watchedType === "Lifetime") {
      setValue("renew_date", "");
      return;
    }

    const parts = watchedPurchaseDate.split("-");
    if (parts.length !== 3) return;

    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);
    const purchase = new Date(Date.UTC(year, month, day));

    let renew: Date | null = null;

    if (watchedType === "Monthly") {
      renew = new Date(purchase.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (watchedType === "Yearly") {
      renew = new Date(
        Date.UTC(
          purchase.getUTCFullYear() + 1,
          purchase.getUTCMonth(),
          purchase.getUTCDate()
        )
      );
    } else {
      renew = null;
    }

    if (renew) {
      const yyyy = renew.getUTCFullYear();
      const mm = String(renew.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(renew.getUTCDate()).padStart(2, "0");
      setValue("renew_date", `${yyyy}-${mm}-${dd}`);
    }
  }, [watchedPurchaseDate, watchedType, setValue]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/departments", { withCredentials: true });
        const data = res.data.departments || res.data;

        setDepartments(
          data.map((d: { id: number; department_name: string }) => ({
            id: d.id,
            name: d.department_name,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch departments:", err);
        toast.error("Failed to load departments");
      }
    })();
  }, []);

  useEffect(() => {
    if (!editing || !id) return;

    const fetchData = async () => {
      try {
        const data = await getSubscriptionById(Number(id));

        if (departments.length === 0) {
          const checkInterval = setInterval(() => {
            if (departments.length > 0) {
              clearInterval(checkInterval);
              fillForm(data);
            }
          }, 100);
        } else {
          fillForm(data);
        }
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
        toast.error("Failed to load subscription data");
      }
    };

    const fillForm = (data: SubscriptionFormData) => {
      (Object.keys(data) as (keyof SubscriptionFormData)[]).forEach((key) => {
        let value = data[key];

        if (key === "purchase_date" || key === "renew_date") {
          if (value) value = new Date(value).toISOString().split("T")[0];
        }

        if (key === "subsc_status" && typeof value === "string") {
          value = value.toLowerCase();
        }

        if (
          (key === "payment_method" || key === "portal_detail") &&
          value == null
        ) {
          value = "";
        }

        if (value !== undefined) {
          setValue(key, value as never, { shouldValidate: true });
        }
      });
    };

    fetchData();
  }, [editing, id, departments, setValue]);

  const onSubmit = async (formData: SubscriptionFormData) => {
    console.log("🚀 === FORM SUBMISSION STARTED ===");
    console.log("Form data:", formData);

    try {
      if (editing && id) {
        console.log("📝 Editing mode - ID:", id);
        await api.put(`/subscriptions/${id}`, formData, {
          withCredentials: true,
        });
        console.log("✅ Update successful");
        toast.success("Subscription updated successfully");
        nav("/subscription");
        return;
      }

      console.log("➕ Creating new subscription...");
      const response = await api.post("/subscriptions", formData, {
        withCredentials: true,
      });
      console.log("Create successful:", response);
      toast.success("Subscription created successfully");
      nav("/subscription");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.log("❌ ERROR:", error);

      const backendMsg = error?.response?.data?.message;
      const fallbackMsg =
        error?.response?.data?.error ||
        error?.message ||
        "Failed to save subscription";

      const finalMsg = backendMsg || fallbackMsg;

      setTimeout(() => {
        toast.error(finalMsg);
      }, 10);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
      <div className="max-w-5xl mx-auto">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <h2 className="text-3xl font-bold text-white">
              {editing ? "Edit Subscription" : "Add Subscription"}
            </h2>
            <p className="text-blue-100 mt-1">
              {editing
                ? "Update subscription details below"
                : "Fill the details below to add new subscription"}
            </p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Subscription Name */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Subscription Name <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("subsc_name", {
                    required: "Name is required",
                    maxLength: { value: 50, message: "Max 50 characters allowed" },
                    minLength: { value: 3, message: "Minimum 3 characters required" },
                    validate: (v) =>
                      v.trim().length > 0 ||
                      "Name cannot start with spaces or be empty",
                  })}
                  onBlur={() => trigger("subsc_name")}

                  onChange={(e) => {
                    let v = e.target.value;
                    if (v.startsWith(" ")) {
                      v = v.trimStart();
                      toast.error("Name cannot start with a space");
                    }
                    if (v.length > 50) v = v.slice(0, 50);
                    setValue("subsc_name", v, { shouldValidate: true });
                  }}
                  className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.subsc_name ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter subscription name"
                />
                {errors.subsc_name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.subsc_name.message}
                  </p>
                )}
              </div>

              {/* Subscription URL */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Subscription URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register("subc_url", {
                    required: "Subscription URL is required",
                    maxLength: {
                      value: 200,
                      message: "Max 200 characters allowed",
                    },
                    validate: (v) =>
                      (v?.trim().length ?? 0) > 0 || "URL cannot start with spaces",
                    pattern: {
                      value: urlRegex,
                      message:
                        "Enter a valid URL (must start with http:// or https://)",
                    },
                  })}
                  onBlur={() => trigger("subc_url")}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (v.startsWith(" ")) {
                      v = v.trimStart();
                      toast.error("URL cannot start with a space");
                    }
                    if (v.length > 200) v = v.slice(0, 200);
                    setValue("subc_url", v, { shouldValidate: true });
                  }}
                  className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.subc_url ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="https://example.com"
                />
                {errors.subc_url && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.subc_url.message}
                  </p>
                )}
              </div>

              {/* Subscription Price */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  {...register("subsc_price", {
                    required: "Price is required",
                    max: {
                      value: 999999999999999,
                      message: "Max 15 digits allowed",
                    },
                  })}
                  onBlur={() => trigger("subsc_price")}
                  onInput={(e: React.FormEvent<HTMLInputElement>) => {
                    const input = e.currentTarget;
                    const raw = input.value;

                    if (raw.length > 15) {
                      const truncated = raw.slice(0, 15);
                      input.value = truncated;
                      setValue(
                        "subsc_price",
                        truncated === "" ? 0 : Number(truncated),
                        { shouldValidate: true }
                      );
                    } else {
                      setValue("subsc_price", raw === "" ? 0 : Number(raw), {
                        shouldValidate: true,
                      });
                    }

                    if (raw.length >= 15) trigger("subsc_price");
                  }}
                  className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.subsc_price ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                />
                {errors.subsc_price && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.subsc_price.message}
                  </p>
                )}
              </div>

              {/* Currency */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Currency <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("subsc_currency", {
                    required: "Currency is required",
                  })}
                  onBlur={() => trigger("subsc_currency")}
                  className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.subsc_currency ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Currency</option>
                  <option value="USD">USD – US Dollar</option>
                  <option value="INR">INR – Indian Rupee</option>
                  <option value="EUR">EUR – Euro</option>
                  <option value="GBP">GBP – British Pound</option>
                  <option value="CAD">CAD – Canadian Dollar</option>
                  <option value="AUD">AUD – Australian Dollar</option>
                  <option value="JPY">JPY – Japanese Yen</option>
                  <option value="SGD">SGD – Singapore Dollar</option>
                  <option value="CHF">CHF – Swiss Franc</option>
                </select>
                {errors.subsc_currency && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.subsc_currency.message}
                  </p>
                )}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("subsc_type", { required: "Type is required" })}
                  onBlur={() => trigger("subsc_type")}
                  className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.subsc_type ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Type</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Yearly">Yearly</option>
                  <option value="Lifetime">Lifetime</option>
                </select>
                {errors.subsc_type && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.subsc_type.message}
                  </p>
                )}
              </div>

              {/* Purchase Date */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Purchase Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("purchase_date", {
                    required: "Purchase date is required",
                  })}
                  onBlur={() => trigger("purchase_date")}
                  className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.purchase_date ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.purchase_date && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.purchase_date.message}
                  </p>
                )}
              </div>

              {/* Renew Date */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Renew Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("renew_date", {
                    required:
                      watchedType === "Lifetime" ? false : "Renew date is required",
                  })}
                  // disabled={watchedType === "Lifetime"}
                  disabled={true}
                  className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed ${
                    errors.renew_date ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.renew_date && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.renew_date.message}
                  </p>
                )}
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("payment_method", {
                    required: "Payment method is required",
                   minLength: { value: 5, message: "Minimum 5 characters required" },
                    maxLength: { value: 100, message: "Max 100 characters allowed" },
                    validate: (v) =>
                      v.trim().length > 0 ||
                      "Payment method cannot start with spaces",
                  })}
                  onBlur={() => trigger("payment_method")}
                  rows={3}
                  maxLength={100}
                  onChange={(e) => {
                    let v = e.target.value;
                    if (v.startsWith(" ")) {
                      v = v.trimStart();
                      toast.error("Payment method cannot start with a space");
                    }
                    if (v.length <= 100) {
                      setValue("payment_method", v);
                    } else {
                      setValue("payment_method", v.slice(0, 100));
                    }
                    trigger("payment_method");
                  }}
                  className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.payment_method ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="e.g., Credit Card, UPI, Bank Transfer"
                />
                {errors.payment_method && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.payment_method.message}
                  </p>
                )}
              </div>

              {/* Department */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Department <span className="text-red-500">*</span>
                </label>
                <select
                  {...register("department_id", {
                    required: "Department is required",
                    valueAsNumber: true,
                  })}
                  onBlur={() => trigger("department_id")}
                  className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.department_id ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.department_id && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.department_id.message}
                  </p>
                )}
              </div>


              {/* Portal Details */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Portal Details <span className="text-red-500">*</span>
                </label>
                <textarea
                  {...register("portal_detail", {
                    required: "Portal details are required",
                   minLength: { value: 5, message: "Minimum 5 characters required" },
                    maxLength: {
                      value: 200,
                      message: "Max 200 characters allowed",
                    },
                    validate: (v) =>
                      (v?.trim().length ?? 0) > 0 ||
                      "Portal details cannot start with spaces",
                  })}
                  onBlur={() => trigger("portal_detail")}
                  rows={3}
                  maxLength={200}
                  onChange={(e) => {
                    let v: string = e.target.value || "";
                    if (v.startsWith(" ")) {
                      v = v.trimStart();
                      toast.error("Portal details cannot start with a space");
                    }
                    if (v.length <= 200) {
                      setValue("portal_detail", v);
                    } else {
                      setValue("portal_detail", v.slice(0, 200));
                    }
                    if (v.length >= 200) trigger("portal_detail");
                  }}
                  className={`w-full px-4 py-3 border rounded-lg transition-all focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                    errors.portal_detail ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter portal details or notes"
                ></textarea>
                {errors.portal_detail && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.portal_detail.message}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => nav("/subscription")}
                disabled={isSubmitting}
                className={`px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium ${
                  isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg font-medium transition-all cursor-pointer ${
                  isSubmitting
                    ? "bg-blue-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/30"
                } text-white`}
              >
                {isSubmitting ? "Saving..." : editing ? "Update" : "Add"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubscription;



