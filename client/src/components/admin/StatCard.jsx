import React from 'react';

const colorThemes = {
  blue: {
    bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    iconBg: 'bg-blue-500/20 text-blue-400',
    hover: 'hover:border-blue-500/40',
  },
  sky: {
    bg: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    iconBg: 'bg-gradient-to-br from-sky-500/25 to-blue-600/30 text-sky-300 shadow-sm shadow-sky-500/10',
    hover: 'hover:border-sky-500/40 hover:shadow-sky-500/5',
  },
  emerald: {
    bg: 'bg-teal-500/10 text-teal-300 border-teal-500/20',
    iconBg: 'bg-gradient-to-br from-teal-500/20 to-cyan-600/30 text-teal-300',
    hover: 'hover:border-teal-500/40',
  },
  violet: {
    bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    iconBg: 'bg-violet-500/20 text-violet-400',
    hover: 'hover:border-violet-500/40',
  },
  rose: {
    bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    iconBg: 'bg-rose-500/20 text-rose-400',
    hover: 'hover:border-rose-500/40',
  },
  amber: {
    bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    iconBg: 'bg-amber-500/20 text-amber-400',
    hover: 'hover:border-amber-500/40',
  },
  cyan: {
    bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    iconBg: 'bg-cyan-500/20 text-cyan-400',
    hover: 'hover:border-cyan-500/40',
  },
  indigo: {
    bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    iconBg: 'bg-indigo-500/20 text-indigo-400',
    hover: 'hover:border-indigo-500/40',
  },
  red: {
    bg: 'bg-red-500/10 text-red-400 border-red-500/20',
    iconBg: 'bg-red-500/20 text-red-400',
    hover: 'hover:border-red-500/40',
  },
};

const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', prefix = '', suffix = '' }) => {
  const theme = colorThemes[color] || colorThemes.blue;

  return (
    <div className={`p-5 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-sm backdrop-blur-xs transition-all duration-200 ${theme.hover} flex flex-col justify-between`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--finova-text-secondary)]">{title}</p>
          <div className="mt-2 flex items-baseline gap-1">
            {prefix && <span className="text-lg font-semibold text-[var(--finova-text-secondary)]">{prefix}</span>}
            <h3 className="text-2xl lg:text-3xl font-bold text-[var(--finova-text-heading)] tracking-tight">
              {typeof value === 'number' ? value.toLocaleString('en-IN') : value}
            </h3>
            {suffix && <span className="text-sm font-medium text-[var(--finova-text-muted)]">{suffix}</span>}
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${theme.iconBg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
      {subtitle && (
        <div className="mt-3 pt-3 border-t border-[var(--finova-border-light)] flex items-center justify-between text-xs text-[var(--finova-text-muted)]">
          <span>{subtitle}</span>
        </div>
      )}
    </div>
  );
};

export default StatCard;
