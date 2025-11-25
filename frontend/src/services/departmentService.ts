// src/services/departmentService.ts
import api from "../lib/api";

export type Department = {
  id: number;
  department_name: string;
};

export const getDepartments = async (): Promise<Department[]> => {
  const res = await api.get("/departments", { withCredentials: true });
  return res.data?.data ?? [];
};

