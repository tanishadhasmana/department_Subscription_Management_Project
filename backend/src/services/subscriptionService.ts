import db from "../../src/connection";
import path from "path";
import fs from "fs";

// ----------------------------
// Fast subscription count service
// ----------------------------
export const getSubscriptionsCountService = async (): Promise<number> => {
  // like as subscription table has 123 record then total 123.
  const result = await db("subscriptions").count<{ total: number }>("id as total");
  return Number(result?.[0]?.total ?? 0);
};

// ----------------------------
// Get All Subscriptions with pagination, search, sort
// ----------------------------
export const getAllSubscriptionsService = async (
  search?: string,
  column?: string,
  page: number = 1,
  limit: number = 10,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc",
  includeCount: boolean = true
) => {
  // if page 1, offset-0, page 2 offset 10, page 3 offset 20, offset used to skip record.
  const offset = (page - 1) * limit;

  // only these cols are allowed for sorting.
  const ALLOWED_SORTS: Record<string, string> = {
    id: "subscriptions.id",
    subsc_name: "subscriptions.subsc_name",
    subsc_type: "subscriptions.subsc_type",
    subsc_price: "subscriptions.subsc_price",
    subsc_currency: "subscriptions.subsc_currency",
    department_name: "departments.deptName",
    created_at: "subscriptions.created_at",
  };

  // if frontend sends value of sort by use it, else by createdAt, and in desc order by default.
  const sortColumn = sortBy && ALLOWED_SORTS[sortBy] ? ALLOWED_SORTS[sortBy] : "subscriptions.created_at";
  const order = sortOrder === "asc" ? "asc" : "desc";

  // Main rows query
  const rowsQuery = db("subscriptions")
    .leftJoin("departments", "subscriptions.department_id", "departments.id")
    .select(
      "subscriptions.id",
      "subscriptions.subsc_name",
      "subscriptions.subsc_type",
      "subscriptions.subsc_price",
      "subscriptions.subsc_currency",
      "subscriptions.renew_date",
      "subscriptions.portal_detail",
      "subscriptions.subsc_status",
      "departments.deptName as department_name",
      "subscriptions.created_at",
      "subscriptions.updated_at"
    )
    .modify((qb) => {
      if (search && column) {
        const searchCol = column === "department_name" ? "departments.deptName" : `subscriptions.${column}`;
        if (column === "subsc_status") qb.where(searchCol, search.toLowerCase());
        else qb.where(searchCol, "like", `%${search}%`);
      }
    })
    .orderBy(sortColumn, order)
    .limit(limit)
    .offset(offset);

  if (includeCount) {
    const countQuery = db("subscriptions")
      .leftJoin("departments", "subscriptions.department_id", "departments.id")
      .modify((qb) => {
        if (search && column) {
          const searchCol = column === "department_name" ? "departments.deptName" : `subscriptions.${column}`;
          if (column === "subsc_status") qb.where(searchCol, search.toLowerCase());
          else qb.where(searchCol, "like", `%${search}%`);
        }
      })
      .count<{ total: number }>("subscriptions.id as total");

    // run both queries in parallel, for speed
    const [subscriptionsResult, cnt] = await Promise.all([rowsQuery, countQuery]);
    const subscriptions = subscriptionsResult || [];
    const total = Number(cnt?.[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { subscriptions, total, totalPages, currentPage: page, includeCount };
  } else {
    const subscriptions = await rowsQuery;
    return { subscriptions, total: -1, totalPages: -1, currentPage: page, includeCount };
  }
};

// ----------------------------
// Export Subscriptions to CSV
// ----------------------------
export const exportSubscriptionsCSVService = async () => {
  const subscriptions = await db("subscriptions")
    .leftJoin("departments", "subscriptions.department_id", "departments.id")
    .select(
      "subscriptions.id",
      "subscriptions.subsc_name",
      "subscriptions.subsc_type",
      "subscriptions.subsc_price",
      "subscriptions.subsc_currency",
      "subscriptions.renew_date",
      "departments.deptName as department_name",
      "subscriptions.subsc_status"
    );

  const headers = ["ID", "Name", "Type", "Price", "Currency", "Renew Date", "Department", "Status"];
  const rows = subscriptions.map((s) => [
    s.id,
    s.subsc_name,
    s.subsc_type,
    s.subsc_price,
    s.subsc_currency,
    s.renew_date || "-",
    s.department_name || "-",
    s.subsc_status,
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((v) => `"${v}"`).join(","))
    .join("\n");

  return { csvContent };
};

// ----------------------------
// Get Subscription By ID
// ----------------------------
export const getSubscriptionByIdService = async (id: number) => {
  return db("subscriptions")
    .leftJoin("departments", "subscriptions.department_id", "departments.id")
    .select(
      "subscriptions.id",
      "subscriptions.subsc_name",
      "subscriptions.subsc_type",
      "subscriptions.subsc_price",
      "subscriptions.subsc_currency",
      "subscriptions.renew_date",
      "subscriptions.portal_detail",
      "subscriptions.subsc_status",
      "subscriptions.department_id",
      "departments.deptName as department_name",
      "subscriptions.created_at",
      "subscriptions.updated_at"
    )
    .where("subscriptions.id", id)
    .first();
};

// ----------------------------
// Create Subscription
// ----------------------------
export const createSubscriptionService = async (data: any) => {
  const insertData: any = {
    subsc_name: data.subsc_name,
    subsc_type: data.subsc_type,
    subsc_price: data.subsc_price,
    subsc_currency: data.subsc_currency || "USD",
    renew_date: data.renew_date || null,
    portal_detail: data.portal_detail || null,
    subsc_status: data.subsc_status || "active",
    department_id: data.department_id ? Number(data.department_id) : null,
  };

  const [id] = await db("subscriptions").insert(insertData);
  const subscription = await db("subscriptions")
    .leftJoin("departments", "subscriptions.department_id", "departments.id")
    .select(
      "subscriptions.*",
      "departments.deptName as department_name"
    )
    .where("subscriptions.id", id)
    .first();

  return subscription;
};

// ----------------------------
// Update Subscription
// ----------------------------
export const updateSubscriptionService = async (id: number, data: any) => {
  const updateData: any = {
    subsc_name: data.subsc_name,
    subsc_type: data.subsc_type,
    subsc_price: data.subsc_price,
    subsc_currency: data.subsc_currency,
    renew_date: data.renew_date || null,
    portal_detail: data.portal_detail || null,
    subsc_status: data.subsc_status,
    department_id: data.department_id ? Number(data.department_id) : null,
    updated_at: db.fn.now(),
  };

  await db("subscriptions").where({ id }).update(updateData);

  const subscription = await db("subscriptions")
    .leftJoin("departments", "subscriptions.department_id", "departments.id")
    .select(
      "subscriptions.*",
      "departments.deptName as department_name"
    )
    .where("subscriptions.id", id)
    .first();

  return subscription;
};

// ----------------------------
// Update Subscription Status
// ----------------------------
export const updateSubscriptionStatusService = async (id: number, status: string) => {
  await db("subscriptions")
    .where({ id })
    .update({ subsc_status: status, updated_at: db.fn.now() });
  
  return db("subscriptions")
    .leftJoin("departments", "subscriptions.department_id", "departments.id")
    .select(
      "subscriptions.*",
      "departments.deptName as department_name"
    )
    .where("subscriptions.id", id)
    .first();
};

// ----------------------------
// Delete Subscription (Soft Delete)
// ----------------------------
export const deleteSubscriptionService = async (id: number, performedById: number) => {
  const result = await db("subscriptions")
    .where({ id })
    .update({
      deleted_at: db.fn.now(),
      deleted_by: performedById,
      subsc_status: "inactive", // optional, mark as inactive in UI
      updated_at: db.fn.now(),
    });

  return result > 0; // true if subscription was updated
};