import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("roles", (table) => {
    // Primary key
    table.increments("id").primary();

    // Foreign key (if linked to users table)
    table.integer("user_id").unsigned().references("id").inTable("users").onDelete("CASCADE");

    // Role name (unique)
    table.string("role_name", 50).notNullable().unique();

    // Role status
    table.enu("role_status", ["Active", "Inactive"]).defaultTo("Active");

    // Who updated or deleted (nullable)
    table.integer("updated_by").unsigned().nullable();
    table.integer("deleted_by").unsigned().nullable();

    // Timestamps
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").nullable();
    table.timestamp("deleted_at").nullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists("roles");
}
