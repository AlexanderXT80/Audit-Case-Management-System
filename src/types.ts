export enum UserRole {
  AUDITOR = "AUDITOR",
  SUPERVISOR = "SUPERVISOR",
  LEGAL = "LEGAL",
  ADMIN = "ADMIN"
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  active: boolean;
  email: string;
  avatarUrl?: string;
}

export interface Taxpayer {
  tin: string;
  name: string;
  sector: string;
  taxTypes: string[];
  address: string;
}

export interface RiskAssessment {
  id: string;
  tin: string;
  score: number;
  method: string;
  selectionDate: string;
  rawOutput: string; // JSON string of ML model raw output
  factors: { name: string; percentage: number }[];
}

export enum CaseStage {
  SELECTED = "SELECTED", // Triage stage
  REJECTED = "REJECTED", // Case rejected at triage
  NOTIFIED = "NOTIFIED", // Taxpayer notified of audit
  PLANNING = "PLANNING", // Audit plan being compiled
  FIELDWORK = "FIELDWORK", // Active audit fieldwork
  REVIEW = "REVIEW", // Supervisor review
  ASSESSED = "ASSESSED", // Assessment issued
  APPEAL = "APPEAL", // Dispute lodge by taxpayer
  CLOSED = "CLOSED" // Case closed
}

export interface AuditCase {
  id: string; // e.g. CASE-8829-2024
  tin: string;
  taxpayerName: string; // denormalized for UI ease
  stage: CaseStage;
  leadAuditorId: string | null;
  leadAuditorName: string | null;
  financialImpact: number;
  auditType: string;
  createdAt: string;
  notes: string;
}

export interface CaseStageHistory {
  id: string;
  caseId: string;
  fromStage: CaseStage;
  toStage: CaseStage;
  actedBy: string;
  actedRole: UserRole;
  notes: string;
  timestamp: string;
}

export type DocumentStatus = "PENDING" | "RECEIVED";

export interface DocumentRequest {
  id: string;
  caseId: string;
  description: string;
  status: DocumentStatus;
  dueDate: string;
  requestedOn: string;
  actedBy: string;
}

export interface EvidenceDocument {
  id: string;
  caseId: string;
  requestId: string | null;
  name: string;
  sha256: string;
  uploadedAt: string;
  verifiedBadge: boolean;
  fileSize: string;
  fileType: string;
}

export interface Finding {
  id: string; // e.g. FL-201
  caseId: string;
  description: string;
  reportedBy: string;
  amount: number;
  status: string;
  date: string;
}

export interface Assessment {
  id: string;
  caseId: string;
  findingsRef: string[]; // finding IDs
  taxAmount: number;
  penaltyAmount: number;
  interestAmount: number;
  totalAmount: number;
  status: "PENDING_APPROVAL" | "APPROVED" | "REJECTED";
  createdAt: string;
  supervisorNotes?: string;
  decidedBy?: string;
}

export interface ApprovalRequest {
  id: string;
  caseId: string;
  entityType: "ASSESSMENT" | "CASE_CLOSURE" | "CASE_REJECTION";
  entityId: string; // e.g. assessmentId, or empty if case closure
  requesterId: string;
  requesterName: string;
  requesterRole: UserRole;
  reason: string;
  details: string; // JSON string of what is being approved
  status: "PENDING" | "APPROVED" | "REJECTED";
  decidedAt?: string;
  decidedBy?: string;
  decisionNotes?: string;
  submittedAt: string;
}

export interface Appeal {
  id: string;
  caseId: string;
  assessmentId: string;
  grounds: string;
  taxAmountDisputed: number;
  status: "PENDING" | "UPHELD" | "REDUCED" | "DISMISSED" | "WITHDRAWN";
  resolvedAt?: string;
  resolverNotes?: string;
  resolverName?: string;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  caseId?: string;
  action: string;
  performedBy: string;
  role: UserRole;
  timestamp: string;
  ip: string;
  details: string;
}

export interface SystemConfig {
  mlPublicKeyId: string;
  mlPrivateSecretKey: string;
  inferenceGatewayUrl: string;
  modelStorageCluster: string;
  envVariables: { key: string; value: string }[];
}

export interface DatabaseSchema {
  users: User[];
  taxpayers: Taxpayer[];
  riskAssessments: RiskAssessment[];
  auditCases: AuditCase[];
  caseStageHistory: CaseStageHistory[];
  documentRequests: DocumentRequest[];
  evidenceDocuments: EvidenceDocument[];
  findings: Finding[];
  assessments: Assessment[];
  approvals: ApprovalRequest[];
  appeals: Appeal[];
  auditLog: AuditLogEntry[];
  systemConfig?: SystemConfig;
}
