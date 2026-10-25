from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
import pandas as pd
import numpy as np

from .data_loader import EnergyDataLoader
from .metrics import compute_error_statistics, compute_histogram_bins
from .config import DEFAULT_GATE_CLOSURE_TIME

router = APIRouter(prefix="/api")

class SimulationRequest(BaseModel):
    consumer_demand_mw: float = Field(20000.0, description="Retail electricity demand to serve in MW")
    risk_percentile: int = Field(85, ge=1, le=99, description="Target statistical coverage percentile (e.g. 50, 80, 85, 90, 95)")
    date: Optional[str] = Field("2026-01-05", description="Delivery date in YYYY-MM-DD format, or leave empty for full month")
    gate_closure_time: str = Field(DEFAULT_GATE_CLOSURE_TIME, description="Day-Ahead gate closure time on D-1, e.g. 11:00 or 12:00")

    model_config = {
        "json_schema_extra": {
            "example": {
                "consumer_demand_mw": 20000.0,
                "risk_percentile": 85,
                "date": "2026-01-05",
                "gate_closure_time": "11:00"
            }
        }
    }

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "UK Day-Ahead Wind Forecast & Procurement Analytics Engine",
        "market": "UK Wholesale Electricity / Elexon BMRS",
        "period": "January 2026"
    }

@router.get("/dates")
def get_dates():
    loader = EnergyDataLoader.get_instance()
    return {"dates": loader.get_available_dates()}

@router.get("/comparison")
def get_daily_comparison(
    date: str = Query(..., description="Delivery date in YYYY-MM-DD format (e.g. 2026-01-05)"),
    gate_closure_time: str = Query(DEFAULT_GATE_CLOSURE_TIME, description="Gate closure time on D-1, e.g. 11:00 or 12:00")
):
    loader = EnergyDataLoader.get_instance()
    try:
        df = loader.get_day_ahead_comparison(date, gate_closure_time)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    metrics = compute_error_statistics(df)
    
    # Format settlement period records
    records = []
    for _, row in df.iterrows():
        records.append({
            "settlementPeriod": int(row["settlementPeriod"]),
            "targetTimeStr": row["targetTimeStr"],
            "actual_mw": None if pd.isna(row["actual_mw"]) else round(float(row["actual_mw"]), 1),
            "forecast_mw": None if pd.isna(row["forecast_mw"]) else round(float(row["forecast_mw"]), 1),
            "error_mw": None if pd.isna(row["error_mw"]) else round(float(row["error_mw"]), 1),
            "abs_error_mw": None if pd.isna(row["abs_error_mw"]) else round(float(row["abs_error_mw"]), 1),
        })

    return {
        "delivery_date": date,
        "gate_closure_time": gate_closure_time,
        "cutoff_datetime": df["cutoffDateTime"].iloc[0] if not df.empty else None,
        "latest_forecast_publish_time": df["latestForecastPublishTime"].iloc[0] if not df.empty else None,
        "metrics": metrics,
        "series": records
    }

@router.get("/month-summary")
def get_month_summary(
    gate_closure_time: str = Query(DEFAULT_GATE_CLOSURE_TIME, description="Gate closure time on D-1")
):
    loader = EnergyDataLoader.get_instance()
    dates = loader.get_available_dates()
    
    all_dfs = []
    daily_stats = []
    
    for d in dates:
        try:
            day_df = loader.get_day_ahead_comparison(d, gate_closure_time)
            all_dfs.append(day_df)
            day_metrics = compute_error_statistics(day_df)
            daily_stats.append({
                "date": d,
                "mean_actual_mw": day_metrics.get("mean_actual_mw", 0),
                "mean_forecast_mw": day_metrics.get("mean_forecast_mw", 0),
                "bias_mw": day_metrics.get("bias_mw", 0),
                "mae_mw": day_metrics.get("mae_mw", 0),
                "rmse_mw": day_metrics.get("rmse_mw", 0),
                "wape_percent": day_metrics.get("wape_percent", 0),
                "short_exposure_gbp": day_metrics.get("imbalance_risk", {}).get("short_exposure_gbp", 0),
                "total_actual_mwh": day_metrics.get("total_actual_mwh", 0),
            })
        except Exception:
            continue

    if not all_dfs:
        raise HTTPException(status_code=500, detail="Failed to load monthly dataset")

    month_df = pd.concat(all_dfs, ignore_index=True)
    overall_metrics = compute_error_statistics(month_df)

    # Histogram of errors across the full month
    histogram = compute_histogram_bins(month_df["error_mw"].values, num_bins=25)

    # Diurnal settlement period profile (SP 1 to 48)
    sp_profile = []
    for sp, group in month_df.groupby("settlementPeriod"):
        sp_time = group["targetTimeStr"].iloc[0]
        sp_profile.append({
            "settlementPeriod": int(sp),
            "time": sp_time,
            "avg_actual_mw": round(float(group["actual_mw"].mean()), 1),
            "avg_forecast_mw": round(float(group["forecast_mw"].mean()), 1),
            "avg_bias_mw": round(float(group["error_mw"].mean()), 1),
            "avg_mae_mw": round(float(group["abs_error_mw"].mean()), 1),
        })

    return {
        "gate_closure_time": gate_closure_time,
        "total_days": len(dates),
        "total_settlement_periods": len(month_df),
        "overall_metrics": overall_metrics,
        "histogram": histogram,
        "sp_profile": sorted(sp_profile, key=lambda x: x["settlementPeriod"]),
        "daily_breakdown": daily_stats
    }

