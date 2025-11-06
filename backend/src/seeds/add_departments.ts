import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Delete existing data
  await knex("departments").del();

  // Insert dummy data
  await knex("departments").insert([
    { deptName: "Fullstack", deptStatus: "Active" },
    { deptName: ".NET", deptStatus: "Active" },
    { deptName: "Mobile", deptStatus: "Active" },
    { deptName: "UI/UX", deptStatus: "Active" },
    { deptName: "Marketing", deptStatus: "Active" },
    { deptName: "DevOps", deptStatus: "Active" },
    { deptName: "HR", deptStatus: "Active" },
    { deptName: "PHP", deptStatus: "Active" },
    { deptName: "Digital Marketing", deptStatus: "Active" },
  ]);
}
