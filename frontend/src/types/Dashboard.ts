// types/Dashboard.ts
export interface Department {
  id: number;
  department_name: string;
}

export interface Option {
  value: string;
  label: string;
}

export interface KPIItem {
  value: number;
  percentage?: number; 
  trend?: "up" | "down";
}

/* KPIs container */
export interface KPIs {
  totalActiveSubscriptions: KPIItem;
  totalSpend: KPIItem;
  subscriptionsExpiringSoon: { value: number };  
  averageCostPerDepartment?: KPIItem;
}


export interface DeptSpendItem {
  department_name: string;
  total_spend: number;
  percentage: number;
}

export interface StatusOverviewSource {
  department_name: string;
  status: string; 
  count: number;
}

export type AggregatedStatus = {
  department_name: string;
  [status: string]: number | string; 
};

export interface TopExpensiveItem {
  subsc_name: string;
  subsc_price: number;
}

export interface UpcomingRenewalItem {
  date: string; // ISO or formatted date string
  count: number;
}

export interface DetailedRow {
  id: number;
  subsc_name: string;
  department_name: string;
  renew_date: string;
  subsc_status: string;
}


export interface DashboardMetrics {
  kpis: KPIs;
  charts: {
    departmentSpendDistribution: DeptSpendItem[];
    statusOverview: StatusOverviewSource[];
    topExpensive: TopExpensiveItem[];
    upcomingRenewals: UpcomingRenewalItem[];
  };
  detailedData: DetailedRow[];
}
