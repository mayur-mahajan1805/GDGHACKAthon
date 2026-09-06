import { LogOut, Radio, ShieldCheck, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export function AppShell({ children, sidebarOpen, onToggleSidebar }) {
  const { user, officialProfile, signOut } = useAuth();

  const officerName  = officialProfile?.name || user?.displayName || user?.email?.split('@')[0] || 'Official';
  const designation  = officialProfile?.designation || 'Municipal Official';
  const ward         = officialProfile?.ward || 'All Wards';
  const dept         = (officialProfile?.department || 'general').toUpperCase();

  const initials = officerName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col" style={{ height: '100dvh' }}>
      {/* ── Top Navigation ── */}
      <header
        className="flex-shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 flex items-center px-3 sm:px-5 gap-3 z-50"
        style={{ height: 'var(--header-h)' }}
      >
        {/* Sidebar Toggle (mobile) */}
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all lg:hidden"
          aria-label="Toggle filters"
        >
          {sidebarOpen ? <X size={16}/> : <Menu size={16}/>}
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/30">
            <svg width="14" height="14" viewBox="0 0 28 28" fill="none">
              <path d="M14 3L25 9V19L14 25L3 19V9L14 3Z" stroke="white" strokeWidth="2.5" fill="none"/>
              <circle cx="14" cy="14" r="3.5" fill="white"/>
            </svg>
          </div>
          <div className="leading-tight">
            <div className="text-sm font-bold text-white tracking-tight">Voice2Action</div>
            <div className="text-[10px] text-slate-500 hidden sm:block">Officials Dashboard</div>
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 ml-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"/>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"/>
          </span>
          <span className="text-[11px] text-green-400 font-semibold hidden sm:inline tracking-wide">LIVE</span>
        </div>

        <div className="flex-1"/>

        {/* Link to Citizen Portal */}
        <a
          href="/citizen"
          target="_blank"
          rel="noreferrer"
          className="hidden md:flex items-center gap-1.5 text-xs text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-800/80 px-2.5 py-1 rounded-lg transition-all font-medium"
        >
          <span>Citizen Portal</span>
          <span className="text-[10px] bg-cyan-500/20 px-1 rounded text-cyan-300">Public</span>
        </a>

        {/* Officer Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden sm:flex flex-col items-end leading-tight">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-white">{officerName}</span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded font-mono leading-none">
                {dept}
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {designation} · <span className="text-slate-300">{ward}</span>
            </div>
          </div>

          {/* Avatar */}
          <div className="relative w-8 h-8 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-blue-300">{initials || 'O'}</span>
          </div>

          {/* Sign Out */}
          <button
            id="sign-out-btn"
            onClick={signOut}
            title="Sign out"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all px-2.5 py-1.5 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700"
          >
            <LogOut size={13}/>
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
