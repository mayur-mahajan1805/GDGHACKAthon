const STATUS_CONFIG = {
  new:         { label: 'New',         dot: 'bg-blue-400',   bg: 'bg-blue-900/30',   text: 'text-blue-300',   border: 'border-blue-500/40' },
  assigned:    { label: 'Assigned',    dot: 'bg-amber-400',  bg: 'bg-amber-900/30',  text: 'text-amber-300',  border: 'border-amber-500/40' },
  in_progress: { label: 'In Progress', dot: 'bg-orange-400', bg: 'bg-orange-900/30', text: 'text-orange-300', border: 'border-orange-500/40' },
  resolved:    { label: 'Resolved',    dot: 'bg-green-400',  bg: 'bg-green-900/30',  text: 'text-green-300',  border: 'border-green-500/40' },
};

export function getStatusConfig(status) {
  return STATUS_CONFIG[status] ?? STATUS_CONFIG.new;
}

export function StatusBadge({ status, size = 'sm' }) {
  const config = getStatusConfig(status);
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

export const ALL_STATUSES = Object.keys(STATUS_CONFIG);
export const STATUS_LABELS = Object.fromEntries(
  Object.entries(STATUS_CONFIG).map(([k, v]) => [k, v.label])
);
