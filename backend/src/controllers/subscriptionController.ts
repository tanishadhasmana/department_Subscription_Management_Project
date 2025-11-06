import { Request, Response } from "express";
import { getAllSubscriptionsService } from "../services/subscriptionService";
import { responseMessage } from "../utils/responseMessage";

export const getAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const subs = await getAllSubscriptionsService();
    res.status(200).json({
      success: true,
      message: responseMessage.fetched("Subscriptions"),
      data: subs,
    });
  } catch (error: any) {
    console.error("Subscription Fetch Error:", error.message);
    res.status(500).json({
      success: false,
      message: responseMessage.error("subscriptions"),
      error: error.message,
    });
  }
};
