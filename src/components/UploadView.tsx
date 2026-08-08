import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Code,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Copy,
  Check,
  Zap,
  RotateCcw,
} from 'lucide-react';
import {
  InvoiceExtractedData,
  InvoiceRecord,
  WorkflowRuleConfig,
  SampleScenario,
  DecisionStatus,
} from '../types';
import { SAMPLE_SCENARIOS } from '../data/sampleInvoices';
import { WorkflowDiagram } from './WorkflowDiagram';

interface UploadViewProps {
  onSaveToLedger: (record: InvoiceRecord) => void;
  ruleConfig: WorkflowRuleConfig;
}

export const UploadView: React.FC<UploadViewProps> = ({ onSaveToLedger, ruleConfig }) => {
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    dataUri: string;
    previewUrl?: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPipelineStage, setCurrentPipelineStage] = useState<
    'idle' | 'ocr' | 'validate' | 'decision' | 'complete'
  >('idle');

  const [extractedResult, setExtractedResult] = useState<InvoiceExtractedData | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number>(0);
  const [activeResultTab, setActiveResultTab] = useState<'extracted' | 'json' | 'validation'>('extracted');
  const [copiedJson, setCopiedJson] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle File Upload from disk
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setSelectedFile({
        name: file.name,
        type: file.type || 'image/png',
        dataUri: resultStr,
        previewUrl: file.type.startsWith('image/') ? resultStr : undefined,
      });
      setExtractedResult(null);
      setErrorMessage(null);
      setSavedStatus(false);
    };
    reader.readAsDataURL(file);
  };

  // Handle Drag & Drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = reader.result as string;
      setSelectedFile({
        name: file.name,
        type: file.type || 'image/png',
        dataUri: resultStr,
        previewUrl: file.type.startsWith('image/') ? resultStr : undefined,
      });
      setExtractedResult(null);
      setErrorMessage(null);
      setSavedStatus(false);
    };
    reader.readAsDataURL(file);
  };

  // Select Sample Scenario for instant testing
  const handleSelectSampleScenario = (scenario: SampleScenario) => {
    // Generate SVG mock document graphic
    const sampleCanvasDataUri = createSampleDocumentDataUri(scenario);

    setSelectedFile({
      name: `${scenario.sampleData.invoice_number || 'sample-doc'}.png`,
      type: 'image/png',
      dataUri: sampleCanvasDataUri,
      previewUrl: sampleCanvasDataUri,
    });

    setExtractedResult(null);
    setErrorMessage(null);
    setSavedStatus(false);
  };

  // Trigger Gemini API Invoice Extraction
  const processDocumentWithGemini = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setCurrentPipelineStage('ocr');
    setErrorMessage(null);
    setSavedStatus(false);

    try {
      // Simulate stage transitions for visual feedback
      const timer1 = setTimeout(() => setCurrentPipelineStage('validate'), 500);
      const timer2 = setTimeout(() => setCurrentPipelineStage('decision'), 900);

      const response = await fetch('/api/process-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileData: selectedFile.dataUri,
          mimeType: selectedFile.type,
          customThreshold: ruleConfig.approvalThreshold,
          fileName: selectedFile.name,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const resData = await response.json();

      if (!resData.success) {
        throw new Error(resData.error || 'Invoice extraction failed');
      }

      setCurrentPipelineStage('complete');
      setExtractedResult(resData.data);
      setProcessingTimeMs(resData.processingTimeMs || 1200);

      // Auto-save to ledger if enabled
      if (ruleConfig.autoSaveToLedger && resData.data) {
        const newRecord: InvoiceRecord = {
          id: `rec-${Date.now()}`,
          timestamp: new Date().toISOString(),
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          extractedData: resData.data,
          processingTimeMs: resData.processingTimeMs,
        };
        onSaveToLedger(newRecord);
        setSavedStatus(true);
      }
    } catch (err: any) {
      console.error('Extraction error:', err);
      setErrorMessage(err.message || 'An error occurred while processing the invoice document.');
      setCurrentPipelineStage('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyJson = () => {
    if (!extractedResult) return;
    navigator.clipboard.writeText(JSON.stringify(extractedResult, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleManualSave = () => {
    if (!extractedResult || !selectedFile) return;
    const newRecord: InvoiceRecord = {
      id: `rec-${Date.now()}`,
      timestamp: new Date().toISOString(),
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      extractedData: extractedResult,
      processingTimeMs,
    };
    onSaveToLedger(newRecord);
    setSavedStatus(true);
  };

  return (
    <div className="space-y-6">
      {/* Workflow Stage Architecture Banner */}
      <WorkflowDiagram currentStage={currentPipelineStage} />

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Sample Scenarios */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-bold text-white mb-1 flex items-center justify-between">
              <span>1. Upload Document</span>
              <span className="text-[11px] font-normal text-slate-400">PDF, PNG, JPG, WEBP</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Drop an invoice or select a pre-configured scenario below to execute the 1-pass agent.
            </p>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-indigo-500/60 bg-indigo-950/20'
                  : 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {selectedFile ? (
                <div className="space-y-2">
                  {selectedFile.previewUrl ? (
                    <div className="max-h-36 overflow-hidden rounded border border-slate-700 bg-slate-950 flex justify-center p-2">
                      <img
                        src={selectedFile.previewUrl}
                        alt="Invoice preview"
                        className="max-h-32 object-contain"
                      />
                    </div>
                  ) : (
                    <FileText className="w-10 h-10 text-indigo-400 mx-auto" />
                  )}
                  <div className="text-xs font-semibold text-white truncate max-w-xs mx-auto">
                    {selectedFile.name}
                  </div>
                  <p className="text-[11px] text-emerald-400 font-medium">
                    ✓ Ready for Gemini AI Extraction
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-indigo-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    Drag and drop invoice file here
                  </div>
                  <div className="text-[11px] text-slate-400">or click to browse filesystem</div>
                </div>
              )}
            </div>

            {/* Process Action Button */}
            {selectedFile && (
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={processDocumentWithGemini}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold py-2.5 px-4 rounded-lg text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
                >
                  {isProcessing ? (
                    <>
                      <Zap className="w-4 h-4 animate-spin text-amber-300" />
                      <span>Reading Document & Executing Agent...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run Gemini Workflow Agent</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setExtractedResult(null);
                    setErrorMessage(null);
                  }}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs"
                  title="Clear selected file"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Quick Scenario Picker (Hackathon Judge Friendly) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Quick Test Scenarios (1-Click)</span>
              </h3>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                Judges
              </span>
            </div>

            <div className="space-y-2">
              {SAMPLE_SCENARIOS.map((scenario) => {
                const isSelected = selectedFile?.name.includes(
                  scenario.sampleData.invoice_number || 'sample'
                );
                return (
                  <button
                    key={scenario.id}
                    onClick={() => handleSelectSampleScenario(scenario)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 text-white'
                        : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold flex items-center space-x-2">
                        <span>{scenario.title}</span>
                        <BadgeStatus status={scenario.badge} size="sm" />
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {scenario.subtitle}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: AI Extraction & Workflow Results */}
        <div className="lg:col-span-7 space-y-4">
          {errorMessage && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-4 text-xs flex items-start space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Workflow Processing Error</p>
                <p className="text-red-300/80 mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {!extractedResult && !isProcessing && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center text-slate-400 flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">
                Awaiting Invoice Execution
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Upload an invoice image or select a quick test scenario on the left to trigger Gemini's 1-pass extraction and rule engine.
              </p>
            </div>
          )}

          {isProcessing && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 text-center min-h-[380px] flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
              <h3 className="text-sm font-bold text-white">
                Reading Invoice with Gemini Multimodal OCR
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1">
                Extracting structured JSON fields, checking calculation reconciliation, evaluating approval ceiling rules, and generating plain-English log summary...
              </p>
            </div>
          )}

          {extractedResult && !isProcessing && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
              {/* Result Header & Decision Banner */}
              <div className="p-5 border-b border-slate-800 bg-slate-900/90">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-base font-bold text-white">
                        {extractedResult.vendor_name || 'Unidentified Vendor'}
                      </h3>
                      <BadgeStatus status={extractedResult.decision.status} size="md" />
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Invoice #{extractedResult.invoice_number || 'N/A'} • Date:{' '}
                      {extractedResult.invoice_date || 'Missing'} • Executed in{' '}
                      <span className="text-indigo-400 font-mono">
                        {(processingTimeMs / 1000).toFixed(2)}s
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleManualSave}
                      disabled={savedStatus}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors ${
                        savedStatus
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{savedStatus ? 'Saved to Ledger' : 'Commit Record'}</span>
                    </button>
                  </div>
                </div>

                {/* Plain-English Accounting Summary Callout */}
                <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-indigo-500/30 text-xs text-indigo-200 flex items-start space-x-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-indigo-300 mr-1">Accounting Log Summary:</span>
                    <span className="text-slate-300">{extractedResult.summary}</span>
                  </div>
                </div>
              </div>

              {/* View Tabs */}
              <div className="flex border-b border-slate-800 bg-slate-950 px-4">
                <button
                  onClick={() => setActiveResultTab('extracted')}
                  className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                    activeResultTab === 'extracted'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Extracted Fields & Line Items
                </button>
                <button
                  onClick={() => setActiveResultTab('validation')}
                  className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1 ${
                    activeResultTab === 'validation'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>Validation & Rules Audit</span>
                  {extractedResult.validation.issues.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-300">
                      {extractedResult.validation.issues.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveResultTab('json')}
                  className={`py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1 ${
                    activeResultTab === 'json'
                      ? 'border-indigo-500 text-indigo-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Raw JSON Schema</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-5">
                {activeResultTab === 'extracted' && (
                  <div className="space-y-5">
                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Subtotal
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {extractedResult.currency || ruleConfig.currencySymbol}{' '}
                          {(extractedResult.subtotal || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Tax / GST
                        </span>
                        <span className="text-xs font-semibold text-slate-200">
                          {extractedResult.currency || ruleConfig.currencySymbol}{' '}
                          {(extractedResult.tax_gst || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Total Amount
                        </span>
                        <span className="text-sm font-bold text-emerald-400">
                          {extractedResult.currency || ruleConfig.currencySymbol}{' '}
                          {(extractedResult.total_amount || 0).toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                          Confidence
                        </span>
                        <span
                          className={`text-xs font-bold uppercase ${
                            extractedResult.extraction_confidence === 'high'
                              ? 'text-emerald-400'
                              : extractedResult.extraction_confidence === 'medium'
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {extractedResult.extraction_confidence || 'Medium'}
                        </span>
                      </div>
                    </div>

                    {/* Decision Justification Box */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <span className="font-bold text-slate-300 block mb-1">
                        Workflow Decision Reasoning:
                      </span>
                      <p className="text-slate-400">{extractedResult.decision.reason}</p>
                    </div>

                    {/* Line Items Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Itemized Line Items ({extractedResult.line_items?.length || 0})
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
                            {extractedResult.line_items?.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/30">
                                <td className="p-2.5 font-medium text-slate-200">
                                  {item.description || 'Item'}
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-400">
                                  {item.quantity || 1}
                                </td>
                                <td className="p-2.5 text-right font-mono text-slate-400">
                                  {(item.unit_price || 0).toLocaleString()}
                                </td>
                                <td className="p-2.5 text-right font-mono font-semibold text-slate-100">
                                  {(item.amount || 0).toLocaleString()}
                                </td>
                              </tr>
                            ))}
                            {(!extractedResult.line_items ||
                              extractedResult.line_items.length === 0) && (
                              <tr>
                                <td colSpan={4} className="p-4 text-center text-slate-500">
                                  No individual line items parsed.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {activeResultTab === 'validation' && (
                  <div className="space-y-4">
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-medium">Mandatory Fields Check:</span>
                        {extractedResult.validation.missing_fields.length === 0 ? (
                          <span className="text-emerald-400 font-bold flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>PASSED</span>
                          </span>
                        ) : (
                          <span className="text-red-400 font-bold flex items-center space-x-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>
                              FAILED ({extractedResult.validation.missing_fields.join(', ')})
                            </span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-slate-300 font-medium">Math Reconciliation Check:</span>
                        {extractedResult.validation.totals_match ? (
                          <span className="text-emerald-400 font-bold flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>PASSED (Subtotal + GST = Stated Total)</span>
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>DISCREPANCY DETECTED</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        <span className="text-slate-300 font-medium">
                          Spending Threshold Check ({ruleConfig.currencySymbol}
                          {ruleConfig.approvalThreshold.toLocaleString()}):
                        </span>
                        {extractedResult.total_amount < ruleConfig.approvalThreshold ? (
                          <span className="text-emerald-400 font-bold flex items-center space-x-1">
                            <Check className="w-3.5 h-3.5" />
                            <span>WITHIN LIMIT</span>
                          </span>
                        ) : (
                          <span className="text-amber-400 font-bold flex items-center space-x-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>EXCEEDS LIMIT</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Audit Log Observations ({extractedResult.validation.issues.length})
                      </h4>
                      <ul className="space-y-2">
                        {extractedResult.validation.issues.map((issue, idx) => (
                          <li
                            key={idx}
                            className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-start space-x-2"
                          >
                            <span className="text-indigo-400 font-bold">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeResultTab === 'json' && (
                  <div className="relative">
                    <button
                      onClick={handleCopyJson}
                      className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded flex items-center space-x-1 z-10"
                    >
                      {copiedJson ? (
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

                    <pre className="p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-96">
                      {JSON.stringify(extractedResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Status Badge Utility Component
export const BadgeStatus: React.FC<{ status: DecisionStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'sm',
}) => {
  const isMd = size === 'md';
  const py = isMd ? 'py-1 px-2.5 text-xs' : 'py-0.5 px-2 text-[10px]';

  if (status === 'approved') {
    return (
      <span
        className={`inline-flex items-center rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${py}`}
      >
        <CheckCircle2 className={`${isMd ? 'w-3.5 h-3.5' : 'w-3 h-3'} mr-1`} />
        <span>APPROVED</span>
      </span>
    );
  }

  if (status === 'flagged') {
    return (
      <span
        className={`inline-flex items-center rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 ${py}`}
      >
        <AlertTriangle className={`${isMd ? 'w-3.5 h-3.5' : 'w-3 h-3'} mr-1`} />
        <span>FLAGGED</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/30 ${py}`}
    >
      <XCircle className={`${isMd ? 'w-3.5 h-3.5' : 'w-3 h-3'} mr-1`} />
      <span>REJECTED</span>
    </span>
  );
};

// Helper: Generates crisp PNG invoice document images using HTML5 Canvas for sample scenarios
function createSampleDocumentDataUri(scenario: SampleScenario): string {
  const d = scenario.sampleData;
  const canvas = document.createElement('canvas');
  canvas.width = 650;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - clean white document sheet
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 650, 800);

  // Outer document border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.strokeRect(15, 15, 620, 770);

  // Header Banner
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText(d.vendor_name || 'INVOICE DOCUMENT', 40, 55);

  ctx.fillStyle = '#475569';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText('OFFICIAL ACCOUNTS PAYABLE INVOICE', 40, 75);

  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(`INVOICE #${d.invoice_number || 'NO INVOICE NUMBER'}`, 400, 55);

  ctx.fillStyle = '#475569';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText(`DATE: ${d.invoice_date || 'MISSING / UNDATED'}`, 400, 75);

  // Divider line
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 95);
  ctx.lineTo(610, 95);
  ctx.stroke();

  // Billed To Section
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillText('BILLED TO:', 40, 115);
  ctx.fillStyle = '#1e293b';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText('Acme Enterprise Corp - Accounts Payable Dept', 40, 132);

  // Table Header
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(40, 155, 570, 30);
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText('ITEM DESCRIPTION', 55, 175);
  ctx.fillText('QTY', 370, 175);
  ctx.fillText('UNIT PRICE', 440, 175);
  ctx.fillText('AMOUNT', 530, 175);

  // Table Rows
  const curr = d.currency || '₹';
  let y = 210;
  (d.line_items || []).forEach((item, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(40, y - 18, 570, 28);

    ctx.fillStyle = '#1e293b';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText(item.description, 55, y);
    ctx.fillText(String(item.quantity), 375, y);
    ctx.fillText(`${curr} ${(item.unit_price || 0).toLocaleString()}`, 440, y);
    ctx.fillText(`${curr} ${(item.amount || 0).toLocaleString()}`, 530, y);
    y += 32;
  });

  // Table bottom border
  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(40, y + 10);
  ctx.lineTo(610, y + 10);
  ctx.stroke();

  // Summary Totals
  const summaryY = Math.max(y + 40, 500);

  ctx.fillStyle = '#475569';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText('SUBTOTAL:', 370, summaryY);
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`${curr} ${(d.subtotal || 0).toLocaleString()}`, 500, summaryY);

  ctx.fillStyle = '#475569';
  ctx.fillText('TAX / GST:', 370, summaryY + 25);
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`${curr} ${(d.tax_gst || 0).toLocaleString()}`, 500, summaryY + 25);

  // Total Box
  ctx.fillStyle = '#eff6ff';
  ctx.fillRect(350, summaryY + 45, 260, 45);
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(350, summaryY + 45, 260, 45);

  ctx.fillStyle = '#1d4ed8';
  ctx.font = 'bold 15px Arial, sans-serif';
  ctx.fillText('TOTAL AMOUNT:', 365, summaryY + 72);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.fillText(`${curr} ${(d.total_amount || 0).toLocaleString()}`, 500, summaryY + 72);

  // Footer / Notes
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText('Thank you for your business! Payment due within 30 days of invoice date.', 40, 750);

  return canvas.toDataURL('image/png');
}
