// auth context
// src/contexts/AuthContext.tsx
import { createContext } from "react";
import type { User } from "../types/User";

export interface AuthContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  login: (user: User) => void;
  logout: () => Promise<void>;
  loading: boolean;
  isAuthenticated: boolean; 
  hasPermission: (permissionName: string) => boolean; 
}
// create global storage, contrxt doesnt hold data by itself, it defines what data exists in the context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);



// import { createContext } from "react";
// import type { User } from "../types/User";

// export interface AuthContextType {
//   user: User | null;
//   setUser: (user: User | null) => void;
//   login: (user: User) => void;
//   logout: () => Promise<void>;
//   loading: boolean;
// }

// // only export context here
// export const AuthContext = createContext<AuthContextType | undefined>(undefined);
