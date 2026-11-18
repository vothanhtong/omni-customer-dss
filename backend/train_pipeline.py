"""
Pipeline huấn luyện chuẩn trên dữ liệu thật (Cleaned_data/).

1. Churn (out-of-time):
   - Tập khách hàng, nhãn `target` và phép chia train/test lấy NGUYÊN từ
     Cleaned_data/train_churn_oot.csv và test_churn_oot.csv.
   - Các file OOT đã được chuẩn hóa sẵn bằng một scaler không được lưu lại, nên đặc trưng được
     TÁI DỰNG ở thang đo thô từ orders_cleaned.csv (cùng định nghĩa), kiểm chứng tương quan ≈ 1.0
     với cột gốc, rồi fit StandardScaler mới -> API nhận được đầu vào thực tế (ngày, số đơn, VNĐ).
   - So sánh 4 mô hình: Logistic Regression, Decision Tree, Random Forest, XGBoost (thư viện xgboost).
     Tối ưu siêu tham số bằng GridSearchCV 5-fold trên TẬP TRAIN; chọn mô hình theo CV ROC-AUC
     (không nhìn tập test), sau đó báo cáo trên tập test out-of-time.
2. RFM: K-Means (K=4) trên customer_rfm_features.csv, gán nhãn theo điểm tổng hợp tâm cụm.

Chạy:  python backend/train_pipeline.py
"""

import json
import os
import sys
import time
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    balanced_accuracy_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
    silhouette_score,
)
from sklearn.model_selection import GridSearchCV, StratifiedKFold
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.tree import DecisionTreeClassifier
from xgboost import XGBClassifier

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BACKEND_DIR)
if PROJECT_DIR not in sys.path:
    sys.path.insert(0, PROJECT_DIR)

from backend.app.core.features import (  # noqa: E402
    CHANNELS,
    CHURN_FEATURES,
    OOT_COLUMN_MAP,
    REGIONS,
    RFM_FEATURES,
    build_churn_raw_features,
    churn_feature_frame,
    rank_rfm_centroids,
    rfm_feature_frame,
)

DATA_DIR = os.environ.get("CLEANED_DATA_DIR", os.path.join(PROJECT_DIR, "Cleaned_data"))
SAVED_MODELS_DIR = os.path.join(BACKEND_DIR, "saved_models")
RANDOM_STATE = 42
RISK_HIGH, RISK_MEDIUM = 0.7, 0.4


def _read(name: str, **kw) -> pd.DataFrame:
    return pd.read_csv(os.path.join(DATA_DIR, name), encoding="utf-8-sig", **kw)


def _r(x, n=4):
    return None if x is None or (isinstance(x, float) and np.isnan(x)) else round(float(x), n)


# ============================================================================
# 1. DỮ LIỆU CHURN
# ============================================================================
def load_churn_data():
    orders = _read("orders_cleaned.csv", low_memory=False)
    orders["order_time"] = pd.to_datetime(orders["inserted_at"])
    oot_train = _read("train_churn_oot.csv").set_index("customer_id")
    oot_test = _read("test_churn_oot.csv").set_index("customer_id")
    oot_ids = oot_train.index.union(oot_test.index)

    # Mốc cutoff: tập OOT gồm đúng các khách có đơn đầu tiên trước cutoff
    # -> cutoff = thời điểm đơn đầu tiên sớm nhất của khách KHÔNG thuộc OOT.
    first_order = orders.groupby("customer_id")["order_time"].min()
    cutoff = first_order[~first_order.index.isin(oot_ids)].min()
    if pd.isna(cutoff):
        cutoff = orders["order_time"].max()

    raw = build_churn_raw_features(orders, cutoff)
    missing = oot_ids.difference(raw.index)
    if len(missing):
        raise RuntimeError(f"{len(missing)} khách hàng OOT không tái dựng được đặc trưng.")

    X_all = churn_feature_frame(raw)

    # --- Kiểm chứng tái dựng so với file OOT gốc (đã chuẩn hóa) ---
    oot_all = pd.concat([oot_train, oot_test])
    validation = {}
    for ours, theirs in OOT_COLUMN_MAP.items():
        validation[ours] = _r(np.corrcoef(X_all.loc[oot_all.index, ours], oot_all[theirs])[0, 1], 6)
    for c in CHANNELS + [f"region_{r}" for r in REGIONS]:
        col = c if c.startswith("region_") else f"channel_{c}"
        validation[col + " (match rate)"] = _r(((oot_all[col] > 0).astype(float) == X_all.loc[oot_all.index, col]).mean(), 6)

    # Kiểm chứng định nghĩa nhãn: target=1 <=> KHÔNG có đơn nào trong cửa sổ kết quả
    rebought = oot_all.index.isin(orders.loc[orders["order_time"] >= cutoff, "customer_id"])
    label_agreement = float(((oot_all["target"] == 1) == ~rebought).mean())

    data = {
        "raw": raw,
        "X_train": X_all.loc[oot_train.index],
        "y_train": oot_train["target"].astype(int),
        "X_test": X_all.loc[oot_test.index],
        "y_test": oot_test["target"].astype(int),
        "cutoff": cutoff,
        "outcome_end": orders["order_time"].max(),
        "observation_start": orders["order_time"].min(),
        "validation": validation,
        "label_agreement": label_agreement,
    }
    return data


