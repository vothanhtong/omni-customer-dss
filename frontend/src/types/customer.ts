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
  total_orders: number;
  completed_orders: number;
  monetary: number;
  returned_orders?: number;
  cancelled_orders?: number;
  ad_orders?: number;
  processing_hours_mean?: number | null;
  num_channels?: number;
  tenure_days?: number;
  primary_channel?: SalesChannel;
  region?: Region;
}

export interface ChurnResponse {
  churn_probability: number;
  churn_probability_pct: number;
  churn_prediction: number;
  risk_level: 'High Risk' | 'Medium Risk' | 'Low Risk' | string;
  model_name: string;
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
