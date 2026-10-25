import type { 
  DayComparisonResponse, 
  MonthSummaryResponse, 
  SimulationResponse 
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function fetchDates(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/dates`);
  if (!res.ok) throw new Error('Failed to load available dates');
  const data = await res.json();
  return data.dates;
}

export async function fetchDayComparison(
  date: string, 
  gateClosureTime: string = '11:00'
): Promise<DayComparisonResponse> {
  const res = await fetch(`${API_BASE}/comparison?date=${date}&gate_closure_time=${gateClosureTime}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to fetch comparison' }));
    throw new Error(err.detail || 'Failed to fetch comparison');
  }
  return res.json();
}

export async function fetchMonthSummary(
  gateClosureTime: string = '11:00'
): Promise<MonthSummaryResponse> {
  const res = await fetch(`${API_BASE}/month-summary?gate_closure_time=${gateClosureTime}`);
  if (!res.ok) throw new Error('Failed to fetch monthly summary');
  return res.json();
}

export async function runSimulation(payload: {
  consumer_demand_mw: number;
  risk_percentile: number;
  date?: string;
  gate_closure_time: string;
}): Promise<SimulationResponse> {
  const res = await fetch(`${API_BASE}/procurement/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to run procurement simulation');
  return res.json();
}
