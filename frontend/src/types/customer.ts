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
