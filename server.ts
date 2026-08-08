import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Increase payload limits to handle image/PDF base64 payloads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

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
          amount: { type: Type.NUMBER },
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

    const systemInstruction = `You are an accounts-payable workflow AI assistant. You will receive an invoice as an image or PDF.
Do the following in one pass:

1. Extract:
   - vendor_name (string)
   - invoice_number (string)
   - invoice_date (YYYY-MM-DD)
   - subtotal (number)
   - tax_gst (number)
   - total_amount (number)
   - currency (string, e.g. "INR", "USD", "EUR")
   - line_items (array of { description, quantity, unit_price, amount })

2. Validate:
   - Check if subtotal + tax_gst ≈ total_amount (allow ±1.5 unit rounding).
   - Flag any missing or unreadable mandatory fields out of: vendor_name, invoice_number, invoice_date, total_amount.
   - Set totals_match to true if math reconciles, else false.
   - Collect human-readable validation issue messages.

3. Decide:
   - "approved" if ALL mandatory fields (vendor_name, invoice_number, invoice_date, total_amount) are present AND totals_match is true AND total_amount < ${customThreshold}.
   - "flagged" if mandatory fields are present BUT totals_match is false OR total_amount >= ${customThreshold}.
   - "rejected" if ANY mandatory field (vendor_name, invoice_number, invoice_date, total_amount) is missing, empty, or unreadable.

4. Summary:
   - Write a 1-2 sentence concise plain-English accounting summary describing the invoice, amount, vendor, and outcome.

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

    // Double check math & rules on server for strict policy adherence
    const missing: string[] = [];
    if (!extracted.vendor_name || extracted.vendor_name.trim() === "") missing.push("vendor_name");
    if (!extracted.invoice_number || extracted.invoice_number.trim() === "") missing.push("invoice_number");
    if (!extracted.invoice_date || extracted.invoice_date.trim() === "") missing.push("invoice_date");
    if (extracted.total_amount === undefined || extracted.total_amount === null || isNaN(extracted.total_amount) || extracted.total_amount <= 0) {
      missing.push("total_amount");
    }

    const calculatedTotal = (extracted.subtotal || 0) + (extracted.tax_gst || 0);
    const mathDiff = Math.abs(calculatedTotal - (extracted.total_amount || 0));
    const totalsReconcile = extracted.subtotal !== undefined && extracted.tax_gst !== undefined ? mathDiff <= 1.5 : true;

    // Ensure validation array exists
    extracted.validation = extracted.validation || { missing_fields: [], totals_match: totalsReconcile, issues: [] };
    extracted.validation.missing_fields = missing;
    extracted.validation.totals_match = totalsReconcile;

    const issues: string[] = extracted.validation.issues || [];
    if (missing.length > 0) {
      issues.push(`Missing mandatory fields: ${missing.join(", ")}`);
    }
    if (!totalsReconcile) {
      issues.push(`Math discrepancy: Subtotal (${extracted.subtotal}) + Tax (${extracted.tax_gst}) = ${calculatedTotal}, Stated Total = ${extracted.total_amount} (Diff: ${mathDiff.toFixed(2)})`);
    }
    if (extracted.total_amount >= customThreshold) {
      issues.push(`Amount (${extracted.currency || ""} ${extracted.total_amount}) reaches or exceeds threshold (${customThreshold}) requiring manager review.`);
    }
    extracted.validation.issues = Array.from(new Set(issues));

    // Refine Decision logic
    if (missing.length > 0) {
      extracted.decision = {
        status: "rejected",
        reason: `Rejected due to unreadable or missing required field(s): ${missing.join(", ")}.`,
      };
    } else if (!totalsReconcile || extracted.total_amount >= customThreshold) {
      const reasons: string[] = [];
      if (!totalsReconcile) reasons.push("totals mismatch");
      if (extracted.total_amount >= customThreshold) reasons.push(`total amount exceeds threshold limit (${customThreshold})`);
      extracted.decision = {
        status: "flagged",
        reason: `Flagged for manager review due to: ${reasons.join(" and ")}.`,
      };
    } else {
      extracted.decision = {
        status: "approved",
        reason: `Approved automatically. All required fields verified, totals reconcile, and total amount is below the approval threshold of ${customThreshold}.`,
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
