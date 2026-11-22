export interface ModelTestMetrics {
  accuracy: number;
  balanced_accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  retained_precision: number;
  retained_recall: number;
  retained_f1: number;
  retained_pr_auc: number;
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number };
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface ChurnModelResult {
  model: string;
  best_params: Record<string, string | number | null>;
  cv_roc_auc_mean: number;
  cv_roc_auc_std: number;
  test: ModelTestMetrics;
  feature_importance: FeatureImportance[];
  train_seconds: number;
}

export interface RFMSegmentProfile {
  cluster_id: number;
  segment: string;
  customers: number;
  share: number;
  composite_score: number;
  mean_recency_days: number;
  mean_frequency: number;
  mean_monetary_vnd: number;
}

export interface ModelMetrics {
  generated_at: string;
  data_source: string;
  churn: {
    target_definition: string;
    observation_window: { start: string; cutoff: string };
    outcome_window: { start: string; end: string; days: number };
    n_train: number;
    n_test: number;
    churn_rate_train: number;
    churn_rate_test: number;
    majority_baseline_accuracy_test: number;
    selection_criterion: string;
    decision_threshold: number;
    best_model: string;
    best_model_test: ModelTestMetrics;
    best_model_feature_importance: FeatureImportance[];
    risk_thresholds: { high: number; medium: number };
    test_risk_distribution: Record<string, number>;
    models: ChurnModelResult[];
  };
  rfm: {
    n_customers: number;
    k: number;
    labeling_rule: string;
    elbow: { k: number; sse: number }[];
    silhouette: { k: number; silhouette: number }[];
    segments: RFMSegmentProfile[];
  };
}

/* ---------------- /api/analytics/overview (backend/ml/analytics.py) ---------------- */
export interface DistributionRow {
  name: string;
  orders: number;
  customers: number;
  order_share: number;
  revenue_vnd: number;
  return_rate: number | null;
  cancel_rate: number | null;
}

export interface ChurnGroupRow {
  name: string;
  customers: number;
  churn_rate: number | null;   // null khi nhóm < min_group_size_for_rates
}

export interface AnalyticsOverview {
  period: { start: string; end: string };
  totals: { orders: number; customers: number; revenue_vnd: number; omnichannel_customers: number };
  channel_distribution: DistributionRow[];
  region_distribution: DistributionRow[];
  monthly_orders_by_channel: Array<{ month: string; total: number } & Record<string, number | string>>;
  churn: {
    definition: string;
    cutoff: string;
    population: number;
    overall_rate: number;
    by_channel: ChurnGroupRow[];
    by_region: ChurnGroupRow[];
    weekly_trend: { cutoff: string; active_customers: number; churn_rate: number | null }[];
  };
  min_group_size_for_rates: number;
  prediction: {
    model: string;
    test_customers: number;
    risk_distribution: { High: number; Medium: number; Low: number };
    probability_histogram: { from: number; to: number; count: number }[];
  };
  feature_importance: { feature: string; label: string; importance: number; direction: string }[];
}
