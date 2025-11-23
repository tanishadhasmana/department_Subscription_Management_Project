import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import {
  createFirstAdmin,
  getAllUsers,
  loginUser,
  createUser,
  logoutUser,
  getMe,
  updateUserStatus,
  updateUser,
  deleteUser,
  getUsersCount,
   verifyOTPController,
  resendOTPController
} from "../controllers/userController";
import { protect, requirePermission } from "../middleware/authMiddleware";

const router = express.Router();

// Ensure image directory exists
const imageDir = path.join(__dirname, "../../assets/images");
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `user_${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG, or WEBP image files are allowed"));
    }
    cb(null, true);
  },
});

// ----------------------------
// Auth routes (no permission needed)
// ----------------------------
router.post("/create-admin", createFirstAdmin);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/me", protect, getMe);

// ----------------------------
// User management routes
// ----------------------------
router.get("/", protect, requirePermission("user_list"), getAllUsers);
router.get("/count", protect, requirePermission("user_list"), getUsersCount);

router.post(
  "/",
  protect,
  requirePermission("user_add"),
  upload.single("image"),
  createUser
);

router.put(
  "/:id",
  protect,
  requirePermission("user_edit"),
  upload.single("image"),
  updateUser
);

router.put(
  "/:id/status",
  protect,
  requirePermission("user_edit"),
  updateUserStatus
);

router.delete("/:id", protect, requirePermission("user_delete"), deleteUser);

// ----------------------------
// OTP verification routes
// ----------------------------
router.post("/verify-otp", verifyOTPController);
router.post("/resend-otp", resendOTPController);


export default router;