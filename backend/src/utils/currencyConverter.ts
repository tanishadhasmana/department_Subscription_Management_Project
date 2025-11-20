
import { getLatestRate } from "../services/currencyDbService";

export async function convertToINR(amount: number, currency?: string): Promise<number> {
if (!amount) return 0;

const cur = (currency || "INR").toUpperCase();

try {
const dbRate = await getLatestRate(cur);
const rate = dbRate ?? 1;
return Number((amount * rate).toFixed(2));
} catch (err) {
// if DB lookup fails, use amount as-is
return Number(amount.toFixed(2));
}
}





