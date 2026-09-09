import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  Wallet,
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  Info,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { formatCurrency, formatAmount } from '../../utils/currency';
import { useToast } from '../../context/ToastContext';
import accountService from '../../services/accountService';
import depositWithdrawalService from '../../services/depositWithdrawalService';

const WithdrawalRequest = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submittedRequest, setSubmittedRequest] = useState(null);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await accountService.getAccounts();
      const activeAccounts = (res.accounts || []).filter(
        (a) => a.status?.toLowerCase() === 'active'
      );
      setAccounts(activeAccounts);
      if (activeAccounts.length > 0) {
        setSelectedAccountId(activeAccounts[0]._id);
      }
    } catch (err) {
      showToast(err.message || 'Failed to load bank accounts.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedAccount = accounts.find((a) => a._id === selectedAccountId);
  const numericAmount = parseFloat(amount) || 0;
  const isInsufficient = selectedAccount && numericAmount > selectedAccount.balance;
  const remainingBalance = selectedAccount
    ? Math.max(0, selectedAccount.balance - numericAmount)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isNaN(numericAmount) || numericAmount <= 0) {
      showToast('Please enter a valid withdrawal amount greater than 0.', 'error');
      return;
    }

    if (!selectedAccount) {
      showToast('Please select an account for withdrawal.', 'error');
      return;
    }

    if (isInsufficient) {
      showToast(
        `Insufficient funds. Available balance is ${formatCurrency(selectedAccount.balance)}.`,
        'error'
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await depositWithdrawalService.createRequest({
        accountId: selectedAccountId,
        type: 'WITHDRAWAL',
        amount: numericAmount,
        description: description.trim(),
      });

      if (res.success) {
        showToast('Your request has been submitted for admin approval.', 'success');
        setSubmittedRequest(res.request);
      }
    } catch (err) {
      showToast(err.message || 'Failed to submit withdrawal request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSubmittedRequest(null);
    setAmount('');
    setDescription('');
  };

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <Loader size="lg" message="Loading your account details..." />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[var(--finova-text-secondary)]">
          <Link to="/dashboard" className="hover:text-[var(--finova-primary)] transition-colors">
            Dashboard
          </Link>
          <span>/</span>
          <Link to="/deposit-withdrawal-requests" className="hover:text-[var(--finova-primary)] transition-colors">
            Deposit & Withdrawal
          </Link>
          <span>/</span>
          <span className="font-semibold text-[var(--finova-text-heading)]">Request Withdrawal</span>
        </div>
        <Link to="/deposit-withdrawal-requests">
          <Button variant="outline" size="sm">
            View Request History
          </Button>
        </Link>
      </div>

      {!submittedRequest ? (
        <Card className="overflow-hidden">
          <CardHeader className="bg-[var(--finova-bg-secondary)] border-b border-[var(--finova-border)]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shadow-xs border border-amber-500/20">
                <ArrowUpRight className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Request a Withdrawal</CardTitle>
                <CardDescription>
                  Submit a withdrawal request. A Finova administrator will review and process it.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Regulatory alert */}
            <div className="rounded-xl p-4 bg-[var(--finova-info-bg)] border border-[var(--finova-info)]/20 flex items-start gap-3">
              <Info className="h-5 w-5 text-[var(--finova-info)] shrink-0 mt-0.5" />
              <div className="text-xs text-[var(--finova-text-secondary)] space-y-1">
                <p className="font-bold text-[var(--finova-text-heading)]">Institutional Security Protocol</p>
                <p>
                  Withdrawal requests require administrator authorization to prevent fraud and maintain institutional reserves. Your balance will be debited upon admin approval. Ensure you maintain sufficient funds until the request is finalized.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--finova-text-secondary)] mb-2">
                  Source Bank Account
                </label>
                {accounts.length === 0 ? (
                  <div className="p-4 rounded-xl border border-[var(--finova-warning)]/30 bg-[var(--finova-warning-bg)] text-xs text-[var(--finova-warning)]">
                    No active bank accounts found.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {accounts.map((acc) => {
                      const isSelected = acc._id === selectedAccountId;
                      return (
                        <div
                          key={acc._id}
                          onClick={() => setSelectedAccountId(acc._id)}
                          className={`cursor-pointer p-4 rounded-xl border transition-all duration-150 flex flex-col justify-between ${
                            isSelected
                              ? 'border-[var(--finova-primary)] bg-[var(--finova-mint)]/20 shadow-xs'
                              : 'border-[var(--finova-border)] bg-[var(--finova-card-bg)] hover:border-[var(--finova-primary)]/40 hover:bg-[var(--finova-bg-secondary)]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-[var(--finova-text-heading)]">
                              {acc.accountType} Account
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              Active
                            </span>
                          </div>
                          <p className="font-mono text-xs text-[var(--finova-text-secondary)] mb-2">
                            ••••{acc.accountNumber?.slice(-4)}
                          </p>
                          <div className="pt-2 border-t border-[var(--finova-border)] flex items-center justify-between text-xs">
                            <span className="text-[var(--finova-text-secondary)]">Available Balance:</span>
                            <span className="font-bold text-[var(--finova-text-heading)]">
                              {formatCurrency(acc.balance)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Amount Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
                    Withdrawal Amount (INR)
                  </label>
                  {selectedAccount && (
                    <span className="text-xs text-[var(--finova-text-secondary)]">
                      Available:{' '}
                      <strong className="text-[var(--finova-text-heading)]">
                        {formatCurrency(selectedAccount.balance)}
                      </strong>
                    </span>
                  )}
                </div>
                <div className="relative rounded-xl shadow-xs">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <span className="text-lg font-bold text-[var(--finova-text-secondary)]">₹</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="10,000.00"
                    className={`block w-full rounded-xl border bg-[var(--finova-card-bg)] pl-9 pr-4 py-3.5 text-base font-bold text-[var(--finova-text-heading)] placeholder:text-[var(--finova-text-muted)] transition-all ${
                      isInsufficient
                        ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                        : 'border-[var(--finova-border)] focus:border-[var(--finova-primary)] focus:ring-1 focus:ring-[var(--finova-primary)]'
                    }`}
                  />
                </div>

                {isInsufficient ? (
                  <p className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Insufficient funds. Amount exceeds current balance.</span>
                  </p>
                ) : numericAmount > 0 ? (
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-[var(--finova-primary)] font-semibold">
                      Requested: {formatCurrency(numericAmount)}
                    </span>
                    <span className="text-[var(--finova-text-secondary)]">
                      Projected Remaining:{' '}
                      <strong className="text-[var(--finova-text-heading)]">
                        {formatCurrency(remainingBalance)}
                      </strong>
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Reason / Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--finova-text-secondary)] mb-2">
                  Reason / Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g., Cash withdrawal request for personal expense"
                  maxLength={200}
                  className="block w-full rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] p-3.5 text-sm text-[var(--finova-text-heading)] placeholder:text-[var(--finova-text-muted)] focus:border-[var(--finova-primary)] focus:ring-1 focus:ring-[var(--finova-primary)] transition-all"
                />
                <p className="mt-1 text-[11px] text-[var(--finova-text-secondary)] text-right">
                  {description.length}/200 characters
                </p>
              </div>

              {/* Security confirmation banner */}
              <div className="p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-xs text-[var(--finova-text-secondary)] flex items-center gap-3">
                <Clock className="h-5 w-5 text-[var(--finova-warning)] shrink-0" />
                <span>
                  <strong>Important Notice:</strong> Your balance will not change immediately upon submission. An administrator will review and authorize the withdrawal.
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={submitting || isInsufficient || accounts.length === 0}
                  className="w-full sm:w-auto px-8"
                >
                  {submitting ? 'Submitting Request...' : 'Submit Withdrawal Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        /* Submission Success Card */
        <Card className="overflow-hidden border-2 border-emerald-500/30">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white text-center">
            <div className="h-16 w-16 mx-auto rounded-full bg-white/20 flex items-center justify-center mb-3 backdrop-blur-xs">
              <CheckCircle2 className="h-9 w-9 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Your request has been submitted for admin approval.</h2>
            <p className="text-sm text-emerald-100 mt-1 max-w-md mx-auto">
              Institutional ticket created. A Finova administrator will review and process your cash withdrawal.
            </p>
          </div>

          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] p-5 space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--finova-border)]">
                <span className="text-xs font-semibold text-[var(--finova-text-secondary)]">Request ID</span>
                <span className="font-mono text-sm font-bold text-[var(--finova-primary)]">
                  {submittedRequest.requestId}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--finova-border)]">
                <span className="text-xs font-semibold text-[var(--finova-text-secondary)]">Account</span>
                <span className="text-sm font-bold text-[var(--finova-text-heading)]">
                  {submittedRequest.account?.accountType || 'Savings'} ••••
                  {submittedRequest.account?.accountNumber?.slice(-4) || '----'}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--finova-border)]">
                <span className="text-xs font-semibold text-[var(--finova-text-secondary)]">Amount</span>
                <span className="text-base font-extrabold text-[var(--finova-text-heading)]">
                  {formatCurrency(submittedRequest.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--finova-border)]">
                <span className="text-xs font-semibold text-[var(--finova-text-secondary)]">Type</span>
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  {submittedRequest.type}
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-[var(--finova-border)]">
                <span className="text-xs font-semibold text-[var(--finova-text-secondary)]">Status</span>
                <span className="text-xs font-bold uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  {submittedRequest.status}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[var(--finova-text-secondary)]">Date</span>
                <span className="text-xs font-medium text-[var(--finova-text-heading)]">
                  {new Date(submittedRequest.requestedAt || submittedRequest.createdAt).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
              <strong>Notice:</strong> Your customer balance has <strong>NOT</strong> been debited yet. It will update atomically once the request is approved.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={resetForm} className="w-full sm:w-auto">
                <RotateCcw className="h-4 w-4 mr-2" />
                Submit Another Request
              </Button>
              <Link to="/deposit-withdrawal-requests" className="w-full sm:w-auto">
                <Button variant="primary" className="w-full">
                  View All Requests
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WithdrawalRequest;
