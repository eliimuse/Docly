import React from 'react';
import { motion } from 'motion/react';
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
      title: 'Database Ledger',
      subtitle: 'Central Ledger / ERP Sync',
      icon: Database,
      color: 'text-sky-400',
      bgColor: 'bg-sky-500/10 border-sky-500/20',
    },
    {
      id: 'email',
      title: 'Real-time Alerts',
      subtitle: 'Stakeholder Notifications',
      icon: BellRing,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      id: 'reports',
      title: 'Audit Logs',
      subtitle: 'Compliance & Verification',
      icon: FileCheck2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative overflow-hidden rounded-2xl p-4 sm:p-5 backdrop-blur-xl border shadow-xl transition-all ${
        isDark
          ? 'bg-slate-900/60 border-slate-800/80 shadow-indigo-950/20 text-slate-100'
          : 'bg-white/80 border-slate-200/80 shadow-slate-200 text-slate-900'
      }`}
    >
      {/* Glow Effect Accent */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800/60">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-indigo-300 via-sky-300 to-teal-200 bg-clip-text text-transparent">
              System Architecture: Universal Document-to-Workflow Engine
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              Real-time multi-stage AI document classification, schema extraction & decisioning
            </p>
          </div>
        </div>

        {currentStage !== 'idle' && (
          <motion.span
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-[10px] font-mono px-3 py-1 rounded-full font-bold uppercase tracking-wider self-start sm:self-center shrink-0 flex items-center gap-1.5 ${
              currentStage === 'complete'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-950 animate-pulse'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${currentStage === 'complete' ? 'bg-emerald-400' : 'bg-indigo-400 animate-ping'}`} />
            {currentStage === 'complete' ? 'Pipeline Executed' : `Stage: ${currentStage.toUpperCase()}`}
          </motion.span>
        )}
      </div>

      {/* Main Flow Grid */}
      <div className="flex flex-col items-center">
        {/* Main Linear Nodes */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2 sm:gap-2.5">
          {mainPipeline.map((step, idx) => {
            const Icon = step.icon;
            const isDone = currentLevel > step.level || currentStage === 'complete';
            const isCurrent = currentLevel === step.level && currentStage !== 'complete';

            return (
              <div key={step.id} className="relative flex flex-col items-center">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`w-full p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-between min-h-[96px] backdrop-blur-md ${
                    isCurrent
                      ? isDark
                        ? 'bg-indigo-950/90 border-indigo-500 text-indigo-100 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-950'
                        : 'bg-indigo-50 border-indigo-500 text-indigo-950 ring-2 ring-indigo-300'
                      : isDone
                      ? isDark
                        ? 'bg-slate-800/80 border-slate-700/80 text-slate-200 shadow-xs'
                        : 'bg-slate-100 border-slate-300 text-slate-800'
                      : isDark
                      ? 'bg-slate-950/40 border-slate-800/50 text-slate-500'
                      : 'bg-slate-50/80 border-slate-200 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center mb-1">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        isCurrent
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                          : isDone
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800/50 text-slate-500 border border-slate-800'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isCurrent
                            ? 'text-indigo-300 animate-bounce'
                            : isDone
                            ? 'text-emerald-400'
                            : 'text-slate-500'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="text-center w-full">
                    <div className="text-[11px] font-bold leading-tight truncate">
                      {step.title}
                    </div>
                    <div
                      className={`text-[9px] mt-0.5 leading-tight truncate ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}
                    >
                      {step.subtitle}
                    </div>
                  </div>
                </motion.div>

                {/* Arrow for horizontal layout on larger screens */}
                {idx < mainPipeline.length - 1 && (
                  <ArrowRight
                    className={`hidden lg:block absolute -right-3 top-9 z-10 w-4 h-4 transition-colors ${
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
            Automated Action Execution & Integrations
          </span>
        </div>

        {/* Output Branching Grid */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-dashed border-slate-800/80">
          {outputs.map((out) => {
            const Icon = out.icon;
            const isOutputActive = currentStage === 'complete' || currentStage === 'workflow';

            return (
              <motion.div
                key={out.id}
                whileHover={{ scale: 1.01 }}
                className={`p-3 rounded-xl border flex items-center space-x-3 transition-all backdrop-blur-md ${
                  isOutputActive
                    ? isDark
                      ? 'bg-slate-800/90 border-slate-700 text-slate-100 shadow-md shadow-slate-950/40'
                      : 'bg-white border-slate-300 text-slate-800 shadow-xs'
                    : isDark
                    ? 'bg-slate-950/30 border-slate-800/50 text-slate-500'
                    : 'bg-slate-50/80 border-slate-200 text-slate-400'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                    isOutputActive
                      ? out.bgColor
                      : isDark
                      ? 'bg-slate-900 border-slate-800 text-slate-600'
                      : 'bg-slate-100 border-slate-200 text-slate-400'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isOutputActive ? out.color : 'text-slate-500'}`} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{out.title}</div>
                  <div className="text-[10px] text-slate-400 truncate">{out.subtitle}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

