import db from "../../src/connection";
import bcrypt from "bcrypt";
import { generateOTP, encryptOTP, decryptOTP, isOTPExpired } from "../utils/otpHelper";

// ----------------------------
// Create First Admin
// ----------------------------
export const createFirstAdminService = async (data: any) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const [id] = await db("users").insert({
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    password: hashedPassword,
    phone_no: data.phone_no || null,
    status: data.status || "Active",
    role_id: data.role_id,
  });

  // Fetch user with role & permissions
  const user = await db("users")
    .leftJoin("roles", "users.role_id", "roles.id")
    .select(
      "users.id",
      "users.first_name",
      "users.last_name",
      "users.email",
      "users.phone_no",
      "users.status",
      "users.role_id",
      "roles.role_name"
    )
    .where("users.id", id)
    .first();

  let permissions: any[] = [];
  if (user?.role_id) {
    permissions = await db("role_permissions")
      .leftJoin("permissions", "role_permissions.permission_id", "permissions.id")
      .where("role_permissions.role_id", user.role_id)
      .select("permissions.id", "permissions.name");
  }

  return { ...user, permissions };
};

// ----------------------------
// Fast user count service
// ----------------------------
export const getUsersCountService = async (): Promise<number> => {
  const result = await db("users")
    .whereNull("deleted_at")
    .count<{ total: number }>("id as total");
  return Number(result?.[0]?.total ?? 0);
};

// ----------------------------
// Get All Users with Search, Sort, Pagination
// ----------------------------
export const getAllUsersService = async (
  search?: string,
  column?: string,
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc",
  includeCount: boolean = true
) => {
  const offset = (page - 1) * limit;

  const ALLOWED_SORTS: Record<string, string> = {
    id: "users.id",
    first_name: "users.first_name",
    last_name: "users.last_name",
    email: "users.email",
    phone_no: "users.phone_no",
    role_name: "roles.role_name",
    created_at: "users.created_at",
  };

  const sortColumn = sortBy && ALLOWED_SORTS[sortBy] ? ALLOWED_SORTS[sortBy] : "users.created_at";
  const order = sortOrder === "asc" ? "asc" : "desc";

  // Main rows query
  const rowsQuery = db("users")
    .leftJoin("roles", "users.role_id", "roles.id")
    .select(
      "users.id",
      "users.first_name",
      "users.last_name",
      "users.email",
      "users.phone_no",
      "users.status",
      "users.role_id",
      "roles.role_name",
      "users.created_at",
      "users.updated_at"
    )
    .whereNull("users.deleted_at")
    .modify((qb) => {
      if (search && column) {
        const searchCol = column === "role_name" ? "roles.role_name" : `users.${column}`;
        if (column === "status") {
          qb.where(searchCol, search.toLowerCase());
        } else {
          qb.where(searchCol, "like", `%${search}%`);
        }
      }
    })
    .orderBy(sortColumn, order)
    .limit(limit)
    .offset(offset);

  if (includeCount) {
    const countQuery = db("users")
      .leftJoin("roles", "users.role_id", "roles.id")
      .whereNull("users.deleted_at")
      .modify((qb) => {
        if (search && column) {
          const searchCol = column === "role_name" ? "roles.role_name" : `users.${column}`;
          if (column === "status") {
            qb.where(searchCol, search.toLowerCase());
          } else {
            qb.where(searchCol, "like", `%${search}%`);
          }
        }
      })
      .count<{ total: number }>("users.id as total");

    const [usersResult, cnt] = await Promise.all([rowsQuery, countQuery]);
    const users = usersResult || [];
    const total = Number(cnt?.[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { users, total, totalPages, currentPage: page, includeCount };
  } else {
    const users = await rowsQuery;
    return { users, total: -1, totalPages: -1, currentPage: page, includeCount };
  }
};

// ----------------------------
// Get User By ID
// ----------------------------
export const getUserByIdService = async (id: number) => {
  return db("users")
    .leftJoin("roles", "users.role_id", "roles.id")
    .select(
      "users.id",
      "users.first_name",
      "users.last_name",
      "users.email",
      "users.phone_no",
      "users.status",
      "users.role_id",
      "roles.role_name",
      "users.created_at",
      "users.updated_at"
    )
    .where("users.id", id)
    .whereNull("users.deleted_at")
    .first();
};

// ----------------------------
// Create User
// ----------------------------
export const createUserService = async (data: any) => {
  const existing = await db("users")
    .where({ email: data.email })
    .whereNull("deleted_at")
    .first();
  
  if (existing) throw new Error(`User with email ${data.email} already exists`);

  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  const insertData: any = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone_no: data.phone_no || null,
    status: data.status || "Active",
    role_id: data.role_id ? Number(data.role_id) : null,
    password: hashedPassword,
  };

  const [id] = await db("users").insert(insertData);
  
  const user = await db("users")
    .leftJoin("roles", "users.role_id", "roles.id")
    .select(
      "users.id",
      "users.first_name",
      "users.last_name",
      "users.email",
      "users.phone_no",
      "users.status",
      "users.role_id",
      "roles.role_name"
    )
    .where("users.id", id)
    .first();

  // Fetch permissions
  let permissions: any[] = [];
  if (user.role_id) {
    permissions = await db("role_permissions")
      .leftJoin("permissions", "role_permissions.permission_id", "permissions.id")
      .where("role_permissions.role_id", user.role_id)
      .select("permissions.id", "permissions.name");
  }

  return { user: { ...user, permissions }, tempPassword };
};

// ----------------------------
// Update User
// ----------------------------
export const updateUserService = async (id: number, data: any) => {
  const updateData: any = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone_no: data.phone_no || null,
    status: data.status || "Active",
    role_id: data.role_id ? Number(data.role_id) : null,
    updated_at: db.fn.now(),
  };

  await db("users")
    .where({ id })
    .whereNull("deleted_at")
    .update(updateData);

  const user = await db("users")
    .leftJoin("roles", "users.role_id", "roles.id")
    .select(
      "users.id",
      "users.first_name",
      "users.last_name",
      "users.email",
      "users.phone_no",
      "users.status",
      "users.role_id",
      "roles.role_name"
    )
    .where("users.id", id)
    .first();

  // Fetch permissions
  let permissions: string[] = [];
  if (user?.role_id) {
    const perms = await db("role_permissions")
      .join("permissions", "role_permissions.permission_id", "permissions.id")
      .where("role_permissions.role_id", user.role_id)
      .select("permissions.name");

    permissions = perms.map((p: any) => p.name);
  }

  return { ...user, permissions };
};

