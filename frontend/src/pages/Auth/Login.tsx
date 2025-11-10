import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../lib/api";
import { useAuth } from "../../hooks/useAuth";
import type { User } from "../../types/User";

interface LoginForm {
  email: string;
  password: string;
}

const Login = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginForm>({
    mode: "onChange", // ✅ validate while typing
    reValidateMode: "onChange",
  });

  useEffect(() => {
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post("/users/login", data, {
        withCredentials: true,
      });

      const backendUser = res.data.user;

      // ✅ Map backend response to frontend User type
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

      console.log("Mapped user:", mappedUser);
      login(mappedUser);

      navigate("/dashboard", { replace: true });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Login error:", err);
      setError("email", {
        type: "server",
        message:
          err.response?.data?.message ||
          "Please enter valid email or password.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-4 text-blue-600">
          Department Subscription Login
        </h2>

        {/* Email */}
        <input
          {...register("email", {
            required: "Email is required",
            // pattern: {
            //   value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/i,
            //   message: "Enter a valid email address",
            // },
          })}
          className={`w-full border p-2 rounded mb-1 ${
            errors.email ? "border-red-500" : ""
          }`}
          placeholder="Email"
          autoFocus
        />
        {errors.email && (
          <p className="text-red-500 text-sm mb-2">{errors.email.message}</p>
        )}

        {/* Password */}
        <input
          type="password"
          {...register("password", {
            required: "Password is required",
          })}
          className={`w-full border p-2 rounded mb-1 ${
            errors.password ? "border-red-500" : ""
          }`}
          placeholder="Password"
        />
        {errors.password && (
          <p className="text-red-500 text-sm mb-2">{errors.password.message}</p>
        )}

        <button
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded mt-2 disabled:opacity-50 cursor-pointer"
        >
          Login
        </button>

        <p className="text-right mt-2">
          <a
            className="text-sm text-blue-600 hover:underline"
            href="/forgot-password"
          >
            Forgot password?
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
