import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  Filter,
  RefreshCw,
  Plus,
  Receipt,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { formatCurrency } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';
import depositWithdrawalService from '../../services/depositWithdrawalService';

const DepositWithdrawalHistory = () => {
  const { showToast } = useToast();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Cancel dialog
  const [requestToCancel, setRequestToCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [typeFilter, statusFilter]);

  const fetchRequests = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const params = {};
      if (typeFilter !== 'ALL') params.type = typeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await depositWithdrawalService.getMyRequests(params);
      if (res.success) {
        setRequests(res.requests || []);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load request history.', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!requestToCancel) return;
    try {
      setCancelling(true);
      const res = await depositWithdrawalService.cancelRequest(requestToCancel._id);
      if (res.success) {
        showToast('Request cancelled successfully.', 'success');
        setRequestToCancel(null);
        fetchRequests(true);
      }
    } catch (err) {
      showToast(err.message || 'Failed to cancel request.', 'error');
    } finally {
      setCancelling(false);
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
          <h1 className="text-2xl font-black text-[var(--finova-text-heading)] tracking-tight">
            Deposit & Withdrawal Requests
          </h1>
          <p className="text-xs text-[var(--finova-text-secondary)] mt-1">
            Track and manage your institutional cash deposits and counter withdrawals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchRequests(true)}
            disabled={refreshing || loading}
            className="p-2.5 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] hover:bg-[var(--finova-bg-secondary)] transition-colors disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link to="/deposit">
            <Button variant="primary" size="sm" className="shadow-xs">
              <ArrowDownLeft className="h-4 w-4 mr-1.5" />
              Deposit Money
            </Button>
          </Link>
          <Link to="/withdraw">
            <Button variant="outline" size="sm" className="shadow-xs">
              <ArrowUpRight className="h-4 w-4 mr-1.5" />
              Withdraw Money
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Type filter tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
            {[
              { id: 'ALL', label: 'All Requests' },
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

          {/* Status filter dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[var(--finova-text-secondary)]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-bold rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] px-3 py-1.5 text-[var(--finova-text-heading)] focus:border-[var(--finova-primary)] focus:ring-1 focus:ring-[var(--finova-primary)]"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Table Content */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader size="md" message="Loading request history..." />
          </div>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No requests found"
            description={
              typeFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'No requests match your selected filters.'
                : "You haven't submitted any deposit or withdrawal requests yet."
            }
            action={
              <div className="flex items-center gap-3">
                <Link to="/deposit">
                  <Button variant="primary" size="sm">
                    Submit Deposit Request
                  </Button>
                </Link>
                <Link to="/withdraw">
                  <Button variant="outline" size="sm">
                    Submit Withdrawal Request
                  </Button>
                </Link>
              </div>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Processed Date</TableHead>
                  <TableHead>Admin Note</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const isDeposit = req.type === 'DEPOSIT';
                  const lastFour = req.account?.accountNumber ? req.account.accountNumber.slice(-4) : '••••';

                  return (
                    <TableRow key={req._id}>
                      <TableCell className="font-mono text-xs font-bold text-[var(--finova-primary)]">
                        {req.requestId}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                            isDeposit
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}
                        >
                          {isDeposit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          {req.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-medium text-[var(--finova-text-heading)]">
                          {req.account?.accountType || 'Savings'}
                        </span>{' '}
                        <span className="font-mono text-[var(--finova-text-secondary)]">
                          ••••{lastFour}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-[var(--finova-text-heading)]">
                        {formatCurrency(req.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(req.status)}</TableCell>
                      <TableCell className="text-xs text-[var(--finova-text-secondary)] whitespace-nowrap">
                        {new Date(req.requestedAt || req.createdAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-[var(--finova-text-secondary)] whitespace-nowrap">
                        {req.processedAt
                          ? new Date(req.processedAt).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </TableCell>
                      <TableCell className="text-xs text-[var(--finova-text-secondary)] max-w-xs truncate">
                        {req.adminNote || '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {req.status === 'PENDING' ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setRequestToCancel(req)}
                          >
                            Cancel
                          </Button>
                        ) : req.transaction?.transactionId ? (
                          <Link to={`/transactions/${req.transaction._id || req.transaction}`}>
                            <span className="text-xs font-bold text-[var(--finova-primary)] hover:underline">
                              View TXN
                            </span>
                          </Link>
                        ) : (
                          <span className="text-xs text-[var(--finova-text-muted)]">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Cancel Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={Boolean(requestToCancel)}
        onClose={() => setRequestToCancel(null)}
        onConfirm={handleCancelRequest}
        title="Cancel Pending Request?"
        message={`Are you sure you want to cancel ${requestToCancel?.type} request ${requestToCancel?.requestId} for ${formatCurrency(requestToCancel?.amount || 0)}? This action cannot be undone.`}
        confirmText={cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
        cancelText="Keep Request"
        variant="danger"
      />
    </div>
  );
};

export default DepositWithdrawalHistory;
