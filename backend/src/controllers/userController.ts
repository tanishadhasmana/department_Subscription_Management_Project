import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import {
  createFirstAdminService,
  getAllUsersService,
  createUserService,
  updateUserService,
  updateUserStatusService,
  getUserByIdForEmailService,
  loginUserService,
  getMeService,
  deleteUserService,
  getUsersCountService,
  generateAndStoreOTP,
  verifyOTP,
  resendOTP,
  completeOTPLoginService,
} from "../services/userService";
import { sendMail } from "../utils/mailer";
import { responseMessage } from "../utils/responseMessage";
import { validationMessage } from "../utils/validationMessage";

const router = Router();

/**
 * Generate JWT Token
 */
const generateToken = (user: any) => {
  return jwt.sign(
    { id: user.id, role_id: user.role_id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" }
  );
};

/**
 * Set JWT Cookie
 */
const setTokenCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
};

// ============================
// CREATE FIRST ADMIN
// ============================
export const createFirstAdmin = async (req: Request, res: Response) => {
  try {
    const admin = await createFirstAdminService(req.body);
    res.status(201).json(admin);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ============================
// GET USERS COUNT
// ============================
export const getUsersCount = async (req: Request, res: Response) => {
  try {
    const total = await getUsersCountService();
    res.status(200).json({ total });
  } catch (err: any) {
    console.error("Failed to get users count:", err);
    res.status(500).json({ message: err.message || "Failed to get users count" });
  }
};

// ============================
// GET ALL USERS
// ============================
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { search, column, sortBy, sortOrder } = req.query;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const order =
      sortOrder === "asc" || sortOrder === "desc"
        ? (sortOrder as "asc" | "desc")
        : undefined;

    const result = await getAllUsersService(
      search as string,
      column as string,
      page,
      limit,
      sortBy as string | undefined,
      order,
      true
    );

    res.status(200).json(result);
  } catch (err: any) {
    console.error("getAllUsers error:", err);
    res.status(500).json(responseMessage.error("fetch users"));
  }
};

// ============================
// CREATE USER
// ============================
export const createUser = async (req: Request, res: Response) => {
  try {
    const { user, tempPassword } = await createUserService({
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone_no: req.body.phone_no,
      status: req.body.status,
      role_id: req.body.role_id,
    });

    const loginUrl = process.env.FRONTEND_URL || "http://localhost:5173/login";
    const subject = "Welcome to Our Platform!";
    const html = `
      <p>Hello ${user.first_name},</p>
      <p>Your account has been successfully created.</p>
      <p><strong>Email:</strong> ${user.email}<br/>
      <strong>Temporary Password:</strong> ${tempPassword}</p>
      <p><a href="${loginUrl}" style="padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Login Now</a></p>
    `;

    sendMail(
      user.email,
      subject,
      `Hello ${user.first_name}, use this link to login: ${loginUrl}`,
      html
    )
      .then(() => console.log("Welcome email sent to:", user.email))
      .catch((err) => console.error("Failed to send email:", err));

    res.status(201).json({ user, tempPassword });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ============================
// UPDATE USER
// ============================
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json(validationMessage.invalid("user ID"));

    const updateData = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      email: req.body.email,
      phone_no: req.body.phone_no || null,
      status: req.body.status || "Active",
      role_id: req.body.role_id ? Number(req.body.role_id) : null,
    };

    const updatedUser = await updateUserService(userId, updateData);
    res.status(200).json(updatedUser);
  } catch (err: any) {
    console.error("Update user error:", err);
    res.status(500).json({ message: err.message || "Something went wrong" });
  }
};

// ============================
// UPDATE USER STATUS
// ============================
export const updateUserStatus = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    const { status } = req.body;
    const updatedUser = await updateUserStatusService(userId, status);
    res.status(200).json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ============================
