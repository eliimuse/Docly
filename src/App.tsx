import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { UploadView } from './components/UploadView';
import { LedgerView } from './components/LedgerView';
import { InvoiceDetailModal } from './components/InvoiceDetailModal';
import { InvoiceRecord, WorkflowRuleConfig, DecisionStatus } from './types';
import { DEFAULT_WORKFLOW_CONFIG, INITIAL_LEDGER_RECORDS } from './data/sampleInvoices';

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'ledger'>('upload');
  const [ruleConfig, setRuleConfig] = useState<WorkflowRuleConfig>(DEFAULT_WORKFLOW_CONFIG);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Navbar Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        recordCount={records.length}
        ruleConfig={ruleConfig}
        setRuleConfig={setRuleConfig}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'upload' ? (
          <UploadView onSaveToLedger={handleSaveToLedger} ruleConfig={ruleConfig} />
        ) : (
          <LedgerView
            records={records}
            onSelectRecord={(rec) => setSelectedRecordModal(rec)}
            onOverrideStatus={handleOverrideStatus}
            onDeleteRecord={handleDeleteRecord}
            onResetLedger={handleResetLedger}
            ruleConfig={ruleConfig}
          />
        )}
      </main>

      {/* Drill-down Modal */}
      <InvoiceDetailModal
        record={selectedRecordModal}
        onClose={() => setSelectedRecordModal(null)}
        onOverrideStatus={handleOverrideStatus}
      />
    </div>
  );
}
