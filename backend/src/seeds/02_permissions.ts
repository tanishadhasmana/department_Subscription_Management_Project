import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  // 1. Delete existing data
  await knex("permissions").del();

  // 2. Reset auto-increment
  await knex.raw("ALTER TABLE permissions AUTO_INCREMENT = 1");

  // 3. Insert new permissions
  await knex("permissions").insert([
    { name: "user_list", status: "active" },
    { name: "user_add", status: "active" },
    { name: "user_edit", status: "active" },
    { name: "user_delete", status: "active" },
    { name: "subscription_list", status: "active" },
    { name: "subscription_add", status: "active" },
    { name: "subscription_edit", status: "active" },
    { name: "subscription_delete", status: "active" },
  ]);
};
