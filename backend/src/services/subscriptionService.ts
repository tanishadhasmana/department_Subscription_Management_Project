import db from "../connection";

export const getAllSubscriptionsService = async () => {
  return db("subscriptions as s")
    .leftJoin("departments as d", "s.department_id", "d.id")
    .select(
      "s.id",
      "s.subsc_name",
      "s.subsc_type",
      "s.subsc_price",
      "s.subsc_currency",
      "s.subsc_status",
      "d.deptName as department"
    )
    .whereNull("s.deleted_at")
    .orderBy("s.created_at", "desc");
};
