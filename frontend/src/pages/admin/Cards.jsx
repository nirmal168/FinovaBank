import React, { useState, useEffect } from 'react';
import adminService from '../../services/adminService';
import Card, { CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import {
  CreditCard,
  Plus,
  Lock,
  Unlock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  RefreshCw,
  Sliders,
  Copy,
  Check,
  User,
  Wallet,
  Sparkles,
  Zap,
  Clock,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const CARD_TYPES = [
  { id: 'Visa Platinum Debit', name: 'Visa Platinum Debit', network: 'Visa', defaultLimit: 50000 },
  { id: 'Mastercard Gold Debit', name: 'Mastercard Gold Debit', network: 'Mastercard', defaultLimit: 75000 },
  { id: 'Visa Signature Debit', name: 'Visa Signature Debit', network: 'Visa', defaultLimit: 150000 },
  { id: 'Mastercard World Debit', name: 'Mastercard World Debit', network: 'Mastercard', defaultLimit: 250000 },
];

const AdminCards = () => {
  const [cards, setCards] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total: 0, activeCount: 0, blockedCount: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Issue Card Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedCustomerAccounts, setSelectedCustomerAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [cardType, setCardType] = useState('Visa Platinum Debit');
  const [transactionLimit, setTransactionLimit] = useState(50000);
  const [pin, setPin] = useState('');
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueError, setIssueError] = useState('');

  // Credentials / Result Modal State
  const [issuedResult, setIssuedResult] = useState(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [copiedCardNum, setCopiedCardNum] = useState(false);

  // Adjust Limit Modal State
  const [limitCard, setLimitCard] = useState(null);
  const [newLimit, setNewLimit] = useState(50000);
  const [limitLoading, setLimitLoading] = useState(false);
  const [limitError, setLimitError] = useState('');

  // Status Operating State
  const [statusOperatingId, setStatusOperatingId] = useState(null);

  const fetchCards = async (page = 1, isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const res = await adminService.getCards(params);
      if (res.success) {
        setCards(res.cards || res.data?.cards || []);
        if (res.data?.stats) {
          setStats(res.data.stats);
        }
        if (res.data?.pagination) {
          setPagination(res.data.pagination);
        }
      } else {
        setError('Failed to load card records');
      }
    } catch (err) {
      console.error('Error loading cards:', err);
      setError(err.response?.data?.message || err.message || 'Unable to connect to card service');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await adminService.getCustomers({ limit: 100 });
      if (res.success) {
        setCustomers(res.data?.customers || []);
      }
    } catch (err) {
      console.error('Error loading customer list:', err);
    }
  };

  useEffect(() => {
    fetchCards(1);
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCards(1);
  };

  const handleCustomerSelect = (custId) => {
    setSelectedCustomerId(custId);
    const found = customers.find((c) => c._id === custId);
    if (found && found.accounts && found.accounts.length > 0) {
      setSelectedCustomerAccounts(found.accounts);
      setSelectedAccountId(found.accounts[0]._id);
    } else {
      setSelectedCustomerAccounts([]);
      setSelectedAccountId('');
    }
  };

  const openIssueModal = () => {
    setIssueError('');
    setCardType('Visa Platinum Debit');
    setTransactionLimit(50000);
    setPin(String(Math.floor(1000 + Math.random() * 9000)));

    if (customers.length > 0) {
      const first = customers[0];
      setSelectedCustomerId(first._id);
      if (first.accounts && first.accounts.length > 0) {
        setSelectedCustomerAccounts(first.accounts);
        setSelectedAccountId(first.accounts[0]._id);
      } else {
        setSelectedCustomerAccounts([]);
        setSelectedAccountId('');
      }
    } else {
      setSelectedCustomerId('');
      setSelectedCustomerAccounts([]);
      setSelectedAccountId('');
    }

    setIsIssueModalOpen(true);
  };

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setIssueError('Please select a customer.');
      return;
    }
    if (!selectedAccountId) {
      setIssueError('Customer does not have an active bank account to link.');
      return;
    }
    if (!pin || pin.length !== 4) {
      setIssueError('PIN must be exactly 4 digits.');
      return;
    }

    try {
      setIssueLoading(true);
      setIssueError('');

      const res = await adminService.issueCard({
        userId: selectedCustomerId,
        accountId: selectedAccountId,
        cardType,
        pin,
        transactionLimit: Number(transactionLimit),
      });

      if (res.success) {
        setIsIssueModalOpen(false);
        setIssuedResult({
          card: res.card,
          issuedPin: res.issuedPin || pin,
        });
        fetchCards(1);
      } else {
        setIssueError(res.message || 'Failed to issue card');
      }
    } catch (err) {
      setIssueError(err.response?.data?.message || err.message || 'Error creating virtual debit card');
    } finally {
      setIssueLoading(false);
    }
  };

  const handleIssuePendingCard = async (card) => {
    try {
      setStatusOperatingId(card._id);
      const res = await adminService.updateCardStatus(card._id, 'Active');
      if (res.success) {
        setCards((prev) =>
          prev.map((c) => (c._id === card._id ? { ...c, status: 'Active' } : c))
        );
        fetchCards(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to issue card');
    } finally {
      setStatusOperatingId(null);
    }
  };

  const handleToggleStatus = async (card) => {
    const nextStatus = card.status === 'Active' ? 'Blocked' : 'Active';
    try {
      setStatusOperatingId(card._id);
      const res = await adminService.updateCardStatus(card._id, nextStatus);
      if (res.success) {
        setCards((prev) =>
          prev.map((c) => (c._id === card._id ? { ...c, status: nextStatus } : c))
        );
        setStats((prev) => ({
          ...prev,
          activeCount: nextStatus === 'Active' ? prev.activeCount + 1 : prev.activeCount - 1,
          blockedCount: nextStatus === 'Blocked' ? prev.blockedCount + 1 : prev.blockedCount - 1,
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update card status');
    } finally {
      setStatusOperatingId(null);
    }
  };

  const openLimitModal = (card) => {
    setLimitCard(card);
    setNewLimit(card.transactionLimit || 50000);
    setLimitError('');
  };

  const handleLimitSubmit = async (e) => {
    e.preventDefault();
    if (!limitCard) return;

    try {
      setLimitLoading(true);
      setLimitError('');
      const res = await adminService.updateCardLimit(limitCard._id, Number(newLimit));
      if (res.success) {
        setCards((prev) =>
          prev.map((c) => (c._id === limitCard._id ? { ...c, transactionLimit: Number(newLimit) } : c))
        );
        setLimitCard(null);
      } else {
        setLimitError(res.message || 'Failed to update limit');
      }
    } catch (err) {
      setLimitError(err.response?.data?.message || 'Error updating daily limit');
    } finally {
      setLimitLoading(false);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'pin') {
      setCopiedPin(true);
      setTimeout(() => setCopiedPin(false), 2000);
    } else {
      setCopiedCardNum(true);
      setTimeout(() => setCopiedCardNum(false), 2000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <CreditCard className="w-3.5 h-3.5" />
              PORTFOLIO ISSUANCE ENGINE
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--finova-text-heading)] tracking-tight">
            Debit Cards & Merchant Issuance
          </h1>
          <p className="text-sm text-[var(--finova-text-secondary)] mt-0.5">
            Issue virtual debit cards to verified customer accounts and monitor daily transaction velocity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchCards(pagination.page, true)}
            disabled={refreshing || loading}
            className="gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={openIssueModal}
            className="gap-2 shadow-sm font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Issue New Card</span>
          </Button>
        </div>
      </div>

      {/* Stats Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-[var(--finova-text-secondary)] uppercase tracking-wider">
                Total Cards Issued
              </p>
              <h3 className="text-2xl font-extrabold text-[var(--finova-text-heading)] mt-1">
                {stats.total ?? cards.length}
              </h3>
              <p className="text-[11px] text-[var(--finova-text-muted)] mt-0.5">
                Active in institutional circulation
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <CreditCard className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Pending Requests
              </p>
              <h3 className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {stats.pendingCount ?? cards.filter((c) => c.status === 'Pending').length}
              </h3>
              <p className="text-[11px] text-[var(--finova-text-muted)] mt-0.5">
                Customer applications awaiting issuance
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Active Cards
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {stats.activeCount ?? cards.filter((c) => c.status === 'Active').length}
              </h3>
              <p className="text-[11px] text-[var(--finova-text-muted)] mt-0.5">
                Live with contactless POS & online auth
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Blocked / Frozen Cards
              </p>
              <h3 className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                {stats.blockedCount ?? cards.filter((c) => c.status === 'Blocked').length}
              </h3>
              <p className="text-[11px] text-[var(--finova-text-muted)] mt-0.5">
                Restricted by administrator or fraud engine
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Search Bar */}
      <Card className="border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs">
        <CardContent className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--finova-text-muted)]" />
              <input
                type="text"
                placeholder="Search by customer name, customer ID, last 4 digits, or cardholder..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setTimeout(() => fetchCards(1), 50);
                }}
                className="px-3 py-2 text-xs rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="Pending">Pending Approval (To Issue)</option>
                <option value="Active">Active</option>
                <option value="Blocked">Blocked</option>
                <option value="Inactive">Inactive</option>
              </select>

              <Button type="submit" variant="primary" size="sm" className="whitespace-nowrap">
                Search
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Cards Table */}
      <Card className="border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[var(--finova-text-secondary)]">
            <thead className="bg-[var(--finova-bg-secondary)] text-[var(--finova-text-heading)] border-b border-[var(--finova-border)] text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Card / Network</th>
                <th className="py-3 px-4">Customer ID & Holder</th>
                <th className="py-3 px-4">Linked Account</th>
                <th className="py-3 px-4">Daily Limit</th>
                <th className="py-3 px-4">Expiry</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--finova-border)]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center">
                    <Loader size="md" className="mx-auto text-brand-500" />
                    <p className="text-xs text-[var(--finova-text-muted)] mt-2">Loading cards portfolio...</p>
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-[var(--finova-text-muted)]">
                    <CreditCard className="w-8 h-8 mx-auto text-[var(--finova-text-muted)] mb-2 opacity-50" />
                    <p className="font-semibold">No debit cards found matching the criteria</p>
                    <p className="text-[11px] mt-0.5">Click "Issue New Card" to provision a card for a customer</p>
                  </td>
                </tr>
              ) : (
                cards.map((card) => {
                  const isOperating = statusOperatingId === card._id;
                  const isMastercard = card.cardType?.toLowerCase().includes('mastercard');
                  return (
                    <tr key={card._id} className="hover:bg-[var(--finova-bg-secondary)]/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--finova-text-heading)]">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg text-white text-[10px] font-bold ${
                            isMastercard ? 'bg-amber-600' : 'bg-indigo-600'
                          }`}>
                            {isMastercard ? 'MC' : 'VISA'}
                          </div>
                          <div>
                            <div className="tracking-wider">{card.maskedCardNumber || `•••• ${card.lastFour}`}</div>
                            <div className="text-[10px] text-[var(--finova-text-muted)] font-normal">{card.cardType}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[var(--finova-text-heading)]">
                          {card.user?.name || card.cardholderName || 'N/A'}
                        </div>
                        {card.user?.customerId && (
                          <span className="font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                            {card.user.customerId}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-[var(--finova-text-heading)] font-medium">
                          {card.account?.accountNumber || 'N/A'}
                        </div>
                        <div className="text-[10px] text-[var(--finova-text-muted)]">
                          Bal: {formatCurrency(card.account?.balance || 0)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-[var(--finova-text-heading)]">
                        {formatCurrency(card.transactionLimit || 50000)}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[var(--finova-text-secondary)]">
                        {card.expiryDate || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            card.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                              : card.status === 'Pending'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {card.status === 'Active' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : card.status === 'Pending' ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <Lock className="w-3 h-3" />
                          )}
                          {card.status === 'Pending' ? 'Pending Approval' : card.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5">
                        {card.status === 'Pending' ? (
                          <button
                            onClick={() => handleIssuePendingCard(card)}
                            disabled={isOperating}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition active:scale-95"
                            title="Approve and Issue this Card to Customer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Issue Card</span>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => openLimitModal(card)}
                              className="p-1.5 rounded-lg text-[var(--finova-text-secondary)] hover:text-brand-500 hover:bg-brand-500/10 transition"
                              title="Adjust Daily Limit"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleStatus(card)}
                              disabled={isOperating}
                              className={`p-1.5 rounded-lg transition ${
                                card.status === 'Active'
                                  ? 'text-rose-500 hover:bg-rose-500/10'
                                  : 'text-emerald-500 hover:bg-emerald-500/10'
                              }`}
                              title={card.status === 'Active' ? 'Block Card' : 'Activate Card'}
                            >
                              {card.status === 'Active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
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
          <div className="p-4 border-t border-[var(--finova-border)] flex items-center justify-between text-xs text-[var(--finova-text-secondary)]">
            <span>
              Showing page {pagination.page} of {pagination.pages} ({pagination.total} total cards)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => fetchCards(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchCards(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* ISSUE NEW CARD MODAL */}
      <Modal
        isOpen={isIssueModalOpen}
        onClose={() => !issueLoading && setIsIssueModalOpen(false)}
        title="Issue Institutional Debit Card"
      >
        <form onSubmit={handleIssueSubmit} className="space-y-4">
          {issueError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{issueError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1">
              Select Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerSelect(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] focus:outline-none"
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((cust) => (
                <option key={cust._id} value={cust._id}>
                  {cust.name} ({cust.customerId || 'No ID'} - {cust.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1">
              Linked Bank Account
            </label>
            {selectedCustomerAccounts.length === 0 ? (
              <p className="text-xs text-amber-500">
                This customer has no active bank accounts. A default account will be linked automatically.
              </p>
            ) : (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] focus:outline-none"
                required
              >
                {selectedCustomerAccounts.map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    Account #{acc.accountNumber} ({acc.accountType} - {formatCurrency(acc.balance)})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1">
              Card Tier / Network
            </label>
            <select
              value={cardType}
              onChange={(e) => {
                setCardType(e.target.value);
                const match = CARD_TYPES.find((ct) => ct.id === e.target.value);
                if (match) setTransactionLimit(match.defaultLimit);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-heading)] focus:outline-none"
            >
              {CARD_TYPES.map((ct) => (
                <option key={ct.id} value={ct.id}>
                  {ct.name} ({ct.network})
                </option>
              ))}
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
                value={transactionLimit}
                onChange={(e) => setTransactionLimit(e.target.value)}
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
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 4321"
                  required
                />
                <button
                  type="button"
                  onClick={() => setPin(String(Math.floor(1000 + Math.random() * 9000)))}
                  className="px-2 py-1 bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] rounded-xl text-[10px] font-bold text-brand-600 hover:bg-brand-500/10 transition"
                  title="Generate PIN"
                >
                  Gen
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={issueLoading}
              onClick={() => setIsIssueModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={issueLoading}>
              {issueLoading ? 'Issuing Card...' : 'Issue Virtual Debit Card'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ISSUED SUCCESS DIALOG */}
      {issuedResult && (
        <Modal
          isOpen={true}
          onClose={() => setIssuedResult(null)}
          title="Virtual Card Issued Successfully"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                  <span>{issuedResult.card?.cardType || 'Finova Virtual Card'}</span>
                </div>
                <span className="font-extrabold text-sm tracking-wider text-slate-300">
                  {issuedResult.card?.cardType?.includes('Mastercard') ? 'Mastercard' : 'VISA'}
                </span>
              </div>

              <div className="my-4 font-mono text-xl tracking-widest text-center font-bold">
                {issuedResult.card?.maskedCardNumber}
              </div>

              <div className="flex justify-between items-end text-xs text-slate-400 mt-4">
                <div>
                  <p className="text-[9px] uppercase tracking-wider">Cardholder</p>
                  <p className="font-bold text-white text-xs">{issuedResult.card?.cardholderName}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-wider">Expires</p>
                  <p className="font-mono text-white text-xs">{issuedResult.card?.expiryDate}</p>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--finova-text-secondary)]">Security PIN:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-extrabold text-base text-emerald-600 dark:text-emerald-400">
                    {issuedResult.issuedPin}
                  </span>
                  <button
                    onClick={() => copyToClipboard(issuedResult.issuedPin, 'pin')}
                    className="p-1 rounded hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    title="Copy PIN"
                  >
                    {copiedPin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--finova-text-secondary)]">Card Number:</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[var(--finova-text-heading)]">
                    {issuedResult.card?.maskedCardNumber}
                  </span>
                  <button
                    onClick={() => copyToClipboard(issuedResult.card?.maskedCardNumber, 'card')}
                    className="p-1 rounded hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                    title="Copy Number"
                  >
                    {copiedCardNum ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--finova-text-secondary)]">Daily Limit:</span>
                <span className="font-bold text-[var(--finova-text-heading)]">
                  {formatCurrency(issuedResult.card?.transactionLimit || 50000)}
                </span>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setIssuedResult(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ADJUST LIMIT MODAL */}
      {limitCard && (
        <Modal
          isOpen={true}
          onClose={() => !limitLoading && setLimitCard(null)}
          title={`Adjust Limit: •••• ${limitCard.lastFour}`}
        >
          <form onSubmit={handleLimitSubmit} className="space-y-4">
            {limitError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs">
                {limitError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--finova-text-heading)] mb-1">
                New Daily Transaction Limit (₹)
              </label>
              <Input
                type="number"
                min="1000"
                max="500000"
                step="1000"
                value={newLimit}
                onChange={(e) => setNewLimit(e.target.value)}
                required
              />
              <p className="text-[11px] text-[var(--finova-text-muted)] mt-1">
                Authorized range: ₹1,000.00 to ₹5,00,000.00 per 24 hours.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={limitLoading}
                onClick={() => setLimitCard(null)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" disabled={limitLoading}>
                {limitLoading ? 'Saving...' : 'Update Limit'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AdminCards;
