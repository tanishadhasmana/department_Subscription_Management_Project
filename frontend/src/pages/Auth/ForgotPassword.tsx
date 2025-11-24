import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { forgotPassword } from "../../services/authService";
import toast, { Toaster } from "react-hot-toast";
import { EMAIL_REGEX } from "../../components/common/regexPatterns";

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
      await forgotPassword(data.email);
      toast.success(
        "Reset link sent successfully! Check your Mailtrap inbox in dev."
      );
      setTimeout(() => nav("/login"), 1500);
    } catch {
      toast.error("Admin with that email does not exist.");
    }
  };

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-10 rounded-lg shadow-md w-full max-w-md"
        >
          <h2 className="text-3xl font-bold text-center mb-1 text-gray-900 tracking-wide">
            Forgot Password
          </h2>
          <p className="text-gray-500 text-center mb-6">
            Enter your email to receive a reset link
          </p>

          {/* Email Label */}
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email <span className="text-red-500">*</span>
          </label>

          {/* Email Input */}
          <input
            {...register("email", {
              required: "Email is required",
              validate: (value) =>
                value.trim() === ""
                  ? "Email cannot be empty or contain spaces"
                  : true,
              pattern: {
                value: EMAIL_REGEX,
                message: "Enter a valid email address",
              },
            })}
            placeholder="Enter your email"
            className={`w-full border p-2 rounded mb-1 ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            onBlur={(e) => {
              e.target.value = e.target.value.trim();
            }}
          />
          {errors.email && (
            <p className="text-red-500 text-sm mb-3">{errors.email.message}</p>
          )}

          <div className="flex items-center justify-between mt-4">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50 cursor-pointer hover:bg-blue-700 transition"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>

            <button
              type="button"
              onClick={() => nav("/login")}
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

export default ForgotPassword;
