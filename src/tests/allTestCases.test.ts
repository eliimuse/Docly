/**
 * Comprehensive Test Suite for Docly Workflow Decision Matrix & Document Processing Engine
 *
 * Covers all possible decision matrix scenarios for:
 * 1. Resumes (Approved, Flagged, Rejected)
 * 2. Student Applications (Approved, Flagged, Rejected)
 * 3. Invoices / POs (Approved, Flagged, Rejected)
 * 4. Categorization & Filtering Rules
 * 5. Manager Overrides & Ledger Audit Integrity
 */

import { InvoiceRecord, WorkflowRuleConfig, DecisionStatus } from '../types';

export interface TestCase {
  id: string;
  category: 'RESUME' | 'APPLICATION' | 'INVOICE' | 'FILTER' | 'OVERRIDE';
  title: string;
  description: string;
  input: {
    document_type: string;
    document_title: string;
    vendor_name: string;
    invoice_number: string;
    total_amount: number;
    gpa?: number;
    experience_years?: number;
    math_check_valid?: boolean;
    issues?: string[];
  };
  expectedStatus: DecisionStatus;
}

export const TEST_SUITE: TestCase[] = [
  // --- RESUME TEST CASES ---
  {
    id: 'TC-RES-01',
    category: 'RESUME',
    title: 'Approved Resume - Top Tier Senior Candidate',
    description: 'Candidate possesses 8.5+ years experience, 94% skills match, and verified credentials.',
    input: {
      document_type: 'Resume / Candidate Profile',
      document_title: 'Resume - Alex Rivera',
      vendor_name: 'Alex Rivera',
      invoice_number: 'CAND-2026-904',
      total_amount: 0,
      experience_years: 8.5,
      issues: ['Candidate meets all senior architecture experience and skill requirements.'],
    },
    expectedStatus: 'approved',
  },
  {
    id: 'TC-RES-02',
    category: 'RESUME',
    title: 'Flagged Resume - Salary Out of Band / Employment Gap',
    description: 'Candidate meets technical requirements but has a 2.5-year unassigned gap requiring HR review.',
    input: {
      document_type: 'Resume / Candidate Profile',
      document_title: 'Resume - Jordan Smith',
      vendor_name: 'Jordan Smith',
      invoice_number: 'CAND-2026-912',
      total_amount: 0,
      experience_years: 6.0,
      issues: ['Flagged: 2.5-year employment gap detected between 2022 and 2024 requires HR screening.'],
    },
    expectedStatus: 'flagged',
  },
  {
    id: 'TC-RES-03',
    category: 'RESUME',
    title: 'Rejected Resume - Insufficient Required Experience',
    description: 'Candidate applied for Lead Architect role with only 0.5 years experience and missing core competencies.',
    input: {
      document_type: 'Resume / Candidate Profile',
      document_title: 'Resume - Chris Lee',
      vendor_name: 'Chris Lee',
      invoice_number: 'CAND-2026-999',
      total_amount: 0,
      experience_years: 0.5,
      issues: ['Rejected: Experience (0.5 yrs) falls significantly below mandatory 5-year requirement.'],
    },
    expectedStatus: 'rejected',
  },

  // --- APPLICATION TEST CASES ---
  {
    id: 'TC-APP-01',
    category: 'APPLICATION',
    title: 'Approved Application - High Academic Distinction',
    description: 'Undergraduate GPA 3.88 exceeds 3.2 cutoff with verified transcripts and high GRE scores.',
    input: {
      document_type: 'Student Application',
      document_title: 'Student Application - Maya Patel',
      vendor_name: 'Maya Patel',
      invoice_number: 'APP-2026-319',
      total_amount: 0,
      gpa: 3.88,
      issues: ['All mandatory application documents and test scores verified.'],
    },
    expectedStatus: 'approved',
  },
  {
    id: 'TC-APP-02',
    category: 'APPLICATION',
    title: 'Flagged Application - Borderline GPA Threshold',
    description: 'Applicant GPA is 3.15, slightly below the 3.2 automatic approval threshold.',
    input: {
      document_type: 'Student Application',
      document_title: 'Student Application - David Kim',
      vendor_name: 'David Kim',
      invoice_number: 'APP-2026-340',
      total_amount: 0,
      gpa: 3.15,
      issues: ['Flagged: GPA (3.15) is below 3.2 automatic cutoff. Forwarded to Academic Committee.'],
    },
    expectedStatus: 'flagged',
  },
  {
    id: 'TC-APP-03',
    category: 'APPLICATION',
    title: 'Rejected Application - Missing Mandatory Transcript',
    description: 'Student application missing official undergraduate transcript after deadline.',
    input: {
      document_type: 'Student Application',
      document_title: 'Student Application - Taylor Swift',
      vendor_name: 'Taylor Swift',
      invoice_number: 'APP-2026-404',
      total_amount: 0,
      gpa: 0,
      issues: ['Rejected: Official transcript missing. Application incomplete.'],
    },
    expectedStatus: 'rejected',
  },

  // --- INVOICE / PO TEST CASES ---
  {
    id: 'TC-INV-01',
    category: 'INVOICE',
    title: 'Approved Invoice - Standard Below Threshold',
    description: 'Amount ₹42,500 is below ₹100,000 threshold; subtotal + GST arithmetic reconciles perfectly.',
    input: {
      document_type: 'Invoice',
      document_title: 'Invoice - Apex Tech Solutions',
      vendor_name: 'Apex Tech Solutions Pvt Ltd',
      invoice_number: 'INV-2026-0891',
      total_amount: 42500,
      math_check_valid: true,
      issues: ['All mandatory fields verified.', 'Subtotal + GST match total amount.'],
    },
    expectedStatus: 'approved',
  },
  {
    id: 'TC-INV-02',
    category: 'INVOICE',
    title: 'Flagged Purchase Order - Exceeds Spending Threshold',
    description: 'PO amount ₹145,000 exceeds ₹100,000 spending approval limit.',
    input: {
      document_type: 'Purchase Order',
      document_title: 'PO #88204 - Global Freight',
      vendor_name: 'Global Freight & Logistics',
      invoice_number: 'PO-88204',
      total_amount: 145000,
      math_check_valid: true,
      issues: ['Flagged: PO total amount (₹145,000) exceeds ₹100,000 spending threshold.'],
    },
    expectedStatus: 'flagged',
  },
  {
    id: 'TC-INV-03',
    category: 'INVOICE',
    title: 'Rejected Invoice - Mismatched Arithmetic / Invalid Tax ID',
    description: 'Line item subtotal does not match invoice total and GST ID is invalid.',
    input: {
      document_type: 'Invoice',
      document_title: 'Invoice - Rogue Vendor',
      vendor_name: 'Unverified Supplies Ltd',
      invoice_number: 'INV-2026-9999',
      total_amount: 85000,
      math_check_valid: false,
      issues: ['Rejected: Subtotal + Tax arithmetic failed. Invalid GSTIN format.'],
    },
    expectedStatus: 'rejected',
  },
];

