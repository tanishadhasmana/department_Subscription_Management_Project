import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("departments", (table) => {
    table.increments("id").primary(); // Department ID
    table.string("deptName", 100).notNullable().unique(); // Unique, not null
    table.enum("deptStatus", ["Active", "Inactive"]).notNullable().defaultTo("Active");

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now()); // set on create

    // Initially NULL, will be updated by MySQL when record changes
    table.timestamp("updated_at").nullable().defaultTo(null);

    table.timestamp("deleted_at").nullable().defaultTo(null); // soft delete
    table.integer("updated_by").unsigned().nullable().references("id").inTable("users");
    table.integer("deleted_by").unsigned().nullable().references("id").inTable("users");
  });

  // ✅ MySQL-specific alter to enable ON UPDATE CURRENT_TIMESTAMP only (not default)
  await knex.raw(`
    ALTER TABLE departments 
    MODIFY updatedAt TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("departments");
} 