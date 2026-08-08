# 📄 Docly
 
**A universal Document → Workflow AI agent.**
Upload any document — an invoice, purchase order, resume, or student application — and Docly extracts the data, validates it, makes an approve/flag/reject decision, and logs it to a ledger. No manual steps in between.
 
> Built for the **PromptWars** hackathon · *"Build a system that doesn't just assist humans in completing a task — make the system capable of completing the task automatically."*
 
---
 
## What it does
 
Most document-automation demos stop at OCR. Docly goes one step further: **one upload triggers the entire workflow, end-to-end, for any document type.**
 
```
Upload (PDF / Image)
       ↓
Gemini Vision + OCR  →  Classify document type
       ↓
Structured Extraction  →  Vendor/entity, amounts, dates, line items, key attributes
       ↓
Dynamic Workflow Generation  →  AI generates the right process steps for THIS document type
       ↓
Validation  →  Missing fields, arithmetic checks, policy thresholds
       ↓
Decision Agent  →  approved / flagged / rejected + reasoning
       ↓
Ledger  →  Record stored, searchable, auditable, manager-overridable
       ↓
Executive Summary  →  Plain-English workflow log entry
```
 
Docly currently handles:
 
- **Invoices / Receipts / Purchase Orders** — vendor, GST/tax, totals, threshold-based approval, line-item math validation
- **Resumes / Candidate Profiles** — skills, experience, role-match evaluation
- **Student Applications** — GPA thresholds, transcript verification
- **General documents** — falls back to a generic classification + extraction workflow for anything else
## Why it's different
 
- **One AI call, not a pipeline of them.** A single structured Gemini request handles classification, extraction, validation, and decision-making together (`responseSchema`-constrained JSON), instead of chaining multiple slower, more expensive calls.
- **Dynamic, not hardcoded, workflows.** The AI generates the specific process steps appropriate to each document type on the fly rather than following one fixed script.
- **A real decision matrix, not just extraction.** Every processed document gets an explicit `approved / flagged / rejected` status with a stated reason, backed by configurable business rules (approval thresholds, arithmetic tolerance, required fields).
- **Human-in-the-loop where it matters.** Managers can override any AI decision from the ledger, with the override reason preserved for audit.
## Features
 
- 📤 Drag-and-drop upload for PDFs and images
- 🧠 Gemini-powered vision + structured-output extraction (single call)
- ✅ Automatic validation — missing fields, tax/total arithmetic reconciliation, configurable approval threshold
- 🤖 AI-generated, document-type-specific workflow steps
- 📊 Ledger view of every processed document with filtering and search
- ✍️ Manager override with audit trail (reason logged alongside the AI's original decision)
- 🌗 Light/dark theme, persisted locally
- 🧪 Automated test suite covering approved/flagged/rejected scenarios across document categories
- 💾 Local + backend-synced storage (no external DB required for the demo)
## Tech stack
 
| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Express (Node), served via Vite middleware in dev |
| AI | Google Gemini (`@google/genai`), structured JSON output via `responseSchema` |
| Storage | In-memory ledger (server) + `localStorage` (client) for the demo build |
| Testing | `tsx`-run custom test suite over the decision matrix |
 
## Project structure
 
```
├── server.ts                    # Express API: Gemini calls, validation, decision logic, ledger routes
├── src/
│   ├── App.tsx                  # App shell, state, ledger persistence
│   ├── components/
│   │   ├── IntroScreen.tsx
│   │   ├── UploadView.tsx       # Upload + processing UI
│   │   ├── LedgerView.tsx       # Ledger table, filters, overrides
│   │   ├── InvoiceDetailModal.tsx
│   │   ├── DocumentPreviewModal.tsx
│   │   ├── WorkflowDiagram.tsx  # Visualizes the dynamic AI-generated workflow
│   │   └── Header.tsx
│   ├── data/sampleInvoices.ts   # Seed/demo ledger records
│   ├── tests/                   # Decision matrix test suite
│   └── types.ts
```
 
## Run locally
 
**Prerequisites:** Node.js
 
1. Install dependencies
```bash
   npm install
```
2. Set your Gemini API key in `.env.local`
```bash
   GEMINI_API_KEY="your_gemini_api_key"
```
3. Start the dev server
```bash
   npm run dev
```
4. Open `http://localhost:3000`
## Testing
 
```bash
npm test
```
 
Runs the decision-matrix test suite covering approved/flagged/rejected outcomes across invoices, purchase orders, resumes, and student applications.
 
## Roadmap / known limitations
 
- No authentication on ledger API routes — fine for a hackathon demo, not production-ready as-is
- Ledger is in-memory on the server (resets on restart); persistent storage (e.g. Postgres/Supabase) would be the next step
- Accessibility (ARIA labeling, full keyboard navigation) not yet implemented
- Decision logic in the test suite currently mirrors, rather than directly calls, the server's live logic
---
 
<div align="center">
Built at PromptWars · Powered by Google Gemini
</div>
 
