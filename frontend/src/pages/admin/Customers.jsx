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
  Eye,
  RefreshCw,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  CreditCard,
  CheckCircle,
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

  const handleToggleStatus = async (customer) => {
    try {
      setActionLoadingId(customer._id);
      const newStatus = !customer.isActive;
      const res = await adminService.updateCustomerStatus(customer._id, newStatus);
      if (res.success) {
        setCustomers((prev) =>
          prev.map((c) => (c._id === customer._id ? { ...c, isActive: newStatus } : c))
        );
        if (selectedCustomer && selectedCustomer._id === customer._id) {
          setSelectedCustomer((prev) => ({ ...prev, isActive: newStatus }));
        }
        setActionSuccessMessage(`Customer ${customer.name} is now ${newStatus ? 'Active' : 'Deactivated'}.`);
        showToast(`Customer ${customer.name} is now ${newStatus ? 'Active' : 'Deactivated'}.`, 'success');
        setTimeout(() => setActionSuccessMessage(null), 4000);
      }
    } catch (err) {
      showToast(err.message || 'Failed to update customer status', 'error');
    } finally {
      setActionLoadingId(null);
    }
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
            View profiles, inspect registered accounts, and manage active/deactivated customer standing.
          </p>
        </div>
        <div className="flex items-center gap-3">
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
              placeholder="Search by name, email, or phone..."
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
          {['ALL', 'active', 'inactive'].map((st) => (
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
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Accounts</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--finova-border-light)]">
              {loading && customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[var(--finova-text-muted)]">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-500" />
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-[var(--finova-text-muted)]">
                    No customers found matching the search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => {
                  const isOperating = actionLoadingId === c._id;
                  return (
                    <tr key={c._id} className="hover:bg-[var(--finova-card-hover)] transition duration-150">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs uppercase border border-brand-500/20">
                            {c.name ? c.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-[var(--finova-text-heading)]">{c.name}</div>
                            <div className="text-[10px] text-[var(--finova-text-muted)] font-mono">ID: {c._id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[var(--finova-text-secondary)]">
                          <Mail className="w-3.5 h-3.5 text-[var(--finova-text-muted)]" />
                          <span>{c.email}</span>
                        </div>
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
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            c.isActive
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {c.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              Deactivated
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[var(--finova-text-muted)]">
                        {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => openCustomerDetails(c)}
                          className="p-1.5 rounded-lg text-[var(--finova-text-secondary)] hover:text-brand-500 hover:bg-brand-500/10 transition"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(c)}
                          disabled={isOperating}
                          className={`p-1.5 rounded-lg transition ${
                            c.isActive
                              ? 'text-rose-500 hover:text-rose-700 hover:bg-rose-500/10'
                              : 'text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 hover:bg-emerald-500/10'
                          }`}
                          title={c.isActive ? 'Deactivate Customer' : 'Activate Customer'}
                        >
                          {c.isActive ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
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
            <div className="flex items-start justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                  {selectedCustomer.name ? selectedCustomer.name.charAt(0) : 'U'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedCustomer.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedCustomer.email}</p>
                </div>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  selectedCustomer.isActive
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}
              >
                {selectedCustomer.isActive ? 'Active Standing' : 'Deactivated'}
              </span>
            </div>

            {/* Profile Attributes */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Phone Number</span>
                <span className="font-semibold text-[var(--finova-text-heading)]">{selectedCustomer.phone || 'N/A'}</span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl">
                <span className="text-[var(--finova-text-muted)] block mb-1">Date of Birth</span>
                <span className="font-semibold text-[var(--finova-text-heading)]">{selectedCustomer.dateOfBirth ? new Date(selectedCustomer.dateOfBirth).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="p-3 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl col-span-2">
                <span className="text-[var(--finova-text-muted)] block mb-1">Residential Address</span>
                <span className="font-semibold text-[var(--finova-text-heading)]">{selectedCustomer.address || 'No physical address provided'}</span>
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
                        <span className="text-[var(--finova-text-muted)] text-[11px] capitalize">{acc.accountType || 'Savings'} • {acc.status}</span>
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
                variant={selectedCustomer.isActive ? 'danger' : 'primary'}
                size="sm"
                onClick={() => handleToggleStatus(selectedCustomer)}
                disabled={actionLoadingId === selectedCustomer._id}
              >
                {selectedCustomer.isActive ? 'Deactivate Customer' : 'Activate Customer'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminCustomers;
