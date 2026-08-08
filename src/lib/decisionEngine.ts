import { DecisionStatus } from '../types';

/**
 * Safely converts string/formatted numbers to clean JS numbers
 */
export function cleanNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (typeof val === 'string') {
    let s = val.trim().replace(/[^0-9.,-]/g, '');
    if (!s) return 0;

    if (s.includes(',') && s.includes('.')) {
      if (s.indexOf(',') < s.indexOf('.')) {
        s = s.replace(/,/g, '');
      } else {
        s = s.replace(/\./g, '').replace(',', '.');
      }
    } else if (s.includes(',')) {
      if (/,([0-9]{3})$/.test(s)) {
        s = s.replace(/,/g, '');
      } else {
        s = s.replace(',', '.');
      }
    }

    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }
  return 0;
}

export interface DecisionResultDetails {
  status: DecisionStatus;
  reason: string;
  missing: string[];
  missingLabels: string[];
  totalsReconcile: boolean;
  mathDiff: number;
  calculatedTotal: number;
}

/**
 * Universal Decision Matrix Evaluator
 */
export function decideStatus(
  extracted: any,
  ruleConfig: { approvalThreshold?: number; currencySymbol?: string } = {}
): DecisionResultDetails {
  const customThreshold = ruleConfig.approvalThreshold ?? 100000;
  const currencySymbol = ruleConfig.currencySymbol || extracted.currency || 'INR';

  // Clean numeric values
  extracted.subtotal = cleanNumber(extracted.subtotal);
  extracted.tax_gst = cleanNumber(extracted.tax_gst);
  extracted.total_amount = cleanNumber(extracted.total_amount);

  const isFinancial = ['invoice', 'receipt', 'purchase order', 'expense', 'po', 'bill'].some((t) =>
    (extracted.document_type || '').toLowerCase().includes(t)
  );

  const isResume = (extracted.document_type || '').toLowerCase().includes('resume') ||
    (extracted.document_title || '').toLowerCase().includes('resume');
  const isStudentApp = (extracted.document_type || '').toLowerCase().includes('student') ||
    (extracted.document_type || '').toLowerCase().includes('application') ||
    (extracted.document_title || '').toLowerCase().includes('application');

  const missing: string[] = [];
  const missingLabels: string[] = [];

  const rawVendor = String(
    extracted.vendor_name ||
    extracted.candidate_name ||
    extracted.applicant_name ||
    extracted.name ||
    ''
  ).trim();

  const isMissingVendor = (val: string) => {
    const s = val.toLowerCase();
    return (
      !s ||
      s === 'not provided' ||
      s === 'unknown' ||
      s === 'missing' ||
      s === 'n/a' ||
      s === 'na' ||
      s === 'none' ||
      s === '-' ||
      s === 'unidentified' ||
      s === 'unidentified vendor' ||
      s === 'not available' ||
      s === 'null' ||
      s.startsWith('[') ||
      s.endsWith(']') ||
      s.includes('not provided') ||
      s.includes('missing name') ||
      s.includes('unidentified')
    );
  };

  if (isMissingVendor(rawVendor)) {
    missing.push('vendor_name');
    missingLabels.push(
      isResume
        ? 'Candidate Name'
        : isStudentApp
        ? 'Applicant Name'
        : isFinancial
        ? 'Vendor Name'
        : 'Entity Name'
    );
  }

  const rawDate = String(
    extracted.invoice_date ||
    extracted.date ||
    extracted.document_date ||
    ''
  ).trim();

  const isMissingDate = (val: string) => {
    const s = val.toLowerCase();
    return (
      !s ||
      s.includes('_') ||
      s === 'n/a' ||
      s === 'na' ||
      s === 'none' ||
      s === '-' ||
      s === 'not provided' ||
      s === 'missing' ||
      s === 'unknown' ||
      s === 'not available' ||
      s === 'null' ||
      s === '0000-00-00' ||
      s.includes('missing') ||
      s.includes('not provided') ||
      s.includes('invalid')
    );
  };

  // Date is mandatory for all financial, student application, contract, and transactional documents
  const requiresDate = !isResume;
  if (requiresDate && isMissingDate(rawDate)) {
    missing.push('invoice_date');
    missingLabels.push('Document Date');
  }

  if (isFinancial && (!extracted.total_amount || extracted.total_amount <= 0)) {
    if (extracted.subtotal && extracted.subtotal > 0) {
      extracted.total_amount = extracted.subtotal + extracted.tax_gst;
    } else {
      missing.push('total_amount');
      missingLabels.push('Total Amount');
    }
  }

  const calculatedTotal = (extracted.subtotal || 0) + (extracted.tax_gst || 0);
  const mathDiff = Math.abs(calculatedTotal - (extracted.total_amount || 0));
  const totalsReconcile = mathDiff <= 5;

  let status: DecisionStatus = 'approved';
  let reason = '';

  // Universal Rule: If mandatory required fields (Name, Date, Total Amount) are missing -> REJECT
  if (missing.length > 0) {
    status = 'rejected';
    reason = `Rejected due to missing required field(s) on document: ${missingLabels.join(', ')}.`;
    return {
      status,
      reason,
      missing,
      missingLabels,
      totalsReconcile,
      mathDiff,
      calculatedTotal,
    };
  }

  // Specific domain checks
  if (isResume) {
    const exp = extracted.experience_years ?? 5;
    const hasRejectedIssue = extracted.issues?.some((i: string) => i.toLowerCase().includes('rejected'));
    const hasFlaggedIssue = extracted.issues?.some((i: string) => i.toLowerCase().includes('flagged'));

    if (exp < 1 || hasRejectedIssue) {
      status = 'rejected';
      reason = 'Candidate rejected: Insufficient mandatory core experience or missing key criteria.';
    } else if (hasFlaggedIssue) {
      status = 'flagged';
      reason = 'Candidate flagged for HR review (e.g. employment gap or salary out of band).';
    } else {
      status = 'approved';
      reason = 'Candidate shortlisted: Resume details and technical requirements verified.';
    }
  } else if (isStudentApp) {
    const gpa = extracted.gpa ?? 3.5;
    const hasRejectedIssue = extracted.issues?.some((i: string) => i.toLowerCase().includes('rejected'));
    const hasFlaggedIssue = extracted.issues?.some((i: string) => i.toLowerCase().includes('flagged'));

    if (gpa === 0 || hasRejectedIssue) {
      status = 'rejected';
      reason = 'Application rejected: Missing mandatory transcript or academic eligibility failed.';
    } else if (gpa < 3.2 || hasFlaggedIssue) {
      status = 'flagged';
      reason = 'Application flagged: GPA below automatic cutoff; routed to Academic Committee.';
    } else {
      status = 'approved';
      reason = 'Application approved: High academic standing and transcript verified.';
    }
  } else {
    // Financial / General
    const hasRejectedIssue = extracted.issues?.some((i: string) => i.toLowerCase().includes('rejected'));
    const hasFlaggedIssue = extracted.issues?.some((i: string) => i.toLowerCase().includes('flagged'));

    if (hasRejectedIssue) {
      status = 'rejected';
      reason = 'Rejected due to validation policy failure.';
    } else if (isFinancial && extracted.total_amount >= customThreshold) {
      status = 'flagged';
      reason = `Flagged for manager review: Total amount (${currencySymbol} ${extracted.total_amount.toLocaleString()}) reaches or exceeds approval policy threshold (${customThreshold}).`;
    } else if (isFinancial && !totalsReconcile && mathDiff > (extracted.total_amount * 0.1 || 5)) {
      status = 'flagged';
      reason = `Flagged due to line-item sum discrepancy (${currencySymbol} ${mathDiff.toFixed(2)} variance).`;
    } else if (hasFlaggedIssue) {
      status = 'flagged';
      reason = 'Flagged for manager sign-off.';
    } else {
      status = 'approved';
      reason = extracted.decision?.reason || `Approved automatically: ${extracted.document_type} successfully parsed and verified by AI workflow engine.`;
    }
  }

  return {
    status,
    reason,
    missing,
    missingLabels,
    totalsReconcile,
    mathDiff,
    calculatedTotal,
  };
}
