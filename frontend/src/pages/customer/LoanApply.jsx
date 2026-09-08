import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import loanService, {
  DEFAULT_LOAN_RATES,
  LOAN_TYPES_CONFIG,
  calculateEmi,
} from '../../services/loanService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import {
  Landmark,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Calculator,
  User,
  GraduationCap,
  Home,
  Car,
  Briefcase,
  DollarSign,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const LOAN_ICONS = {
  Personal: User,
  Education: GraduationCap,
  Home: Home,
  Vehicle: Car,
};

const LoanApply = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Parse query parameters
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get('type') || 'Personal';
  const initialAmount = parseFloat(queryParams.get('amount')) || 10000;
  const initialTenure = parseInt(queryParams.get('tenure'), 10) || 24;

  // Form State
  const [loanType, setLoanType] = useState(initialType);
  const [amount, setAmount] = useState(initialAmount);
  const [tenure, setTenure] = useState(initialTenure);
  const [interestRate, setInterestRate] = useState(DEFAULT_LOAN_RATES[initialType] || 11.5);
  const [purpose, setPurpose] = useState('');
  const [annualIncome, setAnnualIncome] = useState(65000);
  const [employmentStatus, setEmploymentStatus] = useState('Employed');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected config
  const activeConfig = LOAN_TYPES_CONFIG.find((c) => c.type === loanType) || LOAN_TYPES_CONFIG[0];

  // Update rates when loan type changes
  const handleLoanTypeSelect = (type) => {
    setLoanType(type);
    const newRate = DEFAULT_LOAN_RATES[type] || 10.0;
    setInterestRate(newRate);
    const cfg = LOAN_TYPES_CONFIG.find((c) => c.type === type);
    if (cfg) {
      if (amount < cfg.minAmount) setAmount(cfg.minAmount);
      if (amount > cfg.maxAmount) setAmount(cfg.maxAmount);
      if (tenure < cfg.minTenure) setTenure(cfg.minTenure);
      if (tenure > cfg.maxTenure) setTenure(cfg.maxTenure);
    }
  };

  // Real-time calculation
  const { emi, totalPayable, totalInterest } = calculateEmi(amount, interestRate, tenure);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (amount < activeConfig.minAmount || amount > activeConfig.maxAmount) {
      setErrorMessage(
        `Loan amount for ${loanType} loan must be between ${formatCurrency(activeConfig.minAmount)} and ${formatCurrency(activeConfig.maxAmount)}.`
      );
      return;
    }

    if (tenure < activeConfig.minTenure || tenure > activeConfig.maxTenure) {
      setErrorMessage(
        `Loan tenure for ${loanType} loan must be between ${activeConfig.minTenure} and ${activeConfig.maxTenure} months.`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await loanService.applyLoan({
        loanType,
        amount: parseFloat(amount),
        interestRate: parseFloat(interestRate),
        tenure: parseInt(tenure, 10),
        purpose: purpose.trim() || `${loanType} loan for personal financing`,
        annualIncome: parseFloat(annualIncome) || 0,
        employmentStatus,
      });

      if (res?.loan?._id) {
        navigate(`/loans/${res.loan._id}`);
      } else {
        navigate('/loans');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Failed to submit loan application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <Link
          to="/loans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-2 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Loans Dashboard</span>
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Landmark className="h-6 w-6 text-brand-600" />
          <span>Apply for Loan Facility</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete the application below for instant underwriter review and loan status tracking
        </p>
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Application Details */}
        <div className="lg:col-span-7 space-y-5">
          {/* Step 1: Select Loan Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1. Loan Category</CardTitle>
              <CardDescription>Select the credit facility that matches your needs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {LOAN_TYPES_CONFIG.map((cfg) => {
                  const isSelected = loanType === cfg.type;
                  const IconComp = LOAN_ICONS[cfg.type] || Landmark;
                  return (
                    <button
                      key={cfg.type}
                      type="button"
                      onClick={() => handleLoanTypeSelect(cfg.type)}
                      className={`p-3.5 rounded-xl border text-left transition-all ${
                        isSelected
                          ? 'border-[var(--finova-navy)] bg-[var(--finova-navy)]/10 ring-1 ring-[var(--finova-navy)]'
                          : 'border-[var(--finova-border)] hover:bg-[var(--finova-bg-secondary)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-[var(--finova-navy)] text-white' : 'bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)]'
                          }`}
                        >
                          <IconComp className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold text-[var(--finova-navy)] bg-[var(--finova-bg-secondary)] px-1.5 py-0.5 rounded">
                          {cfg.rate}% APR
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[var(--finova-text-heading)] mt-2">{cfg.name}</p>
                      <p className="text-[10px] text-[var(--finova-text-muted)] mt-0.5 line-clamp-1">{cfg.description}</p>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Step 2: Loan Amount & Term Parameters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">2. Loan Parameters</CardTitle>
              <CardDescription>Customize the loan amount and repayment period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--finova-text-heading)]">Requested Amount (₹ INR)</label>
                  <span className="font-mono text-xs text-[var(--finova-text-muted)]">
                    Range: {formatCurrency(activeConfig.minAmount)} - {formatCurrency(activeConfig.maxAmount)}
                  </span>
                </div>
                <Input
                  type="number"
                  min={activeConfig.minAmount}
                  max={activeConfig.maxAmount}
                  step={500}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--finova-text-heading)]">
                    Repayment Tenure (Months)
                  </label>
                  <span className="font-mono text-xs text-[var(--finova-text-muted)]">
                    {(tenure / 12).toFixed(1)} Years ({activeConfig.minTenure} - {activeConfig.maxTenure} mo)
                  </span>
                </div>
                <Input
                  type="number"
                  min={activeConfig.minTenure}
                  max={activeConfig.maxTenure}
                  step={6}
                  value={tenure}
                  onChange={(e) => setTenure(Number(e.target.value))}
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Step 3: Employment & Purpose */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3. Applicant Underwriting Details</CardTitle>
              <CardDescription>Financial information for credit verification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1.5">
                    Employment Status
                  </label>
                  <select
                    value={employmentStatus}
                    onChange={(e) => setEmploymentStatus(e.target.value)}
                    className="w-full rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] px-3.5 py-2.5 text-xs font-semibold text-[var(--finova-text-heading)] transition-all focus:border-[var(--finova-navy)] focus:outline-none focus:ring-2 focus:ring-[var(--finova-navy)]/20"
                  >
                    <option value="Employed">Salaried / Full-Time Employed</option>
                    <option value="Self-Employed">Self-Employed Professional</option>
                    <option value="Business">Business Owner / Entrepreneur</option>
                    <option value="Student">Student (Education Loans)</option>
                    <option value="Other">Other / Freelance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1.5">
                    Estimated Annual Income (₹ INR)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={annualIncome}
                    onChange={(e) => setAnnualIncome(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1.5">
                  Purpose / Loan Description (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Home renovation, tuition fees, vehicle down payment..."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  maxLength={150}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 5 Columns: Live Loan Summary & Submission */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="border border-[var(--finova-border)] shadow-md sticky top-6">
            <CardHeader className="bg-[var(--finova-bg-secondary)]/50 border-b border-[var(--finova-border)]">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Application Summary</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--finova-navy)]/10 text-[var(--finova-navy)]">
                  {loanType} Loan
                </span>
              </CardTitle>
              <CardDescription>Instant computed terms</CardDescription>
            </CardHeader>

            <CardContent className="p-5 space-y-5">
              {/* Monthly EMI Hero Banner */}
              <div className="text-center py-4 bg-[var(--finova-navy)] rounded-2xl text-white shadow-sm">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--finova-sage)]">
                  Calculated Monthly EMI
                </span>
                <div className="text-3xl font-black tracking-tight mt-1 text-white">
                  {formatCurrency(emi)}
                </div>
                <span className="text-[10px] text-slate-300">per month for {tenure} months</span>
              </div>

              {/* Terms Breakdown */}
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-[var(--finova-border)]">
                  <span className="text-[var(--finova-text-muted)]">Principal Loan Amount</span>
                  <span className="font-bold text-[var(--finova-text-heading)]">
                    {formatCurrency(Number(amount))}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--finova-border)]">
                  <span className="text-[var(--finova-text-muted)]">Annual Interest Rate</span>
                  <span className="font-bold text-[var(--finova-text-heading)]">{interestRate}% APR</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--finova-border)]">
                  <span className="text-[var(--finova-text-muted)]">Loan Tenure</span>
                  <span className="font-bold text-[var(--finova-text-heading)]">{tenure} Months</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--finova-border)]">
                  <span className="text-[var(--finova-text-muted)]">Total Interest Payable</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {formatCurrency(totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--finova-border)]">
                  <span className="text-[var(--finova-text-muted)]">Total Amount Payable</span>
                  <span className="font-extrabold text-[var(--finova-text-heading)]">
                    {formatCurrency(totalPayable)}
                  </span>
                </div>
              </div>

              {/* Security & Verification Notice */}
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-secondary)] text-[11px] leading-relaxed">
                <ShieldCheck className="h-4 w-4 text-[var(--finova-sage)] shrink-0 mt-0.5" />
                <span>
                  Applications are initiated in <strong>Pending</strong> review status. You can track underwriter progress in real-time.
                </span>
              </div>

              {/* Submit Button */}
              <div className="pt-2 space-y-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Submit Loan Application
                </Button>
                <Link to="/loans" className="block w-full">
                  <Button type="button" variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  );
};

export default LoanApply;
