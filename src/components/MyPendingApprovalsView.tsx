import React, { useState } from "react";
import { 
  ApprovalRequest, 
  AuditCase, 
  UserRole,
  User 
} from "../types";
import { 
  Check, 
  CornerUpLeft, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  BookOpen, 
  HardDrive, 
  ChevronRight, 
  Layers, 
  TrendingUp, 
  CheckSquare 
} from "lucide-react";

interface MyPendingApprovalsViewProps {
  approvals: ApprovalRequest[];
  cases: AuditCase[];
  currentUser: User | null;
  onDecideApproval: (id: string, decision: "APPROVED" | "REJECTED", notes: string) => void;
  onTransitionStage: (caseId: string, toStage: any, notes: string) => void;
}

export default function MyPendingApprovalsView({
  approvals,
  cases,
  currentUser,
  onDecideApproval,
  onTransitionStage
}: MyPendingApprovalsViewProps) {
  const pendingApprovals = approvals.filter(a => a.status === "PENDING");
  const completedApprovals = approvals.filter(a => a.status !== "PENDING");

  const [activeTab, setActiveTab] = useState<"all" | "escalated">("all");
  const [selectedApprovalIds, setSelectedApprovalIds] = useState<string[]>([]);
  const [showReworkModal, setShowReworkModal] = useState(false);
  const [showBatchApproveModal, setShowBatchApproveModal] = useState(false);
  const [modalNotes, setModalNotes] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedApprovalIds(pendingApprovals.map(a => a.id));
    } else {
      setSelectedApprovalIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedApprovalIds(prev => [...prev, id]);
    } else {
      setSelectedApprovalIds(prev => prev.filter(x => x !== id));
    }
  };

  const executeBatchApprove = () => {
    if (selectedApprovalIds.length === 0) return;
    selectedApprovalIds.forEach(id => {
      onDecideApproval(id, "APPROVED", modalNotes || "Batch approved by Supervisor.");
    });
    setSelectedApprovalIds([]);
    setModalNotes("");
    setShowBatchApproveModal(false);
  };

  const executeBatchRework = () => {
    if (selectedApprovalIds.length === 0) return;
    selectedApprovalIds.forEach(id => {
      onDecideApproval(id, "REJECTED", modalNotes || "Rework requested for further audit evidence gathering.");
    });
    setSelectedApprovalIds([]);
    setModalNotes("");
    setShowReworkModal(false);
  };

  // Map approvals to table details
  const getApprovalDetail = (app: ApprovalRequest) => {
    const matchedCase = cases.find(c => c.id === app.caseId);
    
    // Derive complexity and urgency based on financial impact
    const impact = matchedCase?.financialImpact || 100000;
    let complexity = "Low";
    let complexityRating = 2; // out of 5
    let urgency = "ROUTINE";
    let deadline = "Oct 28, 17:00";

    if (impact > 15000000) {
      complexity = "Extensive";
      complexityRating = 5;
      urgency = "CRITICAL";
      deadline = "2h 15m";
    } else if (impact > 5000000) {
      complexity = "High";
      complexityRating = 4;
      urgency = "ELEVATED";
      deadline = "8h 45m";
    } else if (impact > 2000000) {
      complexity = "Medium";
      complexityRating = 3;
      urgency = "ELEVATED";
      deadline = "Oct 26, 12:00";
    }

    return {
      id: app.id,
      caseId: app.caseId,
      entityName: matchedCase?.taxpayerName || "Corporate Taxpayer Lead",
      type: app.entityType === "ASSESSMENT" ? "Tax Assessment Gating" : 
            app.entityType === "CASE_CLOSURE" ? "Case Closure Request" : "Case Rejection Request",
      urgency,
      complexity,
      complexityRating,
      deadline,
      impact,
      requester: app.requesterName
    };
  };

  const mappedPending = pendingApprovals.map(getApprovalDetail);
  
  // Escalated filter: show only CRITICAL or ELEVATED cases
  const displayedApprovals = activeTab === "all" 
    ? mappedPending 
    : mappedPending.filter(x => x.urgency === "CRITICAL" || x.urgency === "ELEVATED");

  const totalPages = Math.ceil(displayedApprovals.length / pageSize) || 1;
  const paginatedApprovals = displayedApprovals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const criticalCount = mappedPending.filter(x => x.urgency === "CRITICAL").length;

  return (
    <div className="space-y-6" id="my-pending-approvals-view">
      {/* Top Banner and Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">My Pending Approvals</h2>
          <p className="text-xs text-gray-500 mt-1">
            Final sign-off authority for high-risk audits. Review the evidence gathered and confirm compliance status for assigned cases.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              if (selectedApprovalIds.length > 0) setShowBatchApproveModal(true);
            }}
            disabled={selectedApprovalIds.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            Batch Approve ({selectedApprovalIds.length})
          </button>
          <button
            onClick={() => {
              if (selectedApprovalIds.length > 0) setShowReworkModal(true);
            }}
            disabled={selectedApprovalIds.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CornerUpLeft className="h-4 w-4" />
            Rework Selected
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Assigned</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">
            {pendingApprovals.length.toString().padStart(2, "0")}
          </span>
          <span className="text-[10px] text-gray-400 block mt-1">Pending joint-signatures</span>
        </div>
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Critical Urgency</span>
          <span className="text-2xl font-bold text-amber-600 mt-1 block">
            {criticalCount.toString().padStart(2, "0")}
          </span>
          <span className="text-[10px] text-amber-600 font-semibold block mt-1">Requires immediate attention</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Avg. Time in Queue</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">1.4 Days</span>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Within SLA compliance</span>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Approval Accuracy</span>
          <span className="text-2xl font-bold text-gray-900 mt-1 block">99.2%</span>
          <span className="text-[10px] text-gray-400 block mt-1">Q3 Performance Rating</span>
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Table Tabs Filter */}
        <div className="px-5 py-3 border-b border-gray-150 bg-gray-50 flex items-center justify-between">
          <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                activeTab === "all"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              All Pending ({mappedPending.length})
            </button>
            <button
              onClick={() => setActiveTab("escalated")}
              className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${
                activeTab === "escalated"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Escalated ({mappedPending.filter(x => x.urgency === "CRITICAL" || x.urgency === "ELEVATED").length})
            </button>
          </div>
          <span className="text-[10px] text-gray-400 font-mono">SECURE MOCKED DB</span>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto text-xs">
          {displayedApprovals.length === 0 ? (
            <div className="p-12 text-center text-gray-400 italic">
              No pending approval requests found matching the current tab criteria.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3 text-left w-10">
                    <input
                      type="checkbox"
                      checked={selectedApprovalIds.length === pendingApprovals.length && pendingApprovals.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                    />
                  </th>
                  <th className="px-5 py-3 text-left">Case ID & Entity</th>
                  <th className="px-5 py-3 text-left">Request Type</th>
                  <th className="px-5 py-3 text-left">Urgency</th>
                  <th className="px-5 py-3 text-left">Complexity</th>
                  <th className="px-5 py-3 text-left">Deadline</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {paginatedApprovals.map((item) => {
                  const isChecked = selectedApprovalIds.includes(item.id);
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isChecked ? "bg-blue-50/10" : ""}`}>
                      <td className="px-5 py-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectOne(item.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                      </td>
                      <td className="px-5 py-3">
                        <div className="font-semibold text-gray-900">{item.entityName}</div>
                        <div className="font-mono text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <span>{item.caseId}</span>
                          <span>•</span>
                          <span>MWK {item.impact.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-medium text-gray-700">
                        {item.type}
                        <div className="text-[10px] text-gray-400 mt-0.5">By {item.requester}</div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.urgency === "CRITICAL" ? "bg-red-50 text-red-700 border border-red-100 animate-pulse" :
                          item.urgency === "ELEVATED" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                          "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>
                          {item.urgency}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 text-gray-500 font-medium">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((dot) => (
                              <span
                                key={dot}
                                className={`h-1.5 w-1.5 rounded-full ${
                                  dot <= item.complexityRating ? "bg-blue-600" : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] ml-1">{item.complexity}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-mono text-gray-600 font-semibold">
                        {item.deadline}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => onDecideApproval(item.id, "APPROVED", "Approved by Supervisor.")}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 py-1 px-2.5 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => onDecideApproval(item.id, "REJECTED", "Rework requested by Supervisor.")}
                            className="bg-red-50 text-red-700 hover:bg-red-100 py-1 px-2 rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                          >
                            Rework
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Beautiful Pagination Footer */}
        {displayedApprovals.length > 0 && (
          <div className="p-4 border-t border-gray-150 flex items-center justify-between bg-white text-xs text-gray-500 shrink-0">
            <div>
              Showing <span className="font-semibold">{paginatedApprovals.length}</span> of{" "}
              <span className="font-semibold">{displayedApprovals.length.toLocaleString()}</span> approvals
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

      {/* Grid: Guidance and System Integrity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Supervisor Guidance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Supervisor Guidance
          </h3>
          <ul className="space-y-2.5 text-xs text-gray-600 pl-4 list-disc leading-relaxed">
            <li>
              Ensure all <strong>High Complexity</strong> cases have a secondary verification from the compliance officer before final approval.
            </li>
            <li>
              Verify jurisdictional compliance for cross-state operations.
            </li>
            <li>
              Check audit trail consistency across all reviewers.
            </li>
          </ul>
        </div>

        {/* System Integrity Status */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <HardDrive className="h-4 w-4 text-emerald-600" />
            SYSTEM INTEGRITY STATUS
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Real-time Sync</span>
              <span className="font-bold text-emerald-700 flex items-center justify-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
                ONLINE
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Auth Protocol</span>
              <span className="font-mono font-bold text-gray-800">TLS 1.3</span>
            </div>
            <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 space-y-1">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">DB Latency</span>
              <span className="font-mono font-bold text-gray-800">14ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Batch Approve Modal */}
      {showBatchApproveModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                Batch Approve Requests
              </h3>
              <button onClick={() => setShowBatchApproveModal(false)} className="text-gray-400 hover:text-gray-600">
                <Check className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <p className="text-gray-500 leading-relaxed">
                You are about to batch approve <strong>{selectedApprovalIds.length}</strong> pending transition and assessment requests. This is an immutable sign-off action.
              </p>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Batch Approval Notes</label>
                <textarea
                  placeholder="e.g. Batch compliance verification approved and signed."
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 p-2.5 rounded-lg text-gray-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowBatchApproveModal(false)}
                  className="px-3.5 py-1.5 border border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={executeBatchApprove}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Authorize Batch Approvals
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Rework Modal */}
      {showReworkModal && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Batch Rework Orders
              </h3>
              <button onClick={() => setShowReworkModal(false)} className="text-gray-400 hover:text-gray-600">
                <Check className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <p className="text-gray-500 leading-relaxed">
                You are requesting rework for <strong>{selectedApprovalIds.length}</strong> selected cases. This will return these requests to the Lead Auditors.
              </p>
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500 mb-1">Rework instructions</label>
                <textarea
                  placeholder="Specify corrective audit instructions..."
                  rows={3}
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
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
                  onClick={executeBatchRework}
                  disabled={!modalNotes.trim()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors disabled:opacity-50"
                >
                  Confirm Rework Orders
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
