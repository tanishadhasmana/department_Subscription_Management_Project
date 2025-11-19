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

    res.status(200).json({
      success: true,
      message: responseMessage.fetched("Dashboard metrics"),
      data: metrics,
    });
  } catch (err: any) {
    console.error("Failed to fetch dashboard metrics:", err);
    res.status(500).json({
      success: false,
      message: err?.message || responseMessage.error("Dashboard metrics"),
    });
  }
};









// // backend/src/controllers/dashboardController.ts
// import { Request, Response } from "express";
// import { getDashboardMetricsService } from "../services/dashboardService";
// import { responseMessage } from "../utils/responseMessage";

// export const getDashboardMetrics = async (req: Request, res: Response) => {
//   try {
//     const { startDate, endDate, departments, subscriptionType, status } = req.query;
    
//     const filters = {
//       startDate: startDate as string,
//       endDate: endDate as string,
//       // if multiple depts as, "1,2,3" like that split into array as ["1","2","3"]
//       departments: departments ? (departments as string).split(',') : undefined,
//       subscriptionType: subscriptionType as string,
//       status: status as string,
//     };
// // Fetch metrics from service, which returns filtered data
//     const metrics = await getDashboardMetricsService(filters);
    
//     res.status(200).json({
//       success: true,
//      message: responseMessage.fetched("Dashboard metrics"),
//       data: metrics,
//     });
//   } catch (err: any) {
//     console.error("Failed to fetch dashboard metrics:", err);
//     res.status(500).json({ 
//       success: false,
//       message: err.message || responseMessage.error("Dashboard metrics")

//     });
//   }
// };

