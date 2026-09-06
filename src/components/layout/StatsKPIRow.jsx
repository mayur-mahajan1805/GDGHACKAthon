import { useMemo } from 'react';
import { AlertCircle, Zap, CheckCircle2, Clock, Activity, ArrowUpRight } from 'lucide-react';

function toDate(val) {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  if (typeof val?.toDate === 'function') return val.toDate();
  if (val?.seconds) return new Date(val.seconds * 1000);
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function diffHours(a, b) {
  return Math.abs(a.getTime() - b.getTime()) / 3_600_000;
}

function ModernKPICard({ icon: Icon, label, value, sub, theme, tag }) {
  const themeStyles = {
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      bg: 'bg-gradient-to-br from-amber-500/[0.08] via-slate-900/60 to-slate-950/80',
      iconBox: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
      valueText: 'text-amber-300',
      glow: 'shadow-amber-500/5',
      tagBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      bg: 'bg-gradient-to-br from-rose-500/[0.08] via-slate-900/60 to-slate-950/80',
      iconBox: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
      valueText: 'text-rose-300',
      glow: 'shadow-rose-500/5',
      tagBadge: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      bg: 'bg-gradient-to-br from-emerald-500/[0.08] via-slate-900/60 to-slate-950/80',
      iconBox: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      valueText: 'text-emerald-300',
      glow: 'shadow-emerald-500/5',
      tagBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      bg: 'bg-gradient-to-br from-cyan-500/[0.08] via-slate-900/60 to-slate-950/80',
      iconBox: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400',
      valueText: 'text-cyan-300',
      glow: 'shadow-cyan-500/5',
      tagBadge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    },
  }[theme] || {};

  return (
    <div className={`group relative rounded-2xl p-4 border backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 shadow-xl ${themeStyles.bg} ${themeStyles.border} ${themeStyles.glow} flex-1 min-w-[200px]`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${themeStyles.iconBox} shadow-lg`}>
          <Icon className="w-5 h-5" />
        </div>
        {tag && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${themeStyles.tagBadge} flex items-center gap-1`}>
            {tag}
          </span>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${themeStyles.valueText}`}>
            {value}
          </span>
        </div>
        <div className="text-xs font-bold text-slate-200 tracking-wide">{label}</div>
        {sub && <div className="text-[11px] text-slate-400 font-medium">{sub}</div>}
      </div>
    </div>
  );
}

export function StatsKPIRow({ complaints }) {
  const stats = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diffToMon = (day === 0 ? -6 : 1 - day);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() + diffToMon);
    weekStart.setHours(0, 0, 0, 0);

    const open = complaints.filter(
      c => c.status === 'new' || c.status === 'assigned' || c.status === 'in_progress'
    );
    const highPrio = complaints.filter(
      c => (c.priority_score ?? 0) >= 65 && c.status !== 'resolved'
    );
    const resolved = complaints.filter(c => c.status === 'resolved');

    const resolvedWk = resolved.filter(c => {
      const d = toDate(c.updated_at);
      return d && d >= weekStart;
    });

    const validForAvg = resolved.filter(c => toDate(c.created_at) && toDate(c.updated_at));
    const avgHours = validForAvg.length > 0
      ? validForAvg.reduce((acc, c) => acc + diffHours(toDate(c.updated_at), toDate(c.created_at)), 0) / validForAvg.length
      : null;

    const avgLabel = avgHours === null
      ? '—'
      : avgHours < 24
        ? `${Math.round(avgHours)} hrs`
        : `${Math.round(avgHours / 24)} days`;

    return {
      openCount: open.length,
      highCount: highPrio.length,
      resolvedWk: resolvedWk.length,
      avgLabel,
      total: complaints.length,
    };
  }, [complaints]);

  return (
    <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md flex items-stretch gap-3 sm:gap-4 overflow-x-auto">
      <ModernKPICard
        icon={AlertCircle}
        label="Active Grievances"
        value={stats.openCount}
        sub={`of ${stats.total} total in database`}
        theme="amber"
        tag="Requires Action"
      />
      <ModernKPICard
        icon={Zap}
        label="High Priority Emergencies"
        value={stats.highCount}
        sub={stats.highCount > 0 ? "Urgent intervention required" : "Zero critical escalations"}
        theme="rose"
        tag="Score ≥65"
      />
      <ModernKPICard
        icon={CheckCircle2}
        label="Resolved This Week"
        value={stats.resolvedWk}
        sub="Redressed by ward engineers"
        theme="emerald"
        tag="Verified Fixed"
      />
      <ModernKPICard
        icon={Clock}
        label="Average Resolution Speed"
        value={stats.avgLabel}
        sub="Mean ticket lifecycle turnaround"
        theme="cyan"
        tag="SLA Benchmark"
      />
    </div>
  );
}
