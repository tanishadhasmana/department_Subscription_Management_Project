import db from "../connection";

export const getAllDepartmentsService = async () => {
  const result = await db("departments").select("id", "deptName as department_name");
  return result;
};


