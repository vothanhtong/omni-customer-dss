import pytest

from backend.app.core.dss_engine import (
    AT_RISK,
    LEVEL_PRIORITY,
    NEEDS_ATTENTION,
    POTENTIAL,
    RULES,
    UNKNOWN,
    VIP,
    evaluate_batch_dss,
    evaluate_customer_dss,
    normalize_churn_pct,
    normalize_segment,
)
from backend.ml.feature_engineering import SEGMENT_LABELS

SEGMENTS = [VIP, POTENTIAL, NEEDS_ATTENTION, AT_RISK, UNKNOWN]
# Phủ toàn bộ biên ngưỡng: 0, <20, 20, <40, 40, giữa, 70, >70, 100
CHURN_GRID = [0.0, 10.0, 19.99, 20.0, 30.0, 39.99, 40.0, 55.0, 70.0, 70.01, 85.0, 100.0]


def expected_level(segment: str, churn: float) -> str:
    """Bảng kỳ vọng viết độc lập với engine."""
    high = churn > 70
    medium = 40 <= churn <= 70
    if segment == VIP:
        return "CRITICAL" if high else ("MEDIUM" if churn >= 20 else "LOW")
    if segment == AT_RISK:
        return "HIGH" if (high or medium) else "MEDIUM"
    if segment == NEEDS_ATTENTION:
        return "HIGH" if high else "MEDIUM"
    # Tiềm năng & Không xác định
    return "HIGH" if high else ("MEDIUM" if medium else "LOW")


@pytest.mark.parametrize("segment", SEGMENTS)
@pytest.mark.parametrize("churn", CHURN_GRID)
def test_alert_level_full_grid(segment, churn):
    res = evaluate_customer_dss({"rfm_segment": segment, "churn_risk": churn, "customer_id": "C1"})
    assert res["alert_level"] == expected_level(segment, churn)
    assert res["rfm_segment"] == segment
    assert res["churn_risk_pct"] == round(churn, 2)
    assert res["recommendations"], "luôn phải có ít nhất 1 khuyến nghị"


@pytest.mark.parametrize("segment", SEGMENTS)
@pytest.mark.parametrize("churn", CHURN_GRID)
def test_alert_level_is_max_of_matched_rules(segment, churn):
    res = evaluate_customer_dss({"rfm_segment": segment, "churn_risk": churn})
    rules = {r.rule_id: r for r in RULES}
    if res["matched_rules"]:
        top = max(LEVEL_PRIORITY[rules[i].level] for i in res["matched_rules"])
        assert LEVEL_PRIORITY[res["alert_level"]] == top
        # danh sách luật được sắp theo ưu tiên giảm dần
        levels = [LEVEL_PRIORITY[rules[i].level] for i in res["matched_rules"]]
        assert levels == sorted(levels, reverse=True)
    else:
        assert res["alert_level"] == "LOW"


@pytest.mark.parametrize("churn", CHURN_GRID)
def test_at_risk_never_low(churn):
    res = evaluate_customer_dss({"rfm_segment": "Rủi ro", "churn_risk": churn})
    assert LEVEL_PRIORITY[res["alert_level"]] >= LEVEL_PRIORITY["MEDIUM"]
    assert res["warnings"]


def test_regression_at_risk_low_churn_was_low():
    """Lỗi cũ: 'Rủi ro' + churn < 70% bị trả về LOW với khuyến nghị mặc định."""
    res = evaluate_customer_dss({"rfm_segment": "Rủi ro", "churn_risk": 0.3})
    assert res["alert_level"] == "MEDIUM"
    assert "R04_AT_RISK_FLOOR" in res["matched_rules"]


def test_vip_high_churn_is_critical_and_not_downgraded():
    res = evaluate_customer_dss({"rfm_segment": "VIP", "churn_risk": 0.9})
    assert res["alert_level"] == "CRITICAL"
    assert res["matched_rules"][0] == "R01_VIP_CRITICAL"


def test_default_recommendation_when_no_rule():
    res = evaluate_customer_dss({"rfm_segment": "abc", "churn_risk": 0.1})
    assert res["rfm_segment"] == UNKNOWN
    assert res["alert_level"] == "LOW"
    assert res["matched_rules"] == []
    assert res["recommendations"] == ["Duy trì chăm sóc theo quy chuẩn Marketing định kỳ"]


@pytest.mark.parametrize("raw,expected", [
    ("VIP", VIP), ("vip", VIP), (" Vip ", VIP),
    ("Tiềm năng", POTENTIAL), ("TIỀM NĂNG", POTENTIAL), ("tiem nang", POTENTIAL), ("Potential", POTENTIAL),
    ("Cần chăm sóc", NEEDS_ATTENTION), ("can_cham_soc", NEEDS_ATTENTION), ("Needs Attention", NEEDS_ATTENTION),
    ("Rủi ro", AT_RISK), ("RỦI RO", AT_RISK), ("rui ro", AT_RISK), ("AT RISK", AT_RISK), ("at-risk", AT_RISK),
    ("xyz", UNKNOWN), (None, NEEDS_ATTENTION),
])
def test_normalize_segment(raw, expected):
    assert normalize_segment(raw) == expected


def test_kmeans_labels_are_all_known_to_dss():
    """Mọi nhãn K-Means sinh ra phải được DSS nhận diện (không rơi vào 'Không xác định')."""
    for label in SEGMENT_LABELS:
        assert normalize_segment(label) == label


@pytest.mark.parametrize("raw,expected", [
    (0, 0.0), (0.0, 0.0), (0.4, 40.0), (0.75, 75.0), (1.0, 100.0), (1.5, 1.5), (55, 55.0), (100, 100.0), (150, 100.0), (-5, 0.0), (None, 0.0),
])
def test_normalize_churn_pct(raw, expected):
    assert normalize_churn_pct(raw) == pytest.approx(expected)


def test_probability_and_percent_inputs_are_equivalent():
    a = evaluate_customer_dss({"rfm_segment": "Tiềm năng", "churn_risk": 0.55})
    b = evaluate_customer_dss({"rfm_segment": "Tiềm năng", "churn_risk": 55})
    assert a["alert_level"] == b["alert_level"] == "MEDIUM"
    assert a["recommendations"] == b["recommendations"]


def test_batch_matches_single():
    items = [{"rfm_segment": s, "churn_risk": c, "customer_id": f"C{i}"} for i, (s, c) in enumerate(
        [(seg, ch) for seg in SEGMENTS for ch in (5, 50, 90)])]
    assert evaluate_batch_dss(items) == [evaluate_customer_dss(x) for x in items]
