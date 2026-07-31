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

export interface ChurnRequest {
  recency: number;
  frequency: number;
  monetary: number;
  support_tickets: number;
  app_logins_last_month: number;
  days_since_last_support: number;
}

export interface ChurnResponse {
  churn_probability: number;
  churn_probability_pct: number;
  churn_prediction: number;
  risk_level: 'High Risk' | 'Medium Risk' | 'Low Risk' | string;
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
  alert_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' | string;
  warnings: string[];
  recommendations: string[];
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
