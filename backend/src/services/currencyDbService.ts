// backend/src/services/currencyDbService.ts
import db from "../connection"; 

export async function upsertCurrencyRates(rates: Record<string, number>) {
  // converting obj into array
  const entries = Object.entries(rates); // [ [code, rate], ... ], if no entries stop
  if (entries.length === 0) return;
// transaction is used to run grp of operations together, if all succeed commit, else rollback, and trx is transaction obj, either can be use anything
  await db.transaction(async (trx) => {
    for (const [currency_code, exchange_rate] of entries) {
      await trx("currency_rates")
        .insert({
          currency_code: currency_code.toUpperCase(),
          exchange_rate: Number(exchange_rate),
          updated_at: trx.fn.now(),
        })
        // if same curreny code already exist, then update that instead of inserting 
        .onConflict("currency_code")
        .merge({
          exchange_rate: Number(exchange_rate),
          updated_at: trx.fn.now(),
        });
    }
  });
}

export async function getLatestRate(currencyCode: string) {
  const row = await db("currency_rates")
    .select("exchange_rate")
    .where("currency_code", currencyCode.toUpperCase())
    .first();
  return row ? Number(row.exchange_rate) : null;
}

export async function getAllRates() {
  const rows = await db("currency_rates").select("currency_code", "exchange_rate", "updated_at");
  const out: Record<string, number> = {};
  rows.forEach((r: any) => {
    out[r.currency_code] = Number(r.exchange_rate);
  });
  return out;
}
