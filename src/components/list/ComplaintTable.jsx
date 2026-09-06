import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  FileSearch,
} from 'lucide-react';
import { CategoryBadge } from '../shared/CategoryBadge';
import { StatusBadge } from '../shared/StatusBadge';

function safeFormat(val, fmt = 'dd MMM, HH:mm') {
  if (!val) return '—';
  let d = null;
  if (val instanceof Date) d = val;
  else if (typeof val?.toDate === 'function') d = val.toDate();
  else if (val?.seconds) d = new Date(val.seconds * 1000);
  else d = new Date(val);
  if (!d || isNaN(d.getTime())) return '—';
  try { return format(d, fmt); } catch { return '—'; }
}

const PAGE_SIZE = 20;

function SortIcon({ field, sortKey, sortDir }) {
  if (sortKey !== field) return <ChevronsUpDown size={12} className="text-slate-600" />;
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-blue-400" />
    : <ChevronDown size={12} className="text-blue-400" />;
}

function PriorityCell({ score, tier }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-1.5 h-5 rounded-full flex-shrink-0"
        style={{ background: tier?.color ?? '#94A3B8' }}
      />
      <span className={`font-mono font-semibold tabular-nums ${tier?.textColor ?? 'text-slate-300'}`}>
        {score}
      </span>
      <span className={`text-xs ${tier?.textColor ?? 'text-slate-500'} opacity-70`}>
        {tier?.tier}
      </span>
    </div>
  );
}

export function ComplaintTable({ complaints, selectedComplaint, onSelectComplaint }) {
  const [sortKey, setSortKey] = useState('priority_score');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(1);

  function handleSort(field) {
    if (sortKey === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(field);
      setSortDir('desc');
    }
    setPage(1);
  }

  const sorted = useMemo(() => {
    return [...complaints].sort((a, b) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [complaints, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageComplaints = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const COLUMNS = [
    { key: 'tracking_id',   label: 'Tracking ID', width: 'w-28' },
    { key: 'category',      label: 'Category',    width: 'w-28' },
    { key: 'summary',       label: 'Description', width: '' },
    { key: 'ward',          label: 'Ward',        width: 'w-24' },
    { key: 'priority_score',label: 'Priority',    width: 'w-32' },
    { key: 'status',        label: 'Status',      width: 'w-28' },
    { key: 'created_at',    label: 'Submitted',   width: 'w-28' },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-slate-900 border-b border-slate-700/50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`${col.width} px-3 py-2.5 text-left`}
                >
                  <button
                    onClick={() => handleSort(col.key)}
                    className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-white transition-colors uppercase tracking-wider group"
                  >
                    {col.label}
                    <SortIcon field={col.key} sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {pageComplaints.length === 0 ? (
              <tr>
                <td colSpan={7}>
                  <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700/60 flex items-center justify-center">
                      <FileSearch size={22} className="text-slate-500"/>
                    </div>
                    <p className="text-slate-300 font-semibold text-sm">No results found</p>
                    <p className="text-slate-500 text-xs max-w-xs">Try adjusting your filters, or reset them to see all complaints.</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageComplaints.map((complaint, idx) => {
                const isSelected = selectedComplaint?.id === complaint.id || selectedComplaint?.tracking_id === complaint.tracking_id;
                return (
                  <tr
                    key={complaint.id || complaint.tracking_id || `complaint-${idx}`}
                    onClick={() => onSelectComplaint(complaint)}
                    className={`
                      cursor-pointer transition-colors
                      ${isSelected
                        ? 'bg-blue-600/10 border-l-2 border-blue-500'
                        : 'hover:bg-slate-800/40 border-l-2 border-transparent'
                      }
                    `}
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="font-mono-display text-xs text-blue-400 font-semibold">
                        {complaint.tracking_id}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <CategoryBadge category={complaint.category} />
                    </td>
                    <td className="px-3 py-2.5 max-w-0">
                      <p className="text-xs text-slate-300 truncate max-w-xs" title={complaint.summary || complaint.text}>
                        {complaint.summary || complaint.text || '—'}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-xs text-slate-300">{complaint.ward || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <PriorityCell
                        score={complaint.priority_score}
                        tier={complaint.priority_tier}
                      />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <StatusBadge status={complaint.status} />
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <span className="text-xs text-slate-400 tabular-nums">
                        {safeFormat(complaint.created_at)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-t border-slate-700/50 bg-slate-900/50">
        <p className="text-xs text-slate-500">
          {sorted.length === 0
            ? 'No results'
            : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, sorted.length)} of ${sorted.length} complaints`}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-slate-400 px-1">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-1 rounded text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
