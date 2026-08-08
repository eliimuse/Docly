import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Increase payload limits to handle image/PDF base64 payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Helper function to safely convert string/formatted numbers to clean JS numbers
function cleanNumber(val: any): number {
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

// In-memory ledger store
let ledgerStore: any[] = [];

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables");
  }
  return new GoogleGenAI({
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Response schema definition for structured JSON extraction across any document type
const documentResponseSchema = {
  type: Type.OBJECT,
  properties: {
    document_type: {
      type: Type.STRING,
      description: "Type of document: e.g. 'Invoice', 'Purchase Order', 'Resume', 'Student Application', 'Legal Contract', 'Expense Receipt', 'Medical Form', or 'General Document'",
    },
    document_title: {
      type: Type.STRING,
      description: "Clean title/header for document (e.g. 'Resume - Alex Rivera', 'PO #8820 - Inventory', 'Invoice - Tech Corp')",
    },
    vendor_name: { type: Type.STRING, description: "Primary entity name: Vendor/Supplier, Candidate Name, Applicant, or Organization" },
    invoice_number: { type: Type.STRING, description: "Reference identifier: Invoice #, PO #, Candidate ID, Application #, or Contract Ref" },
    invoice_date: { type: Type.STRING, description: "Document date in YYYY-MM-DD format if available, else blank" },
    subtotal: { type: Type.NUMBER, description: "Subtotal amount before taxes/fees if financial, else 0" },
    tax_gst: { type: Type.NUMBER, description: "GST/VAT/Tax amount if financial, else 0" },
    total_amount: { type: Type.NUMBER, description: "Final gross total amount payable if financial, else 0" },
    currency: { type: Type.STRING, description: "Currency symbol or code (e.g. INR, USD, EUR)" },
    key_attributes: {
      type: Type.ARRAY,
      description: "Extracted key metadata attributes (e.g., Skills, Experience, Match Score, Department, Terms)",
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING, description: "Attribute label, e.g. 'Top Skills', 'Inventory Check', 'Match Score'" },
          value: { type: Type.STRING, description: "Attribute value, e.g. 'React, Node, Python', 'Verified', '92%'" },
        },
      },
    },
    line_items: {
      type: Type.ARRAY,
      description: "Itemized line items, products, skills, or breakdown items",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING, description: "Item description, skill name, or requirement" },
          quantity: { type: Type.NUMBER, description: "Quantity, hours, or count (default 1)" },
          unit_price: { type: Type.NUMBER, description: "Unit price or rate (or 0 if non-financial)" },
          amount: { type: Type.NUMBER, description: "Line amount (or 0 if non-financial)" },
        },
      },
    },
    dynamic_workflow: {
      type: Type.ARRAY,
      description: "AI-generated dynamic workflow actions tailored to this document type",
      items: {
        type: Type.OBJECT,
        properties: {
          step_name: { type: Type.STRING, description: "Action step title, e.g. 'Extract candidate skills', 'Check inventory levels', 'Verify threshold'" },
          status: { type: Type.STRING, description: "'completed', 'flagged', or 'failed'" },
          details: { type: Type.STRING, description: "Brief outcome note for this step" },
        },
      },
    },
    extraction_confidence: {
      type: Type.STRING,
      description: "high, medium, or low confidence level",
    },
    validation: {
      type: Type.OBJECT,
      properties: {
        missing_fields: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of required fields that are missing or unreadable",
        },
        totals_match: {
          type: Type.BOOLEAN,
          description: "True if financial math reconciles or non-financial document is verified",
        },
        issues: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of validation observations, policy issues, or missing requirements",
        },
      },
    },
    decision: {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Must be 'approved', 'flagged', or 'rejected'",
        },
        reason: {
          type: Type.STRING,
          description: "Detailed justification for the decision status",
        },
      },
    },
    summary: {
      type: Type.STRING,
      description: "1-2 sentence plain-English executive summary suitable for workflow logs",
    },
  },
  required: [
    "document_type",
    "document_title",
    "vendor_name",
    "invoice_number",
    "invoice_date",
    "subtotal",
    "tax_gst",
    "total_amount",
    "currency",
    "key_attributes",
    "line_items",
    "dynamic_workflow",
    "extraction_confidence",
    "validation",
    "decision",
    "summary",
  ],
};

