import { InvoiceRecord, SampleScenario } from '../types';

export const DEFAULT_WORKFLOW_CONFIG = {
  approvalThreshold: 100000,
  currencySymbol: '₹',
  strictMathCheck: true,
  autoSaveToLedger: true,
};

export const SAMPLE_SCENARIOS: SampleScenario[] = [
  {
    id: 'sample-1',
    title: 'Standard IT Services Invoice',
    subtitle: 'Apex Tech Solutions • ₹42,500',
    badge: 'approved',
    description: 'Clean invoice with valid totals, standard vendor, amount below ₹100,000 threshold.',
    sampleData: {
      vendor_name: 'Apex Tech Solutions Pvt Ltd',
      invoice_number: 'INV-2026-0891',
      invoice_date: '2026-08-01',
      subtotal: 36016.95,
      tax_gst: 6483.05,
      total_amount: 42500,
      currency: 'INR',
      line_items: [
        { description: 'Cloud Infrastructure Management (July 2026)', quantity: 1, unit_price: 25000, amount: 25000 },
        { description: 'DevOps Automation Consultancy', quantity: 10, unit_price: 1101.695, amount: 11016.95 }
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
    id: 'sample-2',
    title: 'High-Value Enterprise Hardware',
    subtitle: 'Nexus Server Supply • ₹245,000',
    badge: 'flagged',
    description: 'Valid fields & totals, but exceeds the ₹100,000 threshold requirement.',
    sampleData: {
      vendor_name: 'Nexus Enterprise Systems',
      invoice_number: 'NX-99824',
      invoice_date: '2026-08-03',
      subtotal: 207627.12,
      tax_gst: 37372.88,
      total_amount: 245000,
      currency: 'INR',
      line_items: [
        { description: 'Rack Mount Server Node Dual Socket Xeon', quantity: 1, unit_price: 180000, amount: 180000 },
        { description: '32GB DDR5 Registered ECC RAM Sticks', quantity: 4, unit_price: 6906.78, amount: 27627.12 }
      ],
      extraction_confidence: 'high',
      validation: {
        missing_fields: [],
        totals_match: true,
        issues: ['Flagged: Total amount (₹245,000) exceeds mandatory ₹100,000 secondary approval threshold.']
      },
      decision: {
        status: 'flagged',
        reason: 'Invoice amount of ₹245,000 exceeds threshold limit of ₹100,000. Requires Manager Sign-off before payout.'
      },
      summary: 'Invoice NX-99824 from Nexus Enterprise Systems for ₹245,000 is flagged due to exceeding policy spending limits. Awaiting approval routing.'
    }
  },
  {
    id: 'sample-3',
    title: 'Mismatched Math Vendor',
    subtitle: 'Global Logistics Hub • ₹18,500',
    badge: 'flagged',
    description: 'Subtotal and tax sum do not match total amount indicated on document.',
    sampleData: {
      vendor_name: 'Global Freight & Logistics',
      invoice_number: 'GFL-2026-041',
      invoice_date: '2026-08-04',
      subtotal: 14000,
      tax_gst: 2520,
      total_amount: 18500,
      currency: 'INR',
      line_items: [
        { description: 'Cross-dock Express Freight Air Freight', quantity: 1, unit_price: 14000, amount: 14000 }
      ],
      extraction_confidence: 'medium',
      validation: {
        missing_fields: [],
        totals_match: false,
        issues: ['Discrepancy detected: Subtotal (₹14,000) + Tax (₹2,520) = ₹16,520, which does NOT equal total amount on invoice (₹18,500). Difference: ₹1,980.']
      },
      decision: {
        status: 'flagged',
        reason: 'Mathematical audit failed: Document subtotal plus calculated GST tax does not reconcile with stated total amount.'
      },
      summary: 'Invoice GFL-2026-041 from Global Freight & Logistics was flagged due to a ₹1,980 calculation discrepancy between stated total and calculated items sum.'
    }
  },
  {
    id: 'sample-4',
    title: 'Missing Date & Vendor Slip',
    subtitle: 'Unidentified Thermal Paper • ₹3,200',
    badge: 'rejected',
    description: 'Missing invoice date and vendor company name unreadable.',
    sampleData: {
      vendor_name: '',
      invoice_number: 'REC-00129',
      invoice_date: '',
      subtotal: 2711.86,
      tax_gst: 488.14,
      total_amount: 3200,
      currency: 'INR',
      line_items: [
        { description: 'Office Pantry Refreshment Supplies', quantity: 1, unit_price: 2711.86, amount: 2711.86 }
      ],
      extraction_confidence: 'low',
      validation: {
        missing_fields: ['vendor_name', 'invoice_date'],
        totals_match: true,
        issues: ['Critical field missing: vendor_name', 'Critical field missing: invoice_date']
      },
      decision: {
        status: 'rejected',
        reason: 'Invoice rejected automatically because required mandatory fields (vendor_name, invoice_date) are missing or illegible.'
      },
      summary: 'Invoice REC-00129 was rejected due to missing vendor identity and missing transaction date required for accounting compliance.'
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
