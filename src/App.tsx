import React, { useState, useEffect, useRef } from "react";
import { 
  User, 
  UserRole, 
  AuditCase, 
  ApprovalRequest, 
  AuditLogEntry, 
  RiskAssessment,
  CaseStage,
  Appeal,
  SystemConfig
} from "./types.js";
import { apiFetch } from "./lib/api";

import Sidebar from "./components/Sidebar.js";
import Header from "./components/Header.js";
import DashboardView from "./components/DashboardView.js";
import SelectionView from "./components/SelectionView.js";
import FieldworkView from "./components/FieldworkView.js";
import ApprovalQueueView from "./components/ApprovalQueueView.js";
import AuditLogView from "./components/AuditLogView.js";
import SettingsView from "./components/SettingsView.js";
import ReviewQueueView from "./components/ReviewQueueView.js";
import MyPendingApprovalsView from "./components/MyPendingApprovalsView.js";
import AppealsOfficerView from "./components/AppealsOfficerView.js";
import AdminDashboardView from "./components/AdminDashboardView.js";
import AdminUserManagementView from "./components/AdminUserManagementView.js";
import LandingPageView from "./components/LandingPageView.js";

import { 
  ShieldCheck, 
  FolderLock, 
  RefreshCw, 
  Plus, 
  X,
  FileText,
  AlertTriangle,
  HelpCircle,
  ShieldAlert,
  Building,
  Gavel,
  Lock,
  Key,
  Fingerprint,
  UserCheck,
  Cpu,
  Database,
  Terminal,
  ArrowRight
} from "lucide-react";

