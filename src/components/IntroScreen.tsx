import React from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Receipt,
  ShieldCheck,
  Sparkles,
  Brain,
  CheckCircle2,
  Zap,
  BarChart3,
  FileSpreadsheet,
  ArrowRight,
  UserCheck,
  Package,
  GraduationCap,
  Scale,
  GitFork,
  BadgeCheck,
  Layers,
  Cpu,
  TrendingUp,
  Briefcase
} from 'lucide-react';

interface IntroScreenProps {
  onGetStarted: () => void;
  theme: 'dark' | 'light';
}

interface FloatingIcon {
  id: string;
  Icon: React.ElementType;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  size: number;
  top: string;
  left: string;
  floatDelay: number;
  duration: number;
  rotateDeg: number;
}

const FLOATING_ICONS: FloatingIcon[] = [
  {
    id: 'icon-resume',
    Icon: UserCheck,
    label: 'Resumes & Profiles',
    color: 'text-sky-400',
    bgColor: 'bg-sky-500/10',
    borderColor: 'border-sky-500/30',
    size: 28,
    top: '12%',
    left: '10%',
    floatDelay: 0,
    duration: 6,
    rotateDeg: -12,
  },
  {
    id: 'icon-po',
    Icon: Package,
    label: 'Purchase Orders',
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/30',
    size: 32,
    top: '22%',
    left: '80%',
    floatDelay: 1,
    duration: 7,
    rotateDeg: 15,
  },
  {
    id: 'icon-workflow',
    Icon: GitFork,
    label: 'Dynamic AI Workflow',
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/30',
    size: 30,
    top: '65%',
    left: '8%',
    floatDelay: 2,
    duration: 8,
    rotateDeg: 8,
  },
  {
    id: 'icon-student',
    Icon: GraduationCap,
    label: 'Student Applications',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    size: 26,
    top: '75%',
    left: '82%',
    floatDelay: 0.5,
    duration: 6.5,
    rotateDeg: -8,
  },
  {
    id: 'icon-invoice',
    Icon: Receipt,
    label: 'Invoices & Receipts',
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/10',
    borderColor: 'border-teal-500/30',
    size: 28,
    top: '40%',
    left: '88%',
    floatDelay: 1.5,
    duration: 7.5,
    rotateDeg: -15,
  },
  {
    id: 'icon-contract',
    Icon: Scale,
    label: 'Legal Contracts',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    size: 26,
    top: '48%',
    left: '5%',
    floatDelay: 2.5,
    duration: 6.8,
    rotateDeg: 10,
  },
  {
    id: 'icon-id',
    Icon: BadgeCheck,
    label: 'ID Verification',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10',
    borderColor: 'border-cyan-500/30',
    size: 24,
    top: '82%',
    left: '30%',
    floatDelay: 0.8,
    duration: 7.2,
    rotateDeg: -5,
  },
  {
    id: 'icon-decision',
    Icon: Brain,
    label: 'AI Decision Engine',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    size: 26,
    top: '10%',
    left: '68%',
    floatDelay: 1.2,
    duration: 6.2,
    rotateDeg: 12,
  },
];

