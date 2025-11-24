// src/services/departmentService.ts
import api from "../lib/api";

export type Department = {
  id: number;
  department_name: string;
};

export const getDepartments = async (): Promise<Department[]> => {
  const res = await api.get("/departments", { withCredentials: true });
  // adjust depending on backend shape:
  // if backend returns { departments: [...] } -> return res.data.departments
  // otherwise return res.data
  return res.data?.departments ?? res.data;
};
