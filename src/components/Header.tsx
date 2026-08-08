import React, { useState } from 'react';
import { FileText, Database, ShieldCheck, Sparkles, Sliders, Sun, Moon } from 'lucide-react';
import { WorkflowRuleConfig } from '../types';

interface HeaderProps {
  activeTab: 'upload' | 'ledger';
  setActiveTab: (tab: 'upload' | 'ledger') => void;
  recordCount: number;
  ruleConfig: WorkflowRuleConfig;
  setRuleConfig: React.Dispatch<React.SetStateAction<WorkflowRuleConfig>>;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
  onOpenIntro?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  recordCount,
  ruleConfig,
  setRuleConfig,
  theme,
  setTheme,
  onOpenIntro,
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);

  const isDark = theme === 'dark';

  return (
    <>
      <header
        className={`sticky top-0 z-30 shadow-md transition-colors duration-200 border-b ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Brand Row */}
          <div className="flex items-center justify-between">
            <div
              onClick={onOpenIntro}
              className={`flex items-center space-x-2.5 ${onOpenIntro ? 'cursor-pointer group' : ''}`}
              title={onOpenIntro ? 'Return to Intro Home' : undefined}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1
                    className={`text-xl font-black tracking-tight ${
                      isDark
                        ? 'bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent'
                        : 'text-slate-900'
                    }`}
                  >
                    Docly
                  </h1>
                </div>
                <p
                  className={`text-[11px] hidden sm:block ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Universal Document AI • Dynamic Workflows
                </p>
              </div>
            </div>

            {/* Mobile Controls Right: Theme & Rules */}
            <div className="flex md:hidden items-center space-x-1.5">
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                className={`p-1.5 rounded-lg border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                }`}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setShowConfigModal(true)}
                aria-label="Configure Workflow Rules"
                className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isDark
                    ? 'bg-slate-800 text-slate-200 border-slate-700'
                    : 'bg-slate-100 text-slate-800 border-slate-300'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>{ruleConfig.currencySymbol}{ruleConfig.approvalThreshold.toLocaleString()}</span>
              </button>
            </div>
          </div>

          {/* Navigation & Controls Row */}
          <div className="flex items-center justify-between sm:justify-end space-x-2 sm:space-x-3 w-full md:w-auto">
            <nav
              aria-label="Primary Navigation"
              className={`flex space-x-1 p-1 rounded-xl border w-full sm:w-auto ${
                isDark
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                onClick={() => setActiveTab('upload')}
                aria-label="Document Upload view"
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  activeTab === 'upload'
                    ? 'bg-indigo-600 text-white shadow'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Doc Upload</span>
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                aria-label="Audit Ledger view"
                className={`flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  activeTab === 'ledger'
                    ? 'bg-indigo-600 text-white shadow'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>Ledger</span>
                {recordCount > 0 && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      activeTab === 'ledger'
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                        : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                    }`}
                  >
                    {recordCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Desktop Controls */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setShowConfigModal(true)}
                aria-label="Workflow Decision Rules Configuration"
                className={`flex items-center space-x-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-300'
                }`}
                title="Workflow Decision Rules Configuration"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                <span>Rules Limit:</span>
                <span className="font-bold">
                  {ruleConfig.currencySymbol}{ruleConfig.approvalThreshold.toLocaleString()}
                </span>
              </button>

              {/* Theme Switcher Button */}
              <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
                className={`p-2 rounded-lg border text-xs font-medium flex items-center space-x-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isDark
                    ? 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-amber-600 border-slate-300'
                }`}
                title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
              >
                {isDark ? (
                  <>
                    <Sun className="w-4 h-4 text-amber-400" />
                    <span className="text-slate-200">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-indigo-600" />
                    <span className="text-slate-700">Dark</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Rules Config Modal */}
      {showConfigModal && (
        <div
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rules-modal-title"
        >
          <div
            className={`border rounded-xl shadow-2xl max-w-md w-full p-6 transition-colors ${
              isDark
                ? 'bg-slate-900 border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div
              className={`flex items-center justify-between pb-4 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-500" />
                <h3 id="rules-modal-title" className="font-bold text-base">Invoice approval rules</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                aria-label="Close rules configuration modal"
                className={`text-sm px-2 py-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                  isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Currency Symbol
                </label>
                <div className="flex space-x-2">
                  {['₹', '$', '€', '£'].map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => setRuleConfig((prev) => ({ ...prev, currencySymbol: symbol }))}
                      className={`px-3 py-1.5 text-sm rounded border font-medium ${
                        ruleConfig.currencySymbol === symbol
                          ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                          : isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                          : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  Auto-Approval Ceiling Threshold
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm font-semibold">
                    {ruleConfig.currencySymbol}
                  </span>
                  <input
                    type="number"
                    value={ruleConfig.approvalThreshold}
                    onChange={(e) =>
                      setRuleConfig((prev) => ({
                        ...prev,
                        approvalThreshold: Number(e.target.value) || 0,
                      }))
                    }
                    className={`w-full rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:border-indigo-500 border ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-white'
                        : 'bg-slate-50 border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <p className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Invoices above this amount are automatically <span className="text-amber-500 font-medium">FLAGGED</span> for manager review, even if math is valid.
                </p>
              </div>

              <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <label className={`flex items-center justify-between text-xs cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Strict Math Reconciliation (Subtotal + Tax = Total)</span>
                  <input
                    type="checkbox"
                    checked={ruleConfig.strictMathCheck}
                    onChange={(e) =>
                      setRuleConfig((prev) => ({ ...prev, strictMathCheck: e.target.checked }))
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className={`flex items-center justify-between text-xs cursor-pointer ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span>Auto-commit approved invoices to Audit Ledger</span>
                  <input
                    type="checkbox"
                    checked={ruleConfig.autoSaveToLedger}
                    onChange={(e) =>
                      setRuleConfig((prev) => ({ ...prev, autoSaveToLedger: e.target.checked }))
                    }
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Save & Apply Rules
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
