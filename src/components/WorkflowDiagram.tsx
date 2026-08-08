import React from 'react';
import { Upload, FileSearch, CheckCircle2, AlertTriangle, Database, ArrowRight } from 'lucide-react';

interface WorkflowDiagramProps {
  currentStage?: 'idle' | 'ocr' | 'validate' | 'decision' | 'complete';
  theme?: 'dark' | 'light';
}

export const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({
  currentStage = 'idle',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const stages = [
    {
      id: 'ocr',
      label: '1. Ingestion & Multimodal OCR',
      desc: 'Gemini 2-Pass Direct Read',
      icon: Upload,
    },
    {
      id: 'extract',
      label: '2. Schema Extraction',
      desc: 'Vendor, Dates, Line Items',
      icon: FileSearch,
    },
    {
      id: 'validate',
      label: '3. Math & Field Audit',
      desc: 'Reconcile Subtotal + Tax',
      icon: CheckCircle2,
    },
    {
      id: 'decision',
      label: '4. Rule Decision Matrix',
      desc: 'Approved / Flagged / Rejected',
      icon: AlertTriangle,
    },
    {
      id: 'complete',
      label: '5. Ledger Sync & Log',
      desc: 'Plain-English Summary Commit',
      icon: Database,
    },
  ];

  return (
    <div
      className={`border rounded-xl p-3.5 my-4 shadow-sm transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <h3
          className={`text-[11px] sm:text-xs font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}
        >
          Single-Pass Workflow Pipeline Architecture
        </h3>
        <span
          className={`text-[10px] sm:text-[11px] font-mono ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Model: <span className="text-indigo-500 font-semibold">gemini-3.6-flash</span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 relative">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = currentStage === stage.id || currentStage === 'complete';
          const isProcessing =
            (currentStage === 'ocr' && idx <= 1) ||
            (currentStage === 'validate' && idx <= 2) ||
            (currentStage === 'decision' && idx <= 3);

          return (
            <div
              key={stage.id}
              className={`flex flex-col p-2.5 rounded-lg border transition-all relative ${
                isProcessing
                  ? isDark
                    ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md shadow-indigo-900/20 ring-1 ring-indigo-500/30'
                    : 'bg-indigo-50 border-indigo-400 shadow-sm ring-1 ring-indigo-300'
                  : isActive
                  ? isDark
                    ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                    : 'bg-slate-100 border-slate-300 text-slate-800'
                  : isDark
                  ? 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Icon
                  className={`w-4 h-4 ${
                    isProcessing
                      ? 'text-indigo-500 animate-pulse'
                      : isActive
                      ? 'text-emerald-500'
                      : 'text-slate-400'
                  }`}
                />
                {idx < stages.length - 1 && (
                  <ArrowRight
                    className={`w-3 h-3 hidden md:block absolute -right-2 top-3 z-10 ${
                      isDark ? 'text-slate-600' : 'text-slate-300'
                    }`}
                  />
                )}
              </div>
              <span
                className={`text-xs font-semibold leading-tight ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {stage.label}
              </span>
              <span
                className={`text-[10px] mt-0.5 leading-tight ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                {stage.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
