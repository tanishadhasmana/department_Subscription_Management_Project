// src/types/Permission.ts
export interface PermissionItem {
  id: number;
  name: string;
  key?: string; // if your permission table has this column
  status?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

