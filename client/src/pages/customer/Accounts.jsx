import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import accountService from '../../services/accountService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import Loader from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import {
  Wallet,
  PlusCircle,
  ShieldCheck,
  Snowflake,
  Play,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency, formatAmount } from '../../utils/currency';

const Accounts = () => {
  const { showToast } = useToast();
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Confirmation dialog state
  const [accountToToggle, setAccountToToggle] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newAccountType, setNewAccountType] = useState('Savings');
  const [initialDeposit, setInitialDeposit] = useState('500.00');
  const [dailyLimit, setDailyLimit] = useState('5000.00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const navigate = useNavigate();

  const fetchAccounts = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await accountService.getAccounts();
      setAccounts(data.accounts || []);
      setTotalBalance(data.totalBalance || 0);
    } catch (err) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleCopy = (num) => {
    navigator.clipboard.writeText(num);
    setCopiedId(num);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setModalError('');
    setIsSubmitting(true);

    try {
      await accountService.createAccount({
        accountType: newAccountType,
        initialDeposit: parseFloat(initialDeposit) || 0,
        dailyTransferLimit: parseFloat(dailyLimit) || 5000,
      });

      setIsCreateModalOpen(false);
      showToast(`New ${newAccountType} account created successfully!`, 'success');
      setNewAccountType('Savings');
      setInitialDeposit('500.00');
      fetchAccounts();
    } catch (err) {
      setModalError(err.message || 'Failed to create account');
      showToast(err.message || 'Failed to create account', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmToggleStatus = async () => {
    if (!accountToToggle) return;
    const nextStatus = accountToToggle.status === 'Active' ? 'Frozen' : 'Active';

    try {
      setToggleLoading(true);
      await accountService.updateAccountStatus(accountToToggle._id, nextStatus);
      showToast(`Account ${accountToToggle.accountNumber} is now ${nextStatus}.`, 'success');
      setAccountToToggle(null);
      fetchAccounts();
    } catch (err) {
      showToast(err.message || 'Failed to update account status', 'error');
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Bank Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your personal Savings and Current banking accounts
          </p>
        </div>

        <Button
          variant="primary"
          icon={PlusCircle}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Open New Account
        </Button>
      </div>

      {/* Aggregate Overview Card */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Aggregated Net Worth
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white mt-1">
            {formatCurrency(totalBalance)}
          </div>
          <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-2">
            <span>{accounts.length} Total Accounts</span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">Active & Protected</span>
          </p>
        </div>

        <div className="flex gap-2.5">
          <Link to="/deposit">
            <Button variant="primary" size="sm" icon={ArrowDownLeft} className="!bg-emerald-600 hover:!bg-emerald-700">
              Deposit
            </Button>
          </Link>
          <Link to="/withdraw">
            <Button variant="outline" size="sm" icon={ArrowUpRight} className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20">
              Withdraw
            </Button>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 p-4 text-xs text-rose-700 border border-rose-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Accounts List Grid */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Loader size="lg" label="Loading bank accounts..." />
        </div>
      ) : accounts.length === 0 ? (
        <Card className="text-center py-12 p-6">
          <CardContent className="space-y-4">
            <Wallet className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Accounts Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You do not have any open accounts yet. Click below to open your first Savings or Current account.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              Open First Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((acc) => {
            const isFrozen = acc.status === 'Frozen';
            const isClosed = acc.status === 'Closed';

            return (
              <Card
                key={acc._id}
                hover
                className={`relative overflow-hidden flex flex-col justify-between border transition-all ${
                  isFrozen
                    ? 'border-cyan-500/30 bg-cyan-500/5'
                    : isClosed
                    ? 'border-[var(--finova-border)] opacity-60'
                    : 'border-[var(--finova-border)] bg-[var(--finova-card-bg)]'
                }`}
              >
                <div>
                  {/* Card Header Bar */}
                  <div className="p-5 pb-3 border-b border-[var(--finova-border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-[var(--finova-text-heading)]">
                        {acc.accountType} Account
                      </span>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        acc.status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isFrozen
                          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {isFrozen && <Snowflake className="h-3 w-3" />}
                      {acc.status === 'Active' && <CheckCircle2 className="h-3 w-3" />}
                      <span>{acc.status}</span>
                    </span>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 space-y-4">
                    {/* Balance */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-muted)]">
                        Available Balance
                      </span>
                      <div className="text-2xl font-black text-[var(--finova-text-heading)] mt-0.5">
                        {formatCurrency(acc.balance)}
                        <span className="text-xs font-normal text-[var(--finova-text-muted)] ml-1">
                          ({acc.currency || 'INR'})
                        </span>
                      </div>
                    </div>

                    {/* Account Number with Copy */}
                    <div className="p-2.5 rounded-lg bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[var(--finova-text-muted)] block">
                          Account Number
                        </span>
                        <span className="font-mono text-xs font-bold text-[var(--finova-text-heading)] tracking-wider">
                          {acc.accountNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(acc.accountNumber)}
                        className="p-1.5 text-[var(--finova-text-muted)] hover:text-[var(--finova-text-heading)] rounded hover:bg-[var(--finova-card-bg)] transition-colors"
                        title="Copy Account Number"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Meta row */}
                    <div className="text-xs text-[var(--finova-text-muted)] flex justify-between">
                      <span>Daily Limit:</span>
                      <span className="font-semibold text-[var(--finova-text-heading)]">
                        {formatCurrency(acc.dailyTransferLimit || 50000)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="p-4 bg-[var(--finova-bg-secondary)]/60 border-t border-[var(--finova-border)] flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountToToggle(acc)}
                    disabled={isClosed}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1 ${
                      isFrozen
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                        : 'text-[var(--finova-text-secondary)] hover:bg-[var(--finova-border)]'
                    }`}
                  >
                    {isFrozen ? (
                      <>
                        <Play className="h-3.5 w-3.5" />
                        <span>Unfreeze</span>
                      </>
                    ) : (
                      <>
                        <Snowflake className="h-3.5 w-3.5" />
                        <span>Freeze</span>
                      </>
                    )}
                  </button>

                  <Link to={`/accounts/${acc._id}`}>
                    <Button variant="outline" size="sm" icon={ExternalLink} iconPosition="right">
                      View Details
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Account Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Open New Bank Account"
        description="Choose your account tier and opening balance"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleCreateAccount}
            >
              Confirm & Open Account
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          {modalError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-500/10 p-2.5 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{modalError}</span>
            </div>
          )}

          {/* Account Type Toggle */}
          <div>
            <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1.5">
              Select Account Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setNewAccountType('Savings')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  newAccountType === 'Savings'
                    ? 'border-[var(--finova-navy)] bg-[var(--finova-navy)]/10 shadow-xs ring-1 ring-[var(--finova-navy)]'
                    : 'border-[var(--finova-border)] hover:bg-[var(--finova-bg-secondary)]'
                }`}
              >
                <div className="font-bold text-xs text-[var(--finova-text-heading)]">Savings Account</div>
                <div className="text-[11px] text-[var(--finova-text-muted)] mt-0.5">High yield & wealth building</div>
              </button>

              <button
                type="button"
                onClick={() => setNewAccountType('Current')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  newAccountType === 'Current'
                    ? 'border-[var(--finova-navy)] bg-[var(--finova-navy)]/10 shadow-xs ring-1 ring-[var(--finova-navy)]'
                    : 'border-[var(--finova-border)] hover:bg-[var(--finova-bg-secondary)]'
                }`}
              >
                <div className="font-bold text-xs text-[var(--finova-text-heading)]">Current Account</div>
                <div className="text-[11px] text-[var(--finova-text-muted)] mt-0.5">Daily transactions & billing</div>
              </button>
            </div>
          </div>

          <Input
            label="Initial Opening Deposit (₹ INR)"
            type="number"
            step="0.01"
            min="0"
            value={initialDeposit}
            onChange={(e) => setInitialDeposit(e.target.value)}
            helperText="Funds credited immediately upon account opening."
            required
          />

          <Input
            label="Daily Transfer Limit (₹ INR)"
            type="number"
            step="100"
            min="500"
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
            helperText="Maximum allowed cumulative daily outgoing transfers."
          />

          <div className="p-3 bg-[var(--finova-bg-secondary)] rounded-xl border border-[var(--finova-border)] text-[11px] text-[var(--finova-text-muted)]">
            A unique 12-digit account number (starting with 4082) will be generated automatically.
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Freeze / Unfreeze */}
      <ConfirmationDialog
        isOpen={!!accountToToggle}
        onClose={() => setAccountToToggle(null)}
        onConfirm={confirmToggleStatus}
        isLoading={toggleLoading}
        title={accountToToggle?.status === 'Active' ? 'Freeze Account' : 'Unfreeze Account'}
        message={
          accountToToggle?.status === 'Active'
            ? `Are you sure you want to freeze account #${accountToToggle?.accountNumber}? Outgoing transfers and cash withdrawals will be blocked immediately.`
            : `Are you sure you want to restore active status for account #${accountToToggle?.accountNumber}?`
        }
        confirmText={accountToToggle?.status === 'Active' ? 'Yes, Freeze Account' : 'Yes, Unfreeze Account'}
        variant={accountToToggle?.status === 'Active' ? 'warning' : 'primary'}
      />
    </div>
  );
};

export default Accounts;
