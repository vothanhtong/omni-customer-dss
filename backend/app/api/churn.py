from datetime import datetime, timezone
from typing import Any, Dict, Optional

# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.concurrency import run_in_threadpool

try:
    from backend.app.schemas.churn import BatchPredictionResponse, ChurnPredictionRequest, ChurnPredictionResponse
    from backend.app.schemas import dump_model
    from backend.app.core.ml_models import ml_manager, ModelNotReadyError
    from backend.app.core.database import db_manager
    from backend.app.api.deps import get_current_user
    from backend.app.core.customer_store import ALERT_ORDER, mask_customer_id
    from backend.app.core.dss_engine import evaluate_customer_dss
except ImportError:
    from app.schemas.churn import BatchPredictionResponse, ChurnPredictionRequest, ChurnPredictionResponse
    from app.schemas import dump_model
    from app.core.ml_models import ml_manager, ModelNotReadyError
    from app.core.database import db_manager
    from app.api.deps import get_current_user
    from app.core.customer_store import ALERT_ORDER, mask_customer_id
    from app.core.dss_engine import evaluate_customer_dss
from backend.ml.batch_scoring import BatchInputError, aggregates_from_csv
from backend.ml.feature_engineering import CHANNEL_COUNT_COLS

router = APIRouter(prefix="/api/churn", tags=["Churn Prediction"])

@router.post("/predict", response_model=ChurnPredictionResponse)
async def predict_churn(payload: ChurnPredictionRequest):
    """
    Dự đoán xác suất Churn bằng mô hình RF/XGBoost tốt nhất (xem /api/metrics), kèm top lý do ảnh hưởng (SHAP), và lưu vào MongoDB.
    """
    try:
        res = ml_manager.predict_churn_risk(dump_model(payload))
        response_data = ChurnPredictionResponse(**res)

        # Async save to MongoDB
        await db_manager.save_churn_prediction({
            **dump_model(payload),
            **dump_model(response_data),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        return response_data
    except ModelNotReadyError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi dự đoán Churn: {str(e)}"
        )


MAX_UPLOAD_BYTES = 20 * 1024 * 1024


def _score_batch(raw: bytes, as_of: Optional[datetime], max_items: int) -> Dict[str, Any]:
    """Phần tính toán nặng (chạy trong threadpool): CSV -> đặc trưng -> mô hình -> DSS."""
    import pandas as pd

    agg, report = aggregates_from_csv(raw, pd.Timestamp(as_of) if as_of else None)
    scored = ml_manager.score_aggregates(agg, top_k=3, explain_limit=None)

    dss = [
        evaluate_customer_dss({"rfm_segment": seg, "churn_risk": float(p)})
        for seg, p in zip(scored["rfm_segment"], scored["churn_prob"])
    ]
    scored["alert_level"] = [d["alert_level"] for d in dss]
    scored["recommendation"] = [d["recommendations"][0] for d in dss]
    scored["_prio"] = scored["alert_level"].map(ALERT_ORDER)
    order = scored.sort_values(["_prio", "churn_prob"], ascending=False).index

    channel_cols = list(CHANNEL_COUNT_COLS.values())
    primary = agg[channel_cols].idxmax(axis=1).map({v: k for k, v in CHANNEL_COUNT_COLS.items()})
    items = []
    for cid in order[:max_items]:
        a, s = agg.loc[cid], scored.loc[cid]
        items.append({
            "display_id": mask_customer_id(str(cid)),
            "recency_days": round(float(a["recency_days"]), 2),
            "total_orders": int(a["total_orders"]),
            "completed_orders": int(a["completed_orders"]),
            "monetary": float(a["monetary"]),
            "primary_channel": str(primary.loc[cid]),
            "region": str(a["region"]),
            "churn_probability_pct": round(float(s["churn_prob"]) * 100, 2),
            "repurchase_probability_pct": round(float(s["repurchase_prob"]) * 100, 2),
            "risk_level": s["risk_level"],
            "rfm_segment": s["rfm_segment"],
            "alert_level": s["alert_level"],
            "recommendation": s["recommendation"],
            "top_factors": s["top_factors"],
        })

    counts = lambda col: {str(k): int(v) for k, v in scored[col].value_counts().items()}  # noqa: E731
    report.update({
        "mean_churn_probability_pct": round(float(scored["churn_prob"].mean()) * 100, 2),
        "risk_distribution": counts("risk_level"),
        "alert_distribution": counts("alert_level"),
        "segment_distribution": counts("rfm_segment"),
    })
    return {
        "model_name": ml_manager.churn_model_name,
        "summary": report,
        "items": items,
        "items_truncated": len(scored) > max_items,
    }


@router.post("/predict-batch", response_model=BatchPredictionResponse)
async def predict_churn_batch(
    file: UploadFile = File(..., description="CSV đơn hàng, cùng định dạng Cleaned_data/orders_cleaned.csv"),
    as_of: Optional[datetime] = Query(None, description="Mốc tính đặc trưng; mặc định = ngay sau đơn cuối cùng trong file"),
    max_items: int = Query(200, ge=1, le=1000, description="Số khách ưu tiên cao nhất trả về chi tiết"),
    user: Dict[str, Any] = Depends(get_current_user),
):
    """
    Dự đoán churn hàng loạt từ file đơn hàng: dùng đúng pipeline point-in-time lúc huấn luyện
    (feature_engineering -> mô hình churn + SHAP -> K-Means RFM -> DSS). File tải lên không được lưu lại;
    kết quả chỉ chứa ID đã che.
    """
    raw = await file.read(MAX_UPLOAD_BYTES + 1)
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File vượt quá 20 MB.")
    if not raw.strip():
        raise HTTPException(status_code=422, detail="File rỗng.")
    try:
        result = await run_in_threadpool(_score_batch, raw, as_of, max_items)
    except BatchInputError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except ModelNotReadyError as e:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(e))

    # Nhật ký kiểm toán: chỉ số liệu tổng hợp, không có dữ liệu khách hàng
    s = result["summary"]
    await db_manager.save_batch_job({
        "triggered_by": user.get("email", "unknown"),
        "n_customers": s["n_customers"], "n_orders": s["n_orders"], "as_of": s["as_of"],
        "risk_distribution": s["risk_distribution"], "alert_distribution": s["alert_distribution"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
    })
    return result
