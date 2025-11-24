// frontend/src/components/Auth/TwoFactorPage.tsx
import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { DIGITS_REGEX } from "../../components/common/regexPatterns";


interface TwoFactorProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<void>;
  onResend: () => Promise<void>;
  email: string;
}

const TwoFactorPage: React.FC<TwoFactorProps> = ({
  isOpen,
  onClose,
  onVerify,
  onResend,
  email,
}) => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timeLeft, setTimeLeft] = useState(120);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setTimeLeft(120); // Reset every time modal opens

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleChange = (index: number, value: string) => {
   if (!DIGITS_REGEX.test(value)) return;


    const arr = [...otp];
    arr[index] = value;
    setOtp(arr);
    setError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData("text").slice(0, 6);

    if (!/^\d+$/.test(paste)) return;

    const arr = paste.split("").concat(Array(6 - paste.length).fill(""));
    setOtp(arr);

    const next = Math.min(paste.length, 5);
    inputRefs.current[next]?.focus();
  };

  // ---- FIXED: Now uses parent callback ----
const handleVerify = async () => {
  setIsVerifying(true);
  setError("");

  try {
    await onVerify(otp.join(""));
  } catch (err: unknown) {
    let errorMessage = "Verification failed";

    if (
      typeof err === "object" &&
      err !== null &&
      "message" in err &&
      typeof (err as { message?: unknown }).message === "string"
    ) {
      errorMessage = (err as { message: string }).message;
    }

    setError(errorMessage);
  } finally {
    setIsVerifying(false);
  }
};

  const handleResend = async () => {
    setIsResending(true);

    try {
      await onResend();
      setTimeLeft(120);
    } catch {
      /* no-op, parent already toasts */
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition"
        >
          <X size={24} />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Two Step Verification
          </h2>
          <p className="text-sm text-gray-600">
            Enter the 6-digit verification code sent to:
          </p>
          <p className="text-xs text-gray-500 mt-2">
            <strong>{email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}</strong>
          </p>
        </div>

        <div className="text-center mb-6">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeLeft <= 30
                ? "bg-red-100 text-red-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            <span className="text-sm font-semibold">Time remaining:</span>
            <span className="text-lg font-bold font-mono">
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Type your 6 digit security code
          </label>

          <div className="flex gap-2 justify-center" onPaste={handlePaste}>
            {otp.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
  inputRefs.current[i] = el;
}}
                type="text"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2"
                disabled={isVerifying}
              />
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 text-center">{error}</p>
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={isVerifying || otp.join("").length !== 6}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {isVerifying ? "Verifying..." : "Verify my account"}
        </button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Didn’t get the code?{" "}
            <button
              onClick={handleResend}
              disabled={isResending || timeLeft > 90}
              className="text-blue-600 hover:underline disabled:text-gray-400"
            >
              {isResending ? "Sending..." : "Resend"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorPage;
