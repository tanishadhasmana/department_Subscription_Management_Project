import { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
import {
  createFirstAdminService,
  getAllUsersService,
  getUserByIdService,
  createUserService,
  updateUserService,
  updateUserStatusService,
  loginUserService,
  getMeService,
  deleteUserService,
  getUsersCountService,
} from "../services/userService";
import { sendMail } from "../utils/mailer";

const router = Router();

// Generate JWT
const generateToken = (user: any) => {
  return jwt.sign(
    { id: user.id, role_id: user.role_id, email: user.email },
    process.env.JWT_SECRET as string,
    { expiresIn: "1d" }
  );
};

// ----------------------------
// Create First Admin
// ----------------------------
export const createFirstAdmin = async (req: Request, res: Response) => {
  try {
    const admin = await createFirstAdminService(req.body);
    res.status(201).json(admin);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------
// Get Users Count
// ----------------------------
export const getUsersCount = async (req: Request, res: Response) => {
  try {
    const total = await getUsersCountService();
    res.status(200).json({ total });
  } catch (err: any) {
    console.error("Failed to get users count:", err);
    res.status(500).json({ message: err.message || "Failed to get users count" });
  }
};

// ----------------------------
// Get All Users
// ----------------------------
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { search, column, sortBy, sortOrder } = req.query;
    const page = req.query.page ? Number(req.query.page) : 1;
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const order = (sortOrder === "asc" || sortOrder === "desc") ? (sortOrder as "asc" | "desc") : undefined;

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
    res.status(500).json({ message: err.message || "Failed to fetch users" });
  }
};

// ----------------------------
// Get User by ID
// ----------------------------
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await getUserByIdService(Number(req.params.id));
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json(user);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------
// Create User
// ----------------------------
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

// ----------------------------
// Update User
// ----------------------------
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = Number(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

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

// ----------------------------
// Update User Status
// ----------------------------
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

// ----------------------------
// Login User
// ----------------------------
export const loginUser = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await loginUserService(email, password);
    const token = generateToken(user);

    // res.cookie("token", token, {
    //   httpOnly: true,
    //   secure: process.env.NODE_ENV === "production",
    //   sameSite: "none",
    //   maxAge: 24 * 60 * 60 * 1000,
    //   path: "/",
    // });
    res.cookie("token", token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production" ? true : false,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
});


    res.status(200).json({ user });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
};

// ----------------------------
// Logout User
// ----------------------------
export const logoutUser = async (req: Request, res: Response) => {
  res.clearCookie("token", { 
    path: "/", 
    sameSite: "none", 
    secure: process.env.NODE_ENV === "production" 
  });
  res.status(200).json({ message: "Logged out" });
};

// ----------------------------
// Get Current User
// ----------------------------
export const getMe = async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Not authenticated" });
    const user = await getMeService(req.user.id);
    res.status(200).json({ user });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
};

// ----------------------------
// Delete User
// ----------------------------
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userIdToDelete = Number(req.params.id);
    if (isNaN(userIdToDelete))
      return res.status(400).json({ message: "Invalid user ID" });

    const performedById = req.user?.id;
    if (!performedById)
      return res.status(401).json({ message: "Unauthorized" });

    const deleted = await deleteUserService(userIdToDelete, performedById);
    if (!deleted) return res.status(404).json({ message: "User not found" });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (err: any) {
    console.error("Delete user error:", err);
    return res.status(500).json({ message: err.message || "Failed to delete user" });
  }
};

export default router;





// import { Request, Response, Router } from "express";
// import jwt from "jsonwebtoken";
// import {
//   createFirstAdminService,
//   getAllUsersService,
//   getUserByIdService,
//   createUserService,
//   updateUserService,  
//   updateUserStatusService,
//   loginUserService,
//   getMeService,
//   deleteUserService,
//   getUsersCountService,
//   exportUsersCSVService
// } from "../services/userService";
// import { sendMail } from "../utils/mailer";

// const router = Router();


// // ----------------------------
// // Generate JWT
// // ----------------------------
// // creates jwt token, whcih expire in 1 day.
// const generateToken = (user: any) => {
//   return jwt.sign(
//     { id: user.id, role_id: user.role_id, email: user.email },
//     process.env.JWT_SECRET as string,
//     { expiresIn: "1d" }
//   );
// };
// // ----------------------------
// // Create First Admin
// // ----------------------------
// // call the service to create admin, then log the action to the table.
// export const createFirstAdmin = async (req: Request, res: Response) => {
//   try {
//     const admin = await createFirstAdminService(req.body);
//     res.status(201).json(admin);
//   } catch (err: any) {
//     res.status(500).json({ message: err.message });
//   }
// };

// export const getUsersCount = async (req: Request, res: Response) => {
//   try {
//     const total = await getUsersCountService();
//     res.status(200).json({ total });
//   } catch (err: any) {
//     console.error("Failed to get users count:", err);
//     res.status(500).json({ message: err.message || "Failed to get users count" });
//   }
// };

// export const getAllUsers = async (req: Request, res: Response) => {
//   try {
//     const { search, column, sortBy, sortOrder, includeCount } = req.query;
//     const page = req.query.page ? Number(req.query.page) : 1;
//     const limit = req.query.limit ? Number(req.query.limit) : 10;
//     const order = (sortOrder === "asc" || sortOrder === "desc") ? (sortOrder as "asc" | "desc") : undefined;
//     const includeCountBool = true;

//     const result = await getAllUsersService(
//       search as string,
//       column as string,
//       page,
//       limit,
//       sortBy as string | undefined,
//       order,
//       includeCountBool
//     );

