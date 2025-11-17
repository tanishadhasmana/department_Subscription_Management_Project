// frontend/src/services/dashboardService.ts
import api from "../lib/api";
import type {
  DashboardMetrics,
  Department,
} from "../types/Dashboard";

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

  if (filters?.startDate) params.startDate = filters.startDate;
  if (filters?.endDate) params.endDate = filters.endDate;

  if (filters?.departments && filters.departments.length > 0) {
    params.departments = filters.departments.join(",");
  }

  if (filters?.subscriptionType) params.subscriptionType = filters.subscriptionType;
  if (filters?.status) params.status = filters.status;

  const res = await api.get("/dashboard/metrics", {
    params,
    withCredentials: true,
  });

  return res.data.data as DashboardMetrics;
};

export const getAllDepartments = async (): Promise<Department[]> => {
  const res = await api.get("/departments", { withCredentials: true });

  if (res.data.departments) {
    return res.data.departments as Department[];
  }

  return res.data as Department[];
};







// // frontend/src/services/dashboardService.ts
// import api from "../lib/api";


// export interface DashboardFilters {
//   startDate?: string;
//   endDate?: string;
//   departments?: string[];
//   subscriptionType?: string;
//   status?: string;
// }

// export const getDashboardMetrics = async (filters?: DashboardFilters) => {
//   const params: Record<string, string> = {};
  
//   if (filters?.startDate) params.startDate = filters.startDate;
//   if (filters?.endDate) params.endDate = filters.endDate;
//   if (filters?.departments && filters.departments.length > 0) {
//     params.departments = filters.departments.join(',');
//   }
//   if (filters?.subscriptionType) params.subscriptionType = filters.subscriptionType;
//   if (filters?.status) params.status = filters.status;

//   const res = await api.get("/dashboard/metrics", {
//     params,
//     withCredentials: true,
//   });

//   return res.data.data;
// };

// export const getAllDepartments = async () => {
//   const res = await api.get("/departments", { withCredentials: true });
//   return res.data.departments || res.data;
// };