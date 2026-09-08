import React, { useState, useEffect } from 'react';
import accountService from '../../services/accountService';
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
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  MapPin,
  RefreshCw,
  Wallet,
  ShieldCheck,
} from 'lucide-react';

const ServiceRequests = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('cheque'); // 'cheque' | 'passbook'
  const [accounts, setAccounts] = useState([]);
  const [chequeRequests, setChequeRequests] = useState([]);
  const [passbookRequests, setPassbookRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cheque Modal State
  const [isChequeModalOpen, setIsChequeModalOpen] = useState(false);
  const [chequeAccountId, setChequeAccountId] = useState('');
  const [leaves, setLeaves] = useState(25);
  const [chequeAddress, setChequeAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [chequeSubmitting, setChequeSubmitting] = useState(false);
  const [chequeError, setChequeError] = useState('');

  // Passbook Modal State
  const [isPassbookModalOpen, setIsPassbookModalOpen] = useState(false);
  const [passbookAccountId, setPassbookAccountId] = useState('');
  const [passbookType, setPassbookType] = useState('New Passbook');
  const [passbookAddress, setPassbookAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [passbookSubmitting, setPassbookSubmitting] = useState(false);
  const [passbookError, setPassbookError] = useState('');

  const fetchData = async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);

      const [accRes, chqRes, pbkRes] = await Promise.all([
        accountService.getAccounts(),
        serviceRequestService.getCustomerChequeBooks(),
        serviceRequestService.getCustomerPassbooks(),
      ]);

      const activeAccs = (accRes.accounts || []).filter((a) => a.status !== 'Closed');
      setAccounts(activeAccs);
      if (activeAccs.length > 0) {
        if (!chequeAccountId) setChequeAccountId(activeAccs[0]._id);
        if (!passbookAccountId) setPassbookAccountId(activeAccs[0]._id);
      }

      setChequeRequests(chqRes.data || []);
      setPassbookRequests(pbkRes.data || []);
    } catch (err) {
      console.error('Failed to load service requests:', err);
      showToast(err.message || 'Failed to load service requests', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApplyChequeBook = async (e) => {
    e.preventDefault();
    setChequeError('');
    if (!chequeAccountId) {
      setChequeError('Please select a bank account');
      return;
    }

    try {
      setChequeSubmitting(true);
      const res = await serviceRequestService.applyChequeBook({
        accountId: chequeAccountId,
        numberOfLeaves: leaves,
        deliveryAddress: chequeAddress,
      });

      if (res.success) {
        showToast('Cheque book request submitted for admin review & issuance!', 'success');
        setIsChequeModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setChequeError(err.response?.data?.message || err.message || 'Failed to submit application');
    } finally {
      setChequeSubmitting(false);
    }
  };

  const handleApplyPassbook = async (e) => {
    e.preventDefault();
    setPassbookError('');
    if (!passbookAccountId) {
      setPassbookError('Please select a bank account');
      return;
    }

    try {
      setPassbookSubmitting(true);
      const res = await serviceRequestService.applyPassbook({
        accountId: passbookAccountId,
        requestType: passbookType,
        deliveryAddress: passbookAddress,
      });

      if (res.success) {
        showToast('Passbook request submitted for admin review & issuance!', 'success');
        setIsPassbookModalOpen(false);
        fetchData();
      }
    } catch (err) {
      setPassbookError(err.response?.data?.message || err.message || 'Failed to submit application');
    } finally {
      setPassbookSubmitting(false);
    }
  };

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" /> Pending Admin Issuance
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Approved
          </span>
        );
      case 'Issued':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-3.5 h-3.5" /> Issued & Dispatched
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Banking Services & Stationeries
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Cheque Book & Passbook Services
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-xl">
            Apply for physical personalized cheque books and official bank passbooks. Applications are verified, issued, and recorded by Finova bank administrators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchData(true)}
            disabled={loading || refreshing}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {activeTab === 'cheque' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsChequeModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Apply for Cheque Book
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPassbookModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Apply for Passbook
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-[var(--finova-border)] pb-2">
        <button
          onClick={() => setActiveTab('cheque')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'cheque'
              ? 'bg-[var(--finova-deep)] text-white shadow-xs'
              : 'text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)] hover:text-[var(--finova-text-heading)]'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Cheque Book Applications ({chequeRequests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('passbook')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'passbook'
              ? 'bg-[var(--finova-deep)] text-white shadow-xs'
              : 'text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)] hover:text-[var(--finova-text-heading)]'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Passbook Applications ({passbookRequests.length})</span>
        </button>
      </div>

      {/* Main Content List */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Loading your service requests..." />
        </div>
      ) : activeTab === 'cheque' ? (
        chequeRequests.length === 0 ? (
          <Card className="text-center py-16 p-6">
            <CardContent className="space-y-3">
              <BookOpen className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                No Cheque Book Requests
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have not requested any cheque books yet. Click "Apply for Cheque Book" above to submit an application.
              </p>
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={() => setIsChequeModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Apply Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {chequeRequests.map((req) => (
              <Card key={req._id} className="border border-[var(--finova-border)] hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        <BookOpen className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--finova-text-heading)]">
                          {req.numberOfLeaves}-Leaf Cheque Book
                        </h4>
                        <p className="text-[11px] text-[var(--finova-text-secondary)]">
                          Account #{req.account?.accountNumber || 'N/A'} ({req.accountType})
                        </p>
                      </div>
                    </div>
                    {renderStatusBadge(req.status)}
                  </div>

                  {req.status === 'Issued' && req.chequeBookSeries && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Issued Cheque Series:
                      </div>
                      <div className="font-mono font-black text-emerald-700 dark:text-emerald-200 mt-0.5 tracking-wider">
                        {req.chequeBookSeries}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                        Issued on: {new Date(req.issuedAt || req.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {req.adminNotes && (
                    <div className="p-2.5 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-xs text-[var(--finova-text-secondary)]">
                      <span className="font-bold text-[var(--finova-text-heading)]">Admin Note:</span> {req.adminNotes}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[var(--finova-border)] flex items-center justify-between text-[11px] text-[var(--finova-text-muted)]">
                    <span>Applied on: {new Date(req.createdAt).toLocaleDateString()}</span>
                    <span>Finova Secure Dispatch</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      ) : (
        passbookRequests.length === 0 ? (
          <Card className="text-center py-16 p-6">
            <CardContent className="space-y-3">
              <FileCheck2 className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                No Passbook Requests
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                You have not requested any passbooks yet. Click "Apply for Passbook" above to submit an application.
              </p>
              <div className="pt-2">
                <Button variant="primary" size="sm" onClick={() => setIsPassbookModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-1.5" /> Apply Now
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {passbookRequests.map((req) => (
              <Card key={req._id} className="border border-[var(--finova-border)] hover:shadow-md transition-shadow">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                        <FileCheck2 className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-[var(--finova-text-heading)]">
                          {req.requestType}
                        </h4>
                        <p className="text-[11px] text-[var(--finova-text-secondary)]">
                          Account #{req.account?.accountNumber || 'N/A'} ({req.accountType})
                        </p>
                      </div>
                    </div>
                    {renderStatusBadge(req.status)}
                  </div>

                  {req.status === 'Issued' && req.passbookNumber && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs">
                      <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" /> Official Passbook Number:
                      </div>
                      <div className="font-mono font-black text-emerald-700 dark:text-emerald-200 mt-0.5 tracking-wider">
                        {req.passbookNumber}
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                        Issued on: {new Date(req.issuedAt || req.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {req.adminNotes && (
                    <div className="p-2.5 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-xs text-[var(--finova-text-secondary)]">
                      <span className="font-bold text-[var(--finova-text-heading)]">Admin Note:</span> {req.adminNotes}
                    </div>
                  )}

                  <div className="pt-2 border-t border-[var(--finova-border)] flex items-center justify-between text-[11px] text-[var(--finova-text-muted)]">
                    <span>Applied on: {new Date(req.createdAt).toLocaleDateString()}</span>
                    <span>Official Bank Stamp Verified</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Apply Cheque Book Modal */}
      <Modal
        isOpen={isChequeModalOpen}
        onClose={() => setIsChequeModalOpen(false)}
        title="Apply for Personalized Cheque Book"
      >
        <form onSubmit={handleApplyChequeBook} className="space-y-4">
          {chequeError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{chequeError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--finova-text-heading)] mb-1.5">
              Select Linked Bank Account
            </label>
            <select
              value={chequeAccountId}
              onChange={(e) => setChequeAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)] text-[var(--finova-text-heading)] focus:outline-hidden"
              required
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.accountType} Account — #{acc.accountNumber} (Balance: ?{acc.balance})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--finova-text-heading)] mb-1.5">
              Cheque Book Leaf Count
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[20, 25, 50, 100].map((count) => (
                <button
                  type="button"
                  key={count}
                  onClick={() => setLeaves(count)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    leaves === count
                      ? 'bg-[var(--finova-deep)] text-white border-[var(--finova-deep)] shadow-xs'
                      : 'border-[var(--finova-border)] text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)]'
                  }`}
                >
                  {count} Leaves
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--finova-border)]">
            <span className="text-xs font-bold text-[var(--finova-text-heading)] block">
              Delivery Address
            </span>
            <Input
              label="Street Address"
              placeholder="e.g. 42 MG Road, Flat 3B"
              value={chequeAddress.street}
              onChange={(e) => setChequeAddress({ ...chequeAddress, street: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="City"
                placeholder="e.g. Mumbai"
                value={chequeAddress.city}
                onChange={(e) => setChequeAddress({ ...chequeAddress, city: e.target.value })}
              />
              <Input
                label="Postal PIN Code"
                placeholder="e.g. 400001"
                value={chequeAddress.postalCode}
                onChange={(e) => setChequeAddress({ ...chequeAddress, postalCode: e.target.value })}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300">
            <strong>Admin Verification Notice:</strong> Cheque books are generated and issued solely by the Finova bank branch manager. The series number will appear in your portal once approved.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsChequeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={chequeSubmitting}
            >
              {chequeSubmitting ? 'Submitting...' : 'Submit Cheque Application'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Apply Passbook Modal */}
      <Modal
        isOpen={isPassbookModalOpen}
        onClose={() => setIsPassbookModalOpen(false)}
        title="Apply for Bank Passbook"
      >
        <form onSubmit={handleApplyPassbook} className="space-y-4">
          {passbookError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{passbookError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-[var(--finova-text-heading)] mb-1.5">
              Select Linked Bank Account
            </label>
            <select
              value={passbookAccountId}
              onChange={(e) => setPassbookAccountId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)] text-[var(--finova-text-heading)] focus:outline-hidden"
              required
            >
              {accounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.accountType} Account — #{acc.accountNumber} (Balance: ?{acc.balance})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--finova-text-heading)] mb-1.5">
              Passbook Requirement Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['New Passbook', 'Renewal / Full', 'Duplicate / Lost'].map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setPassbookType(type)}
                  className={`py-2 px-2 text-[11px] font-bold rounded-xl border text-center transition-all ${
                    passbookType === type
                      ? 'bg-[var(--finova-deep)] text-white border-[var(--finova-deep)] shadow-xs'
                      : 'border-[var(--finova-border)] text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--finova-border)]">
            <span className="text-xs font-bold text-[var(--finova-text-heading)] block">
              Delivery Address
            </span>
            <Input
              label="Street Address"
              placeholder="e.g. 42 MG Road, Flat 3B"
              value={passbookAddress.street}
              onChange={(e) => setPassbookAddress({ ...passbookAddress, street: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="City"
                placeholder="e.g. Mumbai"
                value={passbookAddress.city}
                onChange={(e) => setPassbookAddress({ ...passbookAddress, city: e.target.value })}
              />
              <Input
                label="Postal PIN Code"
                placeholder="e.g. 400001"
                value={passbookAddress.postalCode}
                onChange={(e) => setPassbookAddress({ ...passbookAddress, postalCode: e.target.value })}
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-700 dark:text-cyan-300">
            <strong>Physical Issuance Policy:</strong> Passbooks are printed with official bank seal and serial numbers by bank staff. You can track issuance status in real time.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsPassbookModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={passbookSubmitting}
            >
              {passbookSubmitting ? 'Submitting...' : 'Submit Passbook Application'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ServiceRequests;
