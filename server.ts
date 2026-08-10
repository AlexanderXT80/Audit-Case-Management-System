import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { 
  UserRole, 
  CaseStage, 
  DatabaseSchema, 
  User, 
  AuditCase, 
  RiskAssessment, 
  ApprovalRequest, 
  CaseStageHistory, 
  DocumentRequest, 
  EvidenceDocument, 
  Finding, 
  Assessment, 
  Appeal, 
  AuditLogEntry, 
  Taxpayer 
} from "./src/types.js"; // Use js extension for ESM compatibility

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;
const DB_PATH = path.join(process.cwd(), "db.json");

// Initialize Gemini SDK if API key is present
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      }
    }
  });
}

// Global state / session holder in-memory (and persisted to db.json)
let db: DatabaseSchema = {
  users: [],
  taxpayers: [],
  riskAssessments: [],
  auditCases: [],
  caseStageHistory: [],
  documentRequests: [],
  evidenceDocuments: [],
  findings: [],
  assessments: [],
  approvals: [],
  appeals: [],
  auditLog: []
};

// Current authenticated user session (mocked, changeable via client)
let currentUserSession: {
  userId: string | null;
  activeRole: UserRole | null;
} = {
  userId: null, 
  activeRole: null
};

// Seed Data helper
function seedDatabase() {
  const users: User[] = [
    { id: "u-1", name: "Blessings Kaunda", role: UserRole.SUPERVISOR, email: "b.kaunda@auditcms.gov", active: true },
    { id: "u-2", name: "Chikondi Phiri", role: UserRole.AUDITOR, email: "c.phiri@auditcms.gov", active: true },
    { id: "u-3", name: "Alexander Chikumba", role: UserRole.AUDITOR, email: "a.chikumba@auditcms.gov", active: true },
    { id: "u-4", name: "Thandiwe Nyirenda", role: UserRole.LEGAL, email: "t.nyirenda@auditcms.gov", active: true },
    { id: "u-5", name: "Yamikani Banda", role: UserRole.ADMIN, email: "y.banda@auditcms.gov", active: true }
  ];

  const taxpayers: Taxpayer[] = [
    { tin: "TIN-994287-PLI", name: "Chichiri Precision Engineering Ltd", sector: "Corporate Tax / Tech Services", taxTypes: ["VAT", "Corporate Income Tax"], address: "78 Technology Drive, Cyber City" },
    { tin: "TIN-88219321", name: "BlueWave Port Services", sector: "Maritime Logistical Shipping", taxTypes: ["VAT", "Customs Duties", "Corporate Income Tax"], address: "Terminal 4, Port Area, Seaside Coast" },
    { tin: "TIN-44910023", name: "Vertex Holdings Ltd", sector: "Financial Services & Asset Management", taxTypes: ["VAT", "Withholding Tax"], address: "99 Financial Blvd, Capitals Tower" },
    { tin: "TIN-11223948", name: "Ghost Retailer Lead", sector: "Retail & E-commerce Distribution", taxTypes: ["VAT"], address: "Suspicious Warehouse B, Outer Rim Industrial" },
    { tin: "TIN-99023412", name: "Smith & Sons Mfg", sector: "Heavy Metal Fabrication & Assembly", taxTypes: ["VAT", "Excise Duty"], address: "12 Foundry Lane, Industrial District" },
    { tin: "TIN-12389475101", name: "Global Logistics Corp", sector: "Cross-Border Logistics & Haulage", taxTypes: ["VAT", "Corporate Income Tax"], address: "Suite 404, Continental Gateway Park" }
  ];

  const riskAssessments: RiskAssessment[] = [
    {
      id: "risk-1",
      tin: "TIN-88219321",
      score: 94.2,
      method: "Benford's Law + ML Outlier",
      selectionDate: "2024-07-10",
      rawOutput: JSON.stringify({
        request_id: "REQ-7781-B-2023",
        timestamp: "2024-07-10T14:32:01.002Z",
        model_signature: "xgb_forest_v2_f882",
        features: {
          inter_company_loans: 0.88,
          benford_variance: 4.12,
          vat_itc_mismatch: 0.92,
          jurisdiction_risk: 0.75
        },
        tier_3: true,
        probabilities: {
          evasion: 0.9421,
          clerical_error: 0.0579
        },
        explanation: "High variance in first-digit distribution (Benford's Law) detected in reported expenses. Significant mismatch between input tax credits and supplier declarations."
      }, null, 2),
      factors: [
        { name: "Benford Deviation", percentage: 82 },
        { name: "VAT Input Mismatch", percentage: 92 },
        { name: "Jurisdiction Offshoring", percentage: 75 }
      ]
    },
    {
      id: "risk-2",
      tin: "TIN-44910023",
      score: 68.5,
      method: "VAT Gap Analysis",
      selectionDate: "2024-07-09",
      rawOutput: JSON.stringify({
        request_id: "REQ-8812-V-2024",
        timestamp: "2024-07-09T09:12:33Z",
        model_signature: "vat_gap_neural_v1.0",
        features: {
          underreported_sales_ratio: 0.68,
          exempt_turnover_volatility: 0.45
        },
        probabilities: {
          evasion: 0.685,
          clerical_error: 0.315
        },
        explanation: "Suspiciously low profit margins relative to industry average and highly volatile exempt turnover ratio."
      }, null, 2),
      factors: [
        { name: "Underreported Sales Ratio", percentage: 68 },
        { name: "Exempt turnover volatility", percentage: 45 }
      ]
    },
    {
      id: "risk-3",
      tin: "TIN-11223948",
      score: 12.1,
      method: "Random Compliance Check",
      selectionDate: "2024-07-08",
      rawOutput: JSON.stringify({
        request_id: "REQ-1120-R-2024",
        explanation: "Normal compliance routine selection. Low structural risk score."
      }, null, 2),
      factors: [
        { name: "Random Picker Seed", percentage: 12 }
      ]
    },
    {
      id: "risk-4",
      tin: "TIN-99023412",
      score: 89.9,
      method: "Transaction Cluster Detection",
      selectionDate: "2024-07-07",
      rawOutput: JSON.stringify({
        request_id: "REQ-9902-C-2024",
        explanation: "Excessive input tax credit claims corresponding to shell companies flagged in the missing-trader graph network analysis."
      }, null, 2),
      factors: [
        { name: "Missing-Trader Graph Proximity", percentage: 90 },
        { name: "Input Claim Velocity", percentage: 88 }
      ]
    }
  ];

  const auditCases: AuditCase[] = [
    {
      id: "A-2023-00452",
      tin: "TIN-994287-PLI",
      taxpayerName: "Chichiri Precision Engineering Ltd",
      stage: CaseStage.REVIEW,
      leadAuditorId: "u-3",
      leadAuditorName: "Alexander Chikumba",
      financialImpact: 14250000.00,
      auditType: "Corporate Revenue Reconciliation",
      createdAt: "2024-01-15",
      notes: "Audit focused on transfer pricing loops and unreported overseas software development revenue from Q3-Q4 fiscal cycle."
    },
    {
      id: "CASE-8829-2024",
      tin: "TIN-12389475101",
      taxpayerName: "Global Logistics Corp",
      stage: CaseStage.FIELDWORK,
      leadAuditorId: "u-2",
      leadAuditorName: "Chikondi Phiri",
      financialImpact: 842000.00,
      auditType: "VAT Inputs Integrity Review",
      createdAt: "2024-01-12",
      notes: "Fieldwork active. Focus on fuel VAT deductions and offshore subsidiary transit logs."
    },
    {
      id: "AUD-2024-0742",
      tin: "TIN-44910023",
      taxpayerName: "Vertex Holdings Ltd",
      stage: CaseStage.PLANNING,
      leadAuditorId: "u-2",
      leadAuditorName: "Chikondi Phiri",
      financialImpact: 12500.00,
      auditType: "Withholding Tax Verification",
      createdAt: "2024-04-10",
      notes: "Audit scope defined. Waiting for taxpayer to upload foundational withholding certificate logs."
    },
    {
      id: "AUD-2024-1102",
      tin: "TIN-11223948",
      taxpayerName: "Ghost Retailer Lead",
      stage: CaseStage.SELECTED,
      leadAuditorId: null,
      leadAuditorName: null,
      financialImpact: 2000000.00,
      auditType: "VAT Carousel Fraud Investigation",
      createdAt: "2024-06-01",
      notes: "Selected automatically by risk engine due to high missing-trader graph proximity score. Requires triage review and lead auditor assignment."
    }
  ];

  const caseStageHistory: CaseStageHistory[] = [
    { id: "h-1", caseId: "CASE-8829-2024", fromStage: CaseStage.SELECTED, toStage: CaseStage.NOTIFIED, actedBy: "Blessings Kaunda", actedRole: UserRole.SUPERVISOR, notes: "Triage approved. Taxpayer notified of audit investigation.", timestamp: "2024-01-15T09:15:00Z" },
    { id: "h-2", caseId: "CASE-8829-2024", fromStage: CaseStage.NOTIFIED, toStage: CaseStage.PLANNING, actedBy: "Chikondi Phiri", actedRole: UserRole.AUDITOR, notes: "Initial engagement letter sent to taxpayer. Audit plan finalized and approved.", timestamp: "2024-02-15T11:20:00Z" },
    { id: "h-3", caseId: "CASE-8829-2024", fromStage: CaseStage.PLANNING, toStage: CaseStage.FIELDWORK, actedBy: "Yamikani Banda", actedRole: UserRole.ADMIN, notes: "Transition to fieldwork approved. Scope covers FY2023 payroll and VAT logs.", timestamp: "2024-02-28T14:32:11Z" },
    { id: "h-4", caseId: "A-2023-00452", fromStage: CaseStage.SELECTED, toStage: CaseStage.PLANNING, actedBy: "Blessings Kaunda", actedRole: UserRole.SUPERVISOR, notes: "Assigned Alexander Chikumba as Lead Auditor.", timestamp: "2024-01-20T10:00:00Z" },
    { id: "h-5", caseId: "A-2023-00452", fromStage: CaseStage.PLANNING, toStage: CaseStage.FIELDWORK, actedBy: "Alexander Chikumba", actedRole: UserRole.AUDITOR, notes: "Commenced site fieldwork.", timestamp: "2024-02-05T09:00:00Z" },
    { id: "h-6", caseId: "A-2023-00452", fromStage: CaseStage.FIELDWORK, toStage: CaseStage.REVIEW, actedBy: "Alexander Chikumba", actedRole: UserRole.AUDITOR, notes: "Fieldwork completed. Uploaded audit findings on foreign source revenue.", timestamp: "2024-06-15T14:30:00Z" }
  ];

  const documentRequests: DocumentRequest[] = [
    { id: "doc-1", caseId: "CASE-8829-2024", description: "FY2023 Payroll Ledger (Digital)", status: "RECEIVED", dueDate: "2024-03-15", requestedOn: "2024-03-01", actedBy: "Chikondi Phiri" },
    { id: "doc-2", caseId: "CASE-8829-2024", description: "Offshore Account Statements (Q3-Q4)", status: "PENDING", dueDate: "2024-03-20", requestedOn: "2024-03-05", actedBy: "Chikondi Phiri" },
    { id: "doc-3", caseId: "CASE-8829-2024", description: "Stock Inventory Verification Report", status: "RECEIVED", dueDate: "2024-03-25", requestedOn: "2024-03-10", actedBy: "Chikondi Phiri" }
  ];

  const evidenceDocuments: EvidenceDocument[] = [
    { id: "ev-1", caseId: "CASE-8829-2024", requestId: "doc-1", name: "FY23_Tax_Return_Amended.pdf", sha256: "3a2e7c9bfd4a11c121e78f81900cc22188fa642a81bc225110c78a01f81977e2", uploadedAt: "2024-03-03T09:15:45Z", verifiedBadge: true, fileSize: "2.4 MB", fileType: "PDF" },
    { id: "ev-2", caseId: "CASE-8829-2024", requestId: "doc-3", name: "Bank_Rec_Matrix_March.xlsx", sha256: "91bc7d8c52ea11e998bb3a1122114ac918fc33d1c92a6b2ea1f819000a112c32", uploadedAt: "2024-03-12T11:05:00Z", verifiedBadge: true, fileSize: "840 KB", fileType: "XLSX" },
    { id: "ev-3", caseId: "CASE-8829-2024", requestId: null, name: "Warehouse_Site_Visit_01.jpg", sha256: "7e4d9c7bb71239bfdeca00cc42a2251bc8bda6412190eeabff19877622aa00cc", uploadedAt: "2024-03-14T15:40:22Z", verifiedBadge: true, fileSize: "1.2 MB", fileType: "JPEG" }
  ];

  const findings: Finding[] = [
    { id: "FL-201", caseId: "CASE-8829-2024", description: "Unreconciled VAT Discrepancy: Significant mismatch identified between reported VAT inputs and bank statement flows for July-August 2023.", reportedBy: "Chikondi Phiri", amount: 485000.00, status: "Active", date: "2024-03-05" },
    { id: "FL-202", caseId: "CASE-8829-2024", description: "Missing Authorization Signatures: Multiple high-value capital expenditure entries lack required internal Board signatures.", reportedBy: "Chikondi Phiri", amount: 357000.00, status: "Active", date: "2024-03-14" },
    { id: "FL-301", caseId: "A-2023-00452", description: "Unreported Transfer Pricing Fees: Subsidized software royalty flows routed to offshore IP hubs without arm's length tax filing.", reportedBy: "Alexander Chikumba", amount: 14250000.00, status: "Confirmed", date: "2024-05-18" }
  ];

  const assessments: Assessment[] = [
    {
      id: "ass-1",
      caseId: "A-2023-00452",
      findingsRef: ["FL-301"],
      taxAmount: 10000000.00,
      penaltyAmount: 3000000.00,
      interestAmount: 1250000.00,
      totalAmount: 14250000.00,
      status: "PENDING_APPROVAL",
      createdAt: "2024-06-18T14:30:00Z"
    }
  ];

  const approvals: ApprovalRequest[] = [
    {
      id: "appreq-1",
      caseId: "A-2023-00452",
      entityType: "ASSESSMENT",
      entityId: "ass-1",
      requesterId: "u-3",
      requesterName: "Alexander Chikumba",
      requesterRole: UserRole.AUDITOR,
      reason: "Issuance of formal assessment of VAT and Transfer pricing liability adjustment",
      details: JSON.stringify({ tax: 10000000, penalty: 3000000, interest: 1250000, total: 14250000 }),
      status: "PENDING",
      submittedAt: "2024-06-18T14:32:00Z"
    },
    {
      id: "appreq-2",
      caseId: "CASE-8829-2024",
      entityType: "CASE_CLOSURE",
      entityId: "",
      requesterId: "u-2",
      requesterName: "Chikondi Phiri",
      requesterRole: UserRole.AUDITOR,
      reason: "Close case. Estate of J. Doe compliance resolved",
      details: JSON.stringify({ taxpayer: "Estate of J. Doe", taxTypes: ["Individual Income"] }),
      status: "APPROVED",
      submittedAt: "2024-06-10T09:00:00Z",
      decidedAt: "2024-06-11T14:22:00Z",
      decidedBy: "Blessings Kaunda",
      decisionNotes: "Approved. All assessments paid in full. Compliance verified for the current cycle. Final report attached."
    }
  ];

  const appeals: Appeal[] = [];

  const auditLog: AuditLogEntry[] = [
    { id: "log-1", caseId: "CASE-8829-2024", action: "CASE_STAGE_CHANGED", performedBy: "Blessings Kaunda", role: UserRole.SUPERVISOR, timestamp: "2024-01-15T09:15:00Z", ip: "10.12.32.4", details: "Changed stage to NOTIFIED" },
    { id: "log-2", caseId: "CASE-8829-2024", action: "DOCUMENT_REQUESTED", performedBy: "Chikondi Phiri", role: UserRole.AUDITOR, timestamp: "2024-03-01T10:00:00Z", ip: "10.12.32.18", details: "Requested 'FY2023 Payroll Ledger (Digital)'" },
    { id: "log-3", caseId: "CASE-8829-2024", action: "EVIDENCE_UPLOADED", performedBy: "Chikondi Phiri", role: UserRole.AUDITOR, timestamp: "2024-03-03T09:15:45Z", ip: "10.12.32.18", details: "Uploaded evidence file 'FY23_Tax_Return_Amended.pdf' with integrity SHA-256 validation badge." },
    { id: "log-4", caseId: "AUD-2024-0742", action: "FIELDWORK_NOTES_MODIFIED", performedBy: "Chikondi Phiri", role: UserRole.AUDITOR, timestamp: "2024-10-15T14:22:15Z", ip: "10.12.33.2", details: "Auditor Chikondi Phiri modified fieldwork notes: Added internal memo regarding subsidiary reconciliation discrepancies." },
    { id: "log-5", caseId: "A-2023-00452", action: "ASSESSMENT_DRAFT_UPLOADED", performedBy: "Alexander Chikumba", role: UserRole.AUDITOR, timestamp: "2024-10-15T11:05:42Z", ip: "10.12.34.8", details: "Lead Auditor Alexander Chikumba uploaded Assessment Draft. System-validated document integrity hash: 8f92a1...2c8e. Ready for supervisor sign-off." },
    { id: "log-6", caseId: "AUD-2024-1102", action: "SYSTEM_ALARM", performedBy: "Yamikani Banda", role: UserRole.ADMIN, timestamp: "2024-10-15T09:15:00Z", ip: "127.0.0.1", details: "System Admin Yamikani Banda flagged AUD-2024-1102 for SLA Violation (Triage exceeding 14-day delay)." }
  ];

  db = {
    users,
    taxpayers,
    riskAssessments,
    auditCases,
    caseStageHistory,
    documentRequests,
    evidenceDocuments,
    findings,
    assessments,
    approvals,
    appeals,
    auditLog,
    systemConfig: {
      mlPublicKeyId: "AKIA_PROD_9921_XJ",
      mlPrivateSecretKey: "mra_ml_sec_9918239841203984021389",
      inferenceGatewayUrl: "https://api-inference-v2.internal.ml.admin",
      modelStorageCluster: "s3://models-registry-us-east-1-prod",
      envVariables: [
        { key: "ML_CONCURRENCY_LIMIT", value: "128" },
        { key: "NODE_ENV", value: "production" },
        { key: "LOG_LEVEL", value: "warn" }
      ]
    }
  };

  ensureAppealsSeeded();
  saveToDb();
}

