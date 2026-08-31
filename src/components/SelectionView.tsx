import React from "react";
import { 
  AuditCase, 
  RiskAssessment, 
  User, 
  UserRole 
} from "../types";
import { 
  Users, 
  TrendingUp, 
  CheckCircle2, 
  Settings2, 
  Filter, 
  UserPlus, 
  Ban, 
  AreaChart, 
  FileJson, 
  ShieldAlert,
  ChevronRight,
  Sparkles
} from "lucide-react";

interface SelectionViewProps {
  cases: AuditCase[];
  riskAssessments: RiskAssessment[];
  allUsers: User[];
  onAssignAuditor: (caseId: string, auditorId: string) => void;
  onRejectCase: (caseId: string, notes: string) => void;
  onSelectCase: (caseId: string) => void;
  onOpenSettings: () => void;
  activeRole: UserRole;
}

export default function SelectionView({
  cases,
  riskAssessments,
  allUsers,
  onAssignAuditor,
  onRejectCase,
  onSelectCase,
  onOpenSettings,
  activeRole,
}: SelectionViewProps) {
  // Filter for cases in triage (SELECTED stage)
  const triageCases = cases.filter(c => c.stage === "SELECTED");

  // Pagination states
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(triageCases.length / pageSize) || 1;
  const paginatedTriageCases = triageCases.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  // Track selected TIN for right sidebar context
  const [selectedCaseId, setSelectedCaseId] = React.useState<string | null>(
    triageCases.length > 0 ? triageCases[0].id : (cases.length > 0 ? cases[0].id : null)
  );

  const selectedCase = cases.find(c => c.id === selectedCaseId);
  const selectedRisk = selectedCase 
    ? riskAssessments.find(r => r.tin === selectedCase.tin) 
    : (riskAssessments.length > 0 ? riskAssessments[0] : null);

  const [assignedAuditorId, setAssignedAuditorId] = React.useState("");
  const [rejectionNotes, setRejectionNotes] = React.useState("");
  const [showRejectionForm, setShowRejectionForm] = React.useState(false);

  // Auditors lists for assignment
  const auditors = allUsers.filter(u => u.role === UserRole.AUDITOR);

  const handleAssign = (caseId: string) => {
    if (!assignedAuditorId) return;
    onAssignAuditor(caseId, assignedAuditorId);
    setAssignedAuditorId("");
  };

  const handleReject = (caseId: string) => {
    if (!rejectionNotes) return;
    onRejectCase(caseId, rejectionNotes);
    setRejectionNotes("");
    setShowRejectionForm(false);
  };

  return (
    <div className="space-y-6" id="selection-view-root">
      {/* Selection Subheading Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Case Selection & Triage</h2>
          <p className="text-xs text-gray-500 mt-1">Reviewing newly identified high-risk taxpayers for audit cycle 2024-Q3.</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4 text-gray-500" />
            Filters
          </button>
          <button 
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            <Settings2 className="h-4 w-4" />
            Risk Score Analysis
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="triage-metrics">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Awaiting Triage</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{triageCases.length}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +12% backlog trend
            </span>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <Users className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">High Risk Density</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">
              {riskAssessments.filter(r => r.score > 85).length}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 mt-1">
              Critical score &gt; 85
            </span>
          </div>
          <div className="bg-red-50 p-3 rounded-lg text-red-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Engine Efficiency</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">94.2%</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
              <CheckCircle2 className="h-3 w-3" />
              Machine learning verified
            </span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-500">
            <CheckCircle2 className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Newly Selected Cases & Sidebar Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table of selected cases */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <span className="text-xs font-bold text-gray-700">Newly Selected Cases</span>
            <span className="text-[10px] font-mono text-gray-400">Last risk engine run: 2 hours ago</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">TIN</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase">Risk Score</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Risk Method</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-500 uppercase">Selection Date</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-150">
                {paginatedTriageCases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-gray-400 font-medium">
                      All cases triaged! No pending selections. Run a simulation in Risk Score Analysis to generate more.
                    </td>
                  </tr>
                ) : (
                  paginatedTriageCases.map((c) => {
                    const r = riskAssessments.find(ri => ri.tin === c.tin);
                    const isSelectedRow = selectedCaseId === c.id;
                    const score = r ? r.score : 0;

                    return (
                      <tr 
                        key={c.id} 
                        className={`hover:bg-blue-50/20 cursor-pointer transition-colors ${
                          isSelectedRow ? "bg-blue-50/50 border-l-4 border-blue-500" : ""
                        }`}
                        onClick={() => setSelectedCaseId(c.id)}
                      >
                        <td className="px-4 py-4 font-semibold text-gray-900 font-mono">
                          {c.tin}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                            score >= 85 ? "bg-red-50 text-red-700" :
                            score >= 50 ? "bg-amber-50 text-amber-700" :
                            "bg-emerald-50 text-emerald-700"
                          }`}>
                            {score}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-600 font-medium">
                          {r ? r.method : "Statistical Intake"}
                        </td>
                        <td className="px-4 py-4 text-gray-500">
                          {r ? r.selectionDate : c.createdAt}
                        </td>
                        <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-center gap-1.5">
                            {/* Quick assignment button */}
                            <button 
                              onClick={() => {
                                setSelectedCaseId(c.id);
                                setShowRejectionForm(false);
                              }}
                              className="p-1 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                              title="Assign Auditor"
                            >
                              <UserPlus className="h-4 w-4" />
                            </button>
                            {/* Reject Button */}
                            <button 
                              onClick={() => {
                                setSelectedCaseId(c.id);
                                setShowRejectionForm(true);
                              }}
                              className="p-1 rounded hover:bg-red-50 text-red-600 transition-colors"
                              title="Reject Case"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                            {/* Go to case detail fieldwork tab */}
                            <button 
                              onClick={() => onSelectCase(c.id)}
                              className="p-1 rounded hover:bg-slate-100 text-slate-600 transition-colors"
                              title="Fieldwork Workspace"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Beautiful Pagination Footer */}
          <div className="p-4 border-t border-gray-150 flex items-center justify-between bg-white text-xs text-gray-500 shrink-0">
            <div>
              Showing <span className="font-semibold">{paginatedTriageCases.length}</span> of{" "}
              <span className="font-semibold">{triageCases.length.toLocaleString()}</span> triaged cases
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

          <div className="p-4 border-t border-gray-100 text-[11px] text-gray-400 bg-gray-50/50">
            Triage enforces an immutable 14-day statutory SLA window for lead auditor assignment.
          </div>
        </div>

        {/* Sidebar Focused Context Detail */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-5">
          <div className="border-b border-gray-100 pb-3">
            <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-red-600 text-white leading-none">
              Critical Risk
            </span>
            <h4 className="font-bold text-gray-900 text-base font-mono mt-2" id="focused-tin">
              {selectedCase?.tin || "No Case Selected"}
            </h4>
            <p className="text-xs text-gray-500 mt-1 font-semibold text-gray-800">
              {selectedCase?.taxpayerName || "Select a row to inspect statistical telemetry"}
            </p>
          </div>

          {selectedRisk && (
            <>
              {/* Factor Contribution Chart */}
              <div className="space-y-3">
                <h5 className="text-xs font-semibold text-gray-700">Factor Contribution</h5>
                <div className="space-y-2">
                  {selectedRisk.factors.map((f, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-[11px] text-gray-500 mb-1">
                        <span>{f.name}</span>
                        <span className="font-bold text-gray-800">{f.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-red-500 h-full rounded-full" 
                          style={{ width: `${f.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw JSON block */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1">
                    <FileJson className="h-3.5 w-3.5 text-gray-400" />
                    ML Model Raw Output (v2.4-stable)
                  </span>
                  <span className="text-[9px] font-mono bg-gray-100 px-1 py-0.5 text-gray-500 rounded">
                    Python Intake Raw
                  </span>
                </div>
                <div className="bg-slate-950 text-emerald-400 font-mono text-[10px] p-4 rounded-lg overflow-x-auto h-56 border border-slate-900 shadow-inner">
                  <pre>{selectedRisk.rawOutput}</pre>
                </div>
              </div>
            </>
          )}

          {/* Interactive Gated Action panel */}
          {selectedCase && (
            <div className="bg-slate-50 border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 block">Triage Actions</span>
                {activeRole === UserRole.AUDITOR && (
                  <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    READ-ONLY
                  </span>
                )}
              </div>

              {activeRole === UserRole.AUDITOR ? (
                <div className="space-y-3">
                  <div className="bg-amber-50/50 border border-amber-150 p-3 rounded-lg text-[11px] leading-relaxed text-amber-900 space-y-1.5">
                    <p className="font-semibold text-amber-950 flex items-center gap-1">
                      <ShieldAlert className="h-4 w-4 text-amber-600" />
                      Supervisor Gating Active
                    </p>
                    <p>
                      Auditor profiles are read-only for final triage. However, you can draft and queue an official assignment recommendation proposal below.
                    </p>
                  </div>
                  
                  {/* Proposal Form */}
                  <div className="space-y-2 border-t border-gray-200 pt-3">
                    <label className="text-[10px] uppercase font-semibold text-gray-500 block">Propose Lead Auditor</label>
                    <select
                      value={assignedAuditorId}
                      onChange={(e) => setAssignedAuditorId(e.target.value)}
                      className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Proposed Auditor...</option>
                      {auditors.map(aud => (
                        <option key={aud.id} value={aud.id}>{aud.name}</option>
                      ))}
                    </select>

                    <label className="text-[10px] uppercase font-semibold text-gray-500 block">Triage Justification Notes</label>
                    <textarea
                      rows={2}
                      value={rejectionNotes}
                      onChange={(e) => setRejectionNotes(e.target.value)}
                      placeholder="Explain why this taxpayer warrants a detailed compliance audit..."
                      className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />

                    <button
                      onClick={() => {
                        if (!assignedAuditorId || !rejectionNotes) return;
                        // Trigger assignment
                        onAssignAuditor(selectedCase.id, assignedAuditorId);
                        setAssignedAuditorId("");
                        setRejectionNotes("");
                      }}
                      disabled={!assignedAuditorId || !rejectionNotes}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Queue Assignment Proposal
                    </button>
                  </div>
                </div>
              ) : !showRejectionForm ? (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-semibold text-gray-500">Assign Lead Auditor</label>
                  <div className="flex gap-2">
                    <select
                      value={assignedAuditorId}
                      onChange={(e) => setAssignedAuditorId(e.target.value)}
                      className="flex-1 text-xs border border-gray-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">Select Auditor...</option>
                      {auditors.map(aud => (
                        <option key={aud.id} value={aud.id}>{aud.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(selectedCase.id)}
                      disabled={!assignedAuditorId}
                      className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white text-xs font-bold px-3 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Assign
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-semibold text-red-600 block">Confirm Case Rejection</label>
                  <p className="text-[10px] text-gray-500">Rejection requires formal justification and supervisor gating approval.</p>
                  <textarea
                    rows={2}
                    value={rejectionNotes}
                    onChange={(e) => setRejectionNotes(e.target.value)}
                    placeholder="Enter rejection reasons (statutory justification is mandatory)..."
                    className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowRejectionForm(false)}
                      className="text-xs font-semibold px-2.5 py-1 text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleReject(selectedCase.id)}
                      disabled={!rejectionNotes}
                      className="bg-red-600 hover:bg-red-500 disabled:bg-red-300 text-white text-xs font-bold px-3 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="h-3 w-3" />
                      Queue Rejection
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
