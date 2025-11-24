// src/services/authService.ts
import api from "../lib/api";

export const loginRequest = async (email: string, password: string) => {
  return await api.post(
    "/users/login",
    { email, password },
    { withCredentials: true }
  );
};

export const verifyOTPRequest = async (userId: number | null, otp: string) => {
  return await api.post(
    "/users/verify-otp",
    { userId, otp },
    { withCredentials: true }
  );
};

export const resendOTPRequest = async (userId: number | null) => {
  return await api.post(
    "/users/resend-otp",
    { userId },
    { withCredentials: true }
  );
};

export const forgotPassword = async (email: string) => {
  return await api.post("/password/forgot-password", { email });
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resetPassword = async (token: string, payload: any) => {
  return await api.post(`/password/reset-password/${token}`, payload);
};
