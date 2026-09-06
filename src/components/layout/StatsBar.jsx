import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { differenceInHours, startOfWeek } from 'date-fns';
import { getCategoryConfig } from '../shared/CategoryBadge';

const CATEGORY_COLORS = {
  road: '#F97316',
  water: '#60A5FA',
  electricity: '#FCD34D',
  waste: '#4ADE80',
  health: '#F87171',
  education: '#A78BFA',
  other: '#94A3B8',
};

function StatCard({ icon: Icon, label, value, sub, color = 'text-white' }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 border-r border-slate-700/50 last:border-r-0">
      <div className={`flex-shrink-0 ${color}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <div className={`text-lg font-bold tabular-nums leading-tight ${color}`}>{value}</div>
        <div className="text-xs text-slate-500 leading-tight">{label}</div>
        {sub && <div className="text-xs text-slate-600">{sub}</div>}
      </div>
    </div>
  );
}

export function StatsBar({ complaints }) {
  const stats = useMemo(() => {
    const open = complaints.filter(
      (c) => c.status === 'new' || c.status === 'assigned' || c.status === 'in_progress'
    );

    const weekStart = startOfWeek(new Date());
    const resolvedThisWeek = complaints.filter(
      (c) =>
        c.status === 'resolved' &&
        c.updated_at &&
        new Date(c.updated_at) >= weekStart
    );

    const resolved = complaints.filter((c) => c.status === 'resolved');
    const validResolved = resolved.filter(
      (c) => c.created_at && c.updated_at
    );
    const avgHours =
      validResolved.length > 0
        ? validResolved.reduce(
            (acc, c) =>
              acc + Math.abs(differenceInHours(new Date(c.updated_at), new Date(c.created_at))),
            0
          ) / validResolved.length
        : null;

    const avgTimeLabel =
      avgHours === null
        ? '—'
        : avgHours < 24
        ? `${Math.round(avgHours)}h`
        : `${Math.round(avgHours / 24)}d`;

    // Category counts for bar chart
    const categoryCounts = {};
    complaints.forEach((c) => {
      categoryCounts[c.category] = (categoryCounts[c.category] ?? 0) + 1;
    });

    const chartData = Object.entries(categoryCounts)
      .map(([cat, count]) => ({
        name: getCategoryConfig(cat).icon + ' ' + getCategoryConfig(cat).label,
        cat,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    return { open: open.length, resolvedThisWeek: resolvedThisWeek.length, avgTimeLabel, chartData };
  }, [complaints]);

  return (
    <div className="flex-shrink-0 bg-slate-900 border-b border-slate-700/50 flex items-stretch overflow-x-auto">
      {/* Stat cards */}
      <StatCard
        icon={AlertCircle}
        label="Open complaints"
        value={stats.open}
        color="text-amber-400"
      />
      <StatCard
        icon={CheckCircle2}
        label="Resolved this week"
        value={stats.resolvedThisWeek}
        color="text-green-400"
      />
      <StatCard
        icon={Clock}
        label="Avg. time-to-resolve"
        value={stats.avgTimeLabel}
        sub={stats.avgTimeLabel !== '—' ? 'from open to resolved' : 'no resolved yet'}
        color="text-blue-400"
      />
      <StatCard
        icon={TrendingUp}
        label="Total complaints"
        value={complaints.length}
        color="text-slate-300"
      />

      {/* Category bar chart */}
      <div className="flex-1 min-w-[280px] px-3 py-1.5 flex items-center gap-2">
        <span className="text-xs text-slate-500 flex-shrink-0 whitespace-nowrap">By category</span>
        <div className="flex-1 h-9">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.chartData} margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: '#64748B' }}
                axisLine={false}
                tickLine={false}
                interval={0}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#CBD5E1',
                  padding: '4px 8px',
                }}
                cursor={{ fill: 'rgba(59,130,246,0.1)' }}
                formatter={(v, name, props) => [v + ' complaints', props.payload.cat]}
              />
              <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                {stats.chartData.map((entry) => (
                  <Cell key={entry.cat} fill={CATEGORY_COLORS[entry.cat] ?? '#94A3B8'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
