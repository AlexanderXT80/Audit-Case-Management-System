import React from "react";
import { 
  LayoutDashboard, 
  Layers, 
  FolderLock, 
  CheckSquare, 
  FileSearch, 
  Sliders, 
  Users2, 
  Plus,
  ShieldCheck,
  Scale,
  X
} from "lucide-react";
import { UserRole } from "../types";

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewCaseModal: () => void;
  pendingApprovalsCount: number;
  casesInTriageCount: number;
  casesInReviewCount?: number;
  myPendingApprovalsCount?: number;
  activeRole: UserRole;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({
  currentTab,
  onSelectTab,
  onOpenNewCaseModal,
  pendingApprovalsCount,
  casesInTriageCount,
  casesInReviewCount = 0,
  myPendingApprovalsCount = 0,
  activeRole,
  isMobileOpen = false,
  onMobileClose,
}: SidebarProps) {
  let menuItems;
  
  if (activeRole === UserRole.SUPERVISOR) {
    menuItems = [
      { 
        id: "selection", 
        label: "Case Triage", 
        icon: Layers,
        badge: casesInTriageCount > 0 ? casesInTriageCount : undefined 
      },
      { 
        id: "review-queue", 
        label: "Review Queue", 
        icon: FileSearch,
        badge: casesInReviewCount > 0 ? casesInReviewCount : undefined 
      },
      { 
        id: "approvals", 
        label: "Approval Management", 
        icon: CheckSquare,
        badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined 
      },
      { 
        id: "pending-approvals", 
        label: "My Pending Approvals", 
        icon: CheckSquare,
        badge: myPendingApprovalsCount > 0 ? myPendingApprovalsCount : undefined 
      },
    ];
  } else if (activeRole === UserRole.LEGAL) {
    menuItems = [
      { id: "appeals", label: "Appeals Dashboard", icon: Scale },
      { id: "settings", label: "Risk Score Analysis", icon: Sliders },
    ];
  } else if (activeRole === UserRole.ADMIN) {
    menuItems = [
      { id: "admin-dashboard", label: "Main Dashboard", icon: LayoutDashboard },
      { id: "admin-users", label: "User Management", icon: Users2 },
      { 
        id: "approvals", 
        label: "Approval Queue", 
        icon: CheckSquare,
        badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined 
      },
    ];
  } else {
    menuItems = [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
      { 
        id: "selection", 
        label: "Selection", 
        icon: Layers,
        badge: casesInTriageCount > 0 ? casesInTriageCount : undefined 
      },
      { id: "cases", label: "Cases", icon: FolderLock },
      { 
        id: "approvals", 
        label: "Approval Queue", 
        icon: CheckSquare,
        badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined 
      },
      { id: "settings", label: "Risk Score Analysis", icon: Sliders },
    ];
  }

  const handleSelect = (tab: string) => {
    onSelectTab(tab);
    onMobileClose?.();
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-slate-900/40 transition-opacity duration-200 lg:hidden ${isMobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onMobileClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-[82vw] max-w-64 bg-white text-slate-600 flex flex-col border-r border-slate-200 h-screen font-sans transition-transform duration-200 ease-out lg:sticky lg:top-0 lg:w-64 lg:translate-x-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        id="cms-sidebar"
      >
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg" id="sidebar-logo-icon">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 tracking-wide text-sm leading-tight" id="sidebar-logo-text">
              {activeRole === UserRole.ADMIN ? "AdminSuite" : "Audit CMS"}
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">{activeRole === UserRole.ADMIN ? "Security & Access" : "Governance Portal"}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onMobileClose}
          className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Profile Card for Admin */}
      {activeRole === UserRole.ADMIN && (
        <div className="p-4 mx-4 my-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm animate-in fade-in duration-200" id="admin-profile-card">
          <div className="h-9 w-9 bg-purple-600 text-white font-bold rounded-full flex items-center justify-center border border-purple-700 text-sm shadow-sm uppercase">
            A
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">System Admin</h4>
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      {activeRole !== UserRole.ADMIN && (
        <div className="p-4">
          <button
            onClick={onOpenNewCaseModal}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            id="btn-new-case"
          >
            <Plus className="h-4 w-4" />
            New Audit Case
          </button>
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto py-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              className={`w-full flex items-center justify-between py-2 px-3.5 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
                isActive
                  ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500 font-semibold"
                  : "hover:bg-slate-100 hover:text-slate-900 text-slate-600"
              }`}
              id={`sidebar-tab-${item.id}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 transition-colors ${
                  isActive ? "text-blue-600" : "text-slate-400 group-hover:text-slate-600"
                }`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer support navigation */}
      <div className="p-4 border-t border-slate-200 space-y-2">
        {activeRole === UserRole.ADMIN && (
          <button 
            onClick={() => handleSelect("admin-logs")}
            className={`w-full flex items-center gap-3 py-2 px-3 text-xs font-medium rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer ${
              currentTab === "admin-logs" ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500 font-semibold" : "text-slate-600"
            }`}
            id="sidebar-tab-admin-logs"
          >
            <FileSearch className="h-4 w-4 text-slate-400" />
            <span>System Logs</span>
          </button>
        )}
        {activeRole !== UserRole.SUPERVISOR && activeRole !== UserRole.ADMIN && (
          <button 
            onClick={() => handleSelect("admin-panel")}
            className={`w-full flex items-center gap-3 py-2 px-3 text-xs font-medium rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer ${
              currentTab === "admin-panel" ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500 font-semibold" : "text-slate-600"
            }`}
            id="sidebar-tab-admin"
          >
            <Users2 className="h-4 w-4 text-slate-400" />
            <span>Admin Panel</span>
          </button>
        )}
        {activeRole === UserRole.SUPERVISOR && (
          <button 
            onClick={() => handleSelect("settings")}
            className={`w-full flex items-center gap-3 py-2 px-3 text-xs font-medium rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-colors cursor-pointer ${
              currentTab === "settings" ? "bg-blue-50 text-blue-600 border-l-4 border-blue-500 font-semibold" : "text-slate-600"
            }`}
            id="sidebar-tab-settings"
          >
            <Sliders className="h-4 w-4 text-slate-400" />
            <span>Risk Score Analysis</span>
          </button>
        )}

      </div>
    </aside>
    </>
  );
}
