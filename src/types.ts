export type DecisionStatus = 'approved' | 'flagged' | 'rejected';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface WorkflowStep {
  step_name: string;
  status: 'completed' | 'flagged' | 'failed' | 'pending';
  details?: string;
}

export interface KeyAttribute {
  label: string;
  value: string;
}

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
  document_type?: string;
  document_title?: string;
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  subtotal: number;
  tax_gst: number;
  total_amount: number;
  currency: string;
  key_attributes?: KeyAttribute[];
  line_items: LineItem[];
  dynamic_workflow?: WorkflowStep[];
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
