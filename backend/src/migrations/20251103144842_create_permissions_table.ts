import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("permissions", (table) => {
    table.increments("id").primary(); // Primary key
    table.string("name", 150).notNullable().unique(); // Permission name (unique)
    table.enu("status", ["active", "inactive"]).notNullable().defaultTo("active");

    // timestamps
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").nullable().defaultTo(null);
    table.timestamp("deleted_at").nullable().defaultTo(null);

    // who updated / deleted
    table.integer("updated_by").unsigned().nullable().references("id").inTable("users").onDelete("SET NULL");
    table.integer("deleted_by").unsigned().nullable().references("id").inTable("users").onDelete("SET NULL");
  });

  // MySQL: auto-update updated_at on record change
  await knex.raw(`
    ALTER TABLE permissions
    MODIFY updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("permissions");
}
