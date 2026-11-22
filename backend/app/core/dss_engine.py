"""
DSS Engine - Decision Support System Module.

Bảng luật có trọng số ưu tiên (Priority Rule Table):
  - Mỗi luật = (phân khúc áp dụng, khoảng xác suất churn, mức cảnh báo, cảnh báo, khuyến nghị).
  - Engine đánh giá TẤT CẢ luật; mức cảnh báo cuối cùng = mức CAO NHẤT trong các luật khớp
    (CRITICAL > HIGH > MEDIUM > LOW), không phụ thuộc thứ tự viết luật -> không có ghi đè ngược.
  - Cảnh báo/khuyến nghị được liệt kê theo thứ tự ưu tiên giảm dần.
"""

import unicodedata
from dataclasses import dataclass
from typing import Any, Dict, FrozenSet, List, Optional

# ---------------------------------------------------------------------------
# Mức cảnh báo
# ---------------------------------------------------------------------------
LEVEL_PRIORITY: Dict[str, int] = {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "CRITICAL": 4}

# ---------------------------------------------------------------------------
# Phân khúc: tên chuẩn đồng bộ với nhãn K-Means (backend/ml/feature_engineering.py::SEGMENT_LABELS)
# ---------------------------------------------------------------------------
VIP = "VIP"
POTENTIAL = "Tiềm năng"
NEEDS_ATTENTION = "Cần chăm sóc"
AT_RISK = "Rủi ro"
UNKNOWN = "Không xác định"
CANONICAL_SEGMENTS = (VIP, POTENTIAL, NEEDS_ATTENTION, AT_RISK)


def _fold(text: str) -> str:
    """Chuẩn hóa để so khớp: NFC, chữ thường, bỏ dấu tiếng Việt, gộp khoảng trắng/gạch dưới."""
    text = unicodedata.normalize("NFC", str(text)).strip().lower().replace("đ", "d")
    text = "".join(ch for ch in unicodedata.normalize("NFD", text) if unicodedata.category(ch) != "Mn")
    return " ".join(text.replace("_", " ").replace("-", " ").split())


_SEGMENT_ALIASES: Dict[str, str] = {
    "vip": VIP,
    "tiem nang": POTENTIAL,
    "potential": POTENTIAL,
    "can cham soc": NEEDS_ATTENTION,
    "needs attention": NEEDS_ATTENTION,
    "need attention": NEEDS_ATTENTION,
    "rui ro": AT_RISK,
    "at risk": AT_RISK,
    "risk": AT_RISK,
}


def normalize_segment(raw: Any) -> str:
    if raw is None:
        return NEEDS_ATTENTION  # giữ hành vi mặc định cũ khi không gửi phân khúc
    return _SEGMENT_ALIASES.get(_fold(raw), UNKNOWN)


def normalize_churn_pct(raw: Any) -> float:
    """Chấp nhận xác suất 0–1 hoặc phần trăm 0–100; kết quả là phần trăm trong [0, 100]."""
    value = float(raw if raw is not None else 0.0)
    pct = value * 100.0 if value <= 1.0 else value
    return min(max(pct, 0.0), 100.0)


# ---------------------------------------------------------------------------
# Bảng luật
# ---------------------------------------------------------------------------
@dataclass(frozen=True)
class Rule:
    rule_id: str
    level: str
    segments: Optional[FrozenSet[str]]  # None = mọi phân khúc
    churn_min: float
    churn_max: float
    recommendation: str
    warning: Optional[str] = None
    exclude_segments: FrozenSet[str] = frozenset()
    min_exclusive: bool = False  # True: churn > churn_min ; False: churn >= churn_min
    max_exclusive: bool = False  # True: churn < churn_max ; False: churn <= churn_max

    def matches(self, segment: str, churn_pct: float) -> bool:
        if segment in self.exclude_segments:
            return False
        if self.segments is not None and segment not in self.segments:
            return False
        above = churn_pct > self.churn_min if self.min_exclusive else churn_pct >= self.churn_min
        below = churn_pct < self.churn_max if self.max_exclusive else churn_pct <= self.churn_max
        return above and below


# Ngưỡng xác suất churn (%): HIGH = (70, 100], MEDIUM = [40, 70], LOW = [0, 40); VIP trung thành = [0, 20)
HIGH_MIN = 70.0
MEDIUM_MIN, MEDIUM_MAX = 40.0, 70.0
VIP_LOYAL_MAX = 20.0

