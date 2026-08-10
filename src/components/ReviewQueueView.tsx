import React, { useState } from "react";
import { 
  AuditCase, 
  CaseStage, 
  Finding, 
  EvidenceDocument, 
  User,
  UserRole
} from "../types";
import { 
  Check, 
  CornerUpLeft, 
  X, 
  FileText, 
  Printer, 
  MoreVertical, 
  UserCheck, 
  Calendar, 
  Clock, 
  ChevronRight, 
  MessageSquare,
  AlertTriangle,
  Send,
  Sparkles
} from "lucide-react";

interface ReviewQueueViewProps {
  cases: AuditCase[];
  findings: Finding[];
  evidence: EvidenceDocument[];
  allUsers: User[];
  activeRole: UserRole;
  currentUser: User | null;
  onRefresh: () => void;
  onTransitionStage: (caseId: string, toStage: CaseStage, notes: string) => void;
}

export default function ReviewQueueView({
  cases,
  findings,
  evidence,
  allUsers,
  activeRole,
  currentUser,
  onRefresh,
  onTransitionStage,
}: ReviewQueueViewProps) {
  // Filter for cases in REVIEW stage
  const reviewCases = cases.filter(c => c.stage === CaseStage.REVIEW);

  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(
    reviewCases.length > 0 ? reviewCases[0].id : null
  );

  const [reworkNotes, setReworkNotes] = useState("");
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<string, { author: string; text: string; time: string }[]>>({});

  // Auto-select first case if active selected case is not in list
  React.useEffect(() => {
    if (reviewCases.length > 0 && (!selectedCaseId || !reviewCases.some(c => c.id === selectedCaseId))) {
      setSelectedCaseId(reviewCases[0].id);
    }
  }, [cases]);

  const activeCase = cases.find(c => c.id === selectedCaseId);
  const activeCaseFindings = activeCase ? findings.filter(f => f.caseId === activeCase.id) : [];
  const activeCaseEvidence = activeCase ? evidence.filter(e => e.caseId === activeCase.id) : [];

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !selectedCaseId) return;

    const newComment = {
      author: currentUser?.name || "Alexander Chikumba",
      text: commentText,
      time: "Just now"
    };

    setComments(prev => ({
      ...prev,
      [selectedCaseId]: [...(prev[selectedCaseId] || []), newComment]
    }));
    setCommentText("");
  };

  const executeSendRework = () => {
    if (!selectedCaseId || !reworkNotes.trim()) return;
    onTransitionStage(selectedCaseId, CaseStage.FIELDWORK, reworkNotes);
    setReworkNotes("");
    setShowReworkModal(false);
  };

  const executeApprove = () => {
    if (!selectedCaseId) return;
    // Supervisor can approve directly and transition to ASSESSED
    onTransitionStage(selectedCaseId, CaseStage.ASSESSED, approvalNotes || "Fieldwork reviewed and approved by Supervisor.");
    setApprovalNotes("");
    setShowApprovalModal(false);
  };

  const executeReject = () => {
    if (!selectedCaseId || !rejectNotes.trim()) return;
    onTransitionStage(selectedCaseId, CaseStage.REJECTED, rejectNotes);
    setRejectNotes("");
    setShowRejectModal(false);
  };

  return (
    <div className="space-y-6" id="review-queue-view">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Review Queue</h2>
          <p className="text-xs text-gray-500 mt-1">Review completed fieldwork before findings are issued and approve/rework cases.</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 text-blue-800 border border-blue-150 rounded-lg py-1.5 px-3 text-xs font-semibold">
          <Clock className="h-4 w-4" />
          <span>{reviewCases.length} Cases Awaiting Sign-off</span>
        </div>
      </div>

      {reviewCases.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-gray-200 text-center shadow-sm max-w-xl mx-auto space-y-4">
          <Check className="h-12 w-12 text-emerald-500 mx-auto bg-emerald-50 p-2.5 rounded-full" />
          <h3 className="text-sm font-bold text-gray-900">Review Queue Clear</h3>
          <p className="text-xs text-gray-500">
            There are currently no completed audit cases awaiting supervisor fieldwork review. All compliant cases are updated in active cycles.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Panel: Cases List */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center shrink-0">
              <span className="text-xs font-bold text-gray-700 uppercase">Cases Awaiting Sign-off</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-bold">{reviewCases.length}</span>
            </div>

            <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
              {reviewCases.map((c) => {
                const isSelected = c.id === selectedCaseId;
                const caseFnd = findings.filter(f => f.caseId === c.id);
                const totalAmount = caseFnd.reduce((s, f) => s + f.amount, 0);

                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCaseId(c.id)}
                    className={`w-full p-4 text-left transition-all hover:bg-slate-50 flex items-start gap-3.5 relative ${
                      isSelected ? "bg-blue-50/35 border-l-4 border-blue-600" : ""
                    }`}
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-gray-400">
                          {c.id}
                        </span>
                        <span className="text-[10px] font-semibold bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-150">
                          Awaiting Sign-off
                        </span>
                      </div>
                      <h4 className="font-bold text-gray-900 text-xs">
                        {c.taxpayerName}
                      </h4>
                      <p className="text-[11px] text-gray-500 line-clamp-2">
                        {c.auditType}
                      </p>
                      
                      <div className="pt-2 flex items-center justify-between text-[10px] text-gray-400 font-medium">
                        <span className="flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          {c.leadAuditorName || "Unassigned"}
                        </span>
                        <span className="font-mono font-bold text-blue-600">
                          MWK {totalAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Selected Case Details */}
          {activeCase && (
            <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
              {/* Header with Buttons */}
              <div className="p-4 border-b border-gray-150 flex items-center justify-between bg-slate-50 shrink-0">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowApprovalModal(true)}
                    className="flex items-center gap-1.5 py-1.5 px-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <Check className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => setShowReworkModal(true)}
                    className="flex items-center gap-1.5 py-1.5 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <CornerUpLeft className="h-4 w-4" />
                    Send for Rework
                  </button>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center gap-1.5 py-1.5 px-3 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                    Reject
                  </button>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <button className="p-1.5 hover:text-gray-600 rounded-lg transition-colors">
                    <Printer className="h-4 w-4" />
                  </button>
                  <button className="p-1.5 hover:text-gray-600 rounded-lg transition-colors">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Pane */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
                {/* Stats / Status banner */}
                <div className="grid grid-cols-3 gap-4 border border-gray-100 rounded-xl p-4 bg-slate-50/50">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
                    <span className="font-bold text-amber-700 text-xs flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                      Awaiting Sign-off
                    </span>
                  </div>
                  <div className="space-y-0.5 border-l border-gray-200 pl-4">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Assigned Auditor</span>
                    <span className="font-bold text-gray-800 text-xs">
                      {activeCase.leadAuditorName || "Unassigned"}
                    </span>
                  </div>
                  <div className="space-y-0.5 border-l border-gray-200 pl-4">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">Fieldwork Completion</span>
                    <span className="font-bold text-gray-800 text-xs font-mono">
                      {new Date(activeCase.createdAt).toLocaleDateString()} 14:32 PM
                    </span>
                  </div>
                </div>

                {/* Summary of Findings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Summary of Findings</h3>
                  
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Executive Summary</h4>
                    <p className="text-gray-600 leading-relaxed bg-blue-50/20 p-3 rounded-lg border border-blue-50/50">
                      {activeCase.notes || `The primary audit objective was to validate the integrity of the transaction ledger reported. Fieldwork has completed, resulting in total recalibrated tax liability base adjustment. Highly recommended to proceed to Assessment stage.`}
                    </p>
                  </div>

                  {/* Identified Risks */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Identified Risks</h4>
                    {activeCaseFindings.length === 0 ? (
                      <p className="text-gray-400 italic">No specific audit findings or risk adjustments logged.</p>
                    ) : (
                      <div className="space-y-2">
                        {activeCaseFindings.map((f, i) => (
                          <div key={f.id} className="flex items-center justify-between p-2.5 bg-white border border-gray-150 rounded-lg">
                            <div className="flex items-center gap-2.5">
                              <span className="bg-red-50 text-red-700 border border-red-100 text-[10px] font-bold rounded px-1.5 py-0.5">
                                High
                              </span>
                              <span className="font-semibold text-gray-800">{f.description}</span>
                            </div>
                            <span className="font-mono font-bold text-gray-900">
                              MWK {f.amount.toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Recommended Actions */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Recommended Actions</h4>
                    <ul className="space-y-1.5 pl-4 list-disc text-gray-600">
                      <li>Enforce standard withholding compliance across foreign service contracts</li>
                      <li>Initiate formal tax adjustment assessment for VAT declarations variance</li>
                      <li>Implement persistent audit trailing on offshore intercompany accounts</li>
                    </ul>
                  </div>

                  {/* Supporting Documentation */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Supporting Documentation</h4>
                    {activeCaseEvidence.length === 0 ? (
                      <p className="text-gray-400 italic">No digital files uploaded in fieldwork workspace vault.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {activeCaseEvidence.map((ev) => (
                          <div key={ev.id} className="flex items-center gap-2.5 p-2.5 border border-gray-200 rounded-lg hover:bg-slate-50 transition-colors">
                            <FileText className="h-5 w-5 text-blue-600" />
                            <div className="flex-1 min-w-0">
                              <span className="font-bold text-gray-800 truncate block">{ev.name}</span>
                              <span className="text-[10px] text-gray-400 font-mono block">{ev.fileSize} • {ev.fileType}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Audit Trail Comments Section */}
                <div className="space-y-4 pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-bold text-gray-900">Audit Comments</h3>
                  
                  {/* List comments */}
                  <div className="space-y-3">
                    {(comments[selectedCaseId] || []).length === 0 ? (
                      <p className="text-gray-400 italic text-[11px]">No workflow comments logged yet.</p>
                    ) : (
                      <div className="space-y-2.5">
                        {(comments[selectedCaseId] || []).map((cmt, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold">
                              <span>{cmt.author}</span>
                              <span>{cmt.time}</span>
                            </div>
                            <p className="text-gray-700 leading-relaxed">{cmt.text}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add supervisor instruction comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-2 font-medium"
                    />
                    <button
                      type="submit"
                      className="bg-slate-900 text-white rounded-lg px-3 py-1.5 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rework Modal */}
      {showReworkModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Return to Fieldwork for Rework
              </h3>
              <button onClick={() => setShowReworkModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <p className="text-gray-500 leading-relaxed">
                Specify the rework instructions and required corrective findings that the Lead Auditor must complete before re-submitting for sign-off.
              </p>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Rework instructions</label>
                <textarea
                  placeholder="e.g. Please verify intercompany licensing agreement contracts for secondary nodes..."
                  rows={4}
                  value={reworkNotes}
                  onChange={(e) => setReworkNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 p-2.5 rounded-lg text-gray-800"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowReworkModal(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeSendRework}
                  disabled={!reworkNotes.trim()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Confirm Rework Order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <Check className="h-5 w-5 text-emerald-500" />
                Approve Case Fieldwork
              </h3>
              <button onClick={() => setShowApprovalModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <p className="text-gray-500 leading-relaxed">
                Provide the final compliance sign-off signature for this case, progressing the workflow into Assessment and Audit Draft Issuance.
              </p>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Approval Signature Notes</label>
                <textarea
                  placeholder="e.g. Fieldwork assessed and confirmed. Recalibration accuracy is verified."
                  rows={3}
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 p-2.5 rounded-lg text-gray-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeApprove}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Approve and Authorize
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <X className="h-5 w-5 text-red-500" />
                Reject Case Audit
              </h3>
              <button onClick={() => setShowRejectModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <p className="text-gray-500 leading-relaxed">
                Specify the formal reason for terminating and rejecting this compliance audit. This will permanently record the action in the legal trail.
              </p>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Formal Rejection Notes</label>
                <textarea
                  placeholder="Provide formal rejection grounds..."
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 p-2.5 rounded-lg text-gray-800"
                  required
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeReject}
                  disabled={!rejectNotes.trim()}
                  className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
