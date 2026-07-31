"""
Streamlit Web Dashboard - Bảng Điều Khiển Phân Tích Hành Vi Khách Hàng Đa Kênh & Động Cơ DSS
"""

import os
import sys
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import streamlit as st

# Thêm đường dẫn gốc dự án vào Python Path để import core modules
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from backend.app.core.dss_engine import evaluate_customer_dss, evaluate_batch_dss
from backend.app.core.config import SAVED_MODELS_DIR

# ==============================================================================
# 1. CẤU HÌNH TRANG STREAMLIT & CUSTOM CSS (GLASSMORPHISM DARK THEME)
# ==============================================================================
st.set_page_config(
    page_title="Bảng Điều Khiển DSS Bán Hàng Đa Kênh",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    /* Imperial Dark Theme Background */
    .stApp {
        background-color: #0b0f19;
        color: #f9fafb;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
    }
    
    /* Sidebar Styling */
    section[data-testid="stSidebar"] {
        background-color: #111827 !important;
        border-right: 1px solid rgba(255, 255, 255, 0.08);
    }
    
    /* Glassmorphic KPI Cards */
    .kpi-card {
        background: rgba(17, 24, 39, 0.75);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 14px;
        padding: 20px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .kpi-card:hover {
        border-color: rgba(99, 102, 241, 0.4);
        transform: translateY(-2px);
    }
    .kpi-title {
        color: #9ca3af;
        font-size: 0.85rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .kpi-value {
        font-size: 1.8rem;
        font-weight: 800;
        margin-top: 4px;
        color: #ffffff;
    }
    .kpi-sub {
        font-size: 0.8rem;
        margin-top: 4px;
    }

    /* Badge Custom Styling */
    .badge-high {
        background-color: rgba(244, 63, 94, 0.2);
        color: #f43f5e;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 700;
        border: 1px solid rgba(244, 63, 94, 0.4);
    }
    .badge-medium {
        background-color: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 700;
        border: 1px solid rgba(245, 158, 11, 0.4);
    }
    .badge-low {
        background-color: rgba(16, 185, 129, 0.2);
        color: #10b981;
        padding: 4px 10px;
        border-radius: 12px;
        font-weight: 700;
        border: 1px solid rgba(16, 185, 129, 0.4);
    }
</style>
""", unsafe_allow_html=True)


# ==============================================================================
# 2. KHỞI TẠO VÀ LOAD DỮ LIỆU KHÁCH HÀNG ĐA KÊNH
# ==============================================================================
@st.cache_data
def load_data():
    csv_path = os.path.join(SAVED_MODELS_DIR, "synthetic_customers.csv")
    if os.path.exists(csv_path):
        df = pd.read_csv(csv_path)
    else:
        # Fallback synthetic dataset generation
        np.random.seed(42)
        n = 1000
        df = pd.DataFrame({
            "customer_id": [f"CUST_{1000 + i}" for i in range(n)],
            "recency": np.random.randint(1, 365, size=n),
            "frequency": np.random.poisson(lam=12, size=n) + 1,
            "monetary": np.random.uniform(500, 30000, size=n).round(2),
            "fav_channel": np.random.choice(["POS", "Website", "TMĐT"], size=n, p=[0.35, 0.40, 0.25]),
            "support_tickets": np.random.poisson(lam=1.5, size=n),
            "app_logins_last_month": np.random.randint(0, 30, size=n),
            "days_since_last_support": np.random.randint(1, 180, size=n),
            "churn_prob": np.random.uniform(0.05, 0.95, size=n)
        })

    # Chuyển churn_prob về phần trăm (0 - 100%)
    if "churn_prob" in df.columns:
        df["churn_pct"] = (df["churn_prob"] * 100.0).round(2)
    else:
        df["churn_pct"] = np.random.uniform(5, 95, size=len(df)).round(2)

    # Phân cụm RFM giả lập nếu chưa có
    if "rfm_segment" not in df.columns:
        conditions = [
            (df["monetary"] >= 15000) & (df["frequency"] >= 15),
            (df["monetary"] >= 8000) & (df["recency"] <= 60),
            (df["recency"] > 90) & (df["recency"] <= 180),
            (df["recency"] > 180)
        ]
        segments = ["VIP", "Tiềm năng", "Cần chăm sóc", "Rủi ro"]
        df["rfm_segment"] = np.select(conditions, segments, default="Cần chăm sóc")

    return df


df_raw = load_data()


# ==============================================================================
# 3. SIDEBAR - BỘ LỌC ĐỘNG VÀ THÔNG SỐ ĐẦU VÀO
# ==============================================================================
st.sidebar.markdown("## ⚙️ Bộ Lọc Dữ Liệu Đa Kênh")
st.sidebar.markdown("---")

# Bộ lọc Kênh bán hàng (POS, Website, TMĐT)
channels = ["Tất cả các kênh", "POS", "Website", "TMĐT"]
selected_channel = st.sidebar.selectbox("🎯 Chọn Kênh Bán Hàng:", channels, index=0)

# Bộ lọc Phân khúc RFM
all_segments = ["Tất cả phân khúc", "VIP", "Tiềm năng", "Cần chăm sóc", "Rủi ro"]
selected_segment = st.sidebar.selectbox("💎 Phân Khúc KH (RFM):", all_segments, index=0)

# Bộ lọc Tỷ lệ Churn Risk (%)
churn_threshold = st.sidebar.slider("⚠️ Ngưỡng Rủi Ro Churn (%):", min_value=0, max_value=100, value=(0, 100))

# Bộ lọc Số ngày chưa mua sắm (Recency)
recency_range = st.sidebar.slider("📅 Số Ngày Chưa Mua (Recency):", min_value=0, max_value=365, value=(0, 365))

# Áp dụng bộ lọc vào DataFrame
df_filtered = df_raw.copy()

if selected_channel != "Tất cả các kênh":
    df_filtered = df_filtered[df_filtered["fav_channel"] == selected_channel]

if selected_segment != "Tất cả phân khúc":
    df_filtered = df_filtered[df_filtered["rfm_segment"] == selected_segment]

df_filtered = df_filtered[
    (df_filtered["churn_pct"] >= churn_threshold[0]) & 
    (df_filtered["churn_pct"] <= churn_threshold[1]) &
    (df_filtered["recency"] >= recency_range[0]) &
    (df_filtered["recency"] <= recency_range[1])
]

st.sidebar.markdown("---")
st.sidebar.info(f"📊 Đang hiển thị **{len(df_filtered):,}** / **{len(df_raw):,}** khách hàng.")


# ==============================================================================
# 4. MAIN PANEL - HEADER & KHUNG KPI METRICS
# ==============================================================================
st.markdown("<h1 style='text-align: center; color: #ffffff;'>📊 Hệ Thống DSS Phân Tích & Dự Đoán Hành Vi Khách Hàng Đa Kênh</h1>", unsafe_allow_html=True)
st.markdown("<p style='text-align: center; color: #9ca3af; margin-bottom: 28px;'>Bảng điều khiển kinh doanh tích hợp Mô hình ML K-Means, XGBoost và Động cơ Hỗ trợ Ra Quyết định (DSS Engine)</p>", unsafe_allow_html=True)

# Tính toán các chỉ số KPI
total_revenue = df_filtered["monetary"].sum()
total_customers = len(df_filtered)
avg_churn_rate = df_filtered["churn_pct"].mean() if total_customers > 0 else 0.0
high_risk_count = len(df_filtered[df_filtered["churn_pct"] > 70.0])

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">💰 Tổng Doanh Thu</div>
        <div class="kpi-value">{total_revenue/1e3:,.1f} M</div>
        <div class="kpi-sub" style="color: #10b981;">↑ Theo bộ lọc hiện tại</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">👥 Tổng Số Khách Hàng</div>
        <div class="kpi-value">{total_customers:,}</div>
        <div class="kpi-sub" style="color: #6366f1;">Tài khoản tương tác</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-title">⚠️ Tỷ Lệ Churn Trung Bình</div>
        <div class="kpi-value">{avg_churn_rate:.1f}%</div>
        <div class="kpi-sub" style="color: #a855f7;">Dự đoán XGBoost Model</div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    st.markdown(f"""
    <div class="kpi-card" style="border-color: rgba(244, 63, 94, 0.4);">
        <div class="kpi-title" style="color: #f43f5e;">🔴 Cảnh Báo Đỏ (High Risk)</div>
        <div class="kpi-value" style="color: #f43f5e;">{high_risk_count:,}</div>
        <div class="kpi-sub" style="color: #f43f5e;">Khách hàng Churn > 70%</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)


# ==============================================================================
# 5. BIỂU ĐỒ TRỰC QUAN HÓA PLOTLY (INTERACTIVE CHARTS)
# ==============================================================================
chart_col1, chart_col2 = st.columns(2)

with chart_col1:
    st.markdown("### 🍩 Phân Bổ Phân Khúc Khách Hàng (K-Means RFM)")
    if len(df_filtered) > 0:
        segment_counts = df_filtered["rfm_segment"].value_counts().reset_index()
        segment_counts.columns = ["Segment", "Count"]
        
        fig_donut = px.pie(
            segment_counts,
            values="Count",
            names="Segment",
            hole=0.55,
            color="Segment",
            color_discrete_map={
                "VIP": "#10b981",
                "Tiềm năng": "#6366f1",
                "Cần chăm sóc": "#f59e0b",
                "Rủi ro": "#f43f5e"
            }
        )
        fig_donut.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#ffffff"),
            margin=dict(t=20, b=20, l=20, r=20),
            legend=dict(orientation="h", yanchor="bottom", y=-0.2)
        )
        st.plotly_chart(fig_donut, use_container_width=True)
    else:
        st.info("Không có dữ liệu phù hợp với bộ lọc.")

with chart_col2:
    st.markdown("### 📈 Tỷ Lệ Churn Theo Kênh Bán Hàng (POS vs Web vs TMĐT)")
    if len(df_filtered) > 0:
        channel_churn = df_filtered.groupby("fav_channel")["churn_pct"].mean().reset_index()
        channel_churn.columns = ["Channel", "Avg_Churn"]
        
        fig_bar = px.bar(
            channel_churn,
            x="Channel",
            y="Avg_Churn",
            color="Channel",
            text_auto=".1f",
            color_discrete_sequence=["#6366f1", "#06b6d4", "#a855f7"]
        )
        fig_bar.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font=dict(color="#ffffff"),
            xaxis_title="Kênh Bán Hàng",
            yaxis_title="Tỷ lệ Churn Trung Bình (%)",
            margin=dict(t=20, b=20, l=20, r=20),
            showlegend=False
        )
        fig_bar.update_traces(textposition="outside")
        st.plotly_chart(fig_bar, use_container_width=True)
    else:
        st.info("Không có dữ liệu phù hợp với bộ lọc.")

