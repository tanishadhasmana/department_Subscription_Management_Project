import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import type { User } from "../../types/User";
import { Eye, EyeOff } from "lucide-react";

interface LoginForm {
  email: string;
  password: string;
}

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

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

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post("/users/login", data, { withCredentials: true });
      const backendUser = res.data.user as User;

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

      login(mappedUser);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Login error:", err);
      setError("email", {
        type: "server",
        message:
          (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
          "Please enter valid email or password.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-10 rounded-lg shadow-md w-full max-w-md"
      >
        <h2 className="text-3xl font-bold text-center mb-1 text-gray-900 tracking-wide">
          LOGIN
        </h2>
        <p className="text-gray-500 text-center mb-6">Sign In to department subscription managemnet</p>

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
        />
        {errors.email && (
          <p className="text-red-500 text-sm mb-2">{errors.email.message}</p>
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
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-2.5 text-gray-500 cursor-pointer"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-500 text-sm mb-2">{errors.password.message}</p>
        )}

        {/* Forgot Password */}
        <div className="text-right mb-4">
          <a href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>

        {/* Login Button */}
        <button
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded mt-1 disabled:opacity-50 cursor-pointer hover:bg-blue-700 transition"
        >
          Login
        </button>
      </form>
    </div>
  );
};

export default Login;


