// backend/src/services/dashboardService.ts
import db from "../connection";

// defining the filter interface, to make the filter object
interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  departments?: string[];
  subscriptionType?: string;
  status?: string;
}
// then destructure those
export const getDashboardMetricsService = async (filters: DashboardFilters) => {
  const { startDate, endDate, departments, subscriptionType, status } = filters;
  // Build base query with filters
  const buildQuery = (query: any) => {
    // ensure not deleted, means exclude the soft deleted records
    let q = query.whereNull("s.deleted_at");
// when user select the start date, return only those subscriptions created on or after that date 
    if (startDate) {
      q = q.where("s.created_at", ">=", startDate);
    }
    // If the user selected an end date, return only those subscriptions created on or before that date.
    if (endDate) {
      q = q.where("s.created_at", "<=", endDate);
    }
    // If the user selected specific departments, filter subscriptions to include only those belonging to the selected departments by IDs then in SQL WHERE department_id IN (1,2,3) etc
    if (departments && departments.length > 0) {
      q = q.whereIn("s.department_id", departments);
    }
    // filtering by subscription type and the status type, as user selected
    if (subscriptionType && subscriptionType !== "all") {
      q = q.where("s.subsc_type", subscriptionType);
    }
    if (status && status !== "all") {
      q = q.where("s.subsc_status", status === "active" ? "Active" : "Inactive");
    }

    return q;
  };

  // Calculate date range for comparison (previous period)
  const calculatePreviousPeriod = () => {
    if (!startDate || !endDate) return null;
// current period duration
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = end.getTime() - start.getTime();
// previous period end date is one day before current period start date
    const prevEnd = new Date(start.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - diff);

    return {
      prevStart: prevStart.toISOString().split("T")[0],
      prevEnd: prevEnd.toISOString().split("T")[0],
    };
  };

  const prevPeriod = calculatePreviousPeriod();

  // 1. Total Active Subscriptions in numbers
  const activeSubsCount = await buildQuery(
    db("subscriptions as s").where("s.subsc_status", "Active")
  ).count("s.id as count");
  const totalActive = Number(activeSubsCount[0]?.count || 0);

  // Previous period active count
  let prevActiveCount = 0;
  if (prevPeriod) {
    const prevActive = await db("subscriptions as s")
      .whereNull("s.deleted_at")
      .where("s.subsc_status", "Active")
      .where("s.created_at", ">=", prevPeriod.prevStart)
      .where("s.created_at", "<=", prevPeriod.prevEnd)
      .count("s.id as count");
    prevActiveCount = Number(prevActive[0]?.count || 0);
  }
// (current - previous) / previous * 100
  const activePercentage = prevActiveCount > 0
    ? ((totalActive - prevActiveCount) / prevActiveCount) * 100
    : 0;

  // 2. Total Monthly/Annual Spend
  const spendQuery = buildQuery(db("subscriptions as s"));
  const subscriptions = await spendQuery.select("s.subsc_price", "s.subsc_type");

  let totalSpend = 0;
  subscriptions.forEach((sub: any) => {
    const price = Number(sub.subsc_price || 0);
    if (sub.subsc_type === "Monthly") {
      totalSpend += price * 12; // Annualize monthly
    } else if (sub.subsc_type === "Yearly") {
      totalSpend += price;
    }
    // Lifetime subscriptions are one-time, so add as-is
    else if (sub.subsc_type === "Lifetime") {
      totalSpend += price;
    }
  });

  // Previous period spend
  let prevSpend = 0;
  if (prevPeriod) {
    const prevSubs = await db("subscriptions as s")
      .whereNull("s.deleted_at")
      .where("s.created_at", ">=", prevPeriod.prevStart)
      .where("s.created_at", "<=", prevPeriod.prevEnd)
      .select("s.subsc_price", "s.subsc_type");

    prevSubs.forEach((sub: any) => {
      const price = Number(sub.subsc_price || 0);
      if (sub.subsc_type === "Monthly") {
        prevSpend += price * 12;
      } else if (sub.subsc_type === "Yearly") {
        prevSpend += price;
      } else if (sub.subsc_type === "Lifetime") {
        prevSpend += price;
      }
    });
  }

  const spendPercentage = prevSpend > 0
    ? ((totalSpend - prevSpend) / prevSpend) * 100
    : 0;

  // 3. Subscriptions Expiring Soon (Next 30 Days)
  const today = new Date();
  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);

  const expiringSoon = await buildQuery(
    db("subscriptions as s")
      .where("s.subsc_status", "Active")
      .whereNotNull("s.renew_date")
  )
    .whereBetween("s.renew_date", [
      today.toISOString().split("T")[0],
      next30Days.toISOString().split("T")[0],
    ])
    .count("s.id as count");

  const expiringCount = Number(expiringSoon[0]?.count || 0);

  // 4. Average Cost per Department
  const deptSpend = await buildQuery(
    db("subscriptions as s")
      .leftJoin("departments as d", "s.department_id", "d.id")
  ).select(
    "s.department_id",
    "d.deptName as department_name",
    db.raw("SUM(s.subsc_price) as total_spend"),
    db.raw("COUNT(s.id) as sub_count")
  )
    .groupBy("s.department_id", "d.deptName");

  let averageCost = 0;
  if (departments && departments.length === 1) {
    // Single department selected
    const dept = deptSpend.find((d: any) => String(d.department_id) === departments[0]);
    averageCost = dept ? Number(dept.total_spend) / Number(dept.sub_count) : 0;
  } else {
    // Multiple departments or all departments
    const totalDeptSpend = deptSpend.reduce((sum: number, d: any) => sum + Number(d.total_spend || 0), 0);
    const totalSubs = deptSpend.reduce((sum: number, d: any) => sum + Number(d.sub_count || 0), 0);
    averageCost = totalSubs > 0 ? totalDeptSpend / totalSubs : 0;
  }

  // 5. Department-wise Spend Distribution
  const distribution = deptSpend.map((d: any) => ({
    department_name: d.department_name || "N/A",
    total_spend: Number(d.total_spend || 0),
    percentage: totalSpend > 0 ? (Number(d.total_spend || 0) / totalSpend) * 100 : 0,
  }));

  // 6. Subscription Status Overview (Active vs Inactive)
  const statusOverview = await buildQuery(
    db("subscriptions as s")
      .leftJoin("departments as d", "s.department_id", "d.id")
  )
    .select(
      "s.department_id",
      "d.deptName as department_name",
      "s.subsc_status",
      db.raw("COUNT(s.id) as count")
    )
    .groupBy("s.department_id", "d.deptName", "s.subsc_status");

  // 7. Top 5 Most Expensive Subscriptions
  const topExpensive = await buildQuery(
    db("subscriptions as s")
  )
    .select("s.subsc_name", "s.subsc_price", "s.subsc_currency")
    .orderBy("s.subsc_price", "desc")
    .limit(5);

  // 8. Upcoming Renewals (Next 60 Days) - grouped data for chart
  const next60Days = new Date(today);
  next60Days.setDate(today.getDate() + 60);

  const upcomingRenewals = await buildQuery(
    db("subscriptions as s")
      .where("s.subsc_status", "Active")
      .whereNotNull("s.renew_date")
  )
    .whereBetween("s.renew_date", [
      today.toISOString().split("T")[0],
      next60Days.toISOString().split("T")[0],
    ])
    .select("s.renew_date", "s.subsc_name", "s.subsc_price")
    .orderBy("s.renew_date", "asc");

  // Group by date for chart
  const renewalsByDate: { [key: string]: number } = {};
  upcomingRenewals.forEach((r: any) => {
    const date = r.renew_date;
    if (!renewalsByDate[date]) {
      renewalsByDate[date] = 0;
    }
    renewalsByDate[date]++;
  });

  // 9. Detailed Data Table (limited to 5 rows for dashboard preview)
  const detailedData = await buildQuery(
    db("subscriptions as s")
      .leftJoin("departments as d", "s.department_id", "d.id")
  )
    .select(
      "s.id",
      "s.subsc_name",
      "d.deptName as department_name",
      "s.renew_date",
      "s.subsc_status"
    )
    .orderBy("s.created_at", "desc")
    .limit(5);

  return {
    kpis: {
      totalActiveSubscriptions: {
        value: totalActive,
        percentage: Number(activePercentage.toFixed(2)),
        trend: activePercentage >= 0 ? "up" : "down",
      },
      totalSpend: {
        value: Number(totalSpend.toFixed(2)),
        percentage: Number(spendPercentage.toFixed(2)),
        trend: spendPercentage >= 0 ? "up" : "down",
      },
      subscriptionsExpiringSoon: {
        value: expiringCount,
      },
      averageCostPerDepartment: {
        value: Number(averageCost.toFixed(2)),
      },
    },
    charts: {
      departmentSpendDistribution: distribution,
      statusOverview: statusOverview.map((s: any) => ({
        department_name: s.department_name || "N/A",
        status: s.subsc_status,
        count: Number(s.count || 0),
      })),
      topExpensive: topExpensive.map((t: any) => ({
        subsc_name: t.subsc_name,
        subsc_price: Number(t.subsc_price || 0),
        subsc_currency: t.subsc_currency,
      })),
      upcomingRenewals: Object.entries(renewalsByDate).map(([date, count]) => ({
        date,
        count,
      })),
    },
    detailedData: detailedData.map((d: any) => ({
      id: d.id,
      subsc_name: d.subsc_name,
      department_name: d.department_name || "N/A",
      renew_date: d.renew_date || "-",
      subsc_status: d.subsc_status,
    })),
  };
};

