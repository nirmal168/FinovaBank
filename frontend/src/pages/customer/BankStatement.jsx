import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import transactionService from '../../services/transactionService';
import accountService from '../../services/accountService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  Building2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatAmount } from '../../utils/currency';
import finovaShield from '../../assets/finova-shield.png';

const PRESET_RANGES = [
  { label: 'Last 30 Days', days: 30 },
  { label: 'Current Month', days: 'current_month' },
  { label: 'Last 3 Months', days: 90 },
  { label: 'Financial Year (YTD)', days: 'fy' },
  { label: 'Custom Range', days: 'custom' },
];

const BankStatement = () => {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();
  const printRef = useRef(null);

  // Filter states
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountNum, setSelectedAccountNum] = useState('');
  const [activePreset, setActivePreset] = useState('Last 30 Days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [txType, setTxType] = useState('ALL');

  // Statement data state
  const [statementData, setStatementData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  const [error, setError] = useState('');

  // Compute dates based on preset
  const applyPreset = (presetName) => {
    setActivePreset(presetName);
    const now = new Date();
    const end = new Date();

    if (presetName === 'Last 30 Days') {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (presetName === 'Current Month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (presetName === 'Last 3 Months') {
      const start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else if (presetName === 'Financial Year (YTD)') {
      // Indian FY starts April 1st
      const currentYear = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
      const start = new Date(currentYear, 3, 1);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  // Initial load: Fetch accounts and set initial 30 days
  useEffect(() => {
    const init = async () => {
      try {
        const accData = await accountService.getAccounts();
        const userAccounts = accData.accounts || [];
        setAccounts(userAccounts);

        const paramAcc = searchParams.get('accountNumber');
        if (paramAcc && userAccounts.some((a) => a.accountNumber === paramAcc)) {
          setSelectedAccountNum(paramAcc);
        } else if (userAccounts.length > 0) {
          setSelectedAccountNum(userAccounts[0].accountNumber);
        }

        // Default 30 days
        const now = new Date();
        const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        setStartDate(start.toISOString().split('T')[0]);
        setEndDate(now.toISOString().split('T')[0]);
      } catch (err) {
        setError('Failed to load bank accounts');
      }
    };
    init();
  }, []);

  // Fetch statement whenever parameters change or button is clicked
  const fetchStatement = async () => {
    if (!startDate || !endDate) return;
    try {
      setIsLoading(true);
      setError('');
      const params = {
        startDate,
        endDate,
        type: txType,
      };
      if (selectedAccountNum) {
        params.accountNumber = selectedAccountNum;
      }

      const res = await transactionService.getStatement(params);
      if (res.success) {
        setStatementData(res.data);
      } else {
        setError(res.message || 'Unable to retrieve statement');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching bank statement');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (startDate && endDate) {
      fetchStatement();
    }
  }, [selectedAccountNum, startDate, endDate, txType]);

  // Handler: Export CSV
  const handleDownloadCSV = () => {
    if (!statementData || !statementData.transactions) {
      showToast('No statement data available to download', 'warning');
      return;
    }

    try {
      setIsDownloadingCSV(true);
      const acc = statementData.account;
      const user = statementData.user;
      const txs = statementData.transactions;

      const headers = [
        'Transaction ID',
        'Date & Time',
        'Type',
        'Particulars / Description',
        'Debit (INR)',
        'Credit (INR)',
        'Status',
        'Reference No',
      ];

      const rows = txs.map((tx) => [
        `"${tx.transactionId || ''}"`,
        `"${new Date(tx.createdAt).toLocaleString('en-IN')}"`,
        `"${tx.type || ''}"`,
        `"${(tx.description || '').replace(/"/g, '""')}"`,
        tx.isDebit ? tx.amount.toFixed(2) : '0.00',
        tx.isCredit ? tx.amount.toFixed(2) : '0.00',
        `"${tx.status || ''}"`,
        `"${tx.reference || ''}"`,
      ]);

      // Meta header rows
      const metaRows = [
        `"FINOVA BANK - OFFICIAL ACCOUNT STATEMENT"`,
        `"Account Holder","${user?.name || ''}"`,
        `"Account Number","'${acc?.accountNumber || ''}"`,
        `"Account Type","${acc?.accountType || 'Savings'}"`,
        `"IFSC Code","${acc?.ifscCode || 'FINV0001088'}"`,
        `"Statement Period","${new Date(statementData.period.startDate).toLocaleDateString('en-IN')} to ${new Date(statementData.period.endDate).toLocaleDateString('en-IN')}"`,
        `"Total Credits","${statementData.summary.totalCredits.toFixed(2)}"`,
        `"Total Debits","${statementData.summary.totalDebits.toFixed(2)}"`,
        `"Net Flow","${statementData.summary.netFlow.toFixed(2)}"`,
        `"Current Balance","${acc?.currentBalance?.toFixed(2) || '0.00'}"`,
        `""`,
        headers.join(','),
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + metaRows.concat(rows.map((e) => e.join(','))).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Finova_Statement_${acc?.accountNumber || 'Account'}_${startDate}_to_${endDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Bank statement downloaded as CSV spreadsheet.', 'success');
    } catch (err) {
      showToast('Failed to export statement as CSV', 'error');
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  // Handler: Print / Save as PDF
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Screen-Only Controls & Header */}
      <div className="print:hidden space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[var(--finova-text-heading)] flex items-center gap-2.5">
              <FileText className="h-6 w-6 text-[var(--finova-sage)]" />
              <span>Bank Statement</span>
            </h1>
            <p className="text-xs text-[var(--finova-text-secondary)] mt-1">
              Generate, verify, and download official certified statements of your account ledger
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              icon={Printer}
              onClick={handlePrintPDF}
              disabled={isLoading || !statementData}
            >
              Print / Save PDF
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Download}
              onClick={handleDownloadCSV}
              isLoading={isDownloadingCSV}
              disabled={isLoading || !statementData}
            >
              Download CSV
            </Button>
          </div>
        </div>

        {/* Filter / Customization Panel */}
        <Card className="p-5 border border-[var(--finova-border)] bg-[var(--finova-card-bg)]">
          <div className="space-y-4">
            {/* Account & Preset Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Account Dropdown */}
              <div>
                <label className="block text-xs font-bold text-[var(--finova-text-secondary)] mb-1.5 uppercase tracking-wider">
                  Select Account
                </label>
                <select
                  value={selectedAccountNum}
                  onChange={(e) => setSelectedAccountNum(e.target.value)}
                  className="w-full text-xs font-medium bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl px-3 py-2.5 text-[var(--finova-text-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--finova-sage)]"
                >
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc.accountNumber}>
                      {acc.accountType} - #{acc.accountNumber} ({formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction Type Filter */}
              <div>
                <label className="block text-xs font-bold text-[var(--finova-text-secondary)] mb-1.5 uppercase tracking-wider">
                  Transaction Type
                </label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                  className="w-full text-xs font-medium bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl px-3 py-2.5 text-[var(--finova-text-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--finova-sage)]"
                >
                  <option value="ALL">All Transactions (Debits & Credits)</option>
                  <option value="DEPOSIT">Deposits & Credits (+)</option>
                  <option value="WITHDRAW">Withdrawals & Debits (-)</option>
                  <option value="TRANSFER">Transfers</option>
                </select>
              </div>

              {/* Refresh Button */}
              <div className="flex items-end h-full">
                <Button
                  variant="outline"
                  size="md"
                  icon={RefreshCw}
                  onClick={fetchStatement}
                  isLoading={isLoading}
                  className="w-full"
                >
                  Update Statement
                </Button>
              </div>
            </div>

            {/* Quick Presets & Date Inputs */}
            <div className="pt-3 border-t border-[var(--finova-border)] space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[var(--finova-text-secondary)] mr-1">Period:</span>
                {PRESET_RANGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => applyPreset(preset.label)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      activePreset === preset.label
                        ? 'bg-[var(--finova-mint)] text-[var(--finova-text-heading)] border border-[var(--finova-sage)]/40'
                        : 'bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] border border-[var(--finova-border)]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--finova-text-secondary)] mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setActivePreset('Custom Range');
                    }}
                    className="w-full text-xs font-medium bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl px-3 py-2 text-[var(--finova-text-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--finova-sage)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-[var(--finova-text-secondary)] mb-1">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setActivePreset('Custom Range');
                    }}
                    className="w-full text-xs font-medium bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl px-3 py-2 text-[var(--finova-text-heading)] focus:outline-none focus:ring-2 focus:ring-[var(--finova-sage)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Summary Metric Cards */}
        {statementData && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 border border-[var(--finova-border)] bg-[var(--finova-card-bg)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--finova-text-secondary)] uppercase tracking-wider">
                  Total Credits
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                  <ArrowDownLeft className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xl font-black text-emerald-600">
                +{formatCurrency(statementData.summary.totalCredits)}
              </p>
              <p className="text-[11px] text-[var(--finova-text-secondary)] mt-0.5">
                {statementData.summary.creditCount} transactions
              </p>
            </Card>

            <Card className="p-4 border border-[var(--finova-border)] bg-[var(--finova-card-bg)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--finova-text-secondary)] uppercase tracking-wider">
                  Total Debits
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xl font-black text-rose-600">
                -{formatCurrency(statementData.summary.totalDebits)}
              </p>
              <p className="text-[11px] text-[var(--finova-text-secondary)] mt-0.5">
                {statementData.summary.debitCount} transactions
              </p>
            </Card>

            <Card className="p-4 border border-[var(--finova-border)] bg-[var(--finova-card-bg)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--finova-text-secondary)] uppercase tracking-wider">
                  Net Flow
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--finova-mint)] text-[var(--finova-text-heading)]">
                  <RefreshCw className="h-4 w-4" />
                </span>
              </div>
              <p
                className={`mt-2 text-xl font-black ${
                  statementData.summary.netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {statementData.summary.netFlow >= 0 ? '+' : ''}
                {formatCurrency(statementData.summary.netFlow)}
              </p>
              <p className="text-[11px] text-[var(--finova-text-secondary)] mt-0.5">Period Net Position</p>
            </Card>

            <Card className="p-4 border border-[var(--finova-border)] bg-[var(--finova-card-bg)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--finova-text-secondary)] uppercase tracking-wider">
                  Closing Balance
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                  <Wallet className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 text-xl font-black text-[var(--finova-text-heading)]">
                {formatCurrency(statementData.summary.closingBalance)}
              </p>
              <p className="text-[11px] text-[var(--finova-text-secondary)] mt-0.5">Live cleared balance</p>
            </Card>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {isLoading ? (
        <div className="py-20 flex justify-center print:hidden">
          <Loader size="lg" label="Generating official statement ledger..." />
        </div>
      ) : error ? (
        <Card className="p-6 text-center border-rose-200 bg-rose-50/50 print:hidden">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-rose-700">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchStatement} className="mt-4">
            Try Again
          </Button>
        </Card>
      ) : !statementData ? null : (
        /* OFFICIAL FORMAL BANK STATEMENT DOCUMENT PREVIEW */
        <div
          ref={printRef}
          className="bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] rounded-2xl border border-[var(--finova-border)] shadow-xs p-6 sm:p-8 space-y-6 print:shadow-none print:border-none print:p-0 print:m-0 print:bg-white print:text-slate-900"
        >
          {/* Bank Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-[var(--finova-border)] print:border-slate-300">
            <div className="flex items-center gap-3">
              <img src={finovaShield} alt="Finova" className="h-12 w-auto object-contain" />
              <div>
                <h2 className="font-black text-2xl tracking-tight text-[var(--finova-text-heading)] print:text-slate-950">
                  FINOVA BANK
                </h2>
                <p className="text-xs font-semibold text-[var(--finova-text-secondary)] print:text-slate-600">
                  Smart Banking. Smarter Future.
                </p>
                <p className="text-[10px] text-[var(--finova-text-secondary)] print:text-slate-500 mt-1">
                  Licensed by Reserve Bank of India • Central Banking Division
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs text-[var(--finova-text-secondary)] print:text-slate-600 space-y-1">
              <p className="font-bold text-[var(--finova-text-heading)] print:text-slate-900">
                Finova Towers, Financial District
              </p>
              <p>Connaught Place, New Delhi - 110001</p>
              <p>
                IFSC: <span className="font-mono font-bold">{statementData.account.ifscCode}</span>
              </p>
              <p>Email: statements@finovabank.com | Helpline: 1800-FINOVA-BK</p>
            </div>
          </div>

          {/* Statement Meta & Customer Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] print:bg-slate-50 print:border-slate-200">
            {/* Customer Box */}
            <div className="space-y-1.5 text-xs">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-secondary)] print:text-slate-500">
                Account Holder Information
              </p>
              <p className="font-bold text-sm text-[var(--finova-text-heading)] print:text-slate-900">
                {statementData.user.name}
              </p>
              <p className="text-[var(--finova-text-secondary)] print:text-slate-600">
                Customer ID: <span className="font-mono font-semibold">{statementData.user.customerId || 'N/A'}</span>
              </p>
              <p className="text-[var(--finova-text-secondary)] print:text-slate-600">
                Email: {statementData.user.email}
              </p>
              {statementData.user.phone && (
                <p className="text-[var(--finova-text-secondary)] print:text-slate-600">
                  Phone: {statementData.user.phone}
                </p>
              )}
            </div>

            {/* Account Details Box */}
            <div className="space-y-1.5 text-xs sm:text-right">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-secondary)] print:text-slate-500">
                Statement Parameters
              </p>
              <p className="text-[var(--finova-text-secondary)] print:text-slate-600">
                Account No:{' '}
                <span className="font-mono font-bold text-sm text-[var(--finova-text-heading)] print:text-slate-900">
                  {statementData.account.accountNumber}
                </span>
              </p>
              <p className="text-[var(--finova-text-secondary)] print:text-slate-600">
                Account Type: <span className="font-semibold">{statementData.account.accountType} Account</span>
              </p>
              <p className="text-[var(--finova-text-secondary)] print:text-slate-600">
                Period:{' '}
                <span className="font-semibold">
                  {new Date(statementData.period.startDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  to{' '}
                  {new Date(statementData.period.endDate).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </p>
              <p className="text-[var(--finova-text-secondary)] print:text-slate-600">
                Statement Date:{' '}
                <span className="font-semibold">
                  {new Date().toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </p>
            </div>
          </div>

          {/* Account Ledger Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center border-y border-[var(--finova-border)] py-4 print:border-slate-300">
            <div>
              <p className="text-[11px] font-bold uppercase text-[var(--finova-text-secondary)] print:text-slate-500">
                Total Deposits (+)
              </p>
              <p className="font-black text-sm text-emerald-600 mt-1">
                {formatCurrency(statementData.summary.totalCredits)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-[var(--finova-text-secondary)] print:text-slate-500">
                Total Withdrawals (-)
              </p>
              <p className="font-black text-sm text-rose-600 mt-1">
                {formatCurrency(statementData.summary.totalDebits)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-[var(--finova-text-secondary)] print:text-slate-500">
                Net Cash Flow
              </p>
              <p
                className={`font-black text-sm mt-1 ${
                  statementData.summary.netFlow >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {statementData.summary.netFlow >= 0 ? '+' : ''}
                {formatCurrency(statementData.summary.netFlow)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-[var(--finova-text-secondary)] print:text-slate-500">
                Closing Cleared Balance
              </p>
              <p className="font-black text-sm text-[var(--finova-text-heading)] print:text-slate-950 mt-1">
                {formatCurrency(statementData.summary.closingBalance)}
              </p>
            </div>
          </div>

          {/* Transactions Ledger Table */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--finova-text-secondary)] print:text-slate-700 mb-3">
              Transaction Details ({statementData.transactions.length} entries)
            </h3>

            {statementData.transactions.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-[var(--finova-border)] rounded-xl text-xs text-[var(--finova-text-secondary)] print:border-slate-300">
                No transactions recorded for the selected account during this date period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[var(--finova-border)] print:border-slate-400 text-[11px] font-bold uppercase text-[var(--finova-text-secondary)] print:text-slate-600">
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Transaction ID / Ref</th>
                      <th className="py-2.5 px-3">Particulars</th>
                      <th className="py-2.5 px-3 text-right">Debit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit (₹)</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--finova-border)] print:divide-slate-200 font-mono">
                    {statementData.transactions.map((tx) => (
                      <tr key={tx._id || tx.transactionId} className="hover:bg-[var(--finova-bg-secondary)]/50">
                        <td className="py-3 px-3 whitespace-nowrap text-[var(--finova-text-heading)] print:text-slate-800">
                          {new Date(tx.createdAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                          <span className="block text-[10px] text-[var(--finova-text-secondary)] print:text-slate-500 font-sans">
                            {new Date(tx.createdAt).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap text-[11px] text-[var(--finova-text-secondary)] print:text-slate-600">
                          <span className="font-bold text-[var(--finova-text-heading)] print:text-slate-900 block">
                            {tx.transactionId}
                          </span>
                          {tx.reference && <span className="text-[10px] text-[var(--finova-text-secondary)]">Ref: {tx.reference}</span>}
                        </td>
                        <td className="py-3 px-3 max-w-xs font-sans text-xs text-[var(--finova-text-heading)] print:text-slate-800">
                          <p className="font-medium truncate">{tx.description || tx.type}</p>
                          <span className="text-[10px] uppercase font-bold text-[var(--finova-text-secondary)]">
                            {tx.type}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-rose-600 print:text-rose-700">
                          {tx.isDebit ? `${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-bold text-emerald-600 print:text-emerald-700">
                          {tx.isCredit ? `${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap font-sans">
                          <span
                            className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                              tx.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : tx.status === 'PENDING'
                                ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Formal Banking Declaration Footer */}
          <div className="pt-6 border-t border-[var(--finova-border)] print:border-slate-300 space-y-3">
            <div className="p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] print:bg-slate-50 print:border-slate-200 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-[var(--finova-sage)] print:text-slate-700 shrink-0 mt-0.5" />
              <div className="text-[11px] text-[var(--finova-text-secondary)] print:text-slate-600 space-y-1">
                <p className="font-bold text-[var(--finova-text-heading)] print:text-slate-900">
                  Certified Electronic Bank Statement
                </p>
                <p>
                  This is a computer-generated bank statement issued under the Digital Signature & Information
                  Technology Act and does not require an ink signature. Transactions reflected are subject to final
                  reconciliation and verification.
                </p>
                <p>
                  For reporting unauthorized transactions or inquiries, reach out to 24/7 Finova Customer Care at{' '}
                  <span className="font-bold">1800-FINOVA-BK (1800-346-682)</span> or email{' '}
                  <span className="font-bold">support@finovabank.com</span>.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between text-[10px] text-[var(--finova-text-secondary)] print:text-slate-500 pt-2">
              <p>© {new Date().getFullYear()} Finova Bank Ltd. All Rights Reserved. Regulated by Reserve Bank of India.</p>
              <p>Statement Hash Ref: FINV-STMT-{statementData.account.accountNumber.slice(-4)}-{Date.now()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Screen-only Print CSS helper */}
      <style>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
          /* Hide non-printable UI elements */
          nav, aside, header, footer, .print\\:hidden {
            display: none !important;
          }
          /* Ensure printable container takes full width */
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

export default BankStatement;
