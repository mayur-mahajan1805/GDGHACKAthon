import { useState } from 'react';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { format, formatDistanceToNow } from 'date-fns';
import {
  X,
  MapPin,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Image,
  ExternalLink,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Building2,
  User,
  Clock,
} from 'lucide-react';
import { db } from '../../firebase';
import { CategoryBadge } from '../shared/CategoryBadge';
import { StatusBadge, getStatusConfig } from '../shared/StatusBadge';
import { PriorityBar } from '../shared/PriorityBar';

const STATUS_FLOW = ['new', 'assigned', 'in_progress', 'resolved'];

// ── Helpers ────────────────────────────────────────────────────────────────────
function safeFormatDate(val, formatStr = 'PPpp') {
  if (!val) return '—';
  let dateObj = null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    dateObj = val;
  } else if (typeof val?.toDate === 'function') {
    dateObj = val.toDate();
  } else if (typeof val === 'number' || typeof val === 'string') {
    dateObj = new Date(val);
  } else if (val?.seconds) {
    dateObj = new Date(val.seconds * 1000);
  }
  if (!dateObj || isNaN(dateObj.getTime())) return '—';
  try { return format(dateObj, formatStr); } catch (e) { return '—'; }
}

function safeFormatRelative(val) {
  if (!val) return '—';
  let dateObj = null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    dateObj = val;
  } else if (typeof val?.toDate === 'function') {
    dateObj = val.toDate();
  } else if (typeof val === 'number' || typeof val === 'string') {
    dateObj = new Date(val);
  } else if (val?.seconds) {
    dateObj = new Date(val.seconds * 1000);
  }
  if (!dateObj || isNaN(dateObj.getTime())) return '—';
  try { return formatDistanceToNow(dateObj, { addSuffix: true }); } catch (e) { return '—'; }
}

// ── SLA Countdown Badge ───────────────────────────────────────────────────────
function SlaBadge({ slaDeadline }) {
  const deadline = slaDeadline ? new Date(slaDeadline) : null;
  if (!deadline || isNaN(deadline.getTime())) return null;
  const msLeft = deadline.getTime() - Date.now();
  const hoursLeft = msLeft / (1000 * 60 * 60);

  if (hoursLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-900/40 border border-red-500/50 text-red-400 text-[10px] font-bold">
        <Clock size={9}/> SLA BREACHED
      </span>
    );
  }
  if (hoursLeft < 6) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900/40 border border-amber-500/50 text-amber-400 text-[10px] font-semibold">
        <Clock size={9}/> {Math.round(hoursLeft)}h remaining
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-400 text-[10px]">
      <Clock size={9}/> {Math.round(hoursLeft)}h SLA
    </span>
  );
}

