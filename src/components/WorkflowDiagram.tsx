import React from 'react';
import {
  Upload,
  FileText,
  Layers,
  Brain,
  CheckCircle2,
  Bot,
  GitFork,
  Database,
  BellRing,
  FileCheck2,
  ArrowDown,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export type PipelineStage =
  | 'idle'
  | 'upload'
  | 'ocr'
  | 'classify'
  | 'extract'
  | 'validate'
  | 'decision'
  | 'workflow'
  | 'complete';

interface WorkflowDiagramProps {
  currentStage?: PipelineStage;
  theme?: 'dark' | 'light';
}

export const WorkflowDiagram: React.FC<WorkflowDiagramProps> = ({
  currentStage = 'idle',
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  // Order of stages for calculating progress
  const stageOrder: Record<PipelineStage, number> = {
    idle: 0,
    upload: 1,
    ocr: 2,
    classify: 3,
    extract: 4,
    validate: 5,
    decision: 6,
    workflow: 7,
    complete: 8,
  };

  const currentLevel = stageOrder[currentStage] || 0;

  const mainPipeline = [
    {
      id: 'upload',
      level: 1,
      title: 'Upload File',
      subtitle: 'Image / PDF Ingestion',
      icon: Upload,
    },
    {
      id: 'ocr',
      level: 2,
      title: 'Document Parser',
      subtitle: 'OCR / Vision Read',
      icon: FileText,
    },
    {
      id: 'classify',
      level: 3,
      title: 'AI Classifier',
      subtitle: 'Identify Doc Type',
      icon: Layers,
    },
    {
      id: 'extract',
      level: 4,
      title: 'Document Understanding',
      subtitle: 'Data & Schema Extraction',
      icon: Brain,
    },
    {
      id: 'validate',
      level: 5,
      title: 'Validation',
      subtitle: 'Math & Policy Audit',
      icon: CheckCircle2,
    },
    {
      id: 'decision',
      level: 6,
      title: 'Decision Agent',
      subtitle: 'Status Determination',
      icon: Bot,
    },
    {
      id: 'workflow',
      level: 7,
      title: 'Workflow Engine',
      subtitle: 'Dynamic Action Dispatcher',
      icon: GitFork,
    },
  ];

  const outputs = [
    {
      id: 'db',
      title: 'Database',
      subtitle: 'Central Ledger / ERP',
      icon: Database,
      color: 'text-sky-400',
    },
    {
      id: 'email',
      title: 'Email / Alert',
      subtitle: 'Notifications & Approvals',
      icon: BellRing,
      color: 'text-amber-400',
    },
    {
      id: 'reports',
      title: 'Generated Reports',
      subtitle: 'Audit Logs & Documents',
      icon: FileCheck2,
      color: 'text-emerald-400',
    },
  ];

  return (
    <div
      className={`border rounded-xl p-4 my-4 shadow-sm transition-colors ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
      }`}
    >
      {/* Title */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800/60">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <h3
            className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-slate-200' : 'text-slate-800'
            }`}
          >
            System Architecture: Universal Document-to-Workflow Engine
          </h3>
        </div>
        {currentStage !== 'idle' && (
          <span
            className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
              currentStage === 'complete'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 animate-pulse'
            }`}
          >
            {currentStage === 'complete' ? 'Pipeline Completed' : `Processing: ${currentStage}`}
          </span>
        )}
      </div>

      {/* Main Flow Grid */}
      <div className="flex flex-col items-center">
        {/* Main Linear Nodes */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
          {mainPipeline.map((step, idx) => {
            const Icon = step.icon;
            const isDone = currentLevel > step.level || currentStage === 'complete';
            const isCurrent = currentLevel === step.level && currentStage !== 'complete';

            return (
              <div key={step.id} className="relative flex flex-col items-center">
                <div
                  className={`w-full p-2.5 rounded-lg border text-center transition-all flex flex-col items-center justify-between min-h-[92px] ${
                    isCurrent
                      ? isDark
                        ? 'bg-indigo-950/80 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-950'
                        : 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-300'
                      : isDone
                      ? isDark
                        ? 'bg-slate-800/90 border-slate-700 text-slate-200'
                        : 'bg-slate-100 border-slate-300 text-slate-800'
                      : isDark
                      ? 'bg-slate-950/50 border-slate-800/80 text-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    <Icon
                      className={`w-4 h-4 ${
                        isCurrent
                          ? 'text-indigo-400 animate-bounce'
                          : isDone
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    />
                  </div>
                  <div className="text-center">
                    <div className="text-[11px] font-bold leading-tight">
                      {step.title}
                    </div>
                    <div
                      className={`text-[9px] mt-0.5 leading-tight ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {step.subtitle}
                    </div>
                  </div>
                </div>

                {/* Arrow for horizontal layout on larger screens */}
                {idx < mainPipeline.length - 1 && (
                  <ArrowRight
                    className={`hidden lg:block absolute -right-2.5 top-8 z-10 w-3.5 h-3.5 ${
                      isDone
                        ? 'text-emerald-400'
                        : isDark
                        ? 'text-slate-700'
                        : 'text-slate-300'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Downward Connector to Workflow Outputs */}
        <div className="my-3 flex flex-col items-center text-slate-500">
          <ArrowDown className={`w-4 h-4 animate-bounce ${currentStage === 'complete' ? 'text-emerald-400' : 'text-indigo-400'}`} />
          <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 mt-0.5">
            Automated Action Execution
          </span>
        </div>

        {/* Output Branching Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-dashed border-slate-800">
          {outputs.map((out) => {
            const Icon = out.icon;
            const isOutputActive = currentStage === 'complete' || currentStage === 'workflow';

            return (
              <div
                key={out.id}
                className={`p-2.5 rounded-lg border flex items-center space-x-3 transition-all ${
                  isOutputActive
                    ? isDark
                      ? 'bg-slate-800/90 border-slate-700 text-slate-100 shadow-sm'
                      : 'bg-white border-slate-300 text-slate-800 shadow-xs'
                    : isDark
                    ? 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isDark ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isOutputActive ? out.color : 'text-slate-500'}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{out.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{out.subtitle}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