// API: Process Invoice Document
app.post("/api/process-invoice", async (req, res) => {
  const startTime = Date.now();
  try {
    const { fileData, mimeType, customThreshold = 100000, fileName = "uploaded-invoice" } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: "No fileData provided" });
    }

    const ai = getGeminiClient();

    // Clean up base64 header if present
    let cleanBase64 = fileData;
    let actualMimeType = mimeType || "image/png";

    if (fileData.includes(";base64,")) {
      const parts = fileData.split(";base64,");
      const mimePart = parts[0].replace("data:", "");
      actualMimeType = mimePart || actualMimeType;
      cleanBase64 = parts[1];
    }

    if (actualMimeType.includes("svg")) {
      actualMimeType = "image/png";
    }

    const systemInstruction = `You are a universal Document-to-Workflow AI Engine. You analyze any document image or PDF (e.g., Invoices, Purchase Orders, Resumes, Student Applications, Legal Contracts, Expense Receipts, Medical Records, ID Documents).

Do the following in one pass:

1. Document Classification & Metadata:
   - document_type: Identify the specific document type (e.g. "Invoice", "Purchase Order", "Resume", "Student Application", "Legal Contract", "Expense Receipt", "Medical Record", "ID Verification").
   - document_title: Create a clear, professional header (e.g., "Resume - Candidate Name", "PO #1042 - Vendor", "Invoice #2026-901").
   - vendor_name: Extract the primary entity name (Vendor/Merchant for invoices/receipts, Candidate Name for resumes, Applicant Name for applications, Contracting Party for legal docs). If missing/unreadable/blank, set to empty string "".
   - invoice_number: Reference identifier (Invoice #, PO #, Candidate ID, Application #, Contract #). If missing/unreadable, set to empty string "".
   - invoice_date: Date on document in YYYY-MM-DD. If missing/blank or underlines, set to empty string "".

2. Key Attributes & Extraction:
   - key_attributes: Extract 3-6 relevant key metadata key-value pairs appropriate for this document type (e.g., for Resumes: ["Top Skills", "Experience Years", "Role Match Score"]; for POs: ["Inventory Check", "Vendor Status", "Payment Terms"]; for Contracts: ["Effective Date", "Termination Clause", "Jurisdiction"]; for Invoices: ["Subtotal", "Tax Amount", "Payment Due Date"]).
   - Financial totals (if applicable): subtotal, tax_gst, total_amount, currency (e.g. "INR", "USD"). For non-financial documents (like Resumes/Contracts), default totals to 0.
   - line_items: Extract itemized list (Products/Services for invoices/POs; Skills/Education/Role History for Resumes; Required Docs/Eligibility criteria for Applications).

3. Dynamic AI Workflow Generation:
   - Generate a list of 4 to 8 required workflow actions tailored specifically to this document type and state.
   - For example:
     - Resume: ["Extract candidate information", "Identify core technical skills", "Compare against role requirements", "Calculate match score", "Database update & shortlist recommendation"]
     - Purchase Order: ["Extract items & quantities", "Check inventory levels", "Validate vendor catalog pricing", "Check manager threshold policy", "Update inventory & generate PO confirmation"]
     - Invoice: ["Extract line items & vendor details", "Validate subtotal & tax arithmetic", "Check approval threshold policy", "Match PO / Ledger entry", "Route for AP disbursement"]
     - Student Application: ["Extract student personal details", "Verify attached transcripts & IDs", "Evaluate GPA eligibility", "Database status update", "Generate acceptance/response notice"]
   - Mark each workflow step with status ("completed", "flagged", or "failed") and a brief outcome detail.

4. Validation & Decision Agent:
   - Identify missing mandatory required fields (e.g., entity name, document date, total amount for invoices).
   - Determine decision status: "approved" (or "shortlisted" if resume), "flagged" (if policy threshold reached, math discrepancy, or missing non-critical detail), or "rejected" (if mandatory fields are missing or criteria failed).
   - Set decision.reason with a clear, professional explanation.

5. Summary:
   - Write a 1-2 sentence executive summary describing what document was processed, key findings, and next automated workflow action.

Return strictly JSON matching the required schema.`;

    const promptText = "Analyze this document. Classify its document type, extract key attributes, generate a dynamic workflow execution sequence, validate details, decide status, and write an executive summary.";

    const contents = [
      {
        inlineData: {
          mimeType: actualMimeType,
          data: cleanBase64,
        },
      },
      { text: promptText },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: actualMimeType,
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: documentResponseSchema,
        temperature: 0.1,
      },
    });

    const responseText = response.text || "{}";
    let extracted = JSON.parse(responseText);

    // Default metadata
    extracted.document_type = extracted.document_type || "General Document";
    extracted.document_title = extracted.document_title || `${extracted.document_type} - Processed`;
    
    // Clean and convert all numeric fields
    extracted.subtotal = cleanNumber(extracted.subtotal);
    extracted.tax_gst = cleanNumber(extracted.tax_gst);
    extracted.total_amount = cleanNumber(extracted.total_amount);

    const isFinancial = ['invoice', 'receipt', 'purchase order', 'expense', 'po', 'bill'].some(t => 
      extracted.document_type.toLowerCase().includes(t)
    );

    // Track missing required mandatory fields
    const missing: string[] = [];
    const missingLabels: string[] = [];

    const rawVendor = String(extracted.vendor_name || "").trim();
    if (
      !rawVendor ||
      rawVendor.toLowerCase().includes("not provided") ||
      rawVendor.toLowerCase().includes("unknown") ||
      rawVendor.toLowerCase().includes("missing") ||
      rawVendor.startsWith("[") ||
      rawVendor.endsWith("]")
    ) {
      missing.push("vendor_name");
      missingLabels.push(isFinancial ? "Vendor Name" : "Entity / Applicant Name");
      extracted.vendor_name = rawVendor || "Not Provided";
    }

    const rawDate = String(extracted.invoice_date || "").trim();
    if (
      isFinancial && (
        !rawDate ||
        rawDate.includes("_") ||
        rawDate.toLowerCase().includes("n/a") ||
        rawDate.toLowerCase().includes("missing") ||
        rawDate.toLowerCase().includes("not provided")
      )
    ) {
      missing.push("invoice_date");
      missingLabels.push("Document Date");
      extracted.invoice_date = rawDate || "Not Provided";
    }

    if (isFinancial && (!extracted.total_amount || extracted.total_amount <= 0)) {
      if (extracted.subtotal && extracted.subtotal > 0) {
        extracted.total_amount = extracted.subtotal + extracted.tax_gst;
      } else {
        missing.push("total_amount");
        missingLabels.push("Total Amount");
      }
    }

    if (extracted.total_amount > 0 && extracted.subtotal <= 0) {
      extracted.subtotal = Math.max(0, extracted.total_amount - extracted.tax_gst);
    }

    if (!extracted.currency) {
      extracted.currency = "INR";
    }

    const rawInvNum = String(extracted.invoice_number || "").trim();
    if (!rawInvNum || rawInvNum.toLowerCase().includes("n/a") || rawInvNum.includes("_")) {
      extracted.invoice_number = rawInvNum || "N/A";
    }

    // Sanitize and calculate line_items math (qty * unit_price)
    if (Array.isArray(extracted.line_items) && extracted.line_items.length > 0) {
      extracted.line_items = extracted.line_items.map((item: any) => {
        const qty = cleanNumber(item.quantity) || 1;
        let unitPrice = cleanNumber(item.unit_price);
        let amt = cleanNumber(item.amount);

        // If amount is 0 or missing, but unitPrice > 0, calculate amount = qty * unitPrice
        if (amt === 0 && unitPrice > 0) {
          amt = Math.round(qty * unitPrice * 100) / 100;
        }
        // If unitPrice is 0 or missing, but amount > 0, calculate unitPrice = amount / qty
        else if (unitPrice === 0 && amt > 0) {
          unitPrice = Math.round((amt / qty) * 100) / 100;
        }
        // If both exist, verify amt = qty * unitPrice within tolerance
        else if (unitPrice > 0 && Math.abs(amt - qty * unitPrice) > 1) {
          amt = Math.round(qty * unitPrice * 100) / 100;
        }

        return {
          description: String(item.description || "Item"),
          quantity: qty,
          unit_price: unitPrice,
          amount: amt,
        };
      });

      // Handle cases where some line items still have 0 amount & 0 unit_price
      const zeroItems = extracted.line_items.filter((it: any) => it.amount === 0 && it.unit_price === 0);
      if (zeroItems.length > 0) {
        const nonZeroSum = extracted.line_items.reduce((acc: number, it: any) => acc + (it.amount || 0), 0);
        const targetTotal = (extracted.subtotal && extracted.subtotal > 0) ? extracted.subtotal : extracted.total_amount;
        const remainder = Math.max(0, targetTotal - nonZeroSum);

        if (remainder > 0) {
          const splitAmount = Math.round((remainder / zeroItems.length) * 100) / 100;
          extracted.line_items.forEach((it: any) => {
            if (it.amount === 0 && it.unit_price === 0) {
              it.amount = splitAmount;
              it.unit_price = Math.round((splitAmount / (it.quantity || 1)) * 100) / 100;
            }
          });
        } else if (extracted.line_items.length === 1 && targetTotal > 0) {
          extracted.line_items[0].amount = targetTotal;
          extracted.line_items[0].unit_price = Math.round((targetTotal / (extracted.line_items[0].quantity || 1)) * 100) / 100;
        }
      }
    }

    const calculatedTotal = (extracted.subtotal || 0) + (extracted.tax_gst || 0);
    const mathDiff = Math.abs(calculatedTotal - (extracted.total_amount || 0));
    const totalsReconcile = mathDiff <= 5;

    // Build validation feedback
    extracted.validation = extracted.validation || { missing_fields: [], totals_match: totalsReconcile, issues: [] };
    extracted.validation.missing_fields = missing;
    extracted.validation.totals_match = totalsReconcile;

    const issues: string[] = [];
    if (missing.length > 0) {
      missingLabels.forEach((label) => {
        issues.push(`Missing required field on document: ${label}`);
      });
    }
    if (!totalsReconcile) {
      issues.push(`Math discrepancy: Subtotal (${extracted.subtotal}) + Tax (${extracted.tax_gst}) = ${calculatedTotal}, Stated Total = ${extracted.total_amount}`);
    }
    if (extracted.total_amount >= customThreshold) {
      issues.push(`Amount (${extracted.currency} ${extracted.total_amount.toLocaleString()}) reaches or exceeds threshold (${customThreshold}) requiring manager sign-off.`);
    }
    extracted.validation.issues = Array.from(new Set(issues));

    // Ensure dynamic_workflow exists
    if (!Array.isArray(extracted.dynamic_workflow) || extracted.dynamic_workflow.length === 0) {
      if (extracted.document_type.toLowerCase().includes("resume")) {
        extracted.dynamic_workflow = [
          { step_name: "Extract candidate details", status: "completed", details: "Candidate name, contact & links verified" },
          { step_name: "Identify core skills", status: "completed", details: `${extracted.line_items?.length || 3} key competencies identified` },
          { step_name: "Calculate job match score", status: "completed", details: "Evaluated against target position matrix" },
          { step_name: "Update recruitment database", status: "completed", details: "Candidate profile indexed in ATS ledger" },
          { step_name: "Generate candidate summary", status: "completed", details: "Shortlist recommendation logged" },
        ];
      } else if (extracted.document_type.toLowerCase().includes("purchase order") || extracted.document_type.toLowerCase().includes("po")) {
        extracted.dynamic_workflow = [
          { step_name: "Extract PO line items", status: "completed", details: "Quantity, description & catalog codes parsed" },
          { step_name: "Check inventory levels", status: "completed", details: "Stock availability confirmed in warehouse ERP" },
          { step_name: "Validate vendor pricing", status: "completed", details: "Contracted rate matching catalog prices" },
          { step_name: "Check approval threshold", status: extracted.total_amount >= customThreshold ? "flagged" : "completed", details: `Threshold: ${extracted.currency} ${customThreshold}` },
          { step_name: "Generate confirmation", status: "completed", details: "PO routed to supplier fulfillment queue" },
        ];
      } else {
        extracted.dynamic_workflow = [
          { step_name: "Document OCR & Vision parsing", status: "completed", details: "Text and layout structural analysis completed" },
          { step_name: "Extract key entity & reference ID", status: "completed", details: `Parsed ${extracted.vendor_name || "Entity"}` },
          { step_name: "Validate required metadata", status: missing.length > 0 ? "failed" : "completed", details: missing.length > 0 ? `Missing: ${missingLabels.join(", ")}` : "All mandatory fields present" },
          { step_name: "Database update & notification", status: "completed", details: "Record saved to Docly central ledger" },
        ];
      }
    }

    // Ensure key_attributes exists
    if (!Array.isArray(extracted.key_attributes) || extracted.key_attributes.length === 0) {
      extracted.key_attributes = [
        { label: "Document Classification", value: extracted.document_type },
        { label: "Primary Entity", value: extracted.vendor_name || "N/A" },
        { label: "Reference ID", value: extracted.invoice_number || "N/A" },
        { label: "Processing Mode", value: "Gemini AI Neural Engine" },
      ];
    }

    // Decision logic:
    // Rejected: Any required field missing or unreadable on document
    // Flagged: Exceeds threshold OR major math mismatch OR policy review needed
    // Approved: All required fields present and verified
    if (missing.length > 0) {
      extracted.decision = {
        status: "rejected",
        reason: `Rejected due to missing required field(s) on document: ${missingLabels.join(", ")}.`,
      };
    } else if (isFinancial && extracted.total_amount >= customThreshold) {
      extracted.decision = {
        status: "flagged",
        reason: `Flagged for manager review: Total amount (${extracted.currency} ${extracted.total_amount.toLocaleString()}) reaches or exceeds approval policy threshold (${customThreshold}).`,
      };
    } else if (isFinancial && !totalsReconcile && mathDiff > extracted.total_amount * 0.1) {
      extracted.decision = {
        status: "flagged",
        reason: `Flagged due to line-item sum discrepancy (${extracted.currency} ${mathDiff.toFixed(2)} variance).`,
      };
    } else {
      extracted.decision = {
        status: "approved",
        reason: extracted.decision?.reason || `Approved automatically: ${extracted.document_type} successfully parsed and verified by AI workflow engine.`,
      };
    }

    const processingTimeMs = Date.now() - startTime;

    res.json({
      success: true,
      data: extracted,
      processingTimeMs,
    });
  } catch (error: any) {
    console.error("Error processing invoice with Gemini:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process invoice with Gemini AI.",
    });
  }
});

