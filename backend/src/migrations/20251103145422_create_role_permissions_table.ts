import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("role_permissions", (table) => {
    table.increments("id").primary();

    // foreign keys
    table.integer("role_id").unsigned().notNullable().references("id").inTable("roles").onDelete("CASCADE");
    table.integer("permission_id").unsigned().notNullable().references("id").inTable("permissions").onDelete("CASCADE");

    // timestamps
    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").nullable().defaultTo(null);
    table.timestamp("deleted_at").nullable().defaultTo(null);

    // who updated / deleted
    table.integer("updated_by").unsigned().nullable().references("id").inTable("users").onDelete("SET NULL");
    table.integer("deleted_by").unsigned().nullable().references("id").inTable("users").onDelete("SET NULL");

    // prevent duplicates
    table.unique(["role_id", "permission_id"]);

    // indexes for faster queries
    table.index(["role_id"], "idx_role_permissions_role_id");
    table.index(["permission_id"], "idx_role_permissions_permission_id");
  });

  // MySQL: auto-update updated_at on change
  await knex.raw(`
    ALTER TABLE role_permissions
    MODIFY updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("role_permissions");
}
