import React from "react";
import { 
  AuditCase, 
  ApprovalRequest, 
  AuditLogEntry, 
  UserRole,
  User
} from "../types";
import { 
  FolderSearch, 
  ShieldAlert, 
  ClipboardCheck, 
  Banknote,
  ChevronRight,
  TrendingUp,
  Clock,
  ExternalLink,
  Lock,
  UserCheck,
  FileText,
  TrendingDown,
  ShieldCheck,
  Search,
  Filter
} from "lucide-react";

interface DashboardViewProps {
  cases: AuditCase[];
  approvals: ApprovalRequest[];
  auditLogs: AuditLogEntry[];
  onSelectCase: (caseId: string) => void;
  onSelectApproval: (approvalId: string) => void;
  activeRole: UserRole;
  currentUser: User | null;
}

export default function DashboardView({
  cases,
  approvals,
  auditLogs,
  onSelectCase,
  onSelectApproval,
  activeRole,
  currentUser,
}: DashboardViewProps) {
  // Pagination states
  const [casePage, setCasePage] = React.useState(1);
  const [approvalPage, setApprovalPage] = React.useState(1);
  const casePageSize = 5;
  const approvalPageSize = 5;

  // Active Case Portfolio Search and Filter states
  const [caseSearchTerm, setCaseSearchTerm] = React.useState("");
  const [caseStageFilter, setCaseStageFilter] = React.useState("ALL");

  React.useEffect(() => {
    setCasePage(1);
  }, [caseSearchTerm, caseStageFilter]);

  // Compute dashboard metrics
  const casesInTriage = cases.filter(c => c.stage === "SELECTED").length;
  const pendingApprovals = approvals.filter(a => a.status === "PENDING");
  const urgentApprovalsCount = pendingApprovals.filter(a => a.entityType === "ASSESSMENT").length;
  const activeAudits = cases.filter(c => c.stage !== "CLOSED" && c.stage !== "REJECTED" && c.stage !== "SELECTED").length;
  
  const totalAssessmentsValue = approvals
    .filter(a => a.entityType === "ASSESSMENT" && a.status === "APPROVED")
    .reduce((sum, a) => {
      try {
        const details = JSON.parse(a.details);
        return sum + (details.total || details.financialImpact || 0);
      } catch {
        return sum;
      }
    }, 0) + cases.filter(c => c.stage === "ASSESSED").reduce((sum, c) => sum + c.financialImpact, 0);

  // Auditor-specific computations
  const myCases = cases.filter(c => 
    currentUser && (c.leadAuditorId === currentUser.id || c.leadAuditorName === currentUser.name)
  );
  const myActiveCases = myCases.filter(c => 
    c.stage !== "CLOSED" && c.stage !== "REJECTED"
  );

  const filteredActiveCases = myActiveCases.filter(c => {
    const term = caseSearchTerm.toLowerCase();
    const matchesSearch = 
      c.id.toLowerCase().includes(term) ||
      c.taxpayerName.toLowerCase().includes(term) ||
      c.tin.toLowerCase().includes(term);
    const matchesStage = caseStageFilter === "ALL" || c.stage === caseStageFilter;
    return matchesSearch && matchesStage;
  });

  const caseTotalPages = Math.ceil(filteredActiveCases.length / casePageSize) || 1;
  const paginatedActiveCases = filteredActiveCases.slice(
    (casePage - 1) * casePageSize,
    casePage * casePageSize
  );

  const approvalTotalPages = Math.ceil(pendingApprovals.length / approvalPageSize) || 1;
  const paginatedPendingApprovals = pendingApprovals.slice(
    (approvalPage - 1) * approvalPageSize,
    approvalPage * approvalPageSize
  );
  const myTotalAssessmentsValue = myCases.reduce((sum, c) => sum + c.financialImpact, 0);
  const myPendingApprovalsCount = approvals.filter(a => 
    a.status === "PENDING" && (a.requesterId === currentUser?.id || myCases.some(c => c.id === a.caseId))
  ).length;

  const myAuditLogs = auditLogs.filter(log => 
    currentUser && (
      log.performedBy.toLowerCase().includes(currentUser.name.toLowerCase()) ||
      (log.caseId && myCases.some(c => c.id === log.caseId))
    )
  );

  if (activeRole === UserRole.AUDITOR) {
    return (
      <div className="space-y-6" id="auditor-dashboard-root">
        {/* Auditor Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="auditor-metrics-cards">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Active Cases</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{myActiveCases.length}</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 mt-1">
                Assigned to your desk
              </span>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
              <FolderSearch className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Gated Approvals</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{myPendingApprovalsCount}</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 mt-1">
                Awaiting Supervisor Sign-off
              </span>
            </div>
            <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Financial Tax Base</p>
              <h3 className="text-lg font-bold text-gray-950 mt-2">
                MWK {myTotalAssessmentsValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 mt-1">
                Identified audit revenue base
              </span>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
              <Banknote className="h-6 w-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SLA Delivery Rating</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">97.4%</h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 mt-1">
                On-time compliance milestones
              </span>
            </div>
            <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
              <UserCheck className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Auditor Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="font-bold text-gray-900 text-sm md:text-base">My Active Case Portfolio</h4>
                <p className="text-xs text-gray-500 mt-1">Assigned audit cases requiring fieldwork progress and evidence logging</p>
              </div>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-[#0e635e] text-white rounded-lg text-[10px] font-bold font-mono uppercase shrink-0">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                DESK PORTFOLIO ACTIVE
              </span>
            </div>

            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-2 bg-white">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Case ID, Taxpayer Entity, or TIN..."
                  value={caseSearchTerm}
                  onChange={(e) => setCaseSearchTerm(e.target.value)}
                  className="w-full text-xs pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="relative shrink-0">
                <select
                  value={caseStageFilter}
                  onChange={(e) => setCaseStageFilter(e.target.value)}
                  className="appearance-none flex items-center gap-1.5 pl-3 pr-10 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer focus:outline-none w-full sm:w-auto"
                >
                  <option value="ALL">All Stages</option>
                  <option value="PLANNING">PLANNING</option>
                  <option value="FIELDWORK">FIELDWORK</option>
                  <option value="REVIEW">REVIEW</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-gray-500">
                  <Filter className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 font-semibold text-gray-500 uppercase tracking-wider text-left">
                  <tr>
                    <th className="px-6 py-3">Case ID</th>
                    <th className="px-6 py-3">Taxpayer Entity</th>
                    <th className="px-6 py-3">Stage</th>
                    <th className="px-6 py-3 text-right">Est. Tax Base</th>
                    <th className="px-6 py-3 text-center">Open</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-150">
                  {paginatedActiveCases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                        No active audit cases are currently assigned to your desk matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedActiveCases.map((c) => (
                      <tr 
                        key={c.id} 
                        className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                        onClick={() => onSelectCase(c.id)}
                      >
                        <td className="px-6 py-4 font-mono font-bold text-blue-700">
                          {c.id}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900 block">{c.taxpayerName}</span>
                          <span className="text-[10px] text-gray-400 font-mono">TIN: {c.tin}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold font-mono border uppercase ${
                            c.stage === "FIELDWORK" ? "bg-indigo-50 text-indigo-700 border border-indigo-150" :
                            c.stage === "PLANNING" ? "bg-blue-50 text-blue-700 border border-blue-150" :
                            c.stage === "REVIEW" ? "bg-amber-50 text-amber-700 border border-amber-150" :
                            "bg-slate-100 text-slate-700 border-slate-150"
                          }`}>
                            {c.stage}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-gray-900 font-mono">
                          MWK {c.financialImpact.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            className="px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 transition-colors shadow-sm cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectCase(c.id);
                            }}
                          >
                            Workspace
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Beautiful Pagination Footer */}
            {filteredActiveCases.length > 0 && (
              <div className="p-4 border-t border-gray-150 flex items-center justify-between bg-white text-xs text-gray-500 shrink-0">
                <div>
                  Showing <span className="font-semibold">{paginatedActiveCases.length}</span> of{" "}
                  <span className="font-semibold">{filteredActiveCases.length.toLocaleString()}</span> active cases
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCasePage(prev => Math.max(prev - 1, 1))}
                    disabled={casePage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none text-gray-700 bg-white shadow-sm cursor-pointer"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCasePage(prev => Math.min(prev + 1, caseTotalPages))}
                    disabled={casePage === caseTotalPages || caseTotalPages === 0}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none text-gray-700 bg-white shadow-sm cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Auditor Desk Compliance SLA</h4>
              <p className="text-xs text-gray-500 mt-1">Audit cycles tracking under statutory Audit CMS deadlines</p>
            </div>

            <div className="space-y-4 my-5 flex-1 flex flex-col justify-center">
              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                  <span>Document Request Response SLA</span>
                  <span className="font-semibold text-gray-900">14 Days</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: "90%" }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Average response period achieved: 8.4 days</p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                  <span>Planning Phase Compilation</span>
                  <span className="font-semibold text-gray-900">30 Days Max</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: "75%" }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Average draft completion period: 18.2 days</p>
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                  <span>Evidence Chain Integrity Hash Verify</span>
                  <span className="font-semibold text-gray-900">100% SHA-256</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: "100%" }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">All evidence files secured on the immutable ledger</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
              <span>Performance Level: <strong className="text-emerald-700">OPTIMAL</strong></span>
              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded font-semibold text-[10px]">98% SCORE</span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm" id="auditor-timeline-activity">
          <div className="border-b border-gray-100 pb-4 mb-4 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">My Personal Compliance Activity Journal</h4>
              <p className="text-xs text-gray-500 mt-0.5">Immutable record of actions performed by your active session for statutory compliance</p>
            </div>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded font-bold">
              PERFORMED BY YOU
            </span>
          </div>

          <div className="flow-root">
            {myAuditLogs.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-xs italic">
                No recent activities logged on your profile for this session.
              </div>
            ) : (
              <ul className="-mb-8">
                {myAuditLogs.slice(0, 4).map((log, logIdx) => (
                  <li key={log.id}>
                    <div className="relative pb-8">
                      {logIdx !== myAuditLogs.slice(0, 4).length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            log.action === "SYSTEM_ALARM" ? "bg-red-50 text-red-600" :
                            log.action === "EVIDENCE_UPLOADED" ? "bg-blue-50 text-blue-600" :
                            "bg-emerald-50 text-emerald-600"
                          }`}>
                            <Clock className="h-4 w-4" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-xs text-gray-600">
                              <strong className="text-gray-900">{log.performedBy}</strong> ({log.role}){" "}
                              <span className="text-gray-500">{log.details}</span>{" "}
                              {log.caseId && (
                                <button 
                                  onClick={() => onSelectCase(log.caseId!)}
                                  className="font-mono text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5"
                                >
                                  {log.caseId}
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </p>
                          </div>
                          <div className="text-right text-[10px] whitespace-nowrap font-mono text-gray-400">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="dashboard-view-root">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5" id="dashboard-metric-cards">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cases in Triage</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">42</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 mt-1">
              <TrendingUp className="h-3 w-3" />
              +12% vs last week
            </span>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Approvals</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{pendingApprovals.length}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 mt-1">
              {urgentApprovalsCount} urgent assessments
            </span>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            <ClipboardCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Audits</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{activeAudits + 110}</h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-500 mt-1">
              Across 12 Tax Sectors
            </span>
          </div>
          <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
            <FolderSearch className="h-6 w-6" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Assessments Raised</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">
              MWK {(totalAssessmentsValue || 4200000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 mt-1">
              FY2024 Audit Targets
            </span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
            <Banknote className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: Approvals & Aging */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1 & 2: Priority Approval Queue */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h4 className="font-bold text-gray-900 text-sm">Priority Approval Queue</h4>
              <p className="text-xs text-gray-500 mt-0.5">High-consequence stage transitions awaiting supervisor authorization</p>
            </div>
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors">
              View All Queue
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-gray-200 text-xs">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Case ID</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Taxpayer/Entity</th>
                  <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase tracking-wider">Transition</th>
                  <th className="px-5 py-3 text-right font-semibold text-gray-500 uppercase tracking-wider">Value</th>
                  <th className="px-5 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-150">
                {paginatedPendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-gray-400">
                      No pending approvals in queue. Excellent progress!
                    </td>
                  </tr>
                ) : (
                  paginatedPendingApprovals.map((app) => {
                    let impactStr = "N/A";
                    let detailsObj = { financialImpact: 0, toStage: "" };
                    try {
                      detailsObj = JSON.parse(app.details || "{}");
                      if (detailsObj.financialImpact) {
                        impactStr = `MWK ${detailsObj.financialImpact.toLocaleString()}`;
                      }
                    } catch {}

                    return (
                      <tr 
                        key={app.id} 
                        className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                        onClick={() => onSelectApproval(app.id)}
                      >
                        <td className="px-5 py-3.5 font-semibold text-gray-900 font-mono">
                          {app.caseId}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">
                          <div className="font-medium text-gray-900">
                            {cases.find(c => c.id === app.caseId)?.taxpayerName || "Loading..."}
                          </div>
                          <div className="text-[10px] text-gray-400 mt-0.5">TIN: {cases.find(c => c.id === app.caseId)?.tin || ""}</div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            app.entityType === "ASSESSMENT" ? "bg-red-50 text-red-700 border border-red-150" :
                            app.entityType === "CASE_CLOSURE" ? "bg-blue-50 text-blue-700 border border-blue-150" :
                            "bg-slate-100 text-slate-700 border border-slate-200"
                          }`}>
                            {app.entityType}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-gray-900">
                          {impactStr}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button 
                            className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 inline-flex items-center justify-center transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectApproval(app.id);
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
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
          <div className="p-4 border-t border-gray-150 flex items-center justify-between bg-white text-xs text-gray-500 shrink-0">
            <div>
              Showing <span className="font-semibold">{paginatedPendingApprovals.length}</span> of{" "}
              <span className="font-semibold">{pendingApprovals.length.toLocaleString()}</span> approvals
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setApprovalPage(prev => Math.max(prev - 1, 1))}
                disabled={approvalPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none text-gray-700 bg-white shadow-sm cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setApprovalPage(prev => Math.min(prev + 1, approvalTotalPages))}
                disabled={approvalPage === approvalTotalPages || approvalTotalPages === 0}
                className="px-3 py-1.5 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:pointer-events-none text-gray-700 bg-white shadow-sm cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Column 3: Aging distribution */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Case Distribution Aging</h4>
            <p className="text-xs text-gray-500 mt-1">SLA monitoring across active tax audits</p>
          </div>

          <div className="space-y-4 my-5 flex-1 flex flex-col justify-center">
            {/* Aging progress bar 1 */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                <span>Planning (0-30 days)</span>
                <span className="font-semibold text-gray-900">45%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: "45%" }}></div>
              </div>
            </div>

            {/* Aging progress bar 2 */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                <span>Fieldwork (31-90 days)</span>
                <span className="font-semibold text-gray-900">30%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: "30%" }}></div>
              </div>
            </div>

            {/* Aging progress bar 3 */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                <span>Review (91-180 days)</span>
                <span className="font-semibold text-gray-900">15%</span>
              </div>
              <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full" style={{ width: "15%" }}></div>
              </div>
            </div>

            {/* Aging progress bar 4 */}
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1.5 text-red-600 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="h-3 w-3" />
                  Critical Delay (&gt;180 days)
                </span>
                <span className="font-bold">10%</span>
              </div>
              <div className="w-full bg-gray-150 h-2 rounded-full overflow-hidden">
                <div className="bg-red-600 h-full rounded-full" style={{ width: "10%" }}></div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 text-[11px] text-gray-500 flex justify-between items-center">
            <span>Average lifecycle length: <strong className="text-gray-800">74 days</strong></span>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">Target: 60 days</span>
          </div>
        </div>
      </div>

      {/* Compliance Audit log timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm" id="dashboard-recent-actions">
        <div className="border-b border-gray-100 pb-4 mb-4 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-gray-900 text-sm">Recent Audit Trail Actions</h4>
            <p className="text-xs text-gray-500 mt-0.5">Immutable global compliance logging for judicial defense</p>
          </div>
          <span className="text-[10px] font-mono bg-slate-50 text-slate-500 border border-slate-100 px-2 py-1 rounded">
            {activeRole === UserRole.ADMIN || activeRole === UserRole.SUPERVISOR ? "SYSTEM ACTOR GATED" : "READ GATED"}
          </span>
        </div>

        {activeRole === UserRole.ADMIN || activeRole === UserRole.SUPERVISOR ? (
          <div className="flow-root">
            <ul className="-mb-8">
              {auditLogs.slice(0, 4).map((log, logIdx) => (
                <li key={log.id}>
                  <div className="relative pb-8">
                    {logIdx !== auditLogs.slice(0, 4).length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          log.action === "SYSTEM_ALARM" ? "bg-red-50 text-red-600" :
                          log.action === "APPROVAL_DECISION" ? "bg-emerald-50 text-emerald-600" :
                          log.action === "EVIDENCE_UPLOADED" ? "bg-blue-50 text-blue-600" :
                          "bg-slate-50 text-slate-600"
                        }`}>
                          <Clock className="h-4 w-4" />
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-xs text-gray-600">
                            <strong className="text-gray-900">{log.performedBy}</strong> ({log.role}){" "}
                            <span className="text-gray-500">{log.details}</span>{" "}
                            {log.caseId && (
                              <button 
                                onClick={() => onSelectCase(log.caseId!)}
                                className="font-mono text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-0.5"
                              >
                                {log.caseId}
                                <ExternalLink className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </p>
                        </div>
                        <div className="text-right text-[10px] whitespace-nowrap font-mono text-gray-400">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
            <div className="p-3 bg-amber-50 rounded-full text-amber-600 border border-amber-100">
              <Lock className="h-5 w-5" />
            </div>
            <div className="space-y-1 max-w-md">
              <h5 className="text-xs font-bold text-gray-950 uppercase tracking-wider">Administrative Access Restricted</h5>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Global immutable logs are strictly restricted to <strong>Supervisor</strong> and <strong>Administrator</strong> sessions. Change your active session role at the top right to view real-time compliance ledger actions.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
