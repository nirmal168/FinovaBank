import React, { useState, useEffect } from 'react';
import serviceRequestService from '../../services/serviceRequestService';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import {
  BookOpen,
  FileCheck2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  User,
  MapPin,
  Check,
  Send,
} from 'lucide-react';

const AdminServiceRequests = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('cheque'); // 'cheque' | 'passbook'
  const [chequeList, setChequeList] = useState([]);
  const [passbookList, setPassbookList] = useState([]);
  const [chequeStats, setChequeStats] = useState({ total: 0, pendingCount: 0, issuedCount: 0, rejectedCount: 0 });
  const [passbookStats, setPassbookStats] = useState({ total: 0, pendingCount: 0, issuedCount: 0, rejectedCount: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Modal State for Issue / Action
  const [selectedItem, setSelectedItem] = useState(null); // Cheque or Passbook object
  const [modalType, setModalType] = useState(null); // 'issue' | 'reject'
  const [customSeries, setCustomSeries] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchRequests = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const params = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const [chqRes, pbkRes] = await Promise.all([
        serviceRequestService.getAdminChequeBooks(params),
        serviceRequestService.getAdminPassbooks(params),
      ]);

      if (chqRes.success) {
        setChequeList(chqRes.data.requests || []);
        setChequeStats(chqRes.data.stats || {});
      }

      if (pbkRes.success) {
        setPassbookList(pbkRes.data.requests || []);
        setPassbookStats(pbkRes.data.stats || {});
      }
    } catch (err) {
      console.error('Failed to load admin service requests:', err);
      showToast(err.message || 'Failed to load requests', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleOpenActionModal = (item, type) => {
    setSelectedItem(item);
    setModalType(type);
    setActionError('');
    setAdminNotes('');
    if (type === 'issue') {
      if (activeTab === 'cheque') {
        const randStart = Math.floor(100000 + Math.random() * 900000);
        const randEnd = randStart + (item.numberOfLeaves - 1);
        setCustomSeries(`CHQ-${randStart} to CHQ-${randEnd}`);
      } else {
        const rand = Math.floor(100000 + Math.random() * 900000);
        setCustomSeries(`PBK-${new Date().getFullYear()}-${rand}`);
      }
    }
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      setProcessing(true);
      setActionError('');

      if (activeTab === 'cheque') {
        const payload = {
          status: modalType === 'issue' ? 'Issued' : 'Rejected',
          adminNotes,
        };
        if (modalType === 'issue') payload.chequeBookSeries = customSeries;

        const res = await serviceRequestService.processChequeBook(selectedItem._id, payload);
        if (res.success) {
          showToast(`Cheque book request #${selectedItem._id.substring(0, 8)} marked as ${payload.status}`, 'success');
          setSelectedItem(null);
          setModalType(null);
          fetchRequests();
        }
      } else {
        const payload = {
          status: modalType === 'issue' ? 'Issued' : 'Rejected',
          adminNotes,
        };
        if (modalType === 'issue') payload.passbookNumber = customSeries;

        const res = await serviceRequestService.processPassbook(selectedItem._id, payload);
        if (res.success) {
          showToast(`Passbook request #${selectedItem._id.substring(0, 8)} marked as ${payload.status}`, 'success');
          setSelectedItem(null);
          setModalType(null);
          fetchRequests();
        }
      }
    } catch (err) {
      setActionError(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setProcessing(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Pending Approval
          </span>
        );
      case 'Issued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Issued
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const currentStats = activeTab === 'cheque' ? chequeStats : passbookStats;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
              Admin Authority Console
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Cheque & Passbook Issuance Center
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Review customer applications, assign official bank serial numbers, and approve or issue physical cheque books and passbooks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRequests(true)}
            disabled={loading || refreshing}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[var(--finova-card-bg)] border border-amber-500/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 block uppercase tracking-wider">
              Pending Approval / To Issue
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[var(--finova-text-heading)] mt-1 block">
              {currentStats.pendingCount || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--finova-card-bg)] border border-emerald-500/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block uppercase tracking-wider">
              Officially Issued
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[var(--finova-text-heading)] mt-1 block">
              {currentStats.issuedCount || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[var(--finova-text-muted)] block uppercase tracking-wider">
              Total Applications
            </span>
            <span className="text-2xl sm:text-3xl font-black text-[var(--finova-text-heading)] mt-1 block">
              {currentStats.total || 0}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)]">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--finova-border)] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('cheque')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'cheque'
                ? 'bg-[var(--finova-deep)] text-white shadow-xs'
                : 'text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Cheque Book Requests ({chequeList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('passbook')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'passbook'
                ? 'bg-[var(--finova-deep)] text-white shadow-xs'
                : 'text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)]'
            }`}
          >
            <FileCheck2 className="w-4 h-4" />
            <span>Passbook Requests ({passbookList.length})</span>
          </button>
        </div>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[var(--finova-text-muted)] flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] font-semibold"
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending Only</option>
            <option value="Issued">Issued Only</option>
            <option value="Rejected">Rejected Only</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Loading customer applications..." />
        </div>
      ) : activeTab === 'cheque' ? (
        chequeList.length === 0 ? (
          <Card className="text-center py-16 p-6">
            <CardContent className="space-y-3">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                No Cheque Book Applications
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No customer requests found matching the current filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-[var(--finova-card-bg)] rounded-2xl border border-[var(--finova-border)] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--finova-bg-secondary)] border-b border-[var(--finova-border)] text-[var(--finova-text-muted)] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Account Number</th>
                    <th className="py-3.5 px-4">Leaves Requested</th>
                    <th className="py-3.5 px-4">Status / Series</th>
                    <th className="py-3.5 px-4">Applied Date</th>
                    <th className="py-3.5 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--finova-border)]">
                  {chequeList.map((item) => (
                    <tr key={item._id} className="hover:bg-[var(--finova-bg-secondary)]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--finova-text-heading)]">
                          {item.user?.name || 'Customer'}
                        </div>
                        <div className="text-[11px] text-[var(--finova-text-muted)]">
                          {item.user?.email || 'N/A'} • {item.user?.customerId || ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-[var(--finova-text-heading)]">
                          #{item.account?.accountNumber || 'N/A'}
                        </div>
                        <div className="text-[10px] text-[var(--finova-text-muted)]">
                          {item.accountType}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[var(--finova-text-heading)]">
                          {item.numberOfLeaves} Leaves
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div>{renderStatusBadge(item.status)}</div>
                          {item.chequeBookSeries && (
                            <div className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {item.chequeBookSeries}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--finova-text-muted)]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleOpenActionModal(item, 'issue')}
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-1" />
                              Issue Cheque Book
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-rose-300 text-rose-600 hover:bg-rose-50"
                              onClick={() => handleOpenActionModal(item, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--finova-text-muted)] italic">
                            Completed ({item.status})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        passbookList.length === 0 ? (
          <Card className="text-center py-16 p-6">
            <CardContent className="space-y-3">
              <FileCheck2 className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                No Passbook Applications
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No customer requests found matching the current filter.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-[var(--finova-card-bg)] rounded-2xl border border-[var(--finova-border)] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--finova-bg-secondary)] border-b border-[var(--finova-border)] text-[var(--finova-text-muted)] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Account Number</th>
                    <th className="py-3.5 px-4">Request Type</th>
                    <th className="py-3.5 px-4">Status / Passbook #</th>
                    <th className="py-3.5 px-4">Applied Date</th>
                    <th className="py-3.5 px-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--finova-border)]">
                  {passbookList.map((item) => (
                    <tr key={item._id} className="hover:bg-[var(--finova-bg-secondary)]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--finova-text-heading)]">
                          {item.user?.name || 'Customer'}
                        </div>
                        <div className="text-[11px] text-[var(--finova-text-muted)]">
                          {item.user?.email || 'N/A'} • {item.user?.customerId || ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-[var(--finova-text-heading)]">
                          #{item.account?.accountNumber || 'N/A'}
                        </div>
                        <div className="text-[10px] text-[var(--finova-text-muted)]">
                          {item.accountType}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[var(--finova-text-heading)]">
                          {item.requestType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div>{renderStatusBadge(item.status)}</div>
                          {item.passbookNumber && (
                            <div className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              {item.passbookNumber}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--finova-text-muted)]">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.status === 'Pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={() => handleOpenActionModal(item, 'issue')}
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-1" />
                              Issue Passbook
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-rose-300 text-rose-600 hover:bg-rose-50"
                              onClick={() => handleOpenActionModal(item, 'reject')}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[var(--finova-text-muted)] italic">
                            Completed ({item.status})
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Action Modal (Issue or Reject) */}
      <Modal
        isOpen={!!selectedItem && !!modalType}
        onClose={() => {
          setSelectedItem(null);
          setModalType(null);
        }}
        title={
          modalType === 'issue'
            ? activeTab === 'cheque'
              ? 'Approve & Issue Cheque Book'
              : 'Approve & Issue Bank Passbook'
            : 'Decline Service Application'
        }
      >
        <form onSubmit={handleConfirmAction} className="space-y-4">
          {actionError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-xs space-y-1">
            <div>
              <span className="text-[var(--finova-text-muted)]">Customer: </span>
              <strong className="text-[var(--finova-text-heading)]">{selectedItem?.user?.name}</strong>
            </div>
            <div>
              <span className="text-[var(--finova-text-muted)]">Account Number: </span>
              <strong className="font-mono text-[var(--finova-text-heading)]">#{selectedItem?.account?.accountNumber}</strong>
            </div>
            <div>
              <span className="text-[var(--finova-text-muted)]">Details: </span>
              <strong className="text-[var(--finova-text-heading)]">
                {activeTab === 'cheque'
                  ? `${selectedItem?.numberOfLeaves} Cheque Leaves`
                  : `${selectedItem?.requestType}`}
              </strong>
            </div>
          </div>

          {modalType === 'issue' ? (
            <div>
              <label className="block text-xs font-bold text-[var(--finova-text-heading)] mb-1.5">
                {activeTab === 'cheque' ? 'Official Cheque Leaf Series' : 'Official Passbook Serial Number'}
              </label>
              <Input
                value={customSeries}
                onChange={(e) => setCustomSeries(e.target.value)}
                placeholder={activeTab === 'cheque' ? 'e.g. CHQ-100001 to CHQ-100025' : 'e.g. PBK-2026-98102'}
                required
              />
              <span className="text-[11px] text-[var(--finova-text-muted)] mt-1 block">
                Auto-assigned unique series. You may customize it according to your bank physical register.
              </span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-bold text-[var(--finova-text-heading)] mb-1.5">
                Reason for Rejection
              </label>
              <Input
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Incomplete address verification or minimum balance requirement"
                required
              />
            </div>
          )}

          {modalType === 'issue' && (
            <div>
              <label className="block text-xs font-bold text-[var(--finova-text-heading)] mb-1.5">
                Admin Dispatch Notes (Optional)
              </label>
              <Input
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Dispatched via courier tracking #FIN-87291"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setSelectedItem(null);
                setModalType(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={modalType === 'issue' ? 'primary' : 'outline'}
              size="sm"
              type="submit"
              disabled={processing}
              className={modalType === 'issue' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'border-rose-300 text-rose-600 hover:bg-rose-50'}
            >
              {processing
                ? 'Processing...'
                : modalType === 'issue'
                ? 'Confirm & Issue Document'
                : 'Confirm Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminServiceRequests;
