"""
Giải thích mô hình bằng SHAP (TreeExplainer) cho RandomForest / XGBoost.
  - global_shap_importance: mức độ quan trọng toàn cục (mean |SHAP|) + chiều tác động.
  - explain_rows: lý do chính cho từng dự đoán (dùng trong API /api/churn/predict).
SHAP value > 0  => đẩy xác suất CHURN lên; < 0 => kéo xuống.
"""

from typing import Dict, List

import numpy as np
import pandas as pd

from backend.ml.feature_engineering import FEATURE_LABELS

LOG_FEATURES = {"monetary_log", "avg_order_value_log"}


def make_explainer(model):
    import shap  # import muộn: chỉ cần khi giải thích

    return shap.TreeExplainer(model)


def shap_matrix(explainer, X: pd.DataFrame) -> np.ndarray:
    """Ma trận SHAP (n_samples, n_features) cho lớp churn (=1), chuẩn hóa mọi định dạng đầu ra của shap."""
    values = explainer.shap_values(X)
    if isinstance(values, list):  # shap cũ: list theo lớp
        values = values[1]
    values = np.asarray(values)
    if values.ndim == 3:  # (n, f, n_classes)
        values = values[:, :, 1]
    return values


def global_shap_importance(explainer, X: pd.DataFrame) -> List[Dict]:
    sv = shap_matrix(explainer, X)
    mean_abs = np.abs(sv).mean(axis=0)
    total = mean_abs.sum() or 1.0
    out = []
    for j, feat in enumerate(X.columns):
        x = X[feat].to_numpy(dtype=float)
        # chiều tác động: tương quan hạng giữa giá trị đặc trưng và SHAP
        if np.std(x) > 0 and np.std(sv[:, j]) > 0:
            corr = float(pd.Series(x).corr(pd.Series(sv[:, j]), method="spearman"))
        else:
            corr = 0.0
        out.append({
            "feature": feat,
            "label": FEATURE_LABELS.get(feat, feat),
            "importance": round(float(mean_abs[j] / total), 4),
            "mean_abs_shap": round(float(mean_abs[j]), 5),
            "direction": "tăng rủi ro" if corr > 0.1 else ("giảm rủi ro" if corr < -0.1 else "không đơn điệu"),
            "value_shap_corr": round(corr, 3),
        })
    return sorted(out, key=lambda d: -d["importance"])


def display_value(feature: str, value: float) -> float:
    return float(np.expm1(value)) if feature in LOG_FEATURES else float(value)


def explain_rows(explainer, X: pd.DataFrame, top_k: int = 5) -> List[List[Dict]]:
    sv = shap_matrix(explainer, X)
    results = []
    for i in range(len(X)):
        order = np.argsort(-np.abs(sv[i]))[:top_k]
        factors = []
        for j in order:
            feat = X.columns[j]
            val = float(sv[i, j])
            factors.append({
                "feature": feat,
                "label": FEATURE_LABELS.get(feat, feat),
                "value": round(display_value(feat, float(X.iloc[i, j])), 4),
                "shap_value": round(val, 5),
                "effect": "tăng rủi ro rời bỏ" if val > 0 else "giảm rủi ro rời bỏ",
            })
        results.append(factors)
    return results
