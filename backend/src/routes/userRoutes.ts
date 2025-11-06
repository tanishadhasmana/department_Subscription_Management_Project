import express from "express";
// handles upload, to handle file upload.
import multer from "multer";
// module to work with files
import path from "path";
// node file system module, used to check and create folders.
import fs from "fs";
// fuctions that handles requests.
import {
  createFirstAdmin,
  getAllUsers,
  loginUser,
  createUser,
  logoutUser,
  getMe,
  updateUserStatus,
  updateUser,
  getUserById,
  deleteUser,
  getUsersCount,
  exportAllUsers
} from "../controllers/userController";
// ensure user logged in
import { protect, requirePermission } from "../middleware/authMiddleware";

// express app to create routes
const router = express.Router();

// Ensure image directory exists
const imageDir = path.join(__dirname, "../../assets/images");
// fs.exists sync, check if folder exists, and make dir create parent folder if needed, recursive true as If any parent folders in the path don’t exist, create them too.
if (!fs.existsSync(imageDir)) fs.mkdirSync(imageDir, { recursive: true });

// Multer config - save file to image dir, and we created a path also, so diff path to every image.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const fileName = `user_${Date.now()}${ext}`;
    cb(null, fileName);
  },
});

// file filter ensures only image files of allowed types can be uploaded. ,If file type isn’t allowed → Multer ,throws an error before the controller is ,called.
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
// 🔐 Auth routes (no permission needed)
// ----------------------------
// used only onec to set up very first admin
router.post("/create-admin", createFirstAdmin);
// creates jwt, and cookies setup
router.post("/login", loginUser);
// clears the cookie, and need to protect as, user must be logged in.
router.post("/logout", protect, logoutUser);
// verify and return current user detail based on JWT
router.get("/me", protect, getMe);

// ----------------------------
// 👥 Admin panel user management
// ----------------------------
router.get("/", protect, requirePermission("user_list"), getAllUsers);
router.get("/count", protect, requirePermission("user_list"), getUsersCount);
router.get(
  "/export",
  protect,
  requirePermission("user_list"),
  exportAllUsers
);
router.get("/:id", protect, requirePermission("user_list"), getUserById);

router.post("/", protect, requirePermission("user_add"), upload.single("image"), createUser);

router.put("/:id", protect, 
  // this is the file upload MW, if with the req, image is sent it can extract that.
  requirePermission("user_edit"), upload.single("image"), updateUser);

router.put("/:id/status", protect, requirePermission("user_edit"), updateUserStatus);

router.delete("/:id", protect, requirePermission("user_delete"), deleteUser);

export default router;