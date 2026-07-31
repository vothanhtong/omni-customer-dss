"""
Kịch Bản Huấn Luyện, Tối Ưu Siêu Tham Số (GridSearchCV) & Đánh Giá Mô Hình ML
Đề tài: "Xây dựng hệ thống hỗ trợ ra quyết định phân tích và dự đoán hành vi khách hàng trong bán hàng đa kênh"

Các nội dung thực hiện:
1. Phân cụm RFM (K-Means) & Vẽ biểu đồ Elbow xác định K tối ưu.
2. Mô hình Churn: Baseline (Logistic Regression, Decision Tree) & Nâng cao (Random Forest, XGBoost).
3. Tối ưu mô hình: GridSearchCV cho Random Forest & XGBoost.
4. Đánh giá 5-Fold Cross Validation: Accuracy, Precision, Recall, F1-Score, ROC-AUC.
5. Xuất bảng so sánh tổng hợp & Vẽ biểu đồ Confusion Matrix, ROC Curve bằng Seaborn/Matplotlib.
"""

import os
import joblib
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate, GridSearchCV
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    confusion_matrix, roc_curve, auc
)

# Cấu hình giao diện đồ họa Seaborn & Matplotlib
sns.set_theme(style="whitegrid", palette="muted")
plt.rcParams.update({'font.sans-serif': 'DejaVu Sans', 'font.size': 10, 'figure.dpi': 300})

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PLOTS_DIR = os.path.join(BASE_DIR, "saved_models", "plots")
os.makedirs(PLOTS_DIR, exist_ok=True)


# ==============================================================================
# BƯỚC 1: SINH DỮ LIỆU GIẢ LẬP HÀNH VI KHÁCH HÀNG ĐA KÊNH
# ==============================================================================
def load_or_generate_dataset(n_samples=1000, random_state=42):
    np.random.seed(random_state)
    customer_ids = [f"CUST_{1000 + i}" for i in range(n_samples)]
    
    recency = np.random.randint(1, 365, size=n_samples)
    frequency = np.random.poisson(lam=12, size=n_samples) + 1
    monetary = (frequency * np.random.uniform(200, 2500, size=n_samples) + np.random.normal(500, 100, size=n_samples)).clip(min=100)
    
    fav_channel = np.random.choice(["POS", "Website", "TMĐT"], size=n_samples, p=[0.35, 0.40, 0.25])
    support_tickets = np.random.poisson(lam=1.5, size=n_samples)
    app_logins_last_month = np.random.randint(0, 30, size=n_samples)
    days_since_last_support = np.random.randint(1, 180, size=n_samples)
    
    logit = -2.2 + 0.012 * recency - 0.08 * frequency + 0.45 * support_tickets - 0.09 * app_logins_last_month
    churn_prob = 1 / (1 + np.exp(-logit))
    churn_target = (np.random.rand(n_samples) < churn_prob).astype(int)

    df = pd.DataFrame({
        "customer_id": customer_ids,
        "recency": recency,
        "frequency": frequency,
        "monetary": monetary,
        "fav_channel": fav_channel,
        "support_tickets": support_tickets,
        "app_logins_last_month": app_logins_last_month,
        "days_since_last_support": days_since_last_support,
        "churn": churn_target
    })
    return df


