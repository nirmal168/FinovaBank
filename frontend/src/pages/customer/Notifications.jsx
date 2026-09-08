import React, { useState, useEffect } from 'react';
import notificationService from '../../services/notificationService';
import { useNotifications } from '../../context/NotificationContext';
import Button from '../../components/ui/Button';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Landmark,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Clock,
  Filter,
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
  LOGIN: 'text-blue-500 bg-blue-50 border-blue-200',
  DEPOSIT: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  WITHDRAWAL: 'text-amber-600 bg-amber-50 border-amber-200',
  TRANSFER: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  LOAN: 'text-violet-600 bg-violet-50 border-violet-200',
  FRAUD: 'text-rose-600 bg-rose-50 border-rose-200',
  ACCOUNT: 'text-cyan-600 bg-cyan-50 border-cyan-200',
};

const Notifications = () => {
  const [notificationsList, setNotificationsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [readFilter, setReadFilter] = useState('ALL'); // 'ALL' | 'unread' | 'read'
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const { markAsRead: ctxMarkAsRead, markAllAsRead: ctxMarkAllAsRead, unreadCount } = useNotifications();

  const fetchList = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 12 };
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (readFilter === 'unread') params.isRead = false;
      if (readFilter === 'read') params.isRead = true;

      const res = await notificationService.getNotifications(params);
      if (res.success) {
        setNotificationsList(res.data.notifications || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Failed to load notifications page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList(1);
  }, [typeFilter, readFilter]);

  const handleMarkAsRead = async (id) => {
    await ctxMarkAsRead(id);
    setNotificationsList((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await ctxMarkAllAsRead();
    setNotificationsList((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              <Bell className="w-3.5 h-3.5" />
              Real-Time Security & Banking Activity
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">Notification Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            System activity alerts, fund transfers, transaction updates, and security notices.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleMarkAllRead}
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              Mark All as Read ({unreadCount})
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchList(pagination.page)}
            disabled={loading}
            className="border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[var(--finova-card-bg)] p-4 rounded-2xl border border-[var(--finova-border)] shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Type Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--finova-text-muted)] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Category:
          </span>
          {['ALL', 'LOGIN', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'LOAN', 'ACCOUNT', 'FRAUD'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                typeFilter === type
                  ? 'bg-[var(--finova-deep)] text-white shadow-xs'
                  : 'bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] hover:bg-[var(--finova-card-hover)] border border-[var(--finova-border-light)]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[var(--finova-text-muted)] mr-1">Status:</span>
          {[
            { label: 'All', value: 'ALL' },
            { label: 'Unread', value: 'unread' },
            { label: 'Read', value: 'read' },
          ].map((st) => (
            <button
              key={st.value}
              onClick={() => setReadFilter(st.value)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                readFilter === st.value
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] hover:bg-[var(--finova-card-hover)] border border-[var(--finova-border-light)]'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notification Cards List */}
      <div className="space-y-3">
        {loading && notificationsList.length === 0 ? (
          <div className="bg-[var(--finova-card-bg)] rounded-2xl border border-[var(--finova-border)] p-12 text-center text-[var(--finova-text-muted)]">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
            Loading notifications...
          </div>
        ) : notificationsList.length === 0 ? (
          <div className="bg-[var(--finova-card-bg)] rounded-2xl border border-dashed border-[var(--finova-border)] p-12 text-center text-[var(--finova-text-muted)]">
            <Bell className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold text-[var(--finova-text-heading)]">No notifications found</p>
            <p className="text-xs text-[var(--finova-text-muted)] mt-0.5">
              You're completely caught up! Relevant account activity will appear here in real-time.
            </p>
          </div>
        ) : (
          notificationsList.map((item) => {
            const Icon = typeIcons[item.type] || ShieldCheck;
            const colors = typeColors[item.type] || 'text-slate-600 bg-slate-100 border-slate-200';

            return (
              <div
                key={item._id}
                className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  item.isRead
                    ? 'bg-[var(--finova-card-bg)] border-[var(--finova-border)] shadow-xs'
                    : 'bg-brand-500/5 border-brand-500/20 shadow-sm'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div className={`p-2.5 rounded-xl border flex-shrink-0 ${colors}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className={`text-sm tracking-tight truncate ${item.isRead ? 'font-semibold text-[var(--finova-text-heading)]' : 'font-extrabold text-[var(--finova-text-heading)]'}`}>
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/20">
                          Unread
                        </span>
                      )}
                      <span className="text-[10px] uppercase font-bold text-[var(--finova-text-muted)] px-2 py-0.5 rounded bg-[var(--finova-bg-secondary)] border border-[var(--finova-border-light)]">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--finova-text-secondary)] leading-relaxed">{item.message}</p>
                    <div className="flex items-center gap-1 text-[11px] text-[var(--finova-text-muted)] mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}</span>
                    </div>
                  </div>
                </div>

                {!item.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(item._id)}
                    className="self-end sm:self-auto text-xs whitespace-nowrap"
                  >
                    Mark as Read
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="p-4 bg-[var(--finova-card-bg)] rounded-2xl border border-[var(--finova-border)] flex items-center justify-between text-xs text-[var(--finova-text-secondary)]">
          <span>
            Showing page {pagination.page} of {pagination.pages} ({pagination.total} total notifications)
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchList(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => fetchList(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
