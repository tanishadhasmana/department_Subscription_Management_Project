// backend/src/routes/dashboardRoute.ts
import express from "express";
import { getDashboardMetrics } from "../controllers/dashboardController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.get("/metrics", protect, getDashboardMetrics);

export default router;




// import { Router } from "express";
// import { getDepartmentWiseSubscriptions } from "../controllers/dashboardController";

// const router = Router();

// // GET /dashboard/department-subscriptions
// router.get("/department-subscriptions", getDepartmentWiseSubscriptions);

// export default router;