function ensureAppealsSeeded() {
  if (!db.appeals) {
    db.appeals = [];
  }
  
  const hasAppeals = db.appeals.some(a => a.id.includes("8901") || a.caseId === "LX-2024-0892");
  if (hasAppeals) return;

  console.log("Seeding Appeals and cases into database...");

  // Seed Taxpayers
  const newTaxpayers = [
    { tin: "TIN-8901-ACMS", name: "Mzuzu Agro-Traders Ltd", sector: "Asset Liquidation & Estate", taxTypes: ["Corporate Income Tax"], address: "89 Stadium Way, Lilongwe" },
    { tin: "TIN-9042-ACMS", name: "Apex Cloud Solutions", sector: "Cloud Computing & SaaS", taxTypes: ["VAT"], address: "42 Stratus Lane, Blantyre" },
    { tin: "TIN-7712-ACMS", name: "Blackwood Manufacturing", sector: "Heavy Industrial Production", taxTypes: ["VAT", "Excise"], address: "12 Industrial Ring Road, Zomba" },
    { tin: "TIN-8115-ACMS", name: "Shire Highlands Technologies Ltd", sector: "IP Licensing", taxTypes: ["Corporate Income Tax", "Withholding Tax"], address: "15 Streamfront Blvd, Mzuzu" },
    { tin: "TIN-9122-ACMS", name: "Sunbird Energy Malawi Ltd", sector: "Renewable Energy & Infrastructure", taxTypes: ["VAT"], address: "22 Solar Grid Path, Kasungu" },
    { tin: "TIN-990-112-X", name: "Kanjedza Trading Company Ltd", sector: "Mergers & Acquisitions", taxTypes: ["Corporate Income Tax"], address: "90 Capitals Tower, London Area" }
  ];

  for (const tp of newTaxpayers) {
    if (!db.taxpayers.some(t => t.tin === tp.tin)) {
      db.taxpayers.push(tp);
    }
  }

  // Seed Cases
  const newCases = [
    {
      id: "LX-2023-8901",
      tin: "TIN-8901-ACMS",
      taxpayerName: "Mzuzu Agro-Traders Ltd",
      stage: CaseStage.APPEAL,
      leadAuditorId: "u-3",
      leadAuditorName: "Alexander Chikumba",
      financialImpact: 1240000.00,
      auditType: "Corporate Income Tax Audit",
      createdAt: "2024-02-10",
      notes: "Appealed corporate asset liquidation tax valuation."
    },
    {
      id: "LX-2023-9042",
      tin: "TIN-9042-ACMS",
      taxpayerName: "Apex Cloud Solutions",
      stage: CaseStage.APPEAL,
      leadAuditorId: "u-2",
      leadAuditorName: "Chikondi Phiri",
      financialImpact: 542300.00,
      auditType: "Cloud Sales VAT Review",
      createdAt: "2024-03-12",
      notes: "Dispute over SaaS taxability status."
    },
    {
      id: "LX-2023-7712",
      tin: "TIN-7712-ACMS",
      taxpayerName: "Blackwood Manufacturing",
      stage: CaseStage.APPEAL,
      leadAuditorId: "u-2",
      leadAuditorName: "Chikondi Phiri",
      financialImpact: 3150000.00,
      auditType: "Manufacturing Capital Allowances",
      createdAt: "2024-01-20",
      notes: "Dispute regarding 100% capital write-offs in special zoning."
    },
    {
      id: "LX-2023-8115",
      tin: "TIN-8115-ACMS",
      taxpayerName: "Shire Highlands Technologies Ltd",
      stage: CaseStage.APPEAL,
      leadAuditorId: "u-3",
      leadAuditorName: "Alexander Chikumba",
      financialImpact: 125000.00,
      auditType: "IP Royalty Transfer Pricing",
      createdAt: "2024-02-18",
      notes: "OECD arm's length transfer pricing verification dispute."
    },
    {
      id: "LX-2023-9122",
      tin: "TIN-9122-ACMS",
      taxpayerName: "Sunbird Energy Malawi Ltd",
      stage: CaseStage.APPEAL,
      leadAuditorId: "u-3",
      leadAuditorName: "Alexander Chikumba",
      financialImpact: 980000.00,
      auditType: "Green Credit Validation",
      createdAt: "2024-04-05",
      notes: "Green tax credit dispute on date mismatch."
    },
    {
      id: "LX-2024-0892",
      tin: "TIN-990-112-X",
      taxpayerName: "Kanjedza Trading Company Ltd",
      stage: CaseStage.APPEAL,
      leadAuditorId: "u-3",
      leadAuditorName: "Alexander Chikumba",
      financialImpact: 14250000.00,
      auditType: "Asset Disposal Assessment",
      createdAt: "2024-05-10",
      notes: "Major Capital Gains asset valuation dispute. Assigned to Appeals Officer."
    }
  ];

  for (const cs of newCases) {
    if (!db.auditCases.some(c => c.id === cs.id)) {
      db.auditCases.unshift(cs);
    }
  }

  // Seed Findings for LX-2024-0892
  const newFindings = [
    {
      id: "FL-892-1",
      caseId: "LX-2024-0892",
      description: "Point 1: Undervaluation of Intangibles. Primary auditor determined that the market comparison used by the taxpayer failed to account for regional license premiums in the tech sector. Recommended adjustment: +£1.2M.",
      reportedBy: "Alexander Chikumba",
      amount: 10000000.00,
      status: "Active",
      date: "2024-05-18"
    },
    {
      id: "FL-892-2",
      caseId: "LX-2024-0892",
      description: "Point 2: Incomplete Audit Trail. Original filing lacked the detailed amortisation schedule for the 'GlobalStream' patent suite. Assessment was based on standard linear decay models.",
      reportedBy: "Alexander Chikumba",
      amount: 4250000.00,
      status: "Active",
      date: "2024-05-20"
    }
  ];

  for (const fd of newFindings) {
    if (!db.findings.some(f => f.id === fd.id)) {
      db.findings.push(fd);
    }
  }

  // Seed Evidence for LX-2024-0892
  const newEvidence = [
    {
      id: "ev-892-1",
      caseId: "LX-2024-0892",
      requestId: null,
      name: "Valuation_Report_Q4.pdf",
      sha256: "9b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c",
      uploadedAt: "2024-05-15T11:30:00Z",
      verifiedBadge: true,
      fileSize: "4.2 MB",
      fileType: "PDF"
    },
    {
      id: "ev-892-2",
      caseId: "LX-2024-0892",
      requestId: null,
      name: "Legal_Opinion_Counsel.docx",
      sha256: "1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b",
      uploadedAt: "2024-05-16T14:45:00Z",
      verifiedBadge: true,
      fileSize: "1.1 MB",
      fileType: "DOCX"
    }
  ];

  for (const ev of newEvidence) {
    if (!db.evidenceDocuments.some(e => e.id === ev.id)) {
      db.evidenceDocuments.push(ev);
    }
  }

  // Seed Appeals
  const newAppeals = [
    {
      id: "app-8901",
      caseId: "LX-2023-8901",
      assessmentId: "ass-8901",
      grounds: "Valuation of inventory during liquidation was over-assessed, ignoring fair market adjustments.",
      taxAmountDisputed: 1240000.00,
      status: "PENDING" as const,
      createdAt: "2024-02-15T09:00:00Z"
    },
    {
      id: "app-9042",
      caseId: "LX-2023-9042",
      assessmentId: "ass-9042",
      grounds: "SaaS licensing models were classified as traditional software sales, over-levying VAT.",
      taxAmountDisputed: 542300.00,
      status: "PENDING" as const,
      createdAt: "2024-03-15T10:30:00Z"
    },
    {
      id: "app-7712",
      caseId: "LX-2023-7712",
      assessmentId: "ass-7712",
      grounds: "The plant equipment qualifies for 100% first-year allowance under local industrial zoning rules.",
      taxAmountDisputed: 3150000.00,
      status: "PENDING" as const,
      createdAt: "2024-01-25T14:15:00Z"
    },
    {
      id: "app-8115",
      caseId: "LX-2023-8115",
      assessmentId: "ass-8115",
      grounds: "Intercompany royalty pricing is aligned with OECD transfer pricing guidelines.",
      taxAmountDisputed: 125000.00,
      status: "PENDING" as const,
      createdAt: "2024-02-22T11:00:00Z"
    },
    {
      id: "app-9122",
      caseId: "LX-2023-9122",
      assessmentId: "ass-9122",
      grounds: "Green tax credit was denied based on a clerical date mismatch on the filing certificate.",
      taxAmountDisputed: 980000.00,
      status: "PENDING" as const,
      createdAt: "2024-04-10T16:00:00Z"
    },
    {
      id: "app-0892",
      caseId: "LX-2024-0892",
      assessmentId: "ass-0892",
      grounds: "The taxpayer contests the valuation methodology applied to the disposal of intangible assets in FY23, claiming misapplication of Section 44(c) guidelines regarding amortized intellectual property valuation.",
      taxAmountDisputed: 14250000.00,
      status: "PENDING" as const,
      createdAt: "2024-05-12T10:00:00Z"
    }
  ];

  for (const ap of newAppeals) {
    if (!db.appeals.some(a => a.id === ap.id)) {
      db.appeals.push(ap);
    }
  }

  // Pre-seed some timeline history for these appeals
  const newTimelineEntries = [
    { id: `h-892-1`, caseId: "LX-2024-0892", fromStage: CaseStage.REVIEW, toStage: CaseStage.ASSESSED, actedBy: "Alexander Chikumba", actedRole: UserRole.SUPERVISOR, notes: "Tax assessment finalized and issued formally to taxpayer.", timestamp: "2024-05-10T09:00:00Z" },
    { id: `h-892-2`, caseId: "LX-2024-0892", fromStage: CaseStage.ASSESSED, toStage: CaseStage.APPEAL, actedBy: "Appeals Officer", actedRole: UserRole.LEGAL, notes: "Taxpayer lodged a formal appeal disputing the assessment on intangible asset valuation methodology. Case transitioned to APPEAL.", timestamp: "2024-05-12T10:00:00Z" }
  ];

  for (const tl of newTimelineEntries) {
    if (!db.caseStageHistory.some(h => h.id === tl.id)) {
      db.caseStageHistory.push(tl);
    }
  }

  saveToDb();
  console.log("Appeals seeded successfully!");
}

