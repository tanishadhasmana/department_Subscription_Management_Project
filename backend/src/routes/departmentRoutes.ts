import { Router } from "express";
import { getAllDepartments } from "../controllers/departmentController";
import { protect } from "../middleware/authMiddleware";

const router = Router();

// GET /api/departments
router.get("/", protect, getAllDepartments);

export default router;
