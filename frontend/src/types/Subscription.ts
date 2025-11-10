export type SubscriptionStatus = "active" | "inactive";

export interface Subscription {
  id: number;
  subsc_name: string;
  subsc_type: string;
  subsc_price: number;
  subsc_currency: string;
  renew_date?: string;
  purchase_date: string;
  portal_detail?: string;
  subsc_status: "active" | "inactive";
  department_id?: number;
  payment_method: string;
  department_name?: string; // Filled dynamically from join
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  updated_by?: number;
  deleted_by?: number;
}
