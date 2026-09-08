import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  XCircle,
  Eye,
  Wallet,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const AdminAccounts = () => {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Status transition modal
  const [targetAccount, setTargetAccount] = useState(null);
  const [targetAction, setTargetAction] = useState(''); // 'Freeze' | 'Activate' | 'Close'
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);

  const fetchAccounts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (typeFilter !== 'ALL') params.accountType = typeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await adminService.getAccounts(params);
      if (res.success) {
        setAccounts(res.data.accounts || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Error fetching accounts:', err);
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts(1);
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAccounts(1);
  };

  const openStatusChange = (account, action) => {
    setTargetAccount(account);
    setTargetAction(action);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!targetAccount || !targetAction) return;

    try {
      setActionLoading(true);
      const res = await adminService.updateAccountStatus(targetAccount._id, targetAction);
      if (res.success) {
        setAccounts((prev) =>
          prev.map((acc) => (acc._id === targetAccount._id ? { ...acc, status: targetAction } : acc))
        );
        setActionSuccess(`Account ${targetAccount.accountNumber} successfully changed to ${targetAction}.`);
        showToast(`Account ${targetAccount.accountNumber} is now ${targetAction}.`, 'success');
        setIsConfirmModalOpen(false);
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update account status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[var(--finova-deep)] border border-[var(--finova-border)] p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20">
              <Wallet className="w-3.5 h-3.5" />
              Account Administration
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Accounts Management</h1>
          <p className="text-xs text-slate-300 mt-1">
            Inspect all institutional accounts, monitor balances, and freeze, activate, or close customer accounts.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAccounts(pagination.page)}
            disabled={loading}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Success alert */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-[var(--finova-card-bg)] p-4 rounded-2xl border border-[var(--finova-border)] shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--finova-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by account number or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          {/* Account Type Filter */}
          <div className="flex items-center gap-1 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border-light)] p-1 rounded-xl">
            {['ALL', 'Savings', 'Current'].map((type) => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  typeFilter === type
                    ? 'bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] shadow-xs'
                    : 'text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)]'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border-light)] p-1 rounded-xl">
            {['ALL', 'Active', 'Frozen', 'Closed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  statusFilter === st
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-[var(--finova-card-bg)] rounded-2xl border border-[var(--finova-border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--finova-text-secondary)]">
            <thead className="bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] uppercase tracking-wider font-semibold border-b border-[var(--finova-border)]">
              <tr>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Balance</th>
                <th className="py-3 px-4">Daily Limit</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--finova-border-light)]">
              {loading && accounts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[var(--finova-text-muted)]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading accounts...
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[var(--finova-text-muted)]">
                    No bank accounts match the current filter criteria.
                  </td>
                </tr>
              ) : (
                accounts.map((acc) => {
                  const isFrozen = acc.status === 'Frozen' || acc.status === 'FROZEN';
                  const isClosed = acc.status === 'Closed' || acc.status === 'CLOSED';
                  const isActive = acc.status === 'Active' || acc.status === 'ACTIVE';

                  return (
                    <tr key={acc._id} className="hover:bg-[var(--finova-card-hover)] transition duration-150">
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--finova-text-heading)]">
                        {acc.accountNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[var(--finova-text-heading)]">{acc.user?.name || 'Customer'}</div>
                        <div className="text-[11px] text-[var(--finova-text-muted)]">{acc.user?.email || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md font-semibold text-[11px] bg-[var(--finova-bg-secondary)] text-[var(--finova-text-heading)] border border-[var(--finova-border-light)]">
                          {acc.accountType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(acc.balance || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--finova-text-secondary)]">
                        {formatCurrency(acc.dailyTransferLimit || 50000)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : isFrozen
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isActive && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                          {isFrozen && <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                          {isClosed && <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                          {acc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {isActive && (
                          <button
                            onClick={() => openStatusChange(acc, 'Frozen')}
                            className="px-2 py-1 rounded-lg text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 font-medium text-[11px] transition border border-amber-500/20"
                            title="Freeze Account"
                          >
                            Freeze
                          </button>
                        )}
                        {isFrozen && (
                          <button
                            onClick={() => openStatusChange(acc, 'Active')}
                            className="px-2 py-1 rounded-lg text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 font-medium text-[11px] transition border border-emerald-500/20"
                            title="Activate Account"
                          >
                            Activate
                          </button>
                        )}
                        {!isClosed && (
                          <button
                            onClick={() => openStatusChange(acc, 'Closed')}
                            className="px-2 py-1 rounded-lg text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 font-medium text-[11px] transition border border-rose-500/20"
                            title="Close Account"
                          >
                            Close
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-[var(--finova-border-light)] flex items-center justify-between text-xs text-[var(--finova-text-secondary)]">
            <span>
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total accounts)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchAccounts(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => fetchAccounts(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {targetAccount && (
        <Modal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          title={`Confirm Account Status: ${targetAction}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
              <span>
                Are you sure you want to change account <strong>#{targetAccount.accountNumber}</strong> belonging to <strong>{targetAccount.user?.name}</strong> to <strong>{targetAction}</strong>?
              </span>
            </div>

            {targetAction === 'Closed' && (
              <p className="text-xs text-rose-600 font-medium">
                Note: Closing an account prevents future deposits, withdrawals, transfers, and debit card transactions.
              </p>
            )}

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={targetAction === 'Closed' ? 'danger' : 'primary'}
                size="sm"
                onClick={handleConfirmStatusChange}
                disabled={actionLoading}
              >
                {actionLoading ? 'Updating...' : `Confirm ${targetAction}`}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminAccounts;