// ── Status step indicator ─────────────────────────────────────────────────────
function StatusStep({ status, current }) {
  const config = getStatusConfig(status);
  const idx = STATUS_FLOW.indexOf(status);
  const currentIdx = STATUS_FLOW.indexOf(current);
  const isDone = idx <= currentIdx;
  const isCurrent = idx === currentIdx;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`
          w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 text-xs font-bold transition-all
          ${isDone
            ? `${config.bg} ${config.textColor ?? config.text} ${config.border}`
            : 'bg-slate-800 border-slate-600 text-slate-600'
          }
          ${isCurrent ? 'ring-2 ring-offset-1 ring-offset-slate-900 ring-current' : ''}
        `}
      >
        {isDone ? <CheckCircle2 size={12} /> : idx + 1}
      </div>
      <span className={`text-xs ${isDone ? 'text-slate-200' : 'text-slate-600'} ${isCurrent ? 'font-semibold' : ''}`}>
        {config.label}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function DetailPanel({ complaint, onClose }) {
  const [updating, setUpdating]     = useState(false);
  const [note, setNote]             = useState('');
  const [assignedTo, setAssignedTo] = useState(complaint.assigned_to || '');
  const [error, setError]           = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!complaint) return null;

  const currentIdx = STATUS_FLOW.indexOf(complaint.status);
  const nextStatus = STATUS_FLOW[currentIdx + 1] ?? null;
  const nextConfig = nextStatus ? getStatusConfig(nextStatus) : null;

  async function handleStatusChange(newStatus) {
    setUpdating(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const historyEntry = {
        status: newStatus,
        timestamp: new Date().toISOString(),
        by: assignedTo.trim() || 'official',
        note: note.trim() || '',
      };
      await updateDoc(doc(db, 'complaints', complaint.id), {
        status: newStatus,
        updated_at: Timestamp.now(),
        assigned_to: assignedTo.trim() || complaint.assigned_to || null,
        ...(note.trim() ? { official_note: note.trim() } : {}),
        status_history: [
          ...(complaint.status_history || []),
          historyEntry,
        ],
      });
      setSuccessMsg(`Status updated to "${getStatusConfig(newStatus).label}"`);
      setNote('');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setError('Update failed: ' + err.message);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 flex items-start justify-between p-4 border-b border-slate-700/50">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-blue-400 font-medium">{complaint.tracking_id}</span>
            <StatusBadge status={complaint.status} />
          </div>
          <h2 className="text-sm font-semibold text-white leading-snug line-clamp-2">
            {complaint.summary}
          </h2>
        </div>
        <button
          id="detail-close"
          onClick={onClose}
          className="ml-3 flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-700/30">

        {/* Meta row */}
        <div className="px-4 py-3 flex flex-wrap gap-3">
          <CategoryBadge category={complaint.category} size="sm" />
          <div className="flex items-center gap-1 text-slate-400">
            <MapPin size={12} />
            <span className="text-xs">{complaint.ward}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Calendar size={12} />
            <span className="text-xs" title={safeFormatDate(complaint.created_at)}>
              {safeFormatRelative(complaint.created_at)}
            </span>
          </div>
        </div>

        {/* Department & SLA row */}
        {(complaint.department || complaint.sla_deadline) && (
          <div className="px-4 py-2.5 flex flex-wrap gap-2 items-center bg-blue-950/20">
            {complaint.department && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-900/30 border border-blue-500/30 text-blue-300 text-xs font-medium">
                <Building2 size={11}/>
                {complaint.department}
              </span>
            )}
            <SlaBadge slaDeadline={complaint.sla_deadline} />
            {complaint.assigned_to && (
              <span className="inline-flex items-center gap-1 text-slate-400 text-xs">
                <User size={10}/> {complaint.assigned_to}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-slate-300 leading-relaxed">{complaint.text}</p>
          {complaint.language && complaint.language !== 'en' && (
            <p className="text-xs text-slate-600 mt-1">Original language: {complaint.language}</p>
          )}
        </div>

        {/* Photo */}
        {complaint.photo_url ? (
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Photo Evidence</p>
              {complaint.photo_verified ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <ShieldCheck size={12} /> Verified
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-amber-400">
                  <ShieldAlert size={12} /> Unverified
                </span>
              )}
            </div>
            <div className="relative rounded-lg overflow-hidden bg-slate-800">
              <img
                src={complaint.photo_url}
                alt="Complaint photo evidence"
                className="w-full h-40 object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <a
                href={complaint.photo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-2 right-2 p-1 rounded bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 text-slate-600">
              <Image size={14} />
              <span className="text-xs">No photo submitted</span>
            </div>
          </div>
        )}

        {/* Priority score breakdown */}
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Priority Score</p>
          <PriorityBar complaint={complaint} />
        </div>

        {/* Status workflow */}
        <div className="px-4 py-3">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Status Workflow</p>

          {/* Progress steps */}
          <div className="flex items-center gap-1 mb-4">
            {STATUS_FLOW.map((status, idx) => (
              <div key={status} className="flex items-center gap-1 flex-1">
                <StatusStep status={status} current={complaint.status} />
                {idx < STATUS_FLOW.length - 1 && (
                  <ChevronRight size={10} className="text-slate-600 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Officer assignment + note */}
          <div className="space-y-2 mb-3">
            <div className="relative">
              <User size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"/>
              <input
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="Assign to officer (e.g. Eng. Sharma, JE Patel)"
                className="w-full bg-slate-800 border border-slate-600/50 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Official notes (e.g. Repair team dispatched under Supv. Sharma, ETA 4h)…"
              rows={2}
              className="w-full bg-slate-800 border border-slate-600/50 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 resize-none focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Advance button */}
          {nextStatus ? (
            <button
              id={`advance-status-${nextStatus}`}
              onClick={() => handleStatusChange(nextStatus)}
              disabled={updating}
              className={`
                w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium
                transition-all disabled:opacity-50 disabled:cursor-not-allowed
                ${nextConfig?.bg} ${nextConfig?.textColor ?? nextConfig?.text}
                border ${nextConfig?.border}
                hover:brightness-110
              `}
            >
              {updating ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>Mark as <strong>{nextConfig?.label}</strong></>
              )}
            </button>
          ) : (
            <div className="flex items-center justify-center gap-1.5 py-2 text-xs text-green-400">
              <CheckCircle2 size={14} />
              Complaint resolved
            </div>
          )}

          {/* Jump to any status */}
          <div className="mt-2 flex flex-wrap gap-1">
            {STATUS_FLOW.filter((s) => s !== complaint.status).map((status) => {
              const cfg = getStatusConfig(status);
              return (
                <button
                  key={status}
                  id={`set-status-${status}`}
                  onClick={() => handleStatusChange(status)}
                  disabled={updating}
                  className={`
                    text-xs px-2 py-1 rounded border transition-all
                    bg-slate-800/50 text-slate-400 border-slate-600/50
                    hover:${cfg.bg} hover:${cfg.text} hover:${cfg.border}
                    disabled:opacity-30
                  `}
                >
                  → {cfg.label}
                </button>
              );
            })}
          </div>

          {/* Feedback messages */}
          {successMsg && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-green-400 bg-green-900/20 border border-green-500/30 rounded-lg px-3 py-2">
              <CheckCircle2 size={12} />
              {successMsg}
            </div>
          )}
          {error && (
            <p className="mt-2 text-xs text-red-400 bg-red-900/20 border border-red-500/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Status history timeline */}
        {complaint.status_history?.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">Activity Log</p>
            <div className="space-y-2">
              {[...complaint.status_history].reverse().map((entry, i) => {
                const cfg = getStatusConfig(entry.status);
                return (
                  <div key={i} className="flex gap-2.5">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot ?? 'bg-slate-500'}`}/>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-semibold ${cfg.text ?? 'text-slate-300'}`}>{cfg.label}</span>
                        {entry.by && <span className="text-[10px] text-slate-500">by {entry.by}</span>}
                      </div>
                      {entry.note && <p className="text-[10px] text-slate-400 mt-0.5">{entry.note}</p>}
                      <p className="text-[9px] text-slate-600 mt-0.5">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString('en-IN') : ''}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Coordinates */}
        <div className="px-4 py-3">
          <p className="text-xs text-slate-600 font-mono">
            {typeof complaint.lat === 'number' ? complaint.lat.toFixed(5) : '—'}, {typeof complaint.lng === 'number' ? complaint.lng.toFixed(5) : '—'}
          </p>
          <p className="text-xs text-slate-600">
            Last updated: {safeFormatDate(complaint.updated_at, 'dd MMM yyyy, HH:mm')}
          </p>
        </div>
      </div>
    </div>
  );
}
