import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  ArrowRight,
  Info,
  Clock,
  User,
  Wallet,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const FraudAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [stats, setStats] = useState({
    totalAlerts: 0,
    pendingCount: 0,
    highRiskCount: 0,
    resolvedCount: 0,
  });

  // Review Modal State
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  const fetchAlerts = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (riskFilter !== 'ALL') params.riskLevel = riskFilter;

      const res = await adminService.getFraudAlerts(params);
      if (res.success) {
        setAlerts(res.data || []);
        setPagination(res.pagination || { page: 1, pages: 1, total: 0 });
        if (res.stats) {
          setStats(res.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching fraud alerts:', err);
      setError(err.message || 'Failed to load fraud alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts(1);
  }, [statusFilter, riskFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchAlerts(1);
  };

  const handleOpenReview = async (alert) => {
    setSelectedAlert(alert);
    setResolutionNotes('');
    setActionSuccess('');
    setActionError('');
    setIsModalOpen(true);

    // Fetch freshest details
    try {
      const res = await adminService.getFraudAlertById(alert._id);
      if (res.success) {
        setSelectedAlert(res.data);
      }
    } catch (err) {
      console.warn('Could not refresh full alert details:', err);
    }
  };

  const handleResolveAlert = async (actionType) => {
    if (!selectedAlert) return;
    try {
      setActionLoading(true);
      setActionError('');
      setActionSuccess('');

      const res = await adminService.resolveFraudAlert(selectedAlert._id, {
        action: actionType,
        notes: resolutionNotes,
      });

      if (res.success) {
        setActionSuccess(`Alert resolved with action: ${actionType}`);
        setSelectedAlert(res.data);
        fetchAlerts(pagination.page);
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1500);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to execute action');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissAlert = async () => {
    if (!selectedAlert) return;
    try {
      setActionLoading(true);
      setActionError('');
      setActionSuccess('');

      const res = await adminService.dismissFraudAlert(selectedAlert._id, {
        notes: resolutionNotes || 'Dismissed as false positive',
      });

      if (res.success) {
        setActionSuccess('Alert dismissed as false positive');
        setSelectedAlert(res.data);
        fetchAlerts(pagination.page);
        setTimeout(() => {
          setIsModalOpen(false);
        }, 1500);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to dismiss alert');
    } finally {
      setActionLoading(false);
    }
  };

  const getRiskBadge = (score, level) => {
    if (level === 'HIGH' || score >= 71) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <AlertOctagon className="w-3.5 h-3.5 text-rose-600 shrink-0" />
          HIGH ({score})
        </span>
      );
    }
    if (level === 'MEDIUM' || score >= 31) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          MEDIUM ({score})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        LOW ({score})
      </span>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Pending Review
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            Resolved
          </span>
        );
      case 'DISMISSED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <XCircle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            Dismissed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--finova-text-heading)] flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <ShieldAlert className="w-6 h-6" />
            </div>
            Fraud Detection & Risk Management
          </h1>
          <p className="text-sm text-[var(--finova-text-secondary)] mt-1">
            Real-time rule-based threat monitoring, transaction velocity tracking, and institutional fraud alerts.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAlerts(pagination.page)}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-500' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-[var(--finova-text-muted)] uppercase tracking-wider">Total Alerts</p>
            <p className="text-2xl font-black text-[var(--finova-text-heading)] mt-1">{stats.totalAlerts}</p>
          </div>
          <div className="p-3 rounded-xl bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] border border-[var(--finova-border-light)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--finova-card-bg)] border border-rose-500/30 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-rose-500 uppercase tracking-wider">High Risk Incidents</p>
            <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.highRiskCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
            <AlertOctagon className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--finova-card-bg)] border border-amber-500/30 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-amber-500 uppercase tracking-wider">Pending Clearance</p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.pendingCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[var(--finova-card-bg)] border border-emerald-500/30 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider">Resolved Cases</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.resolvedCount}</p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-[var(--finova-text-muted)]" />
            <input
              type="text"
              placeholder="Search by customer name, account number, or detection reason..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] placeholder:text-[var(--finova-text-muted)] rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl text-[var(--finova-text-heading)] focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL" className="bg-[var(--finova-card-bg)]">All Statuses</option>
              <option value="PENDING" className="bg-[var(--finova-card-bg)]">Pending Review</option>
              <option value="RESOLVED" className="bg-[var(--finova-card-bg)]">Resolved</option>
              <option value="DISMISSED" className="bg-[var(--finova-card-bg)]">Dismissed</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="px-3 py-2 text-xs font-medium bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl text-[var(--finova-text-heading)] focus:outline-hidden focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL" className="bg-[var(--finova-card-bg)]">All Risk Levels</option>
              <option value="HIGH" className="bg-[var(--finova-card-bg)]">High Risk (71-100)</option>
              <option value="MEDIUM" className="bg-[var(--finova-card-bg)]">Medium Risk (31-70)</option>
              <option value="LOW" className="bg-[var(--finova-card-bg)]">Low Risk (0-30)</option>
            </select>

            <Button type="submit" variant="primary" size="sm" className="px-4">
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Fraud Alerts Table */}
      <div className="rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs overflow-hidden">
        {loading && alerts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
            <p className="text-sm font-medium text-[var(--finova-text-muted)]">Evaluating security alerts...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-medium text-[var(--finova-text-heading)]">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchAlerts(1)}>
              Retry
            </Button>
          </div>
        ) : alerts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="text-base font-semibold text-[var(--finova-text-heading)]">No Fraud Alerts Detected</h3>
            <p className="text-xs text-[var(--finova-text-muted)] max-w-sm mx-auto">
              All transactions are conforming to regular behavioral baselines and within acceptable risk thresholds.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--finova-border)] bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Transfer Route</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Risk Assessment</th>
                  <th className="py-3 px-4">Primary Heuristic</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--finova-border-light)]">
                {alerts.map((alert) => (
                  <tr key={alert._id} className="hover:bg-[var(--finova-card-hover)] transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-[var(--finova-text-secondary)]">
                      <div>{new Date(alert.createdAt).toLocaleDateString()}</div>
                      <div className="text-[10px] text-[var(--finova-text-muted)]">
                        {new Date(alert.createdAt).toLocaleTimeString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[var(--finova-text-heading)]">{alert.user?.name || 'Unknown User'}</div>
                      <div className="text-[10px] text-[var(--finova-text-muted)]">{alert.user?.email || 'N/A'}</div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[var(--finova-text-heading)]">#{alert.senderAccount}</span>
                        <ArrowRight className="w-3 h-3 text-[var(--finova-text-muted)] shrink-0" />
                        <span className="text-[var(--finova-text-secondary)]">#{alert.receiverAccount}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap font-bold text-[var(--finova-text-heading)]">
                      {formatCurrency(alert.amount || 0)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getRiskBadge(alert.riskScore, alert.riskLevel)}
                    </td>

                    <td className="py-3 px-4 max-w-xs truncate text-[var(--finova-text-secondary)]" title={alert.reason}>
                      {alert.reason}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {getStatusBadge(alert.status)}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenReview(alert)}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3 h-3" />
                        Review
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--finova-border-light)] bg-[var(--finova-bg-secondary)]">
            <span className="text-xs text-[var(--finova-text-secondary)]">
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total)
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page <= 1}
                onClick={() => fetchAlerts(pagination.page - 1)}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="xs"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchAlerts(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Review & Resolution Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        maxWidth="max-w-2xl"
        title="Fraud Incident Investigation & Action"
      >
        {selectedAlert && (
          <div className="space-y-5 text-xs text-[var(--finova-text-secondary)]">
            {/* Alert Header Summary */}
            <div className="p-4 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[var(--finova-text-heading)] text-sm">
                    Risk Score: {selectedAlert.riskScore}/100
                  </span>
                  {getRiskBadge(selectedAlert.riskScore, selectedAlert.riskLevel)}
                  {getStatusBadge(selectedAlert.status)}
                </div>
                <p className="text-[var(--finova-text-muted)] mt-1">
                  Incident recorded on {new Date(selectedAlert.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="text-right sm:self-auto self-end">
                <span className="text-[10px] uppercase text-[var(--finova-text-muted)] font-bold block">Transfer Value</span>
                <span className="text-xl font-black text-[var(--finova-text-heading)]">
                  {formatCurrency(selectedAlert.amount || 0)}
                </span>
              </div>
            </div>

            {/* Risk Factors Breakdown */}
            <div className="space-y-2">
              <h4 className="font-bold text-[var(--finova-text-heading)] flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Triggered Fraud Heuristics ({selectedAlert.factors?.length || 0})
              </h4>
              <div className="space-y-2">
                {selectedAlert.factors?.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] flex items-start gap-2.5"
                  >
                    <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shrink-0">
                      +{factor.points} pts
                    </span>
                    <div>
                      <span className="font-bold text-[var(--finova-text-heading)] text-[11px] block">{factor.rule}</span>
                      <p className="text-[var(--finova-text-secondary)] text-[11px] mt-0.5">{factor.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Counterparty & Routing Context */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
                <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--finova-text-muted)] block mb-1">
                  Sender (Originator)
                </span>
                <p className="font-bold text-[var(--finova-text-heading)]">{selectedAlert.user?.name || 'Customer'}</p>
                <p className="text-[var(--finova-text-muted)] text-[11px]">{selectedAlert.user?.email}</p>
                <p className="font-mono text-[var(--finova-text-secondary)] text-[11px] mt-1">Account: #{selectedAlert.senderAccount}</p>
              </div>

              <div className="p-3 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
                <span className="font-bold text-[11px] uppercase tracking-wider text-[var(--finova-text-muted)] block mb-1">
                  Beneficiary (Counterparty)
                </span>
                <p className="font-bold text-[var(--finova-text-heading)]">Target Recipient</p>
                <p className="font-mono text-[var(--finova-text-secondary)] text-[11px] mt-1">Account: #{selectedAlert.receiverAccount}</p>
                <p className="text-[var(--finova-text-muted)] text-[10px] mt-1">
                  Transaction Link:{' '}
                  {selectedAlert.transaction
                    ? selectedAlert.transaction.transactionId || selectedAlert.transaction._id
                    : 'Held prior to completion'}
                </p>
              </div>
            </div>

            {/* Action Feedback Messages */}
            {actionError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {actionSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {/* Resolution Form / Notes */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-semibold text-slate-700 block">
                Administrative Resolution Notes
              </label>
              <textarea
                rows={2}
                placeholder="Document investigation rationale, customer contact verification, or risk mitigation steps taken..."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                disabled={actionLoading}
              >
                Close
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleDismissAlert}
                disabled={actionLoading || selectedAlert.status === 'DISMISSED'}
                className="text-slate-600 border-slate-300 hover:bg-slate-100"
              >
                Dismiss (False Positive)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolveAlert('ACCOUNT_FROZEN')}
                disabled={actionLoading}
                className="text-rose-600 border-rose-200 hover:bg-rose-50"
              >
                <Lock className="w-3.5 h-3.5 mr-1" />
                Freeze Account
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => handleResolveAlert('RELEASED')}
                disabled={actionLoading || selectedAlert.status === 'RESOLVED'}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Unlock className="w-3.5 h-3.5 mr-1" />
                Approve & Release
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FraudAlerts;
