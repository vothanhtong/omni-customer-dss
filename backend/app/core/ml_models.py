"""
ML Model Management Module - nạp & suy luận cho mô hình RFM (K-Means) và Churn.
Mô hình được sinh bởi backend/train_pipeline.py trên dữ liệu thật (Cleaned_data/).
"""

import json
import os
from typing import Any, Dict, Optional

# pyrefly: ignore
import joblib
import pandas as pd

try:
    from backend.app.core.config import SAVED_MODELS_DIR
    from backend.app.core.features import churn_feature_frame, rfm_feature_frame
except ImportError:
    from app.core.config import SAVED_MODELS_DIR
    from app.core.features import churn_feature_frame, rfm_feature_frame

METRICS_PATH = os.path.join(SAVED_MODELS_DIR, "model_metrics.json")
RISK_HIGH, RISK_MEDIUM = 0.7, 0.4

_ARTIFACTS = {
    "kmeans_model": "kmeans_rfm.pkl",
    "scaler_rfm": "scaler_rfm.pkl",
    "segment_map": "segment_map.pkl",
    "churn_model": "churn_model.pkl",
    "scaler_churn": "scaler_churn.pkl",
    "churn_features": "churn_features.pkl",
}


# Giá trị mặc định cho các trường tùy chọn (đồng bộ với ChurnPredictionRequest)
_CHURN_INPUT_DEFAULTS: Dict[str, Any] = {
    "returned_orders": 0,
    "cancelled_orders": 0,
    "ad_orders": 0,
    "processing_hours_mean": None,
    "num_channels": 1,
    "tenure_days": 0.0,
    "primary_channel": "Facebook Fanpage",
    "region": "Miền Nam",
}


class ModelNotReadyError(RuntimeError):
    pass


def load_metrics() -> Optional[Dict[str, Any]]:
    if not os.path.exists(METRICS_PATH):
        return None
    with open(METRICS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


class MLModelManager:
    def __init__(self):
        self.kmeans_model = None
        self.scaler_rfm = None
        self.segment_map = None
        self.churn_model = None
        self.scaler_churn = None
        self.churn_features = None
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

    def predict_churn_risk(self, customer: Dict[str, Any]) -> dict:
        """
        Dự đoán xác suất churn từ đặc trưng hành vi thô (xem ChurnPredictionRequest).
        """
        self._ensure("churn_model", "scaler_churn", "churn_features")
        row = {**_CHURN_INPUT_DEFAULTS, **{k: v for k, v in customer.items() if v is not None}}
        if row.get("processing_hours_mean") is None:
            row["processing_hours_mean"] = float(self.inference_defaults.get("processing_hours_mean", 0.0))

        X = churn_feature_frame(pd.DataFrame([row]))[self.churn_features]
        churn_prob = float(self.churn_model.predict_proba(self.scaler_churn.transform(X))[0][1])

        if churn_prob >= RISK_HIGH:
            risk_level = "High Risk"
        elif churn_prob >= RISK_MEDIUM:
            risk_level = "Medium Risk"
        else:
            risk_level = "Low Risk"

        return {
            "churn_probability": round(churn_prob, 4),
            "churn_probability_pct": round(churn_prob * 100.0, 2),
            "churn_prediction": int(churn_prob >= 0.5),
            "risk_level": risk_level,
            "model_name": self.churn_model_name,
        }


ml_manager = MLModelManager()
