import { Router } from "express";
import { getAllSubscriptions } from "../controllers/subscriptionController";

const router = Router();

// GET /subscriptions
router.get("/", getAllSubscriptions);

export default router;