// LOGIN USER (STEP 1: Send OTP)
// ============================
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    console.log(`[LOGIN] Attempting login for email: ${email}`);
    // Validate credentials (from service)
    const user = await loginUserService(email, password);
     console.log(`[LOGIN] User validated successfully: ${user.email} (ID: ${user.id})`);
    // Generate OTP (from service)
    const otp = await generateAndStoreOTP(user.id);
    console.log(`[LOGIN] OTP generated successfully: ${otp}`);
    // Send OTP email
    const subject = "Your Login Verification Code";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0;">🔐 Two-Factor Authentication</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${user.first_name}</strong>,</p>
          <p style="font-size: 14px; color: #666;">We received a login attempt to your account. Please use the verification code below to complete your login:</p>
          
          <div style="background: #fff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <p style="font-size: 12px; color: #999; margin: 0 0 10px 0;">YOUR VERIFICATION CODE</p>
            <h2 style="font-size: 36px; color: #667eea; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${otp}</h2>
          </div>

          <p style="font-size: 14px; color: #666;">This code will expire in <strong>2 minutes</strong>.</p>
          <p style="font-size: 13px; color: #999; margin-top: 25px;">If you didn't attempt to log in, please ignore this email or contact support immediately.</p>
        </div>
      </div>
    `;

    await sendMail(user.email, subject, `Your OTP is: ${otp}`, html);
        console.log(`[LOGIN] Email sent successfully`);
    // Return user info (without token yet) - controller only formats response
    res.status(200).json({
      success: true,
      message: "OTP sent to your email",
      userId: user.id,
      email: user.email,
      requiresOTP: true,
    });
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(400).json({ message: err.message || "Login failed" });
  }
};

// ============================
// VERIFY OTP (STEP 2: Complete Login)
// ============================
export const verifyOTPController = async (req: Request, res: Response) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: "User ID and OTP are required" });
    }

    // Verify OTP (from service - DB logic)
    const result = await verifyOTP(userId, otp);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // OTP verified - get user with permissions (from service - DB logic)
    const { user } = await completeOTPLoginService(userId);

    // Generate token (controller handles token generation for HTTP)
    const token = generateToken(user);

    // Set cookie (controller handles HTTP response)
    setTokenCookie(res, token);

    res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (err: any) {
    console.error("OTP verification error:", err);
    res.status(500).json({ message: err.message || "Verification failed" });
  }
};

// ============================
// RESEND OTP
// ============================
export const resendOTPController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Resend OTP (from service - handles rate limiting, DB logic)
    const result = await resendOTP(userId);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Get user by ID (NOT by email/password) - create new service function
    const user = await getUserByIdForEmailService(userId);

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    // Send email (controller handles email dispatch)
    const subject = "Your New Verification Code";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #fff; margin: 0;">🔐 New Verification Code</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #333;">Hello <strong>${user.first_name}</strong>,</p>
          <p style="font-size: 14px; color: #666;">You requested a new verification code. Here it is:</p>
          
          <div style="background: #fff; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 25px 0;">
            <p style="font-size: 12px; color: #999; margin: 0 0 10px 0;">YOUR NEW VERIFICATION CODE</p>
            <h2 style="font-size: 36px; color: #667eea; letter-spacing: 8px; margin: 0; font-family: 'Courier New', monospace;">${result.otp}</h2>
          </div>

          <p style="font-size: 14px; color: #666;">This code will expire in <strong>2 minutes</strong>.</p>
        </div>
      </div>
    `;

    await sendMail(user.email, subject, `Your new OTP is: ${result.otp}`, html);

    res.status(200).json({
      success: true,
      message: "New OTP sent successfully",
    });
  } catch (err: any) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: err.message || "Failed to resend OTP" });
  }
};
// ============================
// LOGOUT USER
// ============================
export const logoutUser = async (req: Request, res: Response) => {
  res.clearCookie("token", {
    path: "/",
    sameSite: "none",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logged out" });
};

// ============================
// GET CURRENT USER
// ============================
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const user = await getMeService(req.user.id);
    res.status(200).json({ user });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ============================
// DELETE USER
// ============================
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userIdToDelete = Number(req.params.id);
    if (isNaN(userIdToDelete))
      return res.status(400).json(validationMessage.invalid("user ID"));

    const performedById = req.user?.id;
    if (!performedById)
      return res.status(401).json(responseMessage.unauthorized);

    const deleted = await deleteUserService(userIdToDelete, performedById);
    if (!deleted) return res.status(404).json(responseMessage.notFound("User"));

    return res.status(200).json(responseMessage.deleted("User"));
  } catch (err: any) {
    console.error("Delete user error:", err);
    return res.status(500).json({ message: err.message || "Failed to delete user" });
  }
};

export default router;
