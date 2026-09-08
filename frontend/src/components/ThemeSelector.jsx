import React from 'react';
import { Sun, Moon, Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const themeOptions = [
  {
    id: 'light',
    title: 'Light',
    icon: Sun,
    description: 'Bright and clean for daytime use.',
    palette: ['#FCFBF8', '#17324D', '#5B8C72', '#E2E0DA'],
    badge: 'Daytime',
    accentColor: '#5B8C72',
  },
  {
    id: 'dark',
    title: 'Dark',
    icon: Moon,
    description: 'Balanced dark theme for comfortable viewing.',
    palette: ['#111827', '#1E293B', '#6EA8D7', '#334155'],
    badge: 'Evening',
    accentColor: '#6EA8D7',
  },
  {
    id: 'night',
    title: 'Night',
    icon: Sparkles,
    description: 'Low-light theme designed for nighttime use.',
    palette: ['#0F1720', '#1A2430', '#8AA9C1', '#2A3744'],
    badge: 'Nighttime',
    accentColor: '#C9A86A',
  },
];

const ThemeSelector = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-sm font-bold text-[var(--finova-text-heading)]">
          Appearance & Display Theme
        </h3>
        <p className="text-xs text-[var(--finova-text-secondary)] mt-0.5">
          Select your preferred visual atmosphere. Your preference is preserved across devices and sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {themeOptions.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`relative flex flex-col justify-between p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--finova-blue)]/50 ${
                isSelected
                  ? 'border-[var(--finova-primary)] bg-[var(--finova-card-elevated)] shadow-finova-md'
                  : 'border-[var(--finova-border)] bg-[var(--finova-card-bg)] hover:border-[var(--finova-border)]/80 hover:bg-[var(--finova-bg-secondary)]/50 shadow-xs'
              }`}
            >
              {/* Header: Icon + Radio Indicator */}
              <div className="flex items-center justify-between w-full">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--finova-border)]"
                  style={{
                    backgroundColor: isSelected ? `${opt.accentColor}25` : 'var(--finova-bg-secondary)',
                  }}
                >
                  <Icon className="h-4 w-4" style={{ color: opt.accentColor }} />
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      borderColor: isSelected ? `${opt.accentColor}40` : 'var(--finova-border)',
                      backgroundColor: isSelected ? `${opt.accentColor}15` : 'var(--finova-bg-secondary)',
                      color: isSelected ? opt.accentColor : 'var(--finova-text-secondary)',
                    }}
                  >
                    {opt.badge}
                  </span>
                  {isSelected ? (
                    <CheckCircle2 className="h-4 w-4" style={{ color: opt.accentColor }} />
                  ) : (
                    <Circle className="h-4 w-4 text-[var(--finova-text-muted)]" />
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="mt-3.5 mb-3">
                <p className="text-sm font-bold text-[var(--finova-text-heading)] flex items-center gap-1.5">
                  <span>{opt.title}</span>
                </p>
                <p className="text-xs text-[var(--finova-text-secondary)] mt-1 leading-relaxed">
                  {opt.description}
                </p>
              </div>

              {/* Theme Mini Palette Preview */}
              <div className="pt-3 border-t border-[var(--finova-border)]/80 flex items-center justify-between">
                <span className="text-[10px] font-medium text-[var(--finova-text-muted)]">
                  Palette
                </span>
                <div className="flex items-center gap-1.5 p-1 rounded-lg border border-[var(--finova-border)]/60 bg-[var(--finova-bg-secondary)]">
                  {opt.palette.map((color, i) => (
                    <span
                      key={i}
                      className="h-3 w-3 rounded-full border border-black/10 shadow-xs inline-block"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ThemeSelector;
