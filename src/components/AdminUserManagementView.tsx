import React, { useState } from "react";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  UserMinus, 
  UserCheck, 
  Mail, 
  CheckSquare, 
  Square,
  Shield, 
  Activity,
  MoreVertical,
  X,
  UserCog
} from "lucide-react";
import { User, UserRole } from "../types";

interface AdminUserManagementViewProps {
  allUsers: User[];
  onCreateUser: (user: { name: string; email: string; role: UserRole }) => Promise<void>;
  onUpdateUser: (userId: string, updates: Partial<User>) => Promise<void>;
  onBulkAction: (userIds: string[], action: "deactivate" | "activate" | "assign-role", role?: UserRole) => Promise<void>;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export default function AdminUserManagementView({
  allUsers,
  onCreateUser,
  onUpdateUser,
  onBulkAction,
  showToast
}: AdminUserManagementViewProps) {
  // State for search & filters
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Selection state for bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Dialog / Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  // Controlled form fields
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formRole, setFormRole] = useState<UserRole>(UserRole.AUDITOR);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, statusFilter]);

  // Filtered users list
  const filteredUsers = allUsers.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus = 
      statusFilter === "ALL" || 
      (statusFilter === "ACTIVE" && user.active) || 
      (statusFilter === "INACTIVE" && !user.active);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / pageSize) || 1;
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Toggle selection for a single user
  const handleToggleSelect = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  // Toggle select all on current filtered view
  const handleToggleSelectAll = () => {
    const filteredIds = filteredUsers.map(u => u.id);
    const allSelected = filteredIds.every(id => selectedUserIds.includes(id));

    if (allSelected) {
      setSelectedUserIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedUserIds(prev => {
        const union = new Set([...prev, ...filteredIds]);
        return Array.from(union);
      });
    }
  };

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setModalMode("create");
    setFormName("");
    setFormEmail("");
    setFormRole(UserRole.AUDITOR);
    setEditingUserId(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (user: User) => {
    setModalMode("edit");
    setFormName(user.name);
    setFormEmail(user.email);
    setFormRole(user.role);
    setEditingUserId(user.id);
    setIsModalOpen(true);
  };

  // Submit form handler
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showToast("Please fill in all fields.", "error");
      return;
    }

    try {
      setIsSubmitting(true);
      if (modalMode === "create") {
        await onCreateUser({ name: formName, email: formEmail, role: formRole });
      } else if (editingUserId) {
        await onUpdateUser(editingUserId, { name: formName, email: formEmail, role: formRole });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to process user operation.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick toggle active status
  const handleToggleActive = async (user: User) => {
    try {
      await onUpdateUser(user.id, { active: !user.active });
      showToast(`User ${user.name} successfully ${user.active ? "deactivated" : "activated"}.`, "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update user status.", "error");
    }
  };

  // Bulk deactivation
  const handleBulkDeactivate = async () => {
    if (selectedUserIds.length === 0) return;
    if (confirm(`Are you sure you want to deactivate the ${selectedUserIds.length} selected accounts?`)) {
      try {
        await onBulkAction(selectedUserIds, "deactivate");
        setSelectedUserIds([]);
        showToast("Bulk deactivation complete.", "success");
      } catch (err: any) {
        showToast(err.message || "Bulk operation failed.", "error");
      }
    }
  };

  // Bulk invite resend simulation
  const handleBulkResendInvites = () => {
    if (selectedUserIds.length === 0) return;
    showToast(`Simulation: Successfully resent secure activation invites to ${selectedUserIds.length} users.`, "success");
    setSelectedUserIds([]);
  };

  // Role quick update for bulk selection
  const [showBulkRoleDropdown, setShowBulkRoleDropdown] = useState(false);
  const handleBulkAssignRole = async (role: UserRole) => {
    try {
      await onBulkAction(selectedUserIds, "assign-role", role);
      setSelectedUserIds([]);
      setShowBulkRoleDropdown(false);
      showToast(`Assigned role ${role} to selected accounts.`, "success");
    } catch (err: any) {
      showToast(err.message || "Bulk role assignment failed.", "error");
    }
  };

  // Count helper
  const supervisorCount = allUsers.filter(u => u.role === UserRole.SUPERVISOR).length;
  const auditorCount = allUsers.filter(u => u.role === UserRole.AUDITOR).length;
  const legalCount = allUsers.filter(u => u.role === UserRole.LEGAL).length;
  const adminCount = allUsers.filter(u => u.role === UserRole.ADMIN).length;

  return (
    <div className="space-y-6 font-sans" id="admin-user-management">
      {/* Overview stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="user-stats-dashboard">
        <div className="bg-white border border-slate-200 p-4.5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-lg">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Total Staff</span>
            <span className="text-xl font-bold text-slate-900 tracking-tight">{allUsers.length} Users</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4.5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-lg">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Active Sessions</span>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              {allUsers.filter(u => u.active).length} Online
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4.5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="bg-purple-50 text-purple-600 p-3 rounded-lg">
            <UserCog className="h-5 w-5" />
          </div>
          <div className="text-xs">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Role Distribution</span>
            <div className="font-mono font-bold text-slate-700 mt-1 flex gap-2">
              <span title="Auditor">AUD: {auditorCount}</span>
              <span title="Supervisor">SUP: {supervisorCount}</span>
              <span title="Legal">LEG: {legalCount}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-4.5 rounded-xl flex items-center gap-4 shadow-sm">
          <div className="bg-rose-50 text-rose-600 p-3 rounded-lg">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Security Cleared</span>
            <span className="text-sm font-bold text-slate-900 tracking-tight">L3 Clearance Enforced</span>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="staff-accounts-card">
        {/* Header and Title */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Staff Accounts</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage administrative access and role assignments across the enterprise.
            </p>
          </div>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            id="btn-add-staff"
          >
            <Plus className="h-4 w-4" />
            Create Staff Account
          </button>
        </div>

        {/* Filter controls */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search staff by name or email address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
              id="user-search-input"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-xs text-slate-500 font-medium">Filters:</span>
            </div>

            {/* Role dropdown */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              id="filter-role-dropdown"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="AUDITOR">Auditor</option>
              <option value="LEGAL">Appeals Officer (Legal)</option>
              <option value="ADMIN">System Administrator</option>
            </select>

            {/* Status dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              id="filter-status-dropdown"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Deactivated Only</option>
            </select>
          </div>
        </div>

        {/* User Accounts Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <th className="p-4 w-12 text-center">
                  <button 
                    onClick={handleToggleSelectAll}
                    className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                    id="user-select-all-btn"
                  >
                    {filteredUsers.length > 0 && filteredUsers.every(id => selectedUserIds.includes(id.id)) ? (
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-4 w-60">Staff Member</th>
                <th className="p-4 w-64">Email Address</th>
                <th className="p-4 w-44">Assigned Role</th>
                <th className="p-4 w-32">Account Status</th>
                <th className="p-4 w-40">Security Access</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 font-medium">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400 font-semibold">
                    No staff accounts match the specified filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-50/70 transition-colors ${isSelected ? "bg-blue-50/20" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleToggleSelect(user.id)}
                          className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                          id={`select-user-${user.id}`}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-blue-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </button>
                      </td>

                      {/* Staff Name & Avatar */}
                      <td className="p-4 text-slate-900">
                        <div className="flex items-center gap-2.5">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="h-7 w-7 rounded-full border border-slate-200 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-7 w-7 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center border border-blue-200">
                              {user.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate max-w-[180px]">
                              {user.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">UID: {user.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="p-4 text-slate-500 font-mono select-all">
                        {user.email}
                      </td>

                      {/* Role Badge */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold border ${
                          user.role === UserRole.ADMIN 
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : user.role === UserRole.SUPERVISOR
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : user.role === UserRole.LEGAL
                            ? "bg-teal-50 text-teal-700 border-teal-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}>
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            ACTIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                            DISABLED
                          </span>
                        )}
                      </td>

                      {/* Security Clearance level */}
                      <td className="p-4 font-mono text-[10px] text-slate-500">
                        {user.role === UserRole.ADMIN ? "SEC_CLEARANCE_L3" : user.role === UserRole.SUPERVISOR ? "SEC_CLEARANCE_L2" : "SEC_CLEARANCE_L1"}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 cursor-pointer"
                            title="Edit User Role/Credentials"
                            id={`edit-user-btn-${user.id}`}
                          >
                            <UserCog className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => handleToggleActive(user)}
                            className={`p-1 rounded cursor-pointer ${
                              user.active 
                                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50" 
                                : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50"
                            }`}
                            title={user.active ? "Deactivate Account" : "Activate Account"}
                            id={`status-user-btn-${user.id}`}
                          >
                            {user.active ? (
                              <UserMinus className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </button>

                          <button
                            onClick={() => {
                              showToast(`Resent invitation details to ${user.email}`, "success");
                            }}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                            title="Resend Secure Credential Link"
                            id={`invite-user-btn-${user.id}`}
                          >
                            <Mail className="h-4 w-4" />
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
        {filteredUsers.length > 0 && (
          <div className="p-4 border-t border-gray-150 flex items-center justify-between bg-white text-xs text-gray-500 shrink-0">
            <div>
              Showing <span className="font-semibold">{paginatedUsers.length}</span> of{" "}
              <span className="font-semibold">{filteredUsers.length.toLocaleString()}</span> staff members
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

        {/* Bulk Action Bar - Animate in if users selected */}
        {selectedUserIds.length > 0 && (
          <div className="bg-slate-900 text-white px-6 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in slide-in-from-bottom-3 duration-250 border-t border-slate-800 shadow-xl" id="bulk-action-bar">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 bg-blue-600 rounded-full text-xs font-bold font-mono">
                {selectedUserIds.length}
              </span>
              <p className="text-xs font-semibold">Users selected for modification</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Assign Roles Button with little flyout */}
              <div className="relative">
                <button
                  onClick={() => setShowBulkRoleDropdown(!showBulkRoleDropdown)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                  id="bulk-edit-roles-btn"
                >
                  Edit Roles
                </button>
                {showBulkRoleDropdown && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowBulkRoleDropdown(false)} />
                    <div className="absolute right-0 bottom-10 mb-1 w-44 bg-white text-slate-800 border border-slate-200 rounded-lg shadow-xl py-1 z-40 animate-in fade-in slide-in-from-bottom-2">
                      <p className="px-3 py-1.5 text-[9px] uppercase font-bold text-slate-400 tracking-wider">Assign New Role</p>
                      <button 
                        onClick={() => handleBulkAssignRole(UserRole.AUDITOR)}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                      >
                        Auditor
                      </button>
                      <button 
                        onClick={() => handleBulkAssignRole(UserRole.SUPERVISOR)}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                      >
                        Supervisor
                      </button>
                      <button 
                        onClick={() => handleBulkAssignRole(UserRole.LEGAL)}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                      >
                        Legal / Appeals Officer
                      </button>
                      <button 
                        onClick={() => handleBulkAssignRole(UserRole.ADMIN)}
                        className="w-full text-left px-3 py-1.5 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                      >
                        System Administrator
                      </button>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={handleBulkDeactivate}
                className="px-3 py-1.5 bg-rose-900/60 hover:bg-rose-900/80 text-rose-100 rounded text-xs font-semibold border border-rose-800/40 transition-colors cursor-pointer"
                id="bulk-deactivate-btn"
              >
                Deactivate Accounts
              </button>

              <button
                onClick={handleBulkResendInvites}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                id="bulk-invite-btn"
              >
                Resend Activation Link
              </button>

              <button
                onClick={() => setSelectedUserIds([])}
                className="p-1.5 text-slate-400 hover:text-white transition-colors ml-1 cursor-pointer"
                title="Cancel bulk operations"
                id="bulk-cancel-btn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE / EDIT ACCOUNT MODAL DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCog className="h-4.5 w-4.5 text-blue-600" />
                {modalMode === "create" ? "Create Staff Account" : "Edit Staff Account"}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Johnathan Doe"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. j.doe@auditcms.gov"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Security & System Role</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-white border border-slate-250 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={UserRole.AUDITOR}>Auditor (Fieldwork, Finding Uploads)</option>
                  <option value={UserRole.SUPERVISOR}>Supervisor (Triage, Review & Approvals)</option>
                  <option value={UserRole.LEGAL}>Appeals Officer (Dispute Mediation)</option>
                  <option value={UserRole.ADMIN}>System Administrator (Configuration, Keys, RBAC)</option>
                </select>
                <span className="text-[10px] text-slate-400 font-medium block mt-1 leading-normal">
                  The selected role determines user capabilities, data accessibility, and clearance codes.
                </span>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-150 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : modalMode === "create" ? "Register Staff" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
