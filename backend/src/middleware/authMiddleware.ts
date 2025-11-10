import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../../src/connection";

// Extend Express Request type
declare module "express" {
  interface Request {
    user?: {
      id: number;
      role_name: string;
      email?: string;
      first_name?: string;
      last_name?: string;
      permissions?: string[];
    };
  }
  
}

/**
 * Protect middleware — verifies JWT (from cookie or Authorization header)
 * Attaches user info + permissions to req.user
 */
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.token ||
      (req.headers?.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token)
      return res.status(401).json({ message: "Not authorized, token missing" });

    const secret = process.env.JWT_SECRET;
    if (!secret)
      return res
        .status(500)
        .json({ message: "Server misconfiguration: missing JWT_SECRET" });

    const decoded = jwt.verify(token, secret) as { id: number };
    console.log("✅ Token decoded, user ID:", decoded.id);

    // Fetch user info with role
    const user = await db("users")
      .leftJoin("roles", "users.role_id", "roles.id")
      .select(
        "users.id",
        "users.first_name",
        "users.last_name",
        "users.email",
        "users.status",
        "users.role_id",
        "roles.role_name"
      )
      .where("users.id", decoded.id)
      .whereNull("users.deleted_at")
      .first();

    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.status !== "Active")
      return res
        .status(403)
        .json({ message: "User is inactive, contact admin" });

    // Get permissions
    const permissions = await db("role_permissions")
      .join("permissions", "role_permissions.permission_id", "permissions.id")
      .where("role_permissions.role_id", user.role_id)
      .select("permissions.name as permission_name");

    // Attach user info to request
    req.user = {
      id: user.id,
      role_name: user.role_name,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      permissions: permissions.map((p) => p.permission_name)
    };

    next();
  } catch (err) {
    console.error("protect middleware error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Admin-only route guard
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) return res.status(401).json({ message: "Not authenticated" });
  if (req.user.role_name?.toLowerCase() !== "admin")
    return res.status(403).json({ message: "Access denied: Admins only" });
  next();
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permissionKey: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user)
      return res.status(401).json({ message: "Not authenticated" });

    // Admin bypass
    if (req.user.role_name?.toLowerCase() === "admin") {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permissionKey)) {
      return res
        .status(403)
        .json({ message: "Access denied: insufficient permission" });
    }

    next();
  };
};






// import { Request, Response, NextFunction } from "express";
// import jwt from "jsonwebtoken";
// import db from "../../src/connection";

// // Extend Express Request type
// declare module "express" {
//   interface Request {
//     user?: {
//       id: number;
//       role_name: string; // used internally
//       department_name?: string; // shown in UI
//       email?: string;
//       first_name?: string;
//       last_name?: string;
//       permissions?: string[];
//     };
//   }
// }

// /**
//  * Protect middleware — verifies JWT (from cookie or Authorization header)
//  * Attaches user info + permissions to req.user
//  */
// export const protect = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const token =
//       req.cookies?.token ||
//       (req.headers?.authorization?.startsWith("Bearer ")
//         ? req.headers.authorization.split(" ")[1]
//         : null);

//     if (!token)
//       return res.status(401).json({ message: "Not authorized, token missing" });

//     const secret = process.env.JWT_SECRET;
//     if (!secret)
//       return res
//         .status(500)
//         .json({ message: "Server misconfiguration: missing JWT_SECRET" });

//     const decoded = jwt.verify(token, secret) as { id: number };

//     const user = await db("users")
//   .leftJoin("roles", "users.role_id", "roles.id")
//   .leftJoin("departments", "users.department_id", "departments.id")
//   .select(
//     "users.id",
//     "users.first_name",
//     "users.last_name",
//     "users.email",
//     "users.status",
//     "users.role_id",
//     "roles.role_name as role_name",
//     "departments.deptName as department_name"
//   )
//   .where("users.id", decoded.id)
//   .first();


//     if (!user) return res.status(401).json({ message: "User not found" });
//     if (user.status !== "Active")
//       return res
//         .status(403)
//         .json({ message: "User is inactive, contact admin" });

//     // ✅ Get permissions
//     const permissions = await db("role_permissions")
//       .join("permissions", "role_permissions.permission_id", "permissions.id")
//       .where("role_permissions.role_id", user.role_id)
//       .select("permissions.name as permission_name");

//     // const permissionKeys = permissions.map((p) => p.permission_name);

//     // ✅ Attach user (UI uses department_name)
//     req.user = {
//       id: user.id,
//       role_name: user.role_name, // internal use only
//       department_name: user.department_name, // shown in UI
//       email: user.email,
//       first_name: user.first_name,
//       last_name: user.last_name,
//       permissions: permissions.map((p) => p.permission_name)
//     };

//     next();
//   } catch (err) {
//     console.error("protect middleware error:", err);
//     return res.status(401).json({ message: "Invalid or expired token" });
//   }
// };

// /**
//  * 🛡 Admin-only route guard
//  */
// export const requireAdmin = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   if (!req.user) return res.status(401).json({ message: "Not authenticated" });
//   if (req.user.role_name?.toLowerCase() !== "admin")
//     return res.status(403).json({ message: "Access denied: Admins only" });
//   next();
// };

// /**
//  * Middleware to check if user has required permission
//  */
// export const requirePermission = (permissionKey: string) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     if (!req.user)
//       return res.status(401).json({ message: "Not authenticated" });

//     // Admin bypass
//     if (req.user.role_name?.toLowerCase() === "admin") {
//       return next();
//     }

//     if (!req.user.permissions || !req.user.permissions.includes(permissionKey)) {
//       return res
//         .status(403)
//         .json({ message: "Access denied: insufficient permission" });
//     }

//     next();
//   };
// };

