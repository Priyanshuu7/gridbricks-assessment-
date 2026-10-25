import React, { useState, useEffect } from 'react';
import { 
  fetchDates, 
  fetchDayComparison, 
  fetchMonthSummary 
} from './services/api';
import type { 
  DayComparisonResponse, 
  MonthSummaryResponse 
} from './types';
import { Navbar } from './components/Navbar';
import { KpiCards } from './components/KpiCards';
import { DayAheadCockpit } from './components/DayAheadCockpit';
import { AccuracyAnalytics } from './components/AccuracyAnalytics';
import { ProcurementSimulator } from './components/ProcurementSimulator';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cockpit' | 'analytics' | 'procurement'>('cockpit');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-01-05');
  const [gateClosureTime, setGateClosureTime] = useState<string>('11:00');
  
  const [dayData, setDayData] = useState<DayComparisonResponse | null>(null);
  const [monthData, setMonthData] = useState<MonthSummaryResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const dates = await fetchDates();
        setAvailableDates(dates);
        if (dates.length > 0 && !dates.includes(selectedDate)) {
          setSelectedDate(dates[0]);
        }
        const mSummary = await fetchMonthSummary(gateClosureTime);
        setMonthData(mSummary);
      } catch (err: any) {
        setError(err.message || 'Error initializing application');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [gateClosureTime]);

  useEffect(() => {
    async function loadDay() {
      if (!selectedDate) return;
      try {
        const dData = await fetchDayComparison(selectedDate, gateClosureTime);
        setDayData(dData);
      } catch (err: any) {
        console.error(err);
      }
    }
    loadDay();
  }, [selectedDate, gateClosureTime]);

  const handleSelectDateFromAnalytics = (date: string) => {
    setSelectedDate(date);
    setActiveTab('cockpit');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Navigation */}
      <Navbar
        gateClosureTime={gateClosureTime}
        onGateClosureChange={setGateClosureTime}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Main Content with generous spacing */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8 space-y-8">
        {loading && (
          <div className="flex flex-col items-center justify-center h-72 space-y-2">
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Loading market settlement datasets...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-xs text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button 
              onClick={() => window.location.reload()}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {activeTab === 'cockpit' && dayData && (
              <div className="space-y-6">
                <KpiCards metrics={dayData.metrics} titlePrefix="Day-Ahead" />
                <DayAheadCockpit
                  data={dayData}
                  availableDates={availableDates}
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  gateClosureTime={gateClosureTime}
                />
              </div>
            )}

            {activeTab === 'analytics' && monthData && (
              <AccuracyAnalytics
                data={monthData}
                onSelectDate={handleSelectDateFromAnalytics}
              />
            )}

            {activeTab === 'procurement' && (
              <ProcurementSimulator
                selectedDate={selectedDate}
                gateClosureTime={gateClosureTime}
              />
            )}
          </>
        )}
      </main>

      {/* Minimal clean footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-xs text-slate-400">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>UK Wholesale Electricity Day-Ahead Wind Settlement</span>
          <span>Elexon BMRS Datasets (FUELHH &amp; WINDFOR) • January 2026</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
