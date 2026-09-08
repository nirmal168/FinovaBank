import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import transactionService from '../../services/transactionService';
import accountService from '../../services/accountService';
import beneficiaryService from '../../services/beneficiaryService';
import { useAuth } from '../../context/AuthContext';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import OtpModal from '../../components/ui/OtpModal';
import {
  ArrowLeftRight,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Wallet,
  Copy,
  Receipt,
  RotateCcw,
  Sparkles,
  ArrowDownLeft,
  UserCheck,
  Building,
  Users,
} from 'lucide-react';

import { formatCurrency } from '../../utils/currency';

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

const Transfer = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Accounts state
  const [userAccounts, setUserAccounts] = useState([]);
  const [selectedSenderAccount, setSelectedSenderAccount] = useState(null);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);

  // Beneficiaries state
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(false);
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState('');

  // Transfer form state
  const [receiverAccountNumber, setReceiverAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');

  // Receiver verification state
  const [isSearchingReceiver, setIsSearchingReceiver] = useState(false);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [receiverError, setReceiverError] = useState('');

  // Confirmation modal & submission state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  // OTP Verification state for large transfers
  const { user } = useAuth();
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [pendingTransferPayload, setPendingTransferPayload] = useState(null);

  // Success receipt state
  const [transferReceipt, setTransferReceipt] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  // Load user's accounts
  const loadAccounts = async () => {
    try {
      setIsLoadingAccounts(true);
      const res = await accountService.getAccounts();
      if (res?.accounts?.length) {
        setUserAccounts(res.accounts);
        // Default to first active account
        const activeAcc = res.accounts.find((a) => a.status === 'Active') || res.accounts[0];
        setSelectedSenderAccount(activeAcc);
      }
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  // Load saved active beneficiaries
  const loadBeneficiaries = async () => {
    try {
      setIsLoadingBeneficiaries(true);
      const res = await beneficiaryService.getBeneficiaries({ status: 'Active' });
      if (res?.beneficiaries) {
        setBeneficiaries(res.beneficiaries);
      }
    } catch (err) {
      console.error('Failed to load beneficiaries:', err);
    } finally {
      setIsLoadingBeneficiaries(false);
    }
  };

  useEffect(() => {
    loadAccounts();
    loadBeneficiaries();
  }, []);

  // Handle receiver account search / verification
  const handleVerifyReceiver = async (numToVerify) => {
    const targetNum = (numToVerify !== undefined ? numToVerify : receiverAccountNumber).trim();
    if (!targetNum) {
      setReceiverInfo(null);
      setReceiverError('');
      return;
    }

    if (selectedSenderAccount && targetNum === selectedSenderAccount.accountNumber) {
      setReceiverError('Cannot transfer to the same account. Please choose a different recipient.');
      setReceiverInfo(null);
      return;
    }

    try {
      setIsSearchingReceiver(true);
      setReceiverError('');
      const data = await transactionService.lookupReceiver(targetNum);
      if (data.account.isSelf && data.account.accountNumber === selectedSenderAccount?.accountNumber) {
        setReceiverError('Cannot transfer to the same sender account.');
        setReceiverInfo(null);
      } else if (data.account.status !== 'Active') {
        setReceiverError(`Recipient account is ${data.account.status.toLowerCase()} and cannot receive funds.`);
        setReceiverInfo(null);
      } else {
        setReceiverInfo(data.account);
      }
    } catch (err) {
      setReceiverInfo(null);
      setReceiverError(err.message || 'Recipient account not found.');
    } finally {
      setIsSearchingReceiver(false);
    }
  };

  // Pre-fill receiver from URL search params (e.g. redirected from Beneficiaries page)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const receiverParam = params.get('receiver');
    if (receiverParam) {
      setReceiverAccountNumber(receiverParam);
      handleVerifyReceiver(receiverParam);
      // Check if it matches any saved beneficiary
      const match = beneficiaries.find((b) => b.accountNumber === receiverParam);
      if (match) setSelectedBeneficiaryId(match._id);
    }
  }, [location.search, beneficiaries]);

  const handleSelectBeneficiary = (beneficiary) => {
    if (!beneficiary) {
      setSelectedBeneficiaryId('');
      setReceiverAccountNumber('');
      setReceiverInfo(null);
      setReceiverError('');
      return;
    }
    setSelectedBeneficiaryId(beneficiary._id);
    setReceiverAccountNumber(beneficiary.accountNumber);
    handleVerifyReceiver(beneficiary.accountNumber);
  };

  const handleReceiverBlur = () => {
    if (receiverAccountNumber.trim().length >= 8) {
      handleVerifyReceiver();
    }
  };

  const handleQuickAmount = (val) => {
    setAmount(val.toString());
  };

  const handleMaxBalance = () => {
    if (selectedSenderAccount) {
      const maxTransferrable = Math.min(
        selectedSenderAccount.balance,
        selectedSenderAccount.dailyTransferLimit || 50000
      );
      setAmount(maxTransferrable.toFixed(2));
    }
  };

  // Open confirmation modal after pre-checks
  const handleInitiateTransfer = (e) => {
    e.preventDefault();
    setSubmissionError('');

    const numericAmount = parseFloat(amount);
    if (!numericAmount || numericAmount <= 0) {
      setSubmissionError('Please enter a valid positive transfer amount.');
      return;
    }

    if (!selectedSenderAccount) {
      setSubmissionError('Please select an active sender account.');
      return;
    }

    if (numericAmount > selectedSenderAccount.balance) {
      setSubmissionError(
        `Insufficient funds. Available balance: ${formatCurrency(selectedSenderAccount.balance)}.`
      );
      return;
    }

    if (
      selectedSenderAccount.dailyTransferLimit &&
      numericAmount > selectedSenderAccount.dailyTransferLimit
    ) {
      setSubmissionError(
        `Amount exceeds your daily limit of ${formatCurrency(selectedSenderAccount.dailyTransferLimit)}.`
      );
      return;
    }

    if (!receiverAccountNumber.trim()) {
      setSubmissionError('Please provide a receiver account number.');
      return;
    }

    if (receiverAccountNumber.trim() === selectedSenderAccount.accountNumber) {
      setSubmissionError('Sender and receiver accounts must be different.');
      return;
    }

    // Open confirmation dialog
    setIsConfirmModalOpen(true);
  };

  // Execute atomic transfer (with OTP check for large transfers)
  const handleConfirmTransfer = async (otpCode = null) => {
    if (isSubmitting) return; // Strict guard against double submission
    setIsSubmitting(true);
    setSubmissionError('');
    setOtpError('');

    const payload = pendingTransferPayload || {
      senderAccountNumber: selectedSenderAccount.accountNumber,
      receiverAccountNumber: receiverAccountNumber.trim(),
      amount: parseFloat(amount),
      description: description.trim() || 'Account to Account Transfer',
      reference: reference.trim() || `REF-${Date.now()}`,
    };

    if (otpCode) {
      payload.otp = otpCode;
    }

    try {
      const res = await transactionService.transfer(payload);

      // Check if backend intercepted for OTP requirement
      if (res.requiresOtp) {
        setPendingTransferPayload(payload);
        setIsConfirmModalOpen(false);
        setIsOtpModalOpen(true);
        return;
      }

      // Update local sender balance
      setSelectedSenderAccount((prev) =>
        prev
          ? {
              ...prev,
              balance: res.transaction.balance,
            }
          : prev
      );

      setTransferReceipt(res.transaction);
      setIsConfirmModalOpen(false);
      setIsOtpModalOpen(false);
      setPendingTransferPayload(null);

      // Refresh accounts in background
      loadAccounts();
    } catch (err) {
      if (isOtpModalOpen) {
        setOtpError(err.message || 'Verification failed. Please check the code.');
      } else {
        setSubmissionError(err.message || 'Transfer failed. Please check the details and try again.');
        setIsConfirmModalOpen(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTransferReceipt(null);
    setAmount('');
    setDescription('');
    setReference('');
    setReceiverAccountNumber('');
    setSelectedBeneficiaryId('');
    setReceiverInfo(null);
    setReceiverError('');
    setSubmissionError('');
    loadAccounts();
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  if (isLoadingAccounts) {
    return (
      <div className="py-20 flex justify-center">
        <Loader size="lg" label="Initializing secure transfer session..." />
      </div>
    );
  }

  // 1. SUCCESS SCREEN / RECEIPT
  if (transferReceipt) {
    return (
      <div className="max-w-xl mx-auto py-6">
        <Card className="border-2 border-emerald-300 shadow-xl overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs text-white mb-3">
              <CheckCircle2 className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-2xl font-black tracking-tight">Transfer Completed!</h2>
            <p className="text-xs text-emerald-100 mt-1">
              Funds debited and credited atomically in real-time
            </p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Amount Banner */}
            <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Amount Transferred
              </span>
              <div className="text-3xl sm:text-4xl font-black text-slate-900 mt-1">
                -{formatCurrency(transferReceipt.amount)}
              </div>
              <span className="inline-flex items-center gap-1 mt-1 text-xs text-emerald-600 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Zero Transfer Fee</span>
              </span>
            </div>

            {/* Receipt Details Table */}
            <div className="space-y-3 divide-y divide-slate-100 text-xs">
              {/* Transaction ID */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-500">Transaction ID</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-slate-800">
                    {transferReceipt.transactionId}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(transferReceipt.transactionId)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
                    title="Copy Transaction ID"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  {copiedId && <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>}
                </div>
              </div>

              {/* Recipient */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500">Recipient</span>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{transferReceipt.receiverName}</p>
                  <p className="font-mono text-[11px] text-slate-500">
                    Acct: {transferReceipt.receiverAccount}
                  </p>
                </div>
              </div>

              {/* Sender Account */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500">Debited From</span>
                <span className="font-mono font-semibold text-slate-800">
                  {transferReceipt.senderAccount}
                </span>
              </div>

              {/* Updated Remaining Balance */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500">Updated Remaining Balance</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {formatCurrency(transferReceipt.balance)}
                </span>
              </div>

              {/* Description */}
              {transferReceipt.description && (
                <div className="flex items-center justify-between pt-3">
                  <span className="text-slate-500">Description / Memo</span>
                  <span className="font-medium text-slate-800 text-right max-w-xs truncate">
                    {transferReceipt.description}
                  </span>
                </div>
              )}

              {/* Date & Time */}
              <div className="flex items-center justify-between pt-3">
                <span className="text-slate-500">Execution Date</span>
                <span className="font-medium text-slate-700">
                  {new Date(transferReceipt.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="primary"
                className="flex-1"
                icon={RotateCcw}
                onClick={handleResetForm}
              >
                Transfer Again
              </Button>
              <Link to="/accounts" className="flex-1">
                <Button variant="outline" className="w-full" icon={Wallet}>
                  View Accounts
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. MAIN TRANSFER FORM SCREEN
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
          <ArrowLeftRight className="h-6 w-6 text-brand-600" />
          <span>Send Money Transfer</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Instant account-to-account funds transfer protected by 256-bit transactional security
        </p>
      </div>

      {/* Submission Error Banner */}
      {submissionError && (
        <div className="flex items-center gap-2.5 rounded-xl bg-rose-50 p-4 text-xs text-rose-700 border border-rose-200">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{submissionError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Transfer Form */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Transfer Parameters</CardTitle>
              <CardDescription>Specify the recipient and transfer amount</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <form onSubmit={handleInitiateTransfer} className="space-y-5">
                {/* 1. Source Account Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Source Account (Debit From)
                  </label>
                  {userAccounts.length > 1 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {userAccounts.map((acc) => {
                        const isSelected = selectedSenderAccount?._id === acc._id;
                        return (
                          <button
                            key={acc._id}
                            type="button"
                            onClick={() => {
                              setSelectedSenderAccount(acc);
                              setReceiverError('');
                            }}
                            className={`p-3.5 rounded-xl border text-left transition-all ${
                              isSelected
                                ? 'border-brand-600 bg-brand-50/50 shadow-xs'
                                : 'border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs text-slate-900">
                                {acc.accountType} Account
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  acc.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {acc.status}
                              </span>
                            </div>
                            <div className="font-mono text-xs text-slate-500 mt-1">
                              {acc.accountNumber}
                            </div>
                            <div className="text-sm font-extrabold text-slate-900 mt-1.5">
                              {formatCurrency(acc.balance)}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-brand-100 text-brand-700 flex items-center justify-center">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {selectedSenderAccount?.accountType || 'Primary'} Account
                          </p>
                          <p className="font-mono text-[11px] text-slate-500">
                            {selectedSenderAccount?.accountNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-bold text-slate-400">Available</p>
                        <p className="text-sm font-extrabold text-slate-900">
                          {formatCurrency(selectedSenderAccount?.balance ?? 1000)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Saved Beneficiary Selector */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-brand-600" />
                      Saved Payee / Beneficiary
                    </label>
                    <Link
                      to="/beneficiaries"
                      className="text-[11px] font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      Manage Payees →
                    </Link>
                  </div>
                  {beneficiaries.length > 0 ? (
                    <select
                      value={selectedBeneficiaryId}
                      onChange={(e) => {
                        const val = e.target.value;
                        const b = beneficiaries.find((item) => item._id === val);
                        handleSelectBeneficiary(b);
                      }}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-800 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    >
                      <option value="">-- Select a saved payee (or type account number below) --</option>
                      {beneficiaries.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name} {b.nickname ? `(${b.nickname})` : ''} • {b.bankName} • {b.accountNumber}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-[11px] text-slate-500">
                      No saved beneficiaries yet.{' '}
                      <Link to="/beneficiaries" className="text-brand-600 font-semibold hover:underline">
                        Add a beneficiary
                      </Link>{' '}
                      for quick 1-click transfers.
                    </p>
                  )}
                </div>

                {/* 2. Receiver Account Search / Input */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">
                    Receiver Account Number (12 Digits)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        placeholder="e.g. 408291104301"
                        value={receiverAccountNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          setReceiverAccountNumber(val);
                          if (val.length >= 8) {
                            handleVerifyReceiver(val);
                          } else {
                            setReceiverInfo(null);
                            setReceiverError('');
                          }
                        }}
                        onBlur={handleReceiverBlur}
                        maxLength={12}
                        className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-mono font-semibold transition-all focus:outline-none focus:ring-2 ${
                          receiverError
                            ? 'border-rose-300 focus:ring-rose-200'
                            : receiverInfo
                            ? 'border-emerald-400 focus:ring-emerald-100'
                            : 'border-slate-300 focus:border-brand-500 focus:ring-brand-100'
                        }`}
                        required
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      icon={Search}
                      onClick={() => handleVerifyReceiver()}
                      isLoading={isSearchingReceiver}
                    >
                      Verify
                    </Button>
                  </div>

                  {/* Receiver verification error alert */}
                  {receiverError && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                      <span>{receiverError}</span>
                    </div>
                  )}

                  {/* Receiver verified preview card */}
                  {receiverInfo && !receiverError && (
                    <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between transition-all">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <UserCheck className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900">
                              {receiverInfo.recipientName}
                            </span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded">
                              Verified
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {receiverInfo.accountType} Account • {receiverInfo.accountNumber}
                          </p>
                        </div>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    </div>
                  )}
                </div>

                {/* 3. Transfer Amount */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      Transfer Amount (₹ INR)
                    </label>
                    {selectedSenderAccount && (
                      <button
                        type="button"
                        onClick={handleMaxBalance}
                        className="text-[11px] font-bold text-brand-600 hover:text-brand-800 hover:underline"
                      >
                        Max: {formatCurrency(selectedSenderAccount.balance)}
                      </button>
                    )}
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 pl-8 pr-4 py-2.5 text-base font-extrabold text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all"
                      required
                    />
                  </div>

                  {/* Quick Amounts Selector */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {QUICK_AMOUNTS.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleQuickAmount(val)}
                        className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                          amount === val.toString()
                            ? 'bg-brand-600 text-white border-brand-600'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        +₹{val.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Description / Note */}
                <Input
                  label="Description / Purpose"
                  placeholder="e.g. Rent, Freelance Invoice, Birthday Gift"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  helperText="Optional memo visible to both sender and recipient."
                />

                {/* Submit Action */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  icon={ArrowRight}
                  iconPosition="right"
                  disabled={isSubmitting || !amount || !receiverAccountNumber}
                >
                  Review & Confirm Transfer
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Limits & Security Sidebar */}
        <div className="space-y-4">
          <Card className="bg-gradient-to-br from-slate-900 to-brand-950 text-white p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Source Account Balance
            </span>
            <div className="text-2xl font-black text-white mt-1">
              {formatCurrency(selectedSenderAccount?.balance ?? 0)}
              <span className="text-xs font-normal text-slate-400 ml-1">
                {selectedSenderAccount?.currency || 'INR'}
              </span>
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span>Daily Limit:</span>
                <span className="font-bold text-white">
                  {formatCurrency(selectedSenderAccount?.dailyTransferLimit || 50000)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Transfer Fee:</span>
                <span className="font-bold text-emerald-400">FREE (₹0.00)</span>
              </div>
              <div className="flex justify-between">
                <span>Settlement Speed:</span>
                <span className="font-bold text-white">Instant</span>
              </div>
            </div>
          </Card>

          {/* Security Rules Checklist */}
          <Card className="p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Transfer Safeguards</span>
            </h3>

            <ul className="space-y-2.5 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Atomic transaction execution ensures zero fund loss</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Self-transfer and frozen account transfers are automatically blocked</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Anti-double submission protection locks request in-flight</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>Instant immutable receipt generated for both parties</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => !isSubmitting && setIsConfirmModalOpen(false)}
        title="Confirm Money Transfer"
        description="Please review transaction details carefully before sending funds."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              onClick={handleConfirmTransfer}
            >
              {isSubmitting ? 'Processing Transfer...' : 'Confirm & Send Transfer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Amount Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
            <span className="text-xs uppercase font-bold text-slate-400">Total to Transfer</span>
            <div className="text-3xl font-black text-slate-900 mt-0.5">
              {formatCurrency(parseFloat(amount || '0'))}
            </div>
            <span className="text-[11px] text-emerald-600 font-semibold block mt-1">
              ₹0.00 Transfer Fee
            </span>
          </div>

          {/* Transfer Summary Specs */}
          <div className="space-y-2.5 divide-y divide-slate-100 text-xs">
            <div className="flex justify-between pt-1">
              <span className="text-slate-500">From Account</span>
              <div className="text-right">
                <span className="font-bold text-slate-800">
                  {selectedSenderAccount?.accountType} Account
                </span>
                <p className="font-mono text-[11px] text-slate-500">
                  {selectedSenderAccount?.accountNumber}
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-2.5">
              <span className="text-slate-500">To Recipient</span>
              <div className="text-right">
                <span className="font-bold text-slate-800">
                  {receiverInfo?.recipientName || 'Verified Recipient'}
                </span>
                <p className="font-mono text-[11px] text-slate-500">
                  {receiverAccountNumber}
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-2.5">
              <span className="text-slate-500">Estimated Balance After</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(Math.max(0, (selectedSenderAccount?.balance || 0) - parseFloat(amount || '0')))}
              </span>
            </div>

            {description && (
              <div className="flex justify-between pt-2.5">
                <span className="text-slate-500">Description</span>
                <span className="font-medium text-slate-800 max-w-xs text-right truncate">
                  {description}
                </span>
              </div>
            )}
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800">
            Once submitted, money transfers settle immediately and cannot be recalled automatically.
          </div>
        </div>
      </Modal>

      {/* High-Value Transfer OTP Security Modal */}
      <OtpModal
        isOpen={isOtpModalOpen}
        onClose={() => {
          setIsOtpModalOpen(false);
          setPendingTransferPayload(null);
        }}
        onVerify={(code) => handleConfirmTransfer(code)}
        email={user?.email}
        purpose="TRANSFER"
        title="High-Value Transfer Verification"
        description={`To protect your account, this transfer of ${formatCurrency(parseFloat(amount || '0'))} requires 6-digit passcode authorization sent to ${user?.email}.`}
        loading={isSubmitting}
        error={otpError}
      />
    </div>
  );
};

export default Transfer;
