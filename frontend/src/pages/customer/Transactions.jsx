import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import transactionService from '../../services/transactionService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Table, { TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import Loader from '../../components/ui/Loader';
import {
  Receipt,
  Search,
  Filter,
  ArrowUpDown,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Copy,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  SlidersHorizontal,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const TRANSACTION_TYPES = [
  { label: 'All Types', value: 'ALL' },
  { label: 'Deposits', value: 'DEPOSIT' },
  { label: 'Withdrawals', value: 'WITHDRAW' },
  { label: 'Transfers', value: 'TRANSFER' },
];

const TRANSACTION_STATUSES = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
];

const SORT_OPTIONS = [
  { label: 'Date: Newest First', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Date: Oldest First', sortBy: 'createdAt', sortOrder: 'asc' },
  { label: 'Amount: High to Low', sortBy: 'amount', sortOrder: 'desc' },
  { label: 'Amount: Low to High', sortBy: 'amount', sortOrder: 'asc' },
];

const Transactions = () => {
  const navigate = useNavigate();

  // Data & loading states
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  // Filter states
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch transactions from API
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError('');

      const params = {
        page: currentPage,
        limit: itemsPerPage,
        sortBy,
        sortOrder,
      };

      if (search.trim()) params.search = search.trim();
      if (type !== 'ALL') params.type = type;
      if (status !== 'ALL') params.status = status;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await transactionService.getTransactions(params);
      setTransactions(data.transactions || []);
      setPagination(
        data.pagination || {
          page: currentPage,
          limit: itemsPerPage,
          totalCount: data.count || 0,
          totalPages: Math.ceil((data.count || 0) / itemsPerPage) || 1,
          hasNextPage: false,
          hasPrevPage: false,
        }
      );
    } catch (err) {
      setError(err.message || 'Failed to load transaction history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, itemsPerPage, type, status, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchTransactions();
  };

  const handleResetFilters = () => {
    setSearch('');
    setType('ALL');
    setStatus('ALL');
    setStartDate('');
    setEndDate('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setCurrentPage(1);
  };

  const handleCopy = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const getTypeBadge = (txnType) => {
    switch (txnType) {
      case 'DEPOSIT':
        return {
          icon: ArrowDownLeft,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          label: 'Deposit',
          sign: '+',
          amountColor: 'text-emerald-600',
        };
      case 'WITHDRAW':
        return {
          icon: ArrowUpRight,
          color: 'text-amber-700 bg-amber-50 border-amber-200',
          label: 'Withdrawal',
          sign: '-',
          amountColor: 'text-slate-900',
        };
      case 'TRANSFER':
        return {
          icon: ArrowLeftRight,
          color: 'text-brand-700 bg-brand-50 border-brand-200',
          label: 'Transfer',
          sign: '-',
          amountColor: 'text-slate-900',
        };
      default:
        return {
          icon: Receipt,
          color: 'text-slate-700 bg-slate-50 border-slate-200',
          label: txnType,
          sign: '',
          amountColor: 'text-slate-900',
        };
    }
  };

  const getStatusBadge = (txnStatus) => {
    switch (txnStatus) {
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Completed</span>
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
            {txnStatus}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Receipt className="h-6 w-6 text-brand-600" />
            <span>Transaction History</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete audit trail of all deposits, withdrawals, and account transfers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            icon={SlidersHorizontal}
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? 'bg-slate-100' : ''}
          >
            {showFilters ? 'Hide Filters' : 'Filters & Date'}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            icon={RotateCcw}
            onClick={handleResetFilters}
            title="Reset all filters"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Main Search & Filter Card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Top Row: Search Input + Type Pills */}
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Transaction ID, description, account, reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-20 py-2 text-xs rounded-xl border border-slate-200 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 transition-all"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
              >
                Search
              </button>
            </form>

            {/* Quick Type Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {TRANSACTION_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => {
                    setType(t.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    type === t.value
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Advanced Filters Expandable Drawer */}
          {showFilters && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {/* Status Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                >
                  {TRANSACTION_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  From Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  To Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Sort By Dropdown */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                  Sort Order
                </label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [f, d] = e.target.value.split('-');
                    setSortBy(f);
                    setSortOrder(d);
                    setCurrentPage(1);
                  }}
                  className="w-full p-2 rounded-lg border border-slate-200 text-xs text-slate-800 focus:border-brand-500 focus:outline-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={`${opt.sortBy}-${opt.sortOrder}`} value={`${opt.sortBy}-${opt.sortOrder}`}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Transactions Data Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader size="lg" label="Loading transaction records..." />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Receipt className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Transactions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No matching transactions were found for your current search or filter criteria.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Sender / Receiver</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const typeBadge = getTypeBadge(tx.type);
                  const Icon = typeBadge.icon;

                  return (
                    <TableRow key={tx._id || tx.transactionId}>
                      {/* 1. Transaction ID */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {tx.transactionId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(tx.transactionId)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                            title="Copy Transaction ID"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          {copiedId === tx.transactionId && (
                            <span className="text-[10px] text-emerald-600 font-bold">Copied!</span>
                          )}
                        </div>
                        {tx.description && (
                          <p className="text-[11px] text-slate-500 max-w-xs truncate mt-0.5">
                            {tx.description}
                          </p>
                        )}
                      </TableCell>

                      {/* 2. Type */}
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${typeBadge.color}`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{typeBadge.label}</span>
                        </span>
                      </TableCell>

                      {/* 3. Amount */}
                      <TableCell className={`text-right font-mono font-extrabold text-xs ${typeBadge.amountColor}`}>
                        {typeBadge.sign}{formatCurrency(tx.amount)}
                      </TableCell>

                      {/* 4. Sender / Receiver */}
                      <TableCell className="text-xs text-slate-600">
                        <div className="space-y-0.5 font-mono text-[11px]">
                          <div>
                            <span className="text-slate-400 font-sans text-[10px] mr-1">From:</span>
                            <span>{tx.senderAccount}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 font-sans text-[10px] mr-1">To:</span>
                            <span>{tx.receiverAccount}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* 5. Status */}
                      <TableCell className="text-center">{getStatusBadge(tx.status)}</TableCell>

                      {/* 6. Date */}
                      <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                        <div>{new Date(tx.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(tx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </TableCell>

                      {/* 7. Action */}
                      <TableCell className="text-right">
                        <Link to={`/transactions/${tx.transactionId}`}>
                          <Button variant="outline" size="sm" icon={ExternalLink} iconPosition="right">
                            Details
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        {transactions.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing{' '}
              <span className="font-bold text-slate-900">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-bold text-slate-900">
                {Math.min(pagination.page * pagination.limit, pagination.totalCount)}
              </span>{' '}
              of <span className="font-bold text-slate-900">{pagination.totalCount}</span> transactions
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 mr-2">
                <span className="text-[11px] text-slate-500">Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="p-1 rounded border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                icon={ChevronLeft}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={!pagination.hasPrevPage}
              >
                Previous
              </Button>

              <span className="font-semibold text-slate-800 px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                icon={ChevronRight}
                iconPosition="right"
                onClick={() => setCurrentPage((p) => p + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Transactions;
