import { InvoiceRecord, SampleScenario } from '../types';

export const DEFAULT_WORKFLOW_CONFIG = {
  approvalThreshold: 100000,
  currencySymbol: '₹',
  strictMathCheck: true,
  autoSaveToLedger: true,
};

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'sample-resume',
    title: 'Senior Software Engineer Resume',
    subtitle: 'Alex Rivera • 94% Role Match Score',
    badge: 'approved',
    description: 'Candidate profile with extracted technical skills, experience matrix, and AI shortlist recommendation.',
    sampleData: {
      document_type: 'Resume / Candidate Profile',
      document_title: 'Resume - Alex Rivera (Lead Full-Stack Architect)',
      vendor_name: 'Alex Rivera',
      invoice_number: 'CAND-2026-904',
      invoice_date: '2026-08-01',
      subtotal: 0,
      tax_gst: 0,
      total_amount: 0,
      currency: 'USD',
      key_attributes: [
        { label: 'Role Title', value: 'Lead Full-Stack Architect' },
        { label: 'Experience', value: '8.5 Years' },
        { label: 'Match Score', value: '94% (Top Tier)' },
        { label: 'Top Competencies', value: 'React, Node.js, TypeScript, Cloud Architecture' },
      ],
      line_items: [
        { description: 'Senior Frontend Lead - TechCorp Inc (4 yrs)', quantity: 1, unit_price: 0, amount: 0 },
        { description: 'Full-Stack Developer - CloudScale Labs (3.5 yrs)', quantity: 1, unit_price: 0, amount: 0 },
        { description: 'B.S. Computer Science - UC Berkeley', quantity: 1, unit_price: 0, amount: 0 },
      ],
      dynamic_workflow: [
        { step_name: 'Extract candidate details', status: 'completed', details: 'Parsed Alex Rivera, contact & LinkedIn verified' },
        { step_name: 'Identify core technical skills', status: 'completed', details: 'React, Node, TypeScript, Docker, PostgreSQL' },
        { step_name: 'Compare against job requirements', status: 'completed', details: 'Matches 9 of 10 required seniority competencies' },
        { step_name: 'Calculate role match score', status: 'completed', details: 'Score: 94% (High Fit)' },
        { step_name: 'Update recruitment database', status: 'completed', details: 'Candidate record indexed in ATS database' },
        { step_name: 'Generate candidate summary', status: 'completed', details: 'Shortlist recommendation sent to hiring manager' },
      ],
      extraction_confidence: 'high',
      validation: {
        missing_fields: [],
        totals_match: true,
        issues: ['Candidate meets all senior experience and degree requirements.']
      },
      decision: {
        status: 'approved',
        reason: 'Candidate shortlisted: Alex Rivera matches 94% of Senior Engineer requirements with 8.5 years of experience.'
      },
      summary: 'Candidate profile for Alex Rivera analyzed. Identified 8.5 years tech experience in React/Node stack with a 94% match score. Shortlist decision recorded.'
    }
  },
  {
    id: 'sample-po',
    title: 'Enterprise PO #88204',
    subtitle: 'Global Logistics Hub • ₹145,000',
    badge: 'flagged',
    description: 'Purchase Order with line-item inventory check, pricing validation, and threshold audit flag.',
    sampleData: {
      document_type: 'Purchase Order',
      document_title: 'PO #88204 - Network Infrastructure Supply',
      vendor_name: 'Global Freight & Logistics',
      invoice_number: 'PO-88204',
      invoice_date: '2026-08-04',
      subtotal: 122881.36,
      tax_gst: 22118.64,
      total_amount: 145000,
      currency: 'INR',
      key_attributes: [
        { label: 'Supplier', value: 'Global Freight & Logistics' },
        { label: 'Inventory Check', value: 'In-Stock (Warehouse Bay 4)' },
        { label: 'Payment Terms', value: 'Net 30 Days' },
        { label: 'Catalog Price Check', value: 'Verified' },
      ],
      line_items: [
        { description: 'High-Density Fiber Optic Switches', quantity: 2, unit_price: 50000, amount: 100000 },
        { description: 'Cat6 Shielded Patch Cables (100m)', quantity: 5, unit_price: 4576.27, amount: 22881.36 }
      ],
      dynamic_workflow: [
        { step_name: 'Extract PO line items & quantities', status: 'completed', details: 'Extracted 2 items (Switches & Cables)' },
        { step_name: 'Check warehouse inventory', status: 'completed', details: 'Stock available in Bay 4' },
        { step_name: 'Check vendor catalog prices', status: 'completed', details: 'Contract rates match catalog prices' },
        { step_name: 'Check approval threshold', status: 'flagged', details: 'PO amount (₹145,000) exceeds ₹100,000 policy threshold' },
        { step_name: 'Update inventory database', status: 'completed', details: 'Stock reserved in ERP ledger' },
        { step_name: 'Generate PO confirmation', status: 'completed', details: 'Awaiting manager sign-off for payout dispatch' }
      ],
      extraction_confidence: 'high',
      validation: {
        missing_fields: [],
        totals_match: true,
        issues: ['Flagged: PO total amount (₹145,000) exceeds ₹100,000 spending threshold requiring manager authorization.']
      },
      decision: {
        status: 'flagged',
        reason: 'Purchase order totals ₹145,000, which exceeds the ₹100,000 policy threshold. Routed for manager sign-off.'
      },
      summary: 'PO #88204 from Global Freight & Logistics for ₹145,000 successfully checked against inventory. Flagged due to threshold approval policy.'
    }
  },
  {
    id: 'sample-student',
    title: 'University Masters Application',
    subtitle: 'Maya Patel • M.S. Data Science',
    badge: 'approved',
    description: 'Student application document with transcript verification, GPA eligibility, and decision response.',
    sampleData: {
      document_type: 'Student Application',
      document_title: 'Student Application - Maya Patel (M.S. Data Science)',
      vendor_name: 'Maya Patel',
      invoice_number: 'APP-2026-319',
      invoice_date: '2026-08-02',
      subtotal: 0,
      tax_gst: 0,
      total_amount: 0,
      currency: 'USD',
      key_attributes: [
        { label: 'Target Program', value: 'M.S. Data Science & AI' },
        { label: 'Undergrad GPA', value: '3.88 / 4.0' },
        { label: 'GRE Score', value: '328 (Quant: 168)' },
        { label: 'Transcripts & ID', value: 'Verified & Attached' },
      ],
      line_items: [
        { description: 'Official Academic Transcript (B.S. Math & CS)', quantity: 1, unit_price: 0, amount: 0 },
        { description: 'Statement of Purpose - AI Research', quantity: 1, unit_price: 0, amount: 0 },
        { description: '3x Professional Recommendation Letters', quantity: 3, unit_price: 0, amount: 0 },
      ],
      dynamic_workflow: [
        { step_name: 'Extract applicant details', status: 'completed', details: 'Maya Patel, applicant contact details parsed' },
        { step_name: 'Verify required documents', status: 'completed', details: 'Transcripts, GRE report, Statement of Purpose present' },
        { step_name: 'Check academic eligibility', status: 'completed', details: 'GPA 3.88 exceeds 3.2 minimum criteria' },
        { step_name: 'Update admissions database', status: 'completed', details: 'Indexed in Graduate Admissions portal' },
        { step_name: 'Generate response decision', status: 'completed', details: 'Offer letter generated' },
      ],
      extraction_confidence: 'high',
      validation: {
        missing_fields: [],
        totals_match: true,
        issues: ['All mandatory application documents and test scores verified.']
      },
      decision: {
        status: 'approved',
        reason: 'Application approved: Maya Patel meets all admissions prerequisites with a 3.88 GPA and GRE 328.'
      },
      summary: 'Graduate application APP-2026-319 for Maya Patel (M.S. Data Science) verified. High academic standing approved for admission.'
    }
  },
  {
    id: 'sample-1',
    title: 'Standard IT Services Invoice',
    subtitle: 'Apex Tech Solutions • ₹42,500',
    badge: 'approved',
    description: 'Clean invoice with valid totals, standard vendor, amount below ₹100,000 threshold.',
    sampleData: {
      document_type: 'Invoice',
      document_title: 'Invoice - Apex Tech Solutions Pvt Ltd',
      vendor_name: 'Apex Tech Solutions Pvt Ltd',
      invoice_number: 'INV-2026-0891',
      invoice_date: '2026-08-01',
      subtotal: 36016.95,
      tax_gst: 6483.05,
      total_amount: 42500,
      currency: 'INR',
      key_attributes: [
        { label: 'Vendor', value: 'Apex Tech Solutions Pvt Ltd' },
        { label: 'GST Number', value: '27AAAAA0000A1Z5' },
        { label: 'Payment Terms', value: 'Immediate / Bank Transfer' },
        { label: 'Matching PO', value: 'PO-2026-8801' },
      ],
      line_items: [
        { description: 'Cloud Infrastructure Management (July 2026)', quantity: 1, unit_price: 25000, amount: 25000 },
        { description: 'DevOps Automation Consultancy', quantity: 10, unit_price: 1101.695, amount: 11016.95 }
      ],
      dynamic_workflow: [
        { step_name: 'Extract line items & vendor details', status: 'completed', details: 'Parsed Apex Tech Solutions Pvt Ltd' },
        { step_name: 'Validate subtotal & GST tax arithmetic', status: 'completed', details: '36016.95 + 6483.05 = ₹42,500 perfectly' },
        { step_name: 'Check approval threshold policy', status: 'completed', details: '₹42,500 is below ₹100,000 threshold' },
        { step_name: 'Match PO / Ledger entry', status: 'completed', details: 'Matched against active PO-2026-8801' },
        { step_name: 'Route for AP disbursement', status: 'completed', details: 'Queued in payment disbursement batch' }
      ],
      extraction_confidence: 'high',
      validation: {
        missing_fields: [],
        totals_match: true,
        issues: ['All mandatory fields verified.', 'Subtotal + GST match total amount perfectly.']
      },
      decision: {
        status: 'approved',
        reason: 'All required fields present, line items reconcile with tax, and total amount (₹42,500) is below the ₹100,000 approval threshold.'
      },
      summary: 'Invoice INV-2026-0891 from Apex Tech Solutions Pvt Ltd for ₹42,500 (Cloud & DevOps services) was automatically approved and posted to AP ledger.'
    }
  },
  {
    id: 'sample-contract',
    title: 'Vendor Master Service Agreement',
    subtitle: 'CyberShield Systems • Contract NDA',
    badge: 'approved',
    description: 'Legal agreement document with extracted terms, liability caps, and jurisdiction clauses.',
    sampleData: {
      document_type: 'Legal Contract',
      document_title: 'Master Service Agreement - CyberShield Systems',
      vendor_name: 'CyberShield Systems',
      invoice_number: 'MSA-2026-042',
      invoice_date: '2026-07-15',
      subtotal: 0,
      tax_gst: 0,
      total_amount: 0,
      currency: 'USD',
      key_attributes: [
        { label: 'Contract Type', value: 'Master Service Agreement (MSA)' },
        { label: 'Term Length', value: '24 Months (Auto-renewal)' },
        { label: 'Liability Cap', value: '$1,000,000 USD' },
        { label: 'Governing Law', value: 'Delaware, USA' },
      ],
      line_items: [
        { description: 'SOC2 Type II Security Compliance Audit', quantity: 1, unit_price: 0, amount: 0 },
        { description: '24/7 Managed Incident Detection & Response', quantity: 1, unit_price: 0, amount: 0 },
        { description: 'Data Privacy & GDPR Addendum (DPA)', quantity: 1, unit_price: 0, amount: 0 },
      ],
      dynamic_workflow: [
        { step_name: 'Extract contracting parties', status: 'completed', details: 'CyberShield Systems & Enterprise Corp' },
        { step_name: 'Identify key legal clauses', status: 'completed', details: 'Indemnification, Liability Cap & Governing Law parsed' },
        { step_name: 'Check compliance prerequisites', status: 'completed', details: 'SOC2 compliance certified' },
        { step_name: 'Update legal records vault', status: 'completed', details: 'Contract indexed in Legal ERP' },
        { step_name: 'Schedule term renewal alert', status: 'completed', details: 'Expiry notification set for July 2028' },
      ],
      extraction_confidence: 'high',
      validation: {
        missing_fields: [],
        totals_match: true,
        issues: ['All legal clauses and signing authority signatures present.']
      },
      decision: {
        status: 'approved',
        reason: 'Contract approved: MSA-2026-042 complies with enterprise legal standards and indemnification limits.'
      },
      summary: 'Master Service Agreement MSA-2026-042 with CyberShield Systems processed. Legal clauses, 24-month term, and liability limits indexed.'
    }
  }
];

export const INITIAL_LEDGER_RECORDS: InvoiceRecord[] = SAMPLE_SCENARIOS.map((scenario, index) => ({
  id: `rec-${1000 + index}`,
  timestamp: new Date(Date.now() - (index * 3600000 * 5)).toISOString(),
  fileName: `${scenario.sampleData.invoice_number || 'document'}.pdf`,
  fileType: 'application/pdf',
  extractedData: scenario.sampleData,
  processingTimeMs: 1120 + Math.floor(Math.random() * 400)
}));
