export type UserStatus = "active" | "inactive";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_no?: string;
  status: "active" | "inactive";
  role_id?: number;
  role_name?: string;
  permissions?: string[];
  created_at?: string;
  updated_at?: string;
}


