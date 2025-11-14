import db from "../../src/connection";
import { encrypt, decrypt } from "../utils/cryptoHashing";
/**
 * Get total subscription count
 */
export const getSubscriptionsCountService = async (): Promise<number> => {
  const result = await db("subscriptions").count<{ total: number }>(
    "id as total"
  );
  return Number(result?.[0]?.total ?? 0);
};


export const getAllSubscriptionsService = async (
  page: number,
  limit: number,
  filters: Record<string, string | undefined>,
  sortBy?: string,
  sortOrder: "asc" | "desc" = "desc"
) => {
  const offset = (page - 1) * limit;

  try {
    let baseQuery = db("subscriptions as s")
      .leftJoin("departments as d", "s.department_id", "d.id")
      .whereNull("s.deleted_at");

    // ✅ Apply filters dynamically (AND condition)
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.trim() !== "") {
        const val = value.toLowerCase();

        switch (key) {
          case "subsc_name":
          case "subsc_type":
          case "subsc_currency":
            baseQuery = baseQuery.andWhereRaw(`LOWER(s.${key}) LIKE ?`, [
              `%${val}%`,
            ]);
            break;

          case "subsc_price":
            baseQuery = baseQuery.andWhereRaw(
              `CAST(s.subsc_price AS CHAR) LIKE ?`,
              [`%${value}%`]
            );
            break;

          case "department_name":
            baseQuery = baseQuery.andWhereRaw(`LOWER(d.deptName) LIKE ?`, [
              `%${val}%`,
            ]);
            break;

          case "subsc_status":
            baseQuery = baseQuery.andWhereRaw(`LOWER(s.subsc_status) = ?`, [
              val,
            ]);
            break;
        }
      }
    });

    // ✅ Sorting
    const ALLOWED_SORTS: Record<string, string> = {
      id: "s.id",
      subsc_name: "s.subsc_name",
      subsc_type: "s.subsc_type",
      subsc_price: "s.subsc_price",
      subsc_currency: "s.subsc_currency",
      subsc_status: "s.subsc_status",
      department_name: "d.deptName",
      created_at: "s.created_at",
    };

    if (sortBy && ALLOWED_SORTS[sortBy]) {
      baseQuery = baseQuery.orderBy(ALLOWED_SORTS[sortBy], sortOrder);
    } else {
      baseQuery = baseQuery.orderBy("s.created_at", "desc");
    }

    // ✅ Get paginated results
    const data = await baseQuery
      .clone()
      .select(
        "s.id",
        "s.subsc_name",
        "s.subsc_type",
        "s.subsc_price",
        "s.subsc_currency",
        "s.subsc_status",
        "s.purchase_date",
        "s.renew_date",
        "s.portal_detail",
        "s.payment_method",
        "d.deptName as department_name"
      )
      .limit(limit)
      .offset(offset);

    // ✅ Decrypt sensitive data if needed
    const decryptedData = data.map((item) => ({
      ...item,
      portal_detail: item.portal_detail ? decrypt(item.portal_detail) : null,
      payment_method: item.payment_method ? decrypt(item.payment_method) : null,
    }));

    // ✅ Count total records for pagination
    const countResult = await baseQuery
      .clone()
      .count<{ total: number }>("s.id as total");
    const total = Number(countResult?.[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return {
      subscriptions: decryptedData,
      total,
      totalPages,
      currentPage: page,
    };
  } catch (err: any) {
    console.error("getAllSubscriptionsService error:", err);
    throw err;
  }
};

/**
 * Export all subscriptions as CSV
 */
