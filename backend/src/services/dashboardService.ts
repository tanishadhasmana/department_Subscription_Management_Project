// backend/src/services/dashboardService.ts
import db from "../connection";
import { convertToINR } from "../utils/currencyConverter";

interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  departments?: string[]; // string ids from frontend
  subscriptionType?: string;
  status?: string; // "active" | "inactive" etc
}

type DateRange = { start: string; end: string };

/**
 * Helper: default last N days range (inclusive)
 */
function lastNDaysRange(days = 30): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - (days - 1)); // inclusive
  return {
    start: start.toISOString().split("T")[0],
    end: end.toISOString().split("T")[0],
  };
}

/**
 * Helper: compute previous period with same length immediately before given range
 */
function previousPeriod(range: DateRange): DateRange {
  const start = new Date(range.start);
  const end = new Date(range.end);
  const diff = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1); // one ms before start
  const prevStart = new Date(prevEnd.getTime() - diff);
  return {
    start: prevStart.toISOString().split("T")[0],
    end: prevEnd.toISOString().split("T")[0],
  };
}

/**
 * Normalize a subscription record into monthly INR and one-time INR
 * - monthlyEquivalentINR: monthly normalized INR value (Monthly -> price ; Yearly -> price/12; Quarterly -> price/3)
 * - oneTimeINR: for Lifetime or one-time purchases (we include as-is)
 */
function normalizePriceToINR(price: number, currency: string | null, type: string | null) {
  const amountInINR = convertToINR(Number(price || 0), currency || "INR");

  let monthlyEquivalentINR = 0;
  let oneTimeINR = 0;

  const t = (type || "Monthly").toLowerCase();
  if (t === "monthly") {
    monthlyEquivalentINR = amountInINR;
  } else if (t === "yearly") {
    monthlyEquivalentINR = Number((amountInINR / 12).toFixed(2));
  } else if (t === "lifetime") {
    // treat as one-time charge
    oneTimeINR = amountInINR;
  } else {
    // fallback: treat as monthly
    monthlyEquivalentINR = amountInINR;
  }

  return { monthlyEquivalentINR, oneTimeINR, amountInINR };
}

/**
 * Build the query with common filters.
 * The `applyDate` flag controls whether to apply created_at date filters.
 * This allows KPI snapshot values (totalActive/totalSpend) to ignore date filter when desired.
 */
function applyCommonFilters(
  query: any,
  filters: DashboardFilters,
  dateRange?: DateRange,
  applyDate = true,
  dateColumn = "s.created_at"
) {
  let q = query.whereNull("s.deleted_at");

  // apply departments filter
  if (filters.departments && filters.departments.length > 0) {
    q = q.whereIn("s.department_id", filters.departments);
  }

  // subscription type
  if (filters.subscriptionType && filters.subscriptionType !== "all") {
    q = q.where("s.subsc_type", filters.subscriptionType);
  }

  // status: frontend sends "active" or "inactive" - db stores "Active"/"Inactive"
  if (filters.status && filters.status !== "all") {
    const statusVal = (filters.status.toLowerCase() === "active") ? "Active" : "Inactive";
    q = q.where("s.subsc_status", statusVal);
  }

  // apply date range if requested
  if (applyDate && dateRange) {
    if (dateRange.start) q = q.where(dateColumn, ">=", dateRange.start);
    if (dateRange.end) q = q.where(dateColumn, "<=", dateRange.end);
  }

  return q;
}

/**
 * Main exported function: returns all dashboard metrics in the format expected by frontend.
 */
