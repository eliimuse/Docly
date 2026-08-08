import React, { useState } from 'react';
import { useFocusTrap } from '../lib/useFocusTrap';
import {
  X,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Code,
  Calendar,
  Building,
  DollarSign,
  Clock,
  Edit3,
} from 'lucide-react';
import { InvoiceRecord, DecisionStatus } from '../types';
import { BadgeStatus } from './UploadView';

interface InvoiceDetailModalProps {
  record: InvoiceRecord | null;
  onClose: () => void;
  onOverrideStatus: (id: string, newStatus: DecisionStatus, reason: string) => void;
  theme?: 'dark' | 'light';
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  record,
  onClose,
  onOverrideStatus,
  theme = 'dark',
}) => {
  if (!record) return null;

  const isDark = theme === 'dark';

  const [overrideStatus, setOverrideStatus] = useState<DecisionStatus>(
    record.overrideStatus || record.extractedData.decision.status
  );
  const [overrideReason, setOverrideReason] = useState<string>(
    record.overrideReason || 'Manager manual approval override.'
  );

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'json' | 'override'>('details');

  const modalRef = useFocusTrap<HTMLDivElement>(true, onClose);

  const d = record.extractedData;
  const effectiveStatus = record.overrideStatus || d.decision.status;

  const handleApplyOverride = () => {
    onOverrideStatus(record.id, overrideStatus, overrideReason);
    onClose();
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTabKeyDown = (e: React.KeyboardEvent) => {
    const tabsList: Array<'details' | 'override' | 'json'> = ['details', 'override', 'json'];
    const currentIndex = tabsList.indexOf(activeTab);
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % tabsList.length;
      setActiveTab(tabsList[nextIndex]);
      setTimeout(() => {
        document.getElementById(`tab-${tabsList[nextIndex]}`)?.focus();
      }, 0);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + tabsList.length) % tabsList.length;
      setActiveTab(tabsList[prevIndex]);
      setTimeout(() => {
        document.getElementById(`tab-${tabsList[prevIndex]}`)?.focus();
      }, 0);
    }
  };

  return (
    <div
      ref={modalRef}
      tabIndex={-1}
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 focus-visible:outline-none"
      role="dialog"
      aria-modal="true"
      aria-labelledby="invoice-modal-title"
    >
      <div
        className={`border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div
          className={`p-4 sm:p-5 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50/90'
          }`}
        >
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                isDark ? 'bg-indigo-950 border-indigo-700/50 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="invoice-modal-title" className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {d.vendor_name || 'Unidentified Vendor'}
                </h3>
                <BadgeStatus status={effectiveStatus} size="sm" />
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Invoice #{d.invoice_number || 'N/A'} • ID: {record.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close invoice details modal"
            className={`p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isDark ? 'text-slate-400 hover:text-white bg-slate-800' : 'text-slate-500 hover:text-slate-900 bg-slate-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accounting Summary Banner */}
        <div
          className={`px-4 sm:px-5 py-3 border-b text-xs flex items-start space-x-2 ${
            isDark ? 'bg-slate-950 border-slate-800 text-indigo-200' : 'bg-indigo-50/80 border-slate-200 text-indigo-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-indigo-600 dark:text-indigo-300 mr-1">Plain-English Log:</span>
            <span>{d.summary}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div
          role="tablist"
          aria-label="Invoice Detail Sections"
          onKeyDown={handleTabKeyDown}
          className={`flex border-b px-4 sm:px-5 ${
            isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'
          }`}
        >
          <button
            role="tab"
            id="tab-details"
            aria-selected={activeTab === 'details'}
            aria-controls="panel-details"
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Invoice Breakdown
          </button>
          <button
            role="tab"
            id="tab-override"
            aria-selected={activeTab === 'override'}
            aria-controls="panel-override"
            onClick={() => setActiveTab('override')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'override'
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Manager Override</span>
          </button>
          <button
            role="tab"
            id="tab-json"
            aria-selected={activeTab === 'json'}
            aria-controls="panel-json"
            onClick={() => setActiveTab('json')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              activeTab === 'json'
                ? 'border-indigo-500 text-indigo-500 font-bold'
                : isDark
                ? 'border-transparent text-slate-400 hover:text-slate-200'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>JSON Payload</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {activeTab === 'details' && (
            <div
              role="tabpanel"
              id="panel-details"
              aria-labelledby="tab-details"
              tabIndex={0}
              className="space-y-5 focus-visible:outline-none"
            >
              {/* Document Type Header Badge */}
              {d.document_type && (
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white font-semibold text-[10px] uppercase tracking-wider">
                      CLASSIFIED TYPE
                    </span>
                    <span className="font-bold text-indigo-200 text-sm">
                      {d.document_type}
                    </span>
                  </div>
                  {d.document_title && (
                    <span className="text-slate-400 text-xs truncate max-w-xs">
                      {d.document_title}
                    </span>
                  )}
                </div>
              )}

              {/* Key Attributes Grid (Extracted Metadata) */}
              {d.key_attributes && d.key_attributes.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Extracted Key Attributes</span>
                  </h4>
                  <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {d.key_attributes.map((attr, idx) => (
                      <div key={idx} className={`p-2 rounded border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                          {attr.label}
                        </span>
                        <span className={`text-xs font-semibold truncate block mt-0.5 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {attr.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Field Grid */}
              <div
                className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl border ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <span
                    className={`text-[10px] uppercase tracking-wider block ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Document Date
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {d.invoice_date || 'N/A'}
                  </span>
                </div>
                <div>
                  <span
                    className={`text-[10px] uppercase tracking-wider block ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Subtotal
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {d.currency || '₹'} {(d.subtotal || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span
                    className={`text-[10px] uppercase tracking-wider block ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Tax / GST
                  </span>
                  <span
                    className={`text-xs font-semibold ${
                      isDark ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    {d.currency || '₹'} {(d.tax_gst || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span
                    className={`text-[10px] uppercase tracking-wider block ${
                      isDark ? 'text-slate-400' : 'text-slate-500'
                    }`}
                  >
                    Total Amount
                  </span>
                  <span className="text-sm font-extrabold text-emerald-500">
                    {d.currency || '₹'} {(d.total_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Dynamic Workflow Steps */}
              {d.dynamic_workflow && d.dynamic_workflow.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>AI Dynamic Action Steps</span>
                  </h4>
                  <div className={`space-y-1.5 p-3 rounded-xl border ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {d.dynamic_workflow.map((step, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-2 rounded text-xs border ${
                          isDark ? 'bg-slate-900/60 border-slate-800/80' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0 pr-2">
                          <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span className={`font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {step.step_name}
                          </span>
                          {step.details && (
                            <span className="text-slate-400 text-[11px] truncate hidden sm:inline">
                              • {step.details}
                            </span>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            step.status === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : step.status === 'flagged'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          }`}
                        >
                          {step.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Validation & Decision */}
              <div
                className={`space-y-2 p-3.5 rounded-xl border text-xs ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div
                  className={`font-bold ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  Decision Justification:
                </div>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                  {d.decision.reason}
                </p>
                {record.overrideReason && (
                  <div
                    className={`pt-2 border-t text-indigo-500 ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    <span className="font-bold">Manager Override Note: </span>
                    {record.overrideReason}
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div>
                <h4
                  className={`text-xs font-bold uppercase tracking-wider mb-2 ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  Extracted Line Items ({d.line_items?.length || 0})
                </h4>
                <div
                  className={`overflow-x-auto border rounded-lg ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <table className="w-full text-left text-xs">
                    <thead
                      className={`border-b text-[11px] uppercase ${
                        isDark
                          ? 'bg-slate-950 text-slate-400 border-slate-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      <tr>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-right">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody
                      className={`divide-y ${
                        isDark
                          ? 'divide-slate-800/60 text-slate-300'
                          : 'divide-slate-200 text-slate-700'
                      }`}
                    >
                      {d.line_items?.map((item, idx) => {
                        const qty = item.quantity || 1;
                        const lineAmount = item.amount && item.amount > 0 ? item.amount : (qty * (item.unit_price || 0));
                        const unitPrice = item.unit_price && item.unit_price > 0 ? item.unit_price : (lineAmount > 0 ? (lineAmount / qty) : 0);
                        return (
                          <tr key={idx}>
                            <td
                              className={`p-2.5 font-medium ${
                                isDark ? 'text-slate-200' : 'text-slate-800'
                              }`}
                            >
                              {item.description}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono ${
                                isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              {qty}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono ${
                                isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}
                            >
                              {unitPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </td>
                            <td
                              className={`p-2.5 text-right font-mono font-semibold ${
                                isDark ? 'text-slate-100' : 'text-slate-900'
                              }`}
                            >
                              {lineAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'override' && (
            <div
              role="tabpanel"
              id="panel-override"
              aria-labelledby="tab-override"
              tabIndex={0}
              className="space-y-4 focus-visible:outline-none"
            >
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-white block mb-1">
                  Compliance Status Override
                </span>
                Override the automated decision made by the AI rules engine. Changes will be logged in the AP audit ledger.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select New Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['approved', 'flagged', 'rejected'] as DecisionStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setOverrideStatus(st)}
                      className={`p-3 rounded-lg border text-xs font-bold uppercase transition-all flex items-center justify-center space-x-1.5 ${
                        overrideStatus === st
                          ? st === 'approved'
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : st === 'flagged'
                            ? 'bg-amber-600 text-white border-amber-500'
                            : 'bg-red-600 text-white border-red-500'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{st}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Override Justification / Audit Reason
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Explain why this status is manually updated..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={handleApplyOverride}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  Save Manager Override & Log
                </button>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div
              role="tabpanel"
              id="panel-json"
              aria-labelledby="tab-json"
              tabIndex={0}
              className="relative focus-visible:outline-none"
            >
              <button
                onClick={handleCopyJson}
                className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded flex items-center space-x-1 z-10"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy JSON</span>
                  </>
                )}
              </button>

              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-96">
                {JSON.stringify(record, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
