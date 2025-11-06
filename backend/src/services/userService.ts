import db from "../../src/connection";
// bcrypt is a pashword hashing library, used to hash pass before saving to db.
import bcrypt from "bcrypt";
// node js core module, to handle file and directory path.
import path from "path";
// node js core module for file system to read write files.
import fs from "fs";

// ----------------------------
// Create First Admin
// ----------------------------
export const createFirstAdminService = async (data: any) => {
  const hashedPassword = await bcrypt.hash(data.password, 10);

  const [id] = await db("users").insert({
    ...data,
    password: hashedPassword,
    department_name: data.department_name,
    role_id: data.role_id,
    status: data.status,
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
      "roles.role as department_name",
      "users.status",
      "users.role_id"
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
  // like as user table has 123 record then total 123.
  const result = await db("users").count<{ total: number }>("id as total");
  // const total = result?.[0]?.total ?? 0;
  // return Number(total);
  return Number(result?.[0]?.total ?? 0);
};

export const getAllUsersService = async (
  search?: string,
  column?: string,
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc",
  includeCount: boolean = true
) => {
  // if page 1, offset-0, page 2 offset 10,page 3 offset 20, offset used to skip record.
  const offset = (page - 1) * limit;
// only these cols are allowed for soting.
  const ALLOWED_SORTS: Record<string, string> = {
     id: "users.id",
    first_name: "users.first_name",
    last_name: "users.last_name",
    email: "users.email",
    phone_no: "users.phone_no",
    department_name: "roles.role",
    created_at: "users.created_at",
  };
// if frontend sends value of sort by use it, else by createdAt, and in desc order by default.
  const sortColumn = sortBy && ALLOWED_SORTS[sortBy] ? ALLOWED_SORTS[sortBy] : "users.created_at";
  const order = sortOrder === "asc" ? "asc" : "desc";
const rowsQuery = db("users")
  .select(
    "id",
    "first_name",
    "last_name",
    "email",
    "phone_no",
    "department_name",
    "status",
    "created_at",
    "updated_at"
  )
  .modify((qb) => {
    if (search && column) {
      qb.where(column, "like", `%${search}%`);
    }
  })
  .orderBy(sortColumn, order)
  .limit(limit)
  .offset(offset);
 

  let countResult: any = null;
  if (includeCount) {
    const countQuery = db("users")
      .modify((qb) => {
        if (search && column) {
          const searchCol = column === "department_name" ? "roles.role" : `users.${column}`;
          if (column === "status") qb.where(searchCol, search.toLowerCase());
          else qb.where(searchCol, "like", `%${search}%`);
        }
      })
      .count<{ total: number }>("id as total");
   

    // run both queries in parallel, for speed here rawquery gets actual user data, and cntquery get total no of users that matchs, promise all wait for all to complete.
      const [usersResult, cnt] = await Promise.all([rowsQuery, countQuery]);
    countResult = cnt;
    const users = usersResult || [];
    const total = Number(countResult?.[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { users, total, totalPages, currentPage: page, includeCount };
  } else {
    const users = await rowsQuery;
    return { users, total: -1, totalPages: -1, currentPage: page, includeCount };
  }
};

export const exportUsersCSVService = async () => {
const users = await db("users").select(
  "id",
  "first_name",
  "last_name",
  "email",
  "phone_no",
  "department_name",
  "status"
);


  const headers = ["ID", "First Name", "Last Name", "Email", "Phone No", "Department", "Status"];
  const rows = users.map((u) => [
    u.id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone_no || "-",
    u.department_name || "",
    u.status,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((v) => `"${v}"`).join(","))
    .join("\n");

  return { csvContent };
};

// ----------------------------
// Get User By ID
// ----------------------------

export const getUserByIdService = async (id: number) => {
  return db("users")
    .select(
      "id",
      "first_name",
      "last_name",
      "email",
      "phone_no",
      "department_name",
      "status",
      "role_id",
      "created_at",
      "updated_at"
    )
    .where("id", id)
    .first();
};

// ----------------------------
// Create User
// ----------------------------
export const createUserService = async (data: any) => {
  const existing = await db("users").where({ email: data.email }).first();
  if (existing) throw new Error(`User with email ${data.email} already exists`);

  const tempPassword = Math.random().toString(36).slice(-8);
  const hashedPassword = await bcrypt.hash(tempPassword, 10);

  let roleName: string | null = null;
  if (data.role_id) {
    const roleRow = await db("roles").where({ id: Number(data.role_id) }).first();
    if (roleRow) roleName = roleRow.role;
  }

  const insertData: any = {
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    phone_no: data.phone_no || null,
    status: data.status || "Active",
    department_name: roleName,
    role_id: data.role_id ? Number(data.role_id) : null,
    password: hashedPassword,
  };

  const [id] = await db("users").insert(insertData);
  const user = await db("users").where({ id }).first();

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
  let roleName: string | null = null;
  let permissions: string[] = [];

  // If role_id is provided, get role name and permissions
  if (data.role_id) {
    const roleRow = await db("roles").where({ id: Number(data.role_id) }).first();
    if (roleRow) {
      roleName = roleRow.role;

      // Fetch permissions for this role
      const perms = await db("role_permissions")
        .join("permissions", "role_permissions.permission_id", "permissions.id")
        .where("role_permissions.role_id", roleRow.id)
        .select("permissions.name");

      permissions = perms.map((p: any) => p.name);
    }
  }

  const updateData: any = {
    ...data,
    department_name: roleName,
    updated_at: db.fn.now(),
  };

  await db("users").where({ id }).update(updateData);

  const user = await db("users").where({ id }).first();
  return { ...user, permissions };
};




// ----------------------------
// Update User Status
// ----------------------------
export const updateUserStatusService = async (id: number, status: string) => {
  await db("users").where({ id }).update({ status, updated_at: db.fn.now() });
  return db("users").where({ id }).first();
};

// ----------------------------
// Login User
// ----------------------------
export const loginUserService = async (email: string, password: string) => {
  const user = await db("users").where({ email }).first();
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
    department_name: role ? role.role : user.department_name,
    role_id: user.role_id,
    status: user.status,
    permissions,
  };
};


export const getMeService = async (id: number) => {
  const user = await db("users").where({ id }).first();
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
    department_name: role ? role.role : user.department_name,
    role_id: user.role_id,
    status: user.status,
    permissions,
  };
};




export const deleteUserService = async (id: number) => {
  const deleted = await db("users").where({ id }).del();
  return deleted > 0;

};

// export const deleteUserService = async (id: number | string) => {
//   const userId = Number(id);
//   if (isNaN(userId)) {
//     console.log("Invalid user ID provided to service:", id);
//     return null;
//   }

//   const user = await db("users").where({ id: userId }).first();
//   if (!user) {
//     console.log("User not found in DB for ID:", userId);
//     return null;
//   }

//   // Remove profile image if exists
//   if (user.profileImage) {
//     const imagePath = path.join(__dirname, "../../assets", user.profileImage.replace(/^\//, ""));
//     if (fs.existsSync(imagePath)) {
//       fs.unlinkSync(imagePath);
//       console.log("Deleted profile image for user ID:", userId);
//     }
//   }

//   await db("users").where({ id: userId }).del();
//   console.log("User deleted successfully from DB ID:", userId);

//   return true;
// };





// import db from "../../src/connection";
// // bcrypt is a pashword hashing library, used to hash pass before saving to db.
// import bcrypt from "bcrypt";
// // node js core module, to handle file and directory path.
// import path from "path";
// // node js core module for file system to read write files.
// import fs from "fs";

// // ----------------------------
// // Create First Admin
// // ----------------------------
// export const createFirstAdminService = async (data: any) => {
//   // hashes pass using salt round 10 times,like user pass is accessed as data.pass like it is Tani123, then after hash it like of7QF4.OGJfYvq
//   const hashedPassword = await bcrypt.hash(data.password, 10);
//   // inserting admin record to users table.
//   const [id] = await db("users").insert({
//     // spread operator to copy all properties from data
//     ...data,
//     password: hashedPassword,
//     role: "admin",
//     roleId: null,
//     status: "active",
//   });
// // SELECT * FROM users WHERE id=? LIMIT 1, only 1st user.
//   return db("users").where({ id }).first();
// };

// // ----------------------------
// // Fast user count service
// // ----------------------------
// export const getUsersCountService = async (): Promise<number> => {
//   // like as user table has 123 record then total 123.
//   const result = await db("users").count<{ total: number }>("id as total");
//   // knex returns array like [{ total: '123' }] depending on DB driver
//   const total = result?.[0]?.total ?? 0;
//   return Number(total);
// };

// export const getAllUsersService = async (
//   search?: string,
//   column?: string,
//   page: number = 1,
//   limit: number = 10,
//   sortBy?: string,
//   sortOrder: "asc" | "desc" = "desc",
//   includeCount: boolean = true
// ) => {
//   // if page 1, offset-0, page 2 offset 10,page 3 offset 20, offset used to skip record.
//   const offset = (page - 1) * limit;
// // only these cols are allowed for soting.
//   const ALLOWED_SORTS: Record<string, string> = {
//     id: "users.id",
//     firstName: "users.firstName",
//     lastName: "users.lastName",
//     email: "users.email",
//     phone: "users.phone",
//     role: "roles.role",
//     createdAt: "users.createdAt",
//   };
// // if frontend sends value of sort by use it, else by createdAt, and in desc order by default.
//   const sortColumn = sortBy && ALLOWED_SORTS[sortBy] ? ALLOWED_SORTS[sortBy] : "users.createdAt";
//   const order = sortOrder === "asc" ? "asc" : "desc";

//   // SELECT users.id, users.firstName, users.lastName, users.email, ... FROM users LEFT JOIN roles ON users.roleId = roles id

//   const rowsQuery = db("users")
//     .leftJoin("roles", "users.roleId", "roles.id")
//     .select(
//       "users.id",
//       "users.firstName",
//       "users.lastName",
//       "users.email",
//       "users.phone",
//       "roles.role as role",
//       "users.status",
//       "users.profileImage",
//       "users.createdAt"
//     )
//     .modify((qb) => {
//       if (search && column) {
//         // allow searching on status as exact match, like we say where user.email LIKE %tani%
//         const searchCol = column === "role" ? "roles.role" : `users.${column}`;
//         if (column === "status") {
//           qb.where(searchCol, search.toLowerCase());
//         } else {
//           qb.where(searchCol, "like", `%${search}%`);
//         }
//       }
//     })
//     // how to show like order by the searched col, and ordr like asc, desc 
//     .orderBy(sortColumn, order)
//     .limit(limit)
//     .offset(offset);

//   // like we are getting, SELECT COUNT(id) AS total FROM users WHERE email LIKE '%tanisha%'
//   let countResult: any = null;
//   if (includeCount) {
//     const countQuery = db("users")
//       .modify((qb) => {
//         if (search && column) {
//           const searchCol = column === "role" ? "roles.role" : `users.${column}`;
//           if (column === "status") {
//             qb.where(searchCol, search.toLowerCase());
//           } else {
//             qb.where(searchCol, "like", `%${search}%`);
//           }
//         }
//       })
//       .count<{ total: number }>("id as total");

//     // run both queries in parallel, for speed here rawquery gets actual user data, and cntquery get total no of users that matchs, promise all wait for all to complete.
//     const [usersResult, cnt] = await Promise.all([rowsQuery, countQuery]);
//     countResult = cnt;
//     const users = usersResult || [];
//     //convert total into numbers, and if no total than place 0
//     const total = Number(countResult?.[0]?.total ?? 0);
//     // ike if total 45 users, and limit is 10, then ceil 45/10 = 5 pages, max 1 ensure even if there is 0 user return atleast 1 page.
//     const totalPages = Math.max(1, Math.ceil(total / limit));
// // if we have cnt, then we show these
//     return {
//       users,
//       total,
//       totalPages,
//       currentPage: page,
//       includeCount,
//     };
//     // if not, show these, -1 is for signal that, total cnt was not calculated
//   } else {
//     const users = await rowsQuery;
//     return {
//       users,
//       total: -1,
//       totalPages: -1,
//       currentPage: page,
//       includeCount,
//     };
//   }
// };


// // ----------------------------
// // Export All Users Service (CSV data source)
// // ----------------------------
// export const exportUsersCSVService = async () => {
//   // Fetch all users from DB with role info
//   const users = await db("users")
//     .leftJoin("roles", "users.roleId", "roles.id")
//     .select(
//       "users.id",
//       "users.firstName",
//       "users.lastName",
//       "users.email",
//       "users.phone",
//       "roles.role as role",
//       "users.status"
//     )
//     .orderBy("users.id", "asc");

//   // Format headers and rows for CSV export
//   const headers = [
//     "ID",
//     "First Name",
//     "Last Name",
//     "Email",
//     "Phone",
//     "Role",
//     "Status",
//   ];

//   const rows = users.map((u) => [
//     // data to show in csv file
//     u.id,
//     u.firstName,
//     u.lastName,
//     u.email,
//     // if no number, then show -,like 2,Simran,Kaur,simran@ex.com,-,hr,active
//     u.phone || "-",
//     u.role || "",
//     u.status,
//   ]);
// // format data as "ID,First Name,Last Name,Email,Phone,Role,Status"
//   const csvContent = [
//     headers.join(","),
//     ...rows.map((r) => r.join(",")),
//   ].join("\n");

//   // Return as plain string (controller will handle sending file + headers)
//   return {
//     csvContent,
//     users, 
//   };
// };



// // ----------------------------
// // Get User By ID
// // ----------------------------
// export const getUserByIdService = async (id: number) => {
//   return db("users")
//     .leftJoin("roles", "users.roleId", "roles.id")
//     .select(
//       "users.id",
//       "users.firstName",
//       "users.lastName",
//       "users.email",
//       "users.phone",
//       "roles.role as role",
//       "users.status",
//       "users.profileImage",
//       "users.createdAt"
//     )
//     .where("users.id", id)
//     .first();
// };

// // ----------------------------
// // Create User
// // ----------------------------
// export const createUserService = async (data: any) => {
//   const existing = await db("users").where({ email: data.email }).first();
//   if (existing) throw new Error(`User with email ${data.email} already exists`);
// // Math.random genereate random nos b/w 0 and 1, then convert to base 36, means with 0-9 digits and a-z letters, slice(-8) means take the last 8 character, this is the temp pass, to send to user.
//   const tempPassword = Math.random().toString(36).slice(-8);
//   // and store it as hashed in DB 
//   const hashedPassword = await bcrypt.hash(tempPassword, 10);
// // like as we assign a rifole id, like if role id=2, it map to admin, so rol as admin
//   let roleName: string | null = null;
//   if (data.roleId) {
//     const roleRow = await db("roles").where({ id: Number(data.roleId) }).first();
//     if (roleRow) roleName = roleRow.role;
//   }

//   const insertData: any = {
//     firstName: data.firstName,
//     lastName: data.lastName,
//     email: data.email,
//     phone: data.phone || null,
//     status: data.status || "active",
//     role: roleName,
//     roleId: data.roleId ? Number(data.roleId) : null,
//     profileImage: data.imagePath || null,
//     password: hashedPassword,
//   };

//   const [id] = await db("users").insert(insertData);
//   const user = await db("users").where({ id }).first();

//   return { user, tempPassword };
// };

// // ----------------------------
// // Update User
// // ----------------------------
// export const updateUserService = async (id: number, data: any) => {

//   if (data.roleId) {
//     const roleRow = await db("roles").where({ id: Number(data.roleId) }).first();
//     if (roleRow) data.role = roleRow.role;
//   }

//   if (data.imagePath) {
//   data.profileImage = data.imagePath;   
// }


//   await db("users").where({ id }).update({ ...data, updatedAt: db.fn.now() });
//   return db("users").where({ id }).first();
// };

// // ----------------------------
// // Update User Status
// // ----------------------------
// export const updateUserStatusService = async (id: number, status: string) => {
//   await db("users").where({ id }).update({ status, updatedAt: db.fn.now() });
//   return db("users").where({ id }).first();
// };

// // ----------------------------
// // Login User
// // ----------------------------
// export const loginUserService = async (email: string, password: string) => {
//   const user = await db("users").where({ email }).first();
//   if (!user) throw new Error("Invalid email or password");

//   const validPassword = await bcrypt.compare(password, user.password);
//   if (!validPassword) throw new Error("Invalid email or password");

//   if (user.status !== "active") throw new Error("User is inactive");

//   // 🔹 Fetch role info
//   const role = user.roleId
//     ? await db("roles").where({ id: user.roleId }).first()
//     : null;

//   // 🔹 Fetch permissions for the role
//   let permissions: string[] = [];
//   if (role) {
//     const rolePermissions = await db("role_permissions")
//       .join("permissions", "role_permissions.permissionId", "permissions.id")
//       .where("role_permissions.roleId", user.roleId)
//       .select("permissions.name");
//     permissions = rolePermissions.map((p) => p.name);
//   }

//   // 🔹 Merge all into one object
//   return {
//     id: user.id,
//     firstName: user.firstName,
//     lastName: user.lastName,
//     email: user.email,
//     role: role ? role.role : user.role,
//     roleId: user.roleId,
//     status: user.status,
//     // with logged in user we must have to pass the permissions.
//     permissions, 
//   };
// };


// export const getMeService = async (id: number) => {
//   // 1) Get user basic info
//   const user = await db("users")
//     .where("users.id", id)
//     .first();

//   if (!user) return null;

//   // 2) Get role name
//   let roleName = user.role;
//   if (user.roleId) {
//     const roleRow = await db("roles").where({ id: user.roleId }).first();
//     if (roleRow) roleName = roleRow.role;
//   }

//   // 3) Get permissions based on role
//   let permissions: string[] = [];
//   if (user.roleId) {
//     const rolePermissions = await db("role_permissions")
//       .join("permissions", "role_permissions.permissionId", "permissions.id")
//       .where("role_permissions.roleId", user.roleId)
//       .select("permissions.name");

//     permissions = rolePermissions.map((p) => p.name);
//   }

//   // 4) Return final user object
//   return {
//     id: user.id,
//     firstName: user.firstName,
//     lastName: user.lastName,
//     email: user.email,
//     role: roleName,
//     roleId: user.roleId,
//     status: user.status,
//     permissions,
//     profileImage: user.profileImage,
//   };
// };


// export const deleteUserService = async (id: number | string) => {
//   const userId = Number(id);
//   if (isNaN(userId)) {
//     console.log("Invalid user ID provided to service:", id);
//     return null;
//   }

//   const user = await db("users").where({ id: userId }).first();
//   if (!user) {
//     console.log("User not found in DB for ID:", userId);
//     return null;
//   }

//   // Remove profile image if exists
//   if (user.profileImage) {
//     const imagePath = path.join(__dirname, "../../assets", user.profileImage.replace(/^\//, ""));
//     if (fs.existsSync(imagePath)) {
//       fs.unlinkSync(imagePath);
//       console.log("Deleted profile image for user ID:", userId);
//     }
//   }

//   await db("users").where({ id: userId }).del();
//   console.log("User deleted successfully from DB ID:", userId);

//   return true;
// };






// src/services/userService.ts
// import db from "../connection";
// import bcrypt from "bcrypt";
// import path from "path";
// import fs from "fs";
// import { responseMessage } from "../utils/responseMessage";

// /**
//  * Helper: map DB row (snake_case) -> frontend-friendly camelCase user object
//  * Handles multiple possible column names defensively.
//  */
// const mapUserRow = (r: any) => {
//   if (!r) return null;
//   return {
//     id: r.id,
//     firstName: r.first_name ?? r.f_name ?? r.firstName ?? "",
//     lastName: r.last_name ?? r.l_name ?? r.lastName ?? "",
//     email: r.email,
//     phone: r.phone_no ?? r.phone ?? null,
//     // departmentName returned from join aliased as department_name
//     department: r.department_name ?? r.deptName ?? null,
//     departmentId: r.department_id ?? r.dept_id ?? null,
//     // status in DB may be 'Active'/'Inactive' - normalize to lowercase for frontend
//     status: typeof r.status === "string" ? (r.status.toLowerCase() === "active" ? "active" : "inactive") : (r.user_status ? (r.user_status.toLowerCase() === "active" ? "active" : "inactive") : "inactive"),
//     profileImage: r.profile_image ?? r.profileImage ?? null,
//     createdAt: r.created_at ?? r.createdAt ?? null,
//     updatedAt: r.updated_at ?? r.updatedAt ?? null,
//     // role/roleId kept if present (for backwards compatibility with permissions)
//     role: r.role ?? null,
//     roleId: r.roleId ?? r.role_id ?? null,
//     permissions: r.permissions ?? [],
//   };
// };

// // ----------------------------
// // Create First Admin
// // ----------------------------
// // export const createFirstAdminService = async (data: any) => {
// //   // Expecting data.password to be provided
// //   if (!data?.password) throw new Error("Password is required to create admin");

// //   const hashedPassword = await bcrypt.hash(data.password, 10);

// //   // Insert using DB column names
// //   const insertData: any = {
// //     first_name: data.firstName ?? data.first_name ?? data.f_name ?? null,
// //     last_name: data.lastName ?? data.last_name ?? data.l_name ?? null,
// //     email: data.email,
// //     password: hashedPassword,
// //     phone_no: data.phone ?? data.phone_no ?? null,
// //     // status in DB stored as 'Active'/'Inactive' — normalize to 'Active'
// //     status: data.status ? (data.status.toLowerCase() === "active" ? "Active" : "Inactive") : "Active",
// //     department_id: data.departmentId ?? data.department_id ?? null,
// //     // keep role/roleId if provided — otherwise null
// //     role: data.role ?? null,
// //     roleId: data.roleId ?? data.role_id ?? null,
// //     created_at: db.fn.now(),
// //   };

// //   const [id] = await db("users").insert(insertData);
// //   const row = await db("users").where({ id }).first();
// //   return mapUserRow(row);
// // };
// // export const createFirstAdminService = async () => {
// //   try {
// //     // Check if any user exists
// //     const existingUser = await db("users").first();
// //     if (existingUser) return;

// //     const hashedPassword = await bcrypt.hash("Pass123", 10);

// //     await db("users").insert({
// //       first_name: "Tanisha",
// //       last_name: "Dhasmana",
// //       email: "admin@example.com",
// //       password: hashedPassword,
// //       phone_no: "9999999999",
// //       department_id: 1,
// //       status: "Active",
// //       created_at: db.fn.now(),
// //     });

// //     console.log("✅ First admin user created successfully");
// //   } catch (error: any) {
// //     console.error("❌ Error creating first admin user:", error.message);
// //     throw error;
// //   }
// // };


// export const createFirstAdminService = async (data: any) => {
//   try {
//     // Check if any user exists
//     const existingUser = await db("users").first();
//     if (existingUser) return { message: "Admin already exists" };

//     const hashedPassword = await bcrypt.hash(data.password, 10);

//     const [userId] = await db("users").insert({
//       first_name: data.firstName,
//       last_name: data.lastName,
//       email: data.email,
//       password: hashedPassword,
//       phone_no: data.phone,
//       user_status: "Active",            // ✅ correct column
//       department_id: data.departmentId, // ✅ from body
//       role_id: data.role_id ?? 1,       // ✅ use role_id, not role
//       created_at: db.fn.now(),
//     });

//     return { message: "✅ Admin user created successfully", userId };
//   } catch (error: any) {
//     console.error("❌ Error creating admin user:", error.message);
//     throw error;
//   }
// };


// // ----------------------------
// // Fast user count service
// // ----------------------------
// export const getUsersCountService = async (): Promise<number> => {
//   const result = await db("users").count<{ total: number }>("id as total");
//   const total = result?.[0]?.total ?? 0;
//   return Number(total);
// };

// export const getAllUsersService = async (
//   search?: string,
//   column?: string,
//   page: number = 1,
//   limit: number = 10,
//   sortBy?: string,
//   sortOrder: "asc" | "desc" = "desc",
//   includeCount: boolean = true
// ) => {
//   const offset = (page - 1) * limit;

//   // map allowed sort keys to actual DB columns
//   const ALLOWED_SORTS: Record<string, string> = {
//     id: "users.id",
//     firstName: "users.first_name",
//     lastName: "users.last_name",
//     email: "users.email",
//     phone: "users.phone_no",
//     department: "departments.deptName",
//     createdAt: "users.created_at",
//   };

//   const sortColumn = sortBy && ALLOWED_SORTS[sortBy] ? ALLOWED_SORTS[sortBy] : "users.created_at";
//   const order = sortOrder === "asc" ? "asc" : "desc";

//   // base query: join departments to get department name
//   const rowsQuery = db("users")
//     .leftJoin("departments", "users.department_id", "departments.id")
//     .select(
//       "users.id",
//       "users.first_name",
//       "users.last_name",
//       "users.email",
//       "users.phone_no",
//       "departments.deptName as department_name",
//       "users.department_id",
//       "users.status",
//       "users.profile_image",
//       "users.created_at"
//     )
//     .modify((qb) => {
//       if (search && column) {
//         // map column to DB column name
//         let searchCol = "";
//         if (column === "department") searchCol = "departments.deptName";
//         else if (column === "firstName") searchCol = "users.first_name";
//         else if (column === "lastName") searchCol = "users.last_name";
//         else if (column === "phone") searchCol = "users.phone_no";
//         else searchCol = `users.${column}`;

//         if (column === "status") {
//           // exact match for status
//           qb.where(searchCol, search);
//         } else {
//           qb.where(searchCol, "like", `%${search}%`);
//         }
//       }
//     })
//     .orderBy(sortColumn, order)
//     .limit(limit)
//     .offset(offset);

//   if (includeCount) {
//     const countQuery = db("users")
//       .leftJoin("departments", "users.department_id", "departments.id")
//       .modify((qb) => {
//         if (search && column) {
//           let searchCol = "";
//           if (column === "department") searchCol = "departments.deptName";
//           else if (column === "firstName") searchCol = "users.first_name";
//           else if (column === "lastName") searchCol = "users.last_name";
//           else if (column === "phone") searchCol = "users.phone_no";
//           else searchCol = `users.${column}`;

//           if (column === "status") {
//             qb.where(searchCol, search);
//           } else {
//             qb.where(searchCol, "like", `%${search}%`);
//           }
//         }
//       })
//       .count<{ total: number }>("users.id as total");

//     const [usersResult, cnt] = await Promise.all([rowsQuery, countQuery]);
//     const users = (usersResult || []).map(mapUserRow);
//     const total = Number(cnt?.[0]?.total ?? 0);
//     const totalPages = Math.max(1, Math.ceil(total / limit));

//     return {
//       users,
//       total,
//       totalPages,
//       currentPage: page,
//       includeCount,
//     };
//   } else {
//     const users = (await rowsQuery).map(mapUserRow);
//     return {
//       users,
//       total: -1,
//       totalPages: -1,
//       currentPage: page,
//       includeCount,
//     };
//   }
// };

// // ----------------------------
// // Export All Users Service (CSV data source)
// // ----------------------------
// export const exportUsersCSVService = async () => {
//   const users = await db("users")
//     .leftJoin("departments", "users.department_id", "departments.id")
//     .select(
//       "users.id",
//       "users.first_name",
//       "users.last_name",
//       "users.email",
//       "users.phone_no",
//       "departments.deptName as department_name",
//       "users.status"
//     )
//     .orderBy("users.id", "asc");

//   const headers = ["ID", "First Name", "Last Name", "Email", "Phone", "Department", "Status"];
//   const rows = users.map((u: any) => [
//     u.id,
//     u.first_name,
//     u.last_name,
//     u.email,
//     u.phone_no || "-",
//     u.department_name || "",
//     u.status || "",
//   ]);
//   const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

//   return {
//     csvContent,
//     users: users.map(mapUserRow),
//   };
// };

// // ----------------------------
// // Get User By ID
// // ----------------------------
// export const getUserByIdService = async (id: number) => {
//   const row = await db("users")
//     .leftJoin("departments", "users.department_id", "departments.id")
//     .select(
//       "users.id",
//       "users.first_name",
//       "users.last_name",
//       "users.email",
//       "users.phone_no",
//       "departments.deptName as department_name",
//       "users.department_id",
//       "users.status",
//       "users.profile_image",
//       "users.created_at"
//     )
//     .where("users.id", id)
//     .first();

//   return mapUserRow(row);
// };

// // ----------------------------
// // Create User
// // ----------------------------
// export const createUserService = async (data: any) => {
//   const existing = await db("users").where({ email: data.email }).first();
//   if (existing) throw new Error(`User with email ${data.email} already exists`);

//   const tempPassword = Math.random().toString(36).slice(-8);
//   const hashedPassword = await bcrypt.hash(tempPassword, 10);

//   // If departmentId provided, ensure it exists (optional)
//   let deptId: number | null = null;
//   if (data.departmentId) {
//     const dept = await db("departments").where({ id: Number(data.departmentId) }).first();
//     if (dept) deptId = Number(data.departmentId);
//   }

//   const insertData: any = {
//     first_name: data.firstName,
//     last_name: data.lastName,
//     email: data.email,
//     phone_no: data.phone || null,
//     status: data.status ? (data.status.toLowerCase() === "active" ? "Active" : "Inactive") : "Active",
//     department_id: deptId,
//     profile_image: data.imagePath ?? null,
//     password: hashedPassword,
//     created_at: db.fn.now(),
//   };

//   const [id] = await db("users").insert(insertData);
//   const row = await db("users").where({ id }).first();
//   return { user: mapUserRow(row), tempPassword };
// };

// // ----------------------------
// // Update User
// // ----------------------------
// export const updateUserService = async (id: number, data: any) => {
//   // Map incoming camelCase -> snake_case DB columns
//   const updatePayload: any = {};

//   if (data.firstName !== undefined) updatePayload.first_name = data.firstName;
//   if (data.lastName !== undefined) updatePayload.last_name = data.lastName;
//   if (data.email !== undefined) updatePayload.email = data.email;
//   if (data.phone !== undefined) updatePayload.phone_no = data.phone;
//   if (data.status !== undefined) updatePayload.status = data.status ? (data.status.toLowerCase() === "active" ? "Active" : "Inactive") : undefined;
//   if (data.departmentId !== undefined) updatePayload.department_id = data.departmentId;
//   if (data.imagePath !== undefined) updatePayload.profile_image = data.imagePath;

//   updatePayload.updated_at = db.fn.now();

//   await db("users").where({ id }).update(updatePayload);
//   const row = await db("users").where({ id }).first();
//   return mapUserRow(row);
// };

// // ----------------------------
// // Update User Status
// // ----------------------------
// export const updateUserStatusService = async (id: number, status: string) => {
//   const dbStatus = status.toLowerCase() === "active" ? "Active" : "Inactive";
//   await db("users").where({ id }).update({ status: dbStatus, updated_at: db.fn.now() });
//   const row = await db("users").where({ id }).first();
//   return mapUserRow(row);
// };
// export const loginUserService = async (email: string, password: string) => {
//   // Step 1: Find user by email
//   const user = await db("users").where({ email }).first();
//   if (!user) throw new Error("Invalid email or password");

//   // Step 2: Check password validity
//   const validPassword = await bcrypt.compare(password, user.password);
//   if (!validPassword) throw new Error("Invalid email or password");

//   // Step 3: Ensure user is active
//   const userStatus = (user.status ?? user.user_status ?? "").toString().toLowerCase();
//   if (userStatus !== "active") throw new Error("User is inactive");

//   // Step 4: Role & permissions (for backward compatibility)
//   const roleId = user.roleId ?? user.role_id ?? null;
//   let role: any = null;
//   let permissions: string[] = [];

//   if (roleId) {
//     // Get role name
//     role = await db("roles").where({ id: roleId }).first();

//     // Get permissions for that role
//     const rolePermissions = await db("role_permissions")

//       .join("permissions", "role_permissions.permission_id", "permissions.id")

//       .where("role_permissions.role_id", roleId)

//       .andWhere("permissions.status", "active")

//       .select("permissions.name");

//     permissions = rolePermissions.map((p: any) => p.name);
//   } else {
//     // For admin (first user) — grant all permissions automatically
//     const allPerms = await db("permissions").where({ status: "active" }).select("name");
//     permissions = allPerms.map((p: any) => p.name);
//     role = { role: "admin" };
//   }

//   // Step 5: Department name (if exists)
//   const dept = user.department_id
//     ? await db("departments").where({ id: user.department_id }).first()
//     : null;

//   // Step 6: Return consistent frontend structure
//   return {
//     id: user.id,
//     firstName: user.first_name ?? user.f_name,
//     lastName: user.last_name ?? user.l_name,
//     email: user.email,
//     role: role ? role.role ?? role.role_name ?? "admin" : null,
//     roleId: roleId,
//     status: userStatus,
//     permissions,
//     department: dept ? dept.deptName : null,
//     departmentId: user.department_id ?? null,
//     profileImage: user.profile_image ?? null,
//   };
// };




// // export const getMeService = async (id: number) => {
// //   const user = await db("users").where("users.id", id).first();
// //   if (!user) return null;

// //   // role & permissions (backwards compatibility)
// //   const roleId = user.roleId ?? user.role_id ?? null;
// //   let roleName = user.role ?? null;
// //   let permissions: string[] = [];
// //   if (roleId) {
// //     const roleRow = await db("roles").where({ id: roleId }).first();
// //     if (roleRow) roleName = roleRow.role;
// //     const rolePermissions = await db("role_permissions")
// //       .join("permissions", "role_permissions.permissionId", "permissions.id")
// //       .where("role_permissions.roleId", roleId)
// //       .select("permissions.name");
// //     permissions = rolePermissions.map((p: any) => p.name);
// //   }

// //   const dept = user.department_id ? await db("departments").where({ id: user.department_id }).first() : null;

// //   return {
// //     id: user.id,
// //     firstName: user.first_name,
// //     lastName: user.last_name,
// //     email: user.email,
// //     role: roleName,
// //     roleId: roleId,
// //     status: (user.status ?? user.user_status ?? "").toString().toLowerCase() === "active" ? "active" : "inactive",
// //     permissions,
// //     profileImage: user.profile_image ?? null,
// //     department: dept ? dept.deptName : null,
// //     departmentId: user.department_id ?? null,
// //   };
// // };

// export const getMeService = async (userId: number) => {
//   // Step 1: Fetch user details
//   const user = await db("users").where({ id: userId }).first();
//   if (!user) throw new Error("User not found");

//   // Step 2: Get role details (if assigned)
//   const roleId = user.roleId ?? user.role_id ?? null;
//   let role: any = null;
//   let permissions: string[] = [];

//   if (roleId) {
//     // Fetch role info
//     role = await db("roles").where({ id: roleId }).first();

//     // Fetch all active permissions assigned to that role
//     const rolePermissions = await db("role_permissions")

//       .join("permissions", "role_permissions.permission_id", "permissions.id")

//       .where("role_permissions.role_id", roleId)

//       .andWhere("permissions.status", "active")

//       .select("permissions.name");

//     permissions = rolePermissions.map((p: any) => p.name);
//   } else {
//     // Admin (no explicit role) gets all permissions
//     const allPerms = await db("permissions")
//       .where({ status: "active" })
//       .select("name");
//     permissions = allPerms.map((p: any) => p.name);
//     role = { role: "admin" };
//   }

//   // Step 3: Get department name
//   const dept = user.department_id
//     ? await db("departments").where({ id: user.department_id }).first()
//     : null;

//   // Step 4: Return structured response
//   return {
//     id: user.id,
//     firstName: user.first_name ?? user.f_name,
//     lastName: user.last_name ?? user.l_name,
//     email: user.email,
//     role: role ? role.role ?? role.role_name ?? "admin" : null,
//     roleId: roleId,
//     status: user.status ?? user.user_status,
//     permissions,
//     department: dept ? dept.deptName : null,
//     departmentId: user.department_id ?? null,
//     profileImage: user.profile_image ?? null,
//   };
// };



// export const deleteUserService = async (id: number | string) => {
//   const userId = Number(id);
//   if (isNaN(userId)) {
//     console.log("Invalid user ID provided to service:", id);
//     return null;
//   }

//   const user = await db("users").where({ id: userId }).first();
//   if (!user) {
//     console.log("User not found in DB for ID:", userId);
//     return null;
//   }

//   if (user.profile_image) {
//     const imagePath = path.join(__dirname, "../../assets", user.profile_image.replace(/^\//, ""));
//     if (fs.existsSync(imagePath)) {
//       fs.unlinkSync(imagePath);
//       console.log("Deleted profile image for user ID:", userId);
//     }
//   }

//   await db("users").where({ id: userId }).del();
//   console.log("User deleted successfully from DB ID:", userId);

//   return true;
// };


