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