function loadDb() {
  if (fs.existsSync(DB_PATH)) {
    try {
      const content = fs.readFileSync(DB_PATH, "utf-8");
      db = JSON.parse(content);
      ensureAppealsSeeded();
      ensureSystemConfigSeeded();
    } catch (e) {
      console.error("Failed to parse db.json, re-seeding database...", e);
      seedDatabase();
    }
  } else {
    console.log("db.json not found, seeding...");
    seedDatabase();
  }
}

function ensureSystemConfigSeeded() {
  if (!db.systemConfig) {
    db.systemConfig = {
      mlPublicKeyId: "AKIA_PROD_9921_XJ",
      mlPrivateSecretKey: "mra_ml_sec_9918239841203984021389",
      inferenceGatewayUrl: "https://api-inference-v2.internal.ml.admin",
      modelStorageCluster: "s3://models-registry-us-east-1-prod",
      envVariables: [
        { key: "ML_CONCURRENCY_LIMIT", value: "128" },
        { key: "NODE_ENV", value: "production" },
        { key: "LOG_LEVEL", value: "warn" }
      ]
    };
    saveToDb();
  }
}

function saveToDb() {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save db.json", e);
  }
}

// Initial DB Load
loadDb();

// Active user session getter
function getActingUser(): User {
  const foundUser = currentUserSession.userId ? db.users.find(u => u.id === currentUserSession.userId) : null;
  return foundUser || {
    id: "system",
    name: "System",
    role: currentUserSession.activeRole || UserRole.SUPERVISOR,
    email: "system@mra.gov",
    active: true
  };
}

