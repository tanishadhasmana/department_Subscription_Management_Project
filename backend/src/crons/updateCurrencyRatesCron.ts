// backend/src/crons/updateCurrencyRatesCron.ts
import cron from "node-cron";
import { fetchLatestRatesFromOXR } from "../services/currencyService";
import { upsertCurrencyRates } from "../services/currencyDbService";

const CRON_EXPR = process.env.CURRENCY_UPDATE_CRON || "0 0 * * *"; // 12 AM IST

// The actual update function (reusable)
export async function executeCurrencyUpdate() {
  const now = new Date();
  console.log(`[cron] ⏰ Starting currency update job at ${now.toISOString()}`);
  
  try {
    const { rates } = await fetchLatestRatesFromOXR();
    
    if (!rates || Object.keys(rates).length === 0) {
      console.warn("[cron] ⚠️  No rates returned from API");
      return { success: false, count: 0, message: "No rates returned" };
    }
    
    await upsertCurrencyRates(rates);
    
    const count = Object.keys(rates).length;
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    console.log(`[cron]  Currency rates updated: ${count} entries at ${timestamp} IST`);
    
    return { success: true, count, message: "Updated successfully" };
    
  } catch (err: any) {
    console.error("[cron] ❌ Currency update failed:", {
      message: err?.message ?? err,
      code: err?.code,
      status: err?.status,
      timestamp: new Date().toISOString(),
    });
    return { success: false, count: 0, message: err?.message ?? "Unknown error" };
  }
}

export function startCurrencyUpdateCron() {
  console.log(`[cron] 🪙 Currency update cron configured: ${CRON_EXPR}`);
  console.log(`[cron] ⏱️  Timezone: Asia/Kolkata`);
  
  // Schedule the cron job
  const task = cron.schedule(CRON_EXPR, executeCurrencyUpdate, {
    timezone: "Asia/Kolkata",
  });

  task.start();
  
  // Log next execution time
  const nextRun = new Date();
  nextRun.setDate(nextRun.getDate() + 1);
  nextRun.setHours(0, 0, 0, 0);
  const timeUntil = Math.round((nextRun.getTime() - new Date().getTime()) / 1000 / 60);
  console.log(`[cron] ⏱️=  Next currency update in ${timeUntil} minutes (${nextRun.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST)`);

  return task;
}

