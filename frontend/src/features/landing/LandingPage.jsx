import React from "react";
import { Link } from "react-router-dom";
import { 
  Send, 
  Layers, 
  Clock, 
  Shield, 
  ChevronRight, 
  Play, 
  Menu, 
  X, 
  Sparkles, 
  Terminal,
  Cpu,
  Zap,
  Lock
} from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { isAuthenticated } = useAuthStore();

  return (
    <div className="min-h-screen bg-[#0a0a13] text-[#fcfcfc] font-sans overflow-x-hidden relative selection:bg-[#6199f6]/30 selection:text-white">
      {/* Layered Cosmic Atmosphere Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,#000b35_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#0e0f20_0%,transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(195deg,rgba(10,0,16,0.5)_0%,rgba(2,0,10,0.8)_50%,rgba(12,29,50,0.3)_100%)] pointer-events-none" />

      {/* Announcement Banner */}
      <div className="relative z-50 bg-gradient-to-r from-[#0a0010] via-[#0c1d32] to-[#0a0a13] border-b border-[#2a2a32] text-center py-2.5 px-4">
        <p className="text-[12px] font-mono tracking-[0.06em] text-[#6199f6] flex items-center justify-center gap-1.5 uppercase">
          <Sparkles className="w-3.5 h-3.5" /> Gero 2.0: The Complete Freelancer OS is Now Available
        </p>
      </div>

      {/* Navigation Bar */}
      <header className="relative z-40 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-[#2a2a32]/40 bg-[#040407]/60 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-[#fcfcfc] flex items-center gap-2 font-mono">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#6199f6] to-[#4f4f80] flex items-center justify-center text-[#0a0a13]">G</span>
              GERO
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-[13px] text-[#a3a3b3] hover:text-[#fcfcfc] transition-colors relative group py-2">
              Features
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#6199f6] transition-all group-hover:w-full" />
            </a>
            <a href="#pipeline" className="text-[13px] text-[#a3a3b3] hover:text-[#fcfcfc] transition-colors relative group py-2">
              Pipeline
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#6199f6] transition-all group-hover:w-full" />
            </a>
            <a href="#invoices" className="text-[13px] text-[#a3a3b3] hover:text-[#fcfcfc] transition-colors relative group py-2">
              Invoices
              <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-[#6199f6] transition-all group-hover:w-full" />
            </a>
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            <Link 
              to="/dashboard" 
              className="rounded-full bg-[#fcfcfc] text-[#0a0a13] hover:bg-[#6199f6] hover:text-white transition-all text-[13px] font-medium px-5 py-2.5 shadow-sm"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="text-[13px] font-medium text-[#fcfcfc] hover:text-[#6199f6] transition-colors px-4 py-2">
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="rounded-full bg-[#fcfcfc] text-[#0a0a13] hover:bg-[#6199f6] hover:text-white transition-all text-[13px] font-medium px-5 py-2.5 shadow-sm"
              >
                Start Free
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#a3a3b3] hover:text-[#fcfcfc]"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-20 bg-[#040407] border-b border-[#2a2a32] p-6 flex flex-col gap-4 z-50 animate-in fade-in slide-in-from-top-5 duration-200">
          <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-[14px] text-[#a3a3b3] hover:text-[#fcfcfc] py-2">Features</a>
          <a href="#pipeline" onClick={() => setMobileMenuOpen(false)} className="text-[14px] text-[#a3a3b3] hover:text-[#fcfcfc] py-2">Pipeline</a>
          <a href="#invoices" onClick={() => setMobileMenuOpen(false)} className="text-[14px] text-[#a3a3b3] hover:text-[#fcfcfc] py-2">Invoices</a>
          <div className="h-[1px] bg-[#2a2a32] my-2" />
          {isAuthenticated ? (
            <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)} className="text-center py-3 bg-[#fcfcfc] text-[#0a0a13] hover:bg-[#6199f6] hover:text-white rounded-full font-medium text-[14px]">Go to Dashboard</Link>
          ) : (
            <>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center py-2.5 text-[14px] text-[#fcfcfc] hover:text-[#6199f6]">Sign In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="text-center py-3 bg-[#fcfcfc] text-[#0a0a13] hover:bg-[#6199f6] hover:text-white rounded-full font-medium text-[14px]">Start Free</Link>
            </>
          )}
        </div>
      )}

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 pt-16 md:pt-24 pb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* Eyebrow Section Identifier */}
          <div className="text-[12px] font-mono tracking-[0.06em] text-[#6199f6] uppercase">
            THE FREELANCER OPERATING SYSTEM
          </div>
          
          {/* Display Headline: Weight 400, tight tracking */}
          <h1 className="text-[44px] md:text-[68px] font-normal leading-[0.98] tracking-[-0.04em] text-[#fcfcfc] max-w-xl">
            One workspace for all your freelance work.
          </h1>
          
          {/* Subheadline Paragraph */}
          <p className="text-[16px] md:text-[18px] leading-relaxed text-[#757580] max-w-[500px]">
            Unify client pipelines, track projects, run lightning-fast timesheets, and generate automated, beautiful invoices. Beautifully simple, incredibly powerful.
          </p>

          {/* Stacked CTAs */}
          <div className="flex flex-wrap gap-4 pt-4">
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="rounded-full bg-[#fcfcfc] text-[#0a0a13] hover:bg-[#6199f6] hover:text-[#fcfcfc] transition-all text-[14px] font-medium px-7 py-3.5 shadow-lg"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/register" 
                  className="rounded-full bg-[#fcfcfc] text-[#0a0a13] hover:bg-[#6199f6] hover:text-[#fcfcfc] transition-all text-[14px] font-medium px-7 py-3.5 shadow-lg"
                >
                  Start Free Trial
                </Link>
                <Link 
                  to="/login"
                  className="rounded-full bg-transparent border border-[#fcfcfc] hover:bg-[#fcfcfc] hover:text-[#0a0a13] text-[#fcfcfc] transition-all text-[14px] font-medium px-7 py-3.5"
                >
                  Sign In to OS
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Product UI Mockup Container */}
        <div className="lg:col-span-6 relative">
          <div className="rounded-[10px] border border-[#4f4f80] bg-[#08080c] shadow-[inset_0_0_0_1px_#4f4f80,0_0_60px_rgba(79,79,128,0.15)] overflow-hidden">
            <div className="h-6 bg-[#040407] border-b border-[#2a2a32]/60 px-4 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500/60" />
              <span className="w-2 h-2 rounded-full bg-yellow-500/60" />
              <span className="w-2 h-2 rounded-full bg-green-500/60" />
              <span className="text-[10px] text-[#757580] ml-2 font-mono">gero-app-workspace.sh</span>
            </div>
            <div className="p-4 md:p-6 space-y-4">
              {/* Fake UI: Kanban + Invoices preview */}
              <div className="flex justify-between items-center pb-3 border-b border-[#2a2a32]/40">
                <span className="text-xs font-semibold text-[#fcfcfc]">Pipeline Active Leads</span>
                <span className="text-[10px] font-mono text-[#6199f6] px-2 py-0.5 rounded bg-[#6199f6]/10">$45,200 Pending</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#181826] p-3 rounded-lg border border-[#2a2a32]">
                  <span className="text-[10px] text-[#757580] uppercase tracking-wider block mb-1">Lead</span>
                  <div className="w-full h-1 bg-[#6199f6]/40 rounded mb-2" />
                  <span className="text-xs font-medium text-[#fcfcfc] block">Stripe Design</span>
                  <span className="text-[10px] text-[#a3a3b3]">$8,500</span>
                </div>
                <div className="bg-[#181826] p-3 rounded-lg border border-[#2a2a32]">
                  <span className="text-[10px] text-[#757580] uppercase tracking-wider block mb-1">Proposal</span>
                  <div className="w-full h-1 bg-[#6199f6]/60 rounded mb-2" />
                  <span className="text-xs font-medium text-[#fcfcfc] block">Nike Website</span>
                  <span className="text-[10px] text-[#a3a3b3]">$12,000</span>
                </div>
                <div className="bg-[#181826] p-3 rounded-lg border border-[#2a2a32]">
                  <span className="text-[10px] text-[#757580] uppercase tracking-wider block mb-1">Contract</span>
                  <div className="w-full h-1 bg-[#6199f6] rounded mb-2" />
                  <span className="text-xs font-medium text-[#fcfcfc] block">Tesla Portal</span>
                  <span className="text-[10px] text-[#a3a3b3]">$25,000</span>
                </div>
              </div>
              
              <div className="bg-[#181826]/40 p-4 rounded-xl border border-[#2a2a32]/60 space-y-2">
                <div className="flex justify-between items-center text-xs text-[#a3a3b3]">
                  <span>Active Timer: Nike Development</span>
                  <span className="font-mono text-[#6199f6]">02:14:52</span>
                </div>
                <div className="w-full bg-[#0a0a13] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#6199f6] h-full w-[60%] animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bands / Mid-page typographic block */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-[#2a2a32]/30 relative z-30">
        <div className="text-left mb-16 space-y-4 max-w-xl">
          <div className="text-[12px] font-mono tracking-[0.06em] text-[#6199f6] uppercase">
            DESIGNED FOR CREATIVES
          </div>
          <h2 className="text-[32px] md:text-[48px] font-normal leading-[1.02] tracking-[-0.03em] text-[#fcfcfc]">
            Built like an editing suite, not a spreadsheet.
          </h2>
          <p className="text-[15px] leading-relaxed text-[#757580]">
            No messy tables or complex layouts. GERO recedes into the background so you can project your creative content forward.
          </p>
        </div>

        {/* 4-Column Feature Grid (Outlined block features, no card bg) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#6199f6]/10 flex items-center justify-center border border-[#6199f6]/20">
              <Layers className="w-5 h-5 text-[#6199f6]" />
            </div>
            <h3 className="text-[18px] font-medium text-[#fcfcfc]">Pipeline Tracking</h3>
            <p className="text-[14px] leading-relaxed text-[#a3a3b3]">
              Visualize leads and client phases cleanly. Move stages dynamically, track values, and forecast your income.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#6199f6]/10 flex items-center justify-center border border-[#6199f6]/20">
              <Clock className="w-5 h-5 text-[#6199f6]" />
            </div>
            <h3 className="text-[18px] font-medium text-[#fcfcfc]">Time Tracking</h3>
            <p className="text-[14px] leading-relaxed text-[#a3a3b3]">
              Start billable project timers in a click. Generate line items automatically from logged time inside your invoices.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#6199f6]/10 flex items-center justify-center border border-[#6199f6]/20">
              <Send className="w-5 h-5 text-[#6199f6]" />
            </div>
            <h3 className="text-[18px] font-medium text-[#fcfcfc]">Auto Invoicing</h3>
            <p className="text-[14px] leading-relaxed text-[#a3a3b3]">
              Compose invoices instantly. E-mail PDF documents straight to clients with integrated momo and bank payment details.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#6199f6]/10 flex items-center justify-center border border-[#6199f6]/20">
              <Shield className="w-5 h-5 text-[#6199f6]" />
            </div>
            <h3 className="text-[18px] font-medium text-[#fcfcfc]">Financial Insights</h3>
            <p className="text-[14px] leading-relaxed text-[#a3a3b3]">
              Beautiful HSL charts, cashflow metrics, and risk-profiles built for you to review and secure revenue early.
            </p>
          </div>
        </div>
      </section>

      {/* Cinematic Showcase Section */}
      <section className="bg-[#040407] py-24 border-t border-[#2a2a32]/30 relative z-30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 max-w-xl mx-auto mb-16">
            <div className="text-[12px] font-mono tracking-[0.06em] text-[#6199f6] uppercase">
              WORKFLOW INTEGRATION
            </div>
            <h2 className="text-[32px] md:text-[48px] font-normal leading-[1.02] tracking-[-0.03em] text-[#fcfcfc]">
              Track progress dynamically
            </h2>
            <p className="text-[15px] leading-relaxed text-[#757580]">
              Keep tabs on every line item, task check-off, and payment provider setup on your Gero dashboard.
            </p>
          </div>

          {/* Video Showcase Player with Play button overlay */}
          <div className="relative max-w-4xl mx-auto rounded-[10px] border border-[#4f4f80] overflow-hidden group shadow-[0_24px_48px_rgba(0,0,0,0.5)]">
            <img 
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80" 
              alt="Gero Dashboard Preview"
              className="w-full object-cover h-[350px] md:h-[480px] brightness-50 group-hover:scale-105 transition-transform duration-700"
            />
            {/* Overlay Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Link 
                to="/register"
                className="w-16 h-16 rounded-full bg-[#6199f6]/90 backdrop-blur-sm flex items-center justify-center text-[#0a0a13] shadow-2xl hover:scale-110 hover:bg-[#fcfcfc] transition-all"
              >
                <Play className="w-6 h-6 ml-1 fill-current" />
              </Link>
            </div>
            {/* Caption */}
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-[12px] text-[#757580] bg-[#040407]/80 backdrop-blur px-4 py-2.5 rounded-lg border border-[#2a2a32]">
              <span>Demo project showcase: Tesla Marketing Hub</span>
              <span className="font-mono text-[#6199f6]">PROD READY</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quick CTA Block */}
      <section className="max-w-7xl mx-auto px-6 py-20 relative z-30 text-center space-y-6">
        <div className="text-[12px] font-mono tracking-[0.06em] text-[#6199f6] uppercase">
          SECURE YOUR FUTURE
        </div>
        <h2 className="text-[36px] md:text-[60px] font-normal leading-[1] tracking-[-0.03em] text-[#fcfcfc] max-w-2xl mx-auto">
          Ready to operate at premium efficiency?
        </h2>
        <p className="text-[15px] leading-relaxed text-[#757580] max-w-[500px] mx-auto">
          Join Gero for free and transform how you build, manage, and invoice your freelance services.
        </p>
        <div className="pt-4">
          <Link 
            to="/register" 
            className="rounded-full bg-[#fcfcfc] text-[#0a0a13] hover:bg-[#6199f6] hover:text-[#fcfcfc] transition-all text-[15px] font-medium px-8 py-4 shadow-lg inline-block"
          >
            Create Your Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a32]/40 bg-[#040407] py-12 relative z-30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-mono tracking-tight text-[#a3a3b3]">
              GERO © {new Date().getFullYear()} — MIDNIGHT CINEMA PROJECTION ROOM
            </span>
          </div>
          <div className="flex gap-6 text-[13px] text-[#757580]">
            <a href="#" className="hover:text-[#fcfcfc] transition-colors">Privacy</a>
            <a href="#" className="hover:text-[#fcfcfc] transition-colors">Terms</a>
            <a href="#" className="hover:text-[#fcfcfc] transition-colors">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
