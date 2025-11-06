// src/seeds/01_roles.ts
import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // Delete all existing roles first
  await knex("roles").del();

  // Reset auto-increment (optional but useful)
  await knex.raw("ALTER TABLE roles AUTO_INCREMENT = 1");

  // Insert roles with desired IDs
  await knex("roles").insert([
    { id: 1, role_name: "admin", role_status: "Active" },
    { id: 2, role_name: "user", role_status: "Active" },
  ]);
}
