// backend/src/services/currencyDbService.ts
import db from "../connection"; 

export async function upsertCurrencyRates(rates: Record<string, number>) {
  const entries = Object.entries(rates); // [ [code, rate], ... ]
  if (entries.length === 0) return;

  await db.transaction(async (trx) => {
    for (const [currency_code, exchange_rate] of entries) {
      // Using MySQL-style upsert
      await trx("currency_rates")
        .insert({
          currency_code: currency_code.toUpperCase(),
          exchange_rate: Number(exchange_rate),
          updated_at: trx.fn.now(),
        })
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
