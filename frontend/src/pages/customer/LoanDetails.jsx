import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import loanService from '../../services/loanService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Loader from '../../components/ui/Loader';
import {
  Landmark,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  User,
  GraduationCap,
  Home,
  Car,
  ShieldCheck,
  TrendingDown,
  DollarSign,
  AlertCircle,
  Percent,
  Printer,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const LOAN_ICONS = {
  Personal: User,
  Education: GraduationCap,
  Home: Home,
  Vehicle: Car,
};

const LoanDetails = () => {
  const { id } = useParams();

  const [loan, setLoan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const fetchLoan = async () => {
      try {
        setIsLoading(true);
        const res = await loanService.getLoanById(id);
        setLoan(res?.loan);
      } catch (err) {
        console.error('Failed to load loan details:', err);
        setErrorMessage(err.message || 'Loan application not found.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLoan();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader size="lg" label="Loading loan application details..." />
      </div>
    );
  }

  if (errorMessage || !loan) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <Card className="p-8">
          <CardContent className="space-y-4">
            <div className="mx-auto h-14 w-14 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertCircle className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Application Not Found</h2>
            <p className="text-xs text-slate-500">
              {errorMessage || 'The requested loan application could not be retrieved.'}
            </p>
            <Link to="/loans">
              <Button variant="primary" size="sm">
                Return to Loans
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const IconComponent = LOAN_ICONS[loan.loanType] || Landmark;
  const totalPayable = loan.totalPayable || loan.remainingAmount || loan.emi * loan.tenure;
  const totalInterest = loan.totalInterest || (totalPayable - loan.amount);

  // Status Stepper definition
  const steps = [
    { title: 'Application Submitted', date: loan.applicationDate, done: true },
    {
      title: 'Documentation Review',
      done: loan.status === 'Approved' || loan.status === 'Rejected',
      active: loan.status === 'Pending',
    },
    {
      title: 'Underwriter Assessment',
      done: loan.status === 'Approved',
      active: loan.status === 'Pending',
    },
    {
      title: loan.status === 'Rejected' ? 'Application Declined' : 'Credit Approval & Disbursement',
      done: loan.status === 'Approved' || loan.status === 'Rejected',
      status: loan.status,
    },
  ];

  // Generate simulated amortization schedule (first 6 installments)
  const monthlyRate = (loan.interestRate / 100) / 12;
  let runningBalance = loan.amount;
  const schedule = [];
  const appDate = new Date(loan.applicationDate || loan.createdAt);

  for (let i = 1; i <= Math.min(6, loan.tenure); i++) {
    const interestComponent = Math.round(runningBalance * monthlyRate * 100) / 100;
    const principalComponent = Math.round((loan.emi - interestComponent) * 100) / 100;
    runningBalance = Math.max(0, Math.round((runningBalance - principalComponent) * 100) / 100);

    const dueDate = new Date(appDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installment: i,
      dueDate: dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      emi: loan.emi,
      principal: principalComponent,
      interest: interestComponent,
      balance: runningBalance,
    });
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/loans"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 mb-2 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Loans</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
              <IconComponent className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {loan.loanType} Loan Application
              </h1>
              <p className="font-mono text-xs text-slate-400">
                Reference ID: #{loan._id}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            icon={Printer}
            size="sm"
            onClick={() => window.print()}
          >
            Print Summary
          </Button>

          <span
            className={`text-xs font-bold px-3 py-1 rounded-full border ${
              loan.status === 'Approved'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : loan.status === 'Rejected'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {loan.status}
          </span>
        </div>
      </div>

      {/* APPLICATION TRACKER STEPPER */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application Lifecycle & Underwriting Tracker</CardTitle>
          <CardDescription>Real-time milestone progress of this credit facility</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {steps.map((step, idx) => {
              const isCompleted = step.done;
              const isActive = step.active;
              const isRejected = step.status === 'Rejected';

              return (
                <div key={idx} className="flex flex-col items-center text-center relative z-10">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center border-2 mb-2 transition-colors ${
                      isRejected
                        ? 'bg-rose-100 border-rose-500 text-rose-700'
                        : isCompleted
                        ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                        : isActive
                        ? 'bg-amber-100 border-amber-500 text-amber-700 ring-4 ring-amber-100 animate-pulse'
                        : 'bg-slate-100 border-slate-300 text-slate-400'
                    }`}
                  >
                    {isRejected ? (
                      <XCircle className="h-5 w-5" />
                    ) : isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : isActive ? (
                      <Clock className="h-5 w-5" />
                    ) : (
                      <span className="text-xs font-bold">{idx + 1}</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-slate-800">{step.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {idx === 0
                      ? new Date(loan.applicationDate || loan.createdAt).toLocaleDateString()
                      : isActive
                      ? 'In Review'
                      : isCompleted
                      ? 'Verified'
                      : 'Pending'}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Grid: Financial Overview & Terms */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Columns: Financial Terms & Key Metrics */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Financial Overview & Terms</CardTitle>
              <CardDescription>Approved parameters and repayment schedule details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Principal vs EMI Row */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Principal Loan Amount
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {formatCurrency(loan.amount || 0)}
                  </div>
                  <span className="text-[10px] text-slate-500">Disbursable credit</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Monthly Installment (EMI)
                  </span>
                  <div className="text-2xl font-black text-brand-600 mt-0.5">
                    {formatCurrency(loan.emi || 0)}
                  </div>
                  <span className="text-[10px] text-slate-500">{loan.tenure} total installments</span>
                </div>
              </div>

              {/* Detailed Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]">
                  <span className="text-[10px] text-[var(--finova-text-muted)] font-bold uppercase block">Annual APR</span>
                  <span className="text-sm font-extrabold text-[var(--finova-text-heading)] mt-0.5 block">
                    {loan.interestRate}%
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]">
                  <span className="text-[10px] text-[var(--finova-text-muted)] font-bold uppercase block">Tenure Duration</span>
                  <span className="text-sm font-extrabold text-[var(--finova-text-heading)] mt-0.5 block">
                    {loan.tenure} Mo ({(loan.tenure / 12).toFixed(1)} Yrs)
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]">
                  <span className="text-[10px] text-[var(--finova-text-muted)] font-bold uppercase block">Total Interest</span>
                  <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {formatCurrency(totalInterest || 0)}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]">
                  <span className="text-[10px] text-[var(--finova-text-muted)] font-bold uppercase block">Total Payable</span>
                  <span className="text-sm font-extrabold text-[var(--finova-text-heading)] mt-0.5 block">
                    {formatCurrency(totalPayable || 0)}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]">
                  <span className="text-[10px] text-[var(--finova-text-muted)] font-bold uppercase block">Employment</span>
                  <span className="text-sm font-extrabold text-[var(--finova-text-heading)] mt-0.5 block truncate">
                    {loan.employmentStatus || 'Employed'}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]">
                  <span className="text-[10px] text-[var(--finova-text-muted)] font-bold uppercase block">Stated Purpose</span>
                  <span className="text-xs font-bold text-[var(--finova-text-heading)] mt-0.5 block truncate" title={loan.purpose}>
                    {loan.purpose || 'General Credit'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SIMULATED AMORTIZATION SCHEDULE PREVIEW */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Amortization Schedule (Initial Installments)</CardTitle>
              <CardDescription>Estimated principal & interest breakdown by month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">EMI Amount</th>
                      <th className="py-2.5 px-3 text-right">Principal</th>
                      <th className="py-2.5 px-3 text-right">Interest</th>
                      <th className="py-2.5 px-3 text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {schedule.map((row) => (
                      <tr key={row.installment} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-sans font-bold text-slate-700">
                          Month {row.installment}
                        </td>
                        <td className="py-2.5 px-3 font-sans text-slate-600">{row.dueDate}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(row.emi)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-brand-600">
                          {formatCurrency(row.principal)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-amber-600">
                          {formatCurrency(row.interest)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">
                          {formatCurrency(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 5 Columns: Applicant Info & Repayment Info */}
        <div className="lg:col-span-5 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Applicant Information</CardTitle>
              <CardDescription>Verified profile credentials on file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Applicant Name</span>
                <span className="font-bold text-slate-800">{loan.user?.name || 'Verified Customer'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Registered Email</span>
                <span className="font-mono text-slate-700">{loan.user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Contact Phone</span>
                <span className="font-mono text-slate-700">{loan.user?.phone || 'N/A'}</span>
              </div>
              {loan.annualIncome && (
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Declared Income</span>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(loan.annualIncome)}/yr
                  </span>
                </div>
              )}
              <div className="flex justify-between py-1.5">
                <span className="text-slate-500">Application Date</span>
                <span className="font-medium text-slate-700">
                  {new Date(loan.applicationDate || loan.createdAt).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Underwriter Notice */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-900 to-slate-900 p-5 text-white shadow-md space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/10 text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold tracking-tight">Institutional Lending Guard</h4>
                <p className="text-[11px] text-brand-200">
                  Standard compliance & statutory verification
                </p>
              </div>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Applications are reviewed in order of submission by the Finova credit assessment team.
              No disbursements occur until statutory verification is cleared.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoanDetails;
