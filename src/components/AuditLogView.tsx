import React from "react";
import { AuditLogEntry, UserRole, User } from "../types";
import { FileSearch, Search, ShieldCheck, Filter, Lock, ShieldAlert, Eye } from "lucide-react";

interface AuditLogViewProps {
  auditLogs: AuditLogEntry[];
  activeRole: UserRole;
  currentUser: User | null;
}

export default function AuditLogView({ auditLogs, activeRole, currentUser }: AuditLogViewProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 5;

  const isSupervisorOrAdmin = activeRole === UserRole.SUPERVISOR || activeRole === UserRole.ADMIN;

  const filteredLogs = auditLogs.filter(log => {
    // If not supervisor/admin, only show logs performed by current user
    if (!isSupervisorOrAdmin && currentUser) {
      const isMyLog = log.performedBy.toLowerCase().includes(currentUser.name.toLowerCase());
      if (!isMyLog) return false;
    }

    const term = searchTerm.toLowerCase();
    return (
      log.performedBy.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      log.details.toLowerCase().includes(term) ||
      (log.caseId && log.caseId.toLowerCase().includes(term))
    );
  });

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalCount = filteredLogs.length;
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden" id="audit-log-root">
      <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="font-bold text-gray-900 text-base">
            {isSupervisorOrAdmin ? "Global Statutory Compliance Audit Trail" : "My Personal Compliance Activity Journal"}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {isSupervisorOrAdmin 
              ? "Immutable, system-authoritative logging of user and machine interactions. Gated for judicial appeal review."
              : "Immutable record of all actions performed by your active session. Provided for statutory tracking."}
          </p>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 text-white rounded-lg text-[10px] font-bold font-mono">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          {isSupervisorOrAdmin ? "LEDGER WRITE-GATED" : "PERSONAL LOGS ONLY"}
        </span>
      </div>

      {!isSupervisorOrAdmin && (
        <div className="m-4 bg-blue-50 border border-blue-150 p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed text-blue-900">
          <Eye className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="block text-blue-950">Scoped Auditor View Active</strong>
            <p className="mt-1">
              Under standard agency governance frameworks, access to the global compliance ledger is reserved for Supervisors and Administrators. You are currently viewing an immutable, filtered record of actions performed exclusively by your profile.
            </p>
          </div>
        </div>
      )}

      <>
        {/* Filter and Search Bar */}
        <div className="p-4 border-b border-gray-100 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Actor, Action, Case ID, or Justification grounds details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors">
            <Filter className="h-4 w-4 text-gray-500" />
            Type
          </button>
        </div>

        {/* Main Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 font-semibold text-gray-500 uppercase tracking-wider text-left">
              <tr>
                <th className="px-6 py-3">Timestamp (UTC)</th>
                <th className="px-6 py-3">Actor (Role)</th>
                <th className="px-6 py-3">Action Type</th>
                <th className="px-6 py-3">Case ID</th>
                <th className="px-6 py-3">Grounds & Details Justification</th>
                <th className="px-6 py-3 text-right">IP Address</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-150">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No logs found matching search criteria.</td>
                </tr>
              ) : (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toISOString().replace("T", " ").slice(0, 19)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900 block">{log.performedBy}</span>
                      <span className="text-[10px] text-gray-400">{log.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-700 border border-slate-150">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-blue-700">
                      {log.caseId || "N/A"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 font-medium max-w-xs truncate" title={log.details}>
                      {log.details}
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-gray-400">
                      {log.ip}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Beautiful Pagination Footer */}
        <div className="p-4 border-t border-gray-150 flex items-center justify-between bg-white text-xs text-gray-500">
          <div>
            Showing <span className="font-semibold">{paginatedLogs.length}</span> of{" "}
            <span className="font-semibold">{filteredLogs.length.toLocaleString()}</span> audit records
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
      </>
    </div>
  );
}
