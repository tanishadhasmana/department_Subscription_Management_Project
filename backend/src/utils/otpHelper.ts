// backend/src/utils/otpHelper.ts
import crypto from "crypto";
import { encrypt, decrypt } from "./cryptoHashing";

/**
 * Generate a random 6-digit OTP
 */
export const generateOTP = (): string => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Encrypt OTP before storing in database
 */
export const encryptOTP = (otp: string): string => {
  return encrypt(otp);
};

/**
 * Decrypt OTP from database
 */
export const decryptOTP = (encryptedOTP: string): string => {
  return decrypt(encryptedOTP);
};

/**
 * Check if OTP has expired (2 minutes = 120000ms)
 */
export const isOTPExpired = (expiresAt: Date): boolean => {
  return new Date() > new Date(expiresAt);
};

/**
 * Get remaining time in seconds
 */
export const getRemainingTime = (expiresAt: Date): number => {
  const now = new Date().getTime();
  const expiry = new Date(expiresAt).getTime();
  const remaining = Math.max(0, Math.floor((expiry - now) / 1000));
  return remaining;
};