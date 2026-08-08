export type DecisionStatus = 'approved' | 'flagged' | 'rejected';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface ValidationResult {
  missing_fields: string[];
  totals_match: boolean;
  issues: string[];
}

export interface DecisionResult {
  status: DecisionStatus;
  reason: string;
}

export interface InvoiceExtractedData {
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  subtotal: number;
  tax_gst: number;
  total_amount: number;
  currency: string;
  line_items: LineItem[];
  extraction_confidence: ConfidenceLevel;
  validation: ValidationResult;
  decision: DecisionResult;
  summary: string;
}

export interface InvoiceRecord {
  id: string;
  timestamp: string;
  fileName: string;
  fileType: string;
  fileDataUri?: string;
  extractedData: InvoiceExtractedData;
  overrideStatus?: DecisionStatus;
  overrideReason?: string;
  processingTimeMs?: number;
}

export interface WorkflowRuleConfig {
  approvalThreshold: number; // e.g. 100000
  currencySymbol: string;    // e.g. "₹" or "$"
  strictMathCheck: boolean;
  autoSaveToLedger: boolean;
}

export interface SampleScenario {
  id: string;
  title: string;
  subtitle: string;
  badge: DecisionStatus;
  description: string;
  fileUrl?: string;
  mockBase64?: string;
  sampleData: InvoiceExtractedData;
}
