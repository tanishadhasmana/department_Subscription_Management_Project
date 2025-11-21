import { Navigate, Routes, Route } from "react-router-dom";
import MainLayout from "../components/Layout/MainLayout";
import { ProtectedRoute } from "../components/common/ProtectedRoute.tsx";
import { useAuth } from "../hooks/useAuth";

// pages
import Dashboard from "../pages/Dashboard/Dashboard";
import SubscriptionList from "../pages/Subscription/SubscriptionList";
import UserList from "../pages/User/UserList";
import AddSubscription from "../pages/Subscription/AddSubscription.tsx";

// auth pages
import Login from "../pages/Auth/Login";
import ForgotPass from "../pages/Auth/ForgotPassword.tsx";
import ResetPassword from "../pages/Auth/ResetPassword.tsx";

const AppRouter = () => {
  const { user, loading } = useAuth();

  // prevent rendering routes before knowing if user is authenticated
  if (loading) return <div className="text-center mt-20">Loading session...</div>;

  return (
    <Routes>
      {/* 🔓 Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route path="/forgot-password" element={<ForgotPass />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* 🔐 Protected routes */}
      {user && (
        <Route element={<MainLayout />}>
          {/* Dashboard */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Users */}
          <Route
            path="/users"
            element={
              <ProtectedRoute requiredPermission="user_list">
                <UserList />
              </ProtectedRoute>
            }
          />
          

          {/* Subscriptions */}
          <Route
            path="/subscription"
            element={
              <ProtectedRoute requiredPermission="subscription_list">
                <SubscriptionList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription/add"
            element={
              <ProtectedRoute requiredPermission="subscription_add">
                <AddSubscription />
              </ProtectedRoute>
            }
          />
          <Route
            path="/subscription/edit/:id"
            element={
              <ProtectedRoute requiredPermission="subscription_edit">
                <AddSubscription />
              </ProtectedRoute>
            }
          />
        </Route>
      )}

      {/* Redirect all other routes */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

export default AppRouter;
