import db from "../connection";

export const getDepartmentWiseSubscriptionsService = async () => {
  // Join departments and subscriptions to count subscriptions per department
  const result = await db("departments as d")
    .leftJoin("subscriptions as s", "d.id", "s.department_id")
    .select("d.deptName")
    .count("s.id as subscriptionCount")
    .groupBy("d.id")
    .orderBy("d.deptName", "asc");

  // Example output:
  // [{ deptName: "IT", subscriptionCount: 5 }, { deptName: "HR", subscriptionCount: 3 }]
  return result;
};
