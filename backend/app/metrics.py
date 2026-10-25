import numpy as np
import pandas as pd
from scipy import stats
from typing import Dict, Any, List

from .config import (
    UK_WIND_INSTALLED_CAPACITY_MW, 
    DEFAULT_IMBALANCE_BUY_PRICE, 
    DEFAULT_IMBALANCE_SELL_PRICE
)

def compute_error_statistics(df: pd.DataFrame) -> Dict[str, Any]:
    """
    Computes comprehensive mathematical, statistical, and financial error metrics.
    """
    if df.empty or "error_mw" not in df:
        return {}

    valid_mask = df["error_mw"].notna() & df["actual_mw"].notna()
    sub_df = df[valid_mask]
    
    if sub_df.empty:
        return {}

    errors = sub_df["error_mw"].values
    abs_errors = sub_df["abs_error_mw"].values
    actuals = sub_df["actual_mw"].values
    forecasts = sub_df["forecast_mw"].values
    
    n = len(errors)
    total_actual_mwh = float(np.sum(actuals) * 0.5)
    total_forecast_mwh = float(np.sum(forecasts) * 0.5)
    
    # Fundamental accuracy metrics
    bias = float(np.mean(errors))
    mae = float(np.mean(abs_errors))
    rmse = float(np.sqrt(np.mean(errors ** 2)))
    max_over = float(np.max(errors))
    max_under = float(np.min(errors))
    std_err = float(np.std(errors, ddof=1)) if n > 1 else 0.0

    # Normalized error metrics
    sum_actual = np.sum(actuals)
    wape = float((np.sum(abs_errors) / sum_actual * 100.0)) if sum_actual > 0 else 0.0
    nmae = float((mae / UK_WIND_INSTALLED_CAPACITY_MW) * 100.0)

    # Distribution Shape (Higher moments)
    skewness = float(stats.skew(errors)) if n > 2 else 0.0
    kurtosis = float(stats.kurtosis(errors)) if n > 3 else 0.0

    # Empirical Risk Quantiles
    p5 = float(np.percentile(errors, 5))
    p10 = float(np.percentile(errors, 10))
    p25 = float(np.percentile(errors, 25))
    p50 = float(np.percentile(errors, 50))
    p75 = float(np.percentile(errors, 75))
    p90 = float(np.percentile(errors, 90))
    p95 = float(np.percentile(errors, 95))

    # Financial Imbalance Risk (MWh and indicative GBP)
    short_errors = errors[errors > 0]
    short_volume_mwh = float(np.sum(short_errors) * 0.5)
    short_exposure_gbp = short_volume_mwh * DEFAULT_IMBALANCE_BUY_PRICE

    long_errors = np.abs(errors[errors < 0])
    long_volume_mwh = float(np.sum(long_errors) * 0.5)
    long_discount_loss_gbp = long_volume_mwh * (DEFAULT_IMBALANCE_BUY_PRICE - DEFAULT_IMBALANCE_SELL_PRICE)

    return {
        "sample_count": n,
        "total_actual_mwh": round(total_actual_mwh, 1),
        "total_forecast_mwh": round(total_forecast_mwh, 1),
        "mean_actual_mw": round(float(np.mean(actuals)), 1),
        "mean_forecast_mw": round(float(np.mean(forecasts)), 1),
        "bias_mw": round(bias, 1),
        "mae_mw": round(mae, 1),
        "rmse_mw": round(rmse, 1),
        "max_overforecast_mw": round(max_over, 1),
        "max_underforecast_mw": round(max_under, 1),
        "std_error_mw": round(std_err, 1),
        "wape_percent": round(wape, 2),
        "nmae_percent": round(nmae, 2),
        "skewness": round(skewness, 2),
        "kurtosis": round(kurtosis, 2),
        "quantiles": {
            "p5": round(p5, 1),
            "p10": round(p10, 1),
            "p25": round(p25, 1),
            "p50": round(p50, 1),
            "p75": round(p75, 1),
            "p90": round(p90, 1),
            "p95": round(p95, 1),
        },
        "imbalance_risk": {
            "short_volume_mwh": round(short_volume_mwh, 1),
            "short_exposure_gbp": round(short_exposure_gbp, 2),
            "long_volume_mwh": round(long_volume_mwh, 1),
            "long_loss_gbp": round(long_discount_loss_gbp, 2),
            "total_risk_exposure_gbp": round(short_exposure_gbp + long_discount_loss_gbp, 2)
        }
    }

def compute_histogram_bins(errors: np.ndarray, num_bins: int = 25) -> List[Dict[str, Any]]:
    """
    Computes error distribution histogram with bin ranges and count.
    """
    clean_errs = errors[~np.isnan(errors)]
    if len(clean_errs) == 0:
        return []

    counts, bin_edges = np.histogram(clean_errs, bins=num_bins)
    result = []
    for i in range(len(counts)):
        mid_val = (bin_edges[i] + bin_edges[i+1]) / 2.0
        result.append({
            "bin_start": round(float(bin_edges[i]), 1),
            "bin_end": round(float(bin_edges[i+1]), 1),
            "mid": round(float(mid_val), 1),
            "count": int(counts[i]),
            "label": f"{int(bin_edges[i])} to {int(bin_edges[i+1])} MW"
        })
    return result
