import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../services/authService";

import toast, { Toaster } from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleConfirmChange = (value: string) => {
    setConfirm(value);
    if (newPassword && value && newPassword !== value) {
      setError("Passwords do not match");
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || !confirm) {
      setError("Both fields are required");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setError("");

    try {
      await resetPassword(token, newPassword);
      toast.success("Password reset successfully!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to reset password. The link may have expired.");
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-10 rounded-lg shadow-md w-full max-w-md"
        >
          <h2 className="text-3xl font-bold text-center mb-1 text-gray-900 tracking-wide">
            Reset Password
          </h2>
          <p className="text-gray-500 text-center mb-6">
            Enter and confirm your new password
          </p>

          {/* New Password */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mb-4">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => {
                const value = e.target.value;
                setNewPassword(value);

                // Live password length validation
                if (value.length > 0 && value.length < 6) {
                  setError("Password must be at least 6 characters long");
                } else if (confirm && value !== confirm) {
                  setError("Passwords do not match");
                } else {
                  setError("");
                }
              }}
              placeholder="New password"
              className={`w-full border p-2 rounded mb-1 pr-10 ${
                error && !confirm ? "border-red-500" : "border-gray-300"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-2.5 text-gray-500"
            >
              {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Confirm Password */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mb-2">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => handleConfirmChange(e.target.value)}
              placeholder="Confirm password"
              className={`w-full border p-2 rounded mb-1 pr-10 ${
                error ? "border-red-500" : "border-gray-300 "
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-2.5 text-gray-500"
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <div className="flex items-center justify-between mt-4">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 cursor-pointer hover:bg-blue-700 transition"
            >
              Reset Password
            </button>

            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-sm text-blue-600 underline cursor-pointer hover:text-blue-800 transition"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ResetPassword;
