import React from 'react';
import { Upload, FileSearch, CheckCircle2, AlertTriangle, Database, ArrowRight } from 'lucide-react';

interface WorkflowDiagramProps {
  currentStage?: 'idle' | 'ocr' | 'validate' | 'decision' | 'complete';
}

export const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({ currentStage = 'idle' }) => {
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 my-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Single-Pass Workflow Pipeline Architecture
        </h3>
        <span className="text-[11px] text-slate-400 font-mono">
          Model: <span className="text-indigo-400 font-medium">gemini-3.6-flash</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 relative">
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
                  ? 'bg-indigo-950/60 border-indigo-500/80 shadow-md shadow-indigo-900/20 ring-1 ring-indigo-500/30'
                  : isActive
                  ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <Icon
                  className={`w-4 h-4 ${
                    isProcessing
                      ? 'text-indigo-400 animate-pulse'
                      : isActive
                      ? 'text-emerald-400'
                      : 'text-slate-500'
                  }`}
                />
                {idx < stages.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-600 hidden sm:block absolute -right-2 top-3 z-10" />
                )}
              </div>
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {stage.label}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                {stage.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
