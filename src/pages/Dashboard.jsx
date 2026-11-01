import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Map, List, Loader2, AlertTriangle, Database, X, Bell, BellRing, Building2 } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { StatsKPIRow } from '../components/layout/StatsKPIRow';
import { FilterSidebar, applyFilters, DEFAULT_FILTERS } from '../components/shared/FilterSidebar';
import { MapView } from '../components/map/MapView';
import { ComplaintTable } from '../components/list/ComplaintTable';
import { DetailPanel } from '../components/detail/DetailPanel';
import { useComplaints } from '../hooks/useComplaints';
import { useAuth } from '../hooks/useAuth';
import { getCategoryConfig } from '../components/shared/CategoryBadge';

// ─── Audio chime (synthesized — no external file needed) ──────────────────────
function playNotificationChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6 — ascending arpeggio
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch (_) {
    // Audio API not available — fail silently
  }
}

// ─── Toast notification component ────────────────────────────────────────────
function NotificationToast({ notifications, onDismiss }) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => {
        const cfg = getCategoryConfig(n.complaint.category);
        const isHigh = (n.complaint.priority_score ?? 0) >= 65;
        return (
          <div
            key={n.id}
            className={`
              pointer-events-auto
              flex items-start gap-3 min-w-[320px] max-w-sm
              rounded-xl border shadow-2xl
              backdrop-blur-xl
              px-4 py-3
              animate-slide-in-right
              ${isHigh
                ? 'bg-red-950/90 border-red-500/60 shadow-red-900/40'
                : 'bg-slate-900/90 border-blue-500/40 shadow-blue-900/30'
              }
            `}
          >
            {/* Icon */}
            <div className={`
              flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-base
              ${isHigh ? 'bg-red-500/20' : 'bg-blue-500/15'}
            `}>
              {cfg.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <BellRing size={11} className={isHigh ? 'text-red-400' : 'text-blue-400'} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isHigh ? 'text-red-400' : 'text-blue-400'}`}>
                  {isHigh ? '🚨 New Critical Complaint' : '🔔 New Complaint Registered'}
                </span>
              </div>
              <p className="text-white text-xs font-medium leading-snug line-clamp-2">
                {n.complaint.summary}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-slate-400">{n.complaint.ward}</span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                  <Building2 size={9} />
                  {n.complaint.department || cfg.label}
                </span>
                <span className="text-slate-600">•</span>
                <span className={`text-[10px] font-bold ${isHigh ? 'text-red-400' : 'text-amber-400'}`}>
                  Score: {n.complaint.priority_score}
                </span>
              </div>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => onDismiss(n.id)}
              className="flex-shrink-0 text-slate-500 hover:text-white transition-colors p-0.5"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── SLA Breach badge ────────────────────────────────────────────────────────
export function SlaBadge({ slaDeadline }) {
  const now = new Date();
  const deadline = slaDeadline ? new Date(slaDeadline) : null;
  if (!deadline || isNaN(deadline.getTime())) return null;

  const msLeft = deadline.getTime() - now.getTime();
  const hoursLeft = msLeft / (1000 * 60 * 60);

  if (hoursLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/40 border border-red-500/50 text-red-400 text-[10px] font-bold">
        ⚠️ SLA BREACHED
      </span>
    );
  }
  if (hoursLeft < 6) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/40 border border-amber-500/50 text-amber-400 text-[10px] font-semibold">
        ⏱ {Math.round(hoursLeft)}h left
      </span>
    );
  }
  return null;
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function Dashboard() {
  const { complaints, loading, error, seeding } = useComplaints();
  const { officialProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('map');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const notifCounterRef = useRef(0);

  // ── Derive unique wards & departments for filter dropdowns ──
  const wards = useMemo(
    () => [...new Set(complaints.map((c) => c.ward).filter(Boolean))].sort(),
    [complaints]
  );

  const departments = useMemo(
    () => [...new Set(complaints.map((c) => c.department).filter(Boolean))].sort(),
    [complaints]
  );

  // ── Per-status counts for sidebar badges ──
  const complaintCounts = useMemo(() => {
    const counts = {};
    complaints.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [complaints]);

  // ── Apply filters ──
  const filtered = useMemo(
    () => applyFilters(complaints, filters),
    [complaints, filters]
  );

  // ── Real-time notification listener ──────────────────────────────────────
  const handleNewComplaint = useCallback((event) => {
    const complaint = event.detail;
    playNotificationChime();

    const id = ++notifCounterRef.current;
    setNotifications(prev => [...prev, { id, complaint }]);

    // Auto-dismiss after 8 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 8000);
  }, []);

  useEffect(() => {
    window.addEventListener('civicvoice:new-complaint', handleNewComplaint);
    return () => window.removeEventListener('civicvoice:new-complaint', handleNewComplaint);
  }, [handleNewComplaint]);
  // ─────────────────────────────────────────────────────────────────────────

  function handleSelectComplaint(complaint) {
    setSelectedComplaint((prev) => (prev?.id === complaint.id ? null : complaint));
  }

  function handleFilterChange(newFilters) {
    setFilters(newFilters);
    setSelectedComplaint(null);
  }

  // ── Loading state ──
  if (loading || seeding) {
    return (
      <AppShell sidebarOpen={false} onToggleSidebar={() => {}}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-slate-400 bg-slate-950">
          <Loader2 size={32} className="animate-spin text-blue-400"/>
          <div className="text-center">
            <p className="text-white font-semibold text-sm">
              {seeding ? 'Seeding sample complaints…' : 'Loading complaints…'}
            </p>
            <p className="text-slate-500 text-xs mt-1">
              {seeding ? 'Populating Firestore with demo data.' : 'Fetching real-time data from Firestore.'}
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <AppShell sidebarOpen={false} onToggleSidebar={() => {}}>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-slate-950">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={24} className="text-red-400"/>
          </div>
          <div className="text-center">
            <p className="text-white font-semibold">Failed to load complaints</p>
            <p className="text-slate-400 text-sm mt-1 max-w-sm">{error}</p>
            <p className="text-slate-500 text-xs mt-2">
              Check your Firebase config in <code className="text-blue-400">.env.local</code>
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <>
      {/* ── Real-time notification toasts ── */}
      <NotificationToast
        notifications={notifications}
        onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
      />

      <AppShell sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(o => !o)}>
        {/* ── KPI Stats Row ── */}
        <StatsKPIRow complaints={complaints}/>

        {/* ── Content area: sidebar + main ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">

          {/* ── Left Filter Sidebar ── */}
          <div className={`
            h-full flex-shrink-0 transition-all duration-300 overflow-hidden
            ${sidebarOpen ? 'w-64' : 'w-0'}
            lg:block
            max-lg:absolute max-lg:inset-y-0 max-lg:left-0 max-lg:z-40
            ${sidebarOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
          `}>
            <FilterSidebar
              filters={filters}
              onChange={handleFilterChange}
              wards={wards}
              departments={departments}
              officialProfile={officialProfile}
              complaintCounts={complaintCounts}
            />
          </div>

          {/* Mobile backdrop */}
          {sidebarOpen && (
            <div
              className="absolute inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* ── Main area ── */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">

            {/* Toolbar: tabs + filter chips + count */}
            <div className="flex-shrink-0 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800/80 px-4 py-2 flex items-center gap-3">

              {/* Sidebar toggle: desktop */}
              <button
                onClick={() => setSidebarOpen(o => !o)}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700"
                title={sidebarOpen ? 'Collapse filters' : 'Expand filters'}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="1" width="12" height="12" rx="2"/>
                  <path d="M5 1v12"/>
                </svg>
              </button>

              {/* Tab switcher */}
              <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5">
                {[
                  { id: 'map', Icon: Map, label: 'Map' },
                  { id: 'list', Icon: List, label: 'List' },
                ].map(({ id, Icon, label }) => (
                  <button
                    key={id}
                    id={`tab-${id}`}
                    onClick={() => setActiveTab(id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                      ${activeTab === id
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/25'
                        : 'text-slate-400 hover:text-white'
                      }
                    `}
                  >
                    <Icon size={13}/>
                    {label}
                  </button>
                ))}
              </div>

              {/* Active filter chips */}
              <div className="flex-1 flex items-center gap-1.5 overflow-x-auto">
                {filters.ward && (
                  <FilterChip label={filters.ward} onRemove={() => handleFilterChange({ ...filters, ward: '' })}/>
                )}
                {filters.department && (
                  <FilterChip
                    label={filters.department}
                    color="amber"
                    onRemove={() => handleFilterChange({ ...filters, department: '' })}
                  />
                )}
                {filters.category && (
                  <FilterChip label={filters.category} onRemove={() => handleFilterChange({ ...filters, category: '' })}/>
                )}
                {filters.minPriority > 0 && (
                  <FilterChip label={`Score ≥${filters.minPriority}`} onRemove={() => handleFilterChange({ ...filters, minPriority: 0 })}/>
                )}
                {filters.search && (
                  <FilterChip label={`"${filters.search}"`} onRemove={() => handleFilterChange({ ...filters, search: '' })}/>
                )}
              </div>

              {/* Notification indicator */}
              {notifications.length > 0 && (
                <button
                  className="relative flex-shrink-0 text-slate-400 hover:text-white transition-colors"
                  title="New complaints arriving"
                >
                  <Bell size={15} className="text-blue-400 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                    {notifications.length}
                  </span>
                </button>
              )}

              {/* Result count */}
              <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-slate-500">
                <Database size={11}/>
                <span>
                  <strong className="text-slate-200 font-semibold font-mono">{filtered.length}</strong>
                  {filtered.length !== complaints.length && (
                    <span> / {complaints.length}</span>
                  )}
                  {' '}results
                </span>
              </div>
            </div>

            {/* Map / List */}
            <div className="relative flex-1 min-h-0 overflow-hidden">
              {activeTab === 'map' ? (
                <MapView
                  complaints={filtered}
                  totalCount={complaints.length}
                  selectedComplaint={selectedComplaint}
                  onSelectComplaint={handleSelectComplaint}
                  onResetFilters={() => handleFilterChange(DEFAULT_FILTERS)}
                />
              ) : (
                <div className="absolute inset-0 overflow-auto">
                  <ComplaintTable
                    complaints={filtered}
                    selectedComplaint={selectedComplaint}
                    onSelectComplaint={handleSelectComplaint}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Detail Panel — fixed overlay on right ── */}
          {selectedComplaint && (
            <div className="detail-overlay bg-slate-900 border-l border-slate-800/80 flex flex-col overflow-hidden animate-slide-in-right">
              <DetailPanel
                complaint={selectedComplaint}
                onClose={() => setSelectedComplaint(null)}
              />
            </div>
          )}
        </div>
      </AppShell>
    </>
  );
}

function FilterChip({ label, onRemove, color = 'blue' }) {
  const colors = {
    blue:  'bg-blue-500/15 text-blue-300 border-blue-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  };
  return (
    <span className={`flex-shrink-0 inline-flex items-center gap-1 border rounded-full px-2.5 py-0.5 text-[11px] font-medium ${colors[color] ?? colors.blue}`}>
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors ml-0.5">
        <X size={10}/>
      </button>
    </span>
  );
}
