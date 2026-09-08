import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import accountService from '../../services/accountService';
import transactionService from '../../services/transactionService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import ConfirmationDialog from '../../components/ui/ConfirmationDialog';
import { useToast } from '../../context/ToastContext';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import {
  Wallet,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  Snowflake,
  Play,
  Copy,
  CheckCircle2,
  AlertCircle,
  Calendar,
  ShieldCheck,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { formatCurrency, formatAmount } from '../../utils/currency';

const AccountDetails = () => {
  const { showToast } = useToast();
  const { id } = useParams();
  const navigate = useNavigate();

  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);

  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await accountService.getAccountById(id);
      setAccount(data.account);

      // Fetch transaction history
      const hist = await transactionService.getHistory(50);
      if (hist?.transactions) {
        // Filter transactions for this specific account
        const accTxns = hist.transactions.filter(
          (t) =>
            t.receiverAccount === data.account.accountNumber ||
            t.senderAccount === data.account.accountNumber
        );
        setTransactions(accTxns);
      }
    } catch (err) {
      setError(err.message || 'Failed to load account details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountData();
  }, [id]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const confirmToggleFreeze = async () => {
    if (!account) return;
    const nextStatus = account.status === 'Active' ? 'Frozen' : 'Active';

    setIsUpdatingStatus(true);
    try {
      const data = await accountService.updateAccountStatus(account._id, nextStatus);
      setAccount(data.account);
      showToast(`Account ${account.accountNumber} is now ${nextStatus}.`, 'success');
      setIsFreezeModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to update account status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader size="lg" label="Loading account details..." />
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error || 'Account not found.'}
        </div>
        <Link to="/accounts">
          <Button variant="primary" icon={ArrowLeft}>
            Back to Accounts
          </Button>
        </Link>
      </div>
    );
  }

  const isFrozen = account.status === 'Frozen';
  const isClosed = account.status === 'Closed';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Back Navigation */}
      <div>
        <Link
          to="/accounts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Accounts</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {account.accountType} Account
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  account.status === 'Active'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : isFrozen
                    ? 'bg-cyan-50 text-cyan-700 border border-cyan-300'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {isFrozen && <Snowflake className="h-3 w-3" />}
                {account.status === 'Active' && <CheckCircle2 className="h-3 w-3" />}
                <span>{account.status}</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Account identifier: <span className="font-mono font-semibold">{account.accountNumber}</span>
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant={isFrozen ? 'success' : 'outline'}
              size="sm"
              icon={isFrozen ? Play : Snowflake}
              onClick={() => setIsFreezeModalOpen(true)}
              isLoading={isUpdatingStatus}
              disabled={isClosed}
            >
              {isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
            </Button>

            <Link to="/deposit">
              <Button variant="primary" size="sm" icon={ArrowDownLeft} className="!bg-emerald-600 hover:!bg-emerald-700">
                Deposit
              </Button>
            </Link>

            <Link to="/withdraw">
              <Button variant="outline" size="sm" icon={ArrowUpRight} disabled={isFrozen || isClosed}>
                Withdraw
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Balance Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available Ledger Balance
          </span>
          <div className="text-3xl sm:text-4xl font-black text-white mt-1">
            {formatCurrency(account.balance)}
            <span className="text-sm font-normal text-slate-400 ml-1.5">({account.currency || 'INR'})</span>
          </div>
          <p className="text-xs text-slate-300 mt-1.5 flex items-center gap-2">
            <span>Daily Outgoing Limit: {formatCurrency(account.dailyTransferLimit || 50000)}</span>
            <span>•</span>
            <span>256-bit Encrypted</span>
          </p>
        </div>

        {/* Account Number Box */}
        <div className="p-3 bg-white/10 backdrop-blur-xs rounded-xl border border-white/10 flex items-center gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Official Account Number
            </span>
            <span className="font-mono text-sm font-black tracking-widest text-white">
              {account.accountNumber}
            </span>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(account.accountNumber)}
            className="p-1.5 text-slate-300 hover:text-white rounded hover:bg-white/10 transition-colors"
            title="Copy Account Number"
          >
            <Copy className="h-4 w-4" />
          </button>
          {copied && <span className="text-[10px] text-emerald-400 font-bold">Copied!</span>}
        </div>
      </div>

      {/* Grid: Account Specs + Security */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-5">
          <CardHeader className="p-0 pb-3 border-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Type</span>
            <CardTitle className="text-lg text-slate-900 mt-1">{account.accountType}</CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs text-slate-500">
            {account.accountType === 'Savings'
              ? 'High interest wealth accumulation account.'
              : 'Flexible checking account for commercial and domestic transfers.'}
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="p-0 pb-3 border-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Transfer Limit</span>
            <CardTitle className="text-lg text-slate-900 mt-1">
              {formatCurrency(account.dailyTransferLimit || 50000)} / Day
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs text-slate-500">
            Max limit protected by 2-factor authorization.
          </CardContent>
        </Card>

        <Card className="p-5">
          <CardHeader className="p-0 pb-3 border-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Age</span>
            <CardTitle className="text-lg text-slate-900 mt-1">
              {new Date(account.createdAt).toLocaleDateString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 text-xs text-slate-500">
            Provisioned and verified under banking license.
          </CardContent>
        </Card>
      </div>

      {/* Account Transactions History */}
      <div className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-brand-600" />
          <span>Transactions for this Account</span>
        </h2>

        {transactions.length === 0 ? (
          <Card className="text-center py-8 p-4">
            <CardContent className="space-y-2">
              <Receipt className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-xs font-semibold text-slate-700">No transactions recorded yet</p>
              <p className="text-[11px] text-slate-400">
                Deposit or withdraw funds to see transaction records here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx._id || tx.transactionId}>
                  <TableCell className="font-mono text-xs font-semibold text-slate-800">
                    {tx.transactionId}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-slate-700">
                    {tx.description || tx.type}
                  </TableCell>
                  <TableCell className="text-xs text-slate-500">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className={`text-right font-bold text-xs ${
                    tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-slate-800'
                  }`}>
                    {tx.type === 'DEPOSIT' ? `+$${tx.amount.toFixed(2)}` : `-$${tx.amount.toFixed(2)}`}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        tx.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Confirmation Dialog for Freeze / Unfreeze */}
      <ConfirmationDialog
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        onConfirm={confirmToggleFreeze}
        isLoading={isUpdatingStatus}
        title={isFrozen ? 'Unfreeze Account' : 'Freeze Account'}
        message={
          isFrozen
            ? `Are you sure you want to unfreeze account #${account?.accountNumber}? Outgoing transactions will be restored.`
            : `Are you sure you want to freeze account #${account?.accountNumber}? Outgoing transfers and cash withdrawals will be blocked immediately.`
        }
        confirmText={isFrozen ? 'Yes, Unfreeze Account' : 'Yes, Freeze Account'}
        variant={isFrozen ? 'primary' : 'warning'}
      />
    </div>
  );
};

export default AccountDetails;
