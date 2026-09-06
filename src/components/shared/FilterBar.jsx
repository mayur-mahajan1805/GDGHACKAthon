import { SlidersHorizontal, X, Search, ShieldAlert, Building2 } from 'lucide-react';
import { ALL_CATEGORIES, getCategoryConfig } from './CategoryBadge';
import { ALL_STATUSES, getStatusConfig } from './StatusBadge';

/**
 * Shared filter bar used by both Map and List views.
 * All state is managed by the parent (Dashboard) and passed via props.
 */
export function FilterBar({ filters, onChange, wards, officialProfile, compact = false }) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.ward !== '' ||
    filters.category !== '' ||
    filters.statuses.length < ALL_STATUSES.length ||
    filters.minPriority > 0 ||
    filters.myJurisdictionOnly;

  function handleReset() {
    onChange({
      search: '',
      ward: '',
      category: '',
      statuses: [...ALL_STATUSES],
      minPriority: 0,
      myJurisdictionOnly: false,
    });
  }

  function toggleStatus(status) {
    const current = filters.statuses;
    if (current.includes(status)) {
      if (current.length === 1) return; // keep at least one
      onChange({ ...filters, statuses: current.filter((s) => s !== status) });
    } else {
      onChange({ ...filters, statuses: [...current, status] });
    }
  }

  function toggleJurisdiction() {
    const nextState = !filters.myJurisdictionOnly;
    if (nextState && officialProfile) {
      // Auto-set ward and category if official has assigned department/ward
      onChange({
        ...filters,
        myJurisdictionOnly: true,
        ward: officialProfile.ward && officialProfile.ward !== 'All Wards / Central HQ' ? officialProfile.ward : filters.ward,
        category: officialProfile.department && officialProfile.department !== 'general' ? officialProfile.department : filters.category,
      });
    } else {
      onChange({ ...filters, myJurisdictionOnly: false });
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      <div className="flex items-center gap-1.5 text-slate-400 flex-shrink-0">
        <SlidersHorizontal size={14} />
        <span className="font-medium hidden sm:inline">Filters</span>
      </div>

      {/* Search Input */}
      <div className="relative flex-shrink-0">
        <input
          id="filter-search"
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search ID, text, ward..."
          className="w-36 sm:w-48 bg-slate-800 border border-slate-600/70 text-slate-200 rounded px-2.5 py-1 pl-7 text-xs focus:outline-none focus:border-blue-500 placeholder-slate-500 transition-all"
        />
        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '' })}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* My Jurisdiction Quick Toggle */}
      {officialProfile && (
        <button
          type="button"
          onClick={toggleJurisdiction}
          title={`Filter complaints for ${officialProfile.ward || 'My Ward'} / ${officialProfile.department || 'My Dept'}`}
          className={`
            flex items-center gap-1 px-2 py-1 rounded border text-xs font-semibold transition-all flex-shrink-0
            ${filters.myJurisdictionOnly
              ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-600 hover:text-slate-200'
            }
          `}
        >
          <Building2 size={12} />
          <span>My Dept & Ward</span>
        </button>
      )}

      {/* Ward Dropdown */}
      <select
        id="filter-ward"
        value={filters.ward}
        onChange={(e) => onChange({ ...filters, ward: e.target.value, myJurisdictionOnly: false })}
        className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
      >
        <option value="">All Wards</option>
        {wards.map((w) => (
          <option key={w} value={w}>{w}</option>
        ))}
      </select>

      {/* Category Dropdown */}
      <select
        id="filter-category"
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value, myJurisdictionOnly: false })}
        className="bg-slate-800 border border-slate-600 text-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500 cursor-pointer"
      >
        <option value="">All Categories</option>
        {ALL_CATEGORIES.map((cat) => {
          const config = getCategoryConfig(cat);
          return (
            <option key={cat} value={cat}>
              {config.icon} {config.label}
            </option>
          );
        })}
      </select>

      {/* Status toggles */}
      <div className="flex items-center gap-1">
        {ALL_STATUSES.map((status) => {
          const config = getStatusConfig(status);
          const active = filters.statuses.includes(status);
          return (
            <button
              key={status}
              id={`filter-status-${status}`}
              onClick={() => toggleStatus(status)}
              className={`
                flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium transition-all
                ${active
                  ? `${config.bg} ${config.text} ${config.border}`
                  : 'bg-transparent text-slate-500 border-slate-700 opacity-50'
                }
              `}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${active ? config.dot : 'bg-slate-600'}`} />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Min priority slider */}
      <div className="flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/60 rounded px-2 py-0.5">
        <span className="text-xs text-slate-400 flex-shrink-0">Min score:</span>
        <input
          id="filter-min-priority"
          type="range"
          min={0}
          max={80}
          step={5}
          value={filters.minPriority}
          onChange={(e) => onChange({ ...filters, minPriority: Number(e.target.value) })}
          className="w-20 accent-blue-500 cursor-pointer"
        />
        <span className="text-xs font-mono font-bold text-blue-400 w-5 tabular-nums">{filters.minPriority}</span>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          id="filter-reset"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors ml-1"
        >
          <X size={12} />
          Reset
        </button>
      )}
    </div>
  );
}

/**
 * Apply filters to a list of complaints.
 */
export function applyFilters(complaints, filters) {
  return complaints.filter((c) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchId = c.tracking_id?.toLowerCase().includes(q);
      const matchText = c.text?.toLowerCase().includes(q);
      const matchSummary = c.summary?.toLowerCase().includes(q);
      const matchWard = c.ward?.toLowerCase().includes(q);
      const matchCategory = c.category?.toLowerCase().includes(q);
      if (!matchId && !matchText && !matchSummary && !matchWard && !matchCategory) return false;
    }
    if (filters.ward && c.ward !== filters.ward) return false;
    if (filters.category && c.category !== filters.category) return false;
    if (!filters.statuses.includes(c.status)) return false;
    if (c.priority_score < filters.minPriority) return false;
    return true;
  });
}

export const DEFAULT_FILTERS = {
  search: '',
  ward: '',
  category: '',
  statuses: [...ALL_STATUSES],
  minPriority: 0,
  myJurisdictionOnly: false,
};
