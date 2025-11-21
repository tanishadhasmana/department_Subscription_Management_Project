// auth provider
/* eslint-disable @typescript-eslint/no-explicit-any */
// src/contexts/AuthProvider.tsx
import { useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { User } from "../types/User";
import api from "../lib/api";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";

interface AuthProviderProps {
  children: ReactNode;
}
// inside the auth provider, the global state and navigation logic is handled, wrap whole app with the provider so every page can accss that user, login, logout, permissions etc.
export const AuthProvider = ({ children }: AuthProviderProps) => {
  // store the logged in user, inintially null
  const [user, setUser] = useState<User | null>(null);
  // While checking session, we show loading spinner, We hide main app content until session check is done.
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
// our requirement is not like user- is user exists or not, so we create a boolean variable to check if user is authenticated or not, means true or false, means it gives  us clean boolean.
  const isAuthenticated = !!user;

  // taking T or F based on permission name passed
  const hasPermission = (permissionName: string): boolean => {
    // if no user or no permissions, return false
    if (!user || !user.permissions) return false;
// user.permission is expecting an array, purpose it to check if user.permissions having matching name as permissionName passed, then return true, otherwise false,  "some" arr method to iterate over array
    return user.permissions.some((perm) => {
      if (typeof perm === "string") return perm === permissionName;
      return (perm as any).name === permissionName;
    });
  };
// we wrapped our checksession fucn, inside use callback, so that it does not create fucns across every re-render.
const checkSession = useCallback(async () => {
  try {
    //we check for the authenticated session, withcredentials true to send the cookie along with request
    const res = await api.get("/users/me", { withCredentials: true });
    // extract user from response
    const backendUser = res.data?.user;
// if backend gives user data, we map it to our frontend user type
    if (backendUser) {
      const mappedUser: User = {
         id: backendUser.id,
          first_name: backendUser.first_name,
          last_name: backendUser.last_name,  
          email: backendUser.email,
          phone_no: backendUser.phone_no,   
          role_id: backendUser.role_id,
          role_name: backendUser.role_name,
          status: backendUser.status,
          permissions: backendUser.permissions || [],
      };
// set the user state with mapped user, and if no user from backend, set user to null
      setUser(mappedUser);
    } else {
      setUser(null);
    }
  } catch (err: any) {
    // if 401 means not authenticated.
    if (err?.response?.status === 401) {
      // session not found — don't spam console with stack traces
    } else {
      console.error("Session check failed:", err);
    }
    setUser(null);
    // no matter if the session check succeeds or fails, we stop the loading state, so that app can render the login page.
  } finally {
    setLoading(false);
  }
}, []);


  // automatic session check on component mount/render
  useEffect(() => {
    checkSession();
  }, [checkSession]);
// to log in the user, we set the user state with user data passed from login form
const login = async (userData: User) => {
  if (!userData.permissions) userData.permissions = [];
  setUser(userData);
  // after login, set loading to false to allow app to render
  setLoading(false);
  // Immediately re-check session from server so backend cookie is validated
  // (this is safe even if cookie is already present)
  try {
    await checkSession();
  } catch {
    // ignore - checkSession already handles errors
  }
};


 const logout = async () => {
    try {
      await api.post("/users/logout", {}, { withCredentials: true });
    } catch {
      console.warn("Logout failed");
    }
    // clear user state on logout, navigate to login page
    setUser(null);
    navigate("/login");
  };

 if (loading) {
    return (
      <div className="flex justify-center items-center gap-2 text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading session</p>
      </div>
    );
  }

  return (
    // provide the auth context values to the rest of the app.
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        loading,
        isAuthenticated,
        hasPermission,
      }}
    >
      {/* everything inside authprovider is treated as children */}
      {children}
    </AuthContext.Provider>
  );
};



