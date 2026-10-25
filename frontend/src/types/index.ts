export interface SettlementPeriodPoint {
  settlementPeriod: number;
  targetTimeStr: string;
  actual_mw: number | null;
  forecast_mw: number | null;
  error_mw: number | null;
  abs_error_mw: number | null;
}

export interface ErrorQuantiles {
  p5: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
}

export interface ImbalanceRisk {
  short_volume_mwh: number;
  short_exposure_gbp: number;
  long_volume_mwh: number;
  long_loss_gbp: number;
  total_risk_exposure_gbp: number;
}

export interface MetricsSummary {
  sample_count: number;
  total_actual_mwh: number;
  total_forecast_mwh: number;
  mean_actual_mw: number;
  mean_forecast_mw: number;
  bias_mw: number;
  mae_mw: number;
  rmse_mw: number;
  max_overforecast_mw: number;
  max_underforecast_mw: number;
  std_error_mw: number;
  wape_percent: number;
  nmae_percent: number;
  skewness: number;
  kurtosis: number;
  quantiles: ErrorQuantiles;
  imbalance_risk: ImbalanceRisk;
}

export interface DayComparisonResponse {
  delivery_date: string;
  gate_closure_time: string;
  cutoff_datetime: string;
  latest_forecast_publish_time: string | null;
  metrics: MetricsSummary;
  series: SettlementPeriodPoint[];
}

export interface HistogramBin {
  bin_start: number;
  bin_end: number;
  mid: number;
  count: number;
  label: string;
}

export interface SpProfilePoint {
  settlementPeriod: number;
  time: string;
  avg_actual_mw: number;
  avg_forecast_mw: number;
  avg_bias_mw: number;
  avg_mae_mw: number;
}

export interface DailyBreakdownItem {
  date: string;
  mean_actual_mw: number;
  mean_forecast_mw: number;
  bias_mw: number;
  mae_mw: number;
  rmse_mw: number;
  wape_percent: number;
  short_exposure_gbp: number;
  total_actual_mwh: number;
}

export interface MonthSummaryResponse {
  gate_closure_time: string;
  total_days: number;
  total_settlement_periods: number;
  overall_metrics: MetricsSummary;
  histogram: HistogramBin[];
  sp_profile: SpProfilePoint[];
  daily_breakdown: DailyBreakdownItem[];
}

export interface SimulationSeriesPoint {
  settlementPeriod: number;
  time: string;
  demand_mw: number;
  actual_wind_mw: number;
  forecast_wind_mw: number;
  naive_thermal_procured_mw: number;
  naive_imbalance_mw: number;
  hedged_thermal_procured_mw: number;
  hedged_imbalance_mw: number;
}

export interface SimulationResponse {
  consumer_demand_mw: number;
  risk_percentile: number;
  suggested_safety_buffer_mw: number;
  naive_short_volume_mwh: number;
  hedged_short_volume_mwh: number;
  short_risk_reduction_percent: number;
  indicative_imbalance_savings_gbp: number;
  series: SimulationSeriesPoint[];
}
