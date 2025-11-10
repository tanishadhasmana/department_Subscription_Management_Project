// src/components/common/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { user, loading, hasPermission } = useAuth();

  // Wait for auth to load
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    console.log("❌ ProtectedRoute: No user, redirecting to login");
    return <Navigate to="/login" replace />;
  }

  // Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log("❌ ProtectedRoute: Missing permission:", requiredPermission);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to view this page.</p>
      </div>
    );
  }

  console.log("✅ ProtectedRoute: Access granted for", user.email);
  return <>{children}</>;
};





// src/components/ProtectedRoute.tsx
// import { Navigate } from "react-router-dom";
// import { useAuth } from "../../hooks/useAuth";
// import type { ReactElement } from "react";

// interface ProtectedRouteProps {
//   children: ReactElement;
//   requiredPermission?: string;
// }

// export const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
//   const { user, loading, hasPermission } = useAuth();  // ← ADD hasPermission

//   console.log('ProtectedRoute check:', { 
//     hasUser: !!user, 
//     loading, 
//     requiredPermission,
//     userPermissions: user?.permissions 
//   });

  
//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
//       </div>
//     );
//   }

//   // ✅ Check authentication
//   if (!user) {
//     console.log('Not authenticated, redirecting to login');
//     return <Navigate to="/login" replace />;
//   }

//   // ✅ FIX: Use hasPermission instead of .includes()
//   if (requiredPermission && !hasPermission(requiredPermission)) {
//     console.log(`Access denied: Missing permission '${requiredPermission}'`);
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center max-w-md p-8">
//           <div className="text-6xl mb-4">🚫</div>
//           <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
//           <p className="text-gray-600 mb-6">
//             You don't have permission to access this page.
//           </p>
//           <p className="text-sm text-gray-500 mb-6">
//             Required: <code className="bg-gray-200 px-2 py-1 rounded">{requiredPermission}</code>
//           </p>
//           <button
//             onClick={() => window.history.back()}
//             className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//           >
//             Go Back
//           </button>
//         </div>
//       </div>
//     );
//   }

//   return children;
// };

