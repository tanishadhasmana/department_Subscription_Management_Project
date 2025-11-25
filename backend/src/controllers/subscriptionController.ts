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
       message: responseMessage.subscription.countFetched,
      data: { total }
    });
  } catch (error: any) {
    console.error("Failed to get subscriptions count:", error);
    return res.status(500).json({
      success: false,
      message: error.message || responseMessage.error("subscription count")
    });
  }
};

export const getAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const sortBy = (req.query.sortBy as string) || undefined;
    const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

    // Collect all possible filters dynamically
    const filters = {
      subsc_name: req.query.subsc_name as string,
      subsc_type: req.query.subsc_type as string,
      subsc_price: req.query.subsc_price as string,
      subsc_currency: req.query.subsc_currency as string,
      department_name: req.query.department_name as string,
      subsc_status: req.query.subsc_status as string,
    };

const search = typeof req.query.search === "string" && req.query.search.trim() !== "" ? req.query.search.trim() : undefined;

const result = await getAllSubscriptionsService(
  page,
  limit,
  filters,
  sortBy,
  sortOrder,
  search //all as string are searchable
);

    return res.status(200).json({
      success: true,
      message: responseMessage.subscription.fetchSuccess,
      data: result.subscriptions,
      total: result.total,
      totalPages: result.totalPages,
      currentPage: result.currentPage
    });
  } catch (error: any) {
    console.error("Error in getAllSubscriptions controller:", error);
    return res.status(500).json({
      success: false,
      message: error.message || responseMessage.error("subscriptions")
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
      return res.status(400).json({
        success: false,
        message: responseMessage.subscription.invalidId
      });
    const subscription = await getSubscriptionByIdService(id);
    if (!subscription)
      return res.status(404).json({
        success: false,
        message: responseMessage.subscription.notFound
      });

   return res.status(200).json({
      success: true,
      message: responseMessage.fetched("Subscription"),
      data: subscription
    });
  } catch (error: any) {
    console.error("Error fetching subscription by ID:", error);
    return res.status(500).json({
      success: false,
      message: error.message || responseMessage.error("subscription")
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
        message: validation.error.issues[0].message || responseMessage.invalidInput()
      });
    }

    const subscription = await createSubscriptionService(validation.data);
    return res.status(201).json({
      success: true,
      message: responseMessage.subscription.createSuccess,
      data: subscription
    });
  } catch (error: any) {
    console.error("Create subscription error:", error);
  return res.status(400).json({
      success: false,
      message: error.message || responseMessage.error("subscription creation")
    });
  }
};


export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const subscriptionId = Number(req.params.id);
    if (isNaN(subscriptionId)) {
       return res.status(400).json({
        success: false,
        message: responseMessage.subscription.invalidId
      });
    }

    const validation = schemas.updateSubscriptionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.issues[0].message || responseMessage.invalidInput()
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
      data: updatedSubscription
    });
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message || responseMessage.error("subscription update")
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
     return res.status(400).json({
        success: false,
        message: responseMessage.subscription.invalidId
      });

    const performedById = req.user?.id;
    if (!performedById)
     return res.status(401).json({
        success: false,
        message: responseMessage.unauthorized
      });

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
