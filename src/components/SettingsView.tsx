import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Info, 
  Terminal, 
  Radio, 
  FileText, 
  Cpu, 
  User, 
  Send, 
  Eye, 
  X,
  Database
} from "lucide-react";
import { generateReasoningHash, runRiskAnalysisModel } from "../models/riskAnalysisModel";

interface SettingsViewProps {
  onTriggerIntake: (payload: {
    tin: string;
    score: number;
    method: string;
    rawOutput: string;
    factors: { name: string; percentage: number }[];
  }) => Promise<any>;
}

interface SubmissionRecord {
  id: string;
  taxpayerId: string;
  score: number;
  timestamp: string;
  status: string;
  hash: string;
  factors: { name: string; percentage: number }[];
}

export default function SettingsView({ onTriggerIntake }: SettingsViewProps) {
  // Heartbeat ticking UTC clock
  const [heartbeatTime, setHeartbeatTime] = useState("");

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      const ms = String(now.getUTCMilliseconds()).padStart(3, '0');
      setHeartbeatTime(`${hours}:${minutes}:${seconds}.${ms} Z`);
    };
    updateClock();
    const timer = setInterval(updateClock, 64);
    return () => clearInterval(timer);
  }, []);

  // API Latency Fluctuations
  const [latency, setLatency] = useState(12);
  const [latencyBars, setLatencyBars] = useState([40, 60, 50, 80, 45, 60]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => {
        const diff = Math.floor(Math.random() * 5) - 2;
        const next = prev + diff;
        return next > 6 && next < 25 ? next : prev;
      });
      setLatencyBars(prev => {
        const next = [...prev.slice(1), Math.floor(Math.random() * 60) + 20];
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Form states
  const [taxpayerId, setTaxpayerId] = useState("TIN-990-112-X");
  const [riskCoefficient, setRiskCoefficient] = useState("0.91");
  const [reasoningHash, setReasoningHash] = useState("sha256: 8f92b3c4e5a6f7d8c9b0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q");
  
  // Submission lists with high quality defaults
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([
    { 
      id: "sub-1", 
      taxpayerId: "TIN-990-112-X (Kanjedza Trading)", 
      score: 0.91, 
      timestamp: "2024-05-10 10:15:32", 
      status: "COMMITTED",
      hash: "sha256: 8f92b3c4e5a6f7d8c9b0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q",
      factors: [
        { name: "Disputed Capital Gains asset valuation", percentage: 55 },
        { name: "Offshore software licensing royalties discrepancy", percentage: 25 },
        { name: "Benford's Law distribution compliance variance", percentage: 11 }
      ]
    },
    { 
      id: "sub-2", 
      taxpayerId: "TIN-9122-ACMS (Sunbird Energy)", 
      score: 0.35, 
      timestamp: "2024-04-05 11:24:18", 
      status: "COMMITTED",
      hash: "sha256: abc1283d98ef230a1b5c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t",
      factors: [
        { name: "Green tax credit verification date mismatch", percentage: 22 },
        { name: "Minor input VAT verification delay", percentage: 13 }
      ]
    },
    { 
      id: "sub-3", 
      taxpayerId: "TIN-8115-ACMS (Shire Highlands)", 
      score: 0.62, 
      timestamp: "2024-02-18 14:45:09", 
      status: "COMMITTED",
      hash: "sha256: 7f32b3c4e5a6f7d8c9b0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6xyz",
      factors: [
        { name: "OECD arm's length transfer pricing royalty flows", percentage: 42 },
        { name: "Inter-company local asset transactions", percentage: 20 }
      ]
    },
    { 
      id: "sub-4", 
      taxpayerId: "TIN-8901-ACMS (Mzuzu Agro-Traders)", 
      score: 0.54, 
      timestamp: "2024-02-10 09:30:22", 
      status: "COMMITTED",
      hash: "sha256: f192b3c4e5a6f7d8c9b0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6fff",
      factors: [
        { name: "Asset liquidation and estate tax valuation dispute", percentage: 35 },
        { name: "Unreconciled seasonal warehouse inputs", percentage: 19 }
      ]
    },
    { 
      id: "sub-5", 
      taxpayerId: "TIN-994287-PLI (Chichiri Precision)", 
      score: 0.88, 
      timestamp: "2023-11-15 16:02:44", 
      status: "COMMITTED",
      hash: "sha256: b292b3c4e5a6f7d8c9b0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6qqq",
      factors: [
        { name: "Unusual high-value raw material inputs", percentage: 48 },
        { name: "Underreported corporate services profit margin deviation", percentage: 40 }
      ]
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  
  // Detailed Inspector Modal state
  const [selectedRecord, setSelectedRecord] = useState<SubmissionRecord | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const totalPages = Math.ceil(submissions.length / pageSize) || 1;
  const paginatedSubmissions = submissions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Helper to generate new reasoning hash
  const handleRegenerateHash = () => {
    setReasoningHash(generateReasoningHash());
  };

  const handleRunAnalysisSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxpayerId.trim()) {
      setErrorToast("Taxpayer Identifier is required.");
      return;
    }
    const scoreVal = parseFloat(riskCoefficient);
    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 1) {
      setErrorToast("Risk Coefficient must be between 0.00 and 1.00");
      return;
    }

    setLoading(true);
    setErrorToast(null);
    setSuccessToast(null);

    try {
      const { scorePercentage, rawOutput, factors } = runRiskAnalysisModel({
        taxpayerId,
        riskCoefficient: scoreVal,
        reasoningHash
      });

      // Submit directly to backend Intake API
      const intakeRes = await fetch("/api/risk/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tin: taxpayerId,
          score: scorePercentage,
          method: "ML Core RSS-CORE-V2",
          rawOutput,
          factors
        })
      });

      if (!intakeRes.ok) {
        const errorData = await intakeRes.json();
        throw new Error(errorData.error || "Failed to transmit risk telemetry.");
      }

      const intakeData = await intakeRes.json();

      // Trigger callback to refresh central App contexts
      await onTriggerIntake({
        tin: taxpayerId,
        score: scorePercentage,
        method: "ML Core RSS-CORE-V2",
        rawOutput,
        factors
      });

      // Add to local Submission History table
      const newRecord: SubmissionRecord = {
        id: `sub-${Date.now()}`,
        taxpayerId,
        score: scoreVal,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
        status: "COMMITTED",
        hash: reasoningHash,
        factors
      };

      setSubmissions(prev => [newRecord, ...prev]);
      setSuccessToast(`Anomaly telemetry for ${taxpayerId} successfully committed to ledger.`);
      
      // Auto-regenerate next hash for security feel
      handleRegenerateHash();
    } catch (err: any) {
      console.error(err);
      setErrorToast(err.message || "A secure communication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-700" id="risk-score-view-root">
      
      {/* Top Header System Status Bar */}
      <div className="bg-white border border-slate-200 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm" id="system-status-bar">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-mono font-bold text-slate-950 text-sm tracking-tight flex items-center gap-2">
              System ID: RSS-402
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">Audit CMS Risk & Score Integration Portal</p>
          </div>
        </div>
        
        <div className="flex items-center gap-5 self-start sm:self-auto text-xs">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">LAST HEARTBEAT</span>
            <span className="font-mono text-[11px] font-bold text-slate-700 tracking-tight block mt-0.5">T: {heartbeatTime}</span>
          </div>
          
          <div className="flex items-center gap-3.5 pl-4 border-l border-slate-200">
            <div className="relative">
              <Radio className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
            </div>
            <div className="h-8 w-8 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200 text-slate-500" title="Secure Client Connection">
              <User className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Statuses (1/3) & Right Form (2/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="risk-main-grid">
        
        {/* Left Column stats */}
        <div className="space-y-6 lg:col-span-1">
          
          {/* Card 1: Engine Health */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4" id="engine-health-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">ENGINE HEALTH</span>
              <span className="text-2xl font-bold text-emerald-600 tracking-tight">99.9%</span>
            </div>
            
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full w-[99.9%] rounded-full transition-all duration-1000"></div>
            </div>
            
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              Continuous operational monitoring active. All micro-services communicating within standard thresholds.
            </p>
          </div>

          {/* Card 2: API Latency */}
          <div className="bg-[#0b1329] border border-slate-800 rounded-xl p-5 shadow-md text-white space-y-3 relative overflow-hidden" id="api-latency-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">API LATENCY</span>
              <Cpu className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            
            <div>
              <span className="text-3xl font-mono font-bold text-emerald-400 tracking-tight">{latency} ms</span>
            </div>
            
            {/* Visual Equalizer Bars Graph */}
            <div className="flex items-end gap-1.5 h-10 mt-3 pt-2">
              {latencyBars.map((h, i) => (
                <div 
                  key={i}
                  style={{ height: `${h}%` }}
                  className="w-full bg-emerald-500/30 rounded-t hover:bg-emerald-400/50 transition-all duration-500 cursor-help"
                  title={`Sample node-${i + 1} load index`}
                ></div>
              ))}
            </div>
          </div>

          {/* Card 3: Access Constraints */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4" id="access-constraints-card">
            <div className="flex items-center gap-2 pb-2.5 border-b border-slate-100">
              <Info className="h-4.5 w-4.5 text-blue-500" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">ACCESS CONSTRAINTS</h3>
            </div>
            
            <div className="space-y-3.5">
              <div className="flex items-start gap-3 text-xs font-medium text-slate-600">
                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
                <span>One-way data submission channel active.</span>
              </div>
              
              <div className="flex items-start gap-3 text-xs font-medium text-slate-600">
                <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                <span>No read access to external case data.</span>
              </div>
              
              <div className="flex items-start gap-3 text-xs font-medium text-slate-600">
                <Lock className="h-4.5 w-4.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Immutable hash-based reasoning required.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Submit Form */}
        <form onSubmit={handleRunAnalysisSubmit} className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5 flex flex-col justify-between" id="risk-scoring-form">
          
          {/* Header block with badges */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Submit New Risk Score</h3>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">Authenticated submission for VAT fraud mitigation engine.</p>
            </div>
            
            <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-bold py-1 px-2.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <Lock className="h-3 w-3 shrink-0" />
              ENCRYPTED ENDPOINT
            </div>
          </div>

          {/* Form Body Fields */}
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Field 1: Taxpayer Identifier */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase block tracking-wider">TAXPAYER IDENTIFIER</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="pl-10 pr-3 py-3 w-full bg-slate-50 border border-slate-250 rounded-xl font-mono text-sm font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="TaxID-XXXXX"
                    value={taxpayerId}
                    onChange={(e) => setTaxpayerId(e.target.value)}
                    required
                  />
                  <div className="absolute left-3.5 top-3.5 text-slate-400">
                    <Terminal className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide">Official fiscal registration code.</p>
              </div>

              {/* Field 2: Risk Coefficient */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase block tracking-wider">RISK COEFFICIENT (0.00 - 1.00)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    max="1" 
                    className="pl-4 pr-14 py-3 w-full bg-slate-50 border border-slate-250 rounded-xl font-mono text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0.00"
                    value={riskCoefficient}
                    onChange={(e) => setRiskCoefficient(e.target.value)}
                    required
                  />
                  {/* Decorative vertical equalizer indicators overlay */}
                  <div className="absolute right-4 top-3.5 flex gap-1 items-end h-4.5">
                    <div className={`w-0.75 rounded-t transition-colors ${parseFloat(riskCoefficient) >= 0.8 ? 'bg-rose-500 h-1.5' : 'bg-slate-300 h-1.5'}`}></div>
                    <div className={`w-0.75 rounded-t transition-colors ${parseFloat(riskCoefficient) >= 0.5 ? 'bg-amber-500 h-3' : 'bg-slate-300 h-2'}`}></div>
                    <div className={`w-0.75 rounded-t transition-colors ${parseFloat(riskCoefficient) >= 0.8 ? 'bg-rose-500 h-4' : 'bg-slate-300 h-3'}`}></div>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wide">ML-derived probability of anomaly.</p>
              </div>

            </div>

            {/* Field 3: Reasoning Hash Displays */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 uppercase block tracking-wider">REASONING HASH (ML REFERENCE)</label>
              
              <div className="flex items-center justify-between bg-slate-900 border border-slate-950 text-slate-200 px-4 py-3 rounded-xl font-mono text-xs shadow-inner">
                <div className="flex items-center gap-3 overflow-hidden mr-4">
                  <Cpu className="h-4 w-4 text-slate-500 shrink-0" />
                  <span className="truncate tracking-tight select-all">{reasoningHash}</span>
                </div>
                <button 
                  type="button"
                  onClick={handleRegenerateHash}
                  className="p-1.5 hover:bg-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                  title="Generate New Secure Cryptographic Reasoning Hash"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide">Generated by internal ML core RSS-CORE-V2.</p>
            </div>
          </div>

          {/* Form Submit Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
            <div className="text-xs text-slate-400 font-medium">
              Submissions require signed cryptographic token authorization.
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="py-3 px-6 bg-[#0e635e] hover:bg-[#0b514d] disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 shadow-sm"
              id="run-analysis-submit-btn"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  RUNNING ML INFERENCE...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 transform rotate-[-15deg]" />
                  RUN ANALYSIS & SUBMIT
                </>
              )}
            </button>
          </div>

        </form>

      </div>

      {/* Interactive Toasts (Success / Error) */}
      {successToast && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 flex items-center justify-between shadow-sm animate-in fade-in duration-300" id="success-toast-alert">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
            <span className="text-xs font-semibold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-500 hover:text-emerald-800 text-sm font-bold">&times;</button>
        </div>
      )}
      {errorToast && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 flex items-center justify-between shadow-sm animate-in fade-in duration-300" id="error-toast-alert">
          <div className="flex items-center gap-2.5">
            <XCircle className="h-4.5 w-4.5 text-rose-600" />
            <span className="text-xs font-semibold">{errorToast}</span>
          </div>
          <button onClick={() => setErrorToast(null)} className="text-rose-500 hover:text-rose-800 text-sm font-bold">&times;</button>
        </div>
      )}

      {/* Bottom Layout: Submission History Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden" id="submission-history-panel">
        
        {/* Table Title and Metadata Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Submission History</h3>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Visible history limited by access protocol
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 tracking-wider uppercase">
                <th className="py-3 px-5">TAXPAYER ID</th>
                <th className="py-3 px-5">SCORE</th>
                <th className="py-3 px-5">TIMESTAMP</th>
                <th className="py-3 px-5">STATUS</th>
                <th className="py-3 px-5 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150">
              {paginatedSubmissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Taxpayer ID */}
                  <td className="py-3.5 px-5 font-mono font-bold text-slate-900">
                    {sub.taxpayerId}
                  </td>
                  
                  {/* Visual Progress Score */}
                  <td className="py-3.5 px-5">
                    <div className="flex items-center min-w-[140px]">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden mr-3">
                        <div 
                          style={{ width: `${sub.score * 100}%` }}
                          className={`h-full rounded-full ${
                            sub.score >= 0.8 ? "bg-rose-500" :
                            sub.score < 0.4 ? "bg-emerald-500" :
                            "bg-blue-500"
                          }`}
                        ></div>
                      </div>
                      <span className={`font-mono font-bold ${
                        sub.score >= 0.8 ? "text-rose-600" :
                        sub.score < 0.4 ? "text-emerald-600" :
                        "text-blue-600"
                      }`}>
                        {sub.score.toFixed(2)}
                      </span>
                    </div>
                  </td>
                  
                  {/* Timestamp */}
                  <td className="py-3.5 px-5 font-mono text-slate-500">
                    {sub.timestamp}
                  </td>
                  
                  {/* Status Badge */}
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                      {sub.status}
                    </span>
                  </td>
                  
                  {/* Action Inspector Button */}
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={() => setSelectedRecord(sub)}
                      className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                      title="Inspect Model reasoning metrics"
                      id={`inspect-${sub.id}`}
                    >
                      <FileText className="h-4.5 w-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Beautiful Pagination Footer */}
        {submissions.length > 0 && (
          <div className="p-4 border-t border-gray-150 flex items-center justify-between bg-white text-xs text-gray-500 shrink-0">
            <div>
              Showing <span className="font-semibold">{paginatedSubmissions.length}</span> of{" "}
              <span className="font-semibold">{submissions.length.toLocaleString()}</span> submissions
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

      {/* Detail JSON/Reasoning Inspector Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-200" id="reasoning-inspector-modal">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
            
            {/* Modal Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <Cpu className="h-5 w-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold tracking-tight">Telemetry Evidence Log</h4>
                  <p className="text-[10px] text-slate-400 font-medium">Record ID: {selectedRecord.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                id="close-inspector-modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[500px] overflow-y-auto">
              
              {/* Record Summary Table */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-250 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Taxpayer ID</span>
                  <p className="font-mono font-bold text-slate-800 mt-1">{selectedRecord.taxpayerId}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Risk Score</span>
                  <p className="font-mono font-bold text-slate-800 mt-1">{(selectedRecord.score * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Timestamp</span>
                  <p className="font-mono text-slate-500 mt-1">{selectedRecord.timestamp}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-bold text-[10px] uppercase">Engine Status</span>
                  <p className="font-mono font-bold text-emerald-600 mt-1">{selectedRecord.status}</p>
                </div>
              </div>

              {/* Secure Reasoning Cryptographic Fingerprint */}
              <div className="space-y-1.5">
                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block">Cryptographic Reasoning Fingerprint</span>
                <div className="bg-slate-900 text-slate-300 p-3 rounded-xl font-mono text-[11px] border border-slate-800 select-all truncate">
                  {selectedRecord.hash}
                </div>
              </div>

              {/* Dynamic Simulated Factors contribution bar charts */}
              <div className="space-y-3">
                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block">Identified Outlier Factor Weights</span>
                <div className="space-y-2">
                  {selectedRecord.factors.map((fac, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                        <span>{fac.name}</span>
                        <span>{fac.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${fac.percentage}%` }}
                          className="h-full bg-blue-500 rounded-full"
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comprehensive JSON telemetry log inspect block */}
              <div className="space-y-1.5">
                <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider block">Full Model Payload JSON</span>
                <pre className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-900 max-h-52">
                  {JSON.stringify({
                    id: selectedRecord.id,
                    taxpayerId: selectedRecord.taxpayerId,
                    risk_coefficient: selectedRecord.score,
                    evaluation_date: selectedRecord.timestamp,
                    model_gated_hash: selectedRecord.hash,
                    enforcement_action: selectedRecord.score >= 0.85 ? "AUTO_OPEN_SLA_CASE" : "RETAINED_IN_AUDIT_LEDGER",
                    factors: selectedRecord.factors
                  }, null, 2)}
                </pre>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
