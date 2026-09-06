import { Info } from 'lucide-react';

/**
 * Visual breakdown of the priority score with three sub-bars.
 */
export function PriorityBar({ complaint }) {
  const { priority_score, priority_tier, priority_breakdown } = complaint;
  if (!priority_breakdown) return null;

  const {
    urgencyComponent,
    repeatCount,
    repeatComponent,
    vulnerabilityWeight,
    vulnerabilityComponent,
  } = priority_breakdown;

  const total = Math.max(priority_score, 1);

  const bars = [
    {
      label: 'Urgency (50%)',
      value: urgencyComponent,
      pct: (urgencyComponent / total) * 100,
      color: 'bg-blue-400',
      detail: `Score: ${priority_breakdown.urgencyScore}/100`,
    },
    {
      label: 'Cluster Repeat (30%)',
      value: repeatComponent,
      pct: (repeatComponent / total) * 100,
      color: 'bg-amber-400',
      detail: `${repeatCount} other ${repeatCount === 1 ? 'complaint' : 'complaints'} in same ward/category`,
    },
    {
      label: 'Ward Vulnerability (20%)',
      value: vulnerabilityComponent,
      pct: (vulnerabilityComponent / total) * 100,
      color: 'bg-purple-400',
      detail: `Index: ${vulnerabilityWeight}/10`,
    },
  ];

  return (
    <div className="space-y-3">
      {/* Total score pill */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">Priority Score</span>
        <span
          className={`text-2xl font-bold tabular-nums ${priority_tier?.textColor ?? 'text-white'}`}
        >
          {priority_score}
        </span>
      </div>

      {/* Stacked bar */}
      <div className="h-2.5 rounded-full bg-slate-700 overflow-hidden flex">
        {bars.map((bar) => (
          <div
            key={bar.label}
            className={`${bar.color} h-full transition-all duration-500`}
            style={{ width: `${Math.max(bar.pct, 0)}%` }}
          />
        ))}
      </div>

      {/* Breakdown rows */}
      <div className="space-y-2">
        {bars.map((bar) => (
          <div key={bar.label} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${bar.color}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{bar.label}</span>
                <span className="text-xs font-mono text-slate-300">+{bar.value}</span>
              </div>
              <p className="text-xs text-slate-500">{bar.detail}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Census data note */}
      <div className="flex items-start gap-2 p-2 rounded bg-slate-700/40 border border-slate-600/40">
        <Info size={12} className="text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-500 leading-relaxed">
          Ward vulnerability index is a <strong className="text-slate-400">placeholder</strong>.
          A real deployment would pull live census, infrastructure, and socioeconomic data here.
        </p>
      </div>
    </div>
  );
}
