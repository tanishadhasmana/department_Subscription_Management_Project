import api from "../lib/api";
import type { PermissionItem } from "../types/Permission";

export const getAllPermissions = async (): Promise<PermissionItem[]> => {
  const res = await api.get("/permissions");
  return res.data;
};

export const getRolePermissions = async (roleId: number): Promise<number[]> => {
  const res = await api.get(`/permissions/role/${roleId}`);
  return res.data; // should be number[]
};
