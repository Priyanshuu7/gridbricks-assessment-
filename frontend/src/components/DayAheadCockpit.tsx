import React, { useState } from 'react';
import type { 
  DayComparisonResponse, 
  SettlementPeriodPoint 
} from '../types';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine 
} from 'recharts';

interface DayAheadCockpitProps {
  data: DayComparisonResponse;
  availableDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  gateClosureTime: string;
}

export const DayAheadCockpit: React.FC<DayAheadCockpitProps> = ({
  data,
  availableDates,
  selectedDate,
  onSelectDate,
  gateClosureTime
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'over' | 'under'>('all');
  const [hoveredSp, setHoveredSp] = useState<number | null>(null);

  const currentIndex = availableDates.indexOf(selectedDate);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < availableDates.length - 1;

  const handlePrev = () => {
    if (hasPrev) onSelectDate(availableDates[currentIndex - 1]);
  };

  const handleNext = () => {
    if (hasNext) onSelectDate(availableDates[currentIndex + 1]);
  };

  const filteredSeries = data.series.filter(item => {
    if (filterMode === 'over') return (item.error_mw ?? 0) > 0;
    if (filterMode === 'under') return (item.error_mw ?? 0) < 0;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Date Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-1">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 border border-slate-200 rounded-lg p-0.5 bg-white">
            <button
              onClick={handlePrev}
              disabled={!hasPrev}
              className="px-3 py-1.5 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              &larr; Previous
            </button>
            <div className="h-4 w-px bg-slate-200"></div>
            <select
              value={selectedDate}
              onChange={(e) => onSelectDate(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold text-xs px-2.5 py-1.5 focus:outline-none cursor-pointer"
            >
              {availableDates.map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <div className="h-4 w-px bg-slate-200"></div>
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className="px-3 py-1.5 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next &rarr;
            </button>
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-xs text-slate-400 flex items-center space-x-3">
          <span>D-1 Gate Cutoff: <strong className="font-mono text-slate-700">{gateClosureTime} GMT</strong></span>
          <span>•</span>
          <span>Forecast Publish: <strong className="font-mono text-slate-700">
            {data.latest_forecast_publish_time ? data.latest_forecast_publish_time.replace('T', ' ').substring(11, 16) + ' GMT' : 'Locked'}
          </strong></span>
        </div>
      </div>

      {/* Main Chart Box */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Wind Generation Profile: Actual vs. Day-Ahead Forecast
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              48 half-hour settlement periods across delivery day {selectedDate}
            </p>
          </div>

          <div className="flex items-center space-x-5 text-xs">
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-1 bg-blue-600 inline-block rounded"></span>
              <span className="text-slate-700 font-medium">Actual Wind</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-1 bg-slate-500 inline-block border-t border-dashed border-slate-600"></span>
              <span className="text-slate-700 font-medium">D-1 Forecast</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-slate-200 inline-block rounded-xs"></span>
              <span className="text-slate-400">Error Delta</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data.series}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              onMouseMove={(state: any) => {
                if (state && typeof state.activeTooltipIndex === 'number' && data.series[state.activeTooltipIndex]) {
                  setHoveredSp(data.series[state.activeTooltipIndex].settlementPeriod);
                }
              }}
              onMouseLeave={() => setHoveredSp(null)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="targetTimeStr" 
                stroke="#94a3b8" 
                tick={{ fontSize: 11 }}
                interval={3}
                tickLine={false}
              />
              <YAxis 
                stroke="#94a3b8" 
                tick={{ fontSize: 11 }}
                domain={[0, 'auto']}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const row = payload[0].payload as SettlementPeriodPoint;
                    const err = row.error_mw ?? 0;
                    return (
                      <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-xs space-y-1.5 min-w-44">
                        <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1.5 flex justify-between items-center">
                          <span>SP {row.settlementPeriod} ({row.targetTimeStr})</span>
                          <span className={`text-[11px] font-bold ${err > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                            {err > 0 ? 'Short' : 'Surplus'}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Actual:</span>
                          <span className="font-mono font-semibold text-blue-700">{row.actual_mw?.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Forecast:</span>
                          <span className="font-mono font-semibold text-slate-700">{row.forecast_mw?.toLocaleString()} MW</span>
                        </div>
                        <div className="flex justify-between border-t border-slate-100 pt-1 font-mono">
                          <span className="text-slate-400 font-sans">Error:</span>
                          <span className={`font-bold ${err > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                            {err > 0 ? `+${err.toLocaleString()}` : err.toLocaleString()} MW
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="actual_mw" 
                stroke="#2563eb" 
                strokeWidth={2} 
                dot={false}
              />
              <Line 
                type="monotone" 
                dataKey="forecast_mw" 
                stroke="#475569" 
                strokeWidth={1.75} 
                strokeDasharray="4 4" 
                dot={false}
              />
              <Bar 
                dataKey="error_mw" 
                fill="#cbd5e1" 
                opacity={0.5} 
              />
              <ReferenceLine y={0} stroke="#cbd5e1" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Settlement Period Breakdown Table */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-4 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Settlement Periods (SP 1–48)</h3>
            <p className="text-xs text-slate-500 mt-0.5">Half-hourly actuals and forecasted delivery</p>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                filterMode === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              All (48)
            </button>
            <button
              onClick={() => setFilterMode('over')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                filterMode === 'over' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Over-forecast
            </button>
            <button
              onClick={() => setFilterMode('under')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                filterMode === 'under' ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Under-forecast
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-80">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] sticky top-0 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">SP</th>
                <th className="py-2.5 px-4 font-semibold">Target Time</th>
                <th className="py-2.5 px-4 font-semibold">Actual (MW)</th>
                <th className="py-2.5 px-4 font-semibold">D-1 Forecast (MW)</th>
                <th className="py-2.5 px-4 font-semibold">Error (MW)</th>
                <th className="py-2.5 px-4 font-semibold">Error %</th>
                <th className="py-2.5 px-4 font-semibold">Position</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {filteredSeries.map((row) => {
                const isOver = (row.error_mw ?? 0) > 0;
                const errPct = row.actual_mw && row.actual_mw > 0 
                  ? ((row.error_mw ?? 0) / row.actual_mw * 100).toFixed(1) 
                  : 'N/A';
                const isHovered = hoveredSp === row.settlementPeriod;

                return (
                  <tr 
                    key={row.settlementPeriod} 
                    className={`transition-colors ${
                      isHovered ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-2.5 px-4 font-semibold text-slate-900 font-sans">SP {row.settlementPeriod}</td>
                    <td className="py-2.5 px-4 text-slate-600">{row.targetTimeStr}</td>
                    <td className="py-2.5 px-4 font-medium text-blue-700">{row.actual_mw?.toLocaleString()}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-700">{row.forecast_mw?.toLocaleString()}</td>
                    <td className={`py-2.5 px-4 font-bold ${isOver ? 'text-red-600' : 'text-emerald-700'}`}>
                      {isOver ? `+${row.error_mw?.toLocaleString()}` : row.error_mw?.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {errPct !== 'N/A' ? `${errPct}%` : '—'}
                    </td>
                    <td className="py-2.5 px-4 font-sans">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${
                        isOver 
                          ? 'bg-red-50 text-red-700 border border-red-200' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isOver ? 'Short Imbalance' : 'Surplus Spill'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
