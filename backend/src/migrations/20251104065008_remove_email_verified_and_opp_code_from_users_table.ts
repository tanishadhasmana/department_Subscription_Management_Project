// removed opp code, and email verified col
import { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.dropColumn("email_verified");
    table.dropColumn("opp_code");
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable("users", (table) => {
    table.enu("email_verified", ["Yes", "No"]).defaultTo("No");
    table.tinyint("opp_code").nullable();
  });
}
