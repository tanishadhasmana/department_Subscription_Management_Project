import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.renameColumn("f_name", "first_name");
    table.renameColumn("l_name", "last_name");
    table.renameColumn("user_status", "status");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.renameColumn("first_name", "f_name");
    table.renameColumn("last_name", "l_name");
    table.renameColumn("status", "user_status");
  });
}
