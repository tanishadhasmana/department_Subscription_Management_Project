// frontend/src/pages/Auth/Login.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import type { User } from "../../types/User";
import { Eye, EyeOff } from "lucide-react";
import TwoFactor from "../Auth/TwoFactorPage";
import toast from "react-hot-toast";

interface LoginForm {
  email: string;
  password: string;
}

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [pendingUserId, setPendingUserId] = useState<number | null>(null);
  const [pendingEmail, setPendingEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  // Step 1: Submit credentials and trigger OTP if required
  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post("/users/login", data, { withCredentials: true });

      if (res.data?.requiresOTP) {
        setPendingUserId(res.data.userId ?? null);
        setPendingEmail(res.data.email ?? "");
        setShowOTPModal(true);
        toast.success("OTP sent to your email!");
      } else if (res.data?.success && res.data?.user) {
        // If backend logs in directly without OTP
        const backendUser = res.data.user as User;
        login({
          ...backendUser,
          permissions: backendUser.permissions || [],
        });
        toast.success("Login successful!");
        navigate("/dashboard", { replace: true });
      }
  } catch (err: unknown) {
  let message = "Please enter valid email or password.";

  // Check if it's an Axios error shape
  if (
    typeof err === "object" &&
    err !== null &&
    "response" in err &&
    typeof (err as { response?: unknown }).response === "object"
  ) {
    const response = (err as { response?: { data?: { message?: unknown } } }).response;

    if (
      response &&
      typeof response.data === "object" &&
      response.data !== null &&
      "message" in response.data &&
      typeof response.data.message === "string"
    ) {
      message = response.data.message;
    }
  }

  setError("email", {
    type: "server",
    message,
  });
}

  };

const handleVerifyOTP = async (otp: string) => {
  const res = await api.post(
    "/users/verify-otp",
    { userId: pendingUserId, otp },
    { withCredentials: true }
  );

  if (!res.data?.success || !res.data?.user) {
    throw new Error(res.data?.message || "Verification failed");
  }

  const backendUser: User = res.data.user;

  login({
    ...backendUser,
    permissions: backendUser.permissions || [],
  });

  toast.success("Login successful!");
  setShowOTPModal(false);
  navigate("/dashboard", { replace: true });
};

const handleResendOTP = async () => {
  await api.post("/users/resend-otp", { userId: pendingUserId }, { withCredentials: true });
  toast.success("New OTP sent to your email!");
};



  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-10 rounded-lg shadow-md w-full max-w-md"
          noValidate
        >
          <h2 className="text-3xl font-bold text-center mb-1 text-gray-900 tracking-wide">
            LOGIN
          </h2>
          <p className="text-gray-500 text-center mb-6">
            Sign in to department subscription management
          </p>

          {/* Email Field */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            {...register("email", { required: "Email is required" })}
            className={`w-full border p-2 rounded mb-2 ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Email"
            autoFocus
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p id="email-error" className="text-red-500 text-sm mb-2">
              {errors.email.message}
            </p>
          )}

          {/* Password Field */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative mb-2">
            <input
              type={showPassword ? "text" : "password"}
              {...register("password", { required: "Password is required" })}
              className={`w-full border p-2 rounded pr-10 ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Password"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-red-500 text-sm mb-2">
              {errors.password.message}
            </p>
          )}

          {/* Forgot Password */}
          <div className="text-right mb-4">
            <a
              href="/forgot-password"
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 rounded mt-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition"
          >
            {isSubmitting ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>

      {/* TwoFactor */}
      <TwoFactor
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        email={pendingEmail}
      />
    </>
  );
};

export default Login;

