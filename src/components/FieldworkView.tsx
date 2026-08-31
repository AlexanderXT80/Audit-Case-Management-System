import React from "react";
import { 
  AuditCase, 
  CaseStage, 
  DocumentRequest, 
  EvidenceDocument, 
  Finding, 
  CaseStageHistory, 
  UserRole,
  User
} from "../types";
import { 
  FolderLock, 
  Clock, 
  ArrowRightLeft, 
  CheckCircle2, 
  FileText, 
  Trash2, 
  Upload, 
  Sparkles, 
  ShieldAlert, 
  Check, 
  FolderCheck,
  AlertTriangle,
  History,
  FileSpreadsheet,
  FileImage,
  Layers,
  ChevronDown,
  Edit2,
  UserCheck
} from "lucide-react";

interface FieldworkViewProps {
  caseId: string;
  caseDetail: any; // includes details, taxpayer, history, documents, evidence, findings, assessments, activeApproval
  allUsers: User[];
  activeRole: UserRole;
  currentUser: User | null;
  onRefresh: () => void;
  onTransitionStage: (toStage: CaseStage, notes: string) => void;
  onCreateDocumentRequest: (description: string, dueDate: string) => void;
  onToggleDocumentStatus: (docId: string, status: "PENDING" | "RECEIVED") => void;
  onUploadEvidence: (name: string, requestId: string | null, fileSize: string, fileType: string) => void;
  onLogFinding: (description: string, amount: number) => void;
  onUpdateFinding: (findingId: string, description: string, amount: number) => void;
  onCreateAssessment: (tax: number, penalty: number, interest: number, findingsRef: string[], notes: string) => void;
}

