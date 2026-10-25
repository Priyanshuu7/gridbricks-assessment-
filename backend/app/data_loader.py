import json
import os
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple
import pandas as pd
import numpy as np

from .config import FUELHH_PATH, WINDFOR_PATH, DEFAULT_GATE_CLOSURE_TIME

class EnergyDataLoader:
    _instance = None

    def __init__(self):
        self.fuelhh_data = []
        self.windfor_data = []
        self.available_dates = []
        self._load_data()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = EnergyDataLoader()
        return cls._instance

    def _load_data(self):
        if not os.path.exists(FUELHH_PATH) or not os.path.exists(WINDFOR_PATH):
            raise FileNotFoundError(f"Data files missing in {FUELHH_PATH} or {WINDFOR_PATH}")

        with open(FUELHH_PATH, "r", encoding="utf-8") as f:
            self.fuelhh_data = json.load(f)

        with open(WINDFOR_PATH, "r", encoding="utf-8") as f:
            self.windfor_data = json.load(f)

        # Parse FUELHH into a clean DataFrame
        df_fuel = pd.DataFrame(self.fuelhh_data)
        df_fuel["startTime"] = pd.to_datetime(df_fuel["startTime"])
        df_fuel["publishTime"] = pd.to_datetime(df_fuel["publishTime"])
        self.df_actuals = df_fuel.sort_values(["settlementDate", "settlementPeriod"]).reset_index(drop=True)

        # Extract available delivery dates
        self.available_dates = sorted(self.df_actuals["settlementDate"].unique().tolist())

        # Parse WINDFOR into DataFrame
        df_wind = pd.DataFrame(self.windfor_data)
        df_wind["startTime"] = pd.to_datetime(df_wind["startTime"])
        df_wind["publishTime"] = pd.to_datetime(df_wind["publishTime"])
        # Ensure UTC timezone awareness if not already
        if df_wind["publishTime"].dt.tz is None:
            df_wind["publishTime"] = df_wind["publishTime"].dt.tz_localize("UTC")
        else:
            df_wind["publishTime"] = df_wind["publishTime"].dt.tz_convert("UTC")
            
        if df_wind["startTime"].dt.tz is None:
            df_wind["startTime"] = df_wind["startTime"].dt.tz_localize("UTC")
        else:
            df_wind["startTime"] = df_wind["startTime"].dt.tz_convert("UTC")

        self.df_forecasts = df_wind.sort_values(["publishTime", "startTime"]).reset_index(drop=True)

    def get_available_dates(self) -> List[str]:
        return self.available_dates

    def get_day_ahead_comparison(
        self, 
        delivery_date_str: str, 
        gate_closure_time: str = DEFAULT_GATE_CLOSURE_TIME
    ) -> pd.DataFrame:
        """
        Extracts actual wind generation and aligns the latest available Day-Ahead 
        forecast before the D-1 gate closure for all 48 settlement periods.
        """
        # Actuals for delivery date
        day_actuals = self.df_actuals[self.df_actuals["settlementDate"] == delivery_date_str].copy()
        if day_actuals.empty:
            raise ValueError(f"No actuals found for delivery date {delivery_date_str}")

        day_actuals = day_actuals.sort_values("settlementPeriod").reset_index(drop=True)

        # Calculate cutoff datetime on D-1
        delivery_dt = datetime.strptime(delivery_date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        d_minus_1 = delivery_dt - timedelta(days=1)
        gc_hour, gc_min = map(int, gate_closure_time.split(":"))
        cutoff_dt = d_minus_1.replace(hour=gc_hour, minute=gc_min, second=0, microsecond=0)

        # Filter forecasts published at or before cutoff
        valid_forecasts = self.df_forecasts[self.df_forecasts["publishTime"] <= cutoff_dt].copy()

        # The target startTimes cover the 24 hours of delivery date (plus next hour for interpolation)
        target_start = delivery_dt
        target_end = delivery_dt + timedelta(days=1, hours=1)

        valid_forecasts = valid_forecasts[
            (valid_forecasts["startTime"] >= target_start) & 
            (valid_forecasts["startTime"] <= target_end)
        ]

        # For each startTime, pick the forecast with the latest publishTime
        latest_fc = (
            valid_forecasts.sort_values("publishTime")
            .groupby("startTime")
            .last()
            .reset_index()
        )

        # Construct full 48 settlement periods (half-hourly: 00:00 to 23:30)
        sp_times = [delivery_dt + timedelta(minutes=30 * i) for i in range(48)]
        sp_df = pd.DataFrame({
            "settlementPeriod": range(1, 49),
            "targetTime": sp_times
        })

        # Merge actual generation
        day_actuals["targetTime"] = pd.to_datetime(day_actuals["startTime"]).dt.tz_localize("UTC") if day_actuals["startTime"].dt.tz is None else pd.to_datetime(day_actuals["startTime"]).dt.tz_convert("UTC")
        merged = pd.merge(
            sp_df, 
            day_actuals[["settlementPeriod", "generation"]].rename(columns={"generation": "actual_mw"}), 
            on="settlementPeriod", 
            how="left"
        )

        # Interpolate forecast generation to 30-min intervals
        if not latest_fc.empty:
            # Map known hourly points
            fc_map = dict(zip(latest_fc["startTime"], latest_fc["generation"]))
            pub_map = dict(zip(latest_fc["startTime"], latest_fc["publishTime"]))

            # Create series for interpolation
            fc_values = []
            pub_times = []
            for t in sp_times:
                fc_values.append(fc_map.get(t, np.nan))
                pub_times.append(pub_map.get(t, None))

            merged["forecast_mw_raw"] = fc_values
            # Linear interpolation for half-hour settlement periods
            merged["forecast_mw"] = merged["forecast_mw_raw"].interpolate(method="linear", limit_direction="both")
            
            # If start or end values are NaN due to edge boundary, backward/forward fill
            merged["forecast_mw"] = merged["forecast_mw"].bfill().ffill().round(1)
            
            latest_published_at = latest_fc["publishTime"].max().isoformat()
        else:
            merged["forecast_mw"] = np.nan
            latest_published_at = None

        merged["error_mw"] = merged["forecast_mw"] - merged["actual_mw"]
        merged["abs_error_mw"] = merged["error_mw"].abs()
        merged["targetTimeStr"] = merged["targetTime"].dt.strftime("%H:%M")
        merged["settlementDate"] = delivery_date_str
        merged["cutoffDateTime"] = cutoff_dt.isoformat()
        merged["latestForecastPublishTime"] = latest_published_at

        return merged
