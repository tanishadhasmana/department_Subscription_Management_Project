export type UserStatus = "active" | "inactive";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role_id: number;           // ✅ Match backend (snake_case)
  departmentName: string;    // ✅ This is what backend sends as department_name
  status: UserStatus;
  profileImage?: string;
  createdAt?: string;
  updatedAt?: string | null;
  permissions?: string[];    // ✅ Array of permission names
}




// export type UserRole = "user" | "admin" | string;
// export type UserStatus = "active" | "inactive";



// export interface User {
//   id: number;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phone?: string | null;
//   roleId: number;      // Added for backend consistency
//   role: UserRole;      // for display
//   status: UserStatus;
//   profileImage?: string;
//   createdAt: string;
//   updatedAt?: string | null;
//   permissions?: string[];
// }

