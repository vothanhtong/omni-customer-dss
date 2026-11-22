"""
Huấn luyện Mô hình Nâng cao: Random Forest & XGBoost (thư viện xgboost thật) + giải thích SHAP.

- Đặc trưng: backend/ml/feature_engineering.py (point-in-time, không rò rỉ nhãn).
- Mất cân bằng nhãn (~96% churn): cố định cân bằng lớp
    XGBoost: scale_pos_weight = n_neg / n_pos ; Random Forest: class_weight = "balanced_subsample".
  (Thực nghiệm: bỏ cân bằng chỉ tăng CV ROC-AUC ~0.005 — nhỏ hơn 1/4 độ lệch chuẩn — nhưng mô hình
   dự đoán 100% "churn" ở ngưỡng 0.5, Balanced Accuracy = 0.5 và DSS mất khả năng phân tầng.
   Kết quả đối chứng không cân bằng được ghi trong model_metrics.json -> imbalance_ablation.)
- Tuning: GridSearchCV 5-fold (StratifiedKFold) trên TẬP TRAIN, tiêu chí ROC-AUC.
    XGBoost: n_estimators, max_depth, learning_rate, min_child_weight.
    Random Forest: max_depth, min_samples_leaf, max_features.
- Chọn mô hình theo CV ROC-AUC (không nhìn tập test), báo cáo trên tập test out-of-time.
- SHAP TreeExplainer: mức quan trọng toàn cục + chiều tác động của từng đặc trưng.
- Lưu: saved_models/churn_model.pkl, churn_features.pkl và cập nhật model_metrics.json.

Chạy riêng:  python backend/ml/train_advanced.py
(Toàn bộ pipeline gồm baseline + RFM + BI: python backend/train_pipeline.py)
"""

import json
import os
import sys
import time
from datetime import datetime, timezone
from typing import Dict, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.base import clone
from sklearn.model_selection import GridSearchCV, StratifiedKFold, cross_val_score
from xgboost import XGBClassifier

PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from backend.ml import feature_engineering as fe  # noqa: E402
from backend.ml.evaluation import evaluate, native_importance, r  # noqa: E402
from backend.ml.explain import global_shap_importance, make_explainer  # noqa: E402

SAVED_MODELS_DIR = os.path.join(PROJECT_DIR, "backend", "saved_models")
METRICS_PATH = os.path.join(SAVED_MODELS_DIR, "model_metrics.json")
RANDOM_STATE = 42
SHAP_SAMPLE = 800  # số mẫu test dùng tính SHAP toàn cục (RF sâu khá chậm)
ADVANCED_MODELS = ("Random Forest", "XGBoost")


def prepare_dataset(data_dir: Optional[str] = None) -> dict:
    """Nạp dữ liệu, tính đặc trưng point-in-time cho tập train/test OOT."""
    orders = fe.load_orders(data_dir)
    split = fe.load_oot_split(orders, data_dir)
    proc_fill = float(split["agg_train"]["processing_hours_mean"].median())
    split["processing_hours_fill"] = proc_fill
    split["X_train"] = fe.build_model_features(split["agg_train"], proc_fill)
    split["X_test"] = fe.build_model_features(split["agg_test"], proc_fill)
    split["orders"] = orders
    return split


def advanced_search_space(y_train: pd.Series) -> Dict[str, tuple]:
    n_pos, n_neg = int(y_train.sum()), int((1 - y_train).sum())
    balance = round(n_neg / max(n_pos, 1), 5)
    return {
        "Random Forest": (
            RandomForestClassifier(n_estimators=400, class_weight="balanced_subsample", n_jobs=1, random_state=RANDOM_STATE),
            {
                "max_depth": [6, 10, None],
                "min_samples_leaf": [5, 20, 50],
                "max_features": ["sqrt", 0.5],
            },
        ),
        "XGBoost": (
            XGBClassifier(
                objective="binary:logistic",
                eval_metric="logloss",
                subsample=0.8,
                colsample_bytree=0.8,
                tree_method="hist",
                scale_pos_weight=balance,
                n_jobs=1,
                random_state=RANDOM_STATE,
            ),
            {
                "n_estimators": [200, 500],
                "max_depth": [2, 3, 5],
                "learning_rate": [0.03, 0.1],
                "min_child_weight": [1, 10],
            },
        ),
    }


