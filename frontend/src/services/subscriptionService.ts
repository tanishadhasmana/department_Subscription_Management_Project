// frontend: src/services/subscriptionService.ts
import api from "../lib/api";
import type { Subscription } from "../types/Subscription";

export const getSubscriptions = async (params: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  subsc_name?: string;
  subsc_type?: string;
  subsc_price?: string;
  subsc_currency?: string;
  department_name?: string;
  subsc_status?: string;
}) => {
  const response = await api.get("/subscriptions", {
    params: {
      page: params.page || 1,
      limit: params.limit || 10,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder || "desc",
      search: params.search,  
      subsc_name: params.subsc_name,
      subsc_type: params.subsc_type,
      subsc_price: params.subsc_price,
      subsc_currency: params.subsc_currency,
      department_name: params.department_name,
      subsc_status: params.subsc_status,
    },
    withCredentials: true,
  });

  return response.data;
};


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





