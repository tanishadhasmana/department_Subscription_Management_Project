// backend/src/controllers/currencyController.ts
import { Request, Response } from "express";
import { getAllRates } from "../services/currencyDbService";
import { fetchLatestRatesFromOXR } from "../services/currencyService";
import { upsertCurrencyRates } from "../services/currencyDbService";

export const getLatestRates = async (req: Request, res: Response) => {
  try {
    const rates = await getAllRates();
    // if DB empty, try to fetch directly (fallback)
    if (!rates || Object.keys(rates).length === 0) {
      try {
        const fetched = await fetchLatestRatesFromOXR();
        return res.status(200).json({ success: true, source: "remote", rates: fetched.rates, base: fetched.base });
      } catch (err) {
        // swallow and continue returning empty
      }
    }
    return res.status(200).json({ success: true, source: "db", rates, base: process.env.CURRENCY_BASE || "USD" });
  } catch (err: any) {
    console.error("getLatestRates error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to get rates" });
  }
};

export const updateCurrencyRatesController = async (req: Request, res: Response) => {
try {
const { rates } = await fetchLatestRatesFromOXR();
await upsertCurrencyRates(rates);

return res.status(200).json({
  success: true,
  message: "Currency rates updated successfully",
  count: Object.keys(rates).length,
});

} catch (err: any) {
return res.status(500).json({ success: false, message: err.message });
}
};