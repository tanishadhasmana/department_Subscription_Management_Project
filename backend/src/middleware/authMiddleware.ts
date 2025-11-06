import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import db from "../../src/connection";

// Extend Express Request type
declare module "express" {
  interface Request {
    user?: {
      id: number;
      role_name: string; // used internally
      department_name?: string; // shown in UI
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

    // ✅ Fetch user info properly
    const user = await db("users")
      .leftJoin("roles", "users.role_id", "roles.id")
      .leftJoin("departments", "users.department_id", "departments.id")
      .select(
        "users.id",
        "users.first_name",
        "users.last_name",
        "users.email",
        "users.status",
        "users.role_id",
        "roles.role_name as role_name",
        "departments.deptName as department_name"
      )
      .where("users.id", decoded.id)
      .first();

    if (!user) return res.status(401).json({ message: "User not found" });
    if (user.status !== "Active")
      return res
        .status(403)
        .json({ message: "User is inactive, contact admin" });

    // ✅ Get permissions
    const permissions = await db("role_permissions")
      .join("permissions", "role_permissions.permission_id", "permissions.id")
      .where("role_permissions.role_id", user.role_id)
      .select("permissions.name as permission_name");

    const permissionKeys = permissions.map((p) => p.permission_name);

    // ✅ Attach user (UI uses department_name)
    req.user = {
      id: user.id,
      role_name: user.role_name, // internal use only
      department_name: user.department_name, // shown in UI
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      permissions: permissionKeys,
    };

    next();
  } catch (err) {
    console.error("protect middleware error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * 🛡 Admin-only route guard
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
// // jsonwebtoken library commonly used to create and verify, jswts, it gives fucns as sign, verify etc
// import jwt from "jsonwebtoken";
// // this is the knex connection
// import db from "../../src/connection";
// // we changing the type declared in the express module, without modifying actual library code.
// declare module "express" {
//   interface Request {
//     // we first chcking if user authenticated or not
//     user?: {
//       id: number;
//       role: string;
//       email?: string;
//       firstName?: string;
//       lastName?: string;
//       permissions?: string[];
//     };
//   }
// }

// /**
//  * Protect middleware — verifies JWT (from cookie or Authorization header)
//  * Attaches user info + permissions to req.user
//  */
// export const protect = async (
//   // defined the types of those also, imported from the express
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // we created a var tokem
//     const token =
//     // like if token is not in req.cookie set to null or undefined, then OR then check for authorization header which always start with bearer, Bearer <token>, and it is of form abc.def.ghi, and indexes are 0,1,2 and the 1 index the value in middle is the actual token.
//       req.cookies?.token ||
//       (req.headers?.authorization?.startsWith("Bearer ")
//         ? req.headers.authorization.split(" ")[1]
//         : null);
// // if token missing, then 401 not authorized
//     if (!token)
//       return res.status(401).json({ message: "Not authorized, token missing" });

// // a jwt strg has 3 parts as header payload, signature, the payload contains data as { id: 1, email: 'john@email.com' }

// // this is seceret key, used to sign/verify jwt.
//     const secret = process.env.JWT_SECRET;
//     if (!secret)
//       return res
//         .status(500)
//         .json({ message: "Server misconfiguration: missing JWT_SECRET" });
// // verify the token, by the seceret keys
//     const decoded = jwt.verify(token, secret) as { id: number };

//     // Fetch user info with roleId--- for that we perform left join users table with the roles, based on users.roleId = roles.id
//     const user = await db("users")
//       .leftJoin("roles", "users.roleId", "roles.id")
//       .select(
//         "users.id",
//         "users.firstName",
//         "users.lastName",
//         "users.email",
//         "users.status",
//         "users.roleId",
//         "roles.role as role"
//       )
//       // we filter the above sended payload id, which having the token here so can find user with that id.
//       .where("users.id", decoded.id) 
//       .first();
// // If no user record, token contains an id that doesn't exist — respond 401
//     if (!user) return res.status(401).json({ message: "User not found" });
//     // and if usr dont active any other than user is inactive.
//     if (user.status !== "active")
//       return res
//         .status(403)
//         .json({ message: "User is inactive, contact admin" });

//     // Fetch permissions for this user's role
//     const permissions =
//       (await db("role_permissions")
//         .join("permissions", "role_permissions.permissionId", "permissions.id")
//         .where("role_permissions.roleId", user.roleId) // use roleId from fetched user
//         // pluck is knex helper, return arr of values like persmissions name, instead of returning a arr of obj, OR if empty no permission then it return a empty arr, means a empty permission arr always pass
//         .pluck("permissions.name")) || [];

//     // Attach user + permissions to req.user
//     // allow values easily available to routes
//     req.user = {
//       id: user.id,
//       role: user.role,
//       email: user.email,
//       firstName: user.firstName,
//       lastName: user.lastName,
//       permissions,
//     };
// // passes control to next MW
//     next();
//   } catch (err) {
//     console.error(" protect middleware error:", err);
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
//   if (req.user.role !== "admin")
//     return res.status(403).json({ message: "Access denied: Admins only" });
//   next();
// };

// /**
//  * Middleware to check if user has required permission
//  */
// export const requirePermission = (permissionKey: string) => {
//   return (req: Request, res: Response, next: NextFunction) => {
//     // ensure user must authenticated
//     if (!req.user)
//       return res.status(401).json({ message: "Not authenticated" });

//     //  Allow admin full access bypass, if it is Admin, ADMIN etc
//     if (req.user.role?.toLowerCase() === "admin") {
//       return next();
//     }

//     if (
//       // if no permission and no permision key 403
//       !req.user.permissions ||
//       !req.user.permissions.includes(permissionKey)
//     ) {
//       return res
//         .status(403)
//         .json({ message: "Access denied: insufficient permission" });
//     }

//     next();
//   };
// };