@router.post("/procurement/simulate")
def simulate_procurement(req: SimulationRequest):
    """
    Decision support tool: simulates procurement requirement and financial risk
    comparing naive forecast purchase vs risk-hedged (quantified buffer) purchase.
    """
    loader = EnergyDataLoader.get_instance()
    
    # Sanitize inputs in case default placeholder string is sent
    clean_date = req.date.strip() if req.date else None
    if clean_date in ["string", "", "null", "none"]:
        clean_date = None

    clean_gc = req.gate_closure_time.strip() if req.gate_closure_time else DEFAULT_GATE_CLOSURE_TIME
    if clean_gc in ["string", ""]:
        clean_gc = DEFAULT_GATE_CLOSURE_TIME

    try:
        if clean_date:
            df = loader.get_day_ahead_comparison(clean_date, clean_gc)
        else:
            # Whole month
            all_dfs = [loader.get_day_ahead_comparison(d, clean_gc) for d in loader.get_available_dates()]
            df = pd.concat(all_dfs, ignore_index=True)
    except ValueError as ve:
        raise HTTPException(
            status_code=400, 
            detail=f"{str(ve)}. Available dates are 2026-01-01 to 2026-01-31."
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation calculation error: {str(e)}")

    errors = df["error_mw"].dropna().values
    
    # Sizing buffer from historical error distribution
    # If client picks 85% risk percentile, we find the 85th percentile of over-forecast error
    safety_buffer_mw = float(np.percentile(np.maximum(errors, 0), req.risk_percentile))
    
    results_series = []
    
    # If single date, return half-hourly series
    if clean_date:
        for _, row in df.iterrows():
            act = float(row["actual_mw"])
            fc = float(row["forecast_mw"])
            demand = req.consumer_demand_mw
            
            naive_thermal = max(0.0, demand - fc)
            naive_supplied = naive_thermal + act
            naive_imbalance = naive_supplied - demand  # negative = short
            
            hedged_wind_assumed = max(0.0, fc - safety_buffer_mw)
            hedged_thermal = max(0.0, demand - hedged_wind_assumed)
            hedged_supplied = hedged_thermal + act
            hedged_imbalance = hedged_supplied - demand

            results_series.append({
                "settlementPeriod": int(row["settlementPeriod"]),
                "time": row["targetTimeStr"],
                "demand_mw": demand,
                "actual_wind_mw": round(act, 1),
                "forecast_wind_mw": round(fc, 1),
                "naive_thermal_procured_mw": round(naive_thermal, 1),
                "naive_imbalance_mw": round(naive_imbalance, 1),
                "hedged_thermal_procured_mw": round(hedged_thermal, 1),
                "hedged_imbalance_mw": round(hedged_imbalance, 1),
            })

    # Summary financial comparison
    naive_shorts = np.maximum(0.0, -(df["actual_mw"].values - df["forecast_mw"].values))
    hedged_shorts = np.maximum(0.0, -(df["actual_mw"].values - (df["forecast_mw"].values - safety_buffer_mw)))

    naive_short_mwh = float(np.sum(naive_shorts) * 0.5)
    hedged_short_mwh = float(np.sum(hedged_shorts) * 0.5)

    short_penalty_reduction_mwh = naive_short_mwh - hedged_short_mwh
    indicative_savings_gbp = short_penalty_reduction_mwh * 40.0  # differential between cashout penalty and day-ahead spread

    return {
        "consumer_demand_mw": req.consumer_demand_mw,
        "risk_percentile": req.risk_percentile,
        "suggested_safety_buffer_mw": round(safety_buffer_mw, 1),
        "naive_short_volume_mwh": round(naive_short_mwh, 1),
        "hedged_short_volume_mwh": round(hedged_short_mwh, 1),
        "short_risk_reduction_percent": round((short_penalty_reduction_mwh / (naive_short_mwh + 1e-6)) * 100.0, 1),
        "indicative_imbalance_savings_gbp": round(indicative_savings_gbp, 2),
        "series": results_series
    }
