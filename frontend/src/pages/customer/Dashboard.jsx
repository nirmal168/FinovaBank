import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Landmark,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Users,
  CreditCard,
  Coins,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { formatCurrency, formatAmount, formatCompactINR } from '../../utils/currency';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Loader from '../../components/ui/Loader';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useTheme } from '../../context/ThemeContext';
import accountService from '../../services/accountService';
import transactionService from '../../services/transactionService';
import loanService from '../../services/loanService';

const quickActions = [
  {
    title: 'Deposit Funds',
    description: 'Instant cash inflow',
    icon: ArrowDownLeft,
    to: '/deposit',
    bg: 'bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] border-[var(--finova-border)] hover:border-[var(--finova-success)] hover:bg-[var(--finova-bg-secondary)]',
    iconBg: 'bg-[var(--finova-success-bg)] text-[var(--finova-success)]',
  },
  {
    title: 'Withdraw Funds',
    description: 'ATM & cash payout',
    icon: ArrowUpRight,
    to: '/withdraw',
    bg: 'bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] border-[var(--finova-border)] hover:border-[var(--finova-blue)] hover:bg-[var(--finova-bg-secondary)]',
    iconBg: 'bg-[var(--finova-info-bg)] text-[var(--finova-info)]',
  },
  {
    title: 'Transfer Money',
    description: 'P2P & bank wires',
    icon: ArrowLeftRight,
    to: '/transfer',
    bg: 'bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] border-[var(--finova-border)] hover:border-[var(--finova-primary)] hover:bg-[var(--finova-bg-secondary)]',
    iconBg: 'bg-[var(--finova-mint)] text-[var(--finova-primary)]',
  },
  {
    title: 'Beneficiaries',
    description: 'Manage recipients',
    icon: Users,
    to: '/beneficiaries',
    bg: 'bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] border-[var(--finova-border)] hover:border-[var(--finova-blue)] hover:bg-[var(--finova-bg-secondary)]',
    iconBg: 'bg-[var(--finova-info-bg)] text-[var(--finova-info)]',
  },
  {
    title: 'Debit Cards',
    description: 'Virtual & physical',
    icon: CreditCard,
    to: '/cards',
    bg: 'bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] border-[var(--finova-border)] hover:border-[var(--finova-warning)] hover:bg-[var(--finova-bg-secondary)]',
    iconBg: 'bg-[var(--finova-warning-bg)] text-[var(--finova-warning)]',
  },
  {
    title: 'Loan Center',
    description: 'Personal & mortgages',
    icon: Coins,
    to: '/loans',
    bg: 'bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] border-[var(--finova-border)] hover:border-[var(--finova-success)] hover:bg-[var(--finova-bg-secondary)]',
    iconBg: 'bg-[var(--finova-success-bg)] text-[var(--finova-success)]',
  },
];

