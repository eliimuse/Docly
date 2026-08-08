import React, { useState } from 'react';
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
}

export const InvoiceDetailModal: React.FC<InvoiceDetailModalProps> = ({
  record,
  onClose,
  onOverrideStatus,
}) => {
  if (!record) return null;

  const [overrideStatus, setOverrideStatus] = useState<DecisionStatus>(
    record.overrideStatus || record.extractedData.decision.status
  );
  const [overrideReason, setOverrideReason] = useState<string>(
    record.overrideReason || 'Manager manual approval override.'
  );

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'json' | 'override'>('details');

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

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-950 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">
                  {d.vendor_name || 'Unidentified Vendor'}
                </h3>
                <BadgeStatus status={effectiveStatus} size="sm" />
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Invoice #{d.invoice_number || 'N/A'} • ID: {record.id}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Accounting Summary Banner */}
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 text-xs text-indigo-200 flex items-start space-x-2">
          <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-indigo-300 mr-1">Plain-English Log:</span>
            <span>{d.summary}</span>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-5">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Invoice Breakdown
          </button>
          <button
            onClick={() => setActiveTab('override')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1 ${
              activeTab === 'override'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Manager Override</span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1 ${
              activeTab === 'json'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>JSON Payload</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'details' && (
            <>
              {/* Field Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Invoice Date
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {d.invoice_date || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Subtotal
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {d.currency || '₹'} {(d.subtotal || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Tax / GST
                  </span>
                  <span className="text-xs font-semibold text-slate-200">
                    {d.currency || '₹'} {(d.tax_gst || 0).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Total Amount
                  </span>
                  <span className="text-sm font-extrabold text-emerald-400">
                    {d.currency || '₹'} {(d.total_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Validation & Decision */}
              <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                <div className="font-bold text-slate-200">Decision Justification:</div>
                <p className="text-slate-400">{d.decision.reason}</p>
                {record.overrideReason && (
                  <div className="pt-2 border-t border-slate-800 text-indigo-300">
                    <span className="font-bold">Manager Override Note: </span>
                    {record.overrideReason}
                  </div>
                )}
              </div>

              {/* Line Items */}
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Extracted Line Items ({d.line_items?.length || 0})
                </h4>
                <div className="overflow-x-auto border border-slate-800 rounded-lg">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                      <tr>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-right">Qty</th>
                        <th className="p-2.5 text-right">Unit Price</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {d.line_items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-medium text-slate-200">
                            {item.description}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-400">
                            {item.quantity}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-400">
                            {(item.unit_price || 0).toLocaleString()}
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-slate-100">
                            {(item.amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {activeTab === 'override' && (
            <div className="space-y-4">
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
            <div className="relative">
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