// Log a system action to compliance audit log
function logAction(action: string, caseId: string | undefined, details: string) {
  const user = getActingUser();
  const newLog: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    caseId,
    action,
    performedBy: user.name,
    role: currentUserSession.activeRole,
    timestamp: new Date().toISOString(),
    ip: "10.12.44.15", // simulation IP
    details
  };
  db.auditLog.unshift(newLog);
  saveToDb();
}

// Transition checking and gating state machine helper
function requestStageTransition(
  caseId: string, 
  toStage: CaseStage, 
  notes: string, 
  financialImpact: number = 0,
  auditType: string = ""
): { success: boolean; requiresApproval: boolean; approvalId?: string; message: string } {
  const auditCase = db.auditCases.find(c => c.id === caseId);
  if (!auditCase) {
    return { success: false, requiresApproval: false, message: "Case not found." };
  }

  const fromStage = auditCase.stage;
  const user = getActingUser();

  // Validate state transitions
  // Legal paths:
  // SELECTED -> PLANNING or REJECTED
  // REJECTED -> SELECTED (appealed or re-triaged)
  // NOTIFIED -> PLANNING
  // PLANNING -> FIELDWORK
  // FIELDWORK -> REVIEW
  // REVIEW -> ASSESSED or CLOSED (if no findings)
  // ASSESSED -> APPEAL or CLOSED
  // APPEAL -> CLOSED or REVIEW

  const allowedTransitions: Record<CaseStage, CaseStage[]> = {
    [CaseStage.SELECTED]: [CaseStage.PLANNING, CaseStage.REJECTED, CaseStage.NOTIFIED],
    [CaseStage.REJECTED]: [CaseStage.SELECTED],
    [CaseStage.NOTIFIED]: [CaseStage.PLANNING],
    [CaseStage.PLANNING]: [CaseStage.FIELDWORK],
    [CaseStage.FIELDWORK]: [CaseStage.REVIEW],
    [CaseStage.REVIEW]: [CaseStage.ASSESSED, CaseStage.CLOSED, CaseStage.FIELDWORK],
    [CaseStage.ASSESSED]: [CaseStage.APPEAL, CaseStage.CLOSED],
    [CaseStage.APPEAL]: [CaseStage.CLOSED, CaseStage.REVIEW],
    [CaseStage.CLOSED]: [] // Terminal
  };

  const isAllowed = allowedTransitions[fromStage]?.includes(toStage);
  if (!isAllowed && fromStage !== toStage) {
    return { success: false, requiresApproval: false, message: `Invalid transition from ${fromStage} to ${toStage}` };
  }

  // Gating of high-consequence transitions:
  // 1. Assessment issuance (REVIEW -> ASSESSED)
  // 2. Case closure (any -> CLOSED)
  // 3. Rejection at triage (SELECTED -> REJECTED)
  const highConsequence = 
    (fromStage === CaseStage.REVIEW && toStage === CaseStage.ASSESSED) ||
    toStage === CaseStage.CLOSED ||
    toStage === CaseStage.REJECTED;

  // Enforce NO self-approval: if they are the lead auditor for this case, they CANNOT self-approve/bypass direct transitions.
  const isLeadAuditorForCase = 
    (auditCase.leadAuditorId && auditCase.leadAuditorId === user.id) || 
    (auditCase.leadAuditorName && auditCase.leadAuditorName === user.name);

  // Supervisor or Admin can bypass if they are the direct acting user, UNLESS they are the lead auditor
  const needsSupervisorQueue = highConsequence && (
    (currentUserSession.activeRole !== UserRole.SUPERVISOR && currentUserSession.activeRole !== UserRole.ADMIN) ||
    isLeadAuditorForCase
  );

  if (needsSupervisorQueue) {
    // Check if there is already a pending approval for this case
    const existing = db.approvals.find(a => a.caseId === caseId && a.status === "PENDING" && a.entityType === (
      toStage === CaseStage.ASSESSED ? "ASSESSMENT" : 
      toStage === CaseStage.CLOSED ? "CASE_CLOSURE" : "CASE_REJECTION"
    ));

    if (existing) {
      return { 
        success: false, 
        requiresApproval: true, 
        approvalId: existing.id, 
        message: `An approval request is already pending for this transition.` 
      };
    }

    // Create Approval Queue request
    const typeMap = {
      [CaseStage.ASSESSED]: "ASSESSMENT" as const,
      [CaseStage.CLOSED]: "CASE_CLOSURE" as const,
      [CaseStage.REJECTED]: "CASE_REJECTION" as const,
    };
    const entityType = typeMap[toStage as keyof typeof typeMap] || "CASE_CLOSURE";

    // Create a mock assessment if none exists yet for review
    let entityId = "";
    if (entityType === "ASSESSMENT") {
      const activeFindings = db.findings.filter(f => f.caseId === caseId);
      const sum = activeFindings.reduce((s, f) => s + f.amount, 0);
      const newAssessment: Assessment = {
        id: `ass-${Date.now()}`,
        caseId,
        findingsRef: activeFindings.map(f => f.id),
        taxAmount: sum * 0.7,
        penaltyAmount: sum * 0.2,
        interestAmount: sum * 0.1,
        totalAmount: sum,
        status: "PENDING_APPROVAL",
        createdAt: new Date().toISOString()
      };
      db.assessments.push(newAssessment);
      entityId = newAssessment.id;
    }

    const appreqId = `appreq-${Date.now()}`;
    const newApproval: ApprovalRequest = {
      id: appreqId,
      caseId,
      entityType,
      entityId,
      requesterId: user.id,
      requesterName: user.name,
      requesterRole: currentUserSession.activeRole,
      reason: notes,
      details: JSON.stringify({ 
        fromStage, 
        toStage, 
        financialImpact: financialImpact || auditCase.financialImpact,
        auditType: auditType || auditCase.auditType
      }),
      status: "PENDING",
      submittedAt: new Date().toISOString()
    };

    db.approvals.unshift(newApproval);
    saveToDb();
    logAction("APPROVAL_REQUESTED", caseId, `Queued approval request for transition to ${toStage}. Reason: ${notes}`);

    return { 
      success: true, 
      requiresApproval: true, 
      approvalId: appreqId, 
      message: `Supervisor approval required. Transition request has been queued in the Approval Queue.` 
    };
  }

  // Bypass or authorized direct supervisor transition
  auditCase.stage = toStage;
  if (financialImpact) auditCase.financialImpact = financialImpact;
  if (auditType) auditCase.auditType = auditType;

  // Add Case Stage History
  const hist: CaseStageHistory = {
    id: `h-${Date.now()}`,
    caseId,
    fromStage,
    toStage,
    actedBy: user.name,
    actedRole: currentUserSession.activeRole,
    notes,
    timestamp: new Date().toISOString()
  };
  db.caseStageHistory.push(hist);

  logAction("CASE_STAGE_CHANGED", caseId, `Transitioned stage from ${fromStage} to ${toStage}. Notes: ${notes}`);
  saveToDb();

  return { 
    success: true, 
    requiresApproval: false, 
    message: `Transitioned stage from ${fromStage} to ${toStage} successfully.` 
  };
}

