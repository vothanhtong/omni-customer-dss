"""
Train ML Models & Generate Synthetic Dataset
- K-Means cho phân cụm RFM khách hàng
- XGBoost (GradientBoostingClassifier) cho dự đoán xác suất Churn
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import GradientBoostingClassifier

from backend.app.core.config import SAVED_MODELS_DIR


def generate_and_train():
    os.makedirs(SAVED_MODELS_DIR, exist_ok=True)
    np.random.seed(42)
    n_samples = 1000

    # 1. Tạo dữ liệu giả lập cho 1000 khách hàng
    customer_ids = [f"CUST_{1000 + i}" for i in range(n_samples)]
    
    recency = np.random.randint(1, 365, size=n_samples)
    frequency = np.random.poisson(lam=12, size=n_samples) + 1
    monetary = (frequency * np.random.uniform(200, 2500, size=n_samples) + np.random.normal(500, 100, size=n_samples)).clip(min=100)
    
    fav_channel = np.random.choice(["POS", "Website", "TMĐT"], size=n_samples, p=[0.35, 0.40, 0.25])
    support_tickets = np.random.poisson(lam=1.5, size=n_samples)
    app_logins_last_month = np.random.randint(0, 30, size=n_samples)
    days_since_last_support = np.random.randint(1, 180, size=n_samples)
    
    churn_prob_true = 1 / (1 + np.exp(-(-2.5 + 0.015 * recency - 0.1 * frequency + 0.5 * support_tickets - 0.08 * app_logins_last_month)))
    churn_target = (np.random.rand(n_samples) < churn_prob_true).astype(int)

    df = pd.DataFrame({
        "customer_id": customer_ids,
        "recency": recency,
        "frequency": frequency,
        "monetary": monetary,
        "fav_channel": fav_channel,
        "support_tickets": support_tickets,
        "app_logins_last_month": app_logins_last_month,
        "days_since_last_support": days_since_last_support,
        "churn": churn_target,
        "churn_prob": churn_prob_true
    })

    # Save synthetic dataset
    df.to_csv(os.path.join(SAVED_MODELS_DIR, "synthetic_customers.csv"), index=False)
    print("✓ Đã khởi tạo dữ liệu mẫu khách hàng (1,000 dòng).")

    # 2. Huấn luyện K-Means cho phân cụm RFM
    rfm_features = df[["recency", "frequency", "monetary"]]
    scaler_rfm = StandardScaler()
    rfm_scaled = scaler_rfm.fit_transform(rfm_features)

    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    rfm_clusters = kmeans.fit_predict(rfm_scaled)
    df["cluster"] = rfm_clusters

    cluster_means = df.groupby("cluster")[["monetary", "frequency", "recency"]].mean()
    sorted_clusters = cluster_means.sort_values(by="monetary", ascending=False).index.tolist()
    
    segment_labels = ["VIP", "Tiềm năng", "Cần chăm sóc", "Rủi ro"]
    cluster_to_label = {cluster_id: label for cluster_id, label in zip(sorted_clusters, segment_labels)}

    joblib.dump(kmeans, os.path.join(SAVED_MODELS_DIR, "kmeans_rfm.pkl"))
    joblib.dump(scaler_rfm, os.path.join(SAVED_MODELS_DIR, "scaler_rfm.pkl"))
    joblib.dump(cluster_to_label, os.path.join(SAVED_MODELS_DIR, "segment_map.pkl"))
    print("✓ Đã huấn luyện và lưu mô hình K-Means (RFM).")

    # 3. Huấn luyện XGBoost cho dự đoán Churn
    churn_features = ["recency", "frequency", "monetary", "support_tickets", "app_logins_last_month", "days_since_last_support"]
    X_churn = df[churn_features]
    y_churn = df["churn"]

    scaler_churn = StandardScaler()
    X_churn_scaled = scaler_churn.fit_transform(X_churn)

    xgb_model = GradientBoostingClassifier(
        n_estimators=100,
        max_depth=4,
        learning_rate=0.05,
        random_state=42
    )
    xgb_model.fit(X_churn_scaled, y_churn)

    joblib.dump(xgb_model, os.path.join(SAVED_MODELS_DIR, "xgb_churn.pkl"))
    joblib.dump(scaler_churn, os.path.join(SAVED_MODELS_DIR, "scaler_churn.pkl"))
    joblib.dump(churn_features, os.path.join(SAVED_MODELS_DIR, "churn_features.pkl"))
    print("✓ Đã huấn luyện và lưu mô hình XGBoost (Churn Prediction).")


if __name__ == "__main__":
    generate_and_train()
