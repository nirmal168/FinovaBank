import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import {
  Receipt,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Eye,
  Calendar,
  Filter,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Details Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await adminService.getTransactions(params);
      if (res.success) {
        setTransactions(res.data.transactions || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions(1);
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchTransactions(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setTypeFilter('ALL');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
    fetchTransactions(1);
  };

  const openDetails = (tx) => {
    setSelectedTx(tx);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[var(--finova-deep)] border border-[var(--finova-border)] p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20">
              <Receipt className="w-3.5 h-3.5" />
              Institutional Audit Trail
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Transactions Management</h1>
          <p className="text-xs text-slate-300 mt-1">
            Global ledger inspection across Deposits, Withdrawals, P2P Transfers, Payments, and Refunds.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchTransactions(pagination.page)}
            disabled={loading}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-[var(--finova-card-bg)] p-4 rounded-2xl border border-[var(--finova-border)] shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[var(--finova-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Tx ID, account, reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] placeholder:text-[var(--finova-text-muted)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
            <Button type="submit" variant="primary" size="sm">
              Search
            </Button>
          </form>

          {/* Date range filters */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] px-2 py-1 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-[var(--finova-text-muted)]" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent focus:outline-none text-[var(--finova-text-heading)]"
              />
            </div>
            <span className="text-[var(--finova-text-muted)] text-xs">to</span>
            <div className="flex items-center gap-1.5 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] px-2 py-1 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-[var(--finova-text-muted)]" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent focus:outline-none text-[var(--finova-text-heading)]"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchTransactions(1)}>
              Apply
            </Button>
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-[var(--finova-text-secondary)] text-xs">
              Reset
            </Button>
          </div>
        </div>

        {/* Type and Status pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--finova-border-light)]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--finova-text-muted)] mr-1">Type:</span>
            {['ALL', 'DEPOSIT', 'WITHDRAW', 'TRANSFER', 'PAYMENT', 'REFUND'].map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  typeFilter === t
                    ? 'bg-[var(--finova-deep)] text-white shadow-xs'
                    : 'bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] hover:bg-[var(--finova-card-hover)] border border-[var(--finova-border-light)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-[var(--finova-text-muted)] mr-1">Status:</span>
            {['ALL', 'COMPLETED', 'PENDING', 'FAILED'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  statusFilter === s
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] hover:bg-[var(--finova-card-hover)] border border-[var(--finova-border-light)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-[var(--finova-card-bg)] rounded-2xl border border-[var(--finova-border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--finova-text-secondary)]">
            <thead className="bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] uppercase tracking-wider font-semibold border-b border-[var(--finova-border)]">
              <tr>
                <th className="py-3 px-4">Tx ID / Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Accounts Involved</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--finova-border-light)]">
              {loading && transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--finova-text-muted)]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading transaction records...
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--finova-text-muted)]">
                    No transactions found for the specified filters.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx._id} className="hover:bg-[var(--finova-card-hover)] transition duration-150">
                    <td className="py-3.5 px-4 font-mono font-bold text-[var(--finova-text-heading)]">
                      <div>{tx.transactionId || tx._id}</div>
                      <div className="text-[10px] text-[var(--finova-text-muted)] font-normal">{tx.reference || 'No ref'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[var(--finova-text-heading)]">{tx.user?.name || 'Customer'}</div>
                      <div className="text-[11px] text-[var(--finova-text-muted)]">{tx.user?.email || 'N/A'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-[var(--finova-bg-secondary)] text-[var(--finova-text-heading)] border border-[var(--finova-border-light)]">
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px] font-mono">
                      <div><span className="text-[var(--finova-text-muted)]">From:</span> <span className="text-[var(--finova-text-secondary)]">{tx.senderAccount}</span></div>
                      <div><span className="text-[var(--finova-text-muted)]">To:</span> <span className="text-[var(--finova-text-secondary)]">{tx.receiverAccount}</span></div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[var(--finova-text-heading)] text-sm">
                      {formatCurrency(tx.amount || 0)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                            : tx.status === 'PENDING'
                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {tx.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                        {tx.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                        {tx.status === 'FAILED' && <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[var(--finova-text-muted)]">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openDetails(tx)}
                        className="p-1.5 rounded-lg text-[var(--finova-text-secondary)] hover:text-brand-500 hover:bg-brand-500/10 transition"
                        title="Inspect Transaction"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-[var(--finova-border-light)] flex items-center justify-between text-xs text-[var(--finova-text-secondary)]">
            <span>
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total transactions)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchTransactions(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => fetchTransactions(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Transaction Audit Record"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-[var(--finova-bg-secondary)] rounded-xl border border-[var(--finova-border)] flex items-center justify-between">
              <div>
                <span className="text-xs text-[var(--finova-text-muted)] uppercase font-semibold">Processed Amount</span>
                <div className="text-2xl font-black text-[var(--finova-text-heading)] mt-0.5">
                  {formatCurrency(selectedTx.amount || 0)}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedTx.status === 'COMPLETED'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : selectedTx.status === 'PENDING'
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                }`}
              >
                {selectedTx.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Transaction ID</span>
                <span className="font-mono font-bold text-[var(--finova-text-heading)]">{selectedTx.transactionId || selectedTx._id}</span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Reference Number</span>
                <span className="font-mono font-bold text-[var(--finova-text-heading)]">{selectedTx.reference || 'N/A'}</span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Sender Account</span>
                <span className="font-mono text-[var(--finova-text-secondary)]">{selectedTx.senderAccount}</span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Receiver Account</span>
                <span className="font-mono text-[var(--finova-text-secondary)]">{selectedTx.receiverAccount}</span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl col-span-2">
                <span className="text-[var(--finova-text-muted)] block mb-1">Customer / Initiator</span>
                <span className="font-semibold text-[var(--finova-text-heading)]">{selectedTx.user?.name} ({selectedTx.user?.email})</span>
              </div>
              {selectedTx.description && (
                <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl col-span-2">
                  <span className="text-[var(--finova-text-muted)] block mb-1">Description / Memo</span>
                  <span className="text-[var(--finova-text-secondary)]">{selectedTx.description}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--finova-border-light)] flex items-center justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminTransactions;
