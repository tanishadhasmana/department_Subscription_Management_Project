// backend/src/services/currencyService.ts
import fetch from "node-fetch"; 

const OXR_BASE = process.env.CURRENCY_BASE || "USD";
const OXR_APP_ID = process.env.OPENEXCHANGE_APP_ID;

if (!OXR_APP_ID) {
  console.warn("OPENEXCHANGE_APP_ID not set - currencyService will fail if used.");
}


// that fetchLatestRatesFromOXR(), calls https://openexchangerates.org/api/latest.json?app_id=XXXX&base=USD  and returns the rates in JSON format, then to save rates to db, currencyDbService.ts this with fucn upsertCurrencyRates().

export type CurrencyFetchResult = {
  base: string;
  timestamp: number;
  rates: Record<string, number>;
};

export async function fetchLatestRatesFromOXR(): Promise<CurrencyFetchResult> {
  if (!OXR_APP_ID) throw new Error("OPENEXCHANGE_APP_ID not configured");

  const url = `https://openexchangerates.org/api/latest.json?app_id=${OXR_APP_ID}&base=${OXR_BASE}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch OXR: ${res.status} ${txt}`);
  }
  const body = (await res.json()) as any;

  return {
    base: body.base || OXR_BASE,
    timestamp: body.timestamp || Date.now() / 1000,
    rates: body.rates || {},
  };
}
