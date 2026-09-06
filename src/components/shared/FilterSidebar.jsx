import { useState } from 'react';
import { SlidersHorizontal, X, Search, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { ALL_CATEGORIES, getCategoryConfig } from '../shared/CategoryBadge';
import { ALL_STATUSES, getStatusConfig } from '../shared/StatusBadge';

export const DEFAULT_FILTERS = {
  search: '',
  ward: '',
  category: '',
  statuses: [...ALL_STATUSES],
  minPriority: 0,
  myJurisdictionOnly: false,
};

// Wards that mean "show everything" — should not be used as an exact filter
const ALL_WARD_VALUES = ['', 'All Wards', 'All Wards / HQ', 'All Wards / Central HQ'];

export function applyFilters(complaints, filters) {
  const wardFilter = ALL_WARD_VALUES.includes(filters.ward) ? '' : filters.ward;
  return complaints.filter((c) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      if (
        !c.tracking_id?.toLowerCase().includes(q) &&
        !c.text?.toLowerCase().includes(q) &&
        !c.summary?.toLowerCase().includes(q) &&
        !c.ward?.toLowerCase().includes(q) &&
        !c.category?.toLowerCase().includes(q)
      ) return false;
    }
    if (wardFilter && c.ward !== wardFilter) return false;
    if (filters.category && filters.category !== 'general' && c.category !== filters.category) return false;
    if (!filters.statuses.includes(c.status)) return false;
    if ((c.priority_score ?? 0) < filters.minPriority) return false;
    return true;
  });
}

const STATUS_COLORS = {
  new:         { dot: 'bg-slate-400', pill: 'bg-slate-800 text-slate-300 border-slate-700', active: 'bg-slate-700 text-white border-slate-500' },
  assigned:    { dot: 'bg-blue-400',  pill: 'bg-blue-950 text-blue-300 border-blue-800',     active: 'bg-blue-600 text-white border-blue-500' },
  in_progress: { dot: 'bg-amber-400', pill: 'bg-amber-950 text-amber-300 border-amber-800',  active: 'bg-amber-600 text-white border-amber-500' },
  resolved:    { dot: 'bg-green-400', pill: 'bg-green-950 text-green-300 border-green-800',  active: 'bg-green-600 text-white border-green-500' },
};

