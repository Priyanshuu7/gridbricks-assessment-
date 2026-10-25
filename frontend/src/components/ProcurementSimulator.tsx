import React, { useState, useEffect } from 'react';
import { runSimulation } from '../services/api';
import type { SimulationResponse } from '../types';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface ProcurementSimulatorProps {
  selectedDate: string;
  gateClosureTime: string;
}

export const ProcurementSimulator: React.FC<ProcurementSimulatorProps> = ({
  selectedDate,
  gateClosureTime
}) => {
  const [demandMw, setDemandMw] = useState<number>(20000);
  const [riskPercentile, setRiskPercentile] = useState<number>(85);
  const [useSingleDate, setUseSingleDate] = useState<boolean>(true);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);

  const fetchSimulation = async () => {
    try {
      const res = await runSimulation({
        consumer_demand_mw: demandMw,
        risk_percentile: riskPercentile,
        date: useSingleDate ? selectedDate : undefined,
        gate_closure_time: gateClosureTime
      });
      setSimResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSimulation();
  }, [demandMw, riskPercentile, useSingleDate, selectedDate, gateClosureTime]);

  return (
    <div className="space-y-6">
      {/* Configuration & Controls */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Thermal Power Procurement Simulator
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate procurement volume beyond available wind and size safety margins
            </p>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <button
              onClick={() => setUseSingleDate(true)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                useSingleDate ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Day ({selectedDate})
            </button>
            <button
              onClick={() => setUseSingleDate(false)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                !useSingleDate ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Month
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-5">
          {/* Consumer Demand Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-medium">Consumer Demand:</span>
              <span className="text-slate-900 font-mono font-bold text-sm">
                {demandMw.toLocaleString()} MW
              </span>
            </div>
            <input
              type="range"
              min="10000"
              max="35000"
              step="1000"
              value={demandMw}
              onChange={(e) => setDemandMw(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>10,000 MW</span>
              <span>20,000 MW (Standard)</span>
              <span>35,000 MW (Peak)</span>
            </div>
          </div>

          {/* Risk Tolerance Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-700 font-medium">Risk Coverage Percentile:</span>
              <span className="text-blue-700 font-mono font-bold text-sm">
                P{riskPercentile} Protection
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={riskPercentile}
              onChange={(e) => setRiskPercentile(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>P50 (Neutral)</span>
              <span>P80 (Prudent)</span>
              <span>P90 (Conservative)</span>
              <span>P95 (Strict)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator KPI Cards */}
      {simResult && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Suggested Safety Buffer */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block mb-2">
              Suggested Safety Margin
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-semibold text-slate-900 font-mono">
                +{simResult.suggested_safety_buffer_mw.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">MW</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-3 pt-3 border-t border-slate-100">
              Derived from historical P{simResult.risk_percentile} error
            </span>
          </div>

          {/* Short Risk Reduction */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block mb-2">
              Shortage Risk Reduction
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-semibold text-emerald-700 font-mono">
                -{simResult.short_risk_reduction_percent}%
              </span>
              <span className="text-xs text-slate-400">exposure</span>
            </div>
            <span className="text-[11px] text-emerald-700 block mt-3 pt-3 border-t border-slate-100">
              Avoids {(simResult.naive_short_volume_mwh - simResult.hedged_short_volume_mwh).toLocaleString()} MWh penalty
            </span>
          </div>

          {/* Indicative Financial Savings */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block mb-2">
              Estimated Imbalance Savings
            </span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-3xl font-semibold text-slate-900 font-mono">
                £{(simResult.indicative_imbalance_savings_gbp / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 })}k
              </span>
              <span className="text-xs text-slate-400">GBP</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-3 pt-3 border-t border-slate-100">
              Net savings vs paying cash-out
            </span>
          </div>

          {/* Strategy Comparison */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-xs">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-500 block mb-2">
              Shortage Volume (MWh)
            </span>
            <div className="text-xs space-y-1 font-mono mt-2">
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Naive:</span>
                <span className="text-red-600 font-bold">{simResult.naive_short_volume_mwh.toLocaleString()} MWh</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 font-sans">Hedged:</span>
                <span className="text-emerald-700 font-bold">{simResult.hedged_short_volume_mwh.toLocaleString()} MWh</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Procurement Visual Comparison Chart */}
      {useSingleDate && simResult && simResult.series && simResult.series.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-100 gap-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Thermal Power Procurement Comparison (SP 1–48)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Naive Wind Forecast matching vs. Risk-Hedged Thermal Procurement on {selectedDate}
              </p>
            </div>
            <div className="flex items-center space-x-5 text-xs font-medium">
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-blue-600 inline-block rounded"></span>
                <span className="text-slate-700">Hedged Thermal</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-slate-500 inline-block border-t border-dashed border-slate-500"></span>
                <span className="text-slate-700">Naive Thermal</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3.5 h-1 bg-amber-600 inline-block"></span>
                <span className="text-slate-700">Actual Wind</span>
              </div>
            </div>
          </div>

          <div className="h-80 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={simResult.series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="time" stroke="#94a3b8" tick={{ fontSize: 11 }} interval={3} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload;
                      return (
                        <div className="bg-white border border-slate-200 p-3 rounded-lg shadow-lg text-xs space-y-1.5 font-sans min-w-48">
                          <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1">
                            SP {item.settlementPeriod} ({item.time})
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Demand:</span>
                            <span className="font-mono font-semibold">{item.demand_mw.toLocaleString()} MW</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Actual Wind:</span>
                            <span className="font-mono font-semibold text-amber-700">{item.actual_wind_mw.toLocaleString()} MW</span>
                          </div>
                          <div className="flex justify-between text-slate-600">
                            <span>Naive Thermal:</span>
                            <span className="font-mono font-semibold text-slate-700">{item.naive_thermal_procured_mw.toLocaleString()} MW</span>
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-1">
                            <span className="text-blue-700 font-semibold">Hedged Thermal:</span>
                            <span className="font-mono font-bold text-blue-700">{item.hedged_thermal_procured_mw.toLocaleString()} MW</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="hedged_thermal_procured_mw" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="naive_thermal_procured_mw" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="actual_wind_mw" stroke="#d97706" strokeWidth={1.5} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
