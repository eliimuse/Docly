import React, { useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  Eye,
  FolderOpen,
  Maximize2,
  Layers,
  Brain,
  Bot,
  Filter,
  ChevronDown,
} from 'lucide-react';
import {
  InvoiceExtractedData,
  InvoiceRecord,
  WorkflowRuleConfig,
  SampleScenario,
  DecisionStatus,
} from '../types';
import { SAMPLE_SCENARIOS } from '../data/sampleInvoices';
import { WorkflowDiagram, PipelineStage } from './WorkflowDiagram';
import { DocumentPreviewModal } from './DocumentPreviewModal';

interface UploadViewProps {
  onSaveToLedger: (record: InvoiceRecord) => void;
  ruleConfig: WorkflowRuleConfig;
  theme?: 'dark' | 'light';
}

export const UploadView: React.FC<UploadViewProps> = ({
  onSaveToLedger,
  ruleConfig,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    dataUri: string;
    previewUrl?: string;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPipelineStage, setCurrentPipelineStage] = useState<PipelineStage>('idle');

  const [extractedResult, setExtractedResult] = useState<InvoiceExtractedData | null>(null);
  const [processingTimeMs, setProcessingTimeMs] = useState<number>(0);
  const [activeResultTab, setActiveResultTab] = useState<'extracted' | 'json' | 'validation'>('extracted');
  const [copiedJson, setCopiedJson] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [selectedScenarioCategory, setSelectedScenarioCategory] = useState<'ALL' | 'RESUME' | 'APPLICATION' | 'INVOICE'>('ALL');

  const filteredScenarios = useMemo(() => {
    if (selectedScenarioCategory === 'ALL') return SAMPLE_SCENARIOS;
    return SAMPLE_SCENARIOS.filter((s) => {
      const docType = (s.sampleData.document_type || '').toLowerCase();
      const docTitle = (s.sampleData.document_title || '').toLowerCase();
      if (selectedScenarioCategory === 'RESUME') {
        return docType.includes('resume') || docType.includes('candidate') || docTitle.includes('resume');
      }
      if (selectedScenarioCategory === 'APPLICATION') {
        return docType.includes('student') || docType.includes('application') || docTitle.includes('application');
      }
      if (selectedScenarioCategory === 'INVOICE') {
        return docType.includes('invoice') || docType.includes('order') || docType.includes('po') || docTitle.includes('invoice') || docTitle.includes('po');
      }
      return true;
    });
  }, [selectedScenarioCategory]);

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
      // Simulate pipeline stage transitions for visual architectural feedback
      const timer1 = setTimeout(() => setCurrentPipelineStage('classify'), 250);
      const timer2 = setTimeout(() => setCurrentPipelineStage('extract'), 500);
      const timer3 = setTimeout(() => setCurrentPipelineStage('validate'), 750);
      const timer4 = setTimeout(() => setCurrentPipelineStage('decision'), 1000);
      const timer5 = setTimeout(() => setCurrentPipelineStage('workflow'), 1250);

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
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);

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
      <WorkflowDiagram currentStage={currentPipelineStage} theme={theme} />

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upload & Sample Scenarios */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className={`border rounded-xl p-4 sm:p-5 shadow-sm transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <h2 className="text-sm font-bold mb-1 flex items-center justify-between">
              <span>1. Upload Document</span>
              <span className={`text-[11px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                PDF, PNG, JPG, WEBP
              </span>
            </h2>
            <p className={`text-xs mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Drop any document (Resume, PO, Invoice, Student Application) or select a scenario below to run the AI engine.
            </p>

            {/* Dropzone */}
            <div
              tabIndex={0}
              role="button"
              aria-label="Upload document file dropzone. Press enter or space to choose a file."
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => {
                if (!selectedFile) {
                  fileInputRef.current?.click();
                }
              }}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && !selectedFile) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                selectedFile
                  ? isDark
                    ? 'border-indigo-500/60 bg-indigo-950/20'
                    : 'border-indigo-400 bg-indigo-50/60'
                  : isDark
                  ? 'border-slate-700 hover:border-indigo-500 hover:bg-slate-800/40 cursor-pointer'
                  : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/40 cursor-pointer'
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
                <div className="space-y-3">
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPreviewModalOpen(true);
                    }}
                    className="relative group max-h-48 overflow-hidden rounded-lg border border-slate-700 bg-slate-950 flex justify-center items-center p-2 cursor-pointer hover:border-indigo-500 shadow-md transition-all"
                    title="Click to view fullscreen interactive preview"
                  >
                    {selectedFile.previewUrl ? (
                      <img
                        src={selectedFile.previewUrl}
                        alt="Invoice preview"
                        className="max-h-40 object-contain rounded"
                      />
                    ) : (
                      <div className="py-6 flex flex-col items-center">
                        <FileText className="w-12 h-12 text-indigo-400 mb-1" />
                        <span className="text-xs text-slate-300">Document Uploaded</span>
                      </div>
                    )}

                    {/* Hover overlay hint */}
                    <div className="absolute inset-0 bg-slate-950/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white font-semibold text-xs space-y-1">
                      <Maximize2 className="w-5 h-5 text-indigo-400" />
                      <span>Click to Inspect Preview</span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-white truncate max-w-xs mx-auto">
                    {selectedFile.name}
                  </div>

                  <div className="flex items-center justify-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPreviewModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-200 border border-indigo-500/40 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-300" />
                      <span>Preview Image</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors"
                    >
                      <FolderOpen className="w-3.5 h-3.5" />
                      <span>Change File</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-emerald-400 font-medium">
                    ✓ Ready for Gemini AI Extraction
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-indigo-400">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-semibold text-slate-200">
                    drag & drop file here
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
            <div
              className={`border rounded-xl p-8 sm:p-10 text-center flex flex-col items-center justify-center min-h-[300px] transition-colors ${
                isDark
                  ? 'bg-slate-900 border-slate-800 text-slate-400'
                  : 'bg-white border-slate-200 text-slate-600 shadow-sm'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 ${
                  isDark ? 'bg-slate-800/80 border-slate-700/60' : 'bg-indigo-50 border-indigo-100'
                }`}
              >
                <Sparkles className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                Awaiting Document Execution
              </h3>
              <p className={`text-xs max-w-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Upload a document image or PDF on the left or select a quick test scenario below to trigger Gemini's workflow engine.
              </p>
            </div>
          )}

          {isProcessing && (
            <div
              className={`border rounded-xl p-8 sm:p-10 text-center min-h-[350px] flex flex-col items-center justify-center transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Reading Invoice with Gemini Multimodal OCR
              </h3>
              <p className={`text-xs max-w-md mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Extracting structured JSON fields, checking calculation reconciliation, evaluating approval ceiling rules, and generating plain-English log summary...
              </p>
            </div>
          )}

          {extractedResult && !isProcessing && (
            <div
              className={`border rounded-xl shadow-lg overflow-hidden transition-colors ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              }`}
            >
              {/* Result Header & Decision Banner */}
              <div
                className={`p-4 sm:p-5 border-b ${
                  isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50/80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
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
                    {selectedFile && (
                      <button
                        onClick={() => setIsPreviewModalOpen(true)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                        title="Inspect original document image"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>View Document</span>
                      </button>
                    )}

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
                    {/* Document Classification & Type Header */}
                    {extractedResult.document_type && (
                      <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-lg flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-0.5 rounded-full bg-indigo-500 text-white font-semibold text-[10px] uppercase tracking-wider">
                            CLASSIFIED TYPE
                          </span>
                          <span className="font-bold text-indigo-200 text-sm">
                            {extractedResult.document_type}
                          </span>
                        </div>
                        {extractedResult.document_title && (
                          <span className="text-slate-400 text-xs truncate max-w-xs">
                            {extractedResult.document_title}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Key Attributes Grid (Extracted Metadata) */}
                    {extractedResult.key_attributes && extractedResult.key_attributes.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>Extracted Document Attributes</span>
                        </h4>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950 p-3 rounded-lg border border-slate-800">
                          {extractedResult.key_attributes.map((attr, idx) => (
                            <div key={idx} className="bg-slate-900/80 p-2 rounded border border-slate-800">
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                                {attr.label}
                              </span>
                              <span className="text-xs font-semibold text-slate-100 truncate block mt-0.5">
                                {attr.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Key Financial Metrics Grid (Shown if financial totals exist) */}
                    {(extractedResult.total_amount > 0 || extractedResult.subtotal > 0 || extractedResult.tax_gst > 0) && (
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
                    )}

                    {/* Dynamic AI Generated Workflow Steps */}
                    {extractedResult.dynamic_workflow && extractedResult.dynamic_workflow.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-indigo-400" />
                          <span>AI Dynamic Action Checklist</span>
                        </h4>
                        <div className="space-y-1.5 bg-slate-950 p-3 rounded-lg border border-slate-800">
                          {extractedResult.dynamic_workflow.map((step, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800/80 text-xs"
                            >
                              <div className="flex items-center space-x-2 min-w-0 pr-2">
                                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono flex items-center justify-center shrink-0">
                                  {idx + 1}
                                </span>
                                <span className="font-semibold text-slate-200 truncate">
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

                    {/* Decision Justification Box */}
                    <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                      <span className="font-bold text-slate-300 block mb-1">
                        Workflow Decision Reasoning:
                      </span>
                      <p className="text-slate-400">{extractedResult.decision.reason}</p>
                    </div>

                    {/* Line Items / Extracted Content Table */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Parsed Document Items / Sections ({extractedResult.line_items?.length || 0})
                      </h4>
                      <div className="overflow-x-auto border border-slate-800 rounded-lg">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 text-[11px] uppercase">
                            <tr>
                              <th className="p-2.5">Description / Entry</th>
                              <th className="p-2.5 text-right">Qty / Unit</th>
                              <th className="p-2.5 text-right">Unit Rate</th>
                              <th className="p-2.5 text-right">Amount / Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {extractedResult.line_items?.map((item, idx) => {
                              const qty = item.quantity || 1;
                              const lineAmount = item.amount && item.amount > 0 ? item.amount : (qty * (item.unit_price || 0));
                              const displayUnitPrice = item.unit_price && item.unit_price > 0 ? item.unit_price : (lineAmount > 0 ? (lineAmount / qty) : 0);
                              return (
                                <tr key={idx} className="hover:bg-slate-800/30">
                                  <td className="p-2.5 font-medium text-slate-200">
                                    {item.description || 'Item'}
                                  </td>
                                  <td className="p-2.5 text-right font-mono text-slate-400">
                                    {qty}
                                  </td>
                                  <td className="p-2.5 text-right font-mono text-slate-400">
                                    {displayUnitPrice > 0
                                      ? displayUnitPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                      : '—'}
                                  </td>
                                  <td className="p-2.5 text-right font-mono font-semibold text-slate-100">
                                    {lineAmount > 0
                                      ? lineAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                      : 'Verified'}
                                  </td>
                                </tr>
                              );
                            })}
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

          {/* Quick Scenario Picker (Hackathon Judge Friendly) */}
          <div
            className={`border rounded-xl p-4 sm:p-5 shadow-sm space-y-3 transition-colors ${
              isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3
                className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>Quick Test Scenarios (1-Click)</span>
              </h3>
              
              {/* Single Filter Dropdown */}
              <div className="relative flex items-center">
                <Filter className="w-3 h-3 text-slate-400 absolute left-2.5 pointer-events-none" />
                <select
                  value={selectedScenarioCategory}
                  onChange={(e) => setSelectedScenarioCategory(e.target.value as any)}
                  className={`pl-7 pr-7 py-1 rounded-lg text-[11px] font-semibold border appearance-none cursor-pointer focus:outline-none focus:border-indigo-500 transition-colors ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="ALL">All Scenarios</option>
                  <option value="RESUME">Resumes</option>
                  <option value="APPLICATION">Applications</option>
                  <option value="INVOICE">Invoices</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredScenarios.map((scenario) => {
                const isSelected = selectedFile?.name.includes(
                  scenario.sampleData.invoice_number || 'sample'
                );
                return (
                  <button
                    key={scenario.id}
                    onClick={() => handleSelectSampleScenario(scenario)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-center justify-between ${
                      isSelected
                        ? isDark
                          ? 'bg-indigo-950/60 border-indigo-500 text-white'
                          : 'bg-indigo-50 border-indigo-500 text-slate-900'
                        : isDark
                        ? 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                        : 'bg-slate-50/80 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="pr-2 min-w-0">
                      <div className="text-xs font-semibold flex items-center space-x-1.5">
                        <span className="truncate">{scenario.title}</span>
                        <BadgeStatus status={scenario.badge} size="sm" />
                      </div>
                      <div
                        className={`text-[11px] mt-0.5 truncate ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        {scenario.subtitle}
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Document Modal */}
      {selectedFile && (
        <DocumentPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          fileName={selectedFile.name}
          fileType={selectedFile.type}
          previewUrl={selectedFile.previewUrl}
          dataUri={selectedFile.dataUri}
        />
      )}
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

// Helper: Generates crisp PNG document images using HTML5 Canvas tailored to document type
function createSampleDocumentDataUri(scenario: SampleScenario): string {
  const d = scenario.sampleData;
  const docType = (d.document_type || '').toLowerCase();
  const scenarioId = scenario.id;

  const canvas = document.createElement('canvas');
  canvas.width = 650;
  canvas.height = 850;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background - clean white document sheet
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 650, 850);

  // Outer document border
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(15, 15, 620, 820);

  // 1. RESUME / CANDIDATE PROFILE DOCUMENT
  if (scenarioId === 'sample-resume' || docType.includes('resume') || docType.includes('candidate')) {
    // Header Banner
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 20, 610, 75);

    // Candidate Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Arial, sans-serif';
    ctx.fillText('ALEX RIVERA', 40, 52);

    // Subtitle / Seniority
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText('Senior Full-Stack Architect & Lead Software Engineer', 40, 72);

    // Contact details right aligned
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('alex.rivera@devmail.io', 440, 42);
    ctx.fillText('+1 (555) 234-5678', 440, 58);
    ctx.fillText('San Francisco, CA • Remote', 440, 74);

    let y = 112;

    // === ADDITIONAL HIGHLIGHTED SECTION: JOB APPLIED FOR ===
    ctx.fillStyle = '#eff6ff'; // Soft indigo background tint
    ctx.fillRect(35, y, 580, 72);
    ctx.strokeStyle = '#6366f1'; // Indigo border
    ctx.lineWidth = 1.5;
    ctx.strokeRect(35, y, 580, 72);

    // Solid accent stripe on left edge
    ctx.fillStyle = '#4f46e5';
    ctx.fillRect(35, y, 6, 72);

    ctx.fillStyle = '#312e81';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('TARGET POSITION APPLIED FOR', 52, y + 22);

    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('Applied Job Title:', 52, y + 44);
    ctx.fillStyle = '#4338ca';
    ctx.fillText('Lead Full-Stack Architect (Req #ARCH-2026-904)', 180, y + 44);

    ctx.fillStyle = '#475569';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('Department: Core Engineering  |  Applied: Aug 1, 2026  |  AI Match Score: 94%', 52, y + 61);

    y += 92;

    // Professional Summary
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('PROFESSIONAL SUMMARY', 35, y);

    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(35, y + 5);
    ctx.lineTo(615, y + 5);
    ctx.stroke();

    y += 20;
    ctx.fillStyle = '#334155';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('Seasoned Full-Stack Architect with 8.5+ years of experience designing scalable microservices,', 35, y);
    y += 16;
    ctx.fillText('high-throughput React applications, and automated AI data pipelines. Proven leadership across', 35, y);
    y += 16;
    ctx.fillText('distributed engineering teams with expertise in React, Node.js, TypeScript, and Docker.', 35, y);

    y += 32;

    // Work Experience
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('WORK EXPERIENCE', 35, y);

    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(35, y + 5);
    ctx.lineTo(615, y + 5);
    ctx.stroke();

    y += 22;
    // Position 1
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('Senior Tech Lead & Full-Stack Architect', 35, y);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('TechCorp Inc.  |  2022 – Present', 420, y);

    y += 16;
    ctx.fillStyle = '#334155';
    ctx.fillText('• Architected cloud-native API gateway & React micro-frontends handling 10M+ daily transactions.', 45, y);
    y += 15;
    ctx.fillText('• Led an engineering team of 12 full-stack developers; optimized pipeline throughput by 42%.', 45, y);
    y += 15;
    ctx.fillText('• Spearheaded adoption of TypeScript, GraphQL, Docker, and continuous integration workflows.', 45, y);

    y += 24;
    // Position 2
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('Full-Stack Software Engineer', 35, y);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('CloudScale Labs  |  2018 – 2022', 420, y);

    y += 16;
    ctx.fillStyle = '#334155';
    ctx.fillText('• Developed real-time enterprise analytics dashboard using React, Node.js, and PostgreSQL.', 45, y);
    y += 15;
    ctx.fillText('• Implemented OAuth2 / JWT authentication security frameworks and RESTful web microservices.', 45, y);

    y += 32;

    // Education & Certifications
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('EDUCATION & CERTIFICATIONS', 35, y);

    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(35, y + 5);
    ctx.lineTo(615, y + 5);
    ctx.stroke();

    y += 22;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('B.S. in Computer Science', 35, y);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('University of California, Berkeley  |  GPA: 3.85 / 4.0', 210, y);

    y += 18;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('AWS Certified Solutions Architect', 35, y);
    ctx.fillStyle = '#64748b';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('Amazon Web Services (Professional)', 260, y);

    y += 32;

    // Skills Matrix
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('CORE COMPETENCIES & TECHNICAL SKILLS', 35, y);

    ctx.strokeStyle = '#cbd5e1';
    ctx.beginPath();
    ctx.moveTo(35, y + 5);
    ctx.lineTo(615, y + 5);
    ctx.stroke();

    y += 22;
    const skills = ['React / Next.js', 'Node.js / Express', 'TypeScript', 'Python', 'PostgreSQL', 'Docker / K8s', 'AWS Cloud', 'GraphQL'];
    let xSkill = 35;
    skills.forEach((skill) => {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(xSkill, y - 14, 132, 22);
      ctx.strokeStyle = '#cbd5e1';
      ctx.strokeRect(xSkill, y - 14, 132, 22);

      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.fillText(skill, xSkill + 8, y);

      xSkill += 144;
      if (xSkill > 500) {
        xSkill = 35;
        y += 28;
      }
    });

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Arial, sans-serif';
    ctx.fillText('Alex Rivera • Resume / Applicant Document • Verified Candidate Profile', 35, 830);

    return canvas.toDataURL('image/png');
  }

  // 2. STUDENT APPLICATION DOCUMENT
  if (scenarioId === 'sample-student' || docType.includes('student') || docType.includes('academic')) {
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(20, 20, 610, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('STATE UNIVERSITY ADMISSIONS OFFICE', 40, 52);
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText('OFFICIAL GRADUATE DEGREE APPLICATION FORM', 40, 72);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('APPLICANT DETAILS', 40, 120);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 128);
    ctx.lineTo(610, 128);
    ctx.stroke();

    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Applicant Name:', 40, 150);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('Maya Patel', 160, 150);

    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Application ID:', 380, 150);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('APP-2026-319', 480, 150);

    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('Target Program:', 40, 175);
    ctx.fillStyle = '#1d4ed8';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('M.S. Data Science & Artificial Intelligence', 160, 175);

    // Academic Qualifications Box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(40, 205, 570, 100);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(40, 205, 570, 100);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('ACADEMIC QUALIFICATIONS & TEST SCORES', 55, 230);

    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Undergraduate GPA: 3.88 / 4.0 (B.S. Mathematics & CS)', 55, 255);
    ctx.fillText('GRE General Test Score: 328 (Quantitative: 168, Verbal: 160)', 55, 275);
    ctx.fillText('Transcripts & Identity Verification: Verified & Cleared', 55, 295);

    // Required Documents Table
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('SUBMITTED APPLICATION DOCUMENTS', 40, 340);

    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(40, 355, 570, 28);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('DOCUMENT TYPE', 55, 374);
    ctx.fillText('STATUS', 420, 374);
    ctx.fillText('VERIFICATION', 510, 374);

    const docList = [
      'Official Academic Transcript (B.S. Math & CS)',
      'Statement of Purpose - AI Research',
      '3x Recommendation Letters (Academic & Professional)',
      'GRE Official Score Report'
    ];

    let yDoc = 405;
    docList.forEach((doc, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(40, yDoc - 16, 570, 26);
      ctx.fillStyle = '#1e293b';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText(doc, 55, yDoc);
      ctx.fillStyle = '#15803d';
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.fillText('ATTACHED', 420, yDoc);
      ctx.fillText('PASSED', 510, yDoc);
      yDoc += 28;
    });

    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(40, 560, 570, 50);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('ADMISSIONS COMMITTEE DECISION: APPROVED FOR ADMISSION', 55, 590);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('University Graduate Admissions Board • Official Academic Application Record', 40, 810);

    return canvas.toDataURL('image/png');
  }

  // 3. LEGAL CONTRACT DOCUMENT
  if (scenarioId === 'sample-contract' || docType.includes('contract') || docType.includes('legal')) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 20, 610, 70);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial, sans-serif';
    ctx.fillText('MASTER SERVICE AGREEMENT (MSA)', 40, 50);
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('CONFIDENTIAL LEGAL AGREEMENT • CONTRACT #MSA-2026-042', 40, 70);

    let yC = 120;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('1. CONTRACTING PARTIES', 40, yC);
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(40, yC + 5);
    ctx.lineTo(610, yC + 5);
    ctx.stroke();

    yC += 22;
    ctx.fillStyle = '#475569';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('This Master Service Agreement is entered into between CyberShield Systems ("Provider")', 40, yC);
    yC += 16;
    ctx.fillText('and Enterprise Corp ("Client"), effective as of July 15, 2026.', 40, yC);

    yC += 32;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('2. KEY TERMS & COMPLIANCE CLAUSES', 40, yC);
    ctx.beginPath();
    ctx.moveTo(40, yC + 5);
    ctx.lineTo(610, yC + 5);
    ctx.stroke();

    yC += 25;
    const clauses = [
      { label: 'Agreement Term:', val: '24 Months (Auto-renewal with 60-day notice)' },
      { label: 'Liability Limitation Cap:', val: '$1,000,000 USD Aggregate' },
      { label: 'Governing Jurisdiction:', val: 'State of Delaware, United States' },
      { label: 'Security Compliance:', val: 'SOC2 Type II & GDPR Addendum Certified' },
    ];

    clauses.forEach((cl) => {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText(cl.label, 50, yC);
      ctx.fillStyle = '#0f172a';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText(cl.val, 210, yC);
      yC += 22;
    });

    yC += 20;
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 13px Arial, sans-serif';
    ctx.fillText('3. SCOPE OF SERVICES', 40, yC);
    ctx.beginPath();
    ctx.moveTo(40, yC + 5);
    ctx.lineTo(610, yC + 5);
    ctx.stroke();

    yC += 20;
    ctx.fillStyle = '#334155';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText('• SOC2 Type II Security Compliance Audit & Continuous Monitoring', 50, yC);
    yC += 18;
    ctx.fillText('• 24/7 Managed Incident Detection, Prevention & Threat Response', 50, yC);
    yC += 18;
    ctx.fillText('• Enterprise Data Privacy & Regulatory Compliance Governance', 50, yC);

    yC += 50;
    // Signature block
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(50, yC);
    ctx.lineTo(260, yC);
    ctx.moveTo(350, yC);
    ctx.lineTo(560, yC);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('Authorized Signature - CyberShield', 50, yC + 16);
    ctx.fillText('Authorized Signature - Enterprise Corp', 350, yC + 16);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('Legal Document Repository • Encrypted Digital Agreement Vault', 40, 810);

    return canvas.toDataURL('image/png');
  }

  // 4. PURCHASE ORDER DOCUMENT
  if (scenarioId === 'sample-po' || docType.includes('purchase order')) {
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(20, 20, 610, 75);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial, sans-serif';
    ctx.fillText(d.vendor_name || 'GLOBAL LOGISTICS', 40, 52);
    ctx.font = '12px Arial, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('OFFICIAL ENTERPRISE PURCHASE ORDER', 40, 72);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(`PO #${d.invoice_number || '88204'}`, 430, 52);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Arial, sans-serif';
    ctx.fillText(`DATE: ${d.invoice_date || '2026-08-04'}`, 430, 72);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, 110);
    ctx.lineTo(610, 110);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.fillText('SUPPLIER:', 40, 130);
    ctx.fillStyle = '#0f172a';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText('Global Freight & Logistics Hub', 40, 147);

    // Items table
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(40, 170, 570, 30);
    ctx.fillStyle = '#334155';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.fillText('ORDERED ITEM DESCRIPTION', 55, 190);
    ctx.fillText('QTY', 370, 190);
    ctx.fillText('UNIT PRICE', 440, 190);
    ctx.fillText('AMOUNT', 530, 190);

    const curr = d.currency || '₹';
    let yP = 225;
    (d.line_items || []).forEach((item, idx) => {
      ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(40, yP - 18, 570, 28);

      const qty = item.quantity || 1;
      const amt = item.amount && item.amount > 0 ? item.amount : (qty * (item.unit_price || 0));
      const unitPrice = item.unit_price && item.unit_price > 0 ? item.unit_price : (amt > 0 ? (amt / qty) : 0);

      ctx.fillStyle = '#1e293b';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText(item.description, 55, yP);
      ctx.fillText(String(qty), 375, yP);
      ctx.fillText(`${curr} ${unitPrice.toLocaleString()}`, 440, yP);
      ctx.fillText(`${curr} ${amt.toLocaleString()}`, 530, yP);
      yP += 32;
    });

    // Summary Totals Box
    const sumY = Math.max(yP + 40, 480);
    ctx.fillStyle = '#fffbeb';
    ctx.fillRect(350, sumY, 260, 80);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(350, sumY, 260, 80);

    ctx.fillStyle = '#b45309';
    ctx.font = 'bold 14px Arial, sans-serif';
    ctx.fillText('PO TOTAL AMOUNT:', 365, sumY + 45);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px Arial, sans-serif';
    ctx.fillText(`${curr} ${(d.total_amount || 145000).toLocaleString()}`, 365, sumY + 68);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Arial, sans-serif';
    ctx.fillText('Purchase Order requisition approved for warehouse inventory dispatch.', 40, 810);

    return canvas.toDataURL('image/png');
  }

  // 5. STANDARD ACCOUNTS PAYABLE INVOICE (DEFAULT FALLBACK)
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText(d.vendor_name || 'INVOICE DOCUMENT', 40, 55);

  ctx.fillStyle = '#475569';
  ctx.font = '12px Arial, sans-serif';
  ctx.fillText('OFFICIAL ACCOUNTS PAYABLE INVOICE', 40, 75);

  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 18px Arial, sans-serif';
  ctx.fillText(`INVOICE #${d.invoice_number || 'INV-2026-0891'}`, 400, 55);

  ctx.fillStyle = '#475569';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText(`DATE: ${d.invoice_date || '2026-08-01'}`, 400, 75);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 95);
  ctx.lineTo(610, 95);
  ctx.stroke();

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 11px Arial, sans-serif';
  ctx.fillText('BILLED TO:', 40, 115);
  ctx.fillStyle = '#1e293b';
  ctx.font = '13px Arial, sans-serif';
  ctx.fillText('Acme Enterprise Corp - Accounts Payable Dept', 40, 132);

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(40, 155, 570, 30);
  ctx.fillStyle = '#334155';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.fillText('ITEM DESCRIPTION', 55, 175);
  ctx.fillText('QTY', 370, 175);
  ctx.fillText('UNIT PRICE', 440, 175);
  ctx.fillText('AMOUNT', 530, 175);

  const curr = d.currency || '₹';
  let y = 210;
  (d.line_items || []).forEach((item, idx) => {
    ctx.fillStyle = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
    ctx.fillRect(40, y - 18, 570, 28);

    const qty = item.quantity || 1;
    const amt = item.amount && item.amount > 0 ? item.amount : (qty * (item.unit_price || 0));
    const unitPrice = item.unit_price && item.unit_price > 0 ? item.unit_price : (amt > 0 ? (amt / qty) : 0);

    ctx.fillStyle = '#1e293b';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText(item.description, 55, y);
    ctx.fillText(String(qty), 375, y);
    ctx.fillText(`${curr} ${unitPrice.toLocaleString()}`, 440, y);
    ctx.fillText(`${curr} ${amt.toLocaleString()}`, 530, y);
    y += 32;
  });

  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(40, y + 10);
  ctx.lineTo(610, y + 10);
  ctx.stroke();

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

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Arial, sans-serif';
  ctx.fillText('Thank you for your business! Payment due within 30 days of invoice date.', 40, 810);

  return canvas.toDataURL('image/png');
}
