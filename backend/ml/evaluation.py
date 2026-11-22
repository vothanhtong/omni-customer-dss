"""Chỉ số đánh giá phân loại churn (dùng chung cho baseline & mô hình nâng cao)."""

from typing import Optional

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)


def r(x, n: int = 4) -> Optional[float]:
    if x is None:
        return None
    x = float(x)
    return None if np.isnan(x) else round(x, n)


def evaluate(y_true: pd.Series, proba: np.ndarray, threshold: float = 0.5) -> dict:
    """Chỉ số cho lớp churn (target=1) và lớp thiểu số 'khách quay lại' (target=0)."""
    y_true = np.asarray(y_true).astype(int)
    pred = (proba >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, pred, labels=[0, 1]).ravel()
    return {
        "accuracy": r(accuracy_score(y_true, pred)),
        "balanced_accuracy": r(balanced_accuracy_score(y_true, pred)),
        "precision": r(precision_score(y_true, pred, zero_division=0)),
        "recall": r(recall_score(y_true, pred, zero_division=0)),
        "f1_score": r(f1_score(y_true, pred, zero_division=0)),
        "roc_auc": r(roc_auc_score(y_true, proba)),
        "retained_precision": r(precision_score(y_true, pred, pos_label=0, zero_division=0)),
        "retained_recall": r(recall_score(y_true, pred, pos_label=0, zero_division=0)),
        "retained_f1": r(f1_score(y_true, pred, pos_label=0, zero_division=0)),
        "retained_pr_auc": r(average_precision_score(1 - y_true, 1 - proba)),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }


def native_importance(model, features) -> list:
    """Feature importance gốc của mô hình (impurity / gain / |coef|), chuẩn hóa tổng = 1."""
    if hasattr(model, "feature_importances_"):
        values = np.asarray(model.feature_importances_, dtype=float)
    elif hasattr(model, "coef_"):
        values = np.abs(np.asarray(model.coef_, dtype=float)).ravel()
    else:
        return []
    total = values.sum() or 1.0
    ranked = sorted(zip(features, values / total), key=lambda t: -t[1])
    return [{"feature": f, "importance": r(v)} for f, v in ranked]
