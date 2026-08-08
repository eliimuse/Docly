import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Filter,
  Download,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  RotateCcw,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { InvoiceRecord, DecisionStatus, WorkflowRuleConfig } from '../types';
import { BadgeStatus } from './UploadView';

interface LedgerViewProps {
  records: InvoiceRecord[];
  onSelectRecord: (record: InvoiceRecord) => void;
  onOverrideStatus: (id: string, newStatus: DecisionStatus, reason: string) => void;
  onDeleteRecord: (id: string) => void;
  onResetLedger: () => void;
  ruleConfig: WorkflowRuleConfig;
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  records,
  onSelectRecord,
  onOverrideStatus,
  onDeleteRecord,
  onResetLedger,
  ruleConfig,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Calculate Metrics
  const metrics = useMemo(() => {
    let approvedCount = 0;
    let approvedSum = 0;
    let flaggedCount = 0;
    let flaggedSum = 0;
    let rejectedCount = 0;
    let rejectedSum = 0;
    let totalVolume = 0;

    records.forEach((r) => {
      const status = r.overrideStatus || r.extractedData.decision.status;
      const amount = r.extractedData.total_amount || 0;
      totalVolume += amount;

      if (status === 'approved') {
        approvedCount++;
        approvedSum += amount;
      } else if (status === 'flagged') {
        flaggedCount++;
        flaggedSum += amount;
      } else if (status === 'rejected') {
        rejectedCount++;
        rejectedSum += amount;
      }
    });

    return {
      totalCount: records.length,
      totalVolume,
      approvedCount,
      approvedSum,
      flaggedCount,
      flaggedSum,
      rejectedCount,
      rejectedSum,
    };
  }, [records]);

  // Filtered List
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const status = r.overrideStatus || r.extractedData.decision.status;
      const matchesStatus =
        selectedStatusFilter === 'ALL' || status.toUpperCase() === selectedStatusFilter;

      const vendor = (r.extractedData.vendor_name || '').toLowerCase();
      const invNum = (r.extractedData.invoice_number || '').toLowerCase();
      const summary = (r.extractedData.summary || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch =
        vendor.includes(query) || invNum.includes(query) || summary.includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [records, searchQuery, selectedStatusFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    if (records.length === 0) return;

    const headers = [
      'Record ID',
      'Timestamp',
      'File Name',
      'Vendor Name',
      'Invoice Number',
      'Invoice Date',
      'Subtotal',
      'Tax GST',
      'Total Amount',
      'Currency',
      'Original Status',
      'Effective Status',
      'Override Reason',
      'Summary Log',
    ];

    const rows = records.map((r) => [
      r.id,
      r.timestamp,
      `"${r.fileName}"`,
      `"${r.extractedData.vendor_name || ''}"`,
      `"${r.extractedData.invoice_number || ''}"`,
      `"${r.extractedData.invoice_date || ''}"`,
      r.extractedData.subtotal || 0,
      r.extractedData.tax_gst || 0,
      r.extractedData.total_amount || 0,
      `"${r.extractedData.currency || 'INR'}"`,
      r.extractedData.decision.status,
      r.overrideStatus || r.extractedData.decision.status,
      `"${r.overrideReason || ''}"`,
      `"${(r.extractedData.summary || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `invoice_ap_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Volume</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-extrabold text-white">
            {ruleConfig.currencySymbol}
            {metrics.totalVolume.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across <span className="font-semibold text-slate-200">{metrics.totalCount}</span> total
            documents processed
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-emerald-400">
            {ruleConfig.currencySymbol}
            {metrics.approvedSum.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="font-semibold text-emerald-300">{metrics.approvedCount}</span> invoices
            auto-posted
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Flagged Review</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-amber-400">
            {ruleConfig.currencySymbol}
            {metrics.flaggedSum.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="font-semibold text-amber-300">{metrics.flaggedCount}</span> invoices
            awaiting sign-off
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm border-l-4 border-l-red-500">
          <div className="flex items-center justify-between text-red-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-red-400">
            {ruleConfig.currencySymbol}
            {metrics.rejectedSum.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            <span className="font-semibold text-red-300">{metrics.rejectedCount}</span> failed
            compliance
          </div>
        </div>
      </div>

      {/* Filter & Action Controls Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vendor, invoice # or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filters & Actions */}
        <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {['ALL', 'APPROVED', 'FLAGGED', 'REJECTED'].map((filterKey) => (
              <button
                key={filterKey}
                onClick={() => setSelectedStatusFilter(filterKey)}
                className={`px-2.5 py-1 rounded font-medium text-[11px] transition-colors ${
                  selectedStatusFilter === filterKey
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {filterKey}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
              title="Export CSV Log"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">Export CSV</span>
            </button>

            <button
              onClick={onResetLedger}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs"
              title="Reset Dataset to Default Demo Samples"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Vendor Name</th>
                <th className="p-3.5">Invoice #</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5">Workflow Status</th>
                <th className="p-3.5">Accounting Summary</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.map((record) => {
                const effectiveStatus =
                  record.overrideStatus || record.extractedData.decision.status;
                return (
                  <tr
                    key={record.id}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectRecord(record)}
                  >
                    <td className="p-3.5 font-bold text-slate-100">
                      <div>{record.extractedData.vendor_name || 'Unidentified'}</div>
                      <div className="text-[10px] font-normal text-slate-500 font-mono mt-0.5">
                        {record.fileName}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-300">
                      {record.extractedData.invoice_number || 'N/A'}
                    </td>

                    <td className="p-3.5 text-slate-400">
                      {record.extractedData.invoice_date || 'N/A'}
                    </td>

                    <td className="p-3.5 text-right font-mono font-extrabold text-slate-100 text-sm">
                      {record.extractedData.currency || ruleConfig.currencySymbol}{' '}
                      {(record.extractedData.total_amount || 0).toLocaleString()}
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-col space-y-1">
                        <BadgeStatus status={effectiveStatus} size="sm" />
                        {record.overrideStatus && (
                          <span className="text-[9px] text-indigo-400 font-semibold italic">
                            (Manager Override)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-slate-400 max-w-xs truncate">
                      {record.extractedData.summary}
                    </td>

                    <td
                      className="p-3.5 text-right space-x-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onSelectRecord(record)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded hover:text-white"
                        title="View Full Detail Modal"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        className="p-1.5 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded"
                        title="Delete Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No invoice records found matching current query or filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