// ----------------------------------------
// API ENDPOINTS
// ----------------------------------------

// Endpoint to serve Alexander Chikumba's avatar directly
app.get(["/src/assets/images/alexander_chikumba_avatar_1783949039404.jpg", "/assets/images/alexander_chikumba_avatar_1783949039404.jpg"], (req, res) => {
  res.sendFile(path.join(process.cwd(), "src/assets/images/alexander_chikumba_avatar_1783949039404.jpg"));
});

// Auth Enpoints
app.get("/api/auth/me", (req, res) => {
  const user = currentUserSession.userId ? getActingUser() : null;
  res.json({
    user,
    activeRole: currentUserSession.activeRole,
    allUsers: db.users
  });
});

app.post("/api/auth/logout", (req, res) => {
  logAction("LOGOUT", undefined, "User logged out of governance terminal.");
  currentUserSession.userId = null;
  currentUserSession.activeRole = null;
  res.json({ success: true });
});

app.post("/api/auth/login", (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: "userId is required to login." });
  }
  const foundUser = db.users.find(u => u.id === userId);
  if (!foundUser) {
    return res.status(404).json({ error: "User not found." });
  }
  currentUserSession.userId = userId;
  currentUserSession.activeRole = foundUser.role;
  logAction("LOGIN", undefined, `Logged in as ${foundUser.name}`);
  res.json({ success: true, user: foundUser, activeRole: foundUser.role });
});

app.post("/api/auth/set-role", (req, res) => {
  const { userId, role } = req.body;
  if (userId) {
    const foundUser = db.users.find(u => u.id === userId);
    if (foundUser) {
      currentUserSession.userId = userId;
      currentUserSession.activeRole = role || foundUser.role;
      logAction("ROLE_SWITCHED", undefined, `Switched active role session to ${currentUserSession.activeRole}`);
      return res.json({ success: true, user: foundUser, activeRole: currentUserSession.activeRole });
    }
  }
  if (role) {
    currentUserSession.activeRole = role;
    logAction("ROLE_SWITCHED", undefined, `Switched active role to ${currentUserSession.activeRole}`);
    return res.json({ success: true, activeRole: currentUserSession.activeRole });
  }
  res.status(400).json({ error: "Invalid role switch parameters" });
});

// Taxpayer Endpoints
app.get("/api/taxpayers", (req, res) => {
  res.json(db.taxpayers);
});

