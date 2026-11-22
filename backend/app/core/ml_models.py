"""
ML Model Management Module - nạp & suy luận cho mô hình RFM (K-Means) và Churn.
Mô hình được sinh bởi backend/train_pipeline.py trên dữ liệu thật (Cleaned_data/).
"""

import os
from typing import Any, Dict, Optional

# pyrefly: ignore
import joblib
import pandas as pd

from backend.app.core.artifacts import load_json_artifact
from backend.app.core.config import SAVED_MODELS_DIR
from backend.ml.feature_engineering import CHANNEL_COUNT_COLS, build_model_features, rfm_feature_frame
from backend.ml.explain import explain_rows, make_explainer

RISK_HIGH, RISK_MEDIUM = 0.7, 0.4

_ARTIFACTS = {
    "kmeans_model": "kmeans_rfm.pkl",
    "scaler_rfm": "scaler_rfm.pkl",
    "segment_map": "segment_map.pkl",
    "churn_model": "churn_model.pkl",
    "churn_features": "churn_features.pkl",
}


def churn_payload_to_aggregates(payload: Dict[str, Any]) -> pd.DataFrame:
    """
    Chuyển payload API (ChurnPredictionRequest) -> 1 dòng số liệu thô giống build_customer_aggregates().
    Trường bỏ trống được suy ra hợp lý (ghi chú trong schema).
    """
    total = int(payload["total_orders"])
    recency = float(payload["recency_days"])
    tenure = float(payload.get("tenure_days") or 0.0)
    age = recency + tenure

    by_channel = payload.get("orders_by_channel") or {payload.get("primary_channel") or "Facebook Fanpage": total}
    last_30 = payload.get("orders_last_30d")
    if last_30 is None:
        last_30 = total if age <= 30 else (1 if recency <= 30 else 0)
    last_7 = payload.get("orders_last_7d")
    if last_7 is None:
        last_7 = total if age <= 7 else (1 if recency <= 7 else 0)

    row = {
        "recency_days": recency,
        "tenure_days": tenure,
        "total_orders": total,
        "orders_last_7d": min(int(last_7), total),
        "orders_last_30d": min(int(last_30), total),
        "completed_orders": int(payload["completed_orders"]),
        "returned_orders": int(payload.get("returned_orders") or 0),
        "cancelled_orders": int(payload.get("cancelled_orders") or 0),
        "monetary": float(payload["monetary"]),
        "ad_orders": int(payload.get("ad_orders") or 0),
        "cod_orders": int(payload["cod_orders"]) if payload.get("cod_orders") is not None else total,
        "num_categories": int(payload.get("num_categories") or 1),
        "num_sources": int(payload.get("num_sources") or 1),
        "processing_hours_mean": payload.get("processing_hours_mean"),
        "region": payload.get("region") or "Miền Nam",
    }
    for channel, col in CHANNEL_COUNT_COLS.items():
        row[col] = int(by_channel.get(channel, 0))
    return pd.DataFrame([row])


class ModelNotReadyError(RuntimeError):
    pass


def risk_level_of(churn_prob: float) -> str:
    if churn_prob >= RISK_HIGH:
        return "High Risk"
    if churn_prob >= RISK_MEDIUM:
        return "Medium Risk"
    return "Low Risk"


def load_metrics() -> Optional[Dict[str, Any]]:
    """model_metrics.json (cache theo mtime, chỉ đọc)."""
    return load_json_artifact("model_metrics.json")