RULES: List[Rule] = [
    Rule("R01_VIP_CRITICAL", "CRITICAL", frozenset({VIP}), HIGH_MIN, 100.0, min_exclusive=True,
         warning="Khách hàng VIP có nguy cơ rời bỏ rất cao",
         recommendation="Chuyên viên VIP liên hệ trong 24h, tặng voucher 20% và quà tri ân cá nhân hóa"),
    Rule("R02_HIGH_CHURN", "HIGH", None, HIGH_MIN, 100.0, min_exclusive=True, exclude_segments=frozenset({VIP}),
         warning="Nguy cơ rời bỏ cao",
         recommendation="Tự động gửi Voucher giảm giá 15% và liên hệ CSKH"),
    Rule("R03_AT_RISK_MEDIUM_CHURN", "HIGH", frozenset({AT_RISK}), MEDIUM_MIN, MEDIUM_MAX,
         warning="Khách hàng nhóm Rủi ro đang có dấu hiệu rời bỏ",
         recommendation="Kích hoạt chiến dịch win-back: mã giảm giá 15% kèm freeship cho đơn kế tiếp"),
    Rule("R04_AT_RISK_FLOOR", "MEDIUM", frozenset({AT_RISK}), 0.0, MEDIUM_MIN, max_exclusive=True,
         warning="Khách hàng nhóm Rủi ro (giá trị/tần suất thấp) cần được theo dõi",
         recommendation="Gửi khảo sát trải nghiệm dịch vụ & mã giảm giá 10% để kích hoạt đơn hàng thành công đầu tiên"),
    Rule("R05_VIP_DECLINING", "MEDIUM", frozenset({VIP}), 20.0, MEDIUM_MAX,
         warning="Khách hàng VIP đang giảm tần suất mua sắm",
         recommendation="Gửi quà tặng cá nhân hóa & gán Chuyên viên hỗ trợ riêng"),
    Rule("R06_POTENTIAL_DECLINING", "MEDIUM", frozenset({POTENTIAL}), MEDIUM_MIN, MEDIUM_MAX,
         warning="Khách hàng tiềm năng có dấu hiệu sụt giảm tương tác",
         recommendation="Gửi email nhắc nhở giỏ hàng kèm ưu đãi freeship"),
    Rule("R07_NEEDS_ATTENTION", "MEDIUM", frozenset({NEEDS_ATTENTION}), 0.0, MEDIUM_MAX,
         warning="Cần kích hoạt lại nhu cầu mua sắm",
         recommendation="Thực hiện khảo sát trải nghiệm dịch vụ & gửi mã giảm giá 10%"),
    Rule("R08_UNKNOWN_MEDIUM_CHURN", "MEDIUM", frozenset({UNKNOWN}), MEDIUM_MIN, MEDIUM_MAX,
         warning="Nguy cơ rời bỏ trung bình (chưa xác định phân khúc)",
         recommendation="Chạy phân cụm RFM để xác định phân khúc và theo dõi tương tác trong 14 ngày"),
    Rule("R09_VIP_LOYAL", "LOW", frozenset({VIP}), 0.0, VIP_LOYAL_MAX, max_exclusive=True,
         recommendation="Mời tham gia chương trình tri ân đặc quyền"),
    Rule("R10_POTENTIAL_GROWTH", "LOW", frozenset({POTENTIAL}), 0.0, MEDIUM_MIN, max_exclusive=True,
         recommendation="Gợi ý sản phẩm cross-sell/up-sell và tích điểm thưởng kép"),
]

DEFAULT_RECOMMENDATION = "Duy trì chăm sóc theo quy chuẩn Marketing định kỳ"


def evaluate_customer_dss(customer_info: Dict[str, Any]) -> Dict[str, Any]:
    """Đánh giá bảng luật DSS cho một khách hàng."""
    segment = normalize_segment(customer_info.get("rfm_segment"))
    churn_pct = normalize_churn_pct(customer_info.get("churn_risk", 0.0))
    customer_id = customer_info.get("customer_id") or "N/A"

    matched = sorted(
        (r for r in RULES if r.matches(segment, churn_pct)),
        key=lambda r: -LEVEL_PRIORITY[r.level],
    )

    alert_level = matched[0].level if matched else "LOW"
    warnings = [r.warning for r in matched if r.warning]
    recommendations = [r.recommendation for r in matched] or [DEFAULT_RECOMMENDATION]

    return {
        "customer_id": customer_id,
        "rfm_segment": segment,
        "churn_risk_pct": round(churn_pct, 2),
        "alert_level": alert_level,
        "warnings": warnings,
        "recommendations": recommendations,
        "matched_rules": [r.rule_id for r in matched],
    }


def evaluate_batch_dss(customers_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Xử lý quy tắc DSS cho danh sách nhiều khách hàng."""
    return [evaluate_customer_dss(cust) for cust in customers_list]


def describe_rules() -> List[Dict[str, Any]]:
    """Bảng luật DSS ở dạng đọc được (cho API /api/dss/rules, trợ lý gợi ý và báo cáo)."""
    def interval(r: Rule) -> str:
        lo = "(" if r.min_exclusive else "["
        hi = ")" if r.max_exclusive else "]"
        return f"{lo}{r.churn_min:g}%, {r.churn_max:g}%{hi}"

    out = []
    for r in RULES:
        if r.segments is None:
            seg = "Mọi phân khúc" + (f" trừ {', '.join(sorted(r.exclude_segments))}" if r.exclude_segments else "")
        else:
            seg = ", ".join(sorted(r.segments))
        out.append({
            "rule_id": r.rule_id,
            "level": r.level,
            "segments": seg,
            "churn_interval": interval(r),
            "warning": r.warning,
            "recommendation": r.recommendation,
        })
    return out
