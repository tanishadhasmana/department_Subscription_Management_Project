import { Request, Response } from "express";
import { checkAndSendReminders } from "../crons/subscriptionReminderCron";
import { testEmailConnection } from "../utils/mailer";
import { responseMessage } from "../utils/responseMessage";

export const testEmailSetup = async (req: Request, res: Response) => {
  try {
    const isConnected = await testEmailConnection();
    
    if (!isConnected) {
        return res.status(500).json({
        success: false,
        message: responseMessage.email.connectionFailed
      });
    }

    return res.status(200).json({
      success: true,
       message: responseMessage.email.configured
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
      message: responseMessage.email.checkTriggered
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};