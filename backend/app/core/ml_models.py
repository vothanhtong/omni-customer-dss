"""
ML Model Management Module - Handles loading and inference for RFM & Churn models.
"""

import os
# pyrefly: ignore 
import joblib
# pyrefly: ignore 
import numpy as np
import pandas as pd

from backend.app.core.config import SAVED_MODELS_DIR


class MLModelManager:
    def __init__(self):
        self.kmeans_model = None
        self.scaler_rfm = None
        self.segment_map = None
        self.xgb_model = None
        self.scaler_churn = None
        self.churn_features = None

    def load_models(self):
        """Tải các mô hình ML đã huấn luyện từ saved_models/"""
        rfm_path = os.path.join(SAVED_MODELS_DIR, "kmeans_rfm.pkl")
        if not os.path.exists(rfm_path):
            from backend.app.core.train import generate_and_train
            generate_and_train()
            
        try:
            self.kmeans_model = joblib.load(os.path.join(SAVED_MODELS_DIR, "kmeans_rfm.pkl"))
            self.scaler_rfm = joblib.load(os.path.join(SAVED_MODELS_DIR, "scaler_rfm.pkl"))
            self.segment_map = joblib.load(os.path.join(SAVED_MODELS_DIR, "segment_map.pkl"))
            self.xgb_model = joblib.load(os.path.join(SAVED_MODELS_DIR, "xgb_churn.pkl"))
            self.scaler_churn = joblib.load(os.path.join(SAVED_MODELS_DIR, "scaler_churn.pkl"))
            self.churn_features = joblib.load(os.path.join(SAVED_MODELS_DIR, "churn_features.pkl"))
            print("✓ Tải mô hình ML thành công!")
        except Exception as e:
            print(f"⚠️ Lỗi khi tải mô hình ML: {str(e)}")

    def predict_rfm_segment(self, recency: int, frequency: int, monetary: float) -> dict:
        """Dự đoán phân khúc RFM bằng K-Means (có Auto-load fallback)"""
        if self.kmeans_model is None or self.scaler_rfm is None:
            self.load_models()

        if self.kmeans_model is None:
            raise RuntimeError("Không thể nạp mô hình K-Means RFM.")

        rfm_input = pd.DataFrame([[recency, frequency, monetary]], columns=["recency", "frequency", "monetary"])
        rfm_scaled = self.scaler_rfm.transform(rfm_input)
        cluster_id = int(self.kmeans_model.predict(rfm_scaled)[0])
        segment_name = self.segment_map.get(cluster_id, "Không xác định") if self.segment_map else f"Cluster {cluster_id}"

        return {
            "cluster_id": cluster_id,
            "segment_name": segment_name
        }

    def predict_churn_risk(
        self,
        recency: int,
        frequency: int,
        monetary: float,
        support_tickets: int,
        app_logins_last_month: int,
        days_since_last_support: int
    ) -> dict:
        """Dự đoán xác suất Churn bằng XGBoost (có Auto-load fallback)"""
        if self.xgb_model is None or self.scaler_churn is None or self.churn_features is None:
            self.load_models()

        if self.xgb_model is None:
            raise RuntimeError("Không thể nạp mô hình XGBoost Churn.")

        input_data = pd.DataFrame([[
            recency, frequency, monetary, support_tickets, app_logins_last_month, days_since_last_support
        ]], columns=self.churn_features)

        input_scaled = self.scaler_churn.transform(input_data)
        churn_prob = float(self.xgb_model.predict_proba(input_scaled)[0][1])
        churn_prediction = int(self.xgb_model.predict(input_scaled)[0])

        if churn_prob >= 0.7:
            risk_level = "High Risk"
        elif churn_prob >= 0.4:
            risk_level = "Medium Risk"
        else:
            risk_level = "Low Risk"

        return {
            "churn_probability": round(churn_prob, 4),
            "churn_probability_pct": round(churn_prob * 100.0, 2),
            "churn_prediction": churn_prediction,
            "risk_level": risk_level
        }


ml_manager = MLModelManager()