const Dashboard = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { theme, isDark, isNight } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [accounts, setAccounts] = useState([]);
  const [primaryAccount, setPrimaryAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Concurrent data fetching for optimal performance
      const [accsRes, historyRes, loansRes] = await Promise.allSettled([
        accountService.getAccounts(),
        transactionService.getHistory(30),
        loanService.getLoans(),
      ]);

      if (accsRes.status === 'fulfilled' && accsRes.value?.accounts) {
        setAccounts(accsRes.value.accounts);
        const activeAcc = accsRes.value.accounts.find((a) => a.status?.toLowerCase() === 'active') || accsRes.value.accounts[0];
        setPrimaryAccount(activeAcc || null);
      } else {
        // Fallback to getAccount
        try {
          const singleAcc = await transactionService.getAccount();
          if (singleAcc?.account) {
            setAccounts([singleAcc.account]);
            setPrimaryAccount(singleAcc.account);
          }
        } catch (e) {
          console.warn('Account load fallback failed:', e);
        }
      }

      if (historyRes.status === 'fulfilled' && historyRes.value?.transactions) {
        setTransactions(historyRes.value.transactions);
      }

      if (loansRes.status === 'fulfilled' && loansRes.value?.loans) {
        setLoans(loansRes.value.loans);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Failed to load dashboard metrics');
      showToast('Error refreshing dashboard data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Compute key banking metrics
  const totalBalance = useMemo(() => {
    if (!accounts || accounts.length === 0) return primaryAccount?.balance || 0;
    return accounts.reduce((acc, curr) => acc + (curr.balance || 0), 0);
  }, [accounts, primaryAccount]);

  const { totalIncome, totalExpenses } = useMemo(() => {
    let income = 0;
    let expenses = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'DEPOSIT') {
        income += amt;
      } else if (tx.type === 'WITHDRAW') {
        expenses += amt;
      } else if (tx.type === 'TRANSFER') {
        // If receiver is one of user's accounts -> Income, else -> Expense
        const isIncoming = accounts.some((a) => a.accountNumber === tx.receiverAccount);
        if (isIncoming) {
          income += amt;
        } else {
          expenses += amt;
        }
      }
    });

    return { totalIncome: income, totalExpenses: expenses };
  }, [transactions, accounts]);

  const activeLoanStats = useMemo(() => {
    const approved = loans.filter((l) => l.status === 'Approved');
    const totalRemaining = approved.reduce((sum, l) => sum + (l.remainingAmount ?? l.amount ?? 0), 0);
    return {
      count: approved.length,
      totalRemaining,
      totalApplications: loans.length,
    };
  }, [loans]);

  // Aggregate monthly / weekly cash flow for the chart
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Default placeholder baseline
      return [
        { name: 'Jan', Income: 2400, Expenses: 1400 },
        { name: 'Feb', Income: 3100, Expenses: 1800 },
        { name: 'Mar', Income: 2800, Expenses: 1600 },
        { name: 'Apr', Income: 3600, Expenses: 2100 },
        { name: 'May', Income: 4200, Expenses: 2300 },
        { name: 'Jun', Income: 3900, Expenses: 2000 },
      ];
    }

    // Group transactions by Date (Month Day)
    const groups = {};
    // Sort chronological
    const sorted = [...transactions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    sorted.forEach((tx) => {
      const d = new Date(tx.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!groups[key]) {
        groups[key] = { name: key, Income: 0, Expenses: 0 };
      }
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'DEPOSIT') {
        groups[key].Income += amt;
      } else if (tx.type === 'WITHDRAW') {
        groups[key].Expenses += amt;
      } else if (tx.type === 'TRANSFER') {
        const isIncoming = accounts.some((a) => a.accountNumber === tx.receiverAccount);
        if (isIncoming) {
          groups[key].Income += amt;
        } else {
          groups[key].Expenses += amt;
        }
      }
    });

    const list = Object.values(groups);
    return list.length > 1 ? list.slice(-8) : list;
  }, [transactions, accounts]);

  const chartColors = useMemo(() => {
    if (isNight) {
      return {
        income: '#7FA68C',
        expenses: '#B86B6B',
        grid: '#24303D',
        axis: '#7F8B97',
        tooltipBg: '#0B121A',
        tooltipBorder: '#2A3744',
        tooltipText: '#E8EDF2',
      };
    }
    if (isDark) {
      return {
        income: '#78A88C',
        expenses: '#D27A7A',
        grid: '#293548',
        axis: '#94A3B8',
        tooltipBg: '#0F172A',
        tooltipBorder: '#334155',
        tooltipText: '#F8FAFC',
      };
    }
    return {
      income: '#5B8C72',
      expenses: '#B85C5C',
      grid: '#E2E0DA',
      axis: '#667085',
      tooltipBg: '#102A43',
      tooltipBorder: '#17324D',
      tooltipText: '#FCFBF8',
    };
  }, [isDark, isNight]);

  if (loading && !primaryAccount) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <Loader size="lg" label="Synchronizing live banking data..." />
      </div>
    );
  }

  if (error && !primaryAccount) {
    return (
      <div className="py-12 max-w-xl mx-auto">
        <ErrorState
          title="Unable to connect to banking ledger"
          message={error}
          onRetry={loadDashboardData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Welcome & Primary Account Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--finova-deep)] p-6 text-white border border-[var(--finova-border)] shadow-md">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-[var(--finova-blue)]/15 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                Welcome back to Finova, {user?.name || 'Valued Customer'}! 👋
              </h1>
              <span className="inline-flex items-center gap-1 bg-[var(--finova-mint)]/25 text-[var(--finova-mint)] border border-[var(--finova-sage)]/40 text-[11px] px-2.5 py-0.5 rounded-full font-medium">
                <ShieldCheck className="h-3 w-3 text-[var(--finova-sage)]" />
                Verified Tier 1
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/80 mt-1.5 flex flex-wrap items-center gap-2">
              <span>Primary Account:</span>
              <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/10">
                {primaryAccount?.accountNumber || '4082-9842-1194'}
              </span>
              <span>•</span>
              <span className="text-white/90 font-medium">
                {primaryAccount?.accountType || 'Savings'} ({primaryAccount?.status || 'Active'})
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link to="/transfer">
              <Button
                variant="primary"
                size="md"
                icon={ArrowLeftRight}
                className="!bg-[var(--finova-sage)] hover:opacity-90 !text-white shadow-xs"
              >
                Send Money
              </Button>
            </Link>
            <Link to="/deposit">
              <Button
                variant="primary"
                size="md"
                icon={ArrowDownLeft}
                className="!bg-[var(--finova-blue)] hover:opacity-90 !text-white shadow-xs"
              >
                Deposit
              </Button>
            </Link>
            <Link to="/accounts">
              <Button
                variant="outline"
                size="md"
                className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
              >
                Manage Accounts
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Core Banking Stat Cards: Total Balance, Income, Expenses, Loans */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Balance */}
        <Card hover className="relative overflow-hidden border-[var(--finova-border)] bg-[var(--finova-card-bg)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
                Total Balance
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--finova-bg-secondary)] text-[var(--finova-primary)] border border-[var(--finova-border)]">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[var(--finova-text-heading)] tracking-tight">
                {formatCurrency(totalBalance)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--finova-success)] font-medium">
                <CheckCircle2 className="h-3.5 w-3.5 text-[var(--finova-sage)]" />
                <span>Active across {accounts.length || 1} accounts</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Income */}
        <Card hover className="relative overflow-hidden border-[var(--finova-border)] bg-[var(--finova-card-bg)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
                Income (Credits)
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--finova-success-bg)] text-[var(--finova-success)] border border-[var(--finova-sage)]/20">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[var(--finova-success)] tracking-tight">
                +{formatCurrency(totalIncome)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--finova-text-secondary)] font-medium">
                <span>Direct deposits & inbound transfers</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Expenses */}
        <Card hover className="relative overflow-hidden border-[var(--finova-border)] bg-[var(--finova-card-bg)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
                Expenses (Debits)
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--finova-danger-bg)] text-[var(--finova-danger)] border border-[var(--finova-danger)]/20">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[var(--finova-danger)] tracking-tight">
                -{formatCurrency(totalExpenses)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--finova-text-secondary)] font-medium">
                <span>Withdrawals & payments sent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loans */}
        <Card hover className="relative overflow-hidden border-[var(--finova-border)] bg-[var(--finova-card-bg)]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--finova-text-secondary)]">
                Active Loans
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--finova-info-bg)] text-[var(--finova-blue)] border border-[var(--finova-blue)]/20">
                <Landmark className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[var(--finova-text-heading)] tracking-tight">
                {formatCurrency(activeLoanStats.totalRemaining)}
              </div>
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--finova-blue)] font-medium">
                <span>
                  {activeLoanStats.count} approved ({activeLoanStats.totalApplications} total applied)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Quick Actions Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-[var(--finova-text-heading)] tracking-tight">
            Quick Actions
          </h2>
          <span className="text-xs text-[var(--finova-text-secondary)]">Core financial services</span>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {quickActions.map((act) => {
            const Icon = act.icon;
            return (
              <Link key={act.title} to={act.to} className="group">
                <div
                  className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all duration-200 hover:shadow-xs hover:-translate-y-0.5 ${act.bg}`}
                >
                  <div className={`flex h-11 w-11 items-center justify-center rounded-xl shadow-xs mb-2.5 transition-transform group-hover:scale-105 ${act.iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold leading-tight line-clamp-1">
                    {act.title}
                  </span>
                  <span className="text-[10px] text-[var(--finova-text-secondary)] mt-0.5">
                    {act.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 4. Visual Financial Flow Chart (Recharts) */}
      <Card className="border-[var(--finova-border)] bg-[var(--finova-card-bg)]">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 gap-2 border-b border-[var(--finova-border)]">
          <div>
            <CardTitle className="text-base font-bold text-[var(--finova-text-heading)]">
              Cash Flow Analytics
            </CardTitle>
            <CardDescription className="text-xs text-[var(--finova-text-secondary)]">
              Income credits vs. expense debits timeline
            </CardDescription>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 font-medium text-[var(--finova-text-main)]">
              <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: chartColors.income }} />
              <span>Income</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-[var(--finova-text-main)]">
              <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: chartColors.expenses }} />
              <span>Expenses</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.income} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={chartColors.income} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColors.expenses} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={chartColors.expenses} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="name" stroke={chartColors.axis} fontSize={11} tickLine={false} />
                <YAxis stroke={chartColors.axis} fontSize={11} tickLine={false} tickFormatter={(v) => formatCompactINR(v)} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), '']}
                  contentStyle={{
                    backgroundColor: chartColors.tooltipBg,
                    borderColor: chartColors.tooltipBorder,
                    borderRadius: '0.75rem',
                    color: chartColors.tooltipText,
                    fontSize: '12px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.25)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="Income"
                  stroke={chartColors.income}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#incomeGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="Expenses"
                  stroke={chartColors.expenses}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#expenseGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 5. Recent Transactions Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[var(--finova-text-heading)] tracking-tight">
              Recent Transactions
            </h2>
            <p className="text-xs text-[var(--finova-text-secondary)]">Live ledger activity across your accounts</p>
          </div>
          <Link to="/transactions">
            <Button variant="ghost" size="sm" className="text-xs text-[var(--finova-primary)] hover:opacity-80">
              View all transactions &rarr;
            </Button>
          </Link>
        </div>

        {transactions.length === 0 ? (
          <EmptyState
            title="No transactions yet"
            description="You have not completed any deposits, withdrawals, or transfers yet. Get started by funding your account."
            actionLabel="Make a Deposit"
            onAction={() => (window.location.href = '/deposit')}
          />
        ) : (
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Transaction</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {transactions.slice(0, 6).map((tx) => {
                const isCredit = tx.type === 'DEPOSIT' || (tx.type === 'TRANSFER' && accounts.some((a) => a.accountNumber === tx.receiverAccount));
                const amt = Math.abs(Number(tx.amount) || 0);
                const displayId = tx.transactionId || tx._id;

                return (
                  <TableRow key={displayId}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-[#102A43]">
                          {tx.description || (tx.type === 'DEPOSIT' ? 'Direct Deposit' : tx.type === 'WITHDRAW' ? 'ATM Cash Out' : 'Account Transfer')}
                        </p>
                        <p className="text-[11px] text-[#667085] font-mono">
                          ID: {displayId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F7F5EF] text-[#102A43] border border-[#E2E0DA]">
                        {tx.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#667085] text-xs">
                      {new Date(tx.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell
                      className={`text-right font-bold font-mono text-xs ${
                        isCredit ? 'text-[#3F7D58]' : 'text-[#263238] dark:text-[#E8EDF2]'
                      }`}
                    >
                      {isCredit ? `+${formatCurrency(amt)}` : `-${formatCurrency(amt)}`}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          tx.status === 'COMPLETED'
                            ? 'bg-[#DDEDE4] text-[#3F7D58] border border-[#5B8C72]/30'
                            : tx.status === 'HELD' || tx.status === 'FLAGGED'
                            ? 'bg-[#FBF2E3] text-[#C58A3A] border border-[#C58A3A]/30'
                            : 'bg-[#F7F5EF] text-[#667085] border border-[#E2E0DA]'
                        }`}
                      >
                        {tx.status || 'COMPLETED'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={`/transactions/${displayId}`}>
                        <Button variant="outline" size="sm" className="text-xs py-1 px-2.5">
                          Details
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