function Section({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-800/80 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider hover:text-slate-200 transition-colors"
      >
        {title}
        {open ? <ChevronUp size={13}/> : <ChevronDown size={13}/>}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function FilterSidebar({ filters, onChange, wards, officialProfile, complaintCounts }) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.ward !== '' ||
    filters.category !== '' ||
    filters.statuses.length < ALL_STATUSES.length ||
    filters.minPriority > 0 ||
    filters.myJurisdictionOnly;

  function reset() {
    onChange({ ...DEFAULT_FILTERS });
  }

  function toggleStatus(status) {
    const cur = filters.statuses;
    if (cur.includes(status)) {
      if (cur.length === 1) return;
      onChange({ ...filters, statuses: cur.filter(s => s !== status) });
    } else {
      onChange({ ...filters, statuses: [...cur, status] });
    }
  }

  function applyJurisdiction() {
    const next = !filters.myJurisdictionOnly;
    if (next && officialProfile) {
      // Only set ward if it's a real specific ward (not a catch-all)
      const profileWard = officialProfile.ward ?? '';
      const useWard = ALL_WARD_VALUES.includes(profileWard) ? filters.ward : profileWard;
      // Only filter by department if it's a real category (not 'general')
      const profileDept = officialProfile.department ?? 'general';
      const useCat = profileDept === 'general' ? filters.category : profileDept;
      onChange({
        ...filters,
        myJurisdictionOnly: true,
        ward: useWard,
        category: useCat,
      });
    } else {
      onChange({ ...filters, myJurisdictionOnly: false });
    }
  }

  const statusLabels = { new: 'New', assigned: 'Assigned', in_progress: 'In Progress', resolved: 'Resolved' };

  return (
    <aside className="sidebar h-full bg-slate-900 border-r border-slate-800/80 flex flex-col overflow-hidden">
      {/* Sidebar Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2 text-slate-300 font-semibold">
          <SlidersHorizontal size={15} className="text-blue-400"/>
          Filters
        </div>
        {hasActiveFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-400 transition-colors px-1.5 py-0.5 rounded hover:bg-red-500/10"
          >
            <X size={12}/>
            Reset all
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-800/80">
          <div className="relative">
            <input
              id="filter-search"
              type="text"
              value={filters.search}
              onChange={e => onChange({ ...filters, search: e.target.value })}
              placeholder="Search ID, description, ward…"
              className="w-full bg-slate-950 border border-slate-700/70 text-slate-200 rounded-lg px-3 py-2 pl-8 text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all"
            />
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
            {filters.search && (
              <button onClick={() => onChange({ ...filters, search: '' })} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200 transition-colors">
                <X size={13}/>
              </button>
            )}
          </div>
        </div>

        {/* My Jurisdiction Quick Filter */}
        {officialProfile && (
          <div className="px-4 py-3 border-b border-slate-800/80">
            <button
              type="button"
              onClick={applyJurisdiction}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                filters.myJurisdictionOnly
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/25'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:border-slate-600'
              }`}
            >
              <Building2 size={13}/>
              <div className="text-left flex-1 min-w-0">
                <div className="truncate">{officialProfile.department?.toUpperCase() || 'My Dept'}</div>
                <div className="text-[10px] opacity-70 font-normal truncate">{officialProfile.ward || 'My Ward'}</div>
              </div>
              {filters.myJurisdictionOnly && <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-normal">Active</span>}
            </button>
          </div>
        )}

        {/* Ward */}
        <Section title="Ward / Zone">
          <select
            id="filter-ward"
            value={filters.ward}
            onChange={e => onChange({ ...filters, ward: e.target.value, myJurisdictionOnly: false })}
            className="w-full bg-slate-950 border border-slate-700/60 text-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all cursor-pointer"
          >
            <option value="">All Wards</option>
            {wards.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </Section>

        {/* Category */}
        <Section title="Category">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => onChange({ ...filters, category: '', myJurisdictionOnly: false })}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all text-left ${
                !filters.category ? 'bg-slate-700 text-white border-slate-600' : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
              }`}
            >
              All
            </button>
            {ALL_CATEGORIES.map(cat => {
              const cfg = getCategoryConfig(cat);
              const active = filters.category === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  id={`filter-cat-${cat}`}
                  onClick={() => onChange({ ...filters, category: active ? '' : cat, myJurisdictionOnly: false })}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    active
                      ? `${cfg.bg} ${cfg.text} ${cfg.border}`
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span className="truncate">{cfg.label}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Status */}
        <Section title="Status">
          <div className="space-y-1.5">
            {ALL_STATUSES.map(status => {
              const active = filters.statuses.includes(status);
              const cfg = STATUS_COLORS[status] || STATUS_COLORS.new;
              const count = complaintCounts?.[status] ?? 0;
              return (
                <button
                  key={status}
                  type="button"
                  id={`filter-status-${status}`}
                  onClick={() => toggleStatus(status)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    active ? cfg.active : `${cfg.pill} opacity-50`
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`}/>
                  <span className="flex-1 text-left">{statusLabels[status]}</span>
                  <span className={`text-[11px] font-bold tabular-nums ${active ? 'opacity-80' : ''}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* Priority Score */}
        <Section title="Min Priority Score">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">Minimum score</span>
              <span className={`text-sm font-bold font-mono-display tabular-nums ${
                filters.minPriority >= 65 ? 'text-red-400' :
                filters.minPriority >= 35 ? 'text-amber-400' : 'text-slate-300'
              }`}>{filters.minPriority}</span>
            </div>
            <input
              id="filter-min-priority"
              type="range"
              min={0}
              max={80}
              step={5}
              value={filters.minPriority}
              onChange={e => onChange({ ...filters, minPriority: Number(e.target.value) })}
              className="w-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-600 mt-1">
              <span>0 (All)</span>
              <span>35 Med</span>
              <span>65 High</span>
            </div>
          </div>
        </Section>
      </div>
    </aside>
  );
}
