import { useMemo } from 'react';
import { AlertCircle, Zap, CheckCircle2, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';

// Safe helper: always returns a Date or null
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

function Trend({ value }) {
  if (value > 0)  return <span className="flex items-center gap-0.5 text-red-400 text-xs font-medium"><TrendingUp size={11}/> +{value}</span>;
  if (value < 0)  return <span className="flex items-center gap-0.5 text-green-400 text-xs font-medium"><TrendingDown size={11}/> {value}</span>;
  return <span className="flex items-center gap-0.5 text-slate-500 text-xs"><Minus size={11}/> No change</span>;
}

function KPICard({ icon: Icon, label, value, sub, color, pulse }) {
  return (
    <div className="kpi-card flex items-start gap-3 flex-1 min-w-0">
      <div className={`relative flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
        {pulse && (
          <span className="absolute inset-0 rounded-lg animate-ping opacity-25" style={{ background: 'currentColor' }}/>
        )}
        <Icon size={17}/>
      </div>
      <div className="min-w-0 flex-1">
        <div
          className="text-xl font-bold text-white leading-none tabular-nums"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {value}
        </div>
        <div className="text-xs text-slate-400 mt-0.5 truncate">{label}</div>
        {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

export function StatsKPIRow({ complaints }) {
  const stats = useMemo(() => {
    const now = new Date();
    // Start of current week (Monday 00:00)
    const day = now.getDay(); // 0=Sun
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

    // Resolved this week
    const resolvedWk = resolved.filter(c => {
      const d = toDate(c.updated_at);
      return d && d >= weekStart;
    });

    // Average resolution hours (resolved complaints with both timestamps)
    const validForAvg = resolved.filter(c => toDate(c.created_at) && toDate(c.updated_at));
    const avgHours = validForAvg.length > 0
      ? validForAvg.reduce((acc, c) => acc + diffHours(toDate(c.updated_at), toDate(c.created_at)), 0) / validForAvg.length
      : null;

    const avgLabel = avgHours === null
      ? '—'
      : avgHours < 24
        ? `${Math.round(avgHours)}h`
        : `${Math.round(avgHours / 24)}d`;

    return {
      openCount:    open.length,
      highCount:    highPrio.length,
      resolvedWk:   resolvedWk.length,
      avgLabel,
      total:        complaints.length,
    };
  }, [complaints]);

  return (
    <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/80 flex items-stretch gap-3 overflow-x-auto">
      <KPICard
        icon={AlertCircle}
        label="Open Complaints"
        value={stats.openCount}
        sub={`of ${stats.total} total`}
        color="bg-amber-500/15 text-amber-400"
        pulse={stats.openCount > 5}
      />
      <div className="w-px bg-slate-800 flex-shrink-0 hidden sm:block"/>
      <KPICard
        icon={Zap}
        label="High Priority"
        value={stats.highCount}
        sub={stats.highCount > 0 ? 'Need immediate action' : 'None critical right now'}
        color={stats.highCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-slate-700/30 text-slate-500'}
        pulse={stats.highCount > 0}
      />
      <div className="w-px bg-slate-800 flex-shrink-0 hidden sm:block"/>
      <KPICard
        icon={CheckCircle2}
        label="Resolved This Week"
        value={stats.resolvedWk}
        sub="since Monday"
        color="bg-green-500/15 text-green-400"
      />
      <div className="w-px bg-slate-800 flex-shrink-0 hidden sm:block"/>
      <KPICard
        icon={Clock}
        label="Avg. Resolution Time"
        value={stats.avgLabel}
        sub={stats.avgLabel !== '—' ? 'open → resolved' : 'no resolved data yet'}
        color="bg-blue-500/15 text-blue-400"
      />
    </div>
  );
}