// ML Risk Score Intake Service
app.post("/api/risk/intake", (req, res) => {
  const { tin, score, method, rawOutput, factors } = req.body;
  if (!tin || score === undefined) {
    return res.status(400).json({ error: "TIN and score are required fields." });
  }

  // Ensure taxpayer exists
  let taxpayer = db.taxpayers.find(t => t.tin === tin);
  if (!taxpayer) {
    // Auto register a placeholder taxpayer name
    taxpayer = {
      tin,
      name: `Unknown Taxpayer (${tin})`,
      sector: "General Commerce",
      taxTypes: ["VAT"],
      address: "Unregistered Address"
    };
    db.taxpayers.push(taxpayer);
  }

  const newRisk: RiskAssessment = {
    id: `risk-${Date.now()}`,
    tin,
    score: Number(score),
    method: method || "API Intake Manual Post",
    selectionDate: new Date().toISOString().split("T")[0],
    rawOutput: rawOutput || JSON.stringify({ source: "API Intake Post", score }),
    factors: factors || [{ name: "Integrate Risk Signal", percentage: score }]
  };

  db.riskAssessments.unshift(newRisk);

  // Core SLA rule: Auto-open case if risk score is above a threshold of 85
  let caseCreated = false;
  let createdCaseId = "";
  if (Number(score) >= 85) {
    // Check if case already exists
    const existingCase = db.auditCases.find(c => c.tin === tin && c.stage !== CaseStage.CLOSED && c.stage !== CaseStage.REJECTED);
    if (!existingCase) {
      const newCaseId = `CASE-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
      const newCase: AuditCase = {
        id: newCaseId,
        tin,
        taxpayerName: taxpayer.name,
        stage: CaseStage.SELECTED,
        leadAuditorId: null,
        leadAuditorName: null,
        financialImpact: 0,
        auditType: "Risk-Engine Auto Selected VAT Review",
        createdAt: new Date().toISOString().split("T")[0],
        notes: `Auto-opened audit case because ML risk scoring exceeded critical threshold (Score: ${score}, Engine: ${method}).`
      };
      db.auditCases.unshift(newCase);
      createdCaseId = newCaseId;
      caseCreated = true;

      // Stage history log
      db.caseStageHistory.push({
        id: `h-${Date.now()}`,
        caseId: newCaseId,
        fromStage: CaseStage.SELECTED,
        toStage: CaseStage.SELECTED,
        actedBy: "Risk-Scoring Engine",
        actedRole: UserRole.ADMIN,
        notes: "Automated core-threshold case creation",
        timestamp: new Date().toISOString()
      });

      logAction("CASE_AUTO_OPENED", newCaseId, `Case auto-opened by intake score of ${score} (threshold >= 85).`);
    }
  }

  saveToDb();

  res.json({
    success: true,
    riskAssessment: newRisk,
    caseCreated,
    createdCaseId,
    message: caseCreated 
      ? `Risk score registered. Audit case ${createdCaseId} has been AUTO-OPENED for triage as score ${score} exceeds safety threshold (85).`
      : `Risk score registered successfully.`
  });
});

// Cases Endpoints
app.get("/api/cases", (req, res) => {
  res.json(db.auditCases);
});

app.get("/api/findings", (req, res) => {
  res.json(db.findings);
});

app.get("/api/evidence", (req, res) => {
  res.json(db.evidenceDocuments);
});

app.get("/api/cases/:id", (req, res) => {
  const c = db.auditCases.find(ca => ca.id === req.params.id);
  if (!c) return res.status(404).json({ error: "Case not found" });

  const history = db.caseStageHistory.filter(h => h.caseId === c.id);
  const documents = db.documentRequests.filter(d => d.caseId === c.id);
  const evidence = db.evidenceDocuments.filter(e => e.caseId === c.id);
  const findingsList = db.findings.filter(f => f.caseId === c.id);
  const caseAssessments = db.assessments.filter(a => a.caseId === c.id);
  const activeApproval = db.approvals.find(a => a.caseId === c.id && a.status === "PENDING");
  const taxpayer = db.taxpayers.find(t => t.tin === c.tin);
  const appeal = db.appeals.find(a => a.caseId === c.id);

  res.json({
    ...c,
    taxpayer,
    history,
    documents,
    evidence,
    findings: findingsList,
    assessments: caseAssessments,
    activeApproval,
    appeal
  });
});

// Transition stage of case
app.post("/api/cases/:id/stage", (req, res) => {
  const { toStage, notes, financialImpact, auditType } = req.body;
  if (!toStage) return res.status(400).json({ error: "toStage is required" });

  const result = requestStageTransition(req.params.id, toStage, notes, financialImpact, auditType);
  res.json(result);
});

// Create Manual Audit Case
app.post("/api/cases", (req, res) => {
  const { tin, auditType, notes, leadAuditorId, financialImpact } = req.body;
  if (!tin || !auditType) return res.status(400).json({ error: "TIN and Audit Type are required" });

  const taxpayer = db.taxpayers.find(t => t.tin === tin);
  if (!taxpayer) return res.status(404).json({ error: "Taxpayer TIN not registered." });

  const caseId = `AUD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  
  let auditorName: string | null = null;
  if (leadAuditorId) {
    const auditor = db.users.find(u => u.id === leadAuditorId);
    if (auditor) auditorName = auditor.name;
  }

  const newCase: AuditCase = {
    id: caseId,
    tin,
    taxpayerName: taxpayer.name,
    stage: CaseStage.SELECTED,
    leadAuditorId: leadAuditorId || null,
    leadAuditorName: auditorName,
    financialImpact: financialImpact ? Number(financialImpact) : 0,
    auditType,
    createdAt: new Date().toISOString().split("T")[0],
    notes: notes || "Manually initiated case."
  };

  db.auditCases.unshift(newCase);

  // Log stage history
  db.caseStageHistory.push({
    id: `h-${Date.now()}`,
    caseId,
    fromStage: CaseStage.SELECTED,
    toStage: CaseStage.SELECTED,
    actedBy: getActingUser().name,
    actedRole: currentUserSession.activeRole,
    notes: "Case record initiated",
    timestamp: new Date().toISOString()
  });

  logAction("CASE_CREATED", caseId, `Manually created case for taxpayer ${taxpayer.name} (${tin}).`);
  saveToDb();

  res.json({ success: true, caseId, case: newCase });
});

// Assign lead auditor
app.post("/api/cases/:id/assign", (req, res) => {
  const { auditorId } = req.body;
  if (!auditorId) return res.status(400).json({ error: "auditorId is required" });

  const auditCase = db.auditCases.find(c => c.id === req.params.id);
  if (!auditCase) return res.status(404).json({ error: "Case not found" });

  const auditor = db.users.find(u => u.id === auditorId);
  if (!auditor) return res.status(404).json({ error: "Auditor not found" });

  auditCase.leadAuditorId = auditor.id;
  auditCase.leadAuditorName = auditor.name;

  // Auto transition to PLANNING if assigned from SELECTED
  if (auditCase.stage === CaseStage.SELECTED) {
    auditCase.stage = CaseStage.NOTIFIED; // notify first, then plan
    db.caseStageHistory.push({
      id: `h-${Date.now()}`,
      caseId: auditCase.id,
      fromStage: CaseStage.SELECTED,
      toStage: CaseStage.NOTIFIED,
      actedBy: getActingUser().name,
      actedRole: currentUserSession.activeRole,
      notes: `Assigned Lead Auditor: ${auditor.name}. Automatically moved case to NOTIFIED stage.`,
      timestamp: new Date().toISOString()
    });
  } else {
    logAction("AUDITOR_ASSIGNED", auditCase.id, `Assigned lead auditor ${auditor.name}`);
  }

  saveToDb();
  res.json({ success: true, case: auditCase });
});

// Documents Request Endpoints
app.post("/api/cases/:id/documents", (req, res) => {
  const { description, dueDate } = req.body;
  if (!description || !dueDate) return res.status(400).json({ error: "description and dueDate are required" });

  const auditCase = db.auditCases.find(c => c.id === req.params.id);
  if (!auditCase) return res.status(404).json({ error: "Case not found" });

  const newReq: DocumentRequest = {
    id: `doc-${Date.now()}`,
    caseId: auditCase.id,
    description,
    status: "PENDING",
    dueDate,
    requestedOn: new Date().toISOString().split("T")[0],
    actedBy: getActingUser().name
  };

  db.documentRequests.push(newReq);
  logAction("DOCUMENT_REQUESTED", auditCase.id, `Requested document: '${description}', due ${dueDate}`);
  saveToDb();

  res.json({ success: true, documentRequest: newReq });
});

app.post("/api/cases/:id/documents/:docId/status", (req, res) => {
  const { status } = req.body;
  const docReq = db.documentRequests.find(d => d.id === req.params.docId && d.caseId === req.params.id);
  if (!docReq) return res.status(404).json({ error: "Document request not found" });

  docReq.status = status;
  logAction("DOCUMENT_STATUS_UPDATED", req.params.id, `Updated document request status to ${status} for '${docReq.description}'`);
  saveToDb();

  res.json({ success: true, documentRequest: docReq });
});

// Evidence Vault - Mock upload
app.post("/api/cases/:id/evidence/upload", (req, res) => {
  const { name, requestId, fileSize, fileType } = req.body;
  if (!name) return res.status(400).json({ error: "File name is required" });

  const auditCase = db.auditCases.find(c => c.id === req.params.id);
  if (!auditCase) return res.status(404).json({ error: "Case not found" });

  // Compute a random mock SHA256
  const characters = '0123456789abcdef';
  let sha = '';
  for (let i = 0; i < 64; i++) {
    sha += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  const newDoc: EvidenceDocument = {
    id: `ev-${Date.now()}`,
    caseId: auditCase.id,
    requestId: requestId || null,
    name,
    sha256: sha,
    uploadedAt: new Date().toISOString(),
    verifiedBadge: true, // Auto badge as authentic
    fileSize: fileSize || "1.2 MB",
    fileType: fileType || "PDF"
  };

  db.evidenceDocuments.push(newDoc);

  // If uploaded against a request, auto mark that request as RECEIVED
  if (requestId) {
    const docReq = db.documentRequests.find(d => d.id === requestId);
    if (docReq) {
      docReq.status = "RECEIVED";
    }
  }

  // Create timeline history
  db.caseStageHistory.push({
    id: `h-${Date.now()}`,
    caseId: auditCase.id,
    fromStage: auditCase.stage,
    toStage: auditCase.stage,
    actedBy: getActingUser().name,
    actedRole: currentUserSession.activeRole,
    notes: `Evidence Document Uploaded: ${name} (SHA-256 integrity hash generated).`,
    timestamp: new Date().toISOString()
  });

  logAction("EVIDENCE_UPLOADED", auditCase.id, `Uploaded evidence document '${name}' with integrity hash verification.`);
  saveToDb();

  res.json({ success: true, evidence: newDoc });
});

// Findings Log Endpoints
app.post("/api/cases/:id/findings", (req, res) => {
  const { description, amount } = req.body;
  if (!description || amount === undefined) return res.status(400).json({ error: "description and amount are required" });

  const auditCase = db.auditCases.find(c => c.id === req.params.id);
  if (!auditCase) return res.status(404).json({ error: "Case not found" });

  const findingId = `FL-${Math.floor(200 + Math.random() * 800)}`;
  const newFinding: Finding = {
    id: findingId,
    caseId: auditCase.id,
    description,
    reportedBy: getActingUser().name,
    amount: Number(amount),
    status: "Active",
    date: new Date().toISOString().split("T")[0]
  };

  db.findings.push(newFinding);

  // Update audit case's financial impact by summing all active findings
  const caseFindings = db.findings.filter(f => f.caseId === auditCase.id);
  auditCase.financialImpact = caseFindings.reduce((sum, f) => sum + f.amount, 0);

  logAction("FINDING_LOGGED", auditCase.id, `Logged finding ${findingId} for amount of MWK ${newFinding.amount.toLocaleString()}. Description: ${description}`);
  saveToDb();

  res.json({ success: true, finding: newFinding, case: auditCase });
});

// Edit Finding
app.put("/api/cases/:id/findings/:findingId", (req, res) => {
  const { description, amount } = req.body;
  const finding = db.findings.find(f => f.id === req.params.findingId && f.caseId === req.params.id);
  if (!finding) return res.status(404).json({ error: "Finding not found" });

  if (description) finding.description = description;
  if (amount !== undefined) finding.amount = Number(amount);

  // Re-sum financial impact
  const auditCase = db.auditCases.find(c => c.id === req.params.id);
  if (auditCase) {
    const caseFindings = db.findings.filter(f => f.caseId === auditCase.id);
    auditCase.financialImpact = caseFindings.reduce((sum, f) => sum + f.amount, 0);
  }

  logAction("FINDING_UPDATED", req.params.id, `Updated finding ${finding.id} with amount MWK ${finding.amount.toLocaleString()}`);
  saveToDb();

  res.json({ success: true, finding });
});

// Create and queue assessment (for Supervisor / Auditor flow)
app.post("/api/cases/:id/assessment", (req, res) => {
  const { taxAmount, penaltyAmount, interestAmount, findingsRef, notes } = req.body;
  if (!taxAmount || !findingsRef) return res.status(400).json({ error: "taxAmount and findingsRef are required" });

  const auditCase = db.auditCases.find(c => c.id === req.params.id);
  if (!auditCase) return res.status(404).json({ error: "Case not found" });

  const total = Number(taxAmount) + Number(penaltyAmount || 0) + Number(interestAmount || 0);

  const newAss: Assessment = {
    id: `ass-${Date.now()}`,
    caseId: auditCase.id,
    findingsRef,
    taxAmount: Number(taxAmount),
    penaltyAmount: Number(penaltyAmount || 0),
    interestAmount: Number(interestAmount || 0),
    totalAmount: total,
    status: "PENDING_APPROVAL",
    createdAt: new Date().toISOString()
  };

  db.assessments.push(newAss);
  saveToDb();

  // Prompt state machine transition review to assessed (requires approval)
  const result = requestStageTransition(auditCase.id, CaseStage.ASSESSED, notes || "Issuing formal assessment based on fieldwork findings", total);
  res.json({ success: true, assessment: newAss, transitionResult: result });
});

// Approvals Queue Endpoints
app.get("/api/approvals", (req, res) => {
  res.json(db.approvals);
});

// Decision making in Approval Queue
app.post("/api/approvals/:id/decide", (req, res) => {
  const { decision, decisionNotes } = req.body; // 'APPROVED' or 'REJECTED'
  if (!decision) return res.status(400).json({ error: "decision is required ('APPROVED' or 'REJECTED')" });

  const appReq = db.approvals.find(a => a.id === req.params.id);
  if (!appReq) return res.status(404).json({ error: "Approval request not found." });

  // Only Supervisor or Admin can approve/reject
  if (currentUserSession.activeRole !== UserRole.SUPERVISOR && currentUserSession.activeRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Unauthorized. Role-based access control gates decision authorization." });
  }

  // Find target Case
  const auditCase = db.auditCases.find(c => c.id === appReq.caseId);
  if (!auditCase) return res.status(404).json({ error: "Case target of approval not found" });

  const user = getActingUser();

  // Self-approval restriction: Cannot approve their own case for assessment issuance, closure, or rejection (no self-approval)
  const isSelfApproval = 
    appReq.requesterId === user.id || 
    (auditCase.leadAuditorId && auditCase.leadAuditorId === user.id) || 
    (auditCase.leadAuditorName && auditCase.leadAuditorName === user.name);

  if (isSelfApproval) {
    return res.status(403).json({ 
      error: "Self-Approval Violation: You are assigned as the Lead Auditor of this case or the original requester of this action. You cannot authorize or approve/reject your own case transitions." 
    });
  }

  appReq.status = decision;
  appReq.decidedAt = new Date().toISOString();
  appReq.decidedBy = user.name;
  appReq.decisionNotes = decisionNotes;

  const parsedDetails = JSON.parse(appReq.details || "{}");
  const previousStage = auditCase.stage;

  if (decision === "APPROVED") {
    // Stage updates based on action type
    if (appReq.entityType === "ASSESSMENT") {
      auditCase.stage = CaseStage.ASSESSED;
      // Mark assessment as APPROVED
      if (appReq.entityId) {
        const ass = db.assessments.find(a => a.id === appReq.entityId);
        if (ass) {
          ass.status = "APPROVED";
          ass.decidedBy = user.name;
          ass.supervisorNotes = decisionNotes;
        }
      }
    } else if (appReq.entityType === "CASE_CLOSURE") {
      auditCase.stage = CaseStage.CLOSED;
    } else if (appReq.entityType === "CASE_REJECTION") {
      auditCase.stage = CaseStage.REJECTED;
    }

    // Add History Timeline transition log
    db.caseStageHistory.push({
      id: `h-${Date.now()}`,
      caseId: auditCase.id,
      fromStage: previousStage,
      toStage: auditCase.stage,
      actedBy: user.name,
      actedRole: currentUserSession.activeRole,
      notes: `Supervisor Sign-off: Request APPROVED. ${decisionNotes || ""}`,
      timestamp: new Date().toISOString()
    });

    logAction("APPROVAL_DECISION", auditCase.id, `Supervisor approved '${appReq.entityType}'. Target stage: ${auditCase.stage}. Notes: ${decisionNotes}`);
  } else {
    // REJECTED holds case at previous/review/triage stage
    if (appReq.entityType === "ASSESSMENT" && appReq.entityId) {
      const ass = db.assessments.find(a => a.id === appReq.entityId);
      if (ass) {
        ass.status = "REJECTED";
        ass.decidedBy = user.name;
        ass.supervisorNotes = decisionNotes;
      }
    }

    // Timeline warning log
    db.caseStageHistory.push({
      id: `h-${Date.now()}`,
      caseId: auditCase.id,
      fromStage: auditCase.stage,
      toStage: auditCase.stage,
      actedBy: user.name,
      actedRole: currentUserSession.activeRole,
      notes: `Supervisor Sign-off: Request REJECTED. Case returned to workflow loop. Reason: ${decisionNotes}`,
      timestamp: new Date().toISOString()
    });

    logAction("APPROVAL_DECISION", auditCase.id, `Supervisor rejected '${appReq.entityType}' transition. Case remains in ${auditCase.stage}. Reason: ${decisionNotes}`);
  }

  saveToDb();
  res.json({ success: true, approvalRequest: appReq, case: auditCase });
});

// Appeals Endpoints
app.get("/api/appeals", (req, res) => {
  res.json(db.appeals);
});

app.post("/api/appeals", (req, res) => {
  const { caseId, assessmentId, grounds, taxAmountDisputed } = req.body;
  if (!caseId || !assessmentId || !grounds) return res.status(400).json({ error: "caseId, assessmentId and grounds are required" });

  const auditCase = db.auditCases.find(c => c.id === caseId);
  if (!auditCase) return res.status(404).json({ error: "Case not found" });

  // Move case to APPEAL stage
  const prev = auditCase.stage;
  auditCase.stage = CaseStage.APPEAL;

  const newAppeal: Appeal = {
    id: `app-${Date.now()}`,
    caseId,
    assessmentId,
    grounds,
    taxAmountDisputed: Number(taxAmountDisputed || auditCase.financialImpact),
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  db.appeals.push(newAppeal);

  // Timeline entry
  db.caseStageHistory.push({
    id: `h-${Date.now()}`,
    caseId: auditCase.id,
    fromStage: prev,
    toStage: CaseStage.APPEAL,
    actedBy: getActingUser().name,
    actedRole: currentUserSession.activeRole,
    notes: `Taxpayer lodged formal dispute. Case transitioned to APPEAL. Grounds: ${grounds}`,
    timestamp: new Date().toISOString()
  });

  logAction("APPEAL_LODGED", caseId, `Taxpayer lodged formal appeal against assessment ${assessmentId} for disputed tax of MWK ${newAppeal.taxAmountDisputed.toLocaleString()}.`);
  saveToDb();

  res.json({ success: true, appeal: newAppeal, case: auditCase });
});

app.post("/api/appeals/:id/decide", (req, res) => {
  const { outcome, resolverNotes } = req.body; // UPHELD, REDUCED, DISMISSED, WITHDRAWN
  if (!outcome) return res.status(400).json({ error: "outcome is required" });

  const appeal = db.appeals.find(a => a.id === req.params.id);
  if (!appeal) return res.status(404).json({ error: "Appeal not found" });

  if (currentUserSession.activeRole !== UserRole.LEGAL && currentUserSession.activeRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Unauthorized. Appeals require Legal/Appeals Officer permissions." });
  }

  const user = getActingUser();
  appeal.status = outcome;
  appeal.resolvedAt = new Date().toISOString();
  appeal.resolverNotes = resolverNotes;
  appeal.resolverName = user.name;

  // Resolve target Case stage
  const auditCase = db.auditCases.find(c => c.id === appeal.caseId);
  if (auditCase) {
    const prev = auditCase.stage;
    
    // Automatically transition to CLOSED if appeal resolved or dismissed
    auditCase.stage = CaseStage.CLOSED;

    // Timeline entry
    db.caseStageHistory.push({
      id: `h-${Date.now()}`,
      caseId: auditCase.id,
      fromStage: prev,
      toStage: CaseStage.CLOSED,
      actedBy: user.name,
      actedRole: currentUserSession.activeRole,
      notes: `Appeal Resolved with outcome: ${outcome}. Case closed. Notes: ${resolverNotes}`,
      timestamp: new Date().toISOString()
    });

    logAction("APPEAL_RESOLVED", auditCase.id, `Appeal resolved. Outcome: ${outcome}. Case transitioned to CLOSED.`);
  }

  saveToDb();
  res.json({ success: true, appeal, case: auditCase });
});

// Admin Secrets Management Endpoints
app.get("/api/admin/secrets", (req, res) => {
  if (currentUserSession.activeRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Unauthorized. Config & Secrets management is restricted to the System Administrator." });
  }
  if (!db.systemConfig) {
    db.systemConfig = {
      mlPublicKeyId: "AKIA_PROD_9921_XJ",
      mlPrivateSecretKey: "mra_ml_sec_9918239841203984021389",
      inferenceGatewayUrl: "https://api-inference-v2.internal.ml.admin",
      modelStorageCluster: "s3://models-registry-us-east-1-prod",
      envVariables: [
        { key: "ML_CONCURRENCY_LIMIT", value: "128" },
        { key: "NODE_ENV", value: "production" },
        { key: "LOG_LEVEL", value: "warn" }
      ]
    };
    saveToDb();
  }
  res.json(db.systemConfig);
});

app.post("/api/admin/secrets", (req, res) => {
  if (currentUserSession.activeRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Unauthorized. Config & Secrets management is restricted to the System Administrator." });
  }
  const { mlPublicKeyId, mlPrivateSecretKey, inferenceGatewayUrl, modelStorageCluster, envVariables } = req.body;
  
  db.systemConfig = {
    mlPublicKeyId: mlPublicKeyId || "AKIA_PROD_9921_XJ",
    mlPrivateSecretKey: mlPrivateSecretKey || "mra_ml_sec_9918239841203984021389",
    inferenceGatewayUrl: inferenceGatewayUrl || "https://api-inference-v2.internal.ml.admin",
    modelStorageCluster: modelStorageCluster || "s3://models-registry-us-east-1-prod",
    envVariables: envVariables || []
  };

  logAction("CONFIG_UPDATED", undefined, `Updated API Secrets & Infrastructure configurations. publicId: ${mlPublicKeyId}`);
  saveToDb();
  res.json({ success: true, systemConfig: db.systemConfig });
});

// Admin User Management Endpoints
app.get("/api/admin/users", (req, res) => {
  if (currentUserSession.activeRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Unauthorized. User Management is restricted to the System Administrator." });
  }
  res.json(db.users);
});

app.post("/api/admin/users", (req, res) => {
  if (currentUserSession.activeRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Unauthorized. User Management is restricted to the System Administrator." });
  }
  const { name, email, role } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: "Name, email and role are required." });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: "A user with this email already exists." });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    name,
    email,
    role: role as UserRole,
    active: true
  };

  db.users.push(newUser);
  logAction("USER_CREATED", undefined, `Created user account "${name}" with role ${role}.`);
  saveToDb();
  res.json({ success: true, user: newUser });
});

