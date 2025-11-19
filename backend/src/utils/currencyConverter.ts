export const currencyRatesToINR: Record<string, number> = {
  INR: 1,
  USD: 88.59,
  EUR: 102.55,
  GBP: 116.33,
  AUD: 57.42,
  JPY: 0.57,
  CAD: 63.27, // Canadian Dollar → INR
  SGD: 67.97, // Singapore Dollar → INR
  CHF: 110.67, // Swiss Franc → INR
};

export function convertToINR(amount: number, currency?: string): number {
  if (!amount) return 0;
  const cur = (currency || "INR").toUpperCase();
  const rate = currencyRatesToINR[cur] ?? 1; // fallback to 1 if unknown
  return Number((amount * rate).toFixed(2));
}
