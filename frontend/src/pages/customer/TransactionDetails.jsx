import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import transactionService from '../../services/transactionService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import {
  Receipt,
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Printer,
  Share2,
  Calendar,
  Wallet,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const TransactionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        setIsLoading(true);
        setError('');
        const data = await transactionService.getTransactionById(id);
        setTransaction(data.transaction);
      } catch (err) {
        setError(err.message || 'Transaction not found or access denied.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader size="lg" label="Retrieving transaction voucher..." />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error || 'Transaction not found.'}
        </div>
        <Link to="/transactions">
          <Button variant="primary" icon={ArrowLeft}>
            Back to Transaction History
          </Button>
        </Link>
      </div>
    );
  }

  const isDeposit = transaction.type === 'DEPOSIT';
  const isWithdraw = transaction.type === 'WITHDRAW';
  const isTransfer = transaction.type === 'TRANSFER';

  const TypeIcon = isDeposit ? ArrowDownLeft : isWithdraw ? ArrowUpRight : ArrowLeftRight;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/transactions"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Transaction History</span>
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint}>
            Print Voucher
          </Button>
        </div>
      </div>

      {/* Main Voucher Card */}
      <Card className="border-2 border-slate-200/90 shadow-xl overflow-hidden print:border-none print:shadow-none">
        {/* Voucher Header */}
        <div
          className={`p-6 sm:p-8 text-white text-center ${
            isDeposit
              ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
              : isTransfer
              ? 'bg-gradient-to-r from-brand-700 to-slate-900'
              : 'bg-gradient-to-r from-slate-900 to-slate-800'
          }`}
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs text-white mb-3">
            <TypeIcon className="h-7 w-7" />
          </div>

          <span className="text-xs font-bold uppercase tracking-widest text-white/80">
            {transaction.type} VOUCHER
          </span>

          <div className="text-3xl sm:text-4xl font-black text-white mt-1">
            {isDeposit ? '+' : '-'}{formatCurrency(transaction.amount)}
          </div>

          <div className="mt-2 flex items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase ${
                transaction.status === 'COMPLETED'
                  ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/30'
                  : 'bg-amber-500/30 text-amber-100 border border-amber-400/30'
              }`}
            >
              {transaction.status === 'COMPLETED' && <CheckCircle2 className="h-3 w-3" />}
              <span>{transaction.status}</span>
            </span>
          </div>
        </div>

        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Transaction ID & Copy */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Official Transaction Identifier
              </span>
              <span className="font-mono text-sm font-bold text-slate-900">
                {transaction.transactionId}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopy(transaction.transactionId)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors"
              title="Copy ID"
            >
              <Copy className="h-4 w-4" />
            </button>
            {copiedId && <span className="text-xs text-emerald-600 font-bold">Copied!</span>}
          </div>

          {/* Key Attributes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Debited Account</span>
              <p className="font-mono font-bold text-slate-900 text-sm">
                {transaction.senderAccount}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Credited Account</span>
              <p className="font-mono font-bold text-slate-900 text-sm">
                {transaction.receiverAccount}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Balance After Settlement</span>
              <p className="font-extrabold text-emerald-600 text-sm">
                {formatCurrency(transaction.balanceAfter || 0)}
              </p>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-100 shadow-2xs space-y-1">
              <span className="text-slate-400 uppercase font-bold text-[10px]">Reference Code</span>
              <p className="font-mono font-bold text-slate-800 text-xs">
                {transaction.reference || 'N/A'}
              </p>
            </div>
          </div>

          {/* Description / Memo */}
          {transaction.description && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Transaction Purpose / Description
              </span>
              <p className="text-xs font-semibold text-slate-800">
                {transaction.description}
              </p>
            </div>
          )}

          {/* Execution Timestamp */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>Timestamp:</span>
            </span>
            <span className="font-semibold text-slate-800">
              {new Date(transaction.createdAt).toLocaleString()}
            </span>
          </div>

          {/* Security Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2.5 text-[11px] text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>This is an official immutable cryptographic ledger record from Finova.</span>
          </div>

          {/* Bottom Actions */}
          <div className="flex gap-3 pt-2 print:hidden">
            <Link to="/transactions" className="flex-1">
              <Button variant="outline" className="w-full" icon={ArrowLeft}>
                Back to All
              </Button>
            </Link>
            <Link to="/transfer" className="flex-1">
              <Button variant="primary" className="w-full" icon={ArrowLeftRight}>
                New Transfer
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionDetails;