export const IntroScreen: React.FC<IntroScreenProps> = ({ onGetStarted, theme }) => {
  const isDark = theme === 'dark';

  return (
    <div className={`relative min-h-screen w-full flex flex-col items-center justify-between overflow-hidden transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* ---------------- BACKGROUND ANIMATED GRADIENT & PARTICLES ---------------- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Animated ambient light blobs */}
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            x: [-40, 40, -40],
            y: [-30, 30, -30],
            opacity: isDark ? [0.25, 0.45, 0.25] : [0.15, 0.3, 0.15],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 blur-[130px] opacity-30"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [50, -30, 50],
            y: [40, -40, 40],
            opacity: isDark ? [0.2, 0.4, 0.2] : [0.1, 0.25, 0.1],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute -bottom-40 right-1/4 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-400 blur-[150px] opacity-25"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: isDark ? [0.15, 0.3, 0.15] : [0.08, 0.18, 0.08],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-gradient-to-r from-emerald-500/30 via-teal-500/30 to-indigo-500/30 blur-[140px]"
        />

        {/* Subtle grid pattern background */}
        <div
          className={`absolute inset-0 opacity-[0.03] ${
            isDark ? 'bg-[radial-gradient(#fff_1px,transparent_1px)]' : 'bg-[radial-gradient(#000_1px,transparent_1px)]'
          } [background-size:24px_24px]`}
        />
      </div>

      {/* ---------------- FLOATING RELEVANT ICONS WITH HOVER ANIMATIONS ---------------- */}
      <div className="absolute inset-0 pointer-events-none z-10 hidden md:block">
        {FLOATING_ICONS.map((item) => {
          const { id, Icon, label, color, bgColor, borderColor, size, top, left, floatDelay, duration, rotateDeg } = item;
          return (
            <motion.div
              key={id}
              style={{ top, left }}
              className="absolute pointer-events-auto group cursor-pointer"
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{
                opacity: 1,
                scale: 1,
                y: [0, -14, 0, 10, 0],
                rotate: [rotateDeg, rotateDeg + 4, rotateDeg - 4, rotateDeg],
              }}
              transition={{
                opacity: { duration: 0.8 },
                scale: { duration: 0.8 },
                y: { duration, repeat: Infinity, ease: 'easeInOut', delay: floatDelay },
                rotate: { duration: duration * 1.5, repeat: Infinity, ease: 'easeInOut', delay: floatDelay },
              }}
              whileHover={{
                scale: 1.25,
                rotate: 0,
                zIndex: 30,
                transition: { type: 'spring', stiffness: 400, damping: 15 },
              }}
            >
              <div className={`relative flex items-center gap-2 px-3 py-2 rounded-2xl border backdrop-blur-md shadow-lg transition-all duration-300 ${
                isDark
                  ? `${bgColor} ${borderColor} hover:border-slate-400/50 hover:bg-slate-900/90 hover:shadow-indigo-500/20`
                  : 'bg-white/80 border-slate-200/80 hover:border-indigo-300 hover:bg-white hover:shadow-xl'
              }`}>
                <div className={`p-1.5 rounded-xl ${bgColor}`}>
                  <Icon className={`${size ? `w-5 h-5` : 'w-5 h-5'} ${color}`} />
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap transition-colors ${
                  isDark ? 'text-slate-200 group-hover:text-white' : 'text-slate-700 group-hover:text-slate-900'
                }`}>
                  {label}
                </span>

                {/* Subtle pulse ring on hover */}
                <span className={`absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xs bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 -z-10`} />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ---------------- TOP NAVBAR BRAND DISPLAY ---------------- */}
      <header className="relative z-20 w-full max-w-7xl px-6 py-6 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-md shadow-indigo-500/20">
            <FileText className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500" />
            </span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-300 bg-clip-text text-transparent">
              Docly
            </span>
            <span className={`block text-[10px] font-medium tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Universal Document & Workflow AI
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <div className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 ${
            isDark ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-xs'
          }`}>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Gemini 3.6 Flash Document Engine
          </div>
        </motion.div>
      </header>

      {/* ---------------- MAIN HERO CONTENT ---------------- */}
      <main className="relative z-20 w-full max-w-5xl px-6 py-10 my-auto flex flex-col items-center text-center">
        {/* Top Badge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6"
        >
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wide border shadow-sm ${
            isDark
              ? 'bg-indigo-950/50 border-indigo-800/60 text-indigo-300'
              : 'bg-indigo-50 border-indigo-200 text-indigo-700'
          }`}>
            <Sparkles className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <span>Universal Document-to-Workflow AI Engine</span>
          </div>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight max-w-4xl leading-[1.15]"
        >
          Transform Any Document into{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-sky-400 to-teal-300 bg-clip-text text-transparent">
            Automated Workflows
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className={`mt-6 text-lg sm:text-xl max-w-2xl font-normal leading-relaxed ${
            isDark ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          Upload Resumes, Purchase Orders, Contracts, Student Applications, or Invoices. Docly automatically classifies the document, extracts key data, generates dynamic workflow steps, and executes instant decisions.
        </motion.p>

        {/* GET STARTED ACTION BUTTON WITH GLOW & HOVER ANIMATION */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <motion.button
            onClick={onGetStarted}
            whileHover={{ scale: 1.05, boxShadow: '0 20px 35px -10px rgba(99, 102, 241, 0.45)' }}
            whileTap={{ scale: 0.97 }}
            className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-300 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 shadow-xl shadow-indigo-600/30 cursor-pointer overflow-hidden"
          >
            {/* Animated shimmer sweep */}
            <span className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-12 -translate-x-full group-hover:translate-x-[300%] transition-transform duration-1000 ease-in-out" />
            
            <span className="relative flex items-center gap-3">
              <span>Launch Workflow Engine</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </motion.div>
            </span>
          </motion.button>

          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            ⚡ Instant setup &bull; Multi-document intelligence &bull; Live Ledger Sync
          </span>
        </motion.div>

        {/* ---------------- FEATURE HIGHLIGHT CARDS (INTERACTIVE HOVER) ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-4xl text-left"
        >
          {/* Card 1 */}
          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className={`p-5 rounded-2xl border backdrop-blur-md transition-all duration-200 ${
              isDark
                ? 'bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/90'
                : 'bg-white/80 border-slate-200 hover:border-indigo-300 hover:bg-white shadow-sm'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Universal Document Classifier
            </h3>
            <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Automatically identifies Resumes, POs, Contracts, Student Applications, and Invoices with zero manual configuration.
            </p>
          </motion.div>

          {/* Card 2 */}
          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className={`p-5 rounded-2xl border backdrop-blur-md transition-all duration-200 ${
              isDark
                ? 'bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/90'
                : 'bg-white/80 border-slate-200 hover:border-emerald-300 hover:bg-white shadow-sm'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
              <GitFork className="w-5 h-5" />
            </div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Dynamic Workflow Generation
            </h3>
            <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              AI generates tailor-made workflow action steps dynamically for every document type (Extraction, Inventory, Match Score, Approvals).
            </p>
          </motion.div>

          {/* Card 3 */}
          <motion.div
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            className={`p-5 rounded-2xl border backdrop-blur-md transition-all duration-200 ${
              isDark
                ? 'bg-slate-900/60 border-slate-800/80 hover:border-sky-500/40 hover:bg-slate-900/90'
                : 'bg-white/80 border-slate-200 hover:border-sky-300 hover:bg-white shadow-sm'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-3">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className={`text-base font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              Decision Agent & Central Ledger
            </h3>
            <p className={`mt-1 text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Instant automated decisioning (Approved, Shortlisted, Flagged, Rejected) with full audit logs and drill-down analytics.
            </p>
          </motion.div>
        </motion.div>
      </main>

      {/* ---------------- FOOTER STATS & ACCENTS ---------------- */}
      <footer className="relative z-20 w-full max-w-7xl px-6 py-6 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Auto-Generated Custom Action Checklists
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            <span className={isDark ? 'text-slate-400' : 'text-slate-600'}>
              Universal Document Intelligence & Ledger
            </span>
          </div>
        </div>

        <div className={isDark ? 'text-slate-500' : 'text-slate-400'}>
          Docly AP Intelligence &copy; {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};
