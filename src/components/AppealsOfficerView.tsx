import React, { useState, useEffect } from "react";
import { 
  Appeal, 
  AuditCase, 
  Finding, 
  EvidenceDocument, 
  User, 
  UserRole,
  CaseStage
} from "../types";
import { 
  Scale, 
  FileText, 
  CheckSquare, 
  Download, 
  Check, 
  X, 
  AlertTriangle, 
  ChevronRight, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  History, 
  FolderLock, 
  ArrowLeft,
  ShieldAlert,
  HardDrive,
  UserCheck
} from "lucide-react";

interface AppealsOfficerViewProps {
  cases: AuditCase[];
  appeals: Appeal[];
  findings: Finding[];
  evidence: EvidenceDocument[];
  currentUser: User | null;
  onRefresh: () => Promise<void>;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AppealsOfficerView({
  cases,
  appeals,
  findings,
  evidence,
  currentUser,
  onRefresh,
  showToast,
}: AppealsOfficerViewProps) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<any>(null);
  const [loadingCaseDetail, setLoadingCaseDetail] = useState(false);
  
  // Tab within the Case Workspace (Appellate Review, Document Vault, or Timeline History)
  const [workspaceTab, setWorkspaceTab] = useState<"review" | "vault" | "history">("review");

  // Record outcome state
  const [outcome, setOutcome] = useState<"UPHELD" | "REDUCED" | "DISMISSED" | "WITHDRAWN" | "">("");
  const [justification, setJustification] = useState("");
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Dashboard state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PENDING" | "RESOLVED">("ALL");

