import React, { useState } from 'react';
import { FileText, Database, ShieldCheck, Settings, Sparkles, Sliders } from 'lucide-react';
import { WorkflowRuleConfig } from '../types';

interface HeaderProps {
  activeTab: 'upload' | 'ledger';
  setActiveTab: (tab: 'upload' | 'ledger') => void;
  recordCount: number;
  ruleConfig: WorkflowRuleConfig;
  setRuleConfig: React.Dispatch<React.SetStateAction<WorkflowRuleConfig>>;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  recordCount,
  ruleConfig,
  setRuleConfig,
}) => {
  const [showConfigModal, setShowConfigModal] = useState(false);

  return (
    <>
      <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-inner shadow-indigo-400/30">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  Docly
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-3 h-3 mr-1 text-emerald-400" /> Gemini 2-Pass OCR
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multimodal OCR • Validation Rules • Automated Ledger Entry
              </p>
            </div>
          </div>

          {/* Navigation & Rule Settings */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <nav className="flex space-x-1 bg-slate-800/80 p-1 rounded-lg border border-slate-700/60">
              <button
                onClick={() => setActiveTab('upload')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'upload'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Document Ingestion</span>
              </button>

              <button
                onClick={() => setActiveTab('ledger')}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeTab === 'ledger'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Audit Ledger</span>
                {recordCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-950 text-indigo-200 border border-indigo-700">
                    {recordCount}
                  </span>
                )}
              </button>
            </nav>

            {/* Threshold Settings Trigger */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-lg text-xs font-medium transition-colors"
              title="Workflow Decision Rules Configuration"
            >
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden md:inline">Rules Limit:</span>
              <span className="font-bold text-white">
                {ruleConfig.currencySymbol}{ruleConfig.approvalThreshold.toLocaleString()}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Rules Config Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-md w-full p-6 text-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Workflow Decision Matrix Rules</h3>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Currency Symbol
                </label>
                <div className="flex space-x-2">
                  {['₹', '$', '€', '£'].map((symbol) => (
                    <button
                      key={symbol}
                      onClick={() => setRuleConfig((prev) => ({ ...prev, currencySymbol: symbol }))}
                      className={`px-3 py-1.5 text-sm rounded border ${
                        ruleConfig.currencySymbol === symbol
                          ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {symbol}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Auto-Approval Ceiling Threshold
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 text-sm">
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
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Invoices above this amount are automatically <span className="text-amber-400 font-medium">FLAGGED</span> for manager review, even if math is valid.
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Strict Math Reconciliation (Subtotal + Tax = Total)</span>
                  <input
                    type="checkbox"
                    checked={ruleConfig.strictMathCheck}
                    onChange={(e) =>
                      setRuleConfig((prev) => ({ ...prev, strictMathCheck: e.target.checked }))
                    }
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>

                <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
                  <span>Auto-commit approved invoices to Audit Ledger</span>
                  <input
                    type="checkbox"
                    checked={ruleConfig.autoSaveToLedger}
                    onChange={(e) =>
                      setRuleConfig((prev) => ({ ...prev, autoSaveToLedger: e.target.checked }))
                    }
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500"
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
