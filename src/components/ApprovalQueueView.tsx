import React from "react";
import { 
  ApprovalRequest, 
  AuditCase, 
  UserRole,
  User
} from "../types";
import { 
  CheckSquare, 
  UserCheck, 
  XOctagon, 
  CheckCircle, 
  AlertCircle,
  FileText,
  Calendar,
  ChevronRight,
  ShieldCheck,
  UserX,
  FileCheck
} from "lucide-react";

interface ApprovalQueueViewProps {
  approvals: ApprovalRequest[];
  cases: AuditCase[];
  onDecideApproval: (id: string, decision: "APPROVED" | "REJECTED", notes: string) => void;
  activeRole: UserRole;
  currentUser: User | null;
}

export default function ApprovalQueueView({
  approvals,
  cases,
  onDecideApproval,
  activeRole,
  currentUser,
}: ApprovalQueueViewProps) {
  const pendingApprovals = approvals.filter(a => a.status === "PENDING");
  const completedApprovals = approvals.filter(a => a.status !== "PENDING");

  const [selectedId, setSelectedId] = React.useState<string | null>(
    pendingApprovals.length > 0 ? pendingApprovals[0].id : (approvals.length > 0 ? approvals[0].id : null)
  );

  const [decisionNotes, setDecisionNotes] = React.useState("");

  const activeApp = approvals.find(a => a.id === selectedId);
  const targetCase = activeApp ? cases.find(c => c.id === activeApp.caseId) : null;

  const isSelfApproval = activeApp && currentUser && (
    activeApp.requesterId === currentUser.id ||
    (targetCase?.leadAuditorId && targetCase.leadAuditorId === currentUser.id) ||
    (targetCase?.leadAuditorName && targetCase.leadAuditorName === currentUser.name)
  );

  const handleDecision = (decision: "APPROVED" | "REJECTED") => {
    if (!activeApp) return;
    if (!decisionNotes.trim()) {
      alert("Decision explanation notes are required for immutable legal logs.");
      return;
    }
    onDecideApproval(activeApp.id, decision, decisionNotes);
    setDecisionNotes("");
  };

  // Group by category for list
  const assessments = pendingApprovals.filter(a => a.entityType === "ASSESSMENT");
  const closures = pendingApprovals.filter(a => a.entityType === "CASE_CLOSURE");
  const rejections = pendingApprovals.filter(a => a.entityType === "CASE_REJECTION");

  const isSupervisorOrAdmin = activeRole === UserRole.SUPERVISOR || activeRole === UserRole.ADMIN;

  return (
    <div className="space-y-6" id="approval-queue-root">
      {/* Overview stats */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Supervisor Approval Queue</h2>
          <p className="text-xs text-gray-500 mt-1">High-consequence case lifecycle transitions requiring joint-signature sign-off.</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-50 text-amber-800 border border-amber-150 rounded-lg py-1.5 px-3 text-xs font-semibold">
          <AlertCircle className="h-4 w-4" />
          <span>{pendingApprovals.length} Requests Pending Sign-off</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List of Requests */}
        <div className="space-y-4">
          {/* Active Pending Queue List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700 uppercase">Pending Requests</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">{pendingApprovals.length}</span>
            </div>

            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[360px]">
              {pendingApprovals.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs italic">No pending transition approvals in queue.</div>
              ) : (
                pendingApprovals.map((app) => {
                  const isSelected = app.id === selectedId;
                  const c = cases.find(cs => cs.id === app.caseId);
                  
                  let valueStr = "N/A";
                  try {
                    const parsed = JSON.parse(app.details || "{}");
                    if (parsed.financialImpact) {
                      valueStr = `MWK ${parsed.financialImpact.toLocaleString()}`;
                    } else if (c?.financialImpact) {
                      valueStr = `MWK ${c.financialImpact.toLocaleString()}`;
                    }
                  } catch {}

                  return (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedId(app.id);
                        setDecisionNotes("");
                      }}
                      className={`p-4 cursor-pointer transition-all hover:bg-slate-50/75 border-l-4 ${
                        isSelected ? "bg-blue-50/40 border-blue-500" : "border-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-xs font-semibold text-gray-900">{app.caseId}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          app.entityType === "ASSESSMENT" ? "bg-red-50 text-red-600 border border-red-150" :
                          app.entityType === "CASE_CLOSURE" ? "bg-blue-50 text-blue-600 border border-blue-150" :
                          "bg-slate-100 text-slate-600"
                        }`}>
                          {app.entityType}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-gray-700 mt-1.5 truncate">
                        {c?.taxpayerName || "Loading Taxpayer..."}
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-gray-400 mt-2">
                        <span>Submitted by: {app.requesterName}</span>
                        <span className="font-semibold text-gray-800">{valueStr}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* History Queue List */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <span className="text-xs font-bold text-gray-700 uppercase">Completed Decisions Log</span>
            </div>

            <div className="divide-y divide-gray-100 overflow-y-auto max-h-[220px]">
              {completedApprovals.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs italic">No completed approvals in this session database.</div>
              ) : (
                completedApprovals.map((app) => {
                  const isSelected = app.id === selectedId;
                  const c = cases.find(cs => cs.id === app.caseId);

                  return (
                    <div
                      key={app.id}
                      onClick={() => {
                        setSelectedId(app.id);
                        setDecisionNotes("");
                      }}
                      className={`p-3 cursor-pointer transition-all hover:bg-slate-50/50 border-l-4 ${
                        isSelected ? "bg-slate-50 border-gray-400" : "border-transparent"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[10px] font-semibold text-gray-900">{app.caseId}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          app.status === "APPROVED" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 truncate">
                        Decided by: {app.decidedBy}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Detailed View & Action Panel Gated */}
        <div className="lg:col-span-2">
          {activeApp ? (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
              {/* Request Header Info */}
              <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 font-mono block">DECISION AUTHORIZATION GATED</span>
                  <h3 className="font-bold text-gray-900 text-base mt-1 flex items-center gap-2">
                    {activeApp.entityType} SIGN-OFF
                    <span className="text-xs font-mono font-normal text-gray-500">#{activeApp.id}</span>
                  </h3>
                </div>
                <div className="text-right text-xs">
                  <span className="text-gray-400 block">SUBMITTED ON</span>
                  <span className="font-semibold text-gray-700 font-mono">
                    {new Date(activeApp.submittedAt).toLocaleDateString()} {new Date(activeApp.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {/* Entity Context details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4 text-xs">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-gray-400">Target Taxpayer Entity</span>
                  <span className="font-bold text-gray-800 block text-sm">{targetCase?.taxpayerName || "TIN Registered Client"}</span>
                  <span className="font-mono text-gray-500 block">TIN: {targetCase?.tin}</span>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-semibold text-gray-400">Lead Auditor (Requester)</span>
                  <span className="font-semibold text-gray-800 block text-sm">{activeApp.requesterName}</span>
                  <span className="text-gray-500 block">Role Session: {activeApp.requesterRole}</span>
                </div>
              </div>

              {/* Justification message submitted */}
              <div className="space-y-2">
                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Auditor Statutory Justification</h5>
                <div className="bg-blue-50/40 border border-blue-100 p-4 rounded-xl text-xs text-blue-900 italic font-medium leading-relaxed">
                  "{activeApp.reason}"
                </div>
              </div>

              {/* If Assessment show details split */}
              {activeApp.entityType === "ASSESSMENT" && (
                <div className="space-y-3">
                  <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Proposed Fiscal Adjustments</h5>
                  <div className="border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                    <div className="grid grid-cols-2 p-3 bg-gray-50 font-semibold text-gray-700">
                      <span>Adjustment Category</span>
                      <span className="text-right">Proposed Value</span>
                    </div>
                    {(() => {
                      try {
                        const dat = JSON.parse(activeApp.details || "{}");
                        return (
                          <>
                            <div className="grid grid-cols-2 p-3">
                              <span>Tax Principal Principal</span>
                              <span className="text-right font-mono font-medium">MWK {(dat.tax || dat.financialImpact || 0).toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-2 p-3">
                              <span>Administrative Penalties (VAT Statute)</span>
                              <span className="text-right font-mono font-medium">MWK {(dat.penalty || 0).toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-2 p-3">
                              <span>Compounded Interest Accruals</span>
                              <span className="text-right font-mono font-medium">MWK {(dat.interest || 0).toLocaleString()}</span>
                            </div>
                            <div className="grid grid-cols-2 p-3 font-bold bg-slate-100 text-slate-950">
                              <span>Total Outstanding Assessment</span>
                              <span className="text-right font-mono">MWK {(dat.total || dat.financialImpact || 0).toLocaleString()}</span>
                            </div>
                          </>
                        );
                      } catch {
                        return <div className="p-3 text-center text-gray-400">Failed to parse monetary details structure.</div>;
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Decision Section & Inputs */}
              {activeApp.status === "PENDING" ? (
                <div className="border-t border-gray-150 pt-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">
                      Supervisor Explanation / Decree (REQUIRED)
                    </label>
                    <textarea
                      rows={3}
                      value={decisionNotes}
                      onChange={(e) => setDecisionNotes(e.target.value)}
                      placeholder="Input comprehensive statutory grounds to support this decision in the legal archive..."
                      className="w-full text-xs border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Check Role Gating / Self-approval warnings */}
                  {isSelfApproval ? (
                    <div className="bg-amber-50 text-amber-950 border border-amber-200 p-4 rounded-xl flex items-start gap-3 text-xs">
                      <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-amber-950">Self-Approval Restriction</strong>
                        <p className="mt-1 leading-relaxed">
                          You are assigned as the <strong>Lead Auditor</strong> or are the <strong>original requester</strong> of this case. Under joint-signature protocols, you are strictly prohibited from approving or rejecting your own cases. Adjudication must be completed by a different supervisor or administrator.
                        </p>
                      </div>
                    </div>
                  ) : !isSupervisorOrAdmin ? (
                    <div className="bg-blue-50 text-blue-800 border border-blue-150 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
                      <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-blue-950">Auditor Status Tracking Mode</strong>
                        <p className="mt-1">
                          As an <strong>Auditor</strong>, you have read-only access to track high-consequence transitions. You cannot approve or reject requests. To make gating decisions, switch your session role to <strong>Supervisor</strong> at the top right of the screen.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-end pt-2">
                      <button
                        onClick={() => handleDecision("REJECTED")}
                        disabled={!decisionNotes.trim()}
                        className="bg-red-600 hover:bg-red-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold text-xs py-2.5 px-5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <UserX className="h-4 w-4" />
                        Reject Request
                      </button>
                      <button
                        onClick={() => handleDecision("APPROVED")}
                        disabled={!decisionNotes.trim()}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold text-xs py-2.5 px-5 rounded-lg transition-colors flex items-center gap-1.5"
                      >
                        <FileCheck className="h-4 w-4" />
                        Approve Issuance
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="border-t border-gray-150 pt-5 space-y-4 text-xs">
                  <div className="flex items-center gap-2 font-bold uppercase text-sm">
                    {activeApp.status === "APPROVED" ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="h-5 w-5" />
                        APPROVED DECISION ARCHIVED
                      </span>
                    ) : (
                      <span className="text-red-700 flex items-center gap-1">
                        <XOctagon className="h-5 w-5" />
                        REJECTED DECISION ARCHIVED
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <div>
                      <span className="text-gray-400 uppercase text-[9px] block">DECIDED BY</span>
                      <span className="font-semibold text-gray-800">{activeApp.decidedBy}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 uppercase text-[9px] block">DECISION TIMESTAMP</span>
                      <span className="font-mono text-gray-600 font-semibold">{new Date(activeApp.decidedAt!).toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 uppercase text-[9px] block">SUPERVISOR DECREE MEMO</span>
                      <span className="text-gray-700 italic font-medium">"{activeApp.decisionNotes}"</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm">
              <CheckSquare className="h-12 w-12 text-gray-300 mx-auto" />
              <h3 className="text-sm font-semibold text-gray-900 mt-4">Select Request</h3>
              <p className="text-xs text-gray-500 mt-1">Choose an item from the left queue to conduct supervisor adjudication.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
