// frontend/src/services/dashboardService.ts
import api from "../lib/api";
import type {
  DashboardMetrics,
  Department,
} from "../types/Dashboard";

// as in tsx file, we are having filters={startDate, endDate, departments, subscriptionType, status}, and same in dahboardfilters
export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  departments?: string[];
  subscriptionType?: string;
  status?: string;
}

export const getDashboardMetrics = async (
  filters?: DashboardFilters
): Promise<DashboardMetrics> => {
  const params: Record<string, string> = {};
// as the filter is optional, we check if it exists, then we set those params
  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;

  if (filters?.departments && filters.departments.length > 0) {
    params.departments = filters.departments.join(",");
  }

  if (filters?.subscriptionType) params.subscriptionType = filters.subscriptionType;
  if (filters?.status) params.status = filters.status;
// if we ask filter by dept, status, subsc type, startdate, enddate, we make that req with those params
  const res = await api.get("/dashboard/metrics", {
    params,
    withCredentials: true,
  });
// return the data as DashboardMetrics type
  return res.data.data as DashboardMetrics;
};
// fetch all departments from backend to show in filter dropdown

// export const getAllDepartments = async (): Promise<Department[]> => {
//   // making a get request to /departments
//   const res = await api.get("/departments", { withCredentials: true });
// // If the response data has a departments field, return that as Department array
//   if (res.data.departments) {
//     return res.data.departments as Department[];
//   }

//   return res.data as Department[];
// };

export const getAllDepartments = async () => {
  const res = await api.get("/departments", { withCredentials: true });

  // Backend shape: { success, message, data: [...] }
  if (Array.isArray(res.data?.data)) {
    return res.data.data;
  }

  console.error("Unexpected departments API shape:", res.data);
  throw new Error("Invalid departments response format");
};
