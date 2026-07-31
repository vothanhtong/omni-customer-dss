"""
DSS Engine - Decision Support System Module
Hệ thống hỗ trợ ra quyết định dựa trên Phân khúc RFM và Xác suất Churn của khách hàng.
"""

from typing import Dict, List, Any


def evaluate_customer_dss(customer_info: Dict[str, Any]) -> Dict[str, Any]:
    """
    Hàm Engine hỗ trợ ra quyết định (DSS).
    """
    segment = str(customer_info.get("rfm_segment", "Cần chăm sóc")).strip()
    raw_churn = customer_info.get("churn_risk", 0.0)
    
    if isinstance(raw_churn, (int, float)):
        churn_risk_pct = raw_churn * 100.0 if raw_churn <= 1.0 else float(raw_churn)
    else:
        churn_risk_pct = float(raw_churn)
        
    customer_id = customer_info.get("customer_id", "N/A")

    warnings: List[str] = []
    recommendations: List[str] = []
    alert_level = "LOW"

    # --- Luật 1: Kiểm tra rủi ro Churn cao (> 70%) ---
    if churn_risk_pct > 70.0:
        alert_level = "HIGH"
        warnings.append("Nguy cơ rời bỏ cao")
        recommendations.append("Tự động gửi Voucher giảm giá 15% và liên hệ CSKH")
    
    # --- Luật 2: Kiểm tra VIP giữ chân có rủi ro thấp (< 20%) ---
    if segment.upper() == "VIP" and churn_risk_pct < 20.0:
        if alert_level != "HIGH":
            alert_level = "LOW"
        recommendations.append("Mời tham gia chương trình tri ân đặc quyền")

    # --- Luật 3: Khách hàng VIP nhưng có nguy cơ churn trung bình (20% - 70%) ---
    if segment.upper() == "VIP" and 20.0 <= churn_risk_pct <= 70.0:
        alert_level = "MEDIUM"
        warnings.append("Khách hàng VIP đang giảm tần suất mua sắm")
        recommendations.append("Gửi quà tặng cá nhân hóa & gán Chuyên viên hỗ trợ riêng")

    # --- Luật 4: Phân khúc 'Tiềm năng' ---
    if segment.upper() in ["TIỀM NĂNG", "POTENTIAL"]:
        if churn_risk_pct < 40.0:
            recommendations.append("Gợi ý sản phẩm cross-sell/up-sell và tích điểm thưởng kép")
        elif 40.0 <= churn_risk_pct <= 70.0:
            alert_level = "MEDIUM"
            warnings.append("Khách hàng tiềm năng có dấu hiệu sụt giảm tương tác")
            recommendations.append("Gửi email nhắc nhở giỏ hàng kèm ưu đãi freeship")

    # --- Luật 5: Phân khúc 'Cần chăm sóc' ---
    if segment.upper() in ["CẦN CHĂM SÓC", "NEEDS ATTENTION", "AT RISK"]:
        if churn_risk_pct <= 70.0:
            alert_level = "MEDIUM"
            warnings.append("Cần kích hoạt lại nhu cầu mua sắm")
            recommendations.append("Thực hiện khảo sát trải nghiệm dịch vụ & gửi mã giảm giá 10%")

    if not recommendations:
        recommendations.append("Duy trì chăm sóc theo quy chuẩn Marketing định kỳ")

    return {
        "customer_id": customer_id,
        "rfm_segment": segment,
        "churn_risk_pct": round(churn_risk_pct, 2),
        "alert_level": alert_level,
        "warnings": warnings,
        "recommendations": recommendations
    }


def evaluate_batch_dss(customers_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Xử lý quy tắc DSS cho danh sách nhiều khách hàng.
    """
    return [evaluate_customer_dss(cust) for cust in customers_list]