# ==============================================================================
# BƯỚC 2: PHÂN CỤM RFM BẰNG K-MEANS & PHƯƠNG PHÁP ELBOW
# ==============================================================================
def perform_rfm_elbow_clustering(df):
    print("\n--- 1. PHÂN CỤM RFM VÀ PHƯƠNG PHÁP ELBOW ---")
    rfm_features = df[["recency", "frequency", "monetary"]]
    scaler_rfm = StandardScaler()
    rfm_scaled = scaler_rfm.fit_transform(rfm_features)

    # Tính toán Inertia (SSE) cho K từ 1 đến 10
    sse = []
    k_range = range(1, 11)
    for k in k_range:
        kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
        kmeans.fit(rfm_scaled)
        sse.append(kmeans.inertia_)

    # Vẽ biểu đồ Elbow
    plt.figure(figsize=(8, 5))
    plt.plot(k_range, sse, marker='o', linestyle='--', color='#6366f1', linewidth=2, markersize=8)
    plt.title("Phuong Phap Elbow Tim So Cum K Toi Uu cho RFM", fontsize=12, fontweight='bold')
    plt.xlabel("So Cum (K)", fontsize=11)
    plt.ylabel("Trong Cum Tong Binh Phuong Sai So (SSE / Inertia)", fontsize=11)
    plt.axvline(x=4, color='#f43f5e', linestyle=':', label='K Toi Uu = 4')
    plt.legend()
    plt.tight_layout()
    elbow_plot_path = os.path.join(PLOTS_DIR, "elbow_rfm.png")
    plt.savefig(elbow_plot_path)
    plt.close()
    print(f"✓ Da ve va luu bieu do Elbow tai: {elbow_plot_path}")

    # Phân cụm chính thức với K = 4
    optimal_k = 4
    kmeans_opt = KMeans(n_clusters=optimal_k, random_state=42, n_init=10)
    df["rfm_cluster"] = kmeans_opt.fit_predict(rfm_scaled)
    
    # Gán nhãn nghiệp vụ
    cluster_means = df.groupby("rfm_cluster")[["monetary", "frequency", "recency"]].mean()
    sorted_clusters = cluster_means.sort_values(by="monetary", ascending=False).index.tolist()
    labels = ["VIP", "Tiem nang", "Can cham soc", "Rui ro"]
    cluster_map = {cid: lbl for cid, lbl in zip(sorted_clusters, labels)}
    df["rfm_segment"] = df["rfm_cluster"].map(cluster_map)

    print(" Thong ke phan cum khach hang RFM (K=4):")
    print(df["rfm_segment"].value_counts())
    return df, kmeans_opt, scaler_rfm, cluster_map