app.put("/api/admin/users/:id", (req, res) => {
  if (currentUserSession.activeRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Unauthorized. User Management is restricted to the System Administrator." });
  }
  const { name, email, role, active } = req.body;
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: "User not found." });
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role as UserRole;
  if (active !== undefined) user.active = active;

  logAction("USER_UPDATED", undefined, `Updated user account "${user.name}". Role: ${user.role}, Active: ${user.active}`);
  saveToDb();
  res.json({ success: true, user });
});

app.post("/api/admin/users/bulk", (req, res) => {
  if (currentUserSession.activeRole !== UserRole.ADMIN) {
    return res.status(403).json({ error: "Unauthorized. User Management is restricted to the System Administrator." });
  }
  const { userIds, action, role } = req.body; // action: 'deactivate' | 'activate' | 'assign-role'
  if (!userIds || !Array.isArray(userIds)) {
    return res.status(400).json({ error: "userIds array is required." });
  }

  let count = 0;
  userIds.forEach(id => {
    const user = db.users.find(u => u.id === id);
    if (user) {
      if (action === "deactivate") {
        user.active = false;
        count++;
      } else if (action === "activate") {
        user.active = true;
        count++;
      } else if (action === "assign-role" && role) {
        user.role = role as UserRole;
        count++;
      }
    }
  });

  logAction("USER_BULK_ACTION", undefined, `Executed bulk action "${action}" on ${count} user accounts.`);
  saveToDb();
  res.json({ success: true, updatedCount: count });
});

