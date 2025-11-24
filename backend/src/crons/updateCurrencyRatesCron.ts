// backend/src/crons/updateCurrencyRatesCron.ts
import cron from "node-cron";
import { fetchLatestRatesFromOXR } from "../services/currencyService";
import { upsertCurrencyRates } from "../services/currencyDbService";

const CRON_EXPR = process.env.CURRENCY_UPDATE_CRON || "0 3 * * *";

export function startCurrencyUpdateCron() {
  console.log(`[cron] currency update cron configured: ${CRON_EXPR}`);
  const task = cron.schedule(CRON_EXPR, async () => {
    console.log("[cron] Starting currency update job...");
    try {
      const { rates } = await fetchLatestRatesFromOXR();
      await upsertCurrencyRates(rates);
      console.log("[cron] Currency rates updated:", Object.keys(rates).length, "entries");
    } catch (err: any) {
      console.error("[cron] Currency update failed:", err?.message ?? err);
    }
  });

  (task as any).runNow = async () => {
    console.log("[cron] Running currency update (manual run)...");
    try {
        // fetch(from currencyService.ts) and then 
      const { rates } = await fetchLatestRatesFromOXR();
    //   store in DB then 
      await upsertCurrencyRates(rates);
    //   logs that sucess message in console
      console.log("[cron] Manual currency update completed.");
    } catch (err: any) {
      console.error("[cron] Manual currency update failed:", err?.message ?? err);
    }
  };

  task.start();
  return task;
}