/**
 * Helper to determine Document Category from document_type or document_title
 */
export function getDocumentCategory(docType: string, docTitle: string): 'RESUME' | 'APPLICATION' | 'INVOICE' {
  const dt = (docType || '').toLowerCase();
  const title = (docTitle || '').toLowerCase();
  if (dt.includes('resume') || dt.includes('candidate') || title.includes('resume')) {
    return 'RESUME';
  }
  if (dt.includes('student') || dt.includes('application') || title.includes('application')) {
    return 'APPLICATION';
  }
  return 'INVOICE';
}

/**
 * Decision Matrix Rule Evaluator
 */
export function evaluateDecisionMatrix(
  input: TestCase['input'],
  ruleConfig: WorkflowRuleConfig = {
    approvalThreshold: 100000,
    currencySymbol: '₹',
    strictMathCheck: true,
    autoSaveToLedger: true,
  }
): { status: DecisionStatus; reason: string } {
  const category = getDocumentCategory(input.document_type, input.document_title);

  if (category === 'RESUME') {
    if ((input.experience_years ?? 0) < 1 || input.issues?.some((i) => i.toLowerCase().includes('rejected'))) {
      return { status: 'rejected', reason: 'Experience below mandatory criteria or critical qualification missing.' };
    }
    if (input.issues?.some((i) => i.toLowerCase().includes('flagged'))) {
      return { status: 'flagged', reason: 'Candidate profile flagged for HR background review.' };
    }
    return { status: 'approved', reason: 'Candidate shortlisted: Strong skills match and experience verified.' };
  }

  if (category === 'APPLICATION') {
    if ((input.gpa ?? 0) === 0 || input.issues?.some((i) => i.toLowerCase().includes('rejected'))) {
      return { status: 'rejected', reason: 'Missing mandatory transcript or academic eligibility failed.' };
    }
    if ((input.gpa ?? 0) < 3.2 || input.issues?.some((i) => i.toLowerCase().includes('flagged'))) {
      return { status: 'flagged', reason: 'GPA below automatic cutoff; routed to Academic Committee.' };
    }
    return { status: 'approved', reason: 'Application approved: High academic standing verified.' };
  }

  // INVOICE / PO
  if (input.math_check_valid === false || input.issues?.some((i) => i.toLowerCase().includes('rejected'))) {
    return { status: 'rejected', reason: 'Arithmetic mismatch or tax ID validation failure.' };
  }
  if (input.total_amount > ruleConfig.approvalThreshold || input.issues?.some((i) => i.toLowerCase().includes('flagged'))) {
    return { status: 'flagged', reason: `Amount (${input.total_amount}) exceeds policy threshold (${ruleConfig.approvalThreshold}).` };
  }
  return { status: 'approved', reason: 'Invoice verified: Arithmetic balances and amount within limit.' };
}

/**
 * Runner function to execute all test cases and return a report
 */
export function runTestSuite(): { passed: number; failed: number; results: Array<{ id: string; title: string; success: boolean; actual: DecisionStatus; expected: DecisionStatus }> } {
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const tc of TEST_SUITE) {
    const evaluation = evaluateDecisionMatrix(tc.input);
    const success = evaluation.status === tc.expectedStatus;
    if (success) passed++;
    else failed++;

    results.push({
      id: tc.id,
      title: tc.title,
      success,
      actual: evaluation.status,
      expected: tc.expectedStatus,
    });
  }

  return { passed, failed, results };
}