# ============================================================================
# 2. HUẤN LUYỆN & ĐÁNH GIÁ 4 MÔ HÌNH
# ============================================================================
def model_grid(y_train: pd.Series):
    n_pos, n_neg = int(y_train.sum()), int((1 - y_train).sum())
    return {
        "Logistic Regression": (
            LogisticRegression(class_weight="balanced", max_iter=5000, random_state=RANDOM_STATE),
            {"model__C": [0.01, 0.1, 1.0, 10.0]},
        ),
        "Decision Tree": (
            DecisionTreeClassifier(class_weight="balanced", random_state=RANDOM_STATE),
            {"model__max_depth": [3, 5, 8, None], "model__min_samples_leaf": [1, 20, 50]},
        ),
        "Random Forest": (
            RandomForestClassifier(class_weight="balanced", n_estimators=300, n_jobs=-1, random_state=RANDOM_STATE),
            {"model__max_depth": [6, 12, None], "model__min_samples_leaf": [1, 5, 20]},
        ),
        "XGBoost": (
            XGBClassifier(
                objective="binary:logistic",
                eval_metric="logloss",
                subsample=0.8,
                colsample_bytree=0.8,
                scale_pos_weight=n_neg / max(n_pos, 1),
                n_jobs=-1,
                random_state=RANDOM_STATE,
            ),
            {
                "model__n_estimators": [200, 400],
                "model__max_depth": [3, 5],
                "model__learning_rate": [0.05, 0.1],
            },
        ),
    }


def evaluate(y_true: pd.Series, proba: np.ndarray, threshold: float = 0.5) -> dict:
    pred = (proba >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, pred, labels=[0, 1]).ravel()
    return {
        "accuracy": _r(accuracy_score(y_true, pred)),
        "balanced_accuracy": _r(balanced_accuracy_score(y_true, pred)),
        "precision": _r(precision_score(y_true, pred, zero_division=0)),
        "recall": _r(recall_score(y_true, pred, zero_division=0)),
        "f1_score": _r(f1_score(y_true, pred, zero_division=0)),
        "roc_auc": _r(roc_auc_score(y_true, proba)),
        # Lớp thiểu số (khách QUAY LẠI mua, target=0) — chỉ số quan trọng khi dữ liệu mất cân bằng
        "retained_precision": _r(precision_score(y_true, pred, pos_label=0, zero_division=0)),
        "retained_recall": _r(recall_score(y_true, pred, pos_label=0, zero_division=0)),
        "retained_f1": _r(f1_score(y_true, pred, pos_label=0, zero_division=0)),
        "retained_pr_auc": _r(average_precision_score(1 - y_true, 1 - proba)),
        "confusion_matrix": {"tn": int(tn), "fp": int(fp), "fn": int(fn), "tp": int(tp)},
    }


