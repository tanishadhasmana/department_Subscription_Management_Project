export type UserStatus = "active" | "inactive";

export interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_no?: string;
  status: "active" | "inactive";
  department_name?: string;
  role_id?: number;
  role_name?: string; // We'll fill this dynamically
  permissions?: string[];
  
}