def train_advanced(data: dict, verbose: bool = True) -> dict:
    """Tuning RF & XGBoost, đánh giá OOT, tính SHAP. Trả về kết quả + mô hình tốt nhất."""
    X_train, y_train, X_test, y_test = data["X_train"], data["y_train"], data["X_test"], data["y_test"]
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    rng = np.random.RandomState(RANDOM_STATE)
    shap_idx = rng.choice(len(X_test), size=min(SHAP_SAMPLE, len(X_test)), replace=False)
    X_shap = X_test.iloc[shap_idx]

    results, fitted = [], {}
    for name, (estimator, grid) in advanced_search_space(y_train).items():
        t0 = time.time()
        search = GridSearchCV(estimator, grid, cv=cv, scoring="roc_auc", n_jobs=-1, refit=True)
        search.fit(X_train, y_train)
        model = search.best_estimator_
        proba = model.predict_proba(X_test)[:, 1]
        cv_std = float(search.cv_results_["std_test_score"][search.best_index_])

        # Đối chứng: cùng siêu tham số nhưng KHÔNG cân bằng lớp
        unweighted = clone(model).set_params(**({"scale_pos_weight": 1.0} if name == "XGBoost" else {"class_weight": None}))
        ab_scores = cross_val_score(unweighted, X_train, y_train, cv=cv, scoring="roc_auc", n_jobs=-1)
        ab_proba = unweighted.fit(X_train, y_train).predict_proba(X_test)[:, 1]
        ab_test = evaluate(y_test, ab_proba)
        ablation = {
            "cv_roc_auc_mean": r(ab_scores.mean()),
            "cv_roc_auc_std": r(ab_scores.std()),
            "test_roc_auc": ab_test["roc_auc"],
            "test_balanced_accuracy": ab_test["balanced_accuracy"],
            "test_retained_recall": ab_test["retained_recall"],
        }

        t1 = time.time()
        shap_global = global_shap_importance(make_explainer(model), X_shap)
        results.append({
            "model": name,
            "family": "advanced",
            "best_params": {k: (v if not isinstance(v, (np.floating, float)) else round(float(v), 5)) for k, v in search.best_params_.items()},
            "n_candidates": int(len(search.cv_results_["params"])),
            "cv_roc_auc_mean": r(search.best_score_),
            "cv_roc_auc_std": r(cv_std),
            "test": evaluate(y_test, proba),
            "feature_importance": [
                {"feature": d["feature"], "label": d["label"], "importance": d["importance"], "direction": d["direction"]}
                for d in shap_global
            ],
            "native_feature_importance": native_importance(model, list(X_train.columns)),
            "importance_method": "SHAP (mean |value|, TreeExplainer)",
            "class_balancing": "scale_pos_weight = n_neg/n_pos" if name == "XGBoost" else "class_weight = balanced_subsample",
            "imbalance_ablation": ablation,
            "train_seconds": r(t1 - t0, 1),
            "shap_seconds": r(time.time() - t1, 1),
        })
        fitted[name] = (model, proba)
        if verbose:
            print(f"  ✓ {name:<14} CV ROC-AUC = {search.best_score_:.4f} ± {cv_std:.4f} "
                  f"| test ROC-AUC = {results[-1]['test']['roc_auc']:.4f} | {search.best_params_} ({t1 - t0:.0f}s + SHAP {time.time() - t1:.0f}s)")

    best_name = max(results, key=lambda x: x["cv_roc_auc_mean"])["model"]
    return {"results": results, "best_name": best_name, "fitted": fitted}


def save_churn_artifacts(model, features) -> None:
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    joblib.dump(model, os.path.join(SAVED_MODELS_DIR, "churn_model.pkl"))
    joblib.dump(list(features), os.path.join(SAVED_MODELS_DIR, "churn_features.pkl"))
    legacy_scaler = os.path.join(SAVED_MODELS_DIR, "scaler_churn.pkl")
    if os.path.exists(legacy_scaler):  # mô hình cây không dùng scaler
        os.remove(legacy_scaler)