// ----------------------------
// Update User Status
// ----------------------------
export const updateUserStatusService = async (id: number, status: string) => {
  await db("users")
    .where({ id })
    .whereNull("deleted_at")
    .update({ status, updated_at: db.fn.now() });
  
  return db("users")
    .leftJoin("roles", "users.role_id", "roles.id")
    .select(
      "users.id",
      "users.first_name",
      "users.last_name",
      "users.email",
      "users.phone_no",
      "users.status",
      "users.role_id",
      "roles.role_name"
    )
    .where("users.id", id)
    .first();
};

// ----------------------------
// Login User
// ----------------------------
export const loginUserService = async (email: string, password: string) => {
  const user = await db("users")
    .where({ email })
    .whereNull("deleted_at")
    .first();
  
  if (!user) throw new Error("Invalid email or password");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");

  let role: any = null;
  let permissions: any[] = [];

  if (user.role_id) {
    role = await db("roles").where({ id: user.role_id }).first();

    permissions = await db("role_permissions")
      .leftJoin("permissions", "role_permissions.permission_id", "permissions.id")
      .where("role_permissions.role_id", user.role_id)
      .select("permissions.id", "permissions.name");
  }

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone_no: user.phone_no,
    role_name: role ? role.role_name : null,
    role_id: user.role_id,
    status: user.status,
    permissions,
  };
};

