import { Request, Response } from "express";
import {
  getAllSubscriptionsService,
  getSubscriptionByIdService,
  createSubscriptionService,
  updateSubscriptionService,
  deleteSubscriptionService,
  getSubscriptionsCountService,
  exportSubscriptionsCSVService,
} from "../services/subscriptionService";
import { responseMessage } from "../utils/responseMessage";
import { validationMessage } from "../utils/validationMessage";
import { schemas } from "../validation/Validation";

// ----------------------------
// Get Subscriptions Count
// ----------------------------
export const getSubscriptionsCount = async (req: Request, res: Response) => {
  try {
    const total = await getSubscriptionsCountService();
    return res.status(200).json({
      success: true,
      message: responseMessage.fetched("Subscription count"),
      total,
    });
  } catch (error: any) {
    console.error("Failed to get subscriptions count:", error);
    return res.status(500).json({
      success: false,
      message: responseMessage.error("getting subscription count"),
      error: error.message,
    });
  }
};

export const getAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortBy = (req.query.sortBy as string) || undefined;
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

    // ✅ Collect all possible filters dynamically
    const filters = {
      subsc_name: req.query.subsc_name as string,
      subsc_type: req.query.subsc_type as string,
      subsc_price: req.query.subsc_price as string,
      subsc_currency: req.query.subsc_currency as string,
      department_name: req.query.department_name as string,
      subsc_status: req.query.subsc_status as string,
    };

    const result = await getAllSubscriptionsService(
      page,
      limit,
      filters,
      sortBy,
      sortOrder
    );

    return res.status(200).json({
      success: true,
      message: responseMessage.subscription.fetchSuccess,
      ...result,
    });
  } catch (error: any) {
    console.error("Error in getAllSubscriptions controller:", error);
    return res.status(500).json({
      success: false,
      message: responseMessage.error("fetching subscriptions"),
      error: error.message,
    });
  }
};





// ----------------------------
// Get Subscription by ID
// ----------------------------
export const getSubscriptionById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id))
      return res
        .status(400)
        .json({ success: false, message: responseMessage.invalidInput("ID") });

    const subscription = await getSubscriptionByIdService(id);
    if (!subscription)
      return res
        .status(404)
        .json({
          success: false,
          message: responseMessage.subscription.notFound,
        });

    return res.status(200).json({
      success: true,
      message: responseMessage.fetched("Subscription"),
      data: subscription,
    });
  } catch (error: any) {
    console.error("Error fetching subscription by ID:", error);
    return res.status(500).json({
      success: false,
      message: responseMessage.error("fetching subscription"),
      error: error.message,
    });
  }
};

// ----------------------------
// Export All Subscriptions (CSV)
// ----------------------------
export const exportAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const { csvContent } = await exportSubscriptionsCSVService();
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=subscriptions_export.csv"
    );
    res.setHeader("Content-Type", "text/csv");

    return res.status(200).send(csvContent);
  } catch (error: any) {
    console.error("Export failed:", error);
    return res.status(500).json({
      success: false,
      message: responseMessage.error("exporting subscriptions"),
      error: error.message,
    });
  }
};

// ----------------------------
// Create Subscription
// ----------------------------
export const createSubscription = async (req: Request, res: Response) => {

  try {
    const validation = schemas.subscriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message:
          validation.error.issues[0].message ||
          validationMessage.invalid("input"),
      });
    }

    const subscription = await createSubscriptionService(validation.data);

    return res.status(201).json({
      success: true,
      message: responseMessage.subscription.createSuccess,
      data: subscription,
    });
  } catch (error: any) {
    console.error("Create subscription error:", error);
    return res.status(400).json({
      success: false,
      // message: responseMessage.error("creating subscription"),
      // error: error.message,


      // message: "Subscription for this department already exists",

      message: error.message || "Failed to create subscription", 
    });
  }
};


export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const subscriptionId = Number(req.params.id);
    if (isNaN(subscriptionId)) {
      return res
        .status(400)
        .json({ success: false, message: validationMessage.invalid("ID") });
    }

    const validation = schemas.updateSubscriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues[0].message || validationMessage.invalid("input"),
      });
    }

    const updatedSubscription = await updateSubscriptionService(
      subscriptionId,
      validation.data
    );

    if (!updatedSubscription) {
      return res
        .status(404)
        .json({ success: false, message: responseMessage.subscription.notFound });
    }

    return res.status(200).json({
      success: true,
      message: responseMessage.subscription.updateSuccess,
      data: updatedSubscription,
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: responseMessage.error("updating subscription"),
      error: error.message,
    });
  }
};


// ----------------------------
// Delete Subscription
// ----------------------------
export const deleteSubscription = async (req: Request, res: Response) => {
  try {
    const subscriptionIdToDelete = Number(req.params.id);
    if (isNaN(subscriptionIdToDelete))
      return res
        .status(400)
        .json({ success: false, message: responseMessage.invalidInput("ID") });

    const performedById = req.user?.id;
    if (!performedById)
      return res
        .status(401)
        .json({ success: false, message: responseMessage.unauthorized });

    const deleted = await deleteSubscriptionService(
      subscriptionIdToDelete,
      performedById
    );

    if (!deleted)
      return res
        .status(404)
        .json({
          success: false,
          message: responseMessage.subscription.notFound,
        });

    return res.status(200).json({
      success: true,
      message: responseMessage.subscription.deleteSuccess,
    });
  } catch (error: any) {
    console.error("Delete subscription error:", error);
    return res.status(500).json({
      success: false,
      message: responseMessage.error("deleting subscription"),
      error: error.message,
    });
  }
};
