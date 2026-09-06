import { LogOut, Radio, ShieldCheck, Menu, X, ExternalLink, Shield } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export function AppShell({ children, sidebarOpen, onToggleSidebar }) {
  const { user, officialProfile, signOut } = useAuth();

  const officerName  = officialProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'Official';
  const designation  = officialProfile?.designation || 'Municipal Field Officer';
  const ward         = officialProfile?.ward || 'All Wards / Central HQ';
  const dept         = (officialProfile?.department || 'general').toUpperCase();

  const initials = officerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200" style={{ height: '100dvh' }}>
      {/* ── Top Navigation Bar ── */}
      <header
        className="flex-shrink-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800/80 flex items-center px-3 sm:px-6 gap-3 sm:gap-4 z-50 shadow-2xl relative"
        style={{ height: '56px' }}
      >
        {/* Subtle accent border line at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        {/* Sidebar Toggle (mobile) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all lg:hidden cursor-pointer"
          aria-label="Toggle filters"
        >
          {sidebarOpen ? <X size={16}/> : <Menu size={16}/>}
        </button>

        {/* Civic Brand */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-300/30">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
          </div>

          <div className="leading-tight">
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                Voice2Action
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                OFFICIAL
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Municipal Grievance Intelligence System
            </div>
          </div>
        </div>

        <div className="flex-1" />

        {/* Link to Citizen Portal */}
        <a
          href="/citizen"
          target="_blank"
          rel="noreferrer"
          className="hidden md:inline-flex items-center gap-2 text-xs text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-700/50 hover:border-cyan-500/80 px-3 py-1.5 rounded-xl transition-all font-semibold shadow-lg shadow-cyan-950/40 group cursor-pointer"
        >
          <span>Citizen Portal</span>
          <ExternalLink className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </a>

        {/* Official Officer Credentials Card */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-slate-800">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-200">{officerName}</span>
              <span className="text-[10px] bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 px-1.5 py-0.5 rounded-md font-mono font-semibold">
                {dept}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {designation} · <span className="text-cyan-400/80 font-medium">{ward}</span>
            </div>
          </div>

          {/* Official Avatar Badge */}
          <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600/60 flex items-center justify-center flex-shrink-0 shadow-inner">
            <span className="text-xs font-bold text-cyan-300 font-mono">{initials || 'OF'}</span>
          </div>

          {/* Sign Out Button */}
          <button
            id="sign-out-btn"
            onClick={signOut}
            title="Sign out from Official Dashboard"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-300 transition-all px-2.5 py-1.5 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 cursor-pointer"
          >
            <LogOut size={13}/>
            <span className="hidden sm:inline font-medium">Exit</span>
          </button>
        </div>
      </header>

      {/* ── Main Dashboard Content ── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden bg-slate-950">
        {children}
      </main>
    </div>
  );
}
