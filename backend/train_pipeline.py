"""
Pipeline huấn luyện ĐẦY ĐỦ trên dữ liệu thật (Cleaned_data/).

  1. Đặc trưng point-in-time (backend/ml/feature_engineering.py) cho bài toán churn out-of-time:
     tập khách hàng, nhãn `target` và phép chia train/test lấy NGUYÊN từ train_churn_oot.csv / test_churn_oot.csv.
  2. Baseline: Logistic Regression, Decision Tree (GridSearchCV 5-fold trên tập train).
  3. Nâng cao: Random Forest, XGBoost + SHAP (backend/ml/train_advanced.py) -> mô hình phục vụ API.
  4. RFM K-Means (K=4) trên customer_rfm_features.csv, gán nhãn theo điểm tổng hợp tâm cụm.
  5. Số liệu BI tổng hợp (backend/ml/analytics.py) + tập test đã chấm điểm cho Streamlit dashboard.

Chạy:  python backend/train_pipeline.py
"""

import json
import os
import sys
import time

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import silhouette_score
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BACKEND_DIR)
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from backend.ml import feature_engineering as fe  # noqa: E402
from backend.ml.analytics import build_analytics_summary  # noqa: E402
from backend.ml.evaluation import evaluate, native_importance, r  # noqa: E402
from backend.ml.train_advanced import (  # noqa: E402
    METRICS_PATH,
    SAVED_MODELS_DIR,
    churn_section,
    prepare_dataset,
    print_table,
    save_churn_artifacts,
    train_advanced,
)

RANDOM_STATE = 42


# ============================================================================
# BASELINE: Logistic Regression & Decision Tree
# ============================================================================
def train_baselines(data: dict) -> list:
    X_train, y_train, X_test, y_test = data["X_train"], data["y_train"], data["X_test"], data["y_test"]
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    space = {
        "Logistic Regression": (
            LogisticRegression(class_weight="balanced", max_iter=5000, random_state=RANDOM_STATE),
            {"model__C": [0.01, 0.1, 1.0, 10.0]},
        ),
        "Decision Tree": (
            DecisionTreeClassifier(class_weight="balanced", random_state=RANDOM_STATE),
            {"model__max_depth": [3, 5, 8, None], "model__min_samples_leaf": [1, 20, 50]},
        ),
    }
    results = []
    for name, (estimator, grid) in space.items():
        t0 = time.time()
        pipe = Pipeline([("scaler", StandardScaler()), ("model", estimator)])
        search = GridSearchCV(pipe, grid, cv=cv, scoring="roc_auc", n_jobs=-1).fit(X_train, y_train)
        proba = search.best_estimator_.predict_proba(X_test)[:, 1]
        results.append({
            "model": name,
            "family": "baseline",
            "best_params": {k.replace("model__", ""): v for k, v in search.best_params_.items()},
            "n_candidates": int(len(search.cv_results_["params"])),
            "cv_roc_auc_mean": r(search.best_score_),
            "cv_roc_auc_std": r(float(search.cv_results_["std_test_score"][search.best_index_])),
            "test": evaluate(y_test, proba),
            "feature_importance": [
                {"feature": d["feature"], "label": fe.FEATURE_LABELS.get(d["feature"], d["feature"]), "importance": d["importance"]}
                for d in native_importance(search.best_estimator_.named_steps["model"], list(X_train.columns))
            ],
            "importance_method": "|coef| trên đặc trưng chuẩn hóa" if name == "Logistic Regression" else "Gini importance",
            "class_balancing": "class_weight = balanced",
            "train_seconds": r(time.time() - t0, 1),
        })
        print(f"  ✓ {name:<20} CV ROC-AUC = {search.best_score_:.4f} | test ROC-AUC = {results[-1]['test']['roc_auc']:.4f}")
    return results


# ============================================================================
# RFM K-MEANS
# ============================================================================
def train_rfm():
    rfm = fe.read_csv("customer_rfm_features.csv")
    X = fe.rfm_feature_frame(rfm["recency_days"], rfm["total_orders"], rfm["monetary_total"])
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)

    elbow = [{"k": k, "sse": r(KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10).fit(Xs).inertia_, 2)} for k in range(1, 11)]
    rng = np.random.RandomState(RANDOM_STATE)
    sample = Xs[rng.choice(len(Xs), size=min(5000, len(Xs)), replace=False)]
    silhouette = []
    for k in range(2, 9):
        labels = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10).fit_predict(sample)
        silhouette.append({"k": k, "silhouette": r(silhouette_score(sample, labels))})

    kmeans = KMeans(n_clusters=4, random_state=RANDOM_STATE, n_init=10).fit(Xs)
    segment_map = fe.rank_rfm_centroids(kmeans.cluster_centers_)
    rfm["segment"] = pd.Series(kmeans.labels_).map(segment_map).values
    centroids_raw = scaler.inverse_transform(kmeans.cluster_centers_)

    profile = []
    for cid, label in sorted(segment_map.items(), key=lambda t: fe.SEGMENT_LABELS.index(t[1])):
        seg = rfm[rfm["segment"] == label]
        c = kmeans.cluster_centers_[cid]
        profile.append({
            "cluster_id": cid,
            "segment": label,
            "customers": int(len(seg)),
            "share": r(len(seg) / len(rfm)),
            "composite_score": r(-c[0] + c[1] + c[2]),
            "mean_recency_days": r(seg["recency_days"].mean(), 1),
            "mean_frequency": r(seg["total_orders"].mean(), 2),
            "mean_monetary_vnd": r(seg["monetary_total"].mean(), 0),
            "centroid_recency_days": r(centroids_raw[cid][0], 1),
            "centroid_frequency": r(np.expm1(centroids_raw[cid][1]), 2),
            "centroid_monetary_vnd": r(np.expm1(centroids_raw[cid][2]), 0),
        })

    joblib.dump(kmeans, os.path.join(SAVED_MODELS_DIR, "kmeans_rfm.pkl"))
    joblib.dump(scaler, os.path.join(SAVED_MODELS_DIR, "scaler_rfm.pkl"))
    joblib.dump(segment_map, os.path.join(SAVED_MODELS_DIR, "segment_map.pkl"))
    return kmeans, scaler, segment_map, {
        "n_customers": int(len(rfm)),
        "features": fe.RFM_FEATURES,
        "k": 4,
        "labeling_rule": "score = -Recency_z + log(Frequency)_z + log(Monetary)_z trên tâm cụm; cao nhất = VIP",
        "elbow": elbow,
        "silhouette": silhouette,
        "segments": profile,
    }


