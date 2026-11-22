export interface RFMRequest {
  recency: number;
  frequency: number;
  monetary: number;
}

export interface RFMResponse {
  cluster_id: number;
  segment_name: string;
  recency: number;
  frequency: number;
  monetary: number;
}

export type SalesChannel = 'Facebook Fanpage' | 'Shopee' | 'TikTok Shop' | 'Unknown/Other' | 'Website';
export type Region = 'Miền Bắc' | 'Miền Nam' | 'Miền Trung' | 'Chưa xác định';

export interface ChurnRequest {
  recency_days: number;
  tenure_days?: number;
  total_orders: number;
  orders_last_7d?: number | null;
  orders_last_30d?: number | null;
  completed_orders: number;
  returned_orders?: number;
  cancelled_orders?: number;
  monetary: number;
  ad_orders?: number;
  cod_orders?: number | null;
  num_categories?: number;
  num_sources?: number;
  processing_hours_mean?: number | null;
  orders_by_channel?: Partial<Record<SalesChannel, number>> | null;
  primary_channel?: SalesChannel;
  region?: Region;
}

/** Một yếu tố ảnh hưởng (SHAP) tới xác suất churn của khách này */
export interface ChurnFactor {
  feature: string;
  label: string;
  value: number;
  shap_value: number;
  effect: string;
}

export interface ChurnResponse {
  churn_probability: number;
  churn_probability_pct: number;
  churn_prediction: number;
  risk_level: 'High Risk' | 'Medium Risk' | 'Low Risk' | string;
  model_name: string;
  top_factors: ChurnFactor[];
}

export interface DSSRequest {
  customer_id?: string;
  rfm_segment: string;
  churn_risk: number;
  recency?: number;
  frequency?: number;
  monetary?: number;
}

export interface DSSResponse {
  customer_id: string;
  rfm_segment: string;
  churn_risk_pct: number;
  alert_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  warnings: string[];
  recommendations: string[];
  matched_rules?: string[];
}

export interface CustomerSummary {
  customer_id: string;
  recency: number;
  frequency: number;
  monetary: number;
  segment: string;
  churn_risk_pct: number;
  alert_level: string;
}

/* ---------------- /api/customers/high-risk ---------------- */
export type AlertLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface CustomerAction {
  action: string;
  note?: string | null;
  triggered_by: string;
  triggered_at: string;
  persisted: boolean;   // false = MongoDB offline, chỉ lưu tạm trong bộ nhớ server
}

export interface HighRiskCustomer {
  ref: string;          // mã tham chiếu mờ (không phải customer_id gốc)
  display_id: string;   // ID đã che, ví dụ KH_0908***444
  segment: string;
  churn_prob_pct: number;
  recency_days: number;
  frequency: number;
  monetary: number;
  channel: string;
  region: string;
  alert_level: AlertLevel;
  warnings: string[];
  recommendations: string[];
  matched_rules: string[];
  last_action: CustomerAction | null;
}

export interface HighRiskPage {
  total: number;
  page: number;
  page_size: number;
  items: HighRiskCustomer[];
  alert_counts: Record<AlertLevel, number>;
  population: number;
  facets: { segments: string[]; channels: string[]; regions: string[] };
  data_note: string;
}

export interface HighRiskQuery {
  alert_level: AlertLevel[];
  segment?: string;
  channel?: string;
  region?: string;
  page: number;
  page_size: number;
}