export default function FieldworkView({
  caseId,
  caseDetail,
  allUsers,
  activeRole,
  currentUser,
  onRefresh,
  onTransitionStage,
  onCreateDocumentRequest,
  onToggleDocumentStatus,
  onUploadEvidence,
  onLogFinding,
  onUpdateFinding,
  onCreateAssessment,
}: FieldworkViewProps) {
  const [activeTab, setActiveTab] = React.useState<"requests" | "vault" | "findings" | "history">("requests");

  // Check if current user is the lead auditor for this case
  const isLeadAuditor = currentUser && caseDetail && (
    (caseDetail.leadAuditorId && caseDetail.leadAuditorId === currentUser.id) ||
    (caseDetail.leadAuditorName && caseDetail.leadAuditorName === currentUser.name)
  );

  const isWritable = 
    activeRole === UserRole.SUPERVISOR || 
    activeRole === UserRole.ADMIN || 
    !!isLeadAuditor;

  // Local form states
  const [docDescription, setDocDescription] = React.useState("");
  const [docDueDate, setDocDueDate] = React.useState("");

  const [evidenceName, setEvidenceName] = React.useState("");
  const [evidenceRequestId, setEvidenceRequestId] = React.useState("");
  const [evidenceType, setEvidenceType] = React.useState("PDF");
  const [evidenceSize, setEvidenceSize] = React.useState("1.5 MB");

  const [findingDesc, setFindingDesc] = React.useState("");
  const [findingAmount, setFindingAmount] = React.useState("");
  const [editingFindingId, setEditingFindingId] = React.useState<string | null>(null);
  const [editDesc, setEditDesc] = React.useState("");
  const [editAmount, setEditAmount] = React.useState("");

  // Stage transition note state
  const [transitionNotes, setTransitionNotes] = React.useState("");
  const [selectedNextStage, setSelectedNextStage] = React.useState<CaseStage | "">("");

  // Assessment submission states
  const [showAssessmentCreator, setShowAssessmentCreator] = React.useState(false);
  const [assTax, setAssTax] = React.useState("");
  const [assPenalty, setAssPenalty] = React.useState("");
  const [assInterest, setAssInterest] = React.useState("");
  const [assNotes, setAssNotes] = React.useState("");

  if (!caseDetail) {
    return (
      <div className="bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
        <FolderLock className="h-12 w-12 text-gray-300 mx-auto" />
        <h3 className="text-sm font-semibold text-gray-900 mt-4">Case Details Missing</h3>
        <p className="text-xs text-gray-500 mt-1">Please select an active audit case from the list.</p>
      </div>
    );
  }

  const {
    id,
    tin,
    taxpayerName,
    stage,
    leadAuditorName,
    financialImpact,
    auditType,
    createdAt,
    notes,
    taxpayer,
    history = [],
    documents = [],
    evidence = [],
    findings = [],
    assessments = [],
    activeApproval
  } = caseDetail;

  // Compute next legal stages based on current stage
  const getNextLegalStages = (current: CaseStage): CaseStage[] => {
    switch (current) {
      case CaseStage.SELECTED:
        return [CaseStage.NOTIFIED, CaseStage.REJECTED];
      case CaseStage.REJECTED:
        return [CaseStage.SELECTED];
      case CaseStage.NOTIFIED:
        return [CaseStage.PLANNING];
      case CaseStage.PLANNING:
        return [CaseStage.FIELDWORK];
      case CaseStage.FIELDWORK:
        return [CaseStage.REVIEW];
      case CaseStage.REVIEW:
        return [CaseStage.ASSESSED, CaseStage.CLOSED];
      case CaseStage.ASSESSED:
        return [CaseStage.APPEAL, CaseStage.CLOSED];
      case CaseStage.APPEAL:
        return [CaseStage.CLOSED, CaseStage.REVIEW];
      default:
        return [];
    }
  };

  const nextStages = getNextLegalStages(stage);

  const handleTransitionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNextStage || !transitionNotes) return;
    onTransitionStage(selectedNextStage as CaseStage, transitionNotes);
    setTransitionNotes("");
    setSelectedNextStage("");
  };

  const handleDocRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docDescription || !docDueDate) return;
    onCreateDocumentRequest(docDescription, docDueDate);
    setDocDescription("");
    setDocDueDate("");
  };

  const handleEvidenceUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceName) return;
    onUploadEvidence(evidenceName, evidenceRequestId || null, evidenceSize, evidenceType);
    setEvidenceName("");
    setEvidenceRequestId("");
  };

  const handleFindingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findingDesc || !findingAmount) return;
    onLogFinding(findingDesc, Number(findingAmount));
    setFindingDesc("");
    setFindingAmount("");
  };

  const handleStartEditFinding = (find: Finding) => {
    setEditingFindingId(find.id);
    setEditDesc(find.description);
    setEditAmount(find.amount.toString());
  };

  const handleSaveEditFinding = (findingId: string) => {
    onUpdateFinding(findingId, editDesc, Number(editAmount));
    setEditingFindingId(null);
  };

  const handleAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tax = Number(assTax);
    const penalty = Number(assPenalty || 0);
    const interest = Number(assInterest || 0);
    if (!tax) return;

    onCreateAssessment(
      tax,
      penalty,
      interest,
      findings.map((f: Finding) => f.id),
      assNotes || `Formal adjustment assessment raised`
    );

    setShowAssessmentCreator(false);
    setAssTax("");
    setAssPenalty("");
    setAssInterest("");
    setAssNotes("");
  };

  return (
    <div className="space-y-6" id="fieldwork-view-root">
      {/* Case Header Details Block */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">
              {id}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              stage === CaseStage.FIELDWORK ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
              stage === CaseStage.REVIEW ? "bg-amber-50 text-amber-700 border border-amber-150" :
              stage === CaseStage.CLOSED ? "bg-emerald-50 text-emerald-700 border border-emerald-150" :
              stage === CaseStage.REJECTED ? "bg-red-50 text-red-700 border border-red-150" :
              "bg-blue-50 text-blue-700 border border-blue-150"
            }`}>
              {stage}
            </span>
            {activeApproval && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500 text-white animate-pulse">
                <AlertTriangle className="h-3 w-3" />
                PENDING SUPERVISOR APPROVAL
              </span>
            )}
          </div>
          <h2 className="text-lg font-bold text-gray-900 mt-2">{taxpayerName}</h2>
          <div className="grid grid-cols-2 md:flex items-center gap-x-6 gap-y-1.5 text-xs text-gray-500 mt-2 font-medium">
            <div>
              TIN: <strong className="text-gray-700 font-mono">{tin}</strong>
            </div>
            <div>
              Type: <strong className="text-gray-700">{auditType}</strong>
            </div>
            <div>
              Lead Auditor: <strong className="text-gray-700">{leadAuditorName || "Unassigned"}</strong>
            </div>
            <div>
              Tax Base: <strong className="text-blue-600 font-semibold">MWK {financialImpact.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            </div>
          </div>
        </div>

        {/* Sync Indicator */}
        <div className="flex flex-col items-end gap-1.5 text-right">
          <span className="text-[10px] text-gray-400 font-mono">STATUTORY DEADLINE</span>
          <span className="text-xs font-bold text-gray-700 font-mono">180 Days from Initiation</span>
          <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            ACTIVE CONTEXT
          </div>
        </div>
      </div>

      {/* Auditor Role Information Banner */}
      {activeRole === UserRole.AUDITOR && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs shadow-sm ${
          isLeadAuditor 
            ? "bg-blue-50 border-blue-250 text-blue-900" 
            : "bg-amber-50 border-amber-250 text-amber-900"
        }`}>
          <div className={`p-2 rounded-lg shrink-0 ${isLeadAuditor ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>
            <UserCheck className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <h4 className="font-bold uppercase tracking-wider text-[10px]">
              {isLeadAuditor ? "Lead Auditor (Primary Caseworker)" : "Read-Only / Auditor Review Mode"}
            </h4>
            <p className="mt-1 leading-relaxed">
              {isLeadAuditor ? (
                <span>
                  You are assigned as the <strong>Lead Auditor</strong> for this taxpayer case. You are authorized to issue statutory document requests, log fieldwork findings, and request stage transitions forward (notified &rarr; planning &rarr; fieldwork &rarr; review). Note that final assessment issuance, closure, or rejection requires independent Supervisor approval (no self-approval).
                </span>
              ) : (
                <span>
                  You are viewing this case as an Auditor, but you are not assigned as the Lead Auditor. You may review existing logs, findings, and evidence, but modification rights are restricted to <strong>{leadAuditorName || "the assigned Auditor"}</strong> or a Supervisor/Admin.
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Main Grid: Left Column (Transitions/Gating) & Right Column (Bento Workspaces) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Lifecycle Transition Console */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <ArrowRightLeft className="h-4 w-4 text-gray-400" />
              State Machine transitions
            </h3>
            <p className="text-xs text-gray-500">
              Change the case stage. Gated transitions (e.g. Assessment, Closure, Triage Rejection) automatically prompt supervisor approval queueing if requested by an Auditor.
            </p>

            {nextStages.length === 0 ? (
              <div className="bg-slate-50 p-4 text-center rounded-lg border border-gray-200 text-xs text-gray-500 font-medium">
                No legal onward transitions exist from the current state: <strong className="text-gray-800">{stage}</strong>
              </div>
            ) : (
              <form onSubmit={handleTransitionSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Target Stage</label>
                  <select
                    value={selectedNextStage}
                    onChange={(e) => setSelectedNextStage(e.target.value as CaseStage)}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                    required
                    disabled={!isWritable}
                  >
                    <option value="">Choose Next Legal Stage...</option>
                    {nextStages.map((st) => (
                      <option key={st} value={st}>
                        {st} 
                        {/* Indicate gating rules */}
                        {st === CaseStage.ASSESSED && " (GATED - ASSESSMENT)"}
                        {st === CaseStage.CLOSED && " (GATED - CLOSURE)"}
                        {st === CaseStage.REJECTED && " (GATED - REJECTION)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500">Auditor Memo / Statement</label>
                  <textarea
                    rows={3}
                    value={transitionNotes}
                    onChange={(e) => setTransitionNotes(e.target.value)}
                    placeholder={isWritable ? "Provide statutory justification for this transition..." : "Modification restricted to Assigned Lead Auditor."}
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
                    required
                    disabled={!isWritable}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!isWritable || !selectedNextStage || !transitionNotes}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold text-xs py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {isWritable ? "Request Stage Transition" : "Transition Restricted"}
                </button>
              </form>
            )}

            {/* Assessment Shortcut inside Fieldwork */}
            {stage === CaseStage.FIELDWORK && !showAssessmentCreator && (
              <button
                onClick={() => {
                  // Compute initial recommendation values based on findings sum
                  const sum = findings.reduce((s: number, f: Finding) => s + f.amount, 0);
                  setAssTax((sum * 0.75).toFixed(0));
                  setAssPenalty((sum * 0.15).toFixed(0));
                  setAssInterest((sum * 0.10).toFixed(0));
                  setShowAssessmentCreator(true);
                }}
                disabled={!isWritable}
                className="w-full border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 disabled:bg-gray-50 disabled:border-gray-200 disabled:text-gray-400 text-indigo-700 font-bold text-xs py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm"
              >
                <FileText className="h-3.5 w-3.5" />
                Draft Formal Tax Assessment
              </button>
            )}
          </div>

          {/* Assessment Form Overlay */}
          {showAssessmentCreator && (
            <div className="bg-indigo-50/55 border border-indigo-150 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Formal Tax Assessment Draft</span>
                <button 
                  onClick={() => setShowAssessmentCreator(false)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Close
                </button>
              </div>

              <form onSubmit={handleAssessmentSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="text-[9px] uppercase font-semibold text-gray-500">Tax Principal (MWK)</label>
                  <input
                    type="number"
                    value={assTax}
                    onChange={(e) => setAssTax(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white mt-0.5"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] uppercase font-semibold text-gray-500">Penalty (MWK)</label>
                    <input
                      type="number"
                      value={assPenalty}
                      onChange={(e) => setAssPenalty(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white mt-0.5"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] uppercase font-semibold text-gray-500">Interests (MWK)</label>
                    <input
                      type="number"
                      value={assInterest}
                      onChange={(e) => setAssInterest(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg bg-white mt-0.5"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[9px] uppercase font-semibold text-gray-500">Draft Notes / Grounds</label>
                  <textarea
                    rows={2}
                    value={assNotes}
                    onChange={(e) => setAssNotes(e.target.value)}
                    placeholder="Identify primary statutory findings references..."
                    className="w-full p-2 border border-gray-300 rounded-lg bg-white mt-0.5"
                  />
                </div>

                <div className="bg-white p-2.5 border border-indigo-100 rounded-lg text-[10px] text-indigo-900 flex justify-between items-center font-bold">
                  <span>Draft Total Assessment:</span>
                  <span>MWK {(Number(assTax) + Number(assPenalty || 0) + Number(assInterest || 0)).toLocaleString()}</span>
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Submit Draft for Gated Review
                </button>
              </form>
            </div>
          )}

          {/* Taxpayer Information Detail Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Taxpayer Registered Profile</h4>
            {taxpayer ? (
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Official Entity Name</span>
                  <span className="font-semibold text-gray-800">{taxpayer.name}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Registered Address</span>
                  <span className="text-gray-600">{taxpayer.address}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Tax Jurisdiction Sector</span>
                  <span className="text-gray-600 font-semibold">{taxpayer.sector}</span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase">Assessed Tax Types</span>
                  <div className="flex gap-1 mt-1">
                    {taxpayer.taxTypes.map((t: string) => (
                      <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-bold">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Static taxpayers details mapping error.</p>
            )}
          </div>
        </div>

        {/* Right Column: Bento Workspace Tabs */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
          {/* Workspace Tabs Header */}
          <div className="border-b border-gray-200 bg-gray-50 flex items-center justify-between px-4">
            <nav className="flex space-x-4 -mb-px">
              {[
                { id: "requests", label: "📄 Document Request Tracker" },
                { id: "vault", label: "🔒 Evidence Vault" },
                { id: "findings", label: "📝 Findings Log" },
                { id: "history", label: "⏳ Case History Timeline" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-3.5 px-1 border-b-2 font-semibold text-xs transition-all ${
                    activeTab === tab.id
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                  id={`fieldwork-tab-${tab.id}`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <span className="text-[10px] font-mono text-gray-400 hidden sm:inline">COMPLIANCE CONTROL</span>
          </div>

          <div className="p-5 flex-1 min-h-[420px]" id="fieldwork-tab-content">
            {/* 1. DOCUMENT REQUESTS TAB */}
            {activeTab === "requests" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm">Requested Documents</h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">Statutory requests sent to the taxpayer. Taxpayer must provide files before the due date.</p>
                  </div>
                </div>

                {/* Table list */}
                <div className="border border-gray-150 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Document / Ledger Description</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-gray-500">Due Date</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-gray-500">Status</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-gray-500">Action</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-150">
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">No document requests registered. Use the panel below to send requests.</td>
                        </tr>
                      ) : (
                        documents.map((doc: DocumentRequest) => (
                          <tr key={doc.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3 font-medium text-gray-800">
                              {doc.description}
                              <div className="text-[9px] text-gray-400 mt-0.5">Requested on: {doc.requestedOn} by {doc.actedBy}</div>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-gray-600 font-semibold">{doc.dueDate}</td>
                            <td className="px-4 py-3 text-center">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                doc.status === "RECEIVED" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                              }`}>
                                {doc.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => onToggleDocumentStatus(doc.id, doc.status === "RECEIVED" ? "PENDING" : "RECEIVED")}
                                disabled={!isWritable}
                                className="text-[10px] font-bold px-2 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:bg-gray-50 text-gray-700 rounded transition-colors"
                              >
                                Toggle
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Create Request form */}
                <div className="bg-slate-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    {isWritable ? "Initiate Statutory Request Letter" : "Statutory Request Letter (Assigned Lead Auditor Only)"}
                  </span>
                  <form onSubmit={handleDocRequestSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder={isWritable ? "e.g. FY2023 Offshore General Journal Ledger..." : "Modification restricted to Assigned Lead Auditor."}
                        value={docDescription}
                        onChange={(e) => setDocDescription(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        required
                        disabled={!isWritable}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={docDueDate}
                        onChange={(e) => setDocDueDate(e.target.value)}
                        className="flex-1 text-xs border border-gray-300 rounded-lg p-2 bg-white font-mono disabled:bg-gray-100 disabled:text-gray-400"
                        required
                        disabled={!isWritable}
                      />
                      <button
                        type="submit"
                        disabled={!isWritable}
                        className="bg-blue-600 hover:bg-blue-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold text-xs px-3.5 rounded-lg transition-colors"
                      >
                        Request
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 2. EVIDENCE VAULT TAB */}
            {activeTab === "vault" && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Evidence Vault</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Uploaded files verifying declarations. All evidence is automatically cryptographically hashed (SHA-256) on import to ensure legal admissibility in appeals.</p>
                </div>

                {/* Evidence vault files table list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {evidence.length === 0 ? (
                    <div className="col-span-2 py-12 text-center text-gray-400 italic text-xs">No physical evidence registered in vault. Use the simulation panel below to ingest files.</div>
                  ) : (
                    evidence.map((ev: EvidenceDocument) => {
                      const req = documents.find((d: DocumentRequest) => d.id === ev.requestId);
                      const isPdf = ev.fileType === "PDF";
                      const isExcel = ev.fileType === "XLSX" || ev.fileType === "XLS";

                      return (
                        <div key={ev.id} className="border border-gray-200 bg-white p-4 rounded-xl shadow-sm space-y-3 flex flex-col justify-between">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                isPdf ? "bg-red-50 text-red-600" :
                                isExcel ? "bg-emerald-50 text-emerald-600" :
                                "bg-blue-50 text-blue-600"
                              }`}>
                                {isPdf ? <FileText className="h-5 w-5" /> :
                                 isExcel ? <FileSpreadsheet className="h-5 w-5" /> :
                                 <FileImage className="h-5 w-5" />}
                              </div>
                              <div>
                                <span className="font-semibold text-xs text-gray-900 block truncate max-w-[150px]" title={ev.name}>{ev.name}</span>
                                <span className="text-[10px] text-gray-400 block">{ev.fileSize} • {ev.fileType}</span>
                              </div>
                            </div>
                            {ev.verifiedBadge && (
                              <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                <Check className="h-3 w-3" />
                                SHA-256 VERIFIED
                              </span>
                            )}
                          </div>

                          <div className="space-y-1.5">
                            <span className="text-[9px] font-mono text-gray-400 block">SHA-256 INTEGRITY HASH</span>
                            <span className="font-mono text-[10px] text-gray-600 bg-gray-50 p-1.5 rounded block truncate" title={ev.sha256}>{ev.sha256}</span>
                          </div>

                          <div className="text-[10px] text-gray-500 pt-2 border-t border-gray-100 flex justify-between items-center">
                            <span>Uploaded: {new Date(ev.uploadedAt).toLocaleDateString()}</span>
                            {req && <span className="text-blue-600 font-semibold font-mono">Matched: Request ID</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Upload Form Simulator */}
                <div className="bg-slate-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    {isWritable ? "Ingest New Physical Evidence (mTLS Upload Simulation)" : "Evidence Ingestion Restricted (Assigned Lead Auditor Only)"}
                  </span>
                  <form onSubmit={handleEvidenceUploadSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                    <div className="lg:col-span-2">
                      <input
                        type="text"
                        placeholder={isWritable ? "Physical File name (e.g. ledger_march_v2.xlsx)..." : "Modification restricted to Assigned Lead Auditor."}
                        value={evidenceName}
                        onChange={(e) => setEvidenceName(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        required
                        disabled={!isWritable}
                      />
                    </div>
                    <div>
                      <select
                        value={evidenceRequestId}
                        onChange={(e) => setEvidenceRequestId(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        disabled={!isWritable}
                      >
                        <option value="">No request link...</option>
                        {documents.filter((d: any) => d.status === "PENDING").map((d: any) => (
                          <option key={d.id} value={d.id}>{d.description}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <button
                        type="submit"
                        disabled={!isWritable}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold p-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Ingest File
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 3. FINDINGS LOG TAB */}
            {activeTab === "findings" && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Findings Log</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Identified tax discrepancies. Logging an issue automatically recalculates the case's dynamic financial impact in real time.</p>
                </div>

                {/* Findings Table List */}
                <div className="border border-gray-150 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-500">ID</th>
                        <th className="px-4 py-2.5 text-left font-semibold text-gray-500">Issue / Discrepancy Description</th>
                        <th className="px-4 py-2.5 text-right font-semibold text-gray-500">Discrepancy Value</th>
                        <th className="px-4 py-2.5 text-center font-semibold text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-150">
                      {findings.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400 italic">No tax findings logged. Use the panel below to record issues.</td>
                        </tr>
                      ) : (
                        findings.map((find: Finding) => {
                          const isEditing = editingFindingId === find.id;

                          return (
                            <tr key={find.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-semibold text-gray-900 font-mono text-center">{find.id}</td>
                              <td className="px-4 py-3 text-gray-600">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
                                    className="w-full p-1 border border-blue-400 rounded text-xs bg-white text-gray-900"
                                  />
                                ) : (
                                  <>
                                    <span className="font-semibold text-gray-800 block">{find.description}</span>
                                    <span className="text-[9px] text-gray-400">Reported on: {find.date} by {find.reportedBy}</span>
                                  </>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editAmount}
                                    onChange={(e) => setEditAmount(e.target.value)}
                                    className="w-24 p-1 border border-blue-400 rounded text-xs text-right bg-white text-gray-900"
                                  />
                                ) : (
                                  `MWK ${find.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {isEditing ? (
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => handleSaveEditFinding(find.id)}
                                      className="px-2 py-0.5 bg-emerald-500 text-white rounded font-bold text-[10px]"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingFindingId(null)}
                                      className="px-2 py-0.5 bg-gray-300 text-gray-700 rounded text-[10px]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => handleStartEditFinding(find)}
                                    disabled={!isWritable}
                                    className="p-1 rounded text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:hover:bg-transparent transition-colors"
                                    title="Edit Issue"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Log finding form */}
                <div className="bg-slate-50 border border-gray-200 rounded-lg p-4 space-y-3">
                  <span className="text-xs font-bold text-slate-800 block">
                    {isWritable ? "Record New Fieldwork Tax Discrepancy" : "Record Discrepancy (Assigned Lead Auditor Only)"}
                  </span>
                  <form onSubmit={handleFindingSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder={isWritable ? "Description of undeclared revenues/VAT input discrepancy..." : "Modification restricted to Assigned Lead Auditor."}
                        value={findingDesc}
                        onChange={(e) => setFindingDesc(e.target.value)}
                        className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white disabled:bg-gray-100 disabled:text-gray-400"
                        required
                        disabled={!isWritable}
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Amount (MWK)..."
                        value={findingAmount}
                        onChange={(e) => setFindingAmount(e.target.value)}
                        className="flex-1 text-xs border border-gray-300 rounded-lg p-2 bg-white font-mono text-right disabled:bg-gray-100 disabled:text-gray-400"
                        required
                        disabled={!isWritable}
                      />
                      <button
                        type="submit"
                        disabled={!isWritable}
                        className="bg-red-600 hover:bg-red-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold text-xs px-3.5 rounded-lg transition-colors"
                      >
                        Log
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 4. HISTORY TAB */}
            {activeTab === "history" && (
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Immutable Case Timeline Log</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Chronological progress trace logged by security auth loops.</p>
                </div>

                <div className="flow-root pl-4">
                  <ul className="-mb-8">
                    {history.length === 0 ? (
                      <p className="text-xs text-gray-500 italic text-center py-6">No historical timeline data registered.</p>
                    ) : (
                      history.map((hist: CaseStageHistory, idx: number) => (
                        <li key={hist.id}>
                          <div className="relative pb-8">
                            {idx !== history.length - 1 ? (
                              <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                            ) : null}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center ring-8 ring-white">
                                  <History className="h-4 w-4 text-slate-500" />
                                </span>
                              </div>
                              <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4 text-xs">
                                <div>
                                  <p className="text-gray-600">
                                    <strong className="text-gray-900">{hist.actedBy}</strong> ({hist.actedRole}){" "}
                                    {hist.fromStage === hist.toStage ? (
                                      <span>action logged: </span>
                                    ) : (
                                      <span>transitioned case stage from <strong className="text-slate-800">{hist.fromStage}</strong> to <strong className="text-blue-700">{hist.toStage}</strong>: </span>
                                    )}
                                    <span className="text-gray-500 italic">"{hist.notes}"</span>
                                  </p>
                                </div>
                                <div className="text-right text-[10px] whitespace-nowrap font-mono text-gray-400">
                                  {new Date(hist.timestamp).toLocaleDateString()} {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