// Global Compliance Audit Logs
app.get("/api/audit-logs", (req, res) => {
  res.json(db.auditLog);
});

// Gemini AI-Powered Risk scoring analysis (External simulated service on-demand)
app.post("/api/gemini/analyze-taxpayer", async (req, res) => {
  const { tin, name, sector, annualTurnover, suspiciousIndicators } = req.body;
  if (!tin || !name) {
    return res.status(400).json({ error: "Taxpayer TIN and Name are required" });
  }

  if (!ai) {
    // Fallback if key missing
    const randScore = Math.floor(60 + Math.random() * 38);
    const mockOutput = {
      request_id: `REQ-${Math.floor(1000+Math.random()*9000)}-GEM`,
      timestamp: new Date().toISOString(),
      model_signature: "gemini_cognitive_sim_v1.0",
      features: {
        industry_deviation_ratio: 0.82,
        unusual_exempt_transactions: 0.74,
        round_number_amounts: 0.65
      },
      probabilities: {
        evasion: randScore / 100,
        clerical_error: (100 - randScore) / 100
      },
      explanation: `Gemini Fallback Simulation Mode: Identified abnormal input claims in the ${sector || "unspecified"} sector. Frequent high-value transactions matching rounding-pattern filters.`
    };

    return res.json({
      score: randScore,
      method: "Gemini AI Risk Engine",
      rawOutput: JSON.stringify(mockOutput, null, 2),
      factors: [
        { name: "Industry Profit Margin Deviation", percentage: Math.floor(randScore * 0.9) },
        { name: "Round Invoice Patterns", percentage: Math.floor(randScore * 0.7) },
        { name: "SLA / Filing Delinquency", percentage: Math.floor(randScore * 0.4) }
      ],
      warning: "No active GEMINI_API_KEY detected in workspace environment. Fallback statistical simulation generated."
    });
  }

  try {
    const prompt = `Analyze the following taxpayer profile for risk of tax/VAT evasion and generate a structured JSON audit risk report.
Taxpayer Detail:
- TIN: ${tin}
- Name: ${name}
- Sector: ${sector || "Retail"}
- Annual Turnover Estimate: ${annualTurnover || "MWK 5,000,000"}
- Suspicious Indicators reported: ${suspiciousIndicators || "Frequent inter-company loan flows, possible underreported offshore software licensing royalties."}

Calculate:
1. Overall Risk Score: A single integer between 0 and 100 representing tax evasion risk probability. Make it above 85 if there are significant offshore/unreconciled indicators.
2. In-depth statistical explanation: 2-3 sentences explaining the core pattern (e.g. Benford's Law deviation, VAT gap analysis, graphs).
3. Primary risk factors (up to 3) with an estimated percentage contribution.
4. Simulated model raw parameters (with features weights).

Generate the response strictly as valid JSON matching this schema:
{
  "score": number,
  "method": "Gemini AI Audit Intelligence",
  "rawOutput": string, // This string must be a fully detailed inner JSON string representing ML-model raw performance metrics, variables, and explanation.
  "factors": [
    { "name": "Factor description", "percentage": number }
  ]
}
Ensure the "rawOutput" is a valid string representation of a JSON object. Return nothing but the JSON itself.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["score", "method", "rawOutput", "factors"],
          properties: {
            score: { type: Type.INTEGER, description: "Risk Score between 0 and 100" },
            method: { type: Type.STRING },
            rawOutput: { type: Type.STRING, description: "Inner JSON string representation of the ML model outputs" },
            factors: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["name", "percentage"],
                properties: {
                  name: { type: Type.STRING },
                  percentage: { type: Type.INTEGER }
                }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text?.trim() || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Gemini risk analysis call failed:", error);
    res.status(500).json({ error: "Gemini analysis error: " + error.message });
  }
});

// Setup Vite & Static Assets
async function startServer() {
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
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
