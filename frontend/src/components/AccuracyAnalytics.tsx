import React, { useState } from 'react';
import type { MonthSummaryResponse } from '../types';
import { KpiCards } from './KpiCards';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine, 
  ComposedChart 
} from 'recharts';

interface AccuracyAnalyticsProps {
  data: MonthSummaryResponse;
  onSelectDate: (date: string) => void;
}

export const AccuracyAnalytics: React.FC<AccuracyAnalyticsProps> = ({ data, onSelectDate }) => {
  const [activeSubTab, setActiveSubTab] = useState<'trends' | 'distribution' | 'diurnal' | 'quantiles'>('trends');

  const { overall_metrics, histogram, sp_profile, daily_breakdown } = data;

  return (
    <div className="space-y-6">
      {/* Month-level Aggregated KPI Cards */}
      <KpiCards metrics={overall_metrics} titlePrefix="Full Month" />

      {/* Clean Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 space-x-8 text-xs font-medium">
        <button
          onClick={() => setActiveSubTab('trends')}
          className={`pb-3 transition border-b-2 ${
            activeSubTab === 'trends'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Daily Error Trends
        </button>

        <button
          onClick={() => setActiveSubTab('distribution')}
          className={`pb-3 transition border-b-2 ${
            activeSubTab === 'distribution'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Error Distribution
        </button>

        <button
          onClick={() => setActiveSubTab('diurnal')}
          className={`pb-3 transition border-b-2 ${
            activeSubTab === 'diurnal'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Diurnal Profile (SP 1–48)
        </button>

        <button
          onClick={() => setActiveSubTab('quantiles')}
          className={`pb-3 transition border-b-2 ${
            activeSubTab === 'quantiles'
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Risk Quantiles
        </button>
      </div>

      {/* 1. Daily Trends */}
      {activeSubTab === 'trends' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Daily Mean Absolute Error &amp; Net Bias
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Click any day bar to open its 48 settlement periods</p>
            </div>
            <div className="flex items-center space-x-5 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-2.5 bg-blue-600 inline-block rounded-xs"></span>
                <span className="text-slate-700 font-medium">MAE (MW)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-0.5 bg-slate-700 inline-block"></span>
                <span className="text-slate-700 font-medium">Bias (MW)</span>
              </div>
            </div>
          </div>

          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={daily_breakdown}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                onClick={(e: any) => {
                  if (e && e.activePayload && e.activePayload[0]) {
                    onSelectDate(e.activePayload[0].payload.date);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 10 }}
                  tickFormatter={(val) => val.split('-')[2]}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-xs space-y-1.5 font-sans min-w-44">
                          <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1 flex justify-between">
                            <span>{item.date}</span>
                            <span className="text-blue-600 font-mono">Day {item.date.split('-')[2]}</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>MAE:</span>
                            <span className="font-mono font-semibold text-slate-900">{item.mae_mw.toLocaleString()} MW</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Bias:</span>
                            <span className={`font-mono font-semibold ${item.bias_mw > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                              {item.bias_mw > 0 ? `+${item.bias_mw}` : item.bias_mw} MW
                            </span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>WAPE:</span>
                            <span className="font-mono font-semibold text-slate-800">{item.wape_percent}%</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-1">
                            <span className="text-slate-500">Short Risk:</span>
                            <span className="font-mono font-semibold text-red-600">£{(item.short_exposure_gbp / 1000).toFixed(1)}k</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="mae_mw" fill="#2563eb" radius={[2, 2, 0, 0]} />
                <Line 
                  type="monotone" 
                  dataKey="bias_mw" 
                  stroke="#334155" 
                  strokeWidth={1.5} 
                  dot={{ r: 2 }}
                />
                <ReferenceLine y={0} stroke="#cbd5e1" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 2. Error Distribution Histogram */}
      {activeSubTab === 'distribution' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Forecast Error Distribution Frequency
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Frequency count across 25 MW bins. Values &gt; 0 represent over-forecasting.
              </p>
            </div>
            <div className="flex items-center space-x-3 text-xs">
              <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-slate-600 font-mono">
                Skewness: <strong className="text-slate-900">{overall_metrics.skewness}</strong>
              </span>
              <span className="bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-slate-600 font-mono">
                Kurtosis: <strong className="text-slate-900">{overall_metrics.kurtosis}</strong>
              </span>
            </div>
          </div>

          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={histogram} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="mid" 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-2.5 rounded-lg shadow-md text-xs space-y-1 font-sans">
                          <div className="font-semibold text-slate-800">Range: {item.label}</div>
                          <div className="font-mono text-blue-700 font-bold">Count: {item.count} half-hours</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                <ReferenceLine x={0} stroke="#dc2626" strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 3. Diurnal Intraday Profile */}
      {activeSubTab === 'diurnal' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Average Diurnal Error Profile (Settlement Periods 1 to 48)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Reveals time-of-day forecasting error variance across the 24-hour cycle
              </p>
            </div>
            <div className="flex items-center space-x-5 text-xs">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-blue-600 inline-block rounded"></span>
                <span className="text-slate-700 font-medium">Average MAE</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-slate-600 inline-block border-t border-dashed border-slate-600"></span>
                <span className="text-slate-700 font-medium">Average Bias</span>
              </div>
            </div>
          </div>

          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sp_profile} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#94a3b8" 
                  tick={{ fontSize: 11 }}
                  interval={3}
                  tickLine={false}
                />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-md text-xs space-y-1 font-sans">
                          <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1">
                            SP {item.settlementPeriod} ({item.time})
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Mean MAE:</span>
                            <span className="font-mono font-semibold text-blue-700">{item.avg_mae_mw} MW</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Mean Bias:</span>
                            <span className="font-mono font-semibold text-slate-800">
                              {item.avg_bias_mw > 0 ? `+${item.avg_bias_mw}` : item.avg_bias_mw} MW
                            </span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="avg_mae_mw" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="avg_bias_mw" stroke="#475569" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                <ReferenceLine y={0} stroke="#cbd5e1" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* 4. Quantiles Table */}
      {activeSubTab === 'quantiles' && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              Empirical Quantile Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Parametric error bounds used by traders to size safety margins
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {Object.entries(overall_metrics.quantiles).map(([q, val]) => {
              const numVal = val as number;
              return (
                <div key={q} className="bg-slate-50 border border-slate-200/80 rounded-lg p-3.5 text-center">
                  <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                    {q.toUpperCase()}
                  </span>
                  <span className={`text-base font-mono font-bold ${
                    numVal > 0 ? 'text-red-600' : 'text-emerald-700'
                  }`}>
                    {numVal > 0 ? `+${numVal.toLocaleString()}` : numVal.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">MW</span>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-1">
            <span className="font-semibold text-slate-900 block">Trading Rule:</span>
            <p>
              Holding a safety reserve equal to the <strong>P90 error ({overall_metrics.quantiles.p90} MW)</strong> covers 
              90% of all settlement periods against real-time short-imbalance cash-out penalties (£85/MWh).
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
