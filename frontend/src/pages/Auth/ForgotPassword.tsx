import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../../lib/api";
import toast, { Toaster } from "react-hot-toast";

interface FormType {
  email: string;
}

const ForgotPassword: React.FC = () => {
  const nav = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormType>({
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const onSubmit = async (data: FormType) => {
    try {
      await api.post("/password/forgot-password", data);
      toast.success(
        "Reset link sent successfully! Check your Mailtrap inbox in dev."
      );
      setTimeout(() => nav("/login"), 1500);
    } catch (err) {
      console.error(err);
      toast.error("Failed to send reset link. Try again!");
    }
  };

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-8 rounded shadow-md w-full max-w-md"
        >
          <h2 className="text-2xl font-semibold mb-4 text-blue-600">
            Forgot Password
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
            placeholder="Enter your email"
            className={`w-full border p-2 rounded mb-1 ${
              errors.email ? "border-red-500" : ""
            }`}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mb-3">{errors.email.message}</p>
          )}

          <div className="flex items-center justify-between mt-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              type="button"
              onClick={() => nav("/login")}
              className="text-sm text-blue-600 underline cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ForgotPassword;
