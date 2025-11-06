import { Router } from "express";
import { getDepartmentWiseSubscriptions } from "../controllers/dashboardController";

const router = Router();

// GET /dashboard/department-subscriptions
router.get("/department-subscriptions", getDepartmentWiseSubscriptions);

export default router;