# ============================================================================
# MAIN
# ============================================================================
def main():
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    print(f"📂 Dữ liệu: {fe.default_data_dir()}")

    print("\n[1/5] Đặc trưng point-in-time ...")
    data = prepare_dataset()
    y_tr, y_te = data["y_train"], data["y_test"]
    print(f"  cutoff = {data['cutoff']} | train = {len(y_tr):,} (churn {y_tr.mean():.2%}) | test = {len(y_te):,} (churn {y_te.mean():.2%})")
    print(f"  {len(fe.MODEL_FEATURES)} đặc trưng | khớp nhãn OOT = {data['label_agreement']:.4%} "
          f"| đơn cập nhật sau cutoff (coi là chưa biết): {data['leakage_audit']['share_updated_after_cutoff']:.1%}")

    print("\n[2/5] Baseline (GridSearchCV 5-fold) ...")
    baselines = train_baselines(data)

    print("\n[3/5] Mô hình nâng cao RF & XGBoost + SHAP ...")
    adv = train_advanced(data)
    best_model, best_proba = adv["fitted"][adv["best_name"]]
    save_churn_artifacts(best_model, data["X_train"].columns)
    churn = churn_section(data, adv, baselines)

    print("\n[4/5] RFM K-Means (K=4) ...")
    kmeans, scaler_rfm, segment_map, rfm = train_rfm()

    print("\n[5/5] Số liệu BI & dữ liệu dashboard ...")
    analytics = build_analytics_summary(
        data["orders"], data, test_proba=best_proba,
        feature_importance=churn["best_model_feature_importance"], model_name=adv["best_name"],
    )
    with open(os.path.join(SAVED_MODELS_DIR, "analytics_summary.json"), "w", encoding="utf-8") as f:
        json.dump(analytics, f, ensure_ascii=False, indent=2)

    # Tập test đã chấm điểm cho Streamlit dashboard (chứa customer_id -> không commit, xem .gitignore)
    agg_te = data["agg_test"]
    seg = pd.Series(kmeans.predict(scaler_rfm.transform(
        fe.rfm_feature_frame(agg_te["recency_days"], agg_te["total_orders"], agg_te["monetary"])))).map(segment_map).values
    primary = np.array(fe.CHANNELS)[agg_te[list(fe.CHANNEL_COUNT_COLS.values())].to_numpy().argmax(axis=1)]
    pd.DataFrame({
        "customer_id": agg_te.index,
        "recency": agg_te["recency_days"].round(2).values,
        "frequency": agg_te["total_orders"].values,
        "monetary": agg_te["monetary"].values,
        "fav_channel": primary,
        "region": agg_te["region"].values,
        "churn_prob": np.round(best_proba, 4),
        "rfm_segment": seg,
        "actual_churn": y_te.values,
    }).to_csv(os.path.join(SAVED_MODELS_DIR, "scored_customers.csv"), index=False, encoding="utf-8")

    from datetime import datetime, timezone
    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "data_source": "Cleaned_data/orders_cleaned.csv + train_churn_oot.csv / test_churn_oot.csv",
        "churn": churn,
        "rfm": rfm,
    }
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)

    print_table(churn["models"], adv["best_name"], churn["n_test"], churn["churn_rate_test"])
    print(f"★ = mô hình phục vụ API (tốt nhất theo CV ROC-AUC trong RF/XGBoost). Tốt nhất toàn bộ theo CV: {churn['best_overall_by_cv']}.")
    for m in adv["results"]:
        ab = m["imbalance_ablation"]
        print(f"  Đối chứng {m['model']} KHÔNG cân bằng lớp: CV AUC {ab['cv_roc_auc_mean']:.4f} | test AUC {ab['test_roc_auc']:.4f} "
              f"| Bal.Acc {ab['test_balanced_accuracy']:.4f} | Recall lớp quay lại {ab['test_retained_recall']:.4f}")
    print(f"\nTop 8 đặc trưng theo SHAP ({adv['best_name']}):")
    for d in churn["best_model_feature_importance"][:8]:
        print(f"  - {d['label']:<38} {d['importance']:.4f}  ({d['direction']})")
    print(f"\nPhân bố rủi ro test: {churn['test_risk_distribution']}")
    print("RFM:", ", ".join(f"{s['segment']} {s['customers']:,} ({s['share']:.1%})" for s in rfm["segments"]))
    print("\n💾 Đã lưu churn_model.pkl, kmeans_rfm.pkl, model_metrics.json, analytics_summary.json, scored_customers.csv")


if __name__ == "__main__":
    main()
