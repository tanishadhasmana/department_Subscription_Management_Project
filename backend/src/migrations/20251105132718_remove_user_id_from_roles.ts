import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("roles", (table) => {
    table.dropColumn("user_id");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("roles", (table) => {
    table.integer("user_id"); // add it back in case of rollback
  });
}
