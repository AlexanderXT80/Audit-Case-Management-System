import React from "react";
import { 
  Activity, 
  Cpu, 
  Clock, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowUpRight, 
  UserPlus, 
  Scroll, 
  Terminal
} from "lucide-react";
import { AuditLogEntry, User } from "../types";

interface AdminDashboardViewProps {
  auditLogs: AuditLogEntry[];
  allUsers: User[];
  onSelectTab: (tab: string) => void;
  onOpenCreateUser: () => void;
}

export default function AdminDashboardView({
  auditLogs,
  allUsers,
  onSelectTab,
  onOpenCreateUser
}: AdminDashboardViewProps) {
  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const pageSize = 5;

  // Extract administrative logs
  const adminLogs = auditLogs.filter(log => 
    log.action.includes("USER") || 
    log.action.includes("CONFIG") || 
    log.action.includes("SYSTEM") ||
    log.action.includes("LOGIN") ||
    log.role === "ADMIN"
  );

  const totalPages = Math.ceil(adminLogs.length / pageSize) || 1;
  const paginatedAdminLogs = adminLogs.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Active staff count (mocked telemetry based on users)
  const activeStaffCount = allUsers.filter(u => u.active).length;

  return (
    <div className="space-y-6 font-sans" id="admin-dashboard-container">
      {/* Top Welcome / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-slate-900 to-blue-950 p-6 rounded-2xl text-white shadow-md">
        <div>
          <h2 className="text-xl font-bold tracking-tight">System Control Center</h2>
          <p className="text-xs text-slate-300 mt-1">
            Real-time infrastructure health, telemetry status, and administrative logs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab("admin-logs")}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            id="admin-view-logs-btn"
          >
            <Scroll className="h-4 w-4 text-blue-400" />
            View System Logs
          </button>
          <button
            onClick={onOpenCreateUser}
            className="flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            id="admin-create-user-btn"
          >
            <UserPlus className="h-4 w-4" />
            Create New User
          </button>
        </div>
      </div>

      {/* Grid of System Telemetry Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="admin-telemetry-grid">
        {/* System Health */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">System Health</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">99.98%</span>
              <span className="text-[10px] text-emerald-600 font-semibold flex items-center">
                +0.02%
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs text-slate-500 font-medium">All systems operational</span>
            </div>
          </div>
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
            <Cpu className="h-5 w-5" />
          </div>
        </div>

        {/* Avg Response Time */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Avg Response Time</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">124ms</span>
              <span className="text-[10px] text-slate-500 font-semibold">Gateway API</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>42ms DB database latency</span>
            </div>
          </div>
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
        </div>

        {/* Staff Active Sessions */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Staff Active Sessions</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{activeStaffCount}</span>
              <span className="text-[10px] text-blue-600 font-semibold">Accounts Active</span>
            </div>
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              {allUsers.slice(0, 4).map((user, idx) => (
                <div 
                  key={user.id || idx}
                  className="h-5 w-5 rounded-full ring-2 ring-white bg-slate-200 text-slate-600 font-bold text-[9px] flex items-center justify-center border border-slate-100 uppercase overflow-hidden"
                  title={user.name}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>
              ))}
              {allUsers.length > 4 && (
                <span className="text-[10px] text-slate-500 font-bold pl-2">+{allUsers.length - 4} more</span>
              )}
            </div>
          </div>
          <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Security Logs Count */}
        <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden group">
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">System Logs Captured</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 tracking-tight">{auditLogs.length}</span>
              <span className="text-[10px] text-red-600 font-semibold flex items-center">
                Secured
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Terminal className="h-3.5 w-3.5 text-amber-500" />
              <span>Full compliance audit trail</span>
            </div>
          </div>
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg">
            <ShieldCheck className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="admin-actions-table-card">
        <div className="p-5 border-b border-slate-150 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Administrative Actions</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Secure ledger logging state machine changes, credentials updates, and account edits.
            </p>
          </div>
          <span className="text-[10px] font-mono font-semibold bg-blue-50 text-blue-700 px-2.5 py-1 rounded border border-blue-150">
            LEDGER_COMPLIANCE: VERIFIED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="p-4 w-44">Timestamp</th>
                <th className="p-4 w-48">Administrator</th>
                <th className="p-4 w-48">Action</th>
                <th className="p-4 w-32">Module</th>
                <th className="p-4 w-32">Status</th>
                <th className="p-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {paginatedAdminLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                    No recent administrative log entries found.
                  </td>
                </tr>
              ) : (
                paginatedAdminLogs.map((log) => {
                  const isSuccess = !log.action.includes("FAILED") && !log.action.includes("ALARM");
                  const isAlarm = log.action.includes("ALARM") || log.action.includes("WARN");
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/75 transition-colors">
                      <td className="p-4 text-slate-500 font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          year: "numeric",
                          month: "2-digit",
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false
                        })}
                      </td>
                      <td className="p-4 text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center font-semibold text-[9px] text-slate-600">
                            {log.performedBy.charAt(0)}
                          </div>
                          <span className="truncate max-w-[150px]" title={log.performedBy}>
                            {log.performedBy}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-slate-800 font-mono text-[11px]">
                        {log.action}
                      </td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          {log.action.includes("USER") ? "Identity" : log.action.includes("CONFIG") ? "Security" : log.action.includes("ALARM") ? "System" : "Audit"}
                        </span>
                      </td>
                      <td className="p-4">
                        {isAlarm ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertTriangle className="h-3 w-3" />
                            Warning
                          </span>
                        ) : isSuccess ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ShieldCheck className="h-3 w-3" />
                            Success
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="h-3 w-3" />
                            Failed
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Beautiful Pagination Footer */}
        {adminLogs.length > 0 && (
          <div className="p-4 border-t border-gray-150 flex items-center justify-between bg-white text-xs text-gray-500 shrink-0">
            <div>
              Showing <span className="font-semibold">{paginatedAdminLogs.length}</span> of{" "}
              <span className="font-semibold">{adminLogs.length.toLocaleString()}</span> administrative records
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
    </div>
  );
}
