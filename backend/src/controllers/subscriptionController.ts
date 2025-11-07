import { Request, Response } from "express";
import {
  getAllSubscriptionsService,
  getSubscriptionByIdService,
  createSubscriptionService,
  updateSubscriptionService,
  updateSubscriptionStatusService,
  deleteSubscriptionService,
  getSubscriptionsCountService,
  exportSubscriptionsCSVService,
} from "../services/subscriptionService";

// ----------------------------
// Get Subscriptions Count
// ----------------------------
export const getSubscriptionsCount = async (req: Request, res: Response) => {
  try {
    const total = await getSubscriptionsCountService();
    res.status(200).json({ total });
  } catch (err: any) {
    console.error("Failed to get subscriptions count:", err);
    res.status(500).json({ message: err.message || "Failed to get subscriptions count" });
  }
};

// ----------------------------
// Get All Subscriptions
// ----------------------------
export const getAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const { search, column, sortBy, sortOrder, includeCount } = req.query;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const order = (sortOrder === "asc" || sortOrder === "desc") ? (sortOrder as "asc" | "desc") : undefined;
    const includeCountBool = true;

    const result = await getAllSubscriptionsService(
      search as string,
      column as string,
      page,
      limit,
      sortBy as string | undefined,
      order,
      includeCountBool
    );

    res.status(200).json(result);
  } catch (err: any) {
    console.error("getAllSubscriptions error:", err);
    res.status(500).json({ message: err.message || "Failed to fetch subscriptions" });
  }
};

// ----------------------------
// Get Subscription by ID
// ----------------------------
export const getSubscriptionById = async (req: Request, res: Response) => {
  try {
    const subscription = await getSubscriptionByIdService(Number(req.params.id));
    if (!subscription) return res.status(404).json({ message: "Subscription not found" });

    res.status(200).json(subscription);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------
// Export All Subscriptions
// ----------------------------
export const exportAllSubscriptions = async (req: Request, res: Response) => {
  try {
    const { csvContent } = await exportSubscriptionsCSVService();
    res.setHeader("Content-Disposition", "attachment; filename=subscriptions_export.csv");
    res.setHeader("Content-Type", "text/csv");
    res.status(200).send(csvContent);
  } catch (err: any) {
    console.error("Export failed:", err);
    res.status(500).json({ message: "Failed to export subscriptions" });
  }
};

// ----------------------------
// Create Subscription
// ----------------------------
export const createSubscription = async (req: Request, res: Response) => {
  try {
    const subscription = await createSubscriptionService({
      subsc_name: req.body.subsc_name,
      subsc_type: req.body.subsc_type,
      subsc_price: req.body.subsc_price,
      subsc_currency: req.body.subsc_currency,
      renew_date: req.body.renew_date,
      portal_detail: req.body.portal_detail,
      subsc_status: req.body.subsc_status,
      department_id: req.body.department_id,
    });

    res.status(201).json({ subscription });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------
// Update Subscription
// ----------------------------
export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const subscriptionId = Number(req.params.id);
    if (isNaN(subscriptionId)) return res.status(400).json({ message: "Invalid subscription ID" });

    const updateData = {
      subsc_name: req.body.subsc_name,
      subsc_type: req.body.subsc_type,
      subsc_price: req.body.subsc_price,
      subsc_currency: req.body.subsc_currency,
      renew_date: req.body.renew_date || null,
      portal_detail: req.body.portal_detail || null,
      subsc_status: req.body.subsc_status || "active",
      department_id: req.body.department_id ? Number(req.body.department_id) : null,
    };

    const updatedSubscription = await updateSubscriptionService(subscriptionId, updateData);
    res.status(200).json(updatedSubscription);
  } catch (err: any) {
    console.error("Update subscription error:", err);
    res.status(500).json({ message: err.message || "Something went wrong" });
  }
};

// ----------------------------
// Update Subscription Status
// ----------------------------
export const updateSubscriptionStatus = async (req: Request, res: Response) => {
  try {
    const subscriptionId = Number(req.params.id);
    const { status } = req.body;
    const updatedSubscription = await updateSubscriptionStatusService(subscriptionId, status);
    res.status(200).json(updatedSubscription);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------
// Delete Subscription
// ----------------------------
export const deleteSubscription = async (req: Request, res: Response) => {
  try {
    const subscriptionIdToDelete = Number(req.params.id);
    if (isNaN(subscriptionIdToDelete))
      return res.status(400).json({ message: "Invalid subscription ID" });

    // Pass the ID of the user performing the deletion
    const performedById = req.user?.id;
    if (!performedById)
      return res.status(401).json({ message: "Unauthorized" });

    const deleted = await deleteSubscriptionService(subscriptionIdToDelete, performedById);
    if (!deleted) return res.status(404).json({ message: "Subscription not found" });

    return res.status(200).json({ message: "Subscription deleted successfully" });
  } catch (err: any) {
    console.error("Delete subscription error:", err);
    return res.status(500).json({ message: err.message || "Failed to delete subscription" });
  }
};