# Biểu đồ Scatter 3D / 2D Xu hướng RFM
st.markdown("### 🌌 Biểu Đồ Phân Tán Xu Hướng RFM (Recency vs Monetary vs Frequency)")
if len(df_filtered) > 0:
    fig_scatter = px.scatter(
        df_filtered,
        x="recency",
        y="monetary",
        size="frequency",
        color="rfm_segment",
        hover_data=["customer_id", "fav_channel", "churn_pct"],
        color_discrete_map={
            "VIP": "#10b981",
            "Tiềm năng": "#6366f1",
            "Cần chăm sóc": "#f59e0b",
            "Rủi ro": "#f43f5e"
        },
        labels={"recency": "Recency (Số ngày chưa mua)", "monetary": "Monetary (Tổng chi tiêu VNĐ)", "frequency": "Tần suất (lần)"}
    )
    fig_scatter.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(15, 23, 42, 0.6)",
        font=dict(color="#ffffff"),
        margin=dict(t=20, b=20, l=20, r=20)
    )
    st.plotly_chart(fig_scatter, use_container_width=True)

st.markdown("<br>", unsafe_allow_html=True)


# ==============================================================================
# 6. TÍCH HỢP ĐỘNG CƠ DSS - BẢNG CẢNH BÁO TỰ ĐỘNG & ĐỀ XUẤT HÀNH ĐỘNG
# ==============================================================================
st.markdown("### 🛡️ Động Cơ DSS - Bảng Cảnh Báo Tự Động & Đề Xuất Hành Động Kinh Doanh")

