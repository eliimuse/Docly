import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { UploadView } from './components/UploadView';
import { LedgerView } from './components/LedgerView';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { IntroScreen } from './components/IntroScreen';
import { InvoiceRecord, WorkflowRuleConfig, DecisionStatus } from './types';
import { DEFAULT_WORKFLOW_CONFIG, INITIAL_LEDGER_RECORDS } from './data/sampleInvoices';

export default function App() {
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'upload' | 'ledger'>('upload');
  const [ruleConfig, setRuleConfig] = useState<WorkflowRuleConfig>(DEFAULT_WORKFLOW_CONFIG);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem('docly_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (e) {}
    return 'dark';
  });

  useEffect(() => {
    try {
      localStorage.setItem('docly_theme', theme);
    } catch (e) {}
  }, [theme]);

  // Invoices Ledger State (persisted in localStorage + synced with backend)
  const [records, setRecords] = useState<InvoiceRecord[]>(() => {
    try {
      const saved = localStorage.getItem('invoice_ap_ledger');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load local storage records:', e);
    }
    return INITIAL_LEDGER_RECORDS;
  });

  const [selectedRecordModal, setSelectedRecordModal] = useState<InvoiceRecord | null>(null);

  // Save records to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem('invoice_ap_ledger', JSON.stringify(records));
    } catch (e) {
      console.warn('Failed to save records to localStorage:', e);
    }
  }, [records]);

  // Handle saving new invoice record to ledger
  const handleSaveToLedger = (newRecord: InvoiceRecord) => {
    setRecords((prev) => {
      const existingIdx = prev.findIndex((r) => r.id === newRecord.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = newRecord;
        return updated;
      }
      return [newRecord, ...prev];
    });

    // Also sync to server in background
    fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: newRecord }),
    }).catch((err) => console.warn('Backend sync warning:', err));
  };

  // Handle manual manager override
  const handleOverrideStatus = (id: string, overrideStatus: DecisionStatus, overrideReason: string) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, overrideStatus, overrideReason };
        }
        return r;
      })
    );

    // Sync override to server
    fetch(`/api/invoices/${id}/override`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overrideStatus, overrideReason }),
    }).catch((err) => console.warn('Backend sync warning:', err));
  };

  // Handle delete record
  const handleDeleteRecord = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
    fetch(`/api/invoices/${id}`, { method: 'DELETE' }).catch((err) =>
      console.warn('Backend sync warning:', err)
    );
  };

  // Reset dataset to initial defaults
  const handleResetLedger = () => {
    setRecords(INITIAL_LEDGER_RECORDS);
    localStorage.removeItem('invoice_ap_ledger');
  };

  return (
    <div
      className={`min-h-screen font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200 overflow-x-hidden ${
        theme === 'dark'
          ? 'bg-slate-950 text-slate-100 dark'
          : 'bg-slate-100 text-slate-900 light'
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-indigo-600 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none font-bold text-xs"
      >
        Skip to main content
      </a>

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="w-full min-h-screen"
          >
            <IntroScreen
              onGetStarted={() => setShowIntro(false)}
              theme={theme}
            />
          </motion.div>
        ) : (
          <motion.div
            key="main-docly-app"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            {/* Navbar Header */}
            <Header
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              recordCount={records.length}
              ruleConfig={ruleConfig}
              setRuleConfig={setRuleConfig}
              theme={theme}
              setTheme={setTheme}
              onOpenIntro={() => setShowIntro(true)}
            />

            {/* Main Container */}
            <main id="main-content" tabIndex={-1} className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden w-full flex-1 focus-visible:outline-none">
              {activeTab === 'upload' ? (
                <UploadView
                  onSaveToLedger={handleSaveToLedger}
                  ruleConfig={ruleConfig}
                  theme={theme}
                />
              ) : (
                <LedgerView
                  records={records}
                  onSelectRecord={(rec) => setSelectedRecordModal(rec)}
                  onOverrideStatus={handleOverrideStatus}
                  onDeleteRecord={handleDeleteRecord}
                  onResetLedger={handleResetLedger}
                  ruleConfig={ruleConfig}
                  theme={theme}
                />
              )}
            </main>

            {/* Drill-down Modal */}
            <InvoiceDetailModal
              record={selectedRecordModal}
              onClose={() => setSelectedRecordModal(null)}
              onOverrideStatus={handleOverrideStatus}
              theme={theme}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
