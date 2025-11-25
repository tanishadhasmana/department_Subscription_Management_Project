import { Request, Response } from "express";
import {
  forgotPasswordService,
  resetPasswordService,
} from "../services/passwordService";
import { responseMessage } from "../utils/responseMessage";


// ----------------------------
// Forgot Password
// ----------------------------
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({
      success: false,
      message: responseMessage.missingField("Email")
    });

  try {
    await forgotPasswordService(email);
    return res.status(200).json({
      success: true,
      message: responseMessage.auth.resetLinkSent
    });
    
  } catch (err: any) {
    console.error("forgotPassword error:", err);
   return res.status(500).json({
      success: false,
      message: err.message || responseMessage.error("password reset")
    });
  }
};

// ----------------------------
// Reset Password
// ----------------------------
export const resetPassword = async (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword)
    return res
      .status(400)
      .json({success: false,
      message: "Token and newPassword are required" });

  try {
    await resetPasswordService(token, newPassword);
     return res.status(200).json({
      success: true,
      message: responseMessage.auth.passwordUpdated
    });
  } catch (err: any) {
    console.error("resetPassword error:", err);
     return res.status(400).json({
      success: false,
      message: err.message || "Invalid or expired token"
    });
  }
};