def feature_importance(model, features) -> list:
    if hasattr(model, "feature_importances_"):
        values = np.asarray(model.feature_importances_, dtype=float)
    elif hasattr(model, "coef_"):
        values = np.abs(np.asarray(model.coef_, dtype=float)).ravel()
    else:
        return []
    total = values.sum() or 1.0
    ranked = sorted(zip(features, values / total), key=lambda t: -t[1])
    return [{"feature": f, "importance": _r(v)} for f, v in ranked]


def train_churn_models(data: dict) -> dict:
    X_train, y_train, X_test, y_test = data["X_train"], data["y_train"], data["X_test"], data["y_test"]
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    results, fitted = [], {}

    for name, (estimator, grid) in model_grid(y_train).items():
        t0 = time.time()
        pipe = Pipeline([("scaler", StandardScaler()), ("model", estimator)])
        search = GridSearchCV(pipe, grid, cv=cv, scoring="roc_auc", n_jobs=-1, refit=True)
        search.fit(X_train, y_train)
        best = search.best_estimator_
        proba = best.predict_proba(X_test)[:, 1]
        cv_std = float(search.cv_results_["std_test_score"][search.best_index_])
        results.append({
            "model": name,
            "best_params": {k.replace("model__", ""): v for k, v in search.best_params_.items()},
            "cv_roc_auc_mean": _r(search.best_score_),
            "cv_roc_auc_std": _r(cv_std),
            "test": evaluate(y_test, proba),
            "feature_importance": feature_importance(best.named_steps["model"], CHURN_FEATURES),
            "train_seconds": _r(time.time() - t0, 1),
        })
        fitted[name] = (best, proba)
        print(f"  ✓ {name:<20} CV ROC-AUC = {search.best_score_:.4f} ± {cv_std:.4f}  ({time.time() - t0:.1f}s)")

    best_name = max(results, key=lambda r: r["cv_roc_auc_mean"])["model"]
    return {"results": results, "best_name": best_name, "fitted": fitted}