class MLModelManager:
    def __init__(self):
        self.kmeans_model = None
        self.scaler_rfm = None
        self.segment_map = None
        self.churn_model = None
        self.churn_features = None
        self.churn_explainer = None
        self.churn_model_name = "unknown"
        self.inference_defaults: Dict[str, float] = {}

    def load_models(self) -> bool:
        """Tải mô hình đã huấn luyện từ saved_models/. Không tự sinh dữ liệu giả lập khi thiếu."""
        missing = [f for f in _ARTIFACTS.values() if not os.path.exists(os.path.join(SAVED_MODELS_DIR, f))]
        if missing:
            print(f"⚠️ Thiếu file mô hình {missing}. Hãy chạy: python backend/train_pipeline.py")
            return False
        try:
            for attr, fname in _ARTIFACTS.items():
                setattr(self, attr, joblib.load(os.path.join(SAVED_MODELS_DIR, fname)))
            try:
                self.churn_explainer = make_explainer(self.churn_model)
            except Exception as e:  # SHAP không khả dụng -> vẫn dự đoán, không trả lý do
                self.churn_explainer = None
                print(f"⚠️ Không khởi tạo được SHAP explainer: {e}")
            metrics = load_metrics() or {}
            churn_meta = metrics.get("churn", {})
            self.churn_model_name = churn_meta.get("best_model", type(self.churn_model).__name__)
            self.inference_defaults = churn_meta.get("inference_defaults", {})
            print(f"✓ Tải mô hình ML thành công! (Churn: {self.churn_model_name})")
            return True
        except Exception as e:
            print(f"⚠️ Lỗi khi tải mô hình ML: {str(e)}")
            return False

    def _ensure(self, *attrs: str):
        if any(getattr(self, a) is None for a in attrs):
            self.load_models()
        if any(getattr(self, a) is None for a in attrs):
            raise ModelNotReadyError("Mô hình chưa được huấn luyện. Hãy chạy: python backend/train_pipeline.py")

    def predict_rfm_segment(self, recency: float, frequency: int, monetary: float) -> dict:
        """Dự đoán phân khúc RFM bằng K-Means."""
        self._ensure("kmeans_model", "scaler_rfm", "segment_map")
        X = rfm_feature_frame([recency], [frequency], [monetary])
        cluster_id = int(self.kmeans_model.predict(self.scaler_rfm.transform(X))[0])
        return {
            "cluster_id": cluster_id,
            "segment_name": self.segment_map.get(cluster_id, f"Cluster {cluster_id}"),
        }

    def predict_churn_risk(self, customer: Dict[str, Any], top_k: int = 5) -> dict:
        """
        Dự đoán xác suất churn từ số liệu hành vi (xem ChurnPredictionRequest),
        kèm các lý do ảnh hưởng chính (SHAP) cho riêng khách hàng này.
        """
        self._ensure("churn_model", "churn_features")
        agg = churn_payload_to_aggregates(customer)
        fill = float(self.inference_defaults.get("processing_hours_mean", 0.0))
        X = build_model_features(agg, processing_hours_fill=fill)[self.churn_features]
        churn_prob = float(self.churn_model.predict_proba(X)[0][1])

        top_factors = explain_rows(self.churn_explainer, X, top_k=top_k)[0] if self.churn_explainer is not None else []
        return {
            "churn_probability": round(churn_prob, 4),
            "churn_probability_pct": round(churn_prob * 100.0, 2),
            # Xu hướng mua (công việc 4.2): nhãn churn = "không mua lại trong cửa sổ" => P(mua lại) = 1 - P(churn)
            "repurchase_probability": round(1.0 - churn_prob, 4),
            "repurchase_probability_pct": round((1.0 - churn_prob) * 100.0, 2),
            "churn_prediction": int(churn_prob >= 0.5),
            "risk_level": risk_level_of(churn_prob),
            "model_name": self.churn_model_name,
            "top_factors": top_factors,
        }

    def score_aggregates(self, agg: pd.DataFrame, top_k: int = 3, explain_limit: Optional[int] = None) -> pd.DataFrame:
        """
        Chấm điểm nhiều khách cùng lúc từ số liệu thô (build_customer_aggregates) — dùng cho dự đoán hàng loạt.
        Trả DataFrame (index = customer_id): churn_prob, risk_level, rfm_segment, top_factors.
        SHAP chỉ tính cho `explain_limit` khách rủi ro cao nhất (None = tất cả) để giới hạn thời gian xử lý.
        """
        self._ensure("churn_model", "churn_features", "kmeans_model", "scaler_rfm", "segment_map")
        fill = float(self.inference_defaults.get("processing_hours_mean", 0.0))
        X = build_model_features(agg, processing_hours_fill=fill)[self.churn_features]
        proba = self.churn_model.predict_proba(X)[:, 1]

        rfm_X = rfm_feature_frame(agg["recency_days"], agg["completed_orders"], agg["monetary"])  # F = đơn thành công
        clusters = self.kmeans_model.predict(self.scaler_rfm.transform(rfm_X))

        out = pd.DataFrame(index=agg.index)
        out["churn_prob"] = proba
        out["repurchase_prob"] = 1.0 - proba
        out["risk_level"] = [risk_level_of(p) for p in proba]
        out["rfm_segment"] = [self.segment_map.get(int(c), f"Cluster {int(c)}") for c in clusters]
        out["top_factors"] = [[] for _ in range(len(out))]
        if self.churn_explainer is not None and len(out) and explain_limit != 0:
            order = out["churn_prob"].to_numpy().argsort()[::-1]
            idx = order if explain_limit is None else order[:max(explain_limit, 0)]
            factors = explain_rows(self.churn_explainer, X.iloc[idx], top_k=top_k)
            for pos, f in zip(idx, factors):
                out.iat[pos, out.columns.get_loc("top_factors")] = f
        return out


ml_manager = MLModelManager()
