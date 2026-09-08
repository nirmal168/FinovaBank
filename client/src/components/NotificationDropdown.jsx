import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Landmark,
  ShieldCheck,
  CreditCard,
  CheckCheck,
  ExternalLink,
} from 'lucide-react';

const typeIcons = {
  LOGIN: ShieldCheck,
  DEPOSIT: ArrowDownLeft,
  WITHDRAWAL: ArrowUpRight,
  TRANSFER: ArrowLeftRight,
  LOAN: Landmark,
  FRAUD: AlertTriangle,
  ACCOUNT: CreditCard,
};

const typeColors = {
  LOGIN: 'text-blue-500 bg-blue-50',
  DEPOSIT: 'text-emerald-600 bg-emerald-50',
  WITHDRAWAL: 'text-amber-600 bg-amber-50',
  TRANSFER: 'text-indigo-600 bg-indigo-50',
  LOAN: 'text-violet-600 bg-violet-50',
  FRAUD: 'text-rose-600 bg-rose-50',
  ACCOUNT: 'text-cyan-600 bg-cyan-50',
};

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, loading } = useNotifications();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative rounded-xl p-2 text-[var(--finova-text-secondary)] hover:bg-[var(--finova-card-hover)] hover:text-[var(--finova-text-heading)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[var(--finova-bg-secondary)] border-b border-[var(--finova-border-light)]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[var(--finova-text-heading)] text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="bg-brand-500/10 text-brand-600 dark:text-brand-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-brand-500/20">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs font-semibold text-brand-500 hover:text-brand-600 transition flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[var(--finova-border-light)]">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-[var(--finova-text-muted)]">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">No notifications yet</p>
                <p className="text-[10px] text-[var(--finova-text-muted)] mt-0.5">Banking alerts and activity will show here.</p>
              </div>
            ) : (
              notifications.slice(0, 5).map((n) => {
                const Icon = typeIcons[n.type] || ShieldCheck;
                const colorClasses = typeColors[n.type] || 'text-slate-600 bg-slate-100';

                return (
                  <div
                    key={n._id}
                    onClick={() => !n.isRead && markAsRead(n._id)}
                    className={`p-3.5 flex items-start gap-3 transition cursor-pointer ${
                      n.isRead
                        ? 'hover:bg-[var(--finova-card-hover)]'
                        : 'bg-brand-500/5 hover:bg-brand-500/10'
                    }`}
                  >
                    <div className={`p-2 rounded-xl flex-shrink-0 ${colorClasses}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h5 className={`text-xs truncate ${n.isRead ? 'font-medium text-[var(--finova-text-secondary)]' : 'font-bold text-[var(--finova-text-heading)]'}`}>
                          {n.title}
                        </h5>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--finova-text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <span className="text-[10px] text-[var(--finova-text-muted)] mt-1 block">
                        {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-[var(--finova-bg-secondary)] border-t border-[var(--finova-border-light)] text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-brand-500 hover:text-brand-600 inline-flex items-center gap-1.5 py-1"
            >
              <span>View All Notifications</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
