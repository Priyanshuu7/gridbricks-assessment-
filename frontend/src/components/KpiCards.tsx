import React from 'react';
import type { MetricsSummary } from '../types';

interface KpiCardsProps {
  metrics: MetricsSummary;
  titlePrefix?: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ metrics }) => {
  const isOverforecast = metrics.bias_mw > 0;
  
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* 1. Mean Absolute Error (MAE) */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Mean Absolute Error (MAE)
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl font-semibold text-slate-900 font-mono tracking-tight">
            {metrics.mae_mw.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-400">MW</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
          <span>Capacity Normalized:</span>
          <span className="font-semibold text-slate-700 font-mono">{metrics.nmae_percent}%</span>
        </div>
      </div>

      {/* 2. Mean Forecast Bias */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Forecast Bias
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className={`text-3xl font-semibold font-mono tracking-tight ${
            isOverforecast ? 'text-red-600' : 'text-emerald-700'
          }`}>
            {metrics.bias_mw > 0 ? `+${metrics.bias_mw.toLocaleString()}` : metrics.bias_mw.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-400">MW</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
          <span>System Position:</span>
          <span className={`font-medium ${isOverforecast ? 'text-red-700' : 'text-emerald-700'}`}>
            {isOverforecast ? 'Over-forecast' : 'Under-forecast'}
          </span>
        </div>
      </div>

      {/* 3. WAPE Error Rate */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          WAPE Error Rate
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl font-semibold text-slate-900 font-mono tracking-tight">
            {metrics.wape_percent}%
          </span>
          <span className="text-xs font-medium text-slate-400">error</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
          <span>Volatility (RMSE):</span>
          <span className="font-semibold text-slate-700 font-mono">{metrics.rmse_mw.toLocaleString()} MW</span>
        </div>
      </div>

      {/* 4. Short Imbalance Exposure */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
          Short Imbalance Risk
        </div>
        <div className="flex items-baseline space-x-1.5">
          <span className="text-3xl font-semibold text-red-600 font-mono tracking-tight">
            £{(metrics.imbalance_risk.short_exposure_gbp / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k
          </span>
          <span className="text-xs font-medium text-slate-400">cashout</span>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center">
          <span>Shortage Volume:</span>
          <span className="font-semibold text-slate-700 font-mono">
            {metrics.imbalance_risk.short_volume_mwh.toLocaleString()} MWh
          </span>
        </div>
      </div>
    </div>
  );
};
