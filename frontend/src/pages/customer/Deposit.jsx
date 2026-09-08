import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import transactionService from '../../services/transactionService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import {
  ArrowDownLeft,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Copy,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Receipt,
  FileText,
} from 'lucide-react';

import { formatCurrency } from '../../utils/currency';

const quickAmounts = [500, 1000, 2500, 5000, 10000];

const Deposit = () => {
  const [account, setAccount] = useState(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [copied, setCopied] = useState(false);

  // Fetch current account and live balance
  const fetchAccount = async () => {
    try {
      setIsLoadingAccount(true);
      setError('');
      const data = await transactionService.getAccount();
      setAccount(data.account);
    } catch (err) {
      setError(err.message || 'Failed to load account details.');
    } finally {
      setIsLoadingAccount(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, []);

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
    setError('');
  };

  const handleCopyTxn = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid deposit amount greater than ₹0.00.');
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await transactionService.deposit({
        amount: numericAmount,
        description: description.trim() || 'Online Cash Deposit',
      });

      // Set transaction receipt
      setReceipt(data.transaction);
      // Update local account balance state
      setAccount((prev) => ({
        ...prev,
        balance: data.transaction.balance,
      }));
      setAmount('');
      setDescription('');
    } catch (err) {
      setError(err.message || 'Deposit failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Deposit Funds
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Add money to your Finova checking account instantly with zero fees
        </p>
      </div>

      {/* Account Overview Bar */}
      <Card className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white p-6 shadow-md border-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Primary Account
              </span>
              <p className="font-mono text-sm font-semibold tracking-wider text-white">
                {account?.accountNumber || 'Loading...'}
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-xs text-slate-300">Available Balance:</span>
            <span className="text-2xl font-extrabold text-emerald-400">
              {isLoadingAccount ? '...' : formatCurrency(account?.balance || 0)}
            </span>
          </div>
        </div>
      </Card>

      {/* Main Container: Deposit Form OR Receipt */}
      {receipt ? (
        /* Transaction Receipt Card */
        <Card className="border-emerald-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-emerald-600 p-6 text-white text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-md">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="mt-3 text-xl font-extrabold">Deposit Confirmed!</h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              Your funds have been deposited and credited immediately to your balance.
            </p>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-6">
            {/* Primary Metrics Highlight */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Amount Deposited
                </span>
                <div className="text-2xl font-black text-emerald-700">
                  +{formatCurrency(receipt.amount)}
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Updated Live Balance
                </span>
                <div className="text-2xl font-black text-slate-900">
                  {formatCurrency(receipt.balance)}
                </div>
              </div>
            </div>

            {/* Receipt Table */}
            <div className="divide-y divide-slate-100 border-t border-b border-slate-100 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500">Transaction ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-900">{receipt.transactionId}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyTxn(receipt.transactionId)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                    title="Copy Transaction ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {copied && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                </div>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500">Date & Timestamp</span>
                <span className="font-medium text-slate-800">
                  {new Date(receipt.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500">Target Account</span>
                <span className="font-mono font-medium text-slate-800">
                  {receipt.accountNumber} (Checking)
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500">Status</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>{receipt.status}</span>
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500">Description</span>
                <span className="text-slate-800 font-medium">{receipt.description}</span>
              </div>

              {receipt.reference && (
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-500">Reference</span>
                  <span className="font-mono text-slate-600">{receipt.reference}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                className="flex-1"
                icon={RefreshCw}
                onClick={() => setReceipt(null)}
              >
                Make Another Deposit
              </Button>

              <Link to="/" className="flex-1">
                <Button variant="outline" className="w-full" icon={ArrowRight} iconPosition="right">
                  Return to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Deposit Form */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form Card (2 cols) */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowDownLeft className="h-5 w-5 text-emerald-600" />
                  <span>Deposit Parameters</span>
                </CardTitle>
                <CardDescription>
                  Enter the amount you would like to deposit into your account
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {error && (
                  <div className="flex items-center gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Quick Select Buttons */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-2">
                      Quick Amount Selector
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {quickAmounts.map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleQuickAmount(val)}
                          className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${
                            amount === val.toString()
                              ? 'bg-brand-50 border-brand-500 text-brand-700 shadow-xs'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          +₹{val.toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <Input
                    label="Deposit Amount (₹ INR)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    leftIcon={Wallet}
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setError('');
                    }}
                    required
                  />

                  {/* Description Input */}
                  <Input
                    label="Description / Purpose (Optional)"
                    placeholder="e.g. Salary, Client payment, Savings"
                    leftIcon={FileText}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    icon={ArrowDownLeft}
                    isLoading={isSubmitting}
                  >
                    Confirm & Deposit Funds
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Security & Info (1 col) */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Deposit Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Instant balance credit with zero hold period.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Permanent audit record with unique Transaction ID.</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
                  <span>Bank-grade encryption protecting all simulated ledger balance changes.</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-50 border-dashed">
              <CardContent className="p-4 text-center">
                <p className="text-xs font-bold text-slate-700">Need to withdraw instead?</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Quickly access cash or transfer out</p>
                <div className="mt-3">
                  <Link to="/withdraw">
                    <Button variant="outline" size="sm" className="w-full">
                      Go to Withdrawal
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deposit;
