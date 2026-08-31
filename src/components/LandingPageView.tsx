import React from "react";
import { 
  ShieldCheck, 
  Workflow, 
  Activity, 
  Shield, 
  Menu,
  X
} from "lucide-react";
// @ts-ignore
import auditGuardHero from "../assets/images/audit_guard_hero_1784291634517.jpg";

interface LandingPageViewProps {
  onGetStarted: () => void;
}

export default function LandingPageView({ onGetStarted }: LandingPageViewProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    document.title = "Audit Case Management System";
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 font-sans flex flex-col selection:bg-blue-500 selection:text-white" id="landing-page">
      
      {/* HEADER NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo Brand */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="h-9 w-9 bg-[#0b2540] text-white rounded-xl flex items-center justify-center shadow-md">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-[#0b2540] tracking-tight">Audit Case Management System</span>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-10">
            <button 
              onClick={() => scrollToSection("landing-page")} 
              className="text-sm font-medium text-slate-500 hover:text-[#0b2540] transition-colors cursor-pointer"
            >
              Overview
            </button>
            <button 
              onClick={() => scrollToSection("features")} 
              className="text-sm font-medium text-slate-500 hover:text-[#0b2540] transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button 
              onClick={() => scrollToSection("lifecycle")} 
              className="text-sm font-medium text-slate-500 hover:text-[#0b2540] transition-colors cursor-pointer"
            >
              Lifecycle
            </button>
          </nav>

          {/* Header Action Button */}
          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={onGetStarted}
              className="bg-[#0b2540] hover:bg-[#153a5c] text-white py-2.5 px-5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all duration-300 transform active:scale-[0.98] cursor-pointer"
            >
              Request Demo
            </button>
          </div>

          {/* Mobile Menu Trigger */}
          <button 
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg focus:outline-none"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-200 py-6 px-6 shadow-xl flex flex-col gap-5 animate-in slide-in-from-top-5 duration-200">
            <button 
              onClick={() => { setMobileMenuOpen(false); scrollToSection("landing-page"); }} 
              className="text-left text-base font-semibold text-slate-600 hover:text-[#0b2540] transition-colors py-1"
            >
              Overview
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); scrollToSection("features"); }} 
              className="text-left text-base font-semibold text-slate-600 hover:text-[#0b2540] transition-colors py-1"
            >
              Capabilities
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); scrollToSection("lifecycle"); }} 
              className="text-left text-base font-semibold text-slate-600 hover:text-[#0b2540] transition-colors py-1"
            >
              Lifecycle
            </button>
            <hr className="border-slate-100 my-1" />
            <button 
              onClick={() => { setMobileMenuOpen(false); onGetStarted(); }}
              className="w-full bg-[#0b2540] hover:bg-[#153a5c] text-white py-3 px-5 rounded-xl text-center text-sm font-bold shadow-md transition-all duration-300 cursor-pointer"
            >
              Request Demo
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-start overflow-hidden py-16 md:py-24">
        {/* Background Image Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src={auditGuardHero} 
            alt="Workspace Background" 
            className="w-full h-full object-cover object-center scale-105"
            referrerPolicy="no-referrer"
          />
          {/* Dark high-contrast gradient overlay to ensure perfect readability of white text */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-slate-950/40" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 w-full flex justify-start">
          {/* Text sitting directly on top of background image layer with rich layout spacing */}
          <div className="max-w-2xl space-y-6">

            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15] drop-shadow-md">
              Audit Case Management System
            </h1>
            
            <p className="text-slate-200 text-sm md:text-lg leading-relaxed font-medium max-w-xl drop-shadow">
              Designed for organizations that demand secure operations, seamless workflows, and real-time compliance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <button 
                onClick={onGetStarted}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white py-3.5 px-7 rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 transform active:scale-[0.98] cursor-pointer text-center"
              >
                Request Demo
              </button>
              <button 
                onClick={() => scrollToSection("features")}
                className="w-full sm:w-auto bg-white/10 hover:bg-white/25 border border-white/25 text-white py-3.5 px-7 rounded-xl text-sm font-semibold transition-all duration-300 cursor-pointer backdrop-blur-sm text-center"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* TRUSTED BY GLOBAL LEADERS */}
      <section className="py-12 border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
            Trusted by Global Leaders & Financial Institutions
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 lg:gap-20">
            <div className="flex items-center gap-2 font-sans font-black text-slate-600 tracking-widest text-xs md:text-sm uppercase hover:text-blue-600 transition-colors duration-300 opacity-70 hover:opacity-100 cursor-default">
              <span>Google</span>
            </div>
            
            <div className="flex items-center gap-2 font-sans font-black text-slate-600 tracking-widest text-xs md:text-sm uppercase hover:text-slate-950 transition-colors duration-300 opacity-70 hover:opacity-100 cursor-default">
              <span>Apple</span>
            </div>
            
            <div className="flex items-center gap-2 font-sans font-black text-slate-600 tracking-widest text-xs md:text-sm uppercase hover:text-emerald-600 transition-colors duration-300 opacity-70 hover:opacity-100 cursor-default">
              <span>OpenAI</span>
            </div>
            
            <div className="flex items-center gap-2 font-sans font-black text-slate-600 tracking-widest text-xs md:text-sm uppercase hover:text-blue-900 transition-colors duration-300 opacity-70 hover:opacity-100 cursor-default underline decoration-blue-500/30 decoration-2 underline-offset-4">
              <span>Deloitte</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES / CAPABILITIES */}
      <section id="features" className="py-20 bg-slate-50/40">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#0b2540] tracking-tight">
              Advanced Capabilities for Audit Professionals
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1: Automated Workflows */}
            <div className="bg-white border border-slate-200/50 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 space-y-5 flex flex-col">
              <div className="h-12 w-12 bg-[#0b2540] text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-900/10 shrink-0">
                <Workflow className="h-6 w-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-bold text-[#0b2540]">Automated Workflows</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Eliminate manual errors and speed up reporting by mapping standardized processes to automated triggers.
                </p>
              </div>
            </div>

            {/* Card 2: Real-Time Compliance */}
            <div className="bg-white border border-slate-200/50 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 space-y-5 flex flex-col">
              <div className="h-12 w-12 bg-[#0b2540] text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-900/10 shrink-0">
                <Activity className="h-6 w-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-bold text-[#0b2540]">Real-Time Compliance</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Stay ahead of regulatory changes with live monitoring systems that flag potential issues instantly.
                </p>
              </div>
            </div>

            {/* Card 3: Secure Collaboration */}
            <div className="bg-white border border-slate-200/50 rounded-2xl p-8 shadow-sm hover:shadow-md transition-all duration-300 space-y-5 flex flex-col">
              <div className="h-12 w-12 bg-[#0b2540] text-white rounded-xl flex items-center justify-center shadow-md shadow-blue-900/10 shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div className="space-y-2 flex-1">
                <h3 className="text-lg font-bold text-[#0b2540]">Secure Collaboration</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Bank-level security for team communication and document sharing ensures zero data leaks.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECURE AUDIT LIFECYCLE */}
      <section id="lifecycle" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl font-extrabold text-[#0b2540] tracking-tight">
              The Lifecycle of a Secure Audit
            </h2>
            <p className="text-slate-500 text-sm">
              Our structured methodology ensures every case is handled with rigorous precision from start to finish.
            </p>
          </div>

          {/* Timeline diagram */}
          <div className="relative">
            {/* Connecting Horizontal Line (Desktop only) */}
            <div className="hidden md:block absolute top-[44px] left-[15%] right-[15%] h-[2px] bg-slate-200" />

            <div className="grid md:grid-cols-3 gap-12 relative z-10">
              {/* Step 1: Planning */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-10 w-10 bg-[#0b2540] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-8 ring-slate-100">
                  1
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h3 className="text-base font-bold text-[#0b2540]">Planning</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Define scope, assign specialized team members, and set compliance benchmarks.
                  </p>
                </div>
              </div>

              {/* Step 2: Execution */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-10 w-10 bg-[#0b2540] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-8 ring-slate-100">
                  2
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h3 className="text-base font-bold text-[#0b2540]">Execution</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Real-time data ingestion, automated testing, and secure document verification.
                  </p>
                </div>
              </div>

              {/* Step 3: Reporting */}
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-10 w-10 bg-[#0b2540] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-8 ring-slate-100">
                  3
                </div>
                <div className="space-y-1.5 max-w-xs">
                  <h3 className="text-base font-bold text-[#0b2540]">Reporting</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Generate comprehensive, export-ready audit reports with immutable logs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-gradient-to-br from-[#07192d] via-[#0b2540] to-[#040c1c] text-white py-24 relative overflow-hidden">
        {/* Animated Fluid Glows */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none animate-glow-flow" />
        <div className="absolute -bottom-10 right-1/4 w-[400px] h-[400px] bg-indigo-500/15 rounded-full blur-[100px] pointer-events-none animate-glow-flow-reverse" />
        <div className="absolute -top-12 right-10 w-[300px] h-[300px] bg-sky-500/10 rounded-full blur-[80px] pointer-events-none animate-glow-flow" />

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute bottom-10 left-[15%] w-2 h-2 rounded-full bg-blue-400/40 animate-drift-slow-1" />
          <div className="absolute bottom-24 left-[45%] w-3.5 h-3.5 rounded-full bg-sky-400/20 animate-drift-slow-2" />
          <div className="absolute bottom-5 left-[75%] w-1.5 h-1.5 rounded-full bg-indigo-400/30 animate-drift-slow-3" />
          <div className="absolute bottom-16 left-[85%] w-2.5 h-2.5 rounded-full bg-blue-300/25 animate-drift-slow-4" />
        </div>

        {/* Subtle Tech Grid/Lines decoration */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0e_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-60 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center space-y-6 relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Ready to transform your auditing process?
          </h2>
          <p className="text-slate-300 text-sm md:text-lg leading-relaxed max-w-xl mx-auto">
            Join hundreds of regulatory agencies and corporate audit departments who have modernized their workflows with the Audit Case Management System.
          </p>
          <div className="pt-6">
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto justify-center bg-white hover:bg-slate-50 hover:scale-[1.03] text-[#0b2540] py-4 px-10 rounded-xl text-sm font-extrabold shadow-xl hover:shadow-2xl hover:shadow-blue-900/30 transition-all duration-300 active:scale-[0.98] transform cursor-pointer inline-flex items-center gap-2"
            >
              Get Started
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-50 border-t border-slate-100 py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <ShieldCheck className="h-4.5 w-4.5 text-[#0b2540]" />
              <span>Audit Case Management System</span>
            </div>
            <p className="text-[11px] text-slate-400 text-center md:text-left">
              © 2026 Audit Case Management System. All rights reserved.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8 font-medium">
            <a href="#landing-page" onClick={(e) => {e.preventDefault(); alert("Audit Case Management System Privacy Policy: This system stores audit trails securely using local and cloud ledgers.");}} className="hover:text-slate-800 transition-colors">Privacy Policy</a>
            <a href="#landing-page" onClick={(e) => {e.preventDefault(); alert("Audit Case Management System Terms of Service: Only authorized staff personnel are permitted to sign in.");}} className="hover:text-slate-800 transition-colors">Terms of Service</a>
            <a href="#landing-page" onClick={(e) => {e.preventDefault(); alert("Audit Case Management System Security Compliance: Fully compliant under ISO-27001, standard secure audit protocol directives.");}} className="hover:text-slate-800 transition-colors">Security Compliance</a>
            <a href="#landing-page" onClick={(e) => {e.preventDefault(); alert("Need support? Email techsupport@auditcms.gov or contact your supervisor.");}} className="hover:text-slate-800 transition-colors">Contact Support</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
