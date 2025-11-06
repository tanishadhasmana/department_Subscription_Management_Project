// src/seeds/03_add_dummy_users.ts
import { Knex } from "knex";
import bcrypt from "bcrypt";

export async function seed(knex: Knex): Promise<void> {
  await knex("users").del();
  await knex.raw("ALTER TABLE users AUTO_INCREMENT = 1");

  const hashedPassword1 = await bcrypt.hash("admin123", 10);
  const hashedPassword2 = await bcrypt.hash("user123", 10);
  const hashedPassword3 = await bcrypt.hash("john123", 10);
  const hashedPassword4 = await bcrypt.hash("jane123", 10);
  const hashedPassword5 = await bcrypt.hash("alice123", 10);

  await knex("users").insert([
    {
      first_name: "Tanisha",
      last_name: "Dhasmana",
      email: "admin@example.com",
      password: hashedPassword1,
      phone_no: "9999999999",
      status: "Active",
      department_id: 1,
      role_id: 1, // admin
      created_at: new Date(),
    },
    {
      first_name: "John",
      last_name: "Doe",
      email: "john@example.com",
      password: hashedPassword2,
      phone_no: "8888888888",
      status: "Active",
      department_id: 2,
      role_id: 2, // user
      created_at: new Date(),
    },
    {
      first_name: "Jane",
      last_name: "Smith",
      email: "jane@example.com",
      password: hashedPassword3,
      phone_no: "7777777777",
      status: "Inactive",
      department_id: 3,
      role_id: 2, // user
      created_at: new Date(),
    },
    {
      first_name: "Alice",
      last_name: "Brown",
      email: "alice@example.com",
      password: hashedPassword4,
      phone_no: "6666666666",
      status: "Active",
      department_id: 4,
      role_id: 2, // user
      created_at: new Date(),
    },
    {
      first_name: "Bob",
      last_name: "Johnson",
      email: "bob@example.com",
      password: hashedPassword5,
      phone_no: "5555555555",
      status: "Active",
      department_id: 5,
      role_id: 2, // user
      created_at: new Date(),
    },
  ]);
}
