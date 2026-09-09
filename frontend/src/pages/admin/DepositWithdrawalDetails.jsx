import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeft,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  User,
  Wallet,
  Receipt,
  FileText,
  ShieldCheck,
  Check,
  X,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import Modal from '../../components/ui/Modal';
import { formatCurrency, formatAmount } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';
import depositWithdrawalService from '../../services/depositWithdrawalService';

const DepositWithdrawalDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminNote, setAdminNote] = useState('');

  // Modals
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const res = await depositWithdrawalService.getAdminRequestById(id);
      if (res.success) {
        setRequest(res.request);
        if (res.request.adminNote) {
          setAdminNote(res.request.adminNote);
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to load request details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setIsApproving(true);
      const res = await depositWithdrawalService.approveRequest(id, adminNote.trim());
      if (res.success) {
        showToast(res.message || 'Request approved successfully.', 'success');
        setShowApproveModal(false);
        fetchRequestDetails();
      }
    } catch (err) {
      showToast(err.message || 'Failed to approve request.', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast('Please provide a reason for rejecting this request.', 'error');
      return;
    }
    try {
      setIsRejecting(true);
      const res = await depositWithdrawalService.rejectRequest(id, rejectReason.trim());
      if (res.success) {
        showToast(res.message || 'Request rejected.', 'success');
        setShowRejectModal(false);
        fetchRequestDetails();
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            PENDING APPROVAL
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            APPROVED
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            REJECTED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-500 border border-slate-500/20">
            <Ban className="w-3.5 h-3.5" />
            CANCELLED
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader size="lg" message="Loading request audit ledger..." />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="py-16 text-center space-y-4">
        <p className="text-sm text-[var(--finova-text-secondary)]">Request record not found.</p>
        <Link to="/admin/deposit-withdrawal">
          <Button variant="outline" size="sm">
            &larr; Back to Requests
          </Button>
        </Link>
      </div>
    );
  }

  const isDeposit = request.type === 'DEPOSIT';
  const isPending = request.status === 'PENDING';
  const account = request.account;
  const user = request.user;
  const lastFour = account?.accountNumber ? account.accountNumber.slice(-4) : '••••';

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Top navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/deposit-withdrawal"
          className="inline-flex items-center gap-2 text-xs font-bold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Deposit & Withdrawal Requests
        </Link>

        {getStatusBadge(request.status)}
      </div>

      {/* Main Request Header Banner */}
      <Card className="overflow-hidden">
        <div className="p-6 md:p-8 bg-[var(--finova-bg-secondary)] border-b border-[var(--finova-border)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[var(--finova-primary)]">
                {request.requestId}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                  isDeposit
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                }`}
              >
                {isDeposit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                {request.type}
              </span>
            </div>
            <h1 className="text-3xl font-black text-[var(--finova-text-heading)] tracking-tight mt-1">
              {formatCurrency(request.amount)}
            </h1>
            <p className="text-xs text-[var(--finova-text-secondary)] mt-1">
              Requested on{' '}
              {new Date(request.requestedAt || request.createdAt).toLocaleString('en-IN', {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
          </div>

          {/* Action buttons for PENDING requests */}
          {isPending && (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setRejectReason('');
                  setShowRejectModal(true);
                }}
                className="!border-rose-500/40 !text-rose-600 hover:!bg-rose-500/10"
              >
                <X className="h-4 w-4 mr-1.5" />
                Reject Request
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => setShowApproveModal(true)}
                className={
                  isDeposit
                    ? '!bg-emerald-600 hover:!bg-emerald-700 text-white shadow-xs'
                    : '!bg-amber-600 hover:!bg-amber-700 text-white shadow-xs'
                }
              >
                <Check className="h-4 w-4 mr-1.5" />
                Approve {isDeposit ? 'Deposit' : 'Withdrawal'}
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-6 md:p-8 space-y-6">
          {/* Two-column layout: Customer & Account */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="p-5 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--finova-border)]">
                <User className="h-4 w-4 text-[var(--finova-primary)]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--finova-text-heading)]">
                  Customer Information
                </h2>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--finova-text-secondary)]">Name:</span>
                  <span className="font-bold text-[var(--finova-text-heading)]">
                    {user?.name || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--finova-text-secondary)]">Customer ID:</span>
                  <span className="font-mono font-bold text-[var(--finova-text-heading)]">
                    {user?.customerId || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--finova-text-secondary)]">Email:</span>
                  <span className="font-medium text-[var(--finova-text-heading)]">
                    {user?.email || '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--finova-text-secondary)]">Phone:</span>
                  <span className="font-medium text-[var(--finova-text-heading)]">
                    {user?.phone || '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div className="p-5 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-[var(--finova-border)]">
                <Wallet className="h-4 w-4 text-[var(--finova-primary)]" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--finova-text-heading)]">
                  Account Ledger Information
                </h2>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--finova-text-secondary)]">Account Number:</span>
                  <span className="font-mono font-bold text-[var(--finova-text-heading)]">
                    ••••{lastFour}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--finova-text-secondary)]">Account Type:</span>
                  <span className="font-semibold text-[var(--finova-text-heading)]">
                    {account?.accountType || 'Savings'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--finova-text-secondary)]">Account Status:</span>
                  <span className="font-bold uppercase text-emerald-600">
                    {account?.status || 'Active'}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-[var(--finova-border)]">
                  <span className="text-[var(--finova-text-secondary)] font-semibold">
                    Current Live Balance:
                  </span>
                  <span className="font-extrabold text-[var(--finova-text-heading)] text-sm">
                    {formatCurrency(account?.balance || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Request Reason & Description */}
          <div className="p-5 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-secondary)] block">
              Customer Description / Reason
            </span>
            <p className="text-xs text-[var(--finova-text-heading)] leading-relaxed">
              {request.description || 'No description provided by customer.'}
            </p>
          </div>

          {/* Processing Details (If already processed) */}
          {!isPending && (
            <div className="p-5 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-secondary)] block">
                Administrative Decision Record
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-[var(--finova-text-secondary)] block">Decision:</span>
                  <span className="font-bold text-[var(--finova-text-heading)] mt-0.5 block">
                    {request.status}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--finova-text-secondary)] block">Processed By:</span>
                  <span className="font-bold text-[var(--finova-text-heading)] mt-0.5 block">
                    {request.processedBy?.name || 'Administrator'}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--finova-text-secondary)] block">Processed Date:</span>
                  <span className="font-medium text-[var(--finova-text-heading)] mt-0.5 block">
                    {request.processedAt
                      ? new Date(request.processedAt).toLocaleString('en-IN', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : '—'}
                  </span>
                </div>
              </div>

              {request.adminNote && (
                <div className="pt-2 border-t border-[var(--finova-border)]">
                  <span className="text-[var(--finova-text-secondary)] text-[11px] block font-semibold">
                    Admin Processing Remarks:
                  </span>
                  <p className="text-xs text-[var(--finova-text-heading)] mt-1 font-medium italic">
                    "{request.adminNote}"
                  </p>
                </div>
              )}

              {request.transaction && (
                <div className="pt-2 border-t border-[var(--finova-border)] flex items-center justify-between text-xs">
                  <span className="text-[var(--finova-text-secondary)]">
                    Resulting Transaction Record:
                  </span>
                  <span className="font-mono font-bold text-[var(--finova-primary)]">
                    {request.transaction?.transactionId || request.transaction}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Pending Request Admin Note Input */}
          {isPending && (
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
                Add Processing Note
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="Add processing note or remarks for audit logging"
                className="w-full rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] px-3.5 py-2.5 text-xs text-[var(--finova-text-heading)] placeholder:text-[var(--finova-text-muted)] focus:border-[var(--finova-primary)] focus:ring-1 focus:ring-[var(--finova-primary)]"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* APPROVAL CONFIRMATION MODAL */}
      <Modal
        isOpen={showApproveModal}
        onClose={() => setShowApproveModal(false)}
        title={`Approve ${isDeposit ? 'Deposit' : 'Withdrawal'}?`}
        description="Verify ledger adjustment details before confirming."
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={isApproving}
              onClick={() => setShowApproveModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isApproving}
              onClick={handleApprove}
              className={
                isDeposit
                  ? '!bg-emerald-600 hover:!bg-emerald-700 text-white'
                  : '!bg-amber-600 hover:!bg-amber-700 text-white'
              }
            >
              {isApproving
                ? 'Processing...'
                : isDeposit
                ? 'Confirm Approval'
                : 'Confirm Withdrawal'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl p-4 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--finova-text-secondary)]">Customer:</span>
              <span className="font-bold text-[var(--finova-text-heading)]">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--finova-text-secondary)]">Account:</span>
              <span className="font-mono font-bold text-[var(--finova-text-heading)]">
                ••••{lastFour}
              </span>
            </div>

            {isDeposit ? (
              <>
                <div className="flex justify-between">
                  <span className="text-[var(--finova-text-secondary)]">Current Balance:</span>
                  <span className="font-medium text-[var(--finova-text-heading)]">
                    {formatCurrency(account?.balance || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Deposit:</span>
                  <span>+{formatCurrency(request.amount)}</span>
                </div>
                <div className="pt-2 border-t border-[var(--finova-border)] flex justify-between font-bold text-sm">
                  <span className="text-[var(--finova-text-heading)]">New Balance:</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {formatCurrency((account?.balance || 0) + request.amount)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-[var(--finova-text-secondary)]">Current Balance:</span>
                  <span className="font-medium text-[var(--finova-text-heading)]">
                    {formatCurrency(account?.balance || 0)}
                  </span>
                </div>
                <div className="flex justify-between text-rose-600 dark:text-rose-400 font-semibold">
                  <span>Withdrawal:</span>
                  <span>-{formatCurrency(request.amount)}</span>
                </div>
                <div className="pt-2 border-t border-[var(--finova-border)] flex justify-between font-bold text-sm">
                  <span className="text-[var(--finova-text-heading)]">Remaining Balance:</span>
                  <span className="text-[var(--finova-text-heading)]">
                    {formatCurrency((account?.balance || 0) - request.amount)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </Modal>

      {/* REJECTION MODAL */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title={`Reject ${isDeposit ? 'Deposit' : 'Withdrawal'} Request?`}
        description="A justification reason is required for institutional record and customer notification."
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={isRejecting}
              onClick={() => setShowRejectModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isRejecting || !rejectReason.trim()}
              onClick={handleReject}
            >
              {isRejecting ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl p-3.5 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-300">
            Customer balance will <strong>NOT</strong> change. An automated institutional notification will be dispatched.
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--finova-text-secondary)] mb-1.5">
              Rejection Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Required verification documents were not provided."
              className="w-full rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] p-3 text-xs text-[var(--finova-text-heading)] placeholder:text-[var(--finova-text-muted)] focus:border-rose-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DepositWithdrawalDetails;
