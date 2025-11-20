import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable("currency_rates", (table) => {
    table.increments("id").primary();

    table.string("currency_code", 10).notNullable().unique();

    table.decimal("exchange_rate", 14, 6).notNullable().defaultTo(1.0);

    table
      .timestamp("updated_at")
      .notNullable()
      .defaultTo(knex.fn.now());
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists("currency_rates");
}
