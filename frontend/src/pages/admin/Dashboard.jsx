import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import depositWithdrawalService from '../../services/depositWithdrawalService';
import StatCard from '../../components/admin/StatCard';
import MonthlyTransactionsChart from '../../components/admin/MonthlyTransactionsChart';
import DepositsVsWithdrawalsChart from '../../components/admin/DepositsVsWithdrawalsChart';
import CustomerGrowthChart from '../../components/admin/CustomerGrowthChart';
import LoanStatisticsChart from '../../components/admin/LoanStatisticsChart';
import TransactionVolumeChart from '../../components/admin/TransactionVolumeChart';
import {
  ShieldCheck,
  Users,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  FileText,
  Clock,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [suspiciousList, setSuspiciousList] = useState([]);
  const [depWithSummary, setDepWithSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [response, depWithRes] = await Promise.allSettled([
        adminService.getDashboardStats(),
        depositWithdrawalService.getAdminRequests({ limit: 1 }),
      ]);

      if (response.status === 'fulfilled' && response.value.success) {
        setStats(response.value.data.statistics);
        setCharts(response.value.data.charts);
        setSuspiciousList(response.value.data.recentSuspiciousTransactions || []);
      } else if (response.status === 'rejected') {
        setError('Failed to load dashboard data');
      }

      if (depWithRes.status === 'fulfilled' && depWithRes.value?.summary) {
        setDepWithSummary(depWithRes.value.summary);
      }
    } catch (err) {
      console.error('Error fetching admin dashboard:', err);
      setError(err.message || 'Unable to connect to admin dashboard service.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-[var(--finova-deep)] border border-[var(--finova-border)] p-6 md:p-8 shadow-xl text-white">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 tracking-wider uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                FINOVA ADMIN COMMAND CENTER
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                System Live
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back to Finova Admin, {user?.name || 'Administrator'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Finova system-wide real-time banking telemetry, liquidity metrics, and institutional oversight.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDashboardData(true)}
              disabled={refreshing || loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-white/10 hover:bg-white/20 border border-white/20 transition duration-150 disabled:opacity-50 shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Metrics'}
            </button>
          </div>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchDashboardData()}
            className="text-xs bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 px-3 py-1 rounded-lg border border-rose-500/30"
          >
            Retry
          </button>
        </div>
      )}

      {/* Deposit & Withdrawal Requests Action Widget */}
      <div className="rounded-3xl p-5 md:p-6 bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-[var(--finova-primary)]/10 text-[var(--finova-primary)] flex items-center justify-center font-bold border border-[var(--finova-primary)]/20 shrink-0">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--finova-text-heading)]">
              Deposit & Withdrawal Requests
            </h3>
            <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="text-[var(--finova-text-secondary)]">Pending Deposits:</span>
                <span className="font-extrabold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {depWithSummary?.pendingDeposits ?? stats?.pendingDepositRequests ?? 0}
                </span>
              </span>
              <span className="text-[var(--finova-text-muted)]">•</span>
              <span className="flex items-center gap-1.5">
                <span className="text-[var(--finova-text-secondary)]">Pending Withdrawals:</span>
                <span className="font-extrabold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20">
                  {depWithSummary?.pendingWithdrawals ?? stats?.pendingWithdrawalRequests ?? 0}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/deposit-withdrawal">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--finova-primary)] hover:opacity-90 text-white text-xs font-bold shadow-xs transition-opacity">
              <span>Review Requests</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </Link>
        </div>
      </div>

      {/* 8 Statistics Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--finova-text-heading)] tracking-tight">Key Performance Indicators</h2>
          <span className="text-xs text-[var(--finova-text-secondary)]">Aggregated across all banking branches</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-[var(--finova-card-bg)] animate-pulse border border-[var(--finova-border)]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Customers */}
            <StatCard
              title="Total Customers"
              value={stats?.totalCustomers ?? 0}
              subtitle="Registered active users"
              icon={Users}
              color="indigo"
            />

            {/* 2. Total Accounts */}
            <StatCard
              title="Total Accounts"
              value={stats?.totalAccounts ?? 0}
              subtitle="Savings & Current accounts"
              icon={CreditCard}
              color="cyan"
            />

            {/* 3. Total Deposits */}
            <StatCard
              title="Total Deposits"
              value={stats?.totalDeposits?.amount ?? 0}
              prefix="₹"
              subtitle={`${stats?.totalDeposits?.count ?? 0} completed transactions`}
              icon={ArrowDownLeft}
              color="emerald"
            />

            {/* 4. Total Withdrawals */}
            <StatCard
              title="Total Withdrawals"
              value={stats?.totalWithdrawals?.amount ?? 0}
              prefix="₹"
              subtitle={`${stats?.totalWithdrawals?.count ?? 0} completed transactions`}
              icon={ArrowUpRight}
              color="rose"
            />

            {/* 5. Total Transfers */}
            <StatCard
              title="Total Transfers"
              value={stats?.totalTransfers?.amount ?? 0}
              prefix="₹"
              subtitle={`${stats?.totalTransfers?.count ?? 0} peer-to-peer transfers`}
              icon={ArrowLeftRight}
              color="violet"
            />

            {/* 6. Total Loans */}
            <StatCard
              title="Total Loans"
              value={stats?.totalLoans?.count ?? 0}
              subtitle={`Total: ${formatCurrency(stats?.totalLoans?.totalAmount ?? 0)}`}
              icon={FileText}
              color="blue"
            />

            {/* 7. Pending Loans */}
            <StatCard
              title="Pending Loans"
              value={stats?.pendingLoans?.count ?? 0}
              subtitle={`Awaiting review: ${formatCurrency(stats?.pendingLoans?.totalAmount ?? 0)}`}
              icon={Clock}
              color="amber"
            />

            {/* 8. Suspicious Transactions */}
            <StatCard
              title="Suspicious Activity"
              value={stats?.suspiciousTransactions?.count ?? 0}
              subtitle="Failed or high-value flagged"
              icon={AlertTriangle}
              color="red"
            />
          </div>
        )}
      </div>

      {/* Recharts Visualizations Grid */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-[var(--finova-text-heading)] tracking-tight">System Analytics & Trends</h2>

        {/* Top Row: Monthly Transactions & Deposits vs Withdrawals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MonthlyTransactionsChart data={charts?.monthlyTransactions || []} />
          <DepositsVsWithdrawalsChart data={charts?.depositsVsWithdrawals || []} />
        </div>

        {/* Bottom Row: Customer Growth, Loan Breakdown, Transaction Volume */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CustomerGrowthChart data={charts?.customerGrowth || []} />
          <LoanStatisticsChart data={charts?.loanStatistics || []} />
          <TransactionVolumeChart data={charts?.transactionVolume || []} />
        </div>
      </div>

      {/* Flagged / Suspicious Transactions Audit Table */}
      <div className="bg-[var(--finova-card-bg)] border border-[var(--finova-border)] rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="text-lg font-bold text-[var(--finova-text-heading)] tracking-tight">Suspicious Transactions Audit Log</h3>
            </div>
            <p className="text-xs text-[var(--finova-text-secondary)] mt-1">
              Transactions marked for AML scrutiny (Amount ≥ ₹50,000 or status is Failed)
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] border border-[var(--finova-border)] self-start sm:self-auto">
            Showing latest {suspiciousList.length} items
          </span>
        </div>

        {suspiciousList.length === 0 ? (
          <div className="p-8 text-center bg-[var(--finova-bg-secondary)] rounded-2xl border border-dashed border-[var(--finova-border)]">
            <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-[var(--finova-text-heading)] font-medium text-sm">No suspicious transactions detected</p>
            <p className="text-[var(--finova-text-muted)] text-xs mt-1">All processed transactions pass standard security parameters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[var(--finova-text-secondary)]">
              <thead className="bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] uppercase tracking-wider text-[11px] border-b border-[var(--finova-border)]">
                <tr>
                  <th className="py-3 px-4 rounded-l-lg">Transaction ID</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Customer / Sender</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Flag Reason</th>
                  <th className="py-3 px-4 rounded-r-lg">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--finova-border-light)]">
                {suspiciousList.map((tx) => {
                  const isHighValue = (tx.amount || 0) >= 50000;
                  const isFailed = tx.status === 'FAILED';
                  return (
                    <tr key={tx._id} className="hover:bg-[var(--finova-card-hover)] transition duration-150">
                      <td className="py-3.5 px-4 font-mono text-brand-500 font-medium">
                        {tx.transactionId || tx._id}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-semibold text-[10px] bg-[var(--finova-bg-secondary)] text-[var(--finova-text-heading)] border border-[var(--finova-border)]">
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-[var(--finova-text-heading)] font-medium">
                          {tx.user?.name || tx.senderAccount?.user?.name || 'External / System'}
                        </div>
                        <div className="text-[var(--finova-text-muted)] text-[10px] font-mono">
                          {tx.senderAccount?.accountNumber || tx.receiverAccount || 'N/A'}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[var(--finova-text-heading)]">
                        {formatCurrency(tx.amount || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            tx.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : tx.status === 'FAILED'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {isHighValue && isFailed ? (
                          <span className="text-rose-500 font-medium">High Value & Failed</span>
                        ) : isHighValue ? (
                          <span className="text-amber-500 font-medium">High Value (≥₹50,000)</span>
                        ) : (
                          <span className="text-rose-500 font-medium">Failed Transaction</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--finova-text-muted)]">
                        {tx.createdAt ? new Date(tx.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
