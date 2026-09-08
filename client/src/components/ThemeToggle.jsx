import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Sparkles, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const themes = [
  {
    id: 'light',
    name: 'Light',
    icon: Sun,
    description: 'Bright & clean',
    accentColor: '#5B8C72',
  },
  {
    id: 'dark',
    name: 'Dark',
    icon: Moon,
    description: 'Balanced dark',
    accentColor: '#6EA8D7',
  },
  {
    id: 'night',
    name: 'Night',
    icon: Sparkles,
    description: 'Soft low-light',
    accentColor: '#C9A86A',
  },
];

const ThemeToggle = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentThemeObj = themes.find((t) => t.id === theme) || themes[0];
  const CurrentIcon = currentThemeObj.icon;

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      {/* Compact Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`Current theme is ${currentThemeObj.name}. Click to switch theme`}
        className="flex items-center gap-1.5 p-2 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-main)] hover:bg-[var(--finova-bg-secondary)] shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--finova-blue)]/40"
      >
        <CurrentIcon className="h-4 w-4" style={{ color: currentThemeObj.accentColor }} />
        <span className="hidden sm:inline text-xs font-semibold">{currentThemeObj.name}</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] p-1.5 shadow-lg z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1.5 border-b border-[var(--finova-border)] mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--finova-text-muted)]">
              Appearance
            </p>
          </div>

          <div className="space-y-1">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = theme === t.id;
              return (
                <button
                  key={t.id}
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    setTheme(t.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-[var(--finova-bg-secondary)] text-[var(--finova-text-heading)]'
                      : 'text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)]/60 hover:text-[var(--finova-text-main)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-[var(--finova-border)]"
                      style={{
                        backgroundColor: isSelected ? `${t.accentColor}20` : 'transparent',
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: t.accentColor }} />
                    </div>
                    <div className="text-left">
                      <p className="leading-tight">{t.name}</p>
                      <p className="text-[10px] text-[var(--finova-text-muted)] font-normal leading-tight">
                        {t.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4" style={{ color: t.accentColor }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeToggle;
