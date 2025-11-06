import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api from "../../lib/api";
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

  // handle password typing and live validation
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
      await api.post("/password/reset-password", { token, newPassword });
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
          className="bg-white p-8 rounded shadow-md w-full max-w-md"
        >
          <h2 className="text-2xl font-semibold mb-6 text-blue-600">
            Reset Password
          </h2>

          {/* New Password */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className={`border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 ${
                  error ? "border-red-500" : ""
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
          </div>

          {/* Confirm Password */}
          <div className="mb-4 relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirm}
                onChange={(e) => handleConfirmChange(e.target.value)}
                placeholder="Confirm password"
                className={`border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 ${
                  error ? "border-red-500" : ""
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
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition cursor-pointer"
          >
            Reset Password
          </button>
        </form>
      </div>
    </>
  );
};

export default ResetPassword;



