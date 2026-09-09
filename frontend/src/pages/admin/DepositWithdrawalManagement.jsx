import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Check,
  X,
  AlertTriangle,
  Calendar,
  Layers,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatAmount } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';
import depositWithdrawalService from '../../services/depositWithdrawalService';

const DepositWithdrawalManagement = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [summary, setSummary] = useState({
    pendingDeposits: 0,
    pendingWithdrawals: 0,
    approvedToday: 0,
    rejectedToday: 0,
    totalDepositAmount: 0,
    totalWithdrawalAmount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [approveModalReq, setApproveModalReq] = useState(null);
  const [adminApproveNote, setAdminApproveNote] = useState('');
  const [isApproving, setIsApproving] = useState(false);

  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [adminRejectReason, setAdminRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [typeFilter, statusFilter, dateRange]);

  const fetchRequests = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const params = {};
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (dateRange !== 'all') params.dateRange = dateRange;
      if (dateRange === 'custom') {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await depositWithdrawalService.getAdminRequests(params);
      if (res.success) {
        setRequests(res.requests || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load requests.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRequests(true);
  };

  // Approve action
  const handleConfirmApproval = async () => {
    if (!approveModalReq) return;
    try {
      setIsApproving(true);
      const res = await depositWithdrawalService.approveRequest(
        approveModalReq._id,
        adminApproveNote.trim()
      );
      if (res.success) {
        showToast(res.message || 'Request approved successfully.', 'success');
        setApproveModalReq(null);
        setAdminApproveNote('');
        fetchRequests(true);
      }
    } catch (err) {
      showToast(err.message || 'Failed to approve request.', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  // Reject action
  const handleConfirmRejection = async () => {
    if (!rejectModalReq) return;
    if (!adminRejectReason.trim()) {
      showToast('Please provide a reason for rejecting this request.', 'error');
      return;
    }
    try {
      setIsRejecting(true);
      const res = await depositWithdrawalService.rejectRequest(
        rejectModalReq._id,
        adminRejectReason.trim()
      );
      if (res.success) {
        showToast(res.message || 'Request rejected successfully.', 'success');
        setRejectModalReq(null);
        setAdminRejectReason('');
        fetchRequests(true);
      }
    } catch (err) {
      showToast(err.message || 'Failed to reject request.', 'error');
    } finally {
      setIsRejecting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            PENDING
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            REJECTED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
            <Ban className="w-3 h-3" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              Institutional Vault Control
            </span>
          </div>
          <h1 className="text-2xl font-black text-[var(--finova-text-heading)] tracking-tight mt-1">
            Deposit & Withdrawal Management
          </h1>
          <p className="text-xs text-[var(--finova-text-secondary)] mt-0.5">
            Review, verify, approve, or reject customer cash deposits and counter withdrawals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRequests(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border border-[var(--finova-border)] bg-[var(--finova-card-bg)] text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] hover:bg-[var(--finova-bg-secondary)] transition-colors disabled:opacity-50 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Pending Deposits */}
        <div className="p-4 rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
            <span>Pending Deposits</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {summary.pendingDeposits}
            </span>
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="p-4 rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
            <span>Pending Withdrawals</span>
            <ArrowUpRight className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {summary.pendingWithdrawals}
            </span>
          </div>
        </div>

        {/* Approved Today */}
        <div className="p-4 rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
            <span>Approved Today</span>
            <CheckCircle2 className="h-4 w-4 text-[var(--finova-primary)]" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-[var(--finova-text-heading)] truncate block">
              {formatCurrency(summary.approvedToday)}
            </span>
          </div>
        </div>

        {/* Rejected Today */}
        <div className="p-4 rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
            <span>Rejected Today</span>
            <XCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {summary.rejectedToday}
            </span>
          </div>
        </div>

        {/* Total Deposit Amount */}
        <div className="p-4 rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
            <span>Total Deposits</span>
            <Layers className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <span className="text-base font-extrabold text-[var(--finova-text-heading)] truncate block">
              {formatCurrency(summary.totalDepositAmount)}
            </span>
          </div>
        </div>

        {/* Total Withdrawal Amount */}
        <div className="p-4 rounded-2xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
            <span>Total Withdrawals</span>
            <Layers className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className="text-base font-extrabold text-[var(--finova-text-heading)] truncate block">
              {formatCurrency(summary.totalWithdrawalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search input */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--finova-text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, ID, request ID, account..."
              className="w-full rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)] pl-9 pr-20 py-2 text-xs text-[var(--finova-text-heading)] placeholder:text-[var(--finova-text-muted)] focus:border-[var(--finova-primary)] focus:ring-1 focus:ring-[var(--finova-primary)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchRequests(true);
                }}
                className="absolute right-12 top-1/2 -translate-y-1/2 text-[10px] text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)]"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-[var(--finova-primary)] text-white text-[11px] font-bold"
            >
              Search
            </button>
          </form>

          {/* Type tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
            {[
              { id: 'ALL', label: 'All Types' },
              { id: 'DEPOSIT', label: 'Deposits' },
              { id: 'WITHDRAWAL', label: 'Withdrawals' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  typeFilter === tab.id
                    ? 'bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] shadow-xs border border-[var(--finova-border)]'
                    : 'text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--finova-border)] text-xs">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--finova-text-secondary)]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-[var(--finova-border)] bg-[var(--finova-card-bg)] px-2.5 py-1 font-semibold text-[var(--finova-text-heading)] focus:border-[var(--finova-primary)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          {/* Date range filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-[var(--finova-text-secondary)]">Date:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="rounded-lg border border-[var(--finova-border)] bg-[var(--finova-card-bg)] px-2.5 py-1 font-semibold text-[var(--finova-text-heading)] focus:border-[var(--finova-primary)]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom date range inputs */}
          {dateRange === 'custom' && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-[var(--finova-border)] bg-[var(--finova-card-bg)] px-2 py-1 text-xs"
              />
              <span className="text-[var(--finova-text-secondary)]">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-[var(--finova-border)] bg-[var(--finova-card-bg)] px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={() => fetchRequests(true)}
                className="px-2.5 py-1 rounded-lg bg-[var(--finova-primary)] text-white font-bold"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Main Request Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader size="md" message="Loading request ledger..." />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No deposit/withdrawal requests found"
            description="No requests match your current filters and search query."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested At</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const isDeposit = req.type === 'DEPOSIT';
                  const lastFour = req.account?.accountNumber
                    ? req.account.accountNumber.slice(-4)
                    : '••••';

                  return (
                    <TableRow key={req._id}>
                      {/* Request ID */}
                      <TableCell className="font-mono text-xs font-bold text-[var(--finova-primary)]">
                        <Link
                          to={`/admin/deposit-withdrawal/${req._id}`}
                          className="hover:underline"
                        >
                          {req.requestId}
                        </Link>
                      </TableCell>

                      {/* Customer */}
                      <TableCell className="text-xs">
                        <span className="font-bold text-[var(--finova-text-heading)] block">
                          {req.user?.name || 'Unknown Customer'}
                        </span>
                        <span className="text-[11px] text-[var(--finova-text-secondary)]">
                          {req.user?.email || ''}
                        </span>
                      </TableCell>

                      {/* Customer ID */}
                      <TableCell className="font-mono text-xs font-semibold text-[var(--finova-text-secondary)]">
                        {req.user?.customerId || '—'}
                      </TableCell>

                      {/* Account */}
                      <TableCell className="text-xs">
                        <span className="font-mono font-medium text-[var(--finova-text-heading)]">
                          ••••{lastFour}
                        </span>
                        <span className="block text-[10px] text-[var(--finova-text-secondary)]">
                          {req.account?.accountType || 'Savings'}
                        </span>
                      </TableCell>

                      {/* Type */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                            isDeposit
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {isDeposit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {req.type}
                        </span>
                      </TableCell>

                      {/* Amount */}
                      <TableCell className="text-xs font-black text-[var(--finova-text-heading)]">
                        {formatCurrency(req.amount)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>{getStatusBadge(req.status)}</TableCell>

                      {/* Requested At */}
                      <TableCell className="text-xs text-[var(--finova-text-secondary)] whitespace-nowrap">
                        {new Date(req.requestedAt || req.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Link */}
                          <Link to={`/admin/deposit-withdrawal/${req._id}`}>
                            <Button variant="ghost" size="sm" title="View Request Details">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>

                          {/* Only show Approve/Reject for PENDING requests */}
                          {req.status === 'PENDING' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="!border-emerald-500/40 !text-emerald-600 hover:!bg-emerald-500/10"
                                onClick={() => {
                                  setApproveModalReq(req);
                                  setAdminApproveNote('');
                                }}
                                title="Approve Request"
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Approve
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="!border-rose-500/40 !text-rose-600 hover:!bg-rose-500/10"
                                onClick={() => {
                                  setRejectModalReq(req);
                                  setAdminRejectReason('');
                                }}
                                title="Reject Request"
                              >
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* CONFIRMATION MODAL: APPROVAL (Section 25 Compliance) */}
      <Modal
        isOpen={Boolean(approveModalReq)}
        onClose={() => setApproveModalReq(null)}
        title={`Approve ${approveModalReq?.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'}?`}
        description="Verify ledger details before confirming balance adjustment."
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={isApproving}
              onClick={() => setApproveModalReq(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isApproving}
              onClick={handleConfirmApproval}
              className={
                approveModalReq?.type === 'DEPOSIT'
                  ? '!bg-emerald-600 hover:!bg-emerald-700 text-white'
                  : '!bg-amber-600 hover:!bg-amber-700 text-white'
              }
            >
              {isApproving
                ? 'Processing...'
                : approveModalReq?.type === 'DEPOSIT'
                ? 'Confirm Approval'
                : 'Confirm Withdrawal'}
            </Button>
          </div>
        }
      >
        {approveModalReq && (
          <div className="space-y-4">
            {/* Calculation Card */}
            <div className="rounded-xl p-4 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--finova-text-secondary)]">Customer:</span>
                <span className="font-bold text-[var(--finova-text-heading)]">
                  {approveModalReq.user?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--finova-text-secondary)]">Account:</span>
                <span className="font-mono font-bold text-[var(--finova-text-heading)]">
                  ••••{approveModalReq.account?.accountNumber ? approveModalReq.account.accountNumber.slice(-4) : '••••'}
                </span>
              </div>

              {approveModalReq.type === 'DEPOSIT' ? (
                <>
                  <div className="flex justify-between">
                    <span className="text-[var(--finova-text-secondary)]">Current Balance:</span>
                    <span className="font-medium text-[var(--finova-text-heading)]">
                      {formatCurrency(approveModalReq.account?.balance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Deposit Amount:</span>
                    <span>+{formatCurrency(approveModalReq.amount)}</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--finova-border)] flex justify-between font-bold text-sm">
                    <span className="text-[var(--finova-text-heading)]">New Balance:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatCurrency((approveModalReq.account?.balance || 0) + approveModalReq.amount)}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <span className="text-[var(--finova-text-secondary)]">Current Balance:</span>
                    <span className="font-medium text-[var(--finova-text-heading)]">
                      {formatCurrency(approveModalReq.account?.balance || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                    <span>Withdrawal Amount:</span>
                    <span>-{formatCurrency(approveModalReq.amount)}</span>
                  </div>
                  <div className="pt-2 border-t border-[var(--finova-border)] flex justify-between font-bold text-sm">
                    <span className="text-[var(--finova-text-heading)]">Remaining Balance:</span>
                    <span className="text-[var(--finova-text-heading)]">
                      {formatCurrency((approveModalReq.account?.balance || 0) - approveModalReq.amount)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Admin Note Input */}
            <div>
              <label className="block text-xs font-bold text-[var(--finova-text-secondary)] mb-1.5">
                Processing Note (Optional)
              </label>
              <input
                type="text"
                value={adminApproveNote}
                onChange={(e) => setAdminApproveNote(e.target.value)}
                placeholder="e.g., Counter cash verified and received"
                className="w-full rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] px-3 py-2 text-xs text-[var(--finova-text-heading)] focus:border-[var(--finova-primary)]"
              />
            </div>
          </div>
        )}
      </Modal>

      {/* REJECTION MODAL */}
      <Modal
        isOpen={Boolean(rejectModalReq)}
        onClose={() => setRejectModalReq(null)}
        title={`Reject ${rejectModalReq?.type === 'DEPOSIT' ? 'Deposit' : 'Withdrawal'} Request?`}
        description="A clear justification reason is required for institutional audit and customer notice."
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={isRejecting}
              onClick={() => setRejectModalReq(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isRejecting || !adminRejectReason.trim()}
              onClick={handleConfirmRejection}
            >
              {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        }
      >
        {rejectModalReq && (
          <div className="space-y-4">
            <div className="rounded-xl p-3.5 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
              Customer balance will <strong>NOT</strong> be changed. The customer will receive an immediate notification with your remarks.
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--finova-text-secondary)] mb-1.5">
                Rejection Reason / Remarks <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={adminRejectReason}
                onChange={(e) => setAdminRejectReason(e.target.value)}
                placeholder="e.g., Required verification documents were not provided."
                className="w-full rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] p-3 text-xs text-[var(--finova-text-heading)] placeholder:text-[var(--finova-text-muted)] focus:border-rose-500"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DepositWithdrawalManagement;