//     res.status(200).json(result);
//   } catch (err: any) {
//     console.error("getAllUsers error:", err);
//     res.status(500).json({ message: err.message || "Failed to fetch users" });
//   }
// };


// // ----------------------------
// // Get User by ID
// // ----------------------------
// export const getUserById = async (req: Request, res: Response) => {
//   try {
//     const user = await getUserByIdService(Number(req.params.id));
//     if (!user) return res.status(404).json({ message: "User not found" });

//     res.status(200).json(user);
//   } catch (err: any) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ----------------------
// // Exporting all users
// // ----------------------
// export const exportAllUsers = async (req: Request, res: Response) => {
//   try {
//     const { csvContent } = await exportUsersCSVService();
//     res.setHeader("Content-Disposition", "attachment; filename=users_export.csv");
//     res.setHeader("Content-Type", "text/csv");
//     res.status(200).send(csvContent);
//   } catch (err: any) {
//     console.error("Export failed:", err);
//     res.status(500).json({ message: "Failed to export users" });
//   }
// };

// // ----------------------------
// // Create User
// // ----------------------------
// export const createUser = async (req: Request, res: Response) => {
//   try {
//     const { user, tempPassword } = await createUserService({
//       first_name: req.body.first_name,
//       last_name: req.body.last_name,
//       email: req.body.email,
//       phone_no: req.body.phone_no,
//       status: req.body.status,
//       role_id: req.body.role_id,
//     });

//     const loginUrl = process.env.FRONTEND_URL || "http://localhost:5173/login";
//     const subject = "Welcome to Our Platform!";
//     const html = `
//       <p>Hello ${user.first_name},</p>
//       <p>Your account has been successfully created.</p>
//       <p><strong>Email:</strong> ${user.email}<br/>
//       <strong>Temporary Password:</strong> ${tempPassword}</p>
//       <p><a href="${loginUrl}" style="padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Login Now</a></p>
//     `;
//     sendMail(
//       user.email,
//       subject,
//       `Hello ${user.first_name}, use this link to login: ${loginUrl}`,
//       html
//     )
//       .then(() => console.log("Welcome email sent to:", user.email))
//       .catch((err) => console.error("Failed to send email:", err));

//     res.status(201).json({ user, tempPassword });
//   } catch (err: any) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ----------------------------
// // Update User
// // ----------------------------
// export const updateUser = async (req: Request, res: Response) => {
//   try {
//     const userId = Number(req.params.id);
//     if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

//     const updateData = {
//       first_name: req.body.first_name,
//       last_name: req.body.last_name,
//       email: req.body.email,
//       phone_no: req.body.phone_no || null,
//       status: req.body.status || "Active",
//       role_id: req.body.role_id ? Number(req.body.role_id) : null,
//     };

//     const updatedUser = await updateUserService(userId, updateData);
//     res.status(200).json(updatedUser);
//   } catch (err: any) {
//     console.error("Update user error:", err);
//     res.status(500).json({ message: err.message || "Something went wrong" });
//   }
// };

// // ----------------------------
// // Update User Status
// // ----------------------------
// export const updateUserStatus = async (req: Request, res: Response) => {
//   try {
//     const userId = Number(req.params.id);
//     const { status } = req.body;
//     const updatedUser = await updateUserStatusService(userId, status);
//     res.status(200).json(updatedUser);
//   } catch (err: any) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ----------------------------
// // Login User
// // ----------------------------
// export const loginUser = async (req: Request, res: Response) => {
//   try {
//     const { email, password } = req.body;
//     const user = await loginUserService(email, password);
//     const token = generateToken(user);

//     // Set cookie on backend only — HTTP-only, cross-site allowed for dev
//     res.cookie("token", token, {
//       httpOnly: true,                     // important: JS can't read this
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "none",                   // allow cookie sent from frontend (different port)
//       maxAge: 24 * 60 * 60 * 1000,        // 1 day
//       path: "/",
//     });

//     // Return user only (no token in JSON)
//     res.status(200).json({ user });
//   } catch (err: any) {
//     res.status(400).json({ message: err.message });
//   }
// };

// // ----------------------------
// // Logout User
// // ----------------------------
// export const logoutUser = async (req: Request, res: Response) => {
//   // Clear cookie with same attributes (path + sameSite)
//   res.clearCookie("token", { path: "/", sameSite: "none", secure: process.env.NODE_ENV === "production" });
//   res.status(200).json({ message: "Logged out" });
// };


// // ----------------------------
// // Get Current User
// // ----------------------------
// export const getMe = async (req: Request, res: Response) => {
//   try {
//     if (!req.user) return res.status(401).json({ message: "Not authenticated" });
//     const user = await getMeService(req.user.id);
//     res.status(200).json({ user });
//   } catch (err: any) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // ----------------------------
// // Delete User
// // ----------------------------
// export const deleteUser = async (req: Request, res: Response) => {
//   try {
//     const userIdToDelete = Number(req.params.id);
//     if (isNaN(userIdToDelete))
//       return res.status(400).json({ message: "Invalid user ID" });

//     // Pass the ID of the user performing the deletion
//     const performedById = req.user?.id; 
//     if (!performedById)
//       return res.status(401).json({ message: "Unauthorized" });

//     const deleted = await deleteUserService(userIdToDelete, performedById);
//     if (!deleted) return res.status(404).json({ message: "User not found" });

//     return res.status(200).json({ message: "User deleted successfully" });
//   } catch (err: any) {
//     console.error("Delete user error:", err);
//     return res.status(500).json({ message: err.message || "Failed to delete user" });
//   }
// };

// export default router;