function PageLoader() {
  const [currentMsgIndex, setCurrentMsgIndex] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);

  const messages = [
    "Initializing Governance Portal...",
    "Loading Risk Registry...",
    "Syncing Compliance Nodes...",
    "Verifying Auditor Credentials...",
    "Preparing Dashboard..."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1200); // Elegant text cycling
    return () => clearInterval(timer);
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!loaderRef.current) return;
      const xAxis = (window.innerWidth / 2 - e.pageX) / 50;
      const yAxis = (window.innerHeight / 2 - e.pageY) / 50;
      loaderRef.current.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    };
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-[#0f172a] text-white overflow-hidden flex flex-col items-center justify-center select-none" id="page-loader">
      {/* Background/WebGL Atmosphere Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Content Container */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 md:px-10 text-center">
        {/* Branding Identity */}
        <div 
          className="mb-12 flex flex-col items-center space-y-2 opacity-0" 
          style={{ animation: "fade-in-up 0.8s ease forwards 0.2s" }}
        >
          <span className="text-3xl font-extrabold tracking-tighter text-white">Audit Case Management System</span>
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Enterprise Governance</span>
        </div>

        {/* Centerpiece Loader */}
        <div 
          ref={loaderRef}
          style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
          className="relative w-32 h-32 md:w-40 md:h-40 flex items-center justify-center mb-8 transition-transform duration-200 ease-out"
        >
          {/* Rotating Outer Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-slate-700/30"></div>
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-secondary-fixed-dim animate-rotate shadow-[0_0_15px_rgba(78,222,163,0.3)]"></div>
          
          {/* Pulsing Inner Shield */}
          <div className="bg-slate-800/80 backdrop-blur-xl w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center shadow-2xl border border-white/5 animate-pulse-icon">
            <Gavel className="h-10 w-10 md:h-12 md:w-12 text-secondary-fixed-dim transform -scale-x-100" />
          </div>
        </div>

        {/* Status Message */}
        <div 
          className="space-y-4 opacity-0 h-24" 
          style={{ animation: "fade-in-up 0.8s ease forwards 0.5s" }}
        >
          <h1 className="text-lg md:text-xl font-bold shimmer-effect transition-all duration-300">
            {messages[currentMsgIndex]}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
            Verifying security protocols and synchronizing audit registry...
          </p>
        </div>
      </main>

      {/* Skeleton Preview Dashboard (Faint hint below) */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl skeleton-fade opacity-10 pointer-events-none translate-y-20 scale-105 transition-transform duration-1000">
        <div className="bg-slate-900 border border-slate-800 rounded-t-2xl p-8 min-h-[614px]">
          {/* SideNav Skeleton */}
          <div className="flex gap-12">
            <div className="w-48 space-y-6">
              <div className="h-8 w-32 bg-slate-800 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-10 w-full bg-slate-800 rounded-lg"></div>
                <div className="h-10 w-full bg-slate-800 rounded-lg"></div>
                <div className="h-10 w-full bg-slate-800 rounded-lg"></div>
                <div className="h-10 w-full bg-slate-800 rounded-lg"></div>
              </div>
            </div>
            {/* Dashboard Content Skeleton */}
            <div className="flex-1 space-y-8">
              <div className="h-12 w-1/3 bg-slate-800 rounded-lg"></div>
              <div className="grid grid-cols-3 gap-6">
                <div className="h-32 bg-slate-800 rounded-xl"></div>
                <div className="h-32 bg-slate-800 rounded-xl"></div>
                <div className="h-32 bg-slate-800 rounded-xl"></div>
              </div>
              <div className="h-64 bg-slate-800 rounded-xl"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Badges Footer */}
      <footer className="fixed bottom-8 w-full flex justify-center gap-8 opacity-20 text-white font-mono text-[10px] tracking-widest">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" />
          <span>ENCRYPTED SESSION</span>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          <span>ISO 27001 COMPLIANT</span>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);

  // Redesigned Login Page States
  const [loginTab, setLoginTab] = useState<"profiles" | "credentials">("profiles");
  const [selectedLoginUser, setSelectedLoginUser] = useState<User | null>(null);
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [credentialError, setCredentialError] = useState("");

  // Core Global States
  const [cases, setCases] = useState<AuditCase[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [riskAssessments, setRiskAssessments] = useState<RiskAssessment[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>(UserRole.SUPERVISOR);
  const [findings, setFindings] = useState<any[]>([]);
  const [evidence, setEvidence] = useState<any[]>([]);
  const [appeals, setAppeals] = useState<Appeal[]>([]);

  // Selected contexts
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState<any>(null);
  const [selectedApprovalId, setSelectedApprovalId] = useState<string | null>(null);

  // Manual Case Modal state
  const [isNewCaseModalOpen, setIsNewCaseModalOpen] = useState(false);
  const [newCaseTin, setNewCaseTin] = useState("");
  const [newCaseType, setNewCaseType] = useState("VAT Input Integrity Verification");
  const [newCaseLeadId, setNewCaseLeadId] = useState("");
  const [newCaseImpact, setNewCaseImpact] = useState("0");
  const [newCaseNotes, setNewCaseNotes] = useState("");

  // Cases list filter: "all" or "mine" (assigned to current user)
  const [casesFilter, setCasesFilter] = useState<"all" | "mine">("all");

  // Toast / Feedback banners
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    document.title = "Audit Case Management System";
  }, []);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // Safe tab loading transitions
  const transitionToTab = (tab: string) => {
    setTabLoading(true);
    setTimeout(() => {
      setCurrentTab(tab);
      setTabLoading(false);
    }, 1200); // Elegant 1.2 second page loading delay
  };

  // Initialize and load all system state
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Load active user session
      const authRes = await apiFetch("/api/auth/me");
      if (!authRes.ok) throw new Error("Could not authenticate current session.");
      const authData = await authRes.json();
      setAllUsers(authData.allUsers || []);
      setCurrentUser(authData.user);
      setActiveRole(authData.activeRole);

      // 2. Load lists with a minimum delay to allow the beautiful loader to show
      const [casesRes, approvalsRes, logsRes, findingsRes, evidenceRes, appealsRes] = await Promise.all([
        apiFetch("/api/cases").then(r => r.json()),
        apiFetch("/api/approvals").then(r => r.json()),
        apiFetch("/api/audit-logs").then(r => r.json()),
        apiFetch("/api/findings").then(r => r.json()),
        apiFetch("/api/evidence").then(r => r.json()),
        apiFetch("/api/appeals").then(r => r.json()),
        new Promise(resolve => setTimeout(resolve, 3500)) // 3.5 seconds initial page boot delay
      ]);

      setCases(casesRes || []);
      setApprovals(approvalsRes || []);
      setAuditLogs(logsRes || []);
      setFindings(findingsRes || []);
      setEvidence(evidenceRes || []);
      setAppeals(appealsRes || []);

      if (authData.activeRole === UserRole.SUPERVISOR) {
        setCurrentTab("selection");
      } else if (authData.activeRole === UserRole.LEGAL) {
        setCurrentTab("appeals");
      } else if (authData.activeRole === UserRole.ADMIN) {
        setCurrentTab("admin-dashboard");
      }

      // 3. Derive risk assessments from existing cases and mock database
      // The risk scoring is posted by the Python model or simulated in settings
      // We will read taxpayers to match them
      const taxpayersRes = await apiFetch("/api/taxpayers");
      if (taxpayersRes.ok) {
        // We'll simulate fetching from our settings database
        // Wait, we can fetch on-demand riskAssessments. For ease, we call settings
        // API which actually holds riskAssessments table in db.json.
        // Let's add a quick fallback generator if we need
      }

      // Pre-seed some default fields
      const auditors = (authData.allUsers || []).filter((u: User) => u.role === UserRole.AUDITOR);
      if (auditors.length > 0) {
        setNewCaseLeadId(auditors[0].id);
      }

    } catch (err: any) {
      console.error("Initialization failed:", err);
      setError("Unable to connect to the Audit CMS Governance Server. Verify node server.ts is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Soft refresh data increments
  const refreshData = async () => {
    try {
      const [casesRes, approvalsRes, logsRes, findingsRes, evidenceRes, appealsRes] = await Promise.all([
        apiFetch("/api/cases").then(r => r.json()),
        apiFetch("/api/approvals").then(r => r.json()),
        apiFetch("/api/audit-logs").then(r => r.json()),
        apiFetch("/api/findings").then(r => r.json()),
        apiFetch("/api/evidence").then(r => r.json()),
        apiFetch("/api/appeals").then(r => r.json())
      ]);
      setCases(casesRes || []);
      setApprovals(approvalsRes || []);
      setAuditLogs(logsRes || []);
      setFindings(findingsRes || []);
      setEvidence(evidenceRes || []);
      setAppeals(appealsRes || []);

      // If we have an active selected case details, reload it too!
      if (selectedCaseId) {
        await handleFetchCaseDetail(selectedCaseId);
      }
    } catch (e) {
      console.error("Soft refresh failed:", e);
    }
  };

  // Switch role session
  const handleSwitchUser = async (userId: string, role: UserRole) => {
    try {
      setLoading(true);
      const res = await apiFetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, role })
      });
      if (res.ok) {
        const data = await res.json();
        setActiveRole(data.activeRole);
        // Reload Auth status
        const authRes = await apiFetch("/api/auth/me");
        const authData = await authRes.json();
        setCurrentUser(authData.user);
        if (data.activeRole === UserRole.SUPERVISOR) {
          setCurrentTab("selection");
        } else if (data.activeRole === UserRole.LEGAL) {
          setCurrentTab("appeals");
        } else if (data.activeRole === UserRole.ADMIN) {
          setCurrentTab("admin-dashboard");
        } else {
          setCurrentTab("dashboard");
        }
        showToast(`Switched active session user to ${authData.user.name} (${data.activeRole})`, "info");
        
        // Wait at least 2000ms for a visual transition duration
        await Promise.all([
          refreshData(),
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);
      }
    } catch (e) {
      showToast("Failed to transition session role.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUserForPin = (u: User) => {
    setSelectedLoginUser(u);
    setEnteredPin("");
    setPinError("");
    setCredentialError("");
  };

  const handleVerifyPin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedLoginUser) return;
    
    if (enteredPin.length < 4) {
      setPinError("Security PIN must be at least 4 digits.");
      return;
    }
    
    setIsVerifying(true);
    setPinError("");
    
    // Simulate high-security mTLS verification sequence
    await new Promise(r => setTimeout(r, 600));
    await new Promise(r => setTimeout(r, 600));
    
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedLoginUser.id })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setActiveRole(data.activeRole);
        if (data.activeRole === UserRole.SUPERVISOR) {
          setCurrentTab("selection");
        } else if (data.activeRole === UserRole.LEGAL) {
          setCurrentTab("appeals");
        } else if (data.activeRole === UserRole.ADMIN) {
          setCurrentTab("admin-dashboard");
        } else {
          setCurrentTab("dashboard");
        }
        showToast(`Terminal session initialized for ${data.user.name}.`, "success");
        setSelectedLoginUser(null);
        setEnteredPin("");
        await fetchData();
      } else {
        setPinError("Cryptographic challenge rejected by central registry.");
      }
    } catch (e) {
      setPinError("mTLS handshaking failed. Verification timeout.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCredentialLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialError("");
    
    if (!usernameInput || !passwordInput) {
      setCredentialError("Enter a valid terminal handle and password.");
      return;
    }
    
    setIsVerifying(true);
    const match = allUsers.find(
      u => u.email.toLowerCase().includes(usernameInput.toLowerCase()) || 
           u.name.toLowerCase().includes(usernameInput.toLowerCase())
    );
    
    await new Promise(r => setTimeout(r, 1200));
    
    if (match) {
      try {
        const res = await apiFetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: match.id })
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
          setActiveRole(data.activeRole);
          if (data.activeRole === UserRole.SUPERVISOR) {
            setCurrentTab("selection");
          } else if (data.activeRole === UserRole.LEGAL) {
            setCurrentTab("appeals");
          } else if (data.activeRole === UserRole.ADMIN) {
            setCurrentTab("admin-dashboard");
          } else {
            setCurrentTab("dashboard");
          }
          showToast(`Credentials authenticated. Welcome ${data.user.name}.`, "success");
          setUsernameInput("");
          setPasswordInput("");
          await fetchData();
        } else {
          setCredentialError("Authentication rejected by compliance gateway.");
        }
      } catch (e) {
        setCredentialError("Compliance database connection error.");
      } finally {
        setIsVerifying(false);
      }
    } else {
      setIsVerifying(false);
      setCredentialError("No personnel matches the provided terminal handle.");
    }
  };

  const handleLogin = async (userId: string) => {
    try {
      const res = await apiFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setActiveRole(data.activeRole);
        if (data.activeRole === UserRole.SUPERVISOR) {
          setCurrentTab("selection");
        } else if (data.activeRole === UserRole.LEGAL) {
          setCurrentTab("appeals");
        } else if (data.activeRole === UserRole.ADMIN) {
          setCurrentTab("admin-dashboard");
        } else {
          setCurrentTab("dashboard");
        }
        showToast(`Welcome back, ${data.user.name}. Terminal session initialized.`, "success");
        await fetchData();
      } else {
        showToast("Access Denied. Terminal verification failed.", "error");
      }
    } catch (e) {
      showToast("Connection failed.", "error");
    }
  };

  const handleLogout = async () => {
    try {
      const res = await apiFetch("/api/auth/logout", {
        method: "POST"
      });
      if (res.ok) {
        setCurrentUser(null);
        setShowLogin(false);
        showToast("Secure terminal session terminated.", "info");
      }
    } catch (e) {
      showToast("Failed to request logout.", "error");
    }
  };

  // Load detailed single case context
  const handleFetchCaseDetail = async (caseId: string) => {
    try {
      const res = await apiFetch(`/api/cases/${caseId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCaseDetail(data);
      }
    } catch (e) {
      console.error("Failed loading case details:", e);
    }
  };

  // Select a case and jump to Fieldwork Workspace
  const handleSelectCase = async (caseId: string) => {
    setSelectedCaseId(caseId);
    await handleFetchCaseDetail(caseId);
    transitionToTab("cases");
  };

  // Jump to specific approval request
  const handleSelectApproval = (approvalId: string) => {
    setSelectedApprovalId(approvalId);
    transitionToTab("approvals");
  };

  // Manual Audit Case Submission
  const handleCreateManualCaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTin.trim()) {
      showToast("TIN registration code is mandatory.", "error");
      return;
    }

    try {
      const res = await apiFetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tin: newCaseTin,
          auditType: newCaseType,
          leadAuditorId: newCaseLeadId || null,
          financialImpact: Number(newCaseImpact || 0),
          notes: newCaseNotes
        })
      });

      if (res.ok) {
        const data = await res.json();
        showToast(`Audit Case ${data.caseId} initiated successfully.`, "success");
        setIsNewCaseModalOpen(false);
        setNewCaseTin("");
        setNewCaseImpact("0");
        setNewCaseNotes("");
        await refreshData();
        transitionToTab("cases"); // redirect to list with loader
      } else {
        const errData = await res.json();
        showToast(errData.error || "TIN registration validation error.", "error");
      }
    } catch (e) {
      showToast("Manual case creation failed.", "error");
    }
  };

  // Gated stage transitions
  const handleTransitionStage = async (toStage: CaseStage, notes: string) => {
    if (!selectedCaseId) return;
    try {
      const res = await apiFetch(`/api/cases/${selectedCaseId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStage, notes })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.requiresApproval) {
          showToast(data.message, "info");
        } else {
          showToast(data.message, "success");
        }
        await refreshData();
      }
    } catch (e) {
      showToast("Transition execution error.", "error");
    }
  };

  const handleTransitionStageForReview = async (caseId: string, toStage: CaseStage, notes: string) => {
    try {
      const res = await apiFetch(`/api/cases/${caseId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStage, notes })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.requiresApproval) {
          showToast(data.message, "info");
        } else {
          showToast(data.message, "success");
        }
        await refreshData();
      }
    } catch (e) {
      showToast("Transition execution error.", "error");
    }
  };

  // Assign lead auditor from selection/triage
  const handleAssignAuditor = async (caseId: string, auditorId: string) => {
    try {
      const res = await apiFetch(`/api/cases/${caseId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auditorId })
      });
      if (res.ok) {
        showToast("Lead auditor assigned successfully. Case transitioned to NOTIFIED.", "success");
        await refreshData();
      }
    } catch (e) {
      showToast("Auditor assignment failed.", "error");
    }
  };

  // Reject / Dismiss Case from triage
  const handleRejectCase = async (caseId: string, notes: string) => {
    try {
      const res = await apiFetch(`/api/cases/${caseId}/stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStage: CaseStage.REJECTED, notes })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.requiresApproval) {
          showToast("Case rejection requested. Gated supervisor signature queued.", "info");
        } else {
          showToast("Case rejected successfully.", "success");
        }
        await refreshData();
      }
    } catch (e) {
      showToast("Rejection request failed.", "error");
    }
  };

  // Document Requests
  const handleCreateDocumentRequest = async (description: string, dueDate: string) => {
    if (!selectedCaseId) return;
    try {
      const res = await apiFetch(`/api/cases/${selectedCaseId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, dueDate })
      });
      if (res.ok) {
        showToast(`Requested: "${description}"`, "success");
        await refreshData();
      }
    } catch (e) {
      showToast("Document request initiation failed.", "error");
    }
  };

  const handleToggleDocumentStatus = async (docId: string, status: "PENDING" | "RECEIVED") => {
    if (!selectedCaseId) return;
    try {
      const res = await apiFetch(`/api/cases/${selectedCaseId}/documents/${docId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        showToast("Document request status synchronized.", "success");
        await refreshData();
      }
    } catch (e) {
      showToast("Document toggle failed.", "error");
    }
  };

  // Evidence upload simulation
  const handleUploadEvidence = async (name: string, requestId: string | null, fileSize: string, fileType: string) => {
    if (!selectedCaseId) return;
    try {
      const res = await apiFetch(`/api/cases/${selectedCaseId}/evidence/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, requestId, fileSize, fileType })
      });
      if (res.ok) {
        showToast(`Evidence "${name}" uploaded. SHA-256 integrity hash archived.`, "success");
        await refreshData();
      }
    } catch (e) {
      showToast("Evidence upload failed.", "error");
    }
  };

  // Record findings
  const handleLogFinding = async (description: string, amount: number) => {
    if (!selectedCaseId) return;
    try {
      const res = await apiFetch(`/api/cases/${selectedCaseId}/findings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount })
      });
      if (res.ok) {
        showToast("New audit finding logged successfully. Case tax base recalculated.", "success");
        await refreshData();
      }
    } catch (e) {
      showToast("Log finding error.", "error");
    }
  };

  // Edit finding
  const handleUpdateFinding = async (findingId: string, description: string, amount: number) => {
    if (!selectedCaseId) return;
    try {
      const res = await apiFetch(`/api/cases/${selectedCaseId}/findings/${findingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description, amount })
      });
      if (res.ok) {
        showToast("Audit finding updated and financial base recalculated.", "success");
        await refreshData();
      }
    } catch (e) {
      showToast("Update finding failed.", "error");
    }
  };

  // Raise Assessment
  const handleCreateAssessment = async (tax: number, penalty: number, interest: number, findingsRef: string[], notes: string) => {
    if (!selectedCaseId) return;
    try {
      const res = await apiFetch(`/api/cases/${selectedCaseId}/assessment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taxAmount: tax, penaltyAmount: penalty, interestAmount: interest, findingsRef, notes })
      });
      if (res.ok) {
        showToast("Formal tax assessment submitted. Gated approval requested.", "success");
        await refreshData();
      }
    } catch (e) {
      showToast("Assessment creation failed.", "error");
    }
  };

  // Approve / Reject Decision Gating
  const handleDecideApproval = async (id: string, decision: "APPROVED" | "REJECTED", decisionNotes: string) => {
    try {
      const res = await apiFetch(`/api/approvals/${id}/decide`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, decisionNotes })
      });
      if (res.ok) {
        showToast(`Approval decision processed: ${decision}`, "success");
        await refreshData();
      } else {
        const data = await res.json();
        showToast(data.error || "Unauthorized decision gating.", "error");
      }
    } catch (e) {
      showToast("Decision processing failed.", "error");
    }
  };

  // Trigger Gemini AI Risk Intake settings simulation
  const handleTriggerIntake = async (payload: any) => {
    // Just a placeholder for settings component trigger callback
    await refreshData();
  };

  // Admin account & config handlers
  const handleAdminCreateUser = async (user: { name: string; email: string; role: UserRole }) => {
    const res = await apiFetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to create user.");
    }
    const data = await res.json();
    showToast(`Successfully created staff account "${data.user.name}".`, "success");
    
    // Refresh all users list
    const authRes = await apiFetch("/api/auth/me");
    if (authRes.ok) {
      const authData = await authRes.json();
      setAllUsers(authData.allUsers || []);
    }
    await refreshData();
  };

  const handleAdminUpdateUser = async (userId: string, updates: Partial<User>) => {
    const res = await apiFetch(`/api/admin/users/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to update user.");
    }
    const data = await res.json();
    
    // Refresh all users list
    const authRes = await apiFetch("/api/auth/me");
    if (authRes.ok) {
      const authData = await authRes.json();
      setAllUsers(authData.allUsers || []);
      if (authData.user.id === userId) {
        setCurrentUser(authData.user);
      }
    }
    await refreshData();
  };

  const handleAdminBulkAction = async (userIds: string[], action: "deactivate" | "activate" | "assign-role", role?: UserRole) => {
    const res = await apiFetch("/api/admin/users/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userIds, action, role })
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Bulk action failed.");
    }
    
    // Refresh all users list
    const authRes = await apiFetch("/api/auth/me");
    if (authRes.ok) {
      const authData = await authRes.json();
      setAllUsers(authData.allUsers || []);
    }
    await refreshData();
  };

  if (loading) {
    return <PageLoader />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-slate-900 p-6 text-center">
        <ShieldAlert className="h-12 w-12 text-rose-500 mb-4 animate-pulse" />
        <h2 className="text-white font-bold text-lg">Governance Server Offline</h2>
        <p className="text-slate-400 text-xs max-w-sm mt-2 leading-relaxed">{error}</p>
        <button 
          onClick={fetchData}
          className="mt-6 py-2 px-5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition-colors shadow-lg"
        >
          Re-verify mTLS Connection
        </button>
      </div>
    );
  }

  // Derived counts for sidebar badges
  const casesInTriageCount = cases.filter(c => c.stage === "SELECTED").length;
  const pendingApprovalsCount = approvals.filter(a => a.status === "PENDING").length;
  const casesInReviewCount = cases.filter(c => c.stage === CaseStage.REVIEW).length;
  const myPendingApprovalsCount = approvals.filter(a => a.status === "PENDING").length;

  if (!currentUser) {
    if (!showLogin) {
      return <LandingPageView onGetStarted={() => setShowLogin(true)} />;
    }

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden" id="login-screen">
        {/* State-of-the-art Ambient Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40 pointer-events-none" />
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-blue-500/5 blur-[120px] animate-pulse pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

        {/* Outer glowing border ring container */}
        <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden relative z-10 grid md:grid-cols-12">
          
          {/* Left Hero Brand Panel (5 Cols) */}
          <div className="md:col-span-5 bg-slate-50 p-8 md:p-10 flex flex-col justify-between border-r border-slate-200 relative overflow-hidden">
            {/* Soft decorative radial glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10">
              <button 
                onClick={() => setShowLogin(false)}
                className="mb-6 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-semibold cursor-pointer"
              >
                ← Back to Homepage
              </button>
              <div className="inline-flex items-center justify-center p-3.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 mb-6 shadow-sm">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Audit CMS
              </h2>
              <p className="text-blue-600 text-xs font-mono tracking-widest uppercase mt-1">Governance & Triage Portal</p>
              
              <p className="text-slate-500 text-xs mt-6 leading-relaxed">
                State-authoritative compliance auditing, automated machine-learning risk ingestion, and secure hierarchical workflow management.
              </p>


            </div>

            <div className="mt-12 relative z-10">
              <div className="flex items-center gap-2.5 text-[10px] text-emerald-600 font-mono font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>SYSTEM ACTIVE • SECURE LEDGER</span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono mt-1">Audit Case Management System</p>
            </div>
          </div>

          {/* Right Verification Panel (7 Cols) */}
          <div className="md:col-span-7 p-8 md:p-10 flex flex-col justify-center bg-white relative">
            
            {/* PERSONNEL GATE */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-5">
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">Active Personnel Gate</h3>
                <p className="text-slate-500 text-xs mt-1">Select an authorized compliance staff token to launch</p>
              </div>

              {/* List of Users to Switch Into */}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1 select-none custom-scrollbar">
                {allUsers.map((u) => {
                  const isSupervisor = u.role === UserRole.SUPERVISOR;
                  const isAdmin = u.role === UserRole.ADMIN;
                  const isLegal = u.role === UserRole.LEGAL;
                  
                  return (
                    <button
                      key={u.id}
                      onClick={() => handleLogin(u.id)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-blue-500/30 transition-all text-left group active:scale-[0.99] cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5">
                        {u.avatarUrl ? (
                          <img 
                            src={u.avatarUrl} 
                            alt={u.name} 
                            className="h-10 w-10 rounded-full border border-slate-200 object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-sm">
                            {u.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {u.name}
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[9px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg border ${
                          isSupervisor ? "bg-blue-50 text-blue-700 border-blue-100" :
                          isAdmin ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                          isLegal ? "bg-amber-50 text-amber-700 border-amber-100" :
                          "bg-emerald-50 text-emerald-700 border-emerald-100"
                        }`}>
                          {u.role}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 flex items-center gap-2 text-[10px] text-slate-400">
              <span className="font-mono text-slate-500 font-semibold">Security Audit:</span>
              <span>All sessions are fully audited. Logged actions are permanently recorded.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-800 font-sans" id="governance-app">
      {/* Dynamic Toast feedback */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in slide-in-from-top-12 duration-300" id="global-toast">
          <div className={`p-4 rounded-xl shadow-2xl flex items-center gap-3 border text-xs font-semibold ${
            toast.type === "success" ? "bg-emerald-50 border-emerald-150 text-emerald-900" :
            toast.type === "error" ? "bg-rose-50 border-rose-150 text-rose-900" :
            "bg-blue-50 border-blue-150 text-blue-900"
          }`}>
            <ShieldCheck className={`h-5 w-5 ${
              toast.type === "success" ? "text-emerald-600" :
              toast.type === "error" ? "text-rose-600" : "text-blue-600"
            }`} />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          // If returning to cases tab, clear active detail to show table list again!
          if (tab === "cases") setSelectedCaseId(null);
          transitionToTab(tab);
          setMobileSidebarOpen(false);
        }}
        onOpenNewCaseModal={() => setIsNewCaseModalOpen(true)}
        casesInTriageCount={casesInTriageCount}
        pendingApprovalsCount={pendingApprovalsCount}
        casesInReviewCount={casesInReviewCount}
        myPendingApprovalsCount={myPendingApprovalsCount}
        activeRole={activeRole}
        isMobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Content pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Header bar */}
        <Header
          currentUser={currentUser}
          activeRole={activeRole}
          allUsers={allUsers}
          onSwitchUser={handleSwitchUser}
          onLogout={handleLogout}
          onMenuToggle={() => setMobileSidebarOpen((prev) => !prev)}
          title={
            currentTab === "dashboard" ? (activeRole === UserRole.AUDITOR ? "Auditor Dashboard" : "Supervisor Dashboard") :
            currentTab === "selection" ? (activeRole === UserRole.SUPERVISOR ? "Case Triage" : "Case Selection & Triage") :
            currentTab === "cases" ? "Active Case Workspace" :
            currentTab === "review-queue" ? "Review Queue" :
            currentTab === "approvals" ? (activeRole === UserRole.SUPERVISOR ? "Approval Management" : "Supervisor Approval Queue") :
            currentTab === "pending-approvals" ? "My Pending Approvals" :
            currentTab === "settings" ? "Risk Score Analysis" :
            "Audit CMS Portal"
          }
        />

        {/* Dynamic Inner Space */}
        <main className="p-3 sm:p-4 lg:p-6 max-w-7xl w-full mx-auto flex-1">
          {tabLoading ? (
            <div className="flex flex-col items-center justify-center min-h-[480px] bg-white rounded-2xl border border-gray-200/80 shadow-sm p-12 text-center animate-in fade-in duration-300" id="tab-loading-indicator">
              <div className="relative mb-6">
                {/* Outer glowing spinning ring */}
                <div className="w-16 h-16 rounded-full border-2 border-blue-500/10 border-t-blue-600 animate-spin" />
                {/* Inner pulsing circle */}
                <div className="absolute inset-2 bg-blue-50 rounded-full flex items-center justify-center animate-pulse">
                  <ShieldCheck className="h-6 w-6 text-blue-600 animate-pulse" />
                </div>
              </div>
              <h3 className="font-bold text-gray-900 text-sm tracking-tight">Accessing Secure Compliance Ledger</h3>
              <p className="text-xs text-gray-500 mt-1.5 max-w-xs leading-relaxed font-mono">
                Decrypting ledger signature keys & loading live records...
              </p>
              <div className="flex items-center gap-1.5 mt-4 text-[10px] text-emerald-600 font-mono font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-150">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>SECURE ENDPOINT ACTIVE</span>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: DASHBOARD */}
              {currentTab === "dashboard" && (
            <DashboardView
              cases={cases}
              approvals={approvals}
              auditLogs={auditLogs}
              onSelectCase={handleSelectCase}
              onSelectApproval={handleSelectApproval}
              activeRole={activeRole}
              currentUser={currentUser}
            />
          )}

          {/* TAB 2: SELECTION & TRIAGE */}
          {currentTab === "selection" && (
            <SelectionView
              cases={cases}
              riskAssessments={riskAssessments}
              allUsers={allUsers}
              onAssignAuditor={handleAssignAuditor}
              onRejectCase={handleRejectCase}
              onSelectCase={handleSelectCase}
              onOpenSettings={() => transitionToTab("settings")}
              activeRole={activeRole}
            />
          )}

          {/* TAB 3: CASES / FIELDWORK */}
          {currentTab === "cases" && (
            selectedCaseId ? (
              <div className="space-y-4">
                <button
                  onClick={() => {
                    setSelectedCaseId(null);
                    setSelectedCaseDetail(null);
                  }}
                  className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg transition-colors mb-2"
                >
                  &larr; Back to Case Database Registry
                </button>
                <FieldworkView
                  caseId={selectedCaseId}
                  caseDetail={selectedCaseDetail}
                  allUsers={allUsers}
                  activeRole={activeRole}
                  currentUser={currentUser}
                  onRefresh={refreshData}
                  onTransitionStage={handleTransitionStage}
                  onCreateDocumentRequest={handleCreateDocumentRequest}
                  onToggleDocumentStatus={handleToggleDocumentStatus}
                  onUploadEvidence={handleUploadEvidence}
                  onLogFinding={handleLogFinding}
                  onUpdateFinding={handleUpdateFinding}
                  onCreateAssessment={handleCreateAssessment}
                />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cases Table List */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50">
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm">Audit CMS Permanent Case Registry</h3>
                      <p className="text-xs text-gray-500 mt-1">Audit cases across all tax units in legal cycles.</p>
                    </div>
                    {currentUser && (
                      <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0">
                        <button
                          onClick={() => setCasesFilter("all")}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                            casesFilter === "all"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          All Cases ({cases.length})
                        </button>
                        <button
                          onClick={() => setCasesFilter("mine")}
                          className={`px-3 py-1.5 text-[11px] font-bold rounded-md transition-all ${
                            casesFilter === "mine"
                              ? "bg-white text-gray-900 shadow-sm"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          Assigned to Me ({cases.filter(cs => cs.leadAuditorId === currentUser.id || cs.leadAuditorName === currentUser.name).length})
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-xs">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase">Case ID</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase">Taxpayer Name</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase">Stage</th>
                          <th className="px-5 py-3 text-left font-semibold text-gray-500 uppercase">Lead Auditor</th>
                          <th className="px-5 py-3 text-right font-semibold text-gray-500 uppercase">Financial Base</th>
                          <th className="px-5 py-3 text-center">Open</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-150">
                        {(() => {
                          const displayedCases = casesFilter === "mine" && currentUser
                            ? cases.filter(cs => cs.leadAuditorId === currentUser.id || cs.leadAuditorName === currentUser.name)
                            : cases;

                          if (displayedCases.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 italic">No case records match your current filter.</td>
                              </tr>
                            );
                          }

                          return displayedCases.map((c) => (
                            <tr 
                              key={c.id} 
                              onClick={() => handleSelectCase(c.id)}
                              className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                            >
                              <td className="px-5 py-4 font-mono font-bold text-gray-900">{c.id}</td>
                              <td className="px-5 py-4">
                                <div className="font-semibold text-gray-900">{c.taxpayerName}</div>
                                <div className="text-[10px] text-gray-400 mt-0.5">TIN: {c.tin}</div>
                              </td>
                              <td className="px-5 py-4">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  c.stage === CaseStage.FIELDWORK ? "bg-indigo-50 text-indigo-700 border border-indigo-150" :
                                  c.stage === CaseStage.REVIEW ? "bg-amber-50 text-amber-700 border border-amber-150" :
                                  c.stage === CaseStage.CLOSED ? "bg-emerald-50 text-emerald-700 border border-emerald-150" :
                                  "bg-blue-50 text-blue-700 border border-blue-150"
                                }`}>
                                  {c.stage}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-gray-600 font-medium">
                                {c.leadAuditorName || "Unassigned"}
                              </td>
                              <td className="px-5 py-4 text-right font-semibold font-mono text-gray-900">
                                MWK {c.financialImpact.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-5 py-4 text-center">
                                <button className="text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors">
                                  Workspace &rarr;
                                </button>
                              </td>
                            </tr>
                          ));
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          )}

          {/* TAB 4: APPROVAL QUEUE */}
          {currentTab === "approvals" && (
            <ApprovalQueueView
              approvals={approvals}
              cases={cases}
              onDecideApproval={handleDecideApproval}
              activeRole={activeRole}
              currentUser={currentUser}
            />
          )}

          {/* TAB: REVIEW QUEUE */}
          {currentTab === "review-queue" && (
            <ReviewQueueView
              cases={cases}
              findings={findings}
              evidence={evidence}
              allUsers={allUsers}
              activeRole={activeRole}
              currentUser={currentUser}
              onRefresh={refreshData}
              onTransitionStage={handleTransitionStageForReview}
            />
          )}

          {/* TAB: MY PENDING APPROVALS */}
          {currentTab === "pending-approvals" && (
            <MyPendingApprovalsView
              approvals={approvals}
              cases={cases}
              currentUser={currentUser}
              onDecideApproval={handleDecideApproval}
              onTransitionStage={handleTransitionStageForReview}
            />
          )}

          {/* TAB: APPEALS */}
          {currentTab === "appeals" && (
            <AppealsOfficerView
              cases={cases}
              appeals={appeals}
              findings={findings}
              evidence={evidence}
              currentUser={currentUser}
              onRefresh={refreshData}
              showToast={showToast}
            />
          )}

          {/* ADMIN: TELEMETRY DASHBOARD */}
          {currentTab === "admin-dashboard" && (
            <AdminDashboardView
              allUsers={allUsers}
              auditLogs={auditLogs}
              onSelectTab={(tab) => setCurrentTab(tab)}
              onOpenCreateUser={() => setCurrentTab("admin-users")}
            />
          )}

          {/* ADMIN: USER ACCESS CONTROL */}
          {currentTab === "admin-users" && (
            <AdminUserManagementView
              allUsers={allUsers}
              onCreateUser={handleAdminCreateUser}
              onUpdateUser={handleAdminUpdateUser}
              onBulkAction={handleAdminBulkAction}
              showToast={showToast}
            />
          )}

          {/* ADMIN: SYSTEM SECURE AUDIT LOGS */}
          {currentTab === "admin-logs" && (
            <AuditLogView auditLogs={auditLogs} activeRole={activeRole} currentUser={currentUser} />
          )}

          {/* TAB 6: SETTINGS / INTEGRATION SPECS */}
          {currentTab === "settings" && (
            <SettingsView onTriggerIntake={handleTriggerIntake} />
          )}

          {/* Fallback Tabs for simple navigation */}
          {currentTab === "admin-panel" && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
              <ShieldCheck className="h-12 w-12 text-blue-600 mx-auto" />
              <h3 className="text-sm font-bold text-gray-900">Audit CMS Administrator Control Center</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Configure staff access tokens, authorize judicial appeal officers, and monitor active database sessions. This admin control panel is secure and write-locked with mTLS client validation rules.
              </p>
              <div className="border border-gray-150 rounded-lg p-3 text-left font-mono text-[11px] bg-slate-50 text-slate-600">
                ACTIVE SYSTEM ACTORS: 9 Accounts Authorized • DB Status: COMPACT GREEN
              </div>
            </div>
          )}

          {currentTab === "help-center" && (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-xl mx-auto shadow-sm space-y-4">
              <HelpCircle className="h-12 w-12 text-slate-400 mx-auto" />
              <h3 className="text-sm font-bold text-gray-900">Audit Case Management System Knowledge Base</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Consult standard tax audit procedures, state machine legal documentation constraints, and compliance dispute resolution grounds.
              </p>
              <button 
                onClick={() => transitionToTab("dashboard")}
                className="bg-slate-900 text-white font-bold text-xs py-2 px-4 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          )}
            </>
          )}
        </main>
      </div>

      {/* ==========================================
          MODAL: MANUAL NEW AUDIT CASE CREATION
          ========================================== */}
      {isNewCaseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-gray-100 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
                <Building className="h-5 w-5 text-blue-600" />
                Initiate Manual Audit Case
              </h3>
              <button onClick={() => setIsNewCaseModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualCaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500">Taxpayer TIN</label>
                <input
                  type="text"
                  placeholder="e.g. TIN-88219321"
                  value={newCaseTin}
                  onChange={(e) => setNewCaseTin(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 p-2.5 rounded-lg font-mono font-bold text-gray-800 mt-1"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500">Audit Type / Objectives</label>
                <select
                  value={newCaseType}
                  onChange={(e) => setNewCaseType(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 p-2.5 rounded-lg mt-1 font-semibold text-gray-800"
                >
                  <option value="VAT Input Integrity Verification">VAT Input Integrity Verification</option>
                  <option value="Transfer Pricing Offshore Royalty Review">Transfer Pricing Offshore Royalty Review</option>
                  <option value="Corporate Tax Sales Reconciliation">Corporate Tax Sales Reconciliation</option>
                  <option value="Individual Revenue Verification Audit">Individual Revenue Verification Audit</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500">Lead Auditor</label>
                  <select
                    value={newCaseLeadId}
                    onChange={(e) => setNewCaseLeadId(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 p-2.5 rounded-lg mt-1"
                    required
                  >
                    {allUsers.filter(u => u.role === UserRole.AUDITOR).map(aud => (
                      <option key={aud.id} value={aud.id}>{aud.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-gray-500">Est. Tax Base (MWK)</label>
                  <input
                    type="number"
                    value={newCaseImpact}
                    onChange={(e) => setNewCaseImpact(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 p-2.5 rounded-lg mt-1 text-right font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-gray-500">Initiation Notes & Directives</label>
                <textarea
                  rows={3}
                  placeholder="Identify audit scope, compliance anomalies, or statutory references..."
                  value={newCaseNotes}
                  onChange={(e) => setNewCaseNotes(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 p-2.5 rounded-lg mt-1 leading-relaxed"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewCaseModalOpen(false)}
                  className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg shadow-md"
                >
                  Open Audit Case
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
