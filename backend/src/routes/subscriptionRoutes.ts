import express from "express";
import {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionsCount,
  exportAllSubscriptions,
} from "../controllers/subscriptionController";
// ensure user logged in
import { protect, requirePermission } from "../middleware/authMiddleware";

// express app to create routes
const router = express.Router();

// ----------------------------
// 📊 Subscription Management Routes
// ----------------------------
router.get("/", protect, requirePermission("subscription_list"), getAllSubscriptions);
router.get("/count", protect, requirePermission("subscription_list"), getSubscriptionsCount);
router.get(
  "/export",
  protect,
  requirePermission("subscription_list"),
  exportAllSubscriptions
);
router.get("/:id", protect, requirePermission("subscription_list"), getSubscriptionById);

router.post("/", protect, requirePermission("subscription_add"), createSubscription);

router.put(
  "/:id",
  protect,
  requirePermission("subscription_edit"),
  updateSubscription
);

router.delete("/:id", protect, requirePermission("subscription_delete"), deleteSubscription);

export default router;