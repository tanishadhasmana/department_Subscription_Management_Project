import db from "../../src/connection";
import bcrypt from "bcrypt";

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
