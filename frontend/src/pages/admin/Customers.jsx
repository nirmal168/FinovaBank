import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  UserX,
  UserCheck,
  UserPlus,
  Eye,
  RefreshCw,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  KeyRound,
  Copy,
  Check,
  Snowflake,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const AdminCustomers = () => {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Modal details
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Status toggle action loading
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);

  // Create customer modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    phone: '',
    initialDeposit: '',
  });

  // Credentials dialog (shown immediately after customer creation)
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [hasCopied, setHasCopied] = useState(false);

  // Password reset dialog
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetCredentials, setResetCredentials] = useState(null);
  const [resetLoading, setResetLoading] = useState(false);

  // Card Issuance State
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [cardTargetCustomer, setCardTargetCustomer] = useState(null);
  const [cardForm, setCardForm] = useState({
    accountId: '',
    cardType: 'Visa Platinum Debit',
    pin: '',
    transactionLimit: 50000,
  });
  const [cardLoading, setCardLoading] = useState(false);
  const [cardResult, setCardResult] = useState(null);

  const openIssueCardModal = (customer) => {
    setCardTargetCustomer(customer);
    const defaultAcc = customer.accounts && customer.accounts.length > 0 ? customer.accounts[0]._id : '';
    setCardForm({
      accountId: defaultAcc,
      cardType: 'Visa Platinum Debit',
      pin: String(Math.floor(1000 + Math.random() * 9000)),
      transactionLimit: 50000,
    });
    setIsCardModalOpen(true);
  };

  const handleIssueCardSubmit = async (e) => {
    e.preventDefault();
    if (!cardTargetCustomer) return;
    try {
      setCardLoading(true);
      const res = await adminService.issueCard({
        userId: cardTargetCustomer._id,
        accountId: cardForm.accountId,
        cardType: cardForm.cardType,
        pin: cardForm.pin,
        transactionLimit: Number(cardForm.transactionLimit),
      });
      if (res.success) {
        setIsCardModalOpen(false);
        setCardResult({
          card: res.card,
          issuedPin: res.issuedPin || cardForm.pin,
          customerName: cardTargetCustomer.name,
        });
        showToast('Virtual debit card issued successfully!', 'success');
      } else {
        showToast(res.message || 'Failed to issue card', 'error');
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message || 'Error issuing card', 'error');
    } finally {
      setCardLoading(false);
    }
  };

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page,
        limit: 10,
      };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await adminService.getCustomers(params);
      if (res.success) {
        setCustomers(res.data.customers || []);
        setPagination(res.data.pagination || { page: 1, pages: 1, total: 0 });
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers(1);
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCustomers(1);
  };

  const handleUpdateStatus = async (customer, newStatus) => {
    try {
      setActionLoadingId(customer._id);
      const res = await adminService.updateCustomerStatus(customer._id, { status: newStatus });
      if (res.success) {
        setCustomers((prev) =>
          prev.map((c) =>
            c._id === customer._id
              ? { ...c, status: newStatus, isActive: newStatus === 'Active' }
              : c
          )
        );
        if (selectedCustomer && selectedCustomer._id === customer._id) {
          setSelectedCustomer((prev) => ({
            ...prev,
            status: newStatus,
            isActive: newStatus === 'Active',
          }));
        }
        const msg = `Customer ${customer.name} status updated to ${newStatus}.`;
        setActionSuccessMessage(msg);
        showToast(msg, 'success');
        setTimeout(() => setActionSuccessMessage(null), 4000);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update customer status', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!createFormData.name || !createFormData.email || !createFormData.phone) {
      showToast('Name, email, and phone number are required.', 'error');
      return;
    }

    try {
      setCreateLoading(true);
      const res = await adminService.createCustomer({
        name: createFormData.name.trim(),
        email: createFormData.email.trim(),
        phone: createFormData.phone.trim(),
        initialDeposit: createFormData.initialDeposit ? Number(createFormData.initialDeposit) : 0,
      });

      if (res.success) {
        setCreatedCredentials(res.credentials);
        setIsCreateModalOpen(false);
        setIsCredentialsModalOpen(true);
        setCreateFormData({ name: '', email: '', phone: '', initialDeposit: '' });
        showToast('Customer created successfully!', 'success');
        fetchCustomers(1);
      }
    } catch (err) {
      showToast(err.message || 'Failed to create customer account', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleResetPassword = async (customer) => {
    try {
      setResetLoading(true);
      const res = await adminService.resetCustomerPassword(customer._id);
      if (res.success) {
        setResetCredentials({
          name: customer.name,
          customerId: customer.customerId || ('FIN-CUS-' + customer._id.slice(-5).toUpperCase()),
          email: customer.email,
          temporaryPassword: res.temporaryPassword,
        });
        setIsResetModalOpen(true);
        showToast('Temporary password generated successfully.', 'success');
        fetchCustomers(pagination.page);
      }
    } catch (err) {
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setResetLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setHasCopied(true);
    showToast('Credentials copied to clipboard!', 'success');
    setTimeout(() => setHasCopied(false), 2500);
  };

  const openCustomerDetails = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[var(--finova-deep)] border border-[var(--finova-border)] p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-white border border-white/20">
              <Users className="w-3.5 h-3.5" />
              Customer Administration
            </span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Customer Management</h1>
          <p className="text-xs text-slate-300 mt-1">
            Create customer profiles, provision banking accounts, issue temporary credentials, and manage account statuses.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCustomers(pagination.page)}
            disabled={loading}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white border-none shadow-md gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            + Create Customer
          </Button>
        </div>
      </div>

      {/* Success alert */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="bg-[var(--finova-card-bg)] p-4 rounded-2xl border border-[var(--finova-border)] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center gap-2 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--finova-text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer ID, name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>
          <Button type="submit" variant="primary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--finova-text-muted)]">Status:</span>
          {['ALL', 'Active', 'Inactive', 'Frozen'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                statusFilter === st
                  ? 'bg-brand-500 text-white shadow-xs'
                  : 'bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] hover:bg-[var(--finova-card-hover)] border border-[var(--finova-border-light)]'
              }`}
            >
              {st === 'ALL' ? 'All Customers' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Data Table */}
      <div className="bg-[var(--finova-card-bg)] rounded-2xl border border-[var(--finova-border)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--finova-text-secondary)]">
            <thead className="bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] uppercase tracking-wider font-semibold border-b border-[var(--finova-border)]">
              <tr>
                <th className="py-3 px-4">Customer ID</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Accounts</th>
                <th className="py-3 px-4">Status & Flags</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--finova-border-light)]">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[var(--finova-text-muted)]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[var(--finova-text-muted)]">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const isOperating = actionLoadingId === c._id;
                  const displayCustomerId = c.customerId || ('FIN-CUS-' + c._id.slice(-5).toUpperCase());
                  const effectiveStatus = c.status || (c.isActive ? 'Active' : 'Inactive');

                  return (
                    <tr key={c._id} className="hover:bg-[var(--finova-card-hover)] transition duration-150">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-brand-600 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 text-[11px]">
                          {displayCustomerId}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs uppercase border border-brand-500/20 shrink-0">
                            {c.name ? c.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--finova-text-heading)]">{c.name}</div>
                            <div className="text-[10px] text-[var(--finova-text-muted)] truncate max-w-[140px]">{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[var(--finova-text-muted)] text-[11px]">
                          <Phone className="w-3.5 h-3.5 text-[var(--finova-text-muted)]" />
                          <span>{c.phone || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--finova-bg-secondary)] text-[var(--finova-text-heading)] font-bold text-xs border border-[var(--finova-border-light)]">
                          <CreditCard className="w-3.5 h-3.5 text-brand-500" />
                          {c.accountsCount || 0}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              effectiveStatus === 'Active'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                : effectiveStatus === 'Frozen'
                                ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {effectiveStatus === 'Active' && <CheckCircle2 className="w-3 h-3" />}
                            {effectiveStatus === 'Frozen' && <Snowflake className="w-3 h-3" />}
                            {effectiveStatus === 'Inactive' && <XCircle className="w-3 h-3" />}
                            {effectiveStatus}
                          </span>
                          {c.mustChangePassword && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                              First Login Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--finova-text-muted)]">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openCustomerDetails(c)}
                          className="p-1.5 rounded-lg text-[var(--finova-text-secondary)] hover:text-brand-500 hover:bg-brand-500/10 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleResetPassword(c)}
                          disabled={resetLoading}
                          className="p-1.5 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 transition"
                          title="Generate Temporary Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openIssueCardModal(c)}
                          className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-700 hover:bg-indigo-500/10 transition"
                          title="Issue Virtual Debit Card"
                        >
                          <CreditCard className="w-4 h-4" />
                        </button>
                        {effectiveStatus === 'Active' ? (
                          <button
                            onClick={() => handleUpdateStatus(c, 'Inactive')}
                            disabled={isOperating}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition"
                            title="Deactivate Customer"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdateStatus(c, 'Active')}
                            disabled={isOperating}
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-500/10 transition"
                            title="Activate Customer"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
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
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total customers)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1 || loading}
                onClick={() => fetchCustomers(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages || loading}
                onClick={() => fetchCustomers(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title="Customer Profile & Accounts"
          maxWidth="max-w-xl"
        >
          <div className="space-y-5">
            {/* Header info */}
            <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                  {selectedCustomer.name ? selectedCustomer.name.charAt(0) : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedCustomer.email}</p>
                  <p className="text-xs font-mono font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                    {selectedCustomer.customerId || ('FIN-CUS-' + selectedCustomer._id.slice(-5).toUpperCase())}
                  </p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedCustomer.status === 'Active' || selectedCustomer.isActive
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                    : selectedCustomer.status === 'Frozen'
                    ? 'bg-cyan-100 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300'
                    : 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300'
                }`}
              >
                {selectedCustomer.status || (selectedCustomer.isActive ? 'Active' : 'Inactive')}
              </span>
            </div>

            {/* Profile Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Phone Number</span>
                <span className="font-semibold text-[var(--finova-text-heading)]">{selectedCustomer.phone || 'N/A'}</span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Password Rotation Required</span>
                <span className="font-semibold text-[var(--finova-text-heading)]">
                  {selectedCustomer.mustChangePassword ? 'Yes (First login pending)' : 'No (Standard password set)'}
                </span>
              </div>
            </div>

            {/* Status Management Selector */}
            <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[var(--finova-text-heading)] block">Account Standing</span>
                <span className="text-[11px] text-[var(--finova-text-muted)]">Update customer status to control portal access</span>
              </div>
              <div className="flex gap-1.5">
                {['Active', 'Inactive', 'Frozen'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateStatus(selectedCustomer, st)}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition ${
                      (selectedCustomer.status || (selectedCustomer.isActive ? 'Active' : 'Inactive')) === st
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-[var(--finova-card-bg)] text-[var(--finova-text-secondary)] border-[var(--finova-border)] hover:bg-[var(--finova-card-hover)]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Registered Accounts List */}
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--finova-text-muted)] mb-2">
                Registered Bank Accounts ({selectedCustomer.accounts?.length || 0})
              </h4>
              {selectedCustomer.accounts && selectedCustomer.accounts.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedCustomer.accounts.map((acc, idx) => (
                    <div
                      key={acc._id || idx}
                      className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-mono font-bold text-[var(--finova-text-heading)] block">
                          Account #{acc.accountNumber || acc._id}
                        </span>
                        <span className="text-[var(--finova-text-muted)] text-[11px] capitalize">
                          {acc.accountType || 'Savings'} • {acc.status}
                        </span>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(acc.balance || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--finova-text-muted)] italic p-3 bg-[var(--finova-bg-secondary)] rounded-xl border border-dashed border-[var(--finova-border)] text-center">
                  No accounts registered for this customer yet.
                </p>
              )}
            </div>

            {/* Actions footer */}
            <div className="pt-3 border-t border-[var(--finova-border-light)] flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsDetailModalOpen(false);
                  handleResetPassword(selectedCustomer);
                }}
                className="gap-1 text-amber-600 border-amber-300 hover:bg-amber-50"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Reset Password
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Provision New Customer Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Provision New Customer"
        description="Create an institutional customer account with auto-generated ID, temporary password, and initial bank account."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Full Customer Name"
            placeholder="e.g. Ramesh Kumar"
            value={createFormData.name}
            onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="customer@example.com"
            value={createFormData.email}
            onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+91 9876543210"
            value={createFormData.phone}
            onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
            required
          />

          <Input
            label="Initial Deposit Amount (₹)"
            type="number"
            min="0"
            step="100"
            placeholder="e.g. 5000 (optional, default ₹0)"
            value={createFormData.initialDeposit}
            onChange={(e) => setCreateFormData({ ...createFormData, initialDeposit: e.target.value })}
          />

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Automated Provisioning Policy</span>
            The system will auto-generate a unique Customer ID (e.g. FIN-CUS-10025), a secure temporary password, and an active Savings account. The customer will be forced to change their password on first login.
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={createLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={createLoading}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <UserPlus className="w-4 h-4" />
              Provision Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Customer Credentials Dialog */}
      {createdCredentials && (
        <Modal
          isOpen={isCredentialsModalOpen}
          onClose={() => setIsCredentialsModalOpen(false)}
          title="Customer Credentials Generated"
          description="Please share these one-time credentials securely with the customer."
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Customer account and primary bank account created successfully!</span>
            </div>

            <div className="space-y-2.5 p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Customer ID:</span>
                <span className="font-bold text-brand-600 dark:text-brand-400 text-sm">
                  {createdCredentials.customerId}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Login Email:</span>
                <span className="text-slate-900 dark:text-white font-semibold">
                  {createdCredentials.email}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Temporary Password:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800 text-sm">
                  {createdCredentials.temporaryPassword}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Account Number:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {createdCredentials.accountNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">Opening Balance:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(createdCredentials.initialDeposit || 0)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800/40 leading-relaxed">
              ⚠️ <strong>Security Notice:</strong> The temporary password will NOT be displayed again. The customer must rotate this password upon their first login before dashboard access is granted.
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    `Finova Digital Banking Credentials:\nCustomer ID: ${createdCredentials.customerId}\nEmail: ${createdCredentials.email}\nTemporary Password: ${createdCredentials.temporaryPassword}\nAccount Number: ${createdCredentials.accountNumber}\nLogin at: http://localhost:5173/login`
                  )
                }
                className="gap-1.5"
              >
                {hasCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {hasCopied ? 'Copied!' : 'Copy Credentials'}
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsCredentialsModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Reset Password Result Dialog */}
      {resetCredentials && (
        <Modal
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          title="New Temporary Password Issued"
          description={`A fresh temporary password has been set for ${resetCredentials.name}.`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Customer ID:</span>
                <span className="font-bold text-brand-600">{resetCredentials.customerId}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 font-sans">Customer Email:</span>
                <span className="text-slate-900 dark:text-white">{resetCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans">New Temporary Password:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200 text-sm">
                  {resetCredentials.temporaryPassword}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              The customer will be forced to change this password upon their next login.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(
                    `Finova Password Reset:\nCustomer ID: ${resetCredentials.customerId}\nTemporary Password: ${resetCredentials.temporaryPassword}\nLogin at: http://localhost:5173/login`
                  )
                }
                className="gap-1.5"
              >
                {hasCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {hasCopied ? 'Copied!' : 'Copy Password'}
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsResetModalOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Issue Card Modal */}
      {isCardModalOpen && cardTargetCustomer && (
        <Modal
          isOpen={isCardModalOpen}
          onClose={() => !cardLoading && setIsCardModalOpen(false)}
          title={`Issue Debit Card: ${cardTargetCustomer.name}`}
          description={`Customer ID: ${cardTargetCustomer.customerId || 'N/A'}`}
        >
          <form onSubmit={handleIssueCardSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1">
                Linked Bank Account
              </label>
              {cardTargetCustomer.accounts && cardTargetCustomer.accounts.length > 0 ? (
                <select
                  value={cardForm.accountId}
                  onChange={(e) => setCardForm({ ...cardForm, accountId: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] focus:outline-none"
                  required
                >
                  {cardTargetCustomer.accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      Account #{acc.accountNumber} ({acc.accountType} - {formatCurrency(acc.balance)})
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-amber-500">
                  Customer has no provisioned accounts. A default account will be linked automatically.
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1">
                Card Tier / Network
              </label>
              <select
                value={cardForm.cardType}
                onChange={(e) => setCardForm({ ...cardForm, cardType: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] focus:outline-none"
              >
                <option value="Visa Platinum Debit">Visa Platinum Debit</option>
                <option value="Mastercard Gold Debit">Mastercard Gold Debit</option>
                <option value="Visa Signature Debit">Visa Signature Debit</option>
                <option value="Mastercard World Debit">Mastercard World Debit</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1">
                  Daily Limit (₹)
                </label>
                <Input
                  type="number"
                  min="1000"
                  max="500000"
                  step="1000"
                  value={cardForm.transactionLimit}
                  onChange={(e) => setCardForm({ ...cardForm, transactionLimit: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1">
                  4-Digit PIN
                </label>
                <div className="flex gap-1.5">
                  <Input
                    type="text"
                    maxLength="4"
                    value={cardForm.pin}
                    onChange={(e) => setCardForm({ ...cardForm, pin: e.target.value.replace(/\D/g, '') })}
                    placeholder="4-digit PIN"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setCardForm({ ...cardForm, pin: String(Math.floor(1000 + Math.random() * 9000)) })}
                    className="px-2 py-1 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl text-[10px] font-bold text-brand-600 hover:bg-brand-500/10 transition"
                  >
                    Gen
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={cardLoading}
                onClick={() => setIsCardModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={cardLoading}>
                {cardLoading ? 'Issuing...' : 'Issue Card'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Card Issued Result Dialog */}
      {cardResult && (
        <Modal
          isOpen={true}
          onClose={() => setCardResult(null)}
          title="Virtual Debit Card Issued"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl text-center space-y-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                {cardResult.card?.cardType}
              </span>
              <div className="font-mono text-xl font-bold tracking-widest text-emerald-400">
                {cardResult.card?.maskedCardNumber}
              </div>
              <p className="text-xs text-slate-300">
                Issued to: <span className="font-bold text-white">{cardResult.customerName}</span>
              </p>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Default PIN:</span>
              <span className="font-mono text-base font-extrabold text-emerald-600 dark:text-emerald-300">
                {cardResult.issuedPin}
              </span>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setCardResult(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminCustomers;
