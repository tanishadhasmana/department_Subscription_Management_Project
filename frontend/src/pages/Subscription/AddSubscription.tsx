// src/pages/Subscriptions/AddSubscription.tsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { getSubscriptionById } from "../../services/subscriptionService";
import type { Subscription } from "../../types/Subscription";

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
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormData>({
    defaultValues: { subsc_status: "active" },
    mode: "onChange",
  });

  // Watch purchase_date and type to auto-calc renew_date
  const watchedPurchaseDate = watch("purchase_date");
  const watchedType = watch("subsc_type");

  useEffect(() => {
    if (!watchedPurchaseDate) {
      // if no purchase date, clear renew_date unless it's provided in form
      if (watchedType !== "Lifetime") setValue("renew_date", "");
      return;
    }

    // If lifetime selected: disable/clear renew date
    if (watchedType === "Lifetime") {
      setValue("renew_date", "");
      return;
    }

    // parse yyyy-mm-dd to Date
    const parts = watchedPurchaseDate.split("-");
    if (parts.length !== 3) return;

    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1; // JS month 0-indexed
    const day = Number(parts[2]);
    const purchase = new Date(Date.UTC(year, month, day));

    let renew: Date | null = null;

    if (watchedType === "Monthly") {
      // add 30 days
      renew = new Date(purchase.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else if (watchedType === "Yearly") {
      // add 1 year keeping day/month
      renew = new Date(
        Date.UTC(
          purchase.getUTCFullYear() + 1,
          purchase.getUTCMonth(),
          purchase.getUTCDate()
        )
      );
    } else {
      // if type unknown, keep empty
      renew = null;
    }

    if (renew) {
      // Convert back to yyyy-mm-dd
      const yyyy = renew.getUTCFullYear();
      const mm = String(renew.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(renew.getUTCDate()).padStart(2, "0");
      setValue("renew_date", `${yyyy}-${mm}-${dd}`);
    }
  }, [watchedPurchaseDate, watchedType, setValue]);

  // Fetch departments
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/departments", { withCredentials: true });
        const data =
          Array.isArray(res.data) && res.data.length > 0
            ? res.data
            : res.data.departments || [];

        const formatted = data.map(
          (d: { id: number; department_name: string }) => ({
            id: d.id,
            name: d.department_name,
          })
        );
        setDepartments(formatted);
      } catch (err) {
        console.error("Failed to fetch departments:", err);
        toast.error("Failed to load departments");
      }
    })();
  }, []);

  // Prefill data in edit mode
  useEffect(() => {
    if (!editing || !id) return;

    const fetchData = async () => {
      try {
        const data = await getSubscriptionById(Number(id));
        (Object.keys(data) as (keyof SubscriptionFormData)[]).forEach((key) => {
          let value = data[key];

          // ✅ Fix for date fields
          if (key === "purchase_date" || key === "renew_date") {
            if (value) {
              // ensure format YYYY-MM-DD
              value = new Date(value).toISOString().split("T")[0];
            }
          }

          // ✅ Fix for status casing mismatch
          if (key === "subsc_status" && typeof value === "string") {
            value = value.toLowerCase();
          }

          // ✅ Fix null string fields
          if (
            (key === "payment_method" || key === "portal_detail") &&
            value == null
          ) {
            value = "";
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (value !== undefined) setValue(key, value as any);
        });
      } catch (err) {
        console.error("Failed to fetch subscription:", err);
        toast.error("Failed to load subscription data");
      }
    };

    fetchData();
  }, [editing, id, setValue]);

  const onSubmit = async (formData: SubscriptionFormData) => {
    try {
      if (editing && id) {
        await api.put(`/subscriptions/${id}`, formData, {
          withCredentials: true,
        });
        toast.success("Subscription updated successfully");
      } else {
        await api.post("/subscriptions", formData, { withCredentials: true });
        toast.success("Subscription created successfully");
      }
      nav("/subscription");
    } catch (err: unknown) {
      console.error("Save failed:", err);
      if (err && typeof err === "object" && "response" in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        toast.error(
          axiosError.response?.data?.message || "Failed to save subscription"
        );
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  return (
    <div className="p-8 overflow-visible">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded shadow-md max-w-4xl mx-auto mt-6 overflow-visible"
      >
        <h2 className="text-xl font-semibold mb-6 text-gray-800">
          {editing ? "Edit Subscription" : "Add Subscription"}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subscription Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Subscription Name <span className="text-red-500">*</span>
            </label>
            <input
              {...register("subsc_name", { required: "Name is required" })}
              className="border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400"
              placeholder="Enter subscription name"
            />
            {errors.subsc_name && (
              <p className="text-red-500 text-sm mt-1">
                {errors.subsc_name.message}
              </p>
            )}
          </div>

          {/* Subscription Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Price <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register("subsc_price", { required: "Price is required" })}
              className="border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400"
              placeholder="Enter price"
            />
            {errors.subsc_price && (
              <p className="text-red-500 text-sm mt-1">
                {errors.subsc_price.message}
              </p>
            )}
          </div>

          {/* Currency */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Currency <span className="text-red-500">*</span>
            </label>
            <select
              {...register("subsc_currency", {
                required: "Currency is required",
              })}
              className="border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400"
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
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type <span className="text-red-500">*</span>
            </label>
            <select
              {...register("subsc_type", { required: "Type is required" })}
              className="border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400"
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
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Purchase Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register("purchase_date", {
                required: "Purchase date is required",
              })}
              className="border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400"
            />
            {errors.purchase_date && (
              <p className="text-red-500 text-sm mt-1">
                {errors.purchase_date.message}
              </p>
            )}
          </div>

          {/* Renew Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Renew Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              {...register("renew_date", {
                required:
                  watchedType === "Lifetime" ? false : "Renew date is required",
              })}
              disabled={watchedType === "Lifetime"}
              className="border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
            />
            {errors.renew_date && (
              <p className="text-red-500 text-sm mt-1">
                {errors.renew_date.message}
              </p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("payment_method", {
                required: "Payment method is required",
              })}
              rows={3}
              className="border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400"
              placeholder="Enter payment method details (e.g., UPI ID, card, PayPal email)"
            />
            {errors.payment_method && (
              <p className="text-red-500 text-sm mt-1">
                {errors.payment_method.message}
              </p>
            )}
          </div>

          {/* Department */}
          <div className="mb-10">
            <label className="block text-sm font-medium text-gray-700">
              Department <span className="text-red-500">*</span>
            </label>
            <select
              {...register("department_id", {
                required: "Department is required",
                valueAsNumber: true,
              })}
              className="border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400"
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

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("subsc_status", { required: "Status is required" })}
              className="border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.subsc_status && (
              <p className="text-red-500 text-sm mt-1">
                {errors.subsc_status.message}
              </p>
            )}
          </div>

          {/* Portal Details */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
              Portal Details <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("portal_detail", {
                required: "Portal details are required",
              })}
              rows={3}
              className="border rounded-md px-3 py-2 mt-1 w-full focus:ring-2 focus:ring-blue-400"
              placeholder="Enter portal details or notes"
            ></textarea>
            {errors.portal_detail && (
              <p className="text-red-500 text-sm mt-1">
                {errors.portal_detail.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`${
              isSubmitting ? "bg-blue-400" : "bg-blue-600 hover:bg-blue-700"
            } text-white px-6 py-2 rounded`}
          >
            {isSubmitting ? "Saving..." : editing ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSubscription;