def churn_section(data: dict, advanced: dict, baselines: Optional[list] = None) -> dict:
    """Khối 'churn' của model_metrics.json (mô hình phục vụ API = tốt nhất trong RF/XGBoost)."""
    y_tr, y_te = data["y_train"], data["y_test"]
    best = next(x for x in advanced["results"] if x["model"] == advanced["best_name"])
    models = list(baselines or []) + advanced["results"]
    best_overall = max(models, key=lambda x: x["cv_roc_auc_mean"])
    _, best_proba = advanced["fitted"][advanced["best_name"]]
    risk = pd.cut(best_proba, bins=[-np.inf, 0.4, 0.7, np.inf], right=False, labels=["Low", "Medium", "High"])
    risk_dist = {k: int(v) for k, v in pd.Series(risk).value_counts().reindex(["High", "Medium", "Low"]).fillna(0).items()}
    return {
        "target_definition": "target = 1 nếu khách KHÔNG phát sinh đơn mới trong cửa sổ kết quả (sau cutoff)",
        "observation_window": {"start": str(data["observation_start"]), "cutoff": str(data["cutoff"])},
        "outcome_window": {
            "start": str(data["cutoff"]),
            "end": str(data["horizon_end"]),
            "days": r((data["horizon_end"] - data["cutoff"]).total_seconds() / 86400, 2),
        },
        "n_train": int(len(y_tr)),
        "n_test": int(len(y_te)),
        "churn_rate_train": r(y_tr.mean()),
        "churn_rate_test": r(y_te.mean()),
        "majority_baseline_accuracy_test": r(max(y_te.mean(), 1 - y_te.mean())),
        "label_agreement_with_oot_files": r(data["label_agreement"], 6),
        "leakage_audit": data["leakage_audit"],
        "features": fe.MODEL_FEATURES,
        "feature_labels": fe.FEATURE_LABELS,
        "selection_criterion": "CV ROC-AUC (5-fold, chỉ tập train) trong nhóm mô hình nâng cao RF/XGBoost",
        "decision_threshold": 0.5,
        "best_model": advanced["best_name"],
        "best_model_params": best["best_params"],
        "best_model_test": best["test"],
        "best_model_feature_importance": best["feature_importance"],
        "importance_method": best["importance_method"],
        "best_overall_by_cv": best_overall["model"],
        "risk_thresholds": {"high": 0.7, "medium": 0.4},
        "test_risk_distribution": risk_dist,
        "models": models,
        "inference_defaults": {"processing_hours_mean": r(data["processing_hours_fill"], 2)},
    }


def update_metrics_file(churn: dict) -> None:
    """Ghi khối churn vào model_metrics.json, giữ nguyên các khối khác (rfm, ...) và kết quả baseline cũ."""
    metrics = {}
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            metrics = json.load(f)
    old_baselines = [m for m in metrics.get("churn", {}).get("models", []) if m.get("family") == "baseline"]
    if old_baselines and not any(m.get("family") == "baseline" for m in churn["models"]):
        churn["models"] = old_baselines + churn["models"]
    metrics["generated_at"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    metrics["data_source"] = "Cleaned_data/orders_cleaned.csv + train_churn_oot.csv / test_churn_oot.csv"
    metrics["churn"] = churn
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)


def print_table(models: list, best_name: str, n_test: int, churn_rate: float) -> None:
    print("\n" + "=" * 110)
    print(f"KẾT QUẢ TEST OUT-OF-TIME (n = {n_test:,}, churn = {churn_rate:.2%}, baseline đoán toàn 'churn' = {max(churn_rate, 1 - churn_rate):.4f})")
    print("=" * 110)
    print(f"{'Mô hình':<22}{'CV AUC':>9}{'Accuracy':>10}{'Bal.Acc':>9}{'Precision':>10}{'Recall':>8}{'F1':>8}{'ROC-AUC':>9}{'Ret.Rec':>9}{'Ret.PR-AUC':>12}")
    print("-" * 110)
    for m in models:
        t = m["test"]
        mark = " ★" if m["model"] == best_name else ""
        print(f"{m['model'] + mark:<22}{m['cv_roc_auc_mean']:>9.4f}{t['accuracy']:>10.4f}{t['balanced_accuracy']:>9.4f}"
              f"{t['precision']:>10.4f}{t['recall']:>8.4f}{t['f1_score']:>8.4f}{t['roc_auc']:>9.4f}"
              f"{t['retained_recall']:>9.4f}{t['retained_pr_auc']:>12.4f}")
    print("-" * 110)


def main():
    print("[1/2] Tính đặc trưng point-in-time ...")
    data = prepare_dataset()
    print(f"  cutoff = {data['cutoff']} | train = {len(data['y_train']):,} | test = {len(data['y_test']):,} "
          f"| {len(fe.MODEL_FEATURES)} đặc trưng | đơn cập nhật sau cutoff: {data['leakage_audit']['share_updated_after_cutoff']:.1%}")
    print("[2/2] GridSearchCV 5-fold cho Random Forest & XGBoost ...")
    adv = train_advanced(data)
    best_model, _ = adv["fitted"][adv["best_name"]]
    save_churn_artifacts(best_model, data["X_train"].columns)
    churn = churn_section(data, adv)
    update_metrics_file(churn)
    print_table(churn["models"], adv["best_name"], churn["n_test"], churn["churn_rate_test"])
    print(f"\nTop 8 đặc trưng theo SHAP ({adv['best_name']}):")
    for d in churn["best_model_feature_importance"][:8]:
        print(f"  - {d['label']:<38} {d['importance']:.4f}  ({d['direction']})")
    print(f"\n💾 Đã lưu saved_models/churn_model.pkl ({adv['best_name']}) và cập nhật model_metrics.json")


if __name__ == "__main__":
    main()
