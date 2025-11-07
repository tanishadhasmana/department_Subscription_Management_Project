import api from "../lib/api";
import type { Subscription } from "../types/Subscription";

export const getSubscriptions = async (
  // Whatever the user types in search, like subscription name or anything
  search?: string,
  // Name of column where search can apply, like subsc_name, subsc_type etc
  column?: string,
  // For pagination, which page of results to show, default 1
  page: number = 1,
  // To avoid showing 1000s of results, so default 10 results/page
  limit: number = 10,
  // Name of field to sort by like subsc_name, subsc_price etc
  sortBy?: string,
  sortOrder?: "asc" | "desc"
  // Function returning promise, resolving to object with subscriptions, total subscriptions, total pages
): Promise<{
  subscriptions: Subscription[];
  total: number;
  totalPages: number;
  currentPage: number;
}> => {
  // Creating basic URL
  let url = `/subscriptions?page=${page}&limit=${limit}`;
  
  // search means what we type and col is db field, like we type "Netflix" it is search and field is subsc_name
  if (search && column) {
    url += `&search=${encodeURIComponent(search)}&column=${column}`;
  }
  
  // If in URL sortBy is provided, then only it sorts the column
  // If sortBy = "subsc_price", so url /subscriptions?page=1&limit=10&sortBy=subsc_price
  if (sortBy) {
    url += `&sortBy=${encodeURIComponent(sortBy)}`;
  }
  
  // Only add sort order if provided like ascending, descending
  // /subscriptions?page=1&limit=10&sortOrder=desc
  if (sortOrder) {
    url += `&sortOrder=${sortOrder}`;
  }
  
  const res = await api.get(url, { withCredentials: true });
  return res.data;
};

// Get subscription by ID
export const getSubscriptionById = async (id: number): Promise<Subscription> => {
  const res = await api.get(`/subscriptions/${id}`, { withCredentials: true });
  return res.data;
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
    responseType: "blob", // because it's a CSV file, means type of binary large object, instead of JSON or text
    withCredentials: true,
  });
  return res;
};

// Delete subscription
export const deleteSubscription = async (id: number) => {
  const res = await api.delete(`/subscriptions/${id}`, { withCredentials: true });
  return res.data;
};

// Toggle active / inactive status
export const toggleSubscriptionStatus = async (id: number, status: "active" | "inactive") => {
  const res = await api.put(`/subscriptions/${id}/status`, { status }, { withCredentials: true });
  return res.data;
};