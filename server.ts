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

// Response schema definition for structured JSON extraction
const invoiceResponseSchema = {
  type: Type.OBJECT,
  properties: {
    vendor_name: { type: Type.STRING, description: "Name of the vendor/supplier or empty string if unreadable" },
    invoice_number: { type: Type.STRING, description: "Invoice or receipt reference number" },
    invoice_date: { type: Type.STRING, description: "Date of invoice in YYYY-MM-DD format if available" },
    subtotal: { type: Type.NUMBER, description: "Subtotal amount before taxes/fees" },
    tax_gst: { type: Type.NUMBER, description: "GST, VAT, or Sales Tax amount" },
    total_amount: { type: Type.NUMBER, description: "Final gross total amount payable" },
    currency: { type: Type.STRING, description: "Currency symbol or code, e.g. INR, USD, EUR" },
    line_items: {
      type: Type.ARRAY,
      description: "List of itemized products or services rendered",
      items: {
        type: Type.OBJECT,
        properties: {
          description: { type: Type.STRING },
          quantity: { type: Type.NUMBER },
          unit_price: { type: Type.NUMBER },
          amount: { type: Type.NUMBER, description: "Total line item amount equal to quantity multiplied by unit_price" },
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
          description: "True if subtotal + tax_gst ≈ total_amount within ±1 unit",
        },
        issues: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of validation observations or discrepancies found",
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
          description: "Detailed justification for the approval, flag, or rejection",
        },
      },
    },
    summary: {
      type: Type.STRING,
      description: "1-2 sentence plain-English accounting summary suitable for logs",
    },
  },
  required: [
    "vendor_name",
    "invoice_number",
    "invoice_date",
    "subtotal",
    "tax_gst",
    "total_amount",
    "currency",
    "line_items",
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

    const systemInstruction = `You are an accounts-payable workflow AI assistant. You will receive an invoice or receipt as an image or PDF.
Do the following in one pass:

1. Extract:
   - vendor_name: Name of vendor/supplier. If missing, unreadable, blank, or explicitly marked as not provided (e.g. "[VENDOR NAME NOT PROVIDED]"), set to null or empty string "".
   - invoice_number: Invoice reference number. If missing, set to null or empty string "".
   - invoice_date: Date on invoice in YYYY-MM-DD. If missing, blank, or underlines (e.g. "Date: _____"), set to null or empty string "".
   - subtotal: Subtotal before tax as a clean float or integer number (e.g. 180000 or 180000.00). If not explicitly listed, calculate as total_amount - tax_gst.
   - tax_gst: Tax amount as a clean float or integer. Default to 0 if not listed.
   - total_amount: Final total amount payable as a clean float or integer.
   - currency: Currency symbol or code, e.g. "INR", "USD", "EUR". Default to "INR" if unspecified.
   - line_items: List of line items ({ description, quantity, unit_price, amount }).
     CRITICAL NUMERIC RULE: All numeric values (subtotal, tax_gst, total_amount, unit_price, amount) MUST be clean JS float/integer numbers. E.g., for "180,000.00" return 180000 or 180000.00. Do NOT include thousand commas or currency symbols inside numeric values. 'amount' MUST be equal to quantity * unit_price for each line item.

2. Validate:
   - Identify missing mandatory required fields: vendor_name, invoice_date, total_amount.
   - Check if subtotal + tax_gst ≈ total_amount (allow ±2 units for rounding or currency conversion).
   - Set totals_match to true if math reconciles or if subtotal was inferred, else false.

3. Decide:
   - "rejected" if ANY mandatory field (vendor_name, invoice_date, total_amount) is missing, unreadable, blank, or explicitly marked as not provided.
   - "flagged" if ALL mandatory fields are present BUT total_amount >= ${customThreshold} OR subtotal + tax_gst does NOT match total_amount.
   - "approved" if ALL mandatory fields are present AND total_amount < ${customThreshold} AND math reconciles.

4. Summary:
   - Write a 1-2 sentence concise plain-English accounting summary describing the invoice, amount, vendor, and decision outcome.

Return strictly JSON matching the required schema.`;

    const promptText = "Process this invoice document according to instructions. Extract fields, validate totals, decide status, and write an accounting log summary.";

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
        responseSchema: invoiceResponseSchema,
        temperature: 0.1,
      },
    });

    const responseText = response.text || "{}";
    let extracted = JSON.parse(responseText);

    // Clean and convert all numeric fields from potential strings/formatted numbers
    extracted.subtotal = cleanNumber(extracted.subtotal);
    extracted.tax_gst = cleanNumber(extracted.tax_gst);
    extracted.total_amount = cleanNumber(extracted.total_amount);

    // Track missing required mandatory fields for strict policy enforcement
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
      missingLabels.push("Vendor Name");
      extracted.vendor_name = rawVendor || "Not Provided";
    }

    const rawDate = String(extracted.invoice_date || "").trim();
    if (
      !rawDate ||
      rawDate.includes("_") ||
      rawDate.toLowerCase().includes("n/a") ||
      rawDate.toLowerCase().includes("missing") ||
      rawDate.toLowerCase().includes("not provided")
    ) {
      missing.push("invoice_date");
      missingLabels.push("Invoice Date");
      extracted.invoice_date = rawDate || "Not Provided";
    }

    if (!extracted.total_amount || extracted.total_amount <= 0) {
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
        // If both amt and unitPrice are 0, and there's 1 line item and total_amount > 0, fallback to total_amount
        else if (amt === 0 && unitPrice === 0 && extracted.line_items.length === 1 && extracted.total_amount > 0) {
          amt = extracted.total_amount;
          unitPrice = Math.round((amt / qty) * 100) / 100;
        }

        return {
          description: String(item.description || "Item"),
          quantity: qty,
          unit_price: unitPrice,
          amount: amt,
        };
      });
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

    // Decision logic:
    // Rejected: Any required field missing or unreadable on document (vendor, date, total amount)
    // Flagged: Exceeds threshold OR major math mismatch
    // Approved: All required fields present, amount below threshold, math reconciles
    if (missing.length > 0) {
      extracted.decision = {
        status: "rejected",
        reason: `Rejected due to missing required field(s) on document: ${missingLabels.join(", ")}.`,
      };
    } else if (extracted.total_amount >= customThreshold) {
      extracted.decision = {
        status: "flagged",
        reason: `Flagged for manager review: Total amount (${extracted.currency} ${extracted.total_amount.toLocaleString()}) reaches or exceeds approval policy threshold (${customThreshold}).`,
      };
    } else if (!totalsReconcile && mathDiff > extracted.total_amount * 0.1) {
      extracted.decision = {
        status: "flagged",
        reason: `Flagged due to line-item sum discrepancy (${extracted.currency} ${mathDiff.toFixed(2)} variance).`,
      };
    } else {
      extracted.decision = {
        status: "approved",
        reason: `Approved automatically: Total amount (${extracted.currency} ${extracted.total_amount.toLocaleString()}) is below approval policy threshold (${customThreshold}) and required accounting data is verified.`,
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