  // Fetch full details of the selected case
  const fetchCaseDetail = async (caseId: string) => {
    try {
      setLoadingCaseDetail(true);
      const res = await fetch(`/api/cases/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCaseDetail(data);
        
        // Pre-fill outcome/notes if the appeal is already resolved
        if (data.appeal && data.appeal.status !== "PENDING") {
          setOutcome(data.appeal.status);
          setJustification(data.appeal.resolverNotes || "");
        } else {
          setOutcome("");
          setJustification("");
        }
      } else {
        showToast("Failed to fetch case detail", "error");
      }
    } catch (e) {
      showToast("Error connecting to server", "error");
    } finally {
      setLoadingCaseDetail(false);
    }
  };

  useEffect(() => {
    if (selectedCaseId) {
      fetchCaseDetail(selectedCaseId);
    }
  }, [selectedCaseId]);

  // Handle final decision submission
  const handleFinalizeDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outcome) {
      showToast("Please select a final determination outcome.", "error");
      return;
    }
    if (!justification.trim() || justification.trim().length < 15) {
      showToast("Please provide a detailed legal justification (min. 15 characters).", "error");
      return;
    }

    if (!selectedCaseDetail?.appeal?.id) {
      showToast("No active appeal object found for this case.", "error");
      return;
    }

    try {
      setSubmittingDecision(true);
      const res = await fetch(`/api/appeals/${selectedCaseDetail.appeal.id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome, resolverNotes: justification })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Appeal successfully finalized: ${outcome}. Case is now closed.`, "success");
        await onRefresh();
        await fetchCaseDetail(selectedCaseId!);
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to finalize decision.", "error");
      }
    } catch (err) {
      showToast("Network error submitting decision.", "error");
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Helper to map days since lodgement (simulated)
  const getDaysSinceLodgement = (createdAt: string) => {
    const diffTime = Math.abs(new Date().getTime() - new Date(createdAt).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    // Fallback if seeded date is in future/same day
    return diffDays <= 1 ? "1 Day" : `${diffDays} Days`;
  };

  // Filter appeals based on dashboard settings
  const filteredAppeals = appeals.filter(app => {
    const auditCase = cases.find(c => c.id === app.caseId);
    const matchesSearch = 
      app.caseId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (auditCase?.taxpayerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.grounds.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    if (statusFilter === "PENDING") {
      return app.status === "PENDING";
    }
    if (statusFilter === "RESOLVED") {
      return app.status !== "PENDING";
    }
    return true;
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredAppeals.length / pageSize) || 1;
  const paginatedAppeals = filteredAppeals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Calculate metrics
  const totalPendingCount = appeals.filter(a => a.status === "PENDING").length;
  const priorityCount = appeals.filter(a => a.status === "PENDING" && a.taxAmountDisputed >= 1000000).length;
  const resolvedCount = appeals.filter(a => a.status !== "PENDING").length;

  if (selectedCaseId) {
    const c = selectedCaseDetail;
    const appealObj = c?.appeal as Appeal | undefined;

    return (
      <div className="space-y-6 animate-fade-in" id="appeals-workspace">
        {/* Navigation Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedCaseId(null);
                setSelectedCaseDetail(null);
                setWorkspaceTab("review");
              }}
              className="p-1.5 hover:bg-slate-100 text-gray-500 hover:text-gray-900 rounded-lg transition-colors border border-gray-200 bg-white shadow-sm cursor-pointer"
              title="Return to Appeals Dashboard"
              id="btn-back-dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                  Legal / Appeals Division
                </span>
                {appealObj?.status === "PENDING" ? (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-250 rounded text-[10px] font-bold uppercase">
                    Under Appeal
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250 rounded text-[10px] font-bold uppercase">
                    Resolved ({appealObj?.status})
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-gray-900 tracking-tight mt-1" id="workspace-case-title">
                {c?.taxpayerName || "Loading Case Records..."}
              </h2>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setWorkspaceTab("review")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                workspaceTab === "review"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              id="btn-tab-review"
            >
              Appellate Review
            </button>
            <button
              onClick={() => setWorkspaceTab("vault")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                workspaceTab === "vault"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              id="btn-tab-vault"
            >
              Document Vault
            </button>
            <button
              onClick={() => setWorkspaceTab("history")}
              className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                workspaceTab === "history"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
              id="btn-tab-history"
            >
              Procedural History
            </button>
          </div>
        </div>

        {loadingCaseDetail ? (
          <div className="bg-white rounded-xl border border-gray-200 p-24 text-center shadow-sm">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-xs text-gray-500 mt-4 font-medium">Reconciling ledger hashes and retrieving appeal bundle...</p>
          </div>
        ) : !c ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-500 italic shadow-sm">
            Case record could not be reconstructed. Verification signature missing.
          </div>
        ) : (
          <div>
            {/* Meta context bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-gray-200 rounded-xl p-4 mb-6 text-xs">
              <div>
                <p className="text-gray-400 font-medium">CASE REFERENCE ID</p>
                <p className="font-bold text-gray-900 font-mono mt-1">{c.id}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">TAXPAYER ID / TIN</p>
                <p className="font-bold text-gray-900 font-mono mt-1">{c.tin}</p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">ASSESSMENT BASE</p>
                <p className="font-bold text-gray-900 font-mono mt-1">
                  MWK {c.financialImpact?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-gray-400 font-medium">LEAD AUDITOR</p>
                <p className="font-bold text-gray-900 mt-1">{c.leadAuditorName || "Unassigned"}</p>
              </div>
            </div>

            {/* TAB CONTENT: APPELLATE REVIEW WORKSPACE */}
            {workspaceTab === "review" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Ground for Appeal + Evidentiary Record */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Appeal Grounds Summary */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3" id="appeal-grounds-box">
                    <div className="flex items-center gap-2 text-rose-600">
                      <AlertTriangle className="h-4 w-4" />
                      <h4 className="font-bold text-xs uppercase tracking-wider">Lodged Appeal Grounds Summary</h4>
                    </div>
                    <p className="text-xs text-gray-700 italic bg-rose-50/40 p-4 border-l-4 border-rose-400 rounded-r-lg leading-relaxed font-serif">
                      &ldquo;{appealObj?.grounds || "No grounds description lodged."}&rdquo;
                    </p>
                  </div>

                  {/* Evidentiary Record */}
                  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-6" id="evidentiary-record-box">
                    <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2">
                      <FolderLock className="h-4.5 w-4.5 text-blue-600" />
                      Evidentiary Case Record
                    </h3>

                    {/* Original Auditor Findings */}
                    <div className="space-y-4">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <CheckSquare className="h-3.5 w-3.5" />
                        Original Auditor Findings
                      </h4>
                      
                      {c.findings && c.findings.length > 0 ? (
                        <div className="space-y-3">
                          {c.findings.map((f: Finding) => (
                            <div key={f.id} className="border border-slate-150 rounded-lg p-3.5 bg-slate-50/50 space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono font-bold text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-150">
                                  {f.id}
                                </span>
                                <span className="font-mono font-bold text-slate-800 text-xs">
                                  MWK {f.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                              <p className="text-xs text-gray-700 leading-relaxed font-medium">
                                {f.description}
                              </p>
                              <div className="flex justify-between text-[10px] text-gray-400 pt-1.5 border-t border-slate-100">
                                <span>Reported By: {f.reportedBy}</span>
                                <span>Date: {f.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
                          No audit findings recorded during fieldwork.
                        </p>
                      )}
                    </div>

                    {/* Submitted Evidence files */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        Submitted Legal Evidence
                      </h4>

                      {c.evidence && c.evidence.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {c.evidence.map((e: EvidenceDocument) => (
                            <div key={e.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-all shadow-sm">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                                  <FileText className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 text-left">
                                  <p className="text-xs font-bold text-gray-800 truncate" title={e.name}>
                                    {e.name}
                                  </p>
                                  <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                                    <span>{e.fileSize}</span>
                                    <span>•</span>
                                    <span className="font-mono uppercase text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1 rounded">
                                      VERIFIED Badge
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <button className="p-1.5 hover:bg-slate-100 text-gray-400 hover:text-gray-900 rounded-lg shrink-0 transition-colors cursor-pointer">
                                <Download className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic bg-gray-50 p-4 rounded-lg border border-dashed border-gray-200">
                          No supporting documents lodged with this appeal.
                        </p>
                      )}
                    </div>

                    {/* Appellant Clarification */}
                    <div className="space-y-3 pt-3 border-t border-gray-150">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                        Appellant Clarification Notes
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed bg-blue-50/40 p-4 rounded-lg border border-blue-100 font-medium">
                        {c.id === "LX-2024-0892" 
                          ? "The regional premium suggested by the auditor ignores the non-compete clauses active in our Southern African licensing structures, which legally cap the realizable value of these intangibles."
                          : "The taxpayer asserts that the computational formulas applied to calculate penalty margins didn't take into account documented force majeure events which delayed filing submissions."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Record Outcome (Final Determination) */}
                <div className="space-y-6">
                  <div className="bg-slate-900 text-white rounded-xl border border-slate-900 shadow-md overflow-hidden flex flex-col h-full">
                    <div className="p-5 border-b border-slate-800 bg-slate-950">
                      <h3 className="font-bold text-xs uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                        <Scale className="h-4 w-4" />
                        Record Outcome
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">Impartial final legal determination</p>
                    </div>

                    {appealObj?.status !== "PENDING" ? (
                      /* Resolved Read-only State */
                      <div className="p-6 space-y-5 flex-1">
                        <div className="bg-emerald-950/70 border border-emerald-800 p-4 rounded-lg text-emerald-300">
                          <div className="flex items-center gap-2">
                            <Check className="h-4.5 w-4.5 shrink-0" />
                            <p className="text-xs font-bold">DISPUTE FULLY RESOLVED</p>
                          </div>
                          <p className="text-[11px] mt-2 leading-relaxed text-emerald-400/90">
                            The final determination has been issued and legally locked in compliance with Audit CMS statutes. No further alterations are authorized.
                          </p>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wide">Legal Outcome</p>
                            <p className="text-sm font-bold text-white mt-1 bg-slate-800 py-1.5 px-3 rounded border border-slate-700 uppercase">
                              {appealObj?.status}
                            </p>
                          </div>

                          <div>
                            <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wide">Authorized By</p>
                            <p className="text-white font-medium mt-1">{appealObj?.resolverName || "Appeals Officer"}</p>
                          </div>

                          <div>
                            <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wide">Resolution Date</p>
                            <p className="text-white mt-1 font-mono">
                              {appealObj?.resolvedAt ? new Date(appealObj.resolvedAt).toLocaleDateString() : "-"}
                            </p>
                          </div>

                          <div>
                            <p className="text-slate-400 font-semibold uppercase text-[10px] tracking-wide">Legal Justification</p>
                            <div className="text-slate-300 bg-slate-850 p-3 rounded border border-slate-800 leading-relaxed text-xs mt-1 max-h-48 overflow-y-auto">
                              {appealObj?.resolverNotes}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Active Decision Making Form */
                      <form onSubmit={handleFinalizeDecision} className="p-5 space-y-5 flex-1 flex flex-col justify-between">
                        <div className="space-y-5">
                          <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide">
                              Determination Outcome
                            </label>

                            <div className="space-y-2">
                              {[
                                { id: "UPHELD", title: "Upheld", desc: "Assessments remain fully intact." },
                                { id: "REDUCED", title: "Reduced (Partial Relief)", desc: "Tax liability is revised downwards." },
                                { id: "DISMISSED", title: "Dismissed", desc: "The taxpayer's dispute is thrown out." },
                                { id: "WITHDRAWN", title: "Withdrawn", desc: "Appeal formal withdrawal recorded." }
                              ].map(opt => (
                                <label 
                                  key={opt.id}
                                  className={`flex items-start gap-3 p-3 rounded-lg border transition-all cursor-pointer select-none text-left ${
                                    outcome === opt.id
                                      ? "bg-slate-800 border-amber-500 text-white"
                                      : "bg-slate-850 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                                  }`}
                                >
                                  <input 
                                    type="radio" 
                                    name="outcome"
                                    value={opt.id}
                                    checked={outcome === opt.id}
                                    onChange={(e) => setOutcome(e.target.value as any)}
                                    className="mt-1 accent-amber-500 cursor-pointer"
                                  />
                                  <div>
                                    <p className="text-xs font-bold">{opt.title}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</p>
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-300 uppercase tracking-wide flex justify-between">
                              <span>Legal Justification Basis</span>
                              <span className="text-[10px] text-slate-400 capitalize font-normal">Min. 15 chars</span>
                            </label>
                            <textarea
                              rows={4}
                              value={justification}
                              onChange={(e) => setJustification(e.target.value)}
                              placeholder="Provide detailed legal basis for the outcome, referencing specific sections of the tax code..."
                              className="w-full bg-slate-850 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed resize-none"
                            />
                          </div>
                        </div>

                        <div className="pt-4 space-y-3">
                          <div className="text-[10px] text-slate-400 flex items-start gap-2 bg-slate-950 p-2.5 rounded border border-slate-850 leading-relaxed text-left">
                            <Clock className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            <span>
                              Once finalized, this decision will be locked and an official notification sent to the taxpayer. The case stage will transition to <strong>CLOSED</strong>.
                            </span>
                          </div>

                          <button
                            type="submit"
                            disabled={submittingDecision}
                            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-amber-500/10"
                            id="btn-finalize-decision"
                          >
                            {submittingDecision ? (
                              <>
                                <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-slate-950"></div>
                                Finalizing & Locking...
                              </>
                            ) : (
                              <>
                                <Scale className="h-4 w-4" />
                                Finalize Decision
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DOCUMENT VAULT */}
            {workspaceTab === "vault" && (
              <div className="space-y-4 animate-fade-in" id="document-vault-tab">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Case Document Vault</h3>
                    <p className="text-xs text-gray-500 mt-1">Reviewing legal filings and evidence submissions for current fiscal appeal.</p>
                  </div>
                  <button className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer">
                    + Add Document
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[
                    { id: "doc-v1", name: "Original Tax Assessment", desc: "Final assessment notice for FY2023 property valuation.", status: "VERIFIED", date: "Oct 12, 2023", size: "1.4 MB" },
                    { id: "doc-v2", name: "Formal Appeal Form", desc: "Signed submission from representative attorney outlining grounds.", status: "REQUIRES REVIEW", date: "Nov 04, 2023", size: "2.1 MB" },
                    { id: "doc-v3", name: "Property Survey Photos", desc: "External and internal site condition photographic evidence.", status: "VERIFIED", date: "Nov 06, 2023", size: "18.5 MB" },
                    { id: "doc-v4", name: "Initial Legal Brief", desc: "Preliminary legal arguments and citations for hearing.", status: "DRAFT", date: "Dec 01, 2023", size: "940 KB" },
                    { id: "doc-v5", name: "Comparison Analysis", desc: "Market comparison of similar industrial properties.", status: "VERIFIED", date: "Nov 15, 2023", size: "4.5 MB" },
                    { id: "doc-v6", name: "Hearing Notice", desc: "Official scheduling for the Board of Appeals hearing.", status: "VERIFIED", date: "Dec 05, 2023", size: "340 KB" }
                  ].map(doc => (
                    <div key={doc.id} className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col justify-between space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText className="h-4.5 w-4.5" />
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${
                            doc.status === "VERIFIED" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-150" 
                              : doc.status === "REQUIRES REVIEW"
                              ? "bg-amber-50 text-amber-700 border-amber-150"
                              : "bg-gray-50 text-gray-600 border-gray-150"
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                        <div className="text-left">
                          <h4 className="font-bold text-gray-900 text-xs truncate" title={doc.name}>{doc.name}</h4>
                          <p className="text-[11px] text-gray-500 mt-1 leading-relaxed line-clamp-2 h-8">{doc.desc}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{doc.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium font-mono">{doc.size}</span>
                          <button className="p-1 hover:bg-slate-150 text-slate-500 hover:text-slate-900 rounded transition-colors cursor-pointer">
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB CONTENT: TIMELINE PROCEDURAL HISTORY */}
            {workspaceTab === "history" && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6 animate-fade-in" id="procedural-history-tab">
                <div className="border-b border-gray-100 pb-3 text-left">
                  <h3 className="font-bold text-gray-900 text-sm">Procedural Case History</h3>
                  <p className="text-xs text-gray-500 mt-1">Audit trail of transitions and major appellate reviews</p>
                </div>

                <div className="relative pl-6 border-l border-slate-200 ml-4 space-y-8 text-left">
                  {/* Custom list prioritizing real elements */}
                  {[
                    ...(c.history || []),
                    // If appeal is resolved, we put that as the very latest historical block
                    ...(appealObj && appealObj.status !== "PENDING" ? [{
                      id: "hist-resolution",
                      timestamp: appealObj.resolvedAt || new Date().toISOString(),
                      actedBy: appealObj.resolverName || "Appeals Officer",
                      actedRole: UserRole.LEGAL,
                      fromStage: CaseStage.APPEAL,
                      toStage: CaseStage.CLOSED,
                      notes: `Final Determination: ${appealObj.status}. Legal justification logged: ${appealObj.resolverNotes}`
                    }] : [])
                  ]
                  .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                  .map((entry, idx) => (
                    <div key={entry.id || idx} className="relative">
                      {/* Timeline Dot */}
                      <span className="absolute -left-[31px] top-0.5 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white border-2 border-blue-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                      </span>

                      <div className="space-y-1">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="font-bold text-gray-900 text-xs">
                            {entry.fromStage === entry.toStage 
                              ? `Action Logged: ${entry.fromStage}` 
                              : `Workflow Transition: ${entry.fromStage} → ${entry.toStage}`}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(entry.timestamp).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                          </span>
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed mt-1">
                          {entry.notes}
                        </p>

                        <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
                          <UserCheck className="h-3 w-3 text-slate-400" />
                          <span>Performed by: <strong className="text-gray-600 font-semibold">{entry.actedBy}</strong></span>
                          <span>({entry.actedRole})</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in" id="appeals-officer-dashboard">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2 text-left">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total Pending Disputes</span>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">{totalPendingCount}</p>
            <p className="text-[10px] text-slate-400 font-medium font-mono flex items-center gap-1">
              <span className="text-blue-500 font-bold">↑ +4.2%</span> from last week
            </p>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <Scale className="h-6 w-6" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-blue-500"></div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2 text-left">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Priority Reviews</span>
            <p className="text-3xl font-extrabold text-rose-600 tracking-tight">{priorityCount}</p>
            <p className="text-[10px] text-rose-500 font-medium flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping"></span>
              Requires action within 48h
            </p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl shrink-0">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-rose-500"></div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-2 text-left">
            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Cases Finalized This Month</span>
            <p className="text-3xl font-extrabold text-emerald-600 tracking-tight">312</p>
            <p className="text-[10px] text-emerald-600 font-medium font-mono flex items-center gap-1">
              <span className="text-emerald-500 font-bold">✓ 92%</span> Resolution Efficiency
            </p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
            <CheckSquare className="h-6 w-6" />
          </div>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-emerald-500"></div>
        </div>
      </div>

      {/* Main Appeals Queue card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header with Search and Filter */}
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50">
          <div className="text-left">
            <h3 className="font-bold text-gray-900 text-sm">Pending Appeals Queue</h3>
            <p className="text-xs text-gray-500 mt-1">Impartial review and management of fiscal appeals.</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search case or taxpayer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-56 text-xs bg-white border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  statusFilter === "ALL"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-slate-800"
                }`}
              >
                All ({appeals.length})
              </button>
              <button
                onClick={() => setStatusFilter("PENDING")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  statusFilter === "PENDING"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-slate-800"
                }`}
              >
                Pending ({appeals.filter(a => a.status === "PENDING").length})
              </button>
              <button
                onClick={() => setStatusFilter("RESOLVED")}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  statusFilter === "RESOLVED"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-slate-800"
                }`}
              >
                Resolved ({appeals.filter(a => a.status !== "PENDING").length})
              </button>
            </div>
          </div>
        </div>

        {/* Appeals Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Case ID</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Taxpayer Name</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Assessment Value</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Appeal Status</th>
                <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Days Since Lodgement</th>
                <th className="px-5 py-3 text-center font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-150">
              {paginatedAppeals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-gray-400 italic">
                    No active appeal disputes found matching your current filter.
                  </td>
                </tr>
              ) : (
                paginatedAppeals.map((app) => {
                  const auditCase = cases.find(c => c.id === app.caseId);
                  
                  // Style appeal status label
                  const getStatusLabelStyle = (status: string, caseId: string) => {
                    if (status !== "PENDING") {
                      return "bg-emerald-50 text-emerald-700 border border-emerald-150";
                    }
                    if (caseId === "LX-2024-0892") {
                      return "bg-amber-50 text-amber-700 border border-amber-150"; // Hearing scheduled
                    }
                    if (caseId.includes("9042") || caseId.includes("9122")) {
                      return "bg-blue-50 text-blue-700 border border-blue-150"; // New
                    }
                    return "bg-purple-50 text-purple-700 border border-purple-150"; // In Review
                  };

                  const getStatusText = (status: string, caseId: string) => {
                    if (status !== "PENDING") return status;
                    if (caseId === "LX-2024-0892") return "HEARING SCHEDULED";
                    if (caseId.includes("9042") || caseId.includes("9122")) return "NEW";
                    return "IN REVIEW";
                  };

                  return (
                    <tr 
                      key={app.id}
                      className="hover:bg-slate-50/60 transition-colors cursor-pointer"
                      onClick={() => setSelectedCaseId(app.caseId)}
                    >
                      <td className="px-5 py-4 font-mono font-bold text-gray-900">#{app.caseId}</td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-gray-900 text-left">
                          {auditCase?.taxpayerName || "Unregistered Taxpayer"}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5 text-left">TIN: {auditCase?.tin || "Unknown"}</div>
                      </td>
                      <td className="px-5 py-4 font-semibold font-mono text-gray-900 text-left">
                        MWK {app.taxAmountDisputed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-left">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${getStatusLabelStyle(app.status, app.caseId)}`}>
                          {getStatusText(app.status, app.caseId)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500 font-medium font-mono text-left">
                        {getDaysSinceLodgement(app.createdAt)}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCaseId(app.caseId);
                          }}
                          className="px-3 py-1 bg-white hover:bg-slate-50 border border-gray-300 text-slate-700 hover:text-slate-950 font-bold text-xs rounded-lg transition-colors cursor-pointer shadow-sm"
                        >
                          Review Case
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Beautiful Pagination Footer */}
        {filteredAppeals.length > 0 && (
          <div className="p-4 border-t border-gray-150 flex items-center justify-between bg-white text-xs text-gray-500 shrink-0">
            <div>
              Showing <span className="font-semibold">{paginatedAppeals.length}</span> of{" "}
              <span className="font-semibold">{filteredAppeals.length.toLocaleString()}</span> active appeal disputes
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none text-gray-700 bg-white shadow-sm cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none text-gray-700 bg-white shadow-sm cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Year-end Reminder Notification Banner */}
      <div className="text-left text-xs text-blue-800 bg-blue-50 p-4 rounded-xl border border-blue-150 flex gap-3 leading-relaxed">
        <Clock className="h-5 w-5 text-blue-500 shrink-0" />
        <div>
          <strong className="font-bold text-blue-900">FISCAL YEAR-END REMINDER</strong>
          <p className="mt-0.5 text-[11px] text-blue-800 font-medium">
            All cases filed before October 1st must have an initial review completed by next Friday at 5:00 PM EST to maintain statutory compliance and fulfill public dispute timelines.
          </p>
        </div>
      </div>
    </div>
  );
}
