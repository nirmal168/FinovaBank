import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Landmark,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
  Eye,
  Check,
  X,
  FileText,
  DollarSign,
  Percent,
  Calendar,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const AdminLoans = () => {
  const { showToast } = useToast();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Modal details and actions
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Decision state
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [loanToReject, setLoanToReject] = useState(null);

  const fetchLoans = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = { page, limit: 10 };
      if (typeFilter !== 'ALL') params.loanType = typeFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await adminService.getLoans(params);
      if (res.success) {
        setLoans(res.data.loans || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Error fetching loans:', err);
      setError(err.message || 'Failed to load loan applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans(1);
  }, [typeFilter, statusFilter]);

  const handleApprove = async (loan) => {
    if (!window.confirm(`Approve ${loan.loanType} loan for ${formatCurrency(loan.amount)}?`)) return;

    try {
      setActionLoadingId(loan._id);
      const res = await adminService.approveLoan(loan._id);
      if (res.success) {
        setLoans((prev) =>
          prev.map((l) => (l._id === loan._id ? { ...l, status: 'Approved', approvedDate: new Date() } : l))
        );
        if (selectedLoan && selectedLoan._id === loan._id) {
          setSelectedLoan((prev) => ({ ...prev, status: 'Approved', approvedDate: new Date() }));
        }
        setActionSuccess(`Loan #${loan._id} successfully approved!`);
        showToast(`Loan #${loan._id} successfully approved!`, 'success');
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      showToast(err.message || 'Failed to approve loan', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openRejectModal = (loan) => {
    setLoanToReject(loan);
    setRejectReason('Application does not meet credit underwriting criteria');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!loanToReject) return;

    try {
      setActionLoadingId(loanToReject._id);
      const res = await adminService.rejectLoan(loanToReject._id, rejectReason);
      if (res.success) {
        setLoans((prev) =>
          prev.map((l) => (l._id === loanToReject._id ? { ...l, status: 'Rejected', rejectedDate: new Date() } : l))
        );
        if (selectedLoan && selectedLoan._id === loanToReject._id) {
          setSelectedLoan((prev) => ({ ...prev, status: 'Rejected', rejectedDate: new Date() }));
        }
        setActionSuccess(`Loan #${loanToReject._id} has been rejected.`);
        showToast(`Loan #${loanToReject._id} rejected.`, 'info');
        setIsRejectModalOpen(false);
        setTimeout(() => setActionSuccess(null), 4000);
      }
    } catch (err) {
      showToast(err.message || 'Failed to reject loan', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const openDetails = (loan) => {
    setSelectedLoan(loan);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[var(--finova-deep)] border border-[var(--finova-border)] p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20">
              <Landmark className="w-3.5 h-3.5" />
              Credit & Underwriting Portal
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Loan Applications Review</h1>
          <p className="text-xs text-slate-300 mt-1">
            Underwrite Personal, Education, Home, and Vehicle loans and issue formal approvals or rejections.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchLoans(pagination.page)}
            disabled={loading}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Success alert */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-[var(--finova-card-bg)] p-4 rounded-2xl border border-[var(--finova-border)] shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border-light)] p-1 rounded-xl">
          {['ALL', 'Personal', 'Education', 'Home', 'Vehicle'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                typeFilter === type
                  ? 'bg-[var(--finova-card-bg)] text-[var(--finova-text-heading)] shadow-xs'
                  : 'text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)]'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border-light)] p-1 rounded-xl">
          {['ALL', 'Pending', 'Approved', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                statusFilter === st
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Loans Table */}
      <div className="bg-[var(--finova-card-bg)] rounded-2xl border border-[var(--finova-border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--finova-text-secondary)]">
            <thead className="bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] uppercase tracking-wider font-semibold border-b border-[var(--finova-border)]">
              <tr>
                <th className="py-3 px-4">Applicant</th>
                <th className="py-3 px-4">Loan Category</th>
                <th className="py-3 px-4">Principal Amount</th>
                <th className="py-3 px-4">Tenure & APR</th>
                <th className="py-3 px-4">Monthly EMI</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Applied Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--finova-border-light)]">
              {loading && loans.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--finova-text-muted)]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading loan applications...
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-[var(--finova-text-muted)]">
                    No loan applications found matching the selected filters.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const isPending = loan.status === 'Pending';
                  const isApproved = loan.status === 'Approved';
                  const isRejected = loan.status === 'Rejected';
                  const isActionBusy = actionLoadingId === loan._id;

                  return (
                    <tr key={loan._id} className="hover:bg-[var(--finova-card-hover)] transition duration-150">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[var(--finova-text-heading)]">{loan.user?.name || 'Applicant'}</div>
                        <div className="text-[11px] text-[var(--finova-text-muted)]">{loan.user?.email || 'N/A'}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-[var(--finova-bg-secondary)] text-[var(--finova-text-heading)] border border-[var(--finova-border-light)]">
                          {loan.loanType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[var(--finova-text-heading)] text-sm">
                        {formatCurrency(loan.amount || 0)}
                      </td>
                      <td className="py-3.5 px-4 text-[var(--finova-text-secondary)]">
                        <div>{loan.tenure} months</div>
                        <div className="text-[10px] text-[var(--finova-text-muted)] font-semibold">{loan.interestRate}% APR</div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-brand-500 text-sm">
                        {formatCurrency(loan.emi || 0)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : isPending
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isApproved && <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                          {isPending && <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                          {isRejected && <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
                          {loan.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--finova-text-muted)]">
                        {loan.applicationDate ? new Date(loan.applicationDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1">
                        <button
                          onClick={() => openDetails(loan)}
                          className="p-1.5 rounded-lg text-[var(--finova-text-secondary)] hover:text-brand-500 hover:bg-brand-500/10 transition"
                          title="View Application Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApprove(loan)}
                              disabled={isActionBusy}
                              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-500/10 transition"
                              title="Approve Application"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openRejectModal(loan)}
                              disabled={isActionBusy}
                              className="p-1.5 rounded-lg text-rose-600 dark:text-rose-400 hover:text-rose-800 hover:bg-rose-500/10 transition"
                              title="Reject Application"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-[var(--finova-border-light)] flex items-center justify-between text-xs text-[var(--finova-text-secondary)]">
            <span>
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total loans)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchLoans(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => fetchLoans(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Loan Details Modal */}
      {selectedLoan && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Loan Application — ${selectedLoan.loanType} Credit`}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold">Requested Principal</span>
                <div className="text-2xl font-black text-slate-900 mt-0.5">
                  {formatCurrency(selectedLoan.amount || 0)}
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  selectedLoan.status === 'Approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : selectedLoan.status === 'Pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {selectedLoan.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Applicant Name</span>
                <span className="font-semibold text-[var(--finova-text-heading)]">{selectedLoan.user?.name}</span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Email & Phone</span>
                <span className="text-[var(--finova-text-secondary)]">{selectedLoan.user?.email}</span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Monthly EMI</span>
                <span className="font-bold text-brand-500 text-sm">{formatCurrency(selectedLoan.emi || 0)}</span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Total Remaining Payable</span>
                <span className="font-bold text-[var(--finova-text-heading)]">{formatCurrency(selectedLoan.remainingAmount || 0)}</span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Declared Annual Income</span>
                <span className="font-semibold text-[var(--finova-text-heading)]">
                  {selectedLoan.annualIncome ? formatCurrency(selectedLoan.annualIncome) : 'Not declared'}
                </span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Employment Status</span>
                <span className="font-semibold text-[var(--finova-text-heading)]">{selectedLoan.employmentStatus || 'Unspecified'}</span>
              </div>
              {selectedLoan.purpose && (
                <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl col-span-2">
                  <span className="text-[var(--finova-text-muted)] block mb-1">Stated Purpose</span>
                  <span className="text-[var(--finova-text-secondary)]">{selectedLoan.purpose}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {selectedLoan.status === 'Pending' ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleApprove(selectedLoan)}
                    disabled={actionLoadingId === selectedLoan._id}
                  >
                    Approve Loan
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => openRejectModal(selectedLoan)}
                    disabled={actionLoadingId === selectedLoan._id}
                  >
                    Reject Loan
                  </Button>
                </div>
              ) : (
                <div className="text-xs text-slate-400">
                  Decision finalized on{' '}
                  {selectedLoan.approvedDate
                    ? new Date(selectedLoan.approvedDate).toLocaleDateString()
                    : selectedLoan.rejectedDate
                    ? new Date(selectedLoan.rejectedDate).toLocaleDateString()
                    : 'N/A'}
                </div>
              )}
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Modal */}
      {loanToReject && (
        <Modal
          isOpen={isRejectModalOpen}
          onClose={() => setIsRejectModalOpen(false)}
          title="Reject Loan Application"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Please enter the underwriting reason for rejecting application #{loanToReject._id} for{' '}
              <strong>{loanToReject.user?.name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reason for Rejection
              </label>
              <textarea
                rows="3"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 focus:outline-none"
                placeholder="Specify credit criteria failure..."
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRejectModalOpen(false)}
                disabled={actionLoadingId === loanToReject._id}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmReject}
                disabled={actionLoadingId === loanToReject._id}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminLoans;