export const completeOTPLoginService = async (userId: number): Promise<{
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone_no: string | null;
    role_id: number | null;
    role_name: string | null;
    status: string;
    permissions: Array<{ id: number; name: string }>;
  };
}> => {
  // Fetch user with role
  const user = await db("users")
    .leftJoin("roles", "users.role_id", "roles.id")
    .select(
      "users.id",
      "users.first_name",
      "users.last_name",
      "users.email",
      "users.phone_no",
      "users.role_id",
      "roles.role_name",
      "users.status"
    )
    .where("users.id", userId)
    .whereNull("users.deleted_at")
    .first();

  if (!user) {
    throw new Error("User not found");
  }

  // Get permissions
  let permissions: any[] = [];
  if (user.role_id) {
    permissions = await db("role_permissions")
      .leftJoin("permissions", "role_permissions.permission_id", "permissions.id")
      .where("role_permissions.role_id", user.role_id)
      .select("permissions.id", "permissions.name");
  }

  return {
    user: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_no: user.phone_no,
      role_id: user.role_id,
      role_name: user.role_name,
      status: user.status,
      permissions,
    },
  };
};


export const getUserByIdForEmailService = async (userId: number) => {
  return db("users")
    .select(
      "users.id",
      "users.first_name",
      "users.last_name",
      "users.email"
    )
    .where("users.id", userId)
    .whereNull("users.deleted_at")
    .first();
};


// ----------------------------
// Get Current User (Me)
// ----------------------------
export const getMeService = async (id: number) => {
  const user = await db("users")
    .where({ id })
    .whereNull("deleted_at")
    .first();
  
  if (!user) throw new Error("User not found");

  let role: any = null;
  let permissions: any[] = [];

  if (user.role_id) {
    role = await db("roles").where({ id: user.role_id }).first();

    permissions = await db("role_permissions")
      .leftJoin("permissions", "role_permissions.permission_id", "permissions.id")
      .where("role_permissions.role_id", user.role_id)
      .select("permissions.id", "permissions.name");
  }

  return {
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    phone_no: user.phone_no,
    role_name: role ? role.role_name : null,
    role_id: user.role_id,
    status: user.status,
    permissions,
  };
};

// ----------------------------
// Delete User (Soft Delete)
// ----------------------------
export const deleteUserService = async (id: number, performedById: number) => {
  const result = await db("users")
    .where({ id })
    .whereNull("deleted_at")
    .update({
      deleted_at: db.fn.now(),
      deleted_by: performedById,
      status: "Inactive",
      updated_at: db.fn.now(),
    });

  return result > 0;
};





export const generateAndStoreOTP = async (userId: number): Promise<string> => {
  console.log(`[OTP] === Starting generateAndStoreOTP for userId=${userId} ===`);
  
  const otp = generateOTP();
  console.log(`[OTP] Generated plain OTP: ${otp}`);
  
  const encryptedOTP = encryptOTP(otp);
  console.log(`[OTP] Encrypted OTP: ${encryptedOTP}`);
  
 const expiresAt = new Date(Date.now() + 2 * 60 * 1000)
  .toISOString()
  .slice(0, 19)    // "YYYY-MM-DD HH:MM:SS"
  .replace("T", " ");
console.log(`[OTP] Expires at: ${expiresAt}`);

  try {
    // First, verify user exists
    const userExists = await db("users")
      .where({ id: userId })
      .whereNull("deleted_at")
      .first();

    if (!userExists) {
      throw new Error(`User with ID ${userId} not found`);
    }
    console.log(`[OTP] User found: ${userExists.email}`);

    // Perform the update
    console.log(`[OTP] Attempting database update...`);
    const updatedRows = await db("users")
      .where({ id: userId })
      .update({
        otp_code: encryptedOTP,
       otp_expires_at: expiresAt,
        otp_attempts: 0,
        otp_created_at: db.raw("NOW()"),
      });

    console.log(`[OTP] Update returned: ${updatedRows} row(s) affected`);

    // Verify the update
    const verifyUpdate = await db("users")
      .where({ id: userId })
      .select("otp_code", "otp_expires_at", "otp_attempts", "otp_created_at")
      .first();

    console.log(`[OTP] Verification query result:`, JSON.stringify(verifyUpdate, null, 2));

    if (!verifyUpdate || !verifyUpdate.otp_code) {
      console.error(`[OTP] ❌ CRITICAL: Database update failed or OTP not saved!`);
      throw new Error(`Failed to store OTP in database for user ${userId}`);
    }

    console.log(`[OTP] ✅ OTP successfully stored in database`);
    return otp;

  } catch (err: any) {
    console.error(`[OTP] ❌ Error in generateAndStoreOTP:`, err);
    console.error(`[OTP] Error stack:`, err.stack);
    throw new Error(`Failed to generate OTP: ${err.message}`);
  }
};


