import { Request, Response } from "express";
import { getDepartmentWiseSubscriptionsService } from "../services/dashboardService";
import { responseMessage } from "../utils/responseMessage";

export const getDepartmentWiseSubscriptions = async (req: Request, res: Response) => {
  try {
    const data = await getDepartmentWiseSubscriptionsService();
    res.status(200).json({
      success: true,
      message: responseMessage.fetched("Department-wise subscriptions"),
      data,
    });
  } catch (error: any) {
    console.error("Dashboard Error:", error.message);
    res.status(500).json({
      success: false,
      message: responseMessage.error("dashboard data"),
      error: error.message,
    });
  }
};