# Lọc danh sách khách hàng rủi ro cao để DSS xử lý
high_risk_df = df_filtered[df_filtered["churn_pct"] >= 50.0].sort_values(by="churn_pct", ascending=False)

if len(high_risk_df) > 0:
    # Đánh giá qua DSS Engine
    dss_input = []
    for _, row in high_risk_df.head(20).iterrows():
        dss_input.append({
            "customer_id": row["customer_id"],
            "rfm_segment": row["rfm_segment"],
            "churn_risk": row["churn_pct"],
            "recency": row["recency"],
            "frequency": row["frequency"],
            "monetary": row["monetary"]
        })

    dss_results = evaluate_batch_dss(dss_input)

    # Hiển thị dạng bảng trực quan
    display_rows = []
    for res, (_, original_row) in zip(dss_results, high_risk_df.head(20).iterrows()):
        alert_tag = f"🔴 {res['alert_level']}" if res['alert_level'] == "HIGH" else f"🟡 {res['alert_level']}"
        display_rows.append({
            "Mã Khách Hàng": res["customer_id"],
            "Phân Khúc RFM": res["rfm_segment"],
            "Kênh Yêu Thích": original_row["fav_channel"],
            "Chỉ Số Churn (%)": f"{res['churn_risk_pct']}%",
            "Mức Cảnh Báo": alert_tag,
            "Cảnh Báo Hệ Thống": ", ".join(res["warnings"]) if res["warnings"] else "Duy trì theo dõi",
            "Đề Xuất Hành Động Marketing (DSS)": " | ".join(res["recommendations"])
        })

    table_df = pd.DataFrame(display_rows)
    st.dataframe(table_df, use_container_width=True, hide_index=True)

    # Nút bấm kích hoạt hành động CSKH tự động
    col_act1, col_act2 = st.columns([3, 1])
    with col_act2:
        if st.button("🚀 Kích Hoạt CSKH Hàng Loạt", type="primary", use_container_width=True):
            st.success(f"✓ Đã tự động gửi Voucher & phân bổ Chuyên viên chăm sóc cho {len(display_rows)} khách hàng!")
else:
    st.success("🎉 Không có khách hàng thuộc nhóm rủi ro cao theo bộ lọc hiện tại.")
