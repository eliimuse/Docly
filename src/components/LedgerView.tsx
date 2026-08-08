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
  ChevronDown,
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
  theme?: 'dark' | 'light';
}

export const LedgerView: React.FC<LedgerViewProps> = ({
  records,
  onSelectRecord,
  onOverrideStatus,
  onDeleteRecord,
  onResetLedger,
  ruleConfig,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

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
      const status = (r.overrideStatus || r.extractedData.decision.status).toUpperCase();
      const docTypeStr = (r.extractedData.document_type || '').toLowerCase();
      const docTitleStr = (r.extractedData.document_title || '').toLowerCase();

      let matchesFilter = true;

      if (activeFilter === 'APPROVED' || activeFilter === 'FLAGGED' || activeFilter === 'REJECTED') {
        matchesFilter = status === activeFilter;
      } else if (activeFilter === 'RESUME') {
        matchesFilter =
          docTypeStr.includes('resume') ||
          docTypeStr.includes('candidate') ||
          docTitleStr.includes('resume');
      } else if (activeFilter === 'APPLICATION') {
        matchesFilter =
          docTypeStr.includes('student') ||
          docTypeStr.includes('application') ||
          docTitleStr.includes('application');
      } else if (activeFilter === 'INVOICE') {
        matchesFilter =
          docTypeStr.includes('invoice') ||
          docTypeStr.includes('order') ||
          docTypeStr.includes('po') ||
          docTitleStr.includes('invoice') ||
          docTitleStr.includes('po') ||
          (!docTypeStr.includes('resume') &&
            !docTypeStr.includes('student') &&
            !docTypeStr.includes('application'));
      }

      const vendor = (r.extractedData.vendor_name || '').toLowerCase();
      const invNum = (r.extractedData.invoice_number || '').toLowerCase();
      const summary = (r.extractedData.summary || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !query || vendor.includes(query) || invNum.includes(query) || summary.includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [records, searchQuery, activeFilter]);

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          className={`border rounded-xl p-4 shadow-sm transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Volume</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <div className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {ruleConfig.currencySymbol}
            {metrics.totalVolume.toLocaleString()}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Across{' '}
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              {metrics.totalCount}
            </span>{' '}
            total documents processed
          </div>
        </div>

        <div
          className={`border rounded-xl p-4 shadow-sm border-l-4 border-l-emerald-500 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-emerald-500">
            {ruleConfig.currencySymbol}
            {metrics.approvedSum.toLocaleString()}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="font-semibold text-emerald-600">{metrics.approvedCount}</span> invoices auto-posted
          </div>
        </div>

        <div
          className={`border rounded-xl p-4 shadow-sm border-l-4 border-l-amber-500 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Flagged Review</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-amber-500">
            {ruleConfig.currencySymbol}
            {metrics.flaggedSum.toLocaleString()}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="font-semibold text-amber-600">{metrics.flaggedCount}</span> invoices awaiting sign-off
          </div>
        </div>

        <div
          className={`border rounded-xl p-4 shadow-sm border-l-4 border-l-red-500 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-red-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
            <XCircle className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-red-500">
            {ruleConfig.currencySymbol}
            {metrics.rejectedSum.toLocaleString()}
          </div>
          <div className={`text-[11px] mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <span className="font-semibold text-red-600">{metrics.rejectedCount}</span> failed compliance
          </div>
        </div>
      </div>

      {/* Filter & Action Controls Bar */}
      <div
        className={`border rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search vendor, invoice # or text..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-indigo-500 border ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500'
                : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
            }`}
          />
        </div>

        {/* Filter Option & Actions */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Single Filter Dropdown */}
          <div className="relative flex items-center">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className={`pl-8 pr-8 py-2 rounded-lg text-xs font-semibold border appearance-none cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                  : 'bg-slate-50 border-slate-300 text-slate-800 hover:border-slate-400'
              }`}
            >
              <option value="ALL">All Records</option>
              <optgroup label="Document Category">
                <option value="RESUME">Resumes</option>
                <option value="APPLICATION">Applications</option>
                <option value="INVOICE">Invoices</option>
              </optgroup>
              <optgroup label="Decision Status">
                <option value="APPROVED">Approved</option>
                <option value="FLAGGED">Flagged</option>
                <option value="REJECTED">Rejected</option>
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleExportCSV}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
              }`}
              title="Export CSV Log"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={onResetLedger}
              className={`px-2.5 py-1.5 border rounded-lg text-xs transition-colors ${
                isDark
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border-slate-700'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border-slate-300'
              }`}
              title="Reset Dataset to Default Demo Samples"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Container (Mobile Card View + Desktop Table View) */}
      <div
        className={`border rounded-xl overflow-hidden shadow-sm transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        {/* Mobile View Card List (< md breakpoint) */}
        <div className="block md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {filteredRecords.map((record) => {
            const effectiveStatus =
              record.overrideStatus || record.extractedData.decision.status;
            return (
              <div
                key={record.id}
                onClick={() => onSelectRecord(record)}
                className={`p-3.5 space-y-2 cursor-pointer transition-colors ${
                  isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {record.extractedData.vendor_name || 'Unidentified'}
                    </span>
                    <div className="text-[11px] font-mono text-slate-500">
                      #{record.extractedData.invoice_number || 'N/A'} • {record.extractedData.invoice_date || 'N/A'}
                    </div>
                  </div>
                  <BadgeStatus status={effectiveStatus} size="sm" />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-xs font-mono font-extrabold text-indigo-500">
                    {record.extractedData.currency || ruleConfig.currencySymbol}{' '}
                    {(record.extractedData.total_amount || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onSelectRecord(record)}
                      className={`p-1.5 rounded border text-xs ${
                        isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteRecord(record.id)}
                      className={`p-1.5 rounded border text-xs ${
                        isDark ? 'bg-slate-800 border-slate-700 text-red-400' : 'bg-slate-100 border-slate-300 text-red-600'
                      }`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {record.extractedData.summary && (
                  <p className={`text-[11px] line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {record.extractedData.summary}
                  </p>
                )}
              </div>
            );
          })}

          {filteredRecords.length === 0 && (
            <div className={`p-6 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
              No invoice records found matching query.
            </div>
          )}
        </div>

        {/* Desktop Table View (>= md breakpoint) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead
              className={`border-b text-[11px] uppercase tracking-wider font-semibold ${
                isDark
                  ? 'bg-slate-950/80 text-slate-400 border-slate-800'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
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
            <tbody
              className={`divide-y ${
                isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
              }`}
            >
              {filteredRecords.map((record) => {
                const effectiveStatus =
                  record.overrideStatus || record.extractedData.decision.status;
                return (
                  <tr
                    key={record.id}
                    className={`transition-colors cursor-pointer ${
                      isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => onSelectRecord(record)}
                  >
                    <td className={`p-3.5 font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      <div>{record.extractedData.vendor_name || 'Unidentified'}</div>
                      <div className="text-[10px] font-normal text-slate-500 font-mono mt-0.5">
                        {record.fileName}
                      </div>
                    </td>

                    <td className="p-3.5 font-mono">
                      {record.extractedData.invoice_number || 'N/A'}
                    </td>

                    <td className={`p-3.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {record.extractedData.invoice_date || 'N/A'}
                    </td>

                    <td className={`p-3.5 text-right font-mono font-extrabold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                      {record.extractedData.currency || ruleConfig.currencySymbol}{' '}
                      {(record.extractedData.total_amount || 0).toLocaleString()}
                    </td>

                    <td className="p-3.5">
                      <div className="flex flex-col space-y-1">
                        <BadgeStatus status={effectiveStatus} size="sm" />
                        {record.overrideStatus && (
                          <span className="text-[9px] text-indigo-500 font-semibold italic">
                            (Manager Override)
                          </span>
                        )}
                      </div>
                    </td>

                    <td className={`p-3.5 max-w-xs truncate ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {record.extractedData.summary}
                    </td>

                    <td
                      className="p-3.5 text-right space-x-1 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => onSelectRecord(record)}
                        className={`p-1.5 rounded transition-colors ${
                          isDark
                            ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900'
                        }`}
                        title="View Full Detail Modal"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteRecord(record.id)}
                        className={`p-1.5 rounded transition-colors ${
                          isDark
                            ? 'bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400'
                            : 'bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600'
                        }`}
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
                  <td colSpan={7} className={`p-8 text-center ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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
