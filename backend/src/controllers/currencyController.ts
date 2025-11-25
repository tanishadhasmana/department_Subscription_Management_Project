// backend/src/controllers/currencyController.ts
import { Request, Response } from "express";
import { getAllRates } from "../services/currencyDbService";
import { fetchLatestRatesFromOXR } from "../services/currencyService";
import { executeCurrencyUpdate } from "../crons/updateCurrencyRatesCron";

export const getLatestRates = async (req: Request, res: Response) => {
  try {
    const rates = await getAllRates();
    
    // if DB empty, try to fetch directly 
    if (!rates || Object.keys(rates).length === 0) {
      try {
        const fetched = await fetchLatestRatesFromOXR();
        return res.status(200).json({ 
          success: true, 
          source: "remote", 
          rates: fetched.rates, 
          base: fetched.base,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Failed to fetch from API" });
      }
    }
    
    return res.status(200).json({ 
      success: true, 
      source: "db", 
      rates, 
      base: process.env.CURRENCY_BASE || "USD",
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("getLatestRates error:", err);
    return res.status(500).json({ success: false, message: err.message || "Failed to get rates" });
  }
};

export const updateCurrencyRatesController = async (req: Request, res: Response) => {
  try {
    console.log("[API] Manual currency update triggered");
    const result = await executeCurrencyUpdate();
    
    return res.status(200).json({
      success: result.success,
      message: result.message,
      count: result.count,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    return res.status(500).json({ 
      success: false, 
      message: err.message || "Failed to update currency rates" 
    });
  }
};





