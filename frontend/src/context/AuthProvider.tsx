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

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const isAuthenticated = !!user;

  const hasPermission = (permissionName: string): boolean => {
    if (!user || !user.permissions) return false;

    return user.permissions.some((perm) => {
      if (typeof perm === "string") return perm === permissionName;
      return (perm as any).name === permissionName;
    });
  };

  // Move checkSession into component scope so all effects can call it
  // const checkSession = useCallback(async () => {
  //   try {
  //     const res = await api.get("/users/me", { withCredentials: true });
  //     const backendUser = res.data?.user;

  //     if (backendUser) {
  //       const mappedUser: User = {
  //         id: backendUser.id,
  //         firstName: backendUser.first_name,
  //         lastName: backendUser.last_name,
  //         email: backendUser.email,
  //         phone: backendUser.phone_no,
  //         role_id: backendUser.role_id,
  //         departmentName: backendUser.department_name,
  //         status: backendUser.status,
  //         permissions: backendUser.permissions || [],
  //       };

  //       console.log("Session verified, user:", mappedUser);
  //       setUser(mappedUser);
  //     } else {
  //       setUser(null);
  //     }
  //   } catch (err: any) {
  //     console.log("Session check failed:", err.response?.status);
  //     setUser(null);
  //   } finally {
  //     setLoading(false);
  //   }
  // }, []);
  // inside AuthProvider (keep your imports and other code)
const checkSession = useCallback(async () => {
  try {
    // we purposely do not log this request success always — keep logs minimal
    const res = await api.get("/users/me", { withCredentials: true });
    const backendUser = res.data?.user;

    if (backendUser) {
      const mappedUser: User = {
        id: backendUser.id,
        firstName: backendUser.first_name,
        lastName: backendUser.last_name,
        email: backendUser.email,
        phone: backendUser.phone_no,
        role_id: backendUser.role_id,
        departmentName: backendUser.department_name,
        status: backendUser.status,
        permissions: backendUser.permissions || [],
      };

      setUser(mappedUser);
    } else {
      setUser(null);
    }
  } catch (err: any) {
    // Quietly handle 401 (no session) — only log non-401 unexpected errors
    if (err?.response?.status === 401) {
      // session not found — don't spam console with stack traces
      // console.log("No active session (401)"); // optional small log
    } else {
      console.error("Session check failed:", err);
    }
    setUser(null);
  } finally {
    setLoading(false);
  }
}, []);


  // initial session check
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // const login = (userData: User) => {
  //   if (!userData.permissions) userData.permissions = [];
  //   console.log("Logging in user:", userData);
  //   setUser(userData);
  //   setLoading(false);
  // };

const login = async (userData: User) => {
  if (!userData.permissions) userData.permissions = [];
  setUser(userData);
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

    setUser(null);
    navigate("/login");
  };

 if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Loading session...</p>
      </div>
    );
  }

  return (
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
      {children}
    </AuthContext.Provider>
  );
};





// import { useState, useEffect } from "react";
// import type { ReactNode } from "react";
// import type { User } from "../types/User";
// import api from "../lib/api";
// import { useNavigate } from "react-router-dom";
// import { AuthContext } from "./AuthContext";

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider = ({ children }: AuthProviderProps) => {
//   // hold current user state, or if not logged in, null
//   const [user, setUser] = useState<User | null>(null);
//   // loading state while checking session, true until it checks if a user session exists
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const checkSession = async () => {
//       try {
//         // this is checkiing the session cookie when the app loads
//         const res = await api.get("/users/me", { withCredentials: true });
//         // here |(union type) says this could be User or null, and of either any of type of user or null, and || is or means if we are not getting any user from response, then it treate as null, never crash.
//         const fetchedUser: User | null = res.data?.user || null;
//         console.log("Fetched user:", fetchedUser);
//         // this check 2 conditions like, there must be a user, and no matter if backeend passing the permissions field or not, we ensure that permissions field is always an empty array, if there is no permissions passses.
//         if (fetchedUser && !fetchedUser.permissions) {
//           fetchedUser.permissions = [];
//         }
// // setting user with fetched user
//         setUser(fetchedUser);
//       } catch (err) {
//         // if any error occurs during the session check, we log the warning and set user to null, as this means no valid session exists
//         console.warn("Session check failed:", err);
//         setUser(null);
//       } finally {
//         // this always run, so after check we make this loading stop false to stop
//         setLoading(false);
//       }
//     };

//     checkSession();
//     // the deoendency array is empty, so this effect runs only once when the component mounts/renders for the first time
//   }, []);

//   // here component login, wants the parameter named userData of type User
//   const login = (userData: User) => {
//     // Ensure permissions array exists, means if backend did not provide permissions, we set it to empty array
//     if (!userData.permissions) userData.permissions = [];
//     setUser(userData); 
//   };

//   const logout = async () => {
//     try {
//       // when user loggedin we set the cookie, which is stored in the breowser, so for log out, we have to pass that cookie to logout that user so that backend can identify which user to log out
//       await api.post("/users/logout", {}, { withCredentials: true }); 
//     } catch {
//       console.warn("Logout failed");
//     }
//     setUser(null);
//     navigate("/login");
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen text-gray-500">
//         Loading session...
//       </div>
//     );
//   }

//   return (
//     <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