# ==============================================================================
# BƯỚC 3: XÂY DỰNG, TUNING SIÊU THAM SỐ (GRIDSEARCHCV) VÀ ĐÁNH GIÁ MÔ HÌNH CHURN
# ==============================================================================
def train_evaluate_churn_models(df):
    print("\n--- 2. HUẤN LUYỆN, TUNING GRIDSEARCHCV VÀ ĐÁNH GIÁ MÔ HÌNH CHURN ---")
    feature_cols = ["recency", "frequency", "monetary", "support_tickets", "app_logins_last_month", "days_since_last_support"]
    X = df[feature_cols]
    y = df["churn"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    X_scaled_all = scaler.transform(X)

    # 1. Baseline 1: Logistic Regression
    lr = LogisticRegression(random_state=42)
    lr.fit(X_train_scaled, y_train)

    # 2. Baseline 2: Decision Tree
    dt = DecisionTreeClassifier(max_depth=5, random_state=42)
    dt.fit(X_train_scaled, y_train)

    # 3. Nâng cao 1: Random Forest + GridSearchCV Tuning
    print("⚡ Dang tinh chinh sieu tham so cho Random Forest...")
    rf_base = RandomForestClassifier(random_state=42)
    param_grid_rf = {
        'n_estimators': [50, 100],
        'max_depth': [3, 5, 8],
        'min_samples_split': [2, 5]
    }
    grid_rf = GridSearchCV(rf_base, param_grid_rf, cv=5, scoring='roc_auc')
    grid_rf.fit(X_train_scaled, y_train)
    rf_best = grid_rf.best_estimator_
    print(f"  Best Params Random Forest: {grid_rf.best_params_}")

    # 4. Nâng cao 2: XGBoost (Gradient Boosting) + GridSearchCV Tuning
    print("⚡ Dang tinh chinh sieu tham so cho XGBoost (Gradient Boosting)...")
    xgb_base = GradientBoostingClassifier(random_state=42)
    param_grid_xgb = {
        'n_estimators': [50, 100],
        'max_depth': [3, 4],
        'learning_rate': [0.05, 0.1],
        'subsample': [0.8, 1.0]
    }
    grid_xgb = GridSearchCV(xgb_base, param_grid_xgb, cv=5, scoring='roc_auc')
    grid_xgb.fit(X_train_scaled, y_train)
    xgb_best = grid_xgb.best_estimator_
    print(f"  Best Params XGBoost: {grid_xgb.best_params_}")

    models = {
        "Logistic Regression": (lr, True),
        "Decision Tree": (dt, True),
        "Random Forest (Tuned)": (rf_best, True),
        "XGBoost (Tuned)": (xgb_best, True)
    }

    # Bảng đánh giá tổng hợp với 5-Fold Cross Validation
    cv_strat = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    metrics_list = []

    for name, (model, requires_scale) in models.items():
        X_tr = X_train_scaled if requires_scale else X_train
        X_te = X_test_scaled if requires_scale else X_test
        X_all = X_scaled_all if requires_scale else X

        y_pred = model.predict(X_te)
        y_prob = model.predict_proba(X_te)[:, 1]

        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        auc_score = roc_auc_score(y_test, y_prob)

        cv_res = cross_validate(model, X_all, y, cv=cv_strat, scoring=['accuracy', 'precision', 'recall', 'f1', 'roc_auc'])
        cv_auc_mean = cv_res['test_roc_auc'].mean()
        cv_f1_mean = cv_res['test_f1'].mean()

        metrics_list.append({
            "Mô hình": name,
            "Accuracy": round(acc, 4),
            "Precision": round(prec, 4),
            "Recall": round(rec, 4),
            "F1-Score": round(f1, 4),
            "ROC-AUC (Test)": round(auc_score, 4),
            "5-Fold CV ROC-AUC": round(cv_auc_mean, 4),
            "5-Fold CV F1": round(cv_f1_mean, 4)
        })

    results_df = pd.DataFrame(metrics_list).sort_values(by="ROC-AUC (Test)", ascending=False)
    print("\n--- BẢNG SO SÁNH TỔNG HỢP CÁC MÔ HÌNH CHURN ---")
    print(results_df.to_string(index=False))

    # ==========================================================================
    # BƯỚC 4: TRỰC QUAN HÓA CONFUSION MATRIX & ROC CURVES (SEABORN/MATPLOTLIB)
    # ==========================================================================
    fig, axes = plt.subplots(2, 2, figsize=(12, 10))
    axes = axes.flatten()

    for idx, (name, (model, requires_scale)) in enumerate(models.items()):
        X_te = X_test_scaled if requires_scale else X_test
        y_pred = model.predict(X_te)
        cm = confusion_matrix(y_test, y_pred)

        sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axes[idx], cbar=False,
                    annot_kws={"size": 14, "weight": "bold"})
        axes[idx].set_title(f"Confusion Matrix: {name}", fontsize=11, fontweight='bold')
        axes[idx].set_xlabel("Nhan Du Doan (0: Retain, 1: Churn)", fontsize=9)
        axes[idx].set_ylabel("Nhan Thuc Te", fontsize=9)

    plt.tight_layout()
    cm_path = os.path.join(PLOTS_DIR, "confusion_matrices.png")
    plt.savefig(cm_path)
    plt.close()
    print(f"✓ Da ve va luu Confusion Matrices tai: {cm_path}")

    # 2. Vẽ ROC Curve kết hợp trên cùng 1 biểu đồ
    plt.figure(figsize=(9, 6))
    colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']

    for (name, (model, requires_scale)), color in zip(models.items(), colors):
        X_te = X_test_scaled if requires_scale else X_test
        y_prob = model.predict_proba(X_te)[:, 1]
        fpr, tpr, _ = roc_curve(y_test, y_prob)
        roc_auc_val = auc(fpr, tpr)

        plt.plot(fpr, tpr, color=color, lw=2.5, label=f'{name} (AUC = {roc_auc_val:.4f})')

    plt.plot([0, 1], [0, 1], color='navy', lw=1.5, linestyle='--', label='Random Guess')
    plt.xlim([0.0, 1.0])
    plt.ylim([0.0, 1.05])
    plt.xlabel('False Positive Rate (1 - Specificity)', fontsize=11)
    plt.ylabel('True Positive Rate (Sensitivity / Recall)', fontsize=11)
    plt.title('So Sanh Duong Cong ROC Curve Cac Mo Hinh Du Doan Churn', fontsize=12, fontweight='bold')
    plt.legend(loc="lower right", fontsize=10)
    plt.tight_layout()
    roc_path = os.path.join(PLOTS_DIR, "roc_curves.png")
    plt.savefig(roc_path)
    plt.close()
    print(f"✓ Da ve va luu ROC Curves tai: {roc_path}")

    return results_df


if __name__ == "__main__":
    print("🚀 Bắt đầu kịch bản huấn luyện & đánh giá thực nghiệm Machine Learning...")
    df_raw = load_or_generate_dataset()
    df_rfm, kmeans_opt, scaler_rfm, cluster_map = perform_rfm_elbow_clustering(df_raw)
    results_table = train_evaluate_churn_models(df_rfm)
    print("\n✅ HOÀN THÀNH KỊCH BẢN THỰC NGHIỆM ML THÀNH CÔNG!")
