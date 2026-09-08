import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Eye,
  ShieldCheck,
  Calendar,
  Clock,
  User,
  Activity,
  Layers,
  Globe,
  AlertCircle,
  Database,
  ArrowRight,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

const ENTITY_OPTIONS = [
  { value: 'ALL', label: 'All Entities' },
  { value: 'User', label: 'User / Auth' },
  { value: 'Account', label: 'Account' },
  { value: 'Transaction', label: 'Transaction' },
  { value: 'Loan', label: 'Loan' },
  { value: 'Card', label: 'Debit Card' },
  { value: 'FraudAlert', label: 'Fraud Desk' },
];

const ACTION_OPTIONS = [
  { value: 'ALL', label: 'All Actions' },
  { value: 'USER_REGISTER', label: 'User Registered' },
  { value: 'USER_LOGIN', label: 'User Login' },
  { value: 'USER_LOGOUT', label: 'User Logout' },
  { value: 'PASSWORD_CHANGE', label: 'Password Changed' },
  { value: 'PROFILE_UPDATE', label: 'Profile Updated' },
  { value: 'ACCOUNT_CREATE', label: 'Account Created' },
  { value: 'DEPOSIT', label: 'Deposit' },
  { value: 'WITHDRAWAL', label: 'Withdrawal' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'LOAN_APPLY', label: 'Loan Applied' },
  { value: 'LOAN_APPROVE', label: 'Loan Approved' },
  { value: 'LOAN_REJECT', label: 'Loan Rejected' },
  { value: 'CARD_APPLY', label: 'Card Applied' },
  { value: 'CARD_ACTIVATE', label: 'Card Activated' },
  { value: 'CARD_BLOCK_TOGGLE', label: 'Card Block/Unblock' },
  { value: 'CARD_PIN_CHANGE', label: 'Card PIN Changed' },
  { value: 'CARD_LIMIT_CHANGE', label: 'Card Limit Updated' },
  { value: 'ADMIN_CUSTOMER_STATUS', label: 'Admin Customer Status' },
  { value: 'ADMIN_ACCOUNT_STATUS', label: 'Admin Account Status' },
  { value: 'FRAUD_ALERT_RESOLVE', label: 'Fraud Alert Resolved' },
  { value: 'FRAUD_ALERT_DISMISS', label: 'Fraud Alert Dismissed' },
];

