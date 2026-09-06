const CATEGORY_CONFIG = {
  road:        { label: 'Road',        icon: '🛣️',  bg: 'bg-orange-900/40', text: 'text-orange-300', border: 'border-orange-500/40' },
  water:       { label: 'Water',       icon: '💧',  bg: 'bg-blue-900/40',   text: 'text-blue-300',   border: 'border-blue-500/40' },
  electricity: { label: 'Electricity', icon: '⚡',  bg: 'bg-yellow-900/40', text: 'text-yellow-300', border: 'border-yellow-500/40' },
  waste:       { label: 'Waste',       icon: '🗑️',  bg: 'bg-green-900/40',  text: 'text-green-300',  border: 'border-green-500/40' },
  health:      { label: 'Health',      icon: '🏥',  bg: 'bg-red-900/40',    text: 'text-red-300',    border: 'border-red-500/40' },
  education:   { label: 'Education',   icon: '📚',  bg: 'bg-purple-900/40', text: 'text-purple-300', border: 'border-purple-500/40' },
  other:       { label: 'Other',       icon: '📋',  bg: 'bg-slate-700/40',  text: 'text-slate-300',  border: 'border-slate-500/40' },
};

export function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other;
}

export function CategoryBadge({ category, size = 'sm' }) {
  const config = getCategoryConfig(category);
  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-sm px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

export const ALL_CATEGORIES = Object.keys(CATEGORY_CONFIG);