/**
 * Verify OTP entered by user
 */

export const verifyOTP = async (
  userId: number,
  enteredOTP: string
): Promise<{ success: boolean; message: string }> => {
  try {
    console.log(`[OTP DEBUG] Verifying OTP for userId=${userId}, entered=${enteredOTP}`);

    const user = await db("users")
      .where({ id: userId })
      .whereNull("deleted_at")
      .select("id", "otp_code", "otp_expires_at", "otp_attempts", "email", "first_name")
      .first();

    console.log(`[OTP DEBUG] User found:`, user ? "Yes" : "No");
    console.log(`[OTP DEBUG] User otp_code:`, user?.otp_code);
    console.log(`[OTP DEBUG] User otp_expires_at:`, user?.otp_expires_at);
    console.log(`[OTP DEBUG] User otp_attempts:`, user?.otp_attempts);

    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (!user.otp_code || !user.otp_expires_at) {
      console.log("[OTP DEBUG] No OTP found in database");
      return { success: false, message: "No OTP found. Please request a new one." };
    }

    if (isOTPExpired(user.otp_expires_at)) {
      console.log("[OTP DEBUG] OTP expired");
      await clearOTP(userId);
      return { success: false, message: "OTP has expired. Please request a new one." };
    }

    if (user.otp_attempts >= 3) {
      console.log("[OTP DEBUG] Too many attempts");
      await clearOTP(userId);
      return { success: false, message: "Too many failed attempts. Please request a new OTP." };
    }

    const decryptedOTP = decryptOTP(user.otp_code);
    console.log(`[OTP DEBUG] Decrypted OTP: ${decryptedOTP}`);

    if (decryptedOTP === enteredOTP) {
      console.log("[OTP DEBUG] OTP verified successfully");
      await clearOTP(userId);
      return { success: true, message: "OTP verified successfully" };
    }

    // Increment failed attempts
    console.log("[OTP DEBUG] OTP mismatch, incrementing attempts");
    await db("users").where({ id: userId }).increment("otp_attempts", 1);
    
    const remainingAttempts = 3 - (user.otp_attempts + 1);
    return {
      success: false,
      message: `Invalid OTP. ${remainingAttempts} attempt(s) remaining.`,
    };
  } catch (err) {
    console.error("[OTP ERROR] verifyOTP failed:", err);
    return { success: false, message: "Verification failed" };
  }
};


/**
 * Clear OTP data from user record
 */
export const clearOTP = async (userId: number): Promise<void> => {
  await db("users")
    .where({ id: userId })
    .update({
      otp_code: null,
      otp_expires_at: null,
      otp_attempts: 0,
      otp_created_at: null,
    });
};

/**
 * Resend OTP (with rate limiting check)
 */

export const resendOTP = async (userId: number) => {
  const user = await db("users").where({ id: userId }).first();
  if (!user) return { success: false, message: "User not found" };

  if (user.otp_created_at) {
    const lastCreated = new Date(user.otp_created_at).getTime();
    const now = Date.now();
    if ((now - lastCreated) / 1000 < 30) {
      const waitTime = Math.ceil(30 - ((now - lastCreated) / 1000));
      return { success: false, message: `Please wait ${waitTime} seconds before requesting a new OTP.` };
    }
  }

  const otp = await generateAndStoreOTP(userId);
  console.log(`[OTP] resendOTP: userId=${userId} otp=${otp}`);
  return { success: true, otp, message: "New OTP sent successfully" };
};
