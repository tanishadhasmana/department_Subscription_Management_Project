// frontend: src/services/subscriptionService.ts
import api from "../lib/api";
import type { Subscription } from "../types/Subscription";

/**
 * Fetch subscriptions with support for:
 * - Multiple filters (AND condition)
 * - Pagination
 * - Sorting
 */
// export const getSubscriptions = async (
//   filters?: Record<string, string | number | undefined>
// , // ✅ now supports multiple filters
//   _unused?: string,                 // keep same call signature to avoid breaking imports
//   page: number = 1,
//   limit: number = 10,
//   sortBy?: string,
//   sortOrder?: "asc" | "desc"
// ): Promise<{
//   subscriptions: Subscription[];
//   total: number;
//   totalPages: number;
//   currentPage: number;
// }> => {
//   const params: Record<string, string | number> = {
//     page,
//     limit,
//   };

//   // ✅ add filters dynamically (example: subsc_name, subsc_type, etc.)
//   if (filters) {
//   Object.entries(filters).forEach(([key, value]) => {
//     if (value === undefined || value === "") return;

//     // If string → trim 
//     if (typeof value === "string") {
//       params[key] = value.trim();
//     } 
//     // If number → convert to string or send as number
//     else if (typeof value === "number") {
//       params[key] = value;
//     }
//   });
// }


//   // ✅ add sorting if present
//   if (sortBy) params.sortBy = sortBy;
//   if (sortOrder) params.sortOrder = sortOrder;

//   // make GET request with params automatically encoded
//   const res = await api.get("/subscriptions", {
//     params,
//     withCredentials: true,
//   });

//   return res.data;
// };

// ✅ Leave everything else as it is (no changes below this line)

// Get subscription by ID

// export const getSubscriptions = async (params: {
//   page: number;
//   limit: number;
//   sortBy?: string;
//   sortOrder?: "asc" | "desc";
//   search?: string;
//   subsc_name?: string;
//   subsc_type?: string;
//   subsc_price?: string;
//   subsc_currency?: string;
//   department_name?: string;
//   subsc_status?: string;
// }) => {
//   let url = `/subscriptions?page=${params.page}&limit=${params.limit}`;

//   if (params.search && params.search.trim() !== "") {
//     url += `&search=${encodeURIComponent(params.search.trim())}`;
//   }

//   if (params.subsc_name) url += `&subsc_name=${encodeURIComponent(params.subsc_name)}`;
//   if (params.subsc_type) url += `&subsc_type=${encodeURIComponent(params.subsc_type)}`;
//   if (params.subsc_price) url += `&subsc_price=${encodeURIComponent(params.subsc_price)}`;
//   if (params.subsc_currency) url += `&subsc_currency=${encodeURIComponent(params.subsc_currency)}`;
//   if (params.department_name) url += `&department_name=${encodeURIComponent(params.department_name)}`;
//   if (params.subsc_status) url += `&subsc_status=${encodeURIComponent(params.subsc_status)}`;

//   if (params.sortBy) url += `&sortBy=${encodeURIComponent(params.sortBy)}`;
//   if (params.sortOrder) url += `&sortOrder=${params.sortOrder}`;

//   const res = await api.get(url, { withCredentials: true });
//   return res.data;
// };



export const getSubscriptions = async (params: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;  // ✅ Global search term
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
      search: params.search,  // ✅ Pass search parameter
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





