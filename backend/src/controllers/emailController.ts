import { Request, Response } from "express";
import { checkAndSendReminders } from "../crons/subscriptionReminderCron";
import { testEmailConnection } from "../utils/mailer";

export const testEmailSetup = async (req: Request, res: Response) => {
  try {
    const isConnected = await testEmailConnection();
    
    if (!isConnected) {
      return res.status(500).json({
        success: false,
        message: "Email server connection failed. Check your .env settings.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Email server is configured correctly!",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const triggerManualEmailCheck = async (req: Request, res: Response) => {
  try {
    await checkAndSendReminders();
    
    return res.status(200).json({
      success: true,
      message: "Email check triggered successfully. Check console for details.",
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};