export const exportSubscriptionsCSVService = async () => {
  const subscriptions = await db("subscriptions")
    .leftJoin("departments", "subscriptions.department_id", "departments.id")
    .whereNull("subscriptions.deleted_at")
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

  const headers = [
    "ID",
    "Name",
    "Type",
    "Price",
    "Currency",
    "Renew Date",
    "Department",
    "Status",
  ];
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

/**
 * Get subscription by ID
 */
export const getSubscriptionByIdService = async (id: number) => {
  const sub = await db("subscriptions as s")
    .leftJoin("departments as d", "s.department_id", "d.id")
    .select(
      "s.id",
      "s.subsc_name",
      "s.subsc_type",
      "s.subsc_price",
      "s.subsc_currency",
      "s.purchase_date",
      "s.renew_date",
      "s.portal_detail",
      "s.payment_method",
      "s.subsc_status",
      "s.department_id",
      "d.deptName as department_name",
      "s.created_at",
      "s.updated_at",
      "s.subc_url"
    )
    .where("s.id", id)
    .first();

  if (!sub) return null;

  return {
    ...sub,
    portal_detail: sub.portal_detail ? decrypt(sub.portal_detail) : null,
    payment_method: sub.payment_method ? decrypt(sub.payment_method) : null,
  };
};

/**
 * Create a new subscription
 */


export const createSubscriptionService = async (data: any) => {




  const existing = await db("subscriptions")
  .where({
    subsc_name: data.subsc_name,
    department_id: data.department_id,
  })
  .whereNull("deleted_at")
  .first();

if (existing) {
  throw new Error("Subscription with same name already exists for this department.");
}




  const insertData = {
    subsc_name: data.subsc_name,
    subsc_type: data.subsc_type,
    subsc_price: data.subsc_price,
    subsc_currency: data.subsc_currency || "USD",
    subc_url: data.subc_url || null,
    renew_date: data.renew_date || null,
    portal_detail: data.portal_detail ? encrypt(data.portal_detail) : null,
    payment_method: data.payment_method ? encrypt(data.payment_method) : null,
    purchase_date: data.purchase_date || db.fn.now(),
    subsc_status: data.subsc_status || "Active",
    department_id: data.department_id ? Number(data.department_id) : null,
  };

  const [id] = await db("subscriptions").insert(insertData);

  const sub = await db("subscriptions as s")
    .leftJoin("departments as d", "s.department_id", "d.id")
    .select(
      "s.id",
      "s.subsc_name",
      "s.subsc_type",
      "s.subsc_price",
      "s.subsc_currency",
      "s.purchase_date",
      "s.renew_date",
      "s.portal_detail",
      "s.payment_method",
      "s.subsc_status",
      "s.department_id",
      "d.deptName as department_name",
      "s.created_at",
      "s.updated_at"
    )
    .where("s.id", id)
    .first();

  return {
    ...sub,
    portal_detail: sub.portal_detail ? decrypt(sub.portal_detail) : null,
    payment_method: sub.payment_method ? decrypt(sub.payment_method) : null,
  };
};

/**
 * Update existing subscription
 */
export const updateSubscriptionService = async (id: number, data: any) => {
  const updateData = {
    subsc_name: data.subsc_name,
    subsc_type: data.subsc_type,
    subsc_price: data.subsc_price,
    subc_url: data.subc_url || null,
    subsc_currency: data.subsc_currency,
    renew_date: data.renew_date || null,
    portal_detail: data.portal_detail ? encrypt(data.portal_detail) : null,
    payment_method: data.payment_method ? encrypt(data.payment_method) : null,
    subsc_status: data.subsc_status,
    purchase_date: data.purchase_date || null,
    department_id: data.department_id ? Number(data.department_id) : null,
    updated_at: db.fn.now(),
  };

  await db("subscriptions").where({ id }).update(updateData);

  const sub = await db("subscriptions as s")
    .leftJoin("departments as d", "s.department_id", "d.id")
    .select(
      "s.id",
      "s.subsc_name",
      "s.subsc_type",
      "s.subsc_price",
      "s.subsc_currency",
      "s.purchase_date",
      "s.renew_date",
      "s.portal_detail",
      "s.payment_method",
      "s.subsc_status",
      "s.department_id",
      "d.deptName as department_name",
      "s.created_at",
      "s.updated_at"
    )
    .where("s.id", id)
    .first();

  return {
    ...sub,
    portal_detail: sub.portal_detail ? decrypt(sub.portal_detail) : null,
    payment_method: sub.payment_method ? decrypt(sub.payment_method) : null,
  };
};

/**
 * Update subscription status only
 */
export const updateSubscriptionStatusService = async (
  id: number,
  status: string
) => {
  await db("subscriptions").where({ id }).update({
    subsc_status: status,
    updated_at: db.fn.now(),
  });

  const sub = await db("subscriptions")
    .leftJoin("departments", "subscriptions.department_id", "departments.id")
    .select("subscriptions.*", "departments.deptName as department_name")
    .where("subscriptions.id", id)
    .first();

  return {
    ...sub,
    portal_detail: sub.portal_detail ? decrypt(sub.portal_detail) : null,
    payment_method: sub.payment_method ? decrypt(sub.payment_method) : null,
  };
};

/**
 * Soft delete subscription
 */
export const deleteSubscriptionService = async (
  id: number,
  performedById: number
) => {
  const result = await db("subscriptions").where({ id }).update({
    deleted_at: db.fn.now(),
    deleted_by: performedById,
    subsc_status: "Inactive",
    updated_at: db.fn.now(),
  });

  return result > 0;
};