export const getDashboardMetricsService = async (filters: DashboardFilters) => {
  // Determine date range
  let range: DateRange;
  let usingCustomDates = false;
  if (filters.startDate && filters.endDate) {
    range = { start: filters.startDate, end: filters.endDate };
    usingCustomDates = true;
  } else {
    // default last 30 days
    range = lastNDaysRange(30);
  }

  const prevRange = previousPeriod(range);

  /**
   * KPI 1: Total Active Subscriptions (snapshot)
   * - Important: to avoid the "0 when created_at older than 30 days" problem,
   *   we treat totalActive as a snapshot over the entire DB (except soft-deleted)
   *   but still honor department/type/status filters.
   *
   * - If frontend provides dates, we'll use the date filter for everything (including totalActive).
   * - If frontend provides no dates, totalActive is a snapshot (no created_at filter).
   */
  const applyDateToKPIs = usingCustomDates; // true only when user provided dates

  const totalActiveRow = await applyCommonFilters(
    db("subscriptions as s").where("s.subsc_status", "Active"),
    filters,
    range,
    applyDateToKPIs
  ).count("s.id as count");

  const totalActive = Number(totalActiveRow[0]?.count || 0);

  // Prev active for % calculation:
  let prevActive = 0;
  if (applyDateToKPIs) {
    const prevActiveRow = await applyCommonFilters(
      db("subscriptions as s").where("s.subsc_status", "Active"),
      filters,
      prevRange,
      true
    ).count("s.id as count");
    prevActive = Number(prevActiveRow[0]?.count || 0);
  } else {
    // when no custom date provided, compute prevActive using created_at windows (last 30 vs prev 30)
    const recentRow = await applyCommonFilters(
      db("subscriptions as s").where("s.subsc_status", "Active"),
      filters,
      range,
      true
    ).count("s.id as count");
    const prevRow = await applyCommonFilters(
      db("subscriptions as s").where("s.subsc_status", "Active"),
      filters,
      prevRange,
      true
    ).count("s.id as count");

    // we keep snapshot value as totalActive (full DB) but prevActive for percentage is prev window
    prevActive = Number(prevRow[0]?.count || 0);
    // Note: recentRow is number of created/active in recent window; not used for totalActive snapshot
  }

  // active percentage calculation --- total active is current active
  let activePercentage: number | null = null;
  if (prevActive > 0) {

    activePercentage = ((totalActive - prevActive) / prevActive) * 100;
  } else if (prevActive === 0 && totalActive > 0) {
    // no previous data -> mark as new increase
    activePercentage = 100;
  } else {
    activePercentage = 0;
  }

  /**
   * KPI 2: Total Spend (INR)
   * - For snapshot totalSpend: if user passed custom date range, compute spend in that window
   *   (using created_at / purchase_date semantics — we'll use created_at here).
   * - If user did not pass dates, totalSpend is computed as the sum of monthlyEquivalentINR
   *   for all subscriptions (snapshot). Prev spend for percentage uses last 30 days window.
   *
   * NOTE: 'totalSpend' here we define as sum of monthly equivalents + one-time charges.
   * If you want only recurring monthly MRR, we can expose separate MRR field later.
   */
  // Query subscriptions according to filters. We will fetch needed columns and compute INR in JS.
  const spendQuerySnapshot = applyCommonFilters(
    db("subscriptions as s"),
    filters,
    range,
    applyDateToKPIs // if custom dates -> apply date, else false (snapshot)
  ).select(
    "s.id",
    "s.subsc_price",
    "s.subsc_currency",
    "s.subsc_type",
    "s.created_at"
  );

  const subsSnapshot = await spendQuerySnapshot;

  let totalSpendINR = 0;
  subsSnapshot.forEach((s: any) => {
    const price = Number(s.subsc_price || 0);
    const currency = s.subsc_currency || "INR";
    const type = s.subsc_type || "Monthly";
    const { monthlyEquivalentINR, oneTimeINR } = normalizePriceToINR(price, currency, type);
    totalSpendINR += monthlyEquivalentINR + oneTimeINR;
  });

  // Prev spend:
  let prevSpendINR = 0;
  if (applyDateToKPIs) {
    // prevRange applies same filters + prev date range
    const prevSubs = await applyCommonFilters(db("subscriptions as s"), filters, prevRange, true).select(
      "s.subsc_price",
      "s.subsc_currency",
      "s.subsc_type"
    );
    prevSubs.forEach((s: any) => {
      const price = Number(s.subsc_price || 0);
      const currency = s.subsc_currency || "INR";
      const type = s.subsc_type || "Monthly";
      const { monthlyEquivalentINR, oneTimeINR } = normalizePriceToINR(price, currency, type);
      prevSpendINR += monthlyEquivalentINR + oneTimeINR;
    });
  } else {
    // when no custom dates, prevSpend uses prevRange (last 30 vs prev 30)
    const prevSubs = await applyCommonFilters(db("subscriptions as s"), filters, prevRange, true).select(
      "s.subsc_price",
      "s.subsc_currency",
      "s.subsc_type"
    );
    prevSubs.forEach((s: any) => {
      const price = Number(s.subsc_price || 0);
      const currency = s.subsc_currency || "INR";
      const type = s.subsc_type || "Monthly";
      const { monthlyEquivalentINR, oneTimeINR } = normalizePriceToINR(price, currency, type);
      prevSpendINR += monthlyEquivalentINR + oneTimeINR;
    });
  }

  let spendPercentage: number | null = null;
  if (prevSpendINR > 0) {
// if current more than previous loss, and if curent less than previous profit.
   spendPercentage = ((totalSpendINR - prevSpendINR) / prevSpendINR) * 100

  } else if (prevSpendINR === 0 && totalSpendINR > 0) {
    spendPercentage = 100;
  } else {
    spendPercentage = 0;
  }

  /**
   * KPI 3: Subscriptions Expiring Soon (next 30 days) - uses renew_date
   * Honor filters but always check renew_date window relative to today (or if custom date range provided, use that range)
   */
  const today = new Date();
  const next30 = new Date();
  next30.setDate(today.getDate() + 30);
  const expiringRange: DateRange = usingCustomDates ? range : { start: today.toISOString().split("T")[0], end: next30.toISOString().split("T")[0] };

  const expiringRow = await applyCommonFilters(
    db("subscriptions as s").where("s.subsc_status", "Active").whereNotNull("s.renew_date"),
    filters,
    expiringRange,
    true,
    "s.renew_date"
  ).count("s.id as count");

  const expiringCount = Number(expiringRow[0]?.count || 0);

  /**
   * KPI 4: Average Cost per Department
   * We'll compute dept totals (in INR) and counts and then compute average.
   */
  const deptRows = await applyCommonFilters(
    db("subscriptions as s").leftJoin("departments as d", "s.department_id", "d.id"),
    filters,
    applyDateToKPIs ? range : undefined,
    applyDateToKPIs
  )
    .select(
      "s.department_id",
      db.raw("COALESCE(d.deptName, 'N/A') as department_name"),
      "s.subsc_price",
      "s.subsc_currency",
      "s.subsc_type",
      db.raw("COUNT(s.id) OVER (PARTITION BY s.department_id) as dept_count") // window to simplify grouping approach
    )
    .groupBy("s.id", "s.department_id", "d.deptName", "s.subsc_price", "s.subsc_currency", "s.subsc_type");

  // Aggregate per department
  const deptMap: Record<string, { department_name: string; totalINR: number; count: number }> = {};
  for (const r of deptRows) {
    const deptId = String(r.department_id || "0");
    const deptName = r.department_name || "N/A";
    const price = Number(r.subsc_price || 0);
    const currency = r.subsc_currency || "INR";
    const type = r.subsc_type || "Monthly";
    const { monthlyEquivalentINR, oneTimeINR } = normalizePriceToINR(price, currency, type);
    const rowTotal = monthlyEquivalentINR + oneTimeINR;

    if (!deptMap[deptId]) {
      deptMap[deptId] = { department_name: deptName, totalINR: 0, count: 0 };
    }
    deptMap[deptId].totalINR += rowTotal;
    deptMap[deptId].count += 1;
  }

  // compute averageCost (if the frontend selected a single department, it will likely pass department filter)
  const deptEntries = Object.values(deptMap);
  let averageCostPerDepartment = 0;
  if (deptEntries.length === 1) {
    const d = deptEntries[0];
    averageCostPerDepartment = d.count > 0 ? d.totalINR / d.count : 0;
  } else {
    const totalDeptSpend = deptEntries.reduce((s, d) => s + d.totalINR, 0);
    const totalDeptSubs = deptEntries.reduce((s, d) => s + d.count, 0);
    averageCostPerDepartment = totalDeptSubs > 0 ? totalDeptSpend / totalDeptSubs : 0;
  }

  /**
   * Chart: Department-wise Spend Distribution (percentage of total)
   */
  const distribution = deptEntries.map((d) => ({
    department_name: d.department_name,
    total_spend: Number(d.totalINR.toFixed(2)),
    percentage: totalSpendINR > 0 ? Number(((d.totalINR / totalSpendINR) * 100).toFixed(2)) : 0,
  }));

  /**
   * Subscription Status Overview (department wise counts by status)
   */
  const statusRows = await applyCommonFilters(
    db("subscriptions as s").leftJoin("departments as d", "s.department_id", "d.id"),
    filters,
    applyDateToKPIs ? range : undefined,
    applyDateToKPIs
  )
    .select("s.department_id", db.raw("COALESCE(d.deptName,'N/A') as department_name"), "s.subsc_status", db.raw("COUNT(s.id) as count"))
    .groupBy("s.department_id", "d.deptName", "s.subsc_status");

  // Top 5 Most Expensive subscriptions (by INR price) - apply filters, then convert
  const topSubsRaw = await applyCommonFilters(db("subscriptions as s"), filters, applyDateToKPIs ? range : undefined, applyDateToKPIs)
    .select("s.subsc_name", "s.subsc_price", "s.subsc_currency", "s.subsc_type")
    .orderBy("s.subsc_price", "desc") // initial order, we'll re-sort after conversion
    .limit(50); // fetch some to handle conversion re-ordering

  const topSubsConverted = topSubsRaw.map((t: any) => {
    const price = Number(t.subsc_price || 0);
    const currency = t.subsc_currency || "INR";
    const { amountInINR } = normalizePriceToINR(price, currency, t.subsc_type);
    return {
      subsc_name: t.subsc_name,
      subsc_price_inr: Number(amountInINR.toFixed(2)),
    };
  });

  topSubsConverted.sort((a: any, b: any) => b.subsc_price_inr - a.subsc_price_inr);
  const topExpensive = topSubsConverted.slice(0, 5);

  /**
   * Upcoming renewals (next 60 days)
   */
  const next60 = new Date();
  next60.setDate(today.getDate() + 60);
  const renewRange = usingCustomDates ? range : { start: today.toISOString().split("T")[0], end: next60.toISOString().split("T")[0] };

  const upcomingRenewalsRaw = await applyCommonFilters(
    db("subscriptions as s").where("s.subsc_status", "Active").whereNotNull("s.renew_date"),
    filters,
    renewRange,
    true,
    "s.renew_date"
  )
    .select("s.renew_date", db.raw("COUNT(s.id) as count"))
    .groupBy("s.renew_date")
    .orderBy("s.renew_date", "asc");

  const upcomingRenewals = upcomingRenewalsRaw.map((r: any) => ({ date: r.renew_date, count: Number(r.count || 0) }));

  /**
   * Detailed recent subscriptions table (limit 5)
   */
  const detailedDataRaw = await applyCommonFilters(
    db("subscriptions as s").leftJoin("departments as d", "s.department_id", "d.id"),
    filters,
    applyDateToKPIs ? range : undefined,
    applyDateToKPIs
  )
    .select("s.id", "s.subsc_name", db.raw("COALESCE(d.deptName,'N/A') as department_name"), "s.renew_date", "s.subsc_status", "s.created_at")
    .orderBy("s.created_at", "desc")
    .limit(5);

  const detailedData = detailedDataRaw.map((d: any) => ({
    id: d.id,
    subsc_name: d.subsc_name,
    department_name: d.department_name || "N/A",
    renew_date: d.renew_date || d.created_at || null,
    subsc_status: d.subsc_status,
  }));

  // Prepare final payload
  return {
    kpis: {
      totalActiveSubscriptions: {
        value: totalActive,
        percentage: activePercentage !== null ? Number(activePercentage.toFixed(2)) : null,
        trend: activePercentage === null ? undefined : activePercentage > 0 ? "up" : activePercentage < 0 ? "down" : undefined,
      },
      totalSpend: {
        value: Number(totalSpendINR.toFixed(2)),
        percentage: spendPercentage !== null ? Number(spendPercentage.toFixed(2)) : null,
        trend: spendPercentage === null ? undefined : spendPercentage > 0 ? "up" : spendPercentage < 0 ? "down" : undefined,
      },
      subscriptionsExpiringSoon: {
        value: expiringCount,
      },
      averageCostPerDepartment: {
        value: Number(averageCostPerDepartment.toFixed(2)),
      },
    },
    charts: {
      departmentSpendDistribution: distribution,
      statusOverview: statusRows.map((s: any) => ({
        department_name: s.department_name || "N/A",
        status: s.subsc_status,
        count: Number(s.count || 0),
      })),
      topExpensive: topExpensive.map((t: any) => ({
        subsc_name: t.subsc_name,
        subsc_price: Number(t.subsc_price_inr || 0),
      })),
      upcomingRenewals,
    },
    detailedData,
  };
};