const getActionBadgeClass = (action = '') => {
  if (action.includes('FRAUD') || action.includes('REJECT') || action.includes('BLOCK')) {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (action.includes('PASSWORD') || action.includes('PIN') || action.includes('LOGIN') || action.includes('LOGOUT')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  if (action.includes('DEPOSIT') || action.includes('WITHDRAWAL') || action.includes('TRANSFER')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (action.includes('LOAN') || action.includes('CARD')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (action.startsWith('ADMIN_')) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  return 'bg-slate-50 text-slate-700 border-slate-200';
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination & Stats
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState({
    totalLogs: 0,
    todayCount: 0,
    securityCount: 0,
    financialCount: 0,
  });

  // Modal inspection
  const [selectedLog, setSelectedLog] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 12 };
      if (search.trim()) params.search = search.trim();
      if (entityFilter !== 'ALL') params.entity = entityFilter;
      if (actionFilter !== 'ALL') params.action = actionFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await adminService.getAuditLogs(params);
      if (res.success) {
        setLogs(res.data || []);
        setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [entityFilter, actionFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setEntityFilter('ALL');
    setActionFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const handleOpenDetail = (log) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--finova-text-heading)] flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-brand-500 text-white shadow-xs">
              <FileText className="h-5 w-5" />
            </div>
            Audit Logs & System Activity
          </h1>
          <p className="text-sm text-[var(--finova-text-secondary)] mt-1">
            Immutable, compliance-grade chronological record of all banking events, administrative decisions, and security trails.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLogs(pagination.page)}
          className="gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stream
        </Button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--finova-text-muted)] uppercase tracking-wider">Total Recorded Logs</span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[var(--finova-text-heading)] mt-2">{stats.totalLogs.toLocaleString()}</p>
          <p className="text-[11px] text-[var(--finova-text-muted)] mt-1">Full institutional history</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--finova-text-muted)] uppercase tracking-wider">Today's Events</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{stats.todayCount.toLocaleString()}</p>
          <p className="text-[11px] text-[var(--finova-text-muted)] mt-1">Processed since 00:00 UTC</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--finova-text-muted)] uppercase tracking-wider">Security & Auth</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{stats.securityCount.toLocaleString()}</p>
          <p className="text-[11px] text-[var(--finova-text-muted)] mt-1">Logins, PIN, and fraud actions</p>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--finova-text-muted)] uppercase tracking-wider">Financial Transactions</span>
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-500">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-500 mt-2">{stats.financialCount.toLocaleString()}</p>
          <p className="text-[11px] text-[var(--finova-text-muted)] mt-1">Deposits, transfers & withdrawals</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--finova-text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search action, entity, IP, user name or email..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[var(--finova-border)] focus:outline-none focus:ring-2 focus:ring-brand-500 bg-[var(--finova-bg-secondary)] text-[var(--finova-text-heading)] placeholder:text-[var(--finova-text-muted)]"
              />
            </div>
            <Button type="submit" size="sm" variant="primary" className="shrink-0">
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl px-2 py-1">
              <Filter className="h-3.5 w-3.5 text-[var(--finova-text-muted)]" />
              <select
                value={entityFilter}
                onChange={(e) => setEntityFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-[var(--finova-text-heading)] focus:outline-none pr-2 py-1"
              >
                {ENTITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl px-2 py-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--finova-text-muted)]" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="bg-transparent text-xs font-medium text-[var(--finova-text-heading)] focus:outline-none pr-2 py-1 max-w-[150px] truncate"
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)]">
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Date Filter Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[var(--finova-border-light)] text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[var(--finova-text-secondary)] font-semibold flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[var(--finova-text-muted)]" />
              Date Range:
            </span>
            <div className="flex items-center gap-1">
              <span className="text-[var(--finova-text-muted)]">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-lg text-[var(--finova-text-heading)] focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[var(--finova-text-muted)]">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-lg text-[var(--finova-text-heading)] focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
          </div>

          {(search || entityFilter !== 'ALL' || actionFilter !== 'ALL' || startDate || endDate) && (
            <button
              onClick={handleResetFilters}
              className="text-xs text-brand-500 hover:text-brand-600 font-semibold underline"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[var(--finova-card-bg)] rounded-2xl border border-[var(--finova-border)] shadow-xs overflow-hidden">
        {error && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex items-center gap-2 text-xs text-rose-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--finova-bg-secondary)] border-b border-[var(--finova-border)] text-[11px] font-bold text-[var(--finova-text-secondary)] uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Actor / User</th>
                <th className="py-3 px-4">Origin (IP & Agent)</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--finova-border-light)] text-xs text-[var(--finova-text-secondary)]">
              {loading && logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[var(--finova-text-muted)]">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading system audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[var(--finova-text-muted)]">
                    <Database className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    No audit records match the current criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const badgeClass = getActionBadgeClass(log.action);
                  const formattedTime = new Date(log.timestamp).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={log._id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{formattedTime}</span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold border ${badgeClass}`}>
                          {log.action}
                        </span>
                      </td>

                      {/* Entity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{log.entity}</div>
                        {log.entityId && (
                          <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                            ID: {String(log.entityId).substring(0, 10)}...
                          </div>
                        )}
                      </td>

                      {/* Actor */}
                      <td className="py-3.5 px-4">
                        {log.user ? (
                          <div>
                            <div className="font-bold text-slate-900 flex items-center gap-1">
                              <span>{log.user.name}</span>
                              <span className="text-[9px] font-semibold uppercase px-1 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {log.user.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                              {log.user.email}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">System / Anonymous</span>
                        )}
                      </td>

                      {/* Origin */}
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <div className="font-mono text-[11px] text-slate-700 flex items-center gap-1">
                          <Globe className="h-3 w-3 text-slate-400 shrink-0" />
                          <span>{log.ipAddress || '127.0.0.1'}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate mt-0.5" title={log.userAgent}>
                          {log.userAgent || 'Unknown Client'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleOpenDetail(log)}
                          className="gap-1 font-semibold"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing Page <span className="font-bold text-slate-900">{pagination.page}</span> of{' '}
            <span className="font-bold text-slate-900">{pagination.pages || 1}</span> ({pagination.total} total logs)
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              disabled={pagination.page <= 1 || loading}
              onClick={() => fetchLogs(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="xs"
              disabled={pagination.page >= pagination.pages || loading}
              onClick={() => fetchLogs(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Inspect Log Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Audit Log Telemetry Details"
      >
        {selectedLog && (
          <div className="space-y-4 text-xs">
            {/* Action Banner */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Action Type</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">{selectedLog.action}</div>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getActionBadgeClass(selectedLog.action)}`}>
                {selectedLog.entity}
              </span>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]">
                <span className="text-[10px] font-bold text-[var(--finova-text-muted)] uppercase">Timestamp</span>
                <p className="font-mono text-[var(--finova-text-heading)] mt-1">
                  {new Date(selectedLog.timestamp).toISOString()}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]">
                <span className="text-[10px] font-bold text-[var(--finova-text-muted)] uppercase">Entity Reference ID</span>
                <p className="font-mono text-[var(--finova-text-heading)] mt-1 truncate" title={selectedLog.entityId}>
                  {selectedLog.entityId || 'N/A'}
                </p>
              </div>

              <div className="p-3 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]">
                <span className="text-[10px] font-bold text-[var(--finova-text-muted)] uppercase">IP Address</span>
                <p className="font-mono text-[var(--finova-text-heading)] mt-1">{selectedLog.ipAddress || '127.0.0.1'}</p>
              </div>

              <div className="p-3 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]">
                <span className="text-[10px] font-bold text-[var(--finova-text-muted)] uppercase">User Agent</span>
                <p className="text-[var(--finova-text-heading)] mt-1 truncate" title={selectedLog.userAgent}>
                  {selectedLog.userAgent || 'Unknown Client'}
                </p>
              </div>
            </div>

            {/* Actor Details */}
            <div className="p-3 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--finova-text-muted)]">Actor Profile</span>
              {selectedLog.user ? (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--finova-text-muted)]">Name:</span>
                    <span className="font-bold text-[var(--finova-text-heading)]">{selectedLog.user.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--finova-text-muted)]">Email:</span>
                    <span className="font-mono text-[var(--finova-text-secondary)]">{selectedLog.user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Role:</span>
                    <span className="font-bold uppercase text-indigo-700">{selectedLog.user.role}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">User ID:</span>
                    <span className="font-mono text-[10px] text-slate-600">{selectedLog.user._id || selectedLog.user}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 italic mt-1">Unauthenticated / System Actor</p>
              )}
            </div>

            {/* Structured Metadata View (Zero Secrets Constraint Verified) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Sanitized Event Metadata (Passwords/Secrets Excluded)
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed border border-slate-800">
                {JSON.stringify(selectedLog.metadata || {}, null, 2)}
              </pre>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                Close Viewer
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogs;
