// backend/src/controllers/dashboardController.ts
import { Request, Response } from "express";
import { getDashboardMetricsService } from "../services/dashboardService";
import { responseMessage } from "../utils/responseMessage";

export const getDashboardMetrics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, departments, subscriptionType, status } = req.query;

    const filters = {
      startDate: startDate as string | undefined,
      endDate: endDate as string | undefined,
      departments: departments ? (departments as string).split(",") : undefined,
      subscriptionType: subscriptionType as string | undefined,
      status: status as string | undefined,
    };

    const metrics = await getDashboardMetricsService(filters);
     return res.status(200).json({
      success: true,
      message: responseMessage.dashboard.metricsFetched,
      data: metrics
    });
  } catch (err: any) {
    console.error("Failed to fetch dashboard metrics:", err);
    return res.status(500).json({
      success: false,
      message: err.message || responseMessage.error("dashboard metrics")
    });
  }
};

