import { useState, useMemo } from 'react';
import { Map, List, Loader2, AlertTriangle, Database, X } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { StatsKPIRow } from '../components/layout/StatsKPIRow';
import { FilterSidebar, applyFilters, DEFAULT_FILTERS } from '../components/shared/FilterSidebar';
import { MapView } from '../components/map/MapView';
import { ComplaintTable } from '../components/list/ComplaintTable';
import { DetailPanel } from '../components/detail/DetailPanel';
import { useComplaints } from '../hooks/useComplaints';
import { useAuth } from '../hooks/useAuth';

export function Dashboard() {
  const { complaints, loading, error, seeding } = useComplaints();
  const { officialProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('map');
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Derive unique wards
  const wards = useMemo(
    () => [...new Set(complaints.map((c) => c.ward).filter(Boolean))].sort(),
    [complaints]
  );

  // Per-status counts for sidebar badges
  const complaintCounts = useMemo(() => {
    const counts = {};
    complaints.forEach(c => { counts[c.status] = (counts[c.status] || 0) + 1; });
    return counts;
  }, [complaints]);

  // Apply filters
  const filtered = useMemo(
    () => applyFilters(complaints, filters),
    [complaints, filters]
  );

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
    <AppShell sidebarOpen={sidebarOpen} onToggleSidebar={() => setSidebarOpen(o => !o)}>
      {/* ── KPI Stats Row ── */}
      <StatsKPIRow complaints={complaints}/>

      {/* ── Content area: sidebar + main ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">

        {/* ── Left Filter Sidebar ── */}
        {/* Desktop: always visible. Mobile: overlay when open */}
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

          {/* Slim toolbar: tabs + result count */}
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

            {/* Result count */}
            <div className="flex-shrink-0 flex items-center gap-1.5 text-xs text-slate-500">
              <Database size={11}/>
              <span>
                <strong className="text-slate-200 font-semibold font-mono-display">{filtered.length}</strong>
                {filtered.length !== complaints.length && (
                  <span> / {complaints.length}</span>
                )}
                {' '}results
              </span>
            </div>
          </div>

          {/* Map / List — relative container so MapView absolute children anchor here */}
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
  );
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="flex-shrink-0 inline-flex items-center gap-1 bg-blue-500/15 text-blue-300 border border-blue-500/30 rounded-full px-2.5 py-0.5 text-[11px] font-medium">
      {label}
      <button onClick={onRemove} className="hover:text-white transition-colors ml-0.5">
        <X size={10}/>
      </button>
    </span>
  );
}
