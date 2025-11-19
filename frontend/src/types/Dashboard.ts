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
  percentage?: number | null; 
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
  // instead of dept name, total spend, percentage we can have other values of type string, number, so now with dept name:'HR', total_spend: 5000, percentage: 25, we can have other dynamic keys too like jan :1000 etc
  [key: string]: string | number;
}

export interface StatusOverviewSource {
  department_name: string;
  status: string; 
  count: number;
}

export type AggregatedStatus = {
  department_name: string;
  // instead of status we can have any other name, but work is same as above key,like to hold dynamic values, like suppose we have active: 10, inactive:5 etc pending:2 etc
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
