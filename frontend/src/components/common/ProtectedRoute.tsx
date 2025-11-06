// src/components/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import type { ReactElement } from "react";

interface ProtectedRouteProps {
  children: ReactElement;
  requiredPermission?: string;
}

export const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
  const { user, loading, hasPermission } = useAuth();  // ← ADD hasPermission

  console.log('ProtectedRoute check:', { 
    hasUser: !!user, 
    loading, 
    requiredPermission,
    userPermissions: user?.permissions 
  });

  // ✅ Show loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ✅ Check authentication
  if (!user) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  // ✅ FIX: Use hasPermission instead of .includes()
  if (requiredPermission && !hasPermission(requiredPermission)) {
    console.log(`Access denied: Missing permission '${requiredPermission}'`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md p-8">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Required: <code className="bg-gray-200 px-2 py-1 rounded">{requiredPermission}</code>
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return children;
};




// import { Navigate } from "react-router-dom";
// import { useAuth } from "../../hooks/useAuth";
// import type { ReactElement } from "react";

// interface ProtectedRouteProps {
//   children: ReactElement;
//   requiredPermission?: string;
// }

// export const ProtectedRoute = ({ children, requiredPermission }: ProtectedRouteProps) => {
//   const { user, loading } = useAuth();

//   // ✅ Wait for session loading before checking anything
//   if (loading) return null; // or show a spinner instead

//   // ✅ If still no user after loading → not logged in
//   if (!user) return <Navigate to="/login" replace />;

//   // ✅ Permission check only after session is available
//   if (requiredPermission && !user.permissions?.includes(requiredPermission)) {
//     return <div className="p-4 text-red-600">Access Denied</div>;
//   }

//   return children;
// };