# ============================================================================
# 3. RFM K-MEANS
# ============================================================================
def train_rfm() -> dict:
    rfm = _read("customer_rfm_features.csv")
    X = rfm_feature_frame(rfm["recency_days"], rfm["total_orders"], rfm["monetary_total"])
    scaler = StandardScaler()
    Xs = scaler.fit_transform(X)

    elbow = []
    for k in range(1, 11):
        elbow.append({"k": k, "sse": _r(KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10).fit(Xs).inertia_, 2)})
    rng = np.random.RandomState(RANDOM_STATE)
    sample = Xs[rng.choice(len(Xs), size=min(5000, len(Xs)), replace=False)]
    silhouette = []
    for k in range(2, 9):
        labels = KMeans(n_clusters=k, random_state=RANDOM_STATE, n_init=10).fit_predict(sample)
        silhouette.append({"k": k, "silhouette": _r(silhouette_score(sample, labels))})

    kmeans = KMeans(n_clusters=4, random_state=RANDOM_STATE, n_init=10).fit(Xs)
    segment_map = rank_rfm_centroids(kmeans.cluster_centers_)
    rfm["segment"] = pd.Series(kmeans.labels_).map(segment_map).values

    centroids_raw = scaler.inverse_transform(kmeans.cluster_centers_)
    profile = []
    for cid, label in sorted(segment_map.items(), key=lambda t: ["VIP", "Tiềm năng", "Cần chăm sóc", "Rủi ro"].index(t[1])):
        seg = rfm[rfm["segment"] == label]
        c = kmeans.cluster_centers_[cid]
        profile.append({
            "cluster_id": cid,
            "segment": label,
            "customers": int(len(seg)),
            "share": _r(len(seg) / len(rfm)),
            "composite_score": _r(-c[0] + c[1] + c[2]),
            "mean_recency_days": _r(seg["recency_days"].mean(), 1),
            "mean_frequency": _r(seg["total_orders"].mean(), 2),
            "mean_monetary_vnd": _r(seg["monetary_total"].mean(), 0),
            "centroid_recency_days": _r(centroids_raw[cid][0], 1),
            "centroid_frequency": _r(np.expm1(centroids_raw[cid][1]), 2),
            "centroid_monetary_vnd": _r(np.expm1(centroids_raw[cid][2]), 0),
        })

    joblib.dump(kmeans, os.path.join(SAVED_MODELS_DIR, "kmeans_rfm.pkl"))
    joblib.dump(scaler, os.path.join(SAVED_MODELS_DIR, "scaler_rfm.pkl"))
    joblib.dump(segment_map, os.path.join(SAVED_MODELS_DIR, "segment_map.pkl"))
    return kmeans, scaler, segment_map, {
        "n_customers": int(len(rfm)),
        "features": RFM_FEATURES,
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
    print(f"📂 Dữ liệu: {DATA_DIR}")

    print("\n[1/3] Tái dựng đặc trưng churn out-of-time ...")
    data = load_churn_data()
    y_tr, y_te = data["y_train"], data["y_test"]
    print(f"  cutoff = {data['cutoff']}, cửa sổ kết quả đến {data['outcome_end']}")
    print(f"  train = {len(y_tr):,} (churn {y_tr.mean():.2%}) | test = {len(y_te):,} (churn {y_te.mean():.2%})")
    min_corr = min(v for k, v in data["validation"].items() if "match" not in k)
    print(f"  kiểm chứng tái dựng: tương quan thấp nhất = {min_corr:.6f}; khớp định nghĩa nhãn = {data['label_agreement']:.4%}")

    print("\n[2/3] GridSearchCV 5-fold trên tập train cho 4 mô hình ...")
    churn = train_churn_models(data)
    best_name = churn["best_name"]
    best_pipe, best_proba = churn["fitted"][best_name]

    joblib.dump(best_pipe.named_steps["scaler"], os.path.join(SAVED_MODELS_DIR, "scaler_churn.pkl"))
    joblib.dump(best_pipe.named_steps["model"], os.path.join(SAVED_MODELS_DIR, "churn_model.pkl"))
    joblib.dump(CHURN_FEATURES, os.path.join(SAVED_MODELS_DIR, "churn_features.pkl"))

    risk = pd.cut(best_proba, bins=[-np.inf, RISK_MEDIUM, RISK_HIGH, np.inf], right=False, labels=["Low", "Medium", "High"])
    risk_dist = {k: int(v) for k, v in pd.Series(risk).value_counts().reindex(["High", "Medium", "Low"]).fillna(0).items()}

    print("\n[3/3] Phân cụm RFM K-Means (K=4) ...")
    kmeans, scaler_rfm, segment_map, rfm = train_rfm()

    # Xuất tập test đã chấm điểm cho Streamlit dashboard (chứa customer_id -> không commit, xem .gitignore)
    raw_test = data["raw"].loc[data["X_test"].index]
    X_rfm_test = rfm_feature_frame(raw_test["recency_days"], raw_test["total_orders"], raw_test["monetary"])
    scored = pd.DataFrame({
        "customer_id": raw_test.index,
        "recency": raw_test["recency_days"].round(2).values,
        "frequency": raw_test["total_orders"].values,
        "monetary": raw_test["monetary"].values,
        "fav_channel": raw_test["primary_channel"].values,
        "region": raw_test["region"].values,
        "churn_prob": np.round(best_proba, 4),
        "rfm_segment": pd.Series(kmeans.predict(scaler_rfm.transform(X_rfm_test))).map(segment_map).values,
        "actual_churn": data["y_test"].values,
    })
    scored.to_csv(os.path.join(SAVED_MODELS_DIR, "scored_customers.csv"), index=False, encoding="utf-8")

    raw_train = data["raw"].loc[data["X_train"].index]
    best_result = next(r for r in churn["results"] if r["model"] == best_name)
    metrics = {
        "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "data_source": "Cleaned_data/orders_cleaned.csv + train_churn_oot.csv / test_churn_oot.csv",
        "churn": {
            "target_definition": "target = 1 nếu khách KHÔNG phát sinh đơn mới trong cửa sổ kết quả (sau cutoff)",
            "observation_window": {"start": str(data["observation_start"]), "cutoff": str(data["cutoff"])},
            "outcome_window": {
                "start": str(data["cutoff"]),
                "end": str(data["outcome_end"]),
                "days": _r((data["outcome_end"] - data["cutoff"]).total_seconds() / 86400, 2),
            },
            "n_train": int(len(y_tr)),
            "n_test": int(len(y_te)),
            "churn_rate_train": _r(y_tr.mean()),
            "churn_rate_test": _r(y_te.mean()),
            "majority_baseline_accuracy_test": _r(max(y_te.mean(), 1 - y_te.mean())),
            "reconstruction_check": {"correlation_with_oot_columns": data["validation"], "label_agreement": _r(data["label_agreement"], 6)},
            "features": CHURN_FEATURES,
            "selection_criterion": "CV ROC-AUC (5-fold, chỉ tập train)",
            "decision_threshold": 0.5,
            "best_model": best_name,
            "best_model_test": best_result["test"],
            "best_model_feature_importance": best_result["feature_importance"],
            "risk_thresholds": {"high": RISK_HIGH, "medium": RISK_MEDIUM},
            "test_risk_distribution": risk_dist,
            "models": churn["results"],
            "inference_defaults": {
                "processing_hours_mean": _r(raw_train["processing_hours_mean"].median(), 2),
            },
        },
        "rfm": rfm,
    }
    with open(os.path.join(SAVED_MODELS_DIR, "model_metrics.json"), "w", encoding="utf-8") as f:
        json.dump(metrics, f, ensure_ascii=False, indent=2)

    # ---- Bảng kết quả ----
    print("\n" + "=" * 112)
    print(f"KẾT QUẢ TRÊN TẬP TEST OUT-OF-TIME (n = {len(y_te):,}, churn = {y_te.mean():.2%}, "
          f"baseline đoán toàn bộ 'churn' = {max(y_te.mean(), 1 - y_te.mean()):.4f})")
    print("=" * 112)
    hdr = f"{'Mô hình':<20}{'CV AUC':>9}{'Accuracy':>10}{'Bal.Acc':>9}{'Precision':>10}{'Recall':>8}{'F1':>8}{'ROC-AUC':>9}{'Ret.Rec':>9}{'Ret.F1':>8}{'Ret.PR-AUC':>12}"
    print(hdr)
    print("-" * 112)
    for r in churn["results"]:
        t = r["test"]
        mark = " ★" if r["model"] == best_name else ""
        print(f"{r['model'] + mark:<20}{r['cv_roc_auc_mean']:>9.4f}{t['accuracy']:>10.4f}{t['balanced_accuracy']:>9.4f}"
              f"{t['precision']:>10.4f}{t['recall']:>8.4f}{t['f1_score']:>8.4f}{t['roc_auc']:>9.4f}"
              f"{t['retained_recall']:>9.4f}{t['retained_f1']:>8.4f}{t['retained_pr_auc']:>12.4f}")
    print("-" * 112)
    print("★ = mô hình được chọn theo CV ROC-AUC trên tập train. Ret.* = chỉ số cho lớp thiểu số 'khách quay lại' (target=0).")
    print(f"\nTop 5 đặc trưng quan trọng ({best_name}):")
    for fi in best_result["feature_importance"][:5]:
        print(f"  - {fi['feature']:<26} {fi['importance']:.4f}")
    print(f"\nPhân bố mức rủi ro trên test (ngưỡng {RISK_MEDIUM}/{RISK_HIGH}): {risk_dist}")
    print("\nRFM K-Means (K=4):")
    for s in rfm["segments"]:
        print(f"  {s['segment']:<14} {s['customers']:>6,} KH ({s['share']:.1%}) | R={s['mean_recency_days']:>6} ngày  "
              f"F={s['mean_frequency']:>5}  M={s['mean_monetary_vnd']:>12,.0f}đ  score={s['composite_score']:+.3f}")
    print("  Silhouette:", ", ".join(f"k={s['k']}: {s['silhouette']:.3f}" for s in rfm["silhouette"]))
    print(f"\n💾 Đã lưu mô hình & {os.path.join('backend', 'saved_models', 'model_metrics.json')}")


if __name__ == "__main__":
    main()