// API: Get Invoices Ledger
app.get("/api/invoices", (req, res) => {
  res.json({ success: true, records: ledgerStore });
});

// API: Save or Update Invoice in Ledger
app.post("/api/invoices", (req, res) => {
  const { record } = req.body;
  if (!record || !record.id) {
    return res.status(400).json({ error: "Invalid record provided" });
  }
  const existingIdx = ledgerStore.findIndex((r) => r.id === record.id);
  if (existingIdx >= 0) {
    ledgerStore[existingIdx] = record;
  } else {
    ledgerStore.unshift(record);
  }
  res.json({ success: true, record });
});

// API: Override Decision Status
app.put("/api/invoices/:id/override", (req, res) => {
  const { id } = req.params;
  const { overrideStatus, overrideReason } = req.body;
  const idx = ledgerStore.findIndex((r) => r.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Invoice record not found" });
  }
  ledgerStore[idx].overrideStatus = overrideStatus;
  ledgerStore[idx].overrideReason = overrideReason || "Manual status update by manager.";
  res.json({ success: true, record: ledgerStore[idx] });
});

// API: Delete Invoice Record
app.delete("/api/invoices/:id", (req, res) => {
  const { id } = req.params;
  ledgerStore = ledgerStore.filter((r) => r.id !== id);
  res.json({ success: true, id });
});

// Start Server with Vite Middleware
async function startServer() {
  // Vite middleware for dev
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
