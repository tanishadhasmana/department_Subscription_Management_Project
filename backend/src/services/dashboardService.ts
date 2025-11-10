import db from "../connection";

export const getDepartmentWiseSubscriptionsService = async () => {
  const result = await db("departments as d")
    .leftJoin("subscriptions as s", "d.id", "s.department_id")
    .select(
      "d.id",
      "d.deptName as deptName"
    )
    .count("s.id as subscriptionCount")
    .groupBy("d.id", "d.deptName");

  // Ensure camelCase output for frontend
  return result.map(r => ({
    deptName: r.deptName,
    subscriptionCount: Number(r.subscriptionCount) || 0,
  }));
};


