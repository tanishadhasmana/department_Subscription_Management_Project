// frontend: src/services/subscriptionService.ts
import api from "../lib/api";
import type { Subscription } from "../types/Subscription";

/**
 * Fetch subscriptions with support for:
 * - Multiple filters (AND condition)
 * - Pagination
 * - Sorting
 */
export const getSubscriptions = async (
  filters?: Record<string, string | number | undefined>
, // ✅ now supports multiple filters
  _unused?: string,                 // keep same call signature to avoid breaking imports
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder?: "asc" | "desc"
): Promise<{
  subscriptions: Subscription[];
  total: number;
  totalPages: number;
  currentPage: number;
}> => {
  const params: Record<string, string | number> = {
    page,
    limit,
  };

  // ✅ add filters dynamically (example: subsc_name, subsc_type, etc.)
  if (filters) {
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === "") return;

    // If string → trim 
    if (typeof value === "string") {
      params[key] = value.trim();
    } 
    // If number → convert to string or send as number
    else if (typeof value === "number") {
      params[key] = value;
    }
  });
}


  // ✅ add sorting if present
  if (sortBy) params.sortBy = sortBy;
  if (sortOrder) params.sortOrder = sortOrder;

  // make GET request with params automatically encoded
  const res = await api.get("/subscriptions", {
    params,
    withCredentials: true,
  });

  return res.data;
};

// ✅ Leave everything else as it is (no changes below this line)

// Get subscription by ID
export const getSubscriptionById = async (id: number): Promise<Subscription> => {
  const res = await api.get(`/subscriptions/${id}`, { withCredentials: true });
  return res.data?.data ?? res.data;
};

// Create new subscription
export const createSubscription = async (subscription: Partial<Subscription>) => {
  const res = await api.post("/subscriptions", subscription, { withCredentials: true });
  return res.data;
};

// Update existing subscription
export const updateSubscription = async (id: number, subscription: Partial<Subscription>) => {
  const res = await api.put(`/subscriptions/${id}`, subscription, { withCredentials: true });
  return res.data;
};

// Exporting all subscriptions to CSV
export const exportSubscriptionsCSV = async () => {
  const res = await api.get("/subscriptions/export", {
    responseType: "blob",
    withCredentials: true,
  });
  return res;
};

// Delete subscription
export const deleteSubscription = async (id: number) => {
  const res = await api.delete(`/subscriptions/${id}`, { withCredentials: true });
  return res.data;
};





