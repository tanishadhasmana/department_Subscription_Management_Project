import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable("users", (table) => {
    // Primary key
    table.increments("id").primary();

    // Basic details
    table.string("f_name", 60).notNullable();
    table.string("l_name", 60).notNullable();

    // Email unique
    table.string("email", 100).notNullable().unique();

    // Password
    table.string("password", 255).notNullable();

    // Phone number
    table.string("phone_no", 15).nullable();

    // User status
    table.enu("user_status", ["Active", "Inactive"]).defaultTo("Active");

    // Email verified
    table.enu("email_verified", ["Yes", "No"]).defaultTo("No");

    // Opportunity code (tinyint)
    table.tinyint("opp_code").nullable();

    // Department relation (FK)
    table
      .integer("department_id")
      .unsigned()
      .references("id")
      .inTable("departments")
      .onDelete("SET NULL");

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
  return knex.schema.dropTableIfExists("users");
}
