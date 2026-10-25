import React from 'react';

interface NavbarProps {
  gateClosureTime: string;
  onGateClosureChange: (time: string) => void;
  activeTab: 'cockpit' | 'analytics' | 'procurement';
  onTabChange: (tab: 'cockpit' | 'analytics' | 'procurement') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  gateClosureTime,
  onGateClosureChange,
  activeTab,
  onTabChange
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-14">
          {/* Minimal Brand / Title */}
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-900 text-sm tracking-tight">
              Day-Ahead Wind
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-xs text-slate-500 font-medium">
              Elexon BMRS
            </span>
          </div>

          {/* Clean Underline Navigation */}
          <nav className="flex space-x-8 h-full">
            <button
              onClick={() => onTabChange('cockpit')}
              className={`h-full text-xs font-medium border-b-2 transition-colors px-1 flex items-center ${
                activeTab === 'cockpit'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Day-Ahead Schedule
            </button>

            <button
              onClick={() => onTabChange('analytics')}
              className={`h-full text-xs font-medium border-b-2 transition-colors px-1 flex items-center ${
                activeTab === 'analytics'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Accuracy Evaluation
            </button>

            <button
              onClick={() => onTabChange('procurement')}
              className={`h-full text-xs font-medium border-b-2 transition-colors px-1 flex items-center ${
                activeTab === 'procurement'
                  ? 'border-slate-900 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Procurement Calculator
            </button>
          </nav>

          {/* Subtle Cutoff Control */}
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">D-1 Gate:</span>
            <select
              value={gateClosureTime}
              onChange={(e) => onGateClosureChange(e.target.value)}
              className="bg-transparent text-slate-700 font-medium text-xs rounded border border-slate-200 px-2 py-1 focus:outline-none focus:border-slate-400"
            >
              <option value="11:00">11:00 GMT</option>
              <option value="12:00">12:00 GMT</option>
              <option value="09:00">09:00 GMT</option>
              <option value="15:00">15:00 GMT</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};
