import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import loanService, {
  DEFAULT_LOAN_RATES,
  LOAN_TYPES_CONFIG,
  calculateEmi,
} from '../../services/loanService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import {
  Landmark,
  Plus,
  Calculator,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowRight,
  TrendingUp,
  Percent,
  Wallet,
  User,
  GraduationCap,
  Home,
  Car,
  ChevronRight,
  HelpCircle,
  FileText,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const LOAN_ICONS = {
  Personal: User,
  Education: GraduationCap,
  Home: Home,
  Vehicle: Car,
};

const Loans = () => {
  const navigate = useNavigate();

  // State
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('loans'); // 'loans' | 'calculator'
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Pending' | 'Approved' | 'Rejected'

  // EMI Calculator State
  const [calcType, setCalcType] = useState('Personal');
  const [calcAmount, setCalcAmount] = useState(15000);
  const [calcRate, setCalcRate] = useState(DEFAULT_LOAN_RATES.Personal);
  const [calcTenure, setCalcTenure] = useState(36); // in months

  // Calculate live EMI
  const { emi, totalPayable, totalInterest } = calculateEmi(calcAmount, calcRate, calcTenure);
  const principalPercent = totalPayable > 0 ? Math.round((calcAmount / totalPayable) * 100) : 0;
  const interestPercent = 100 - principalPercent;

  // Load loans
  const loadLoans = async () => {
    try {
      setIsLoading(true);
      const res = await loanService.getLoans();
      setLoans(res?.loans || []);
    } catch (err) {
      console.error('Failed to load loans:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLoans();
  }, []);

  // Update calculator rate when loan type changes
  const handleCalcTypeChange = (type) => {
    setCalcType(type);
    setCalcRate(DEFAULT_LOAN_RATES[type] || 10.0);
    const config = LOAN_TYPES_CONFIG.find((c) => c.type === type);
    if (config) {
      if (calcAmount < config.minAmount) setCalcAmount(config.minAmount);
      if (calcAmount > config.maxAmount) setCalcAmount(config.maxAmount);
      if (calcTenure < config.minTenure) setCalcTenure(config.minTenure);
      if (calcTenure > config.maxTenure) setCalcTenure(config.maxTenure);
    }
  };

  // Filtered loans list
  const filteredLoans = loans.filter((loan) => {
    if (statusFilter === 'ALL') return true;
    return loan.status === statusFilter;
  });

  // Aggregates
  const totalBorrowed = loans.reduce((acc, l) => acc + (l.amount || 0), 0);
  const totalEmiCommitment = loans
    .filter((l) => l.status === 'Approved')
    .reduce((acc, l) => acc + (l.emi || 0), 0);
  const pendingCount = loans.filter((l) => l.status === 'Pending').length;
  const approvedCount = loans.filter((l) => l.status === 'Approved').length;

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader size="lg" label="Loading loan facilities..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Landmark className="h-6 w-6 text-brand-600" />
            <span>Loans & Credit Facilities</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Apply for personal, home, education, and vehicle loans with competitive rates and instant EMI calculation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'calculator' ? 'primary' : 'outline'}
            icon={Calculator}
            onClick={() => setActiveTab(activeTab === 'calculator' ? 'loans' : 'calculator')}
          >
            {activeTab === 'calculator' ? 'View Applications' : 'EMI Calculator'}
          </Button>

          <Link to="/loans/apply">
            <Button variant="primary" icon={Plus}>
              Apply for Loan
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Borrowed</span>
            <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-slate-900">
              {formatCurrency(totalBorrowed)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{loans.length} total application(s)</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Active Approved Loans</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-slate-900">{approvedCount}</div>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Disbursed credit lines</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Pending Review</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-slate-900">{pendingCount}</div>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">Underwriter assessment</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Monthly EMI Outflow</span>
            <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-extrabold text-slate-900">
              {formatCurrency(totalEmiCommitment)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Across active approved loans</p>
          </div>
        </Card>
      </div>

      {/* Main View: EMI Calculator OR Applications Hub */}
      {activeTab === 'calculator' ? (
        /* INTERACTIVE EMI CALCULATOR */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Sliders & Controls */}
          <div className="lg:col-span-7 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-brand-600" />
                  <span>Interactive Loan EMI Calculator</span>
                </CardTitle>
                <CardDescription>
                  Simulate your monthly installment and total repayment breakdown
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* 1. Loan Type selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">
                    Select Loan Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LOAN_TYPES_CONFIG.map((cfg) => {
                      const isSelected = calcType === cfg.type;
                      const IconComponent = LOAN_ICONS[cfg.type] || Landmark;
                      return (
                        <button
                          key={cfg.type}
                          type="button"
                          onClick={() => handleCalcTypeChange(cfg.type)}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'border-brand-600 bg-brand-50/50 shadow-xs'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div
                            className={`mx-auto h-7 w-7 rounded-lg flex items-center justify-center mb-1.5 ${
                              isSelected ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <p className="text-xs font-bold text-slate-900">{cfg.type}</p>
                          <p className="text-[10px] text-brand-600 font-semibold">{cfg.rate}% APR</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Loan Amount Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">Loan Amount</label>
                    <div className="font-mono text-sm font-extrabold text-brand-600">
                      {formatCurrency(calcAmount)}
                    </div>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={200000}
                    step={1000}
                    value={calcAmount}
                    onChange={(e) => setCalcAmount(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>{formatCurrency(1000)}</span>
                    <span>{formatCurrency(100000)}</span>
                    <span>{formatCurrency(200000)}</span>
                  </div>
                </div>

                {/* 3. Interest Rate Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">Annual Interest Rate (APR)</label>
                    <div className="font-mono text-sm font-extrabold text-slate-900">
                      {calcRate.toFixed(1)}%
                    </div>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={20}
                    step={0.1}
                    value={calcRate}
                    onChange={(e) => setCalcRate(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>5.0%</span>
                    <span>12.5%</span>
                    <span>20.0%</span>
                  </div>
                </div>

                {/* 4. Tenure Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">Loan Duration (Tenure)</label>
                    <div className="font-mono text-sm font-extrabold text-slate-900">
                      {calcTenure} Months ({(calcTenure / 12).toFixed(1)} Years)
                    </div>
                  </div>
                  <input
                    type="range"
                    min={6}
                    max={120}
                    step={6}
                    value={calcTenure}
                    onChange={(e) => setCalcTenure(Number(e.target.value))}
                    className="w-full accent-brand-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                    <span>6 Months</span>
                    <span>3 Years</span>
                    <span>5 Years</span>
                    <span>10 Years</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Calculated Breakdown & Apply Button */}
          <div className="lg:col-span-5 space-y-5">
            <Card className="border-2 border-brand-200 shadow-md">
              <CardHeader className="bg-slate-50/70 border-b border-slate-100">
                <CardTitle className="text-base">Repayment Overview</CardTitle>
                <CardDescription>Based on selected loan terms</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6 pt-5">
                {/* Monthly EMI Hero */}
                <div className="text-center py-4 bg-gradient-to-br from-slate-900 to-brand-950 rounded-2xl text-white shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-300">
                    Calculated Monthly Installment (EMI)
                  </span>
                  <div className="text-3xl sm:text-4xl font-black tracking-tight mt-1 text-white">
                    {formatCurrency(emi)}
                  </div>
                  <span className="text-[11px] text-slate-300">payable every month for {calcTenure} months</span>
                </div>

                {/* Progress Bar Visualization */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />
                      Principal: {principalPercent}%
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                      Interest: {interestPercent}%
                    </span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
                    <div
                      className="bg-brand-600 h-full transition-all duration-300"
                      style={{ width: `${principalPercent}%` }}
                    />
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${interestPercent}%` }}
                    />
                  </div>
                </div>

                {/* Metrics Breakdown Grid */}
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Principal Loan Amount</span>
                    <span className="font-bold text-slate-900">
                      {formatCurrency(calcAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Total Interest Payable</span>
                    <span className="font-bold text-amber-600">
                      {formatCurrency(totalInterest)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-500">Total Amount Payable</span>
                    <span className="font-extrabold text-slate-900">
                      {formatCurrency(totalPayable)}
                    </span>
                  </div>
                </div>

                {/* Apply with these parameters button */}
                <Button
                  variant="primary"
                  className="w-full"
                  icon={ArrowRight}
                  onClick={() =>
                    navigate(
                      `/loans/apply?type=${calcType}&amount=${calcAmount}&tenure=${calcTenure}&rate=${calcRate}`
                    )
                  }
                >
                  Apply with these Parameters
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        /* MY LOANS & APPLICATIONS PORTFOLIO */
        <div className="space-y-5">
          {/* Status Filters & View Switcher */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
              {['ALL', 'Pending', 'Approved', 'Rejected'].map((status) => {
                const isSelected = statusFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] shadow-xs'
                        : 'text-[var(--finova-text-muted)] hover:text-[var(--finova-text-heading)]'
                    }`}
                  >
                    {status === 'ALL' ? 'All Applications' : status}
                  </button>
                );
              })}
            </div>

            <span className="text-xs text-[var(--finova-text-muted)] font-medium">
              Showing {filteredLoans.length} of {loans.length} application(s)
            </span>
          </div>

          {filteredLoans.length === 0 ? (
            /* Empty State */
            <Card className="py-16 text-center border-dashed border-2 border-[var(--finova-border)]">
              <CardContent className="max-w-md mx-auto space-y-4">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-[var(--finova-navy)]/10 text-[var(--finova-navy)] flex items-center justify-center border border-[var(--finova-border)]">
                  <Landmark className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[var(--finova-text-heading)]">
                    {statusFilter === 'ALL'
                      ? 'No Loan Applications Found'
                      : `No ${statusFilter} Loans`}
                  </h3>
                  <p className="text-xs text-[var(--finova-text-muted)] mt-1">
                    Calculate monthly installments or apply for immediate financing in seconds.
                  </p>
                </div>
                <div className="pt-2 flex justify-center gap-3">
                  <Button
                    variant="outline"
                    icon={Calculator}
                    onClick={() => setActiveTab('calculator')}
                  >
                    Use Calculator
                  </Button>
                  <Link to="/loans/apply">
                    <Button variant="primary" icon={Plus}>
                      Apply for Loan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Loan Applications Cards Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLoans.map((loan) => {
                const IconComponent = LOAN_ICONS[loan.loanType] || Landmark;
                return (
                  <Card
                    key={loan._id}
                    className="hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden border border-[var(--finova-border)]"
                  >
                    <div>
                      {/* Card Header Banner */}
                      <div className="p-4 border-b border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-[var(--finova-navy)]/10 text-[var(--finova-navy)] flex items-center justify-center">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[var(--finova-text-heading)]">{loan.loanType} Loan</p>
                            <p className="font-mono text-[10px] text-[var(--finova-text-muted)]">
                              App #{loan._id.slice(-6).toUpperCase()}
                            </p>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            loan.status === 'Approved'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : loan.status === 'Rejected'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {loan.status}
                        </span>
                      </div>

                      {/* Card Body */}
                      <CardContent className="p-4 space-y-4">
                        {/* Principal & EMI Hero */}
                        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-[var(--finova-text-muted)] block">
                              Loan Amount
                            </span>
                            <span className="font-extrabold text-sm text-[var(--finova-text-heading)]">
                              {formatCurrency(loan.amount || 0)}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-[var(--finova-text-muted)] block">
                              Monthly EMI
                            </span>
                            <span className="font-extrabold text-sm text-[var(--finova-navy)]">
                              {formatCurrency(loan.emi || 0)}
                            </span>
                          </div>
                        </div>

                        {/* Specs List */}
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-[var(--finova-text-secondary)]">
                            <span>Interest Rate (APR)</span>
                            <span className="font-semibold text-[var(--finova-text-heading)]">{loan.interestRate}%</span>
                          </div>
                          <div className="flex justify-between text-[var(--finova-text-secondary)]">
                            <span>Duration</span>
                            <span className="font-semibold text-[var(--finova-text-heading)]">
                              {loan.tenure} Months ({(loan.tenure / 12).toFixed(1)} Yrs)
                            </span>
                          </div>
                          <div className="flex justify-between text-[var(--finova-text-secondary)]">
                            <span>Total Payable</span>
                            <span className="font-semibold text-[var(--finova-text-heading)]">
                              {formatCurrency(loan.remainingAmount || 0)}
                            </span>
                          </div>
                          <div className="flex justify-between text-[var(--finova-text-secondary)]">
                            <span>Applied Date</span>
                            <span className="font-semibold text-[var(--finova-text-heading)]">
                              {new Date(loan.applicationDate || loan.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </div>

                    {/* Card Footer Button */}
                    <div className="p-4 pt-0">
                      <Link to={`/loans/${loan._id}`} className="block w-full">
                        <Button variant="outline" size="sm" className="w-full justify-between">
                          <span>Track & View Details</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Loans;
