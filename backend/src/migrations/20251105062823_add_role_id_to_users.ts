import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    // add role_id as optional foreign key to roles.id
    table.integer("role_id").unsigned().nullable()
      .references("id").inTable("roles").onDelete("SET NULL");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("role_id");
  });
}
