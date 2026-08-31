import React from "react";
import { User, UserRole } from "../types";
import { ShieldCheck, UserCheck, Bell, History, LogOut } from "lucide-react";

interface HeaderProps {
  currentUser: User | null;
  activeRole: UserRole;
  allUsers: User[];
  onSwitchUser: (userId: string, role: UserRole) => void;
  onLogout: () => void;
  onMenuToggle?: () => void;
  title: string;
}

export default function Header({
  currentUser,
  activeRole,
  allUsers,
  onSwitchUser,
  onLogout,
  onMenuToggle,
  title,
}: HeaderProps) {
  const [showDropdown, setShowDropdown] = React.useState(false);

  return (
    <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40" id="cms-header">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
          aria-label="Toggle navigation"
        >
          <span className="sr-only">Toggle navigation</span>
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>

        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 truncate" id="header-title">
          {title}
        </h1>
        <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-800">
          Audit CMS
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Action icons */}
        <button className="relative p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors" id="header-notifications">
          <span className="sr-only">Notifications</span>
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        <button className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors" id="header-history">
          <History className="h-5 w-5" />
        </button>

        <button 
          onClick={onLogout}
          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-1.5 border border-transparent hover:border-rose-100 px-2"
          title="Sign Out of Terminal"
          id="header-logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline text-xs font-semibold">Logout</span>
        </button>

        {/* User profile capsule */}
        <div className="relative" id="header-user-dropdown-container">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 pl-3 border-l border-gray-200 cursor-pointer hover:opacity-90 focus:outline-none select-none text-left"
            id="header-profile-trigger"
          >
            {currentUser?.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="h-8 w-8 rounded-full border border-gray-200 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                {currentUser?.name?.charAt(0) || "U"}
              </div>
            )}
            <div className="hidden lg:block text-left">
              <p className="text-xs font-semibold text-gray-900 leading-none">
                {currentUser?.name || "Loading..."}
              </p>
              <p className="text-[10px] text-gray-500 font-medium font-mono leading-none mt-1">
                {activeRole}
              </p>
            </div>
          </button>

          {showDropdown && (
            <>
              {/* Overlay click catcher to close the dropdown */}
              <div 
                className="fixed inset-0 z-30" 
                onClick={() => setShowDropdown(false)}
              />
              
              <div 
                className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-gray-200 shadow-xl py-2 z-40 animate-in fade-in-50 slide-in-from-top-3 duration-200"
                id="header-profile-dropdown"
              >
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Session</p>
                  <p className="text-xs font-bold text-gray-900 mt-0.5">{currentUser?.name}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">{currentUser?.email}</p>
                </div>
                
                <div className="px-4 py-2 bg-slate-50 border-b border-gray-100 flex justify-between items-center">
                  <span className="text-[10px] font-bold text-gray-500">SESSION ROLE:</span>
                  <span className="text-[10px] font-mono font-bold uppercase bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-150">
                    {activeRole}
                  </span>
                </div>

                <div className="py-1 max-h-56 overflow-y-auto">
                  <p className="px-4 py-1.5 text-[10px] uppercase font-bold text-gray-400 tracking-wider">Switch Session Profile</p>
                  
                  {allUsers
                    .filter((u) => u.id !== currentUser?.id)
                    .map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          onSwitchUser(user.id, user.role);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt={user.name}
                              className="h-6 w-6 rounded-full border border-gray-150 object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="h-6 w-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px]">
                              {user.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate group-hover:text-blue-600">
                              {user.name}
                            </p>
                            <p className="text-[9px] text-gray-400 truncate">{user.role}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
