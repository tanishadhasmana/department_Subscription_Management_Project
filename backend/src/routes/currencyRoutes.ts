// backend/src/routes/currencyRoutes.ts
import express from "express";
import { getLatestRates, updateCurrencyRatesController } from "../controllers/currencyController";

const router = express.Router();

// public route; you can add protect/permissions later if required
router.get("/latest", getLatestRates);
// GET – force fetch live from API & update DB
router.get("/update", updateCurrencyRatesController);

export default router;
