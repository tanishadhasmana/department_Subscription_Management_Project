import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("subscriptions", (table) => {
    table.increments("id").primary(); // Primary key

    table.string("subsc_name", 150).notNullable().unique(); // Unique subscription name
    table.decimal("subsc_price", 10, 2).notNullable();

    table
      .enum("subsc_type", ["Monthly", "Yearly", "Forever"])
      .notNullable()
      .defaultTo("Monthly");

    table
      .enum("subsc_currency", ["INR", "USD", "EUR", "GBP", "JPY", "AUD", "CAD"])
      .notNullable()
      .defaultTo("INR");

    table.date("renew_date").nullable();

    table.text("portal_detail", "longtext").nullable();

    table
      .enum("subsc_status", ["Active", "Inactive"])
      .notNullable()
      .defaultTo("Active");

    table.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
    table.timestamp("updated_at").nullable().defaultTo(null);
    table.timestamp("deleted_at").nullable().defaultTo(null);

    table
      .integer("department_id")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("departments")
      .onDelete("SET NULL");

    table
      .integer("updated_by")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    table
      .integer("deleted_by")
      .unsigned()
      .nullable()
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
  });

  // ✅ MySQL-specific: auto-update `updated_at` timestamp when record changes
  await knex.raw(`
    ALTER TABLE subscriptions 
    MODIFY updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("subscriptions");
}
