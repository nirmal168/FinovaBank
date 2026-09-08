import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import beneficiaryService from '../../services/beneficiaryService';
import transactionService from '../../services/transactionService';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  UserPlus,
  Search,
  Building,
  Edit2,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Copy,
  AlertCircle,
  ShieldCheck,
  Power,
  RotateCcw,
} from 'lucide-react';

const Beneficiaries = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Data & loading states
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState('');

  // Add Beneficiary Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    accountNumber: '',
    bankName: 'Finova',
    nickname: '',
  });
  const [addError, setAddError] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const [verifiedAccountInfo, setVerifiedAccountInfo] = useState(null);
  const [verifyAccountError, setVerifyAccountError] = useState('');

  // Edit Beneficiary Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    accountNumber: '',
    bankName: 'Finova',
    nickname: '',
    status: 'Active',
  });
  const [editError, setEditError] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Confirmation Modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [beneficiaryToDelete, setBeneficiaryToDelete] = useState(null);
  const [isSubmittingDelete, setIsSubmittingDelete] = useState(false);

  // Fetch beneficiaries
  const fetchBeneficiaries = async () => {
    try {
      setIsLoading(true);
      setError('');
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const data = await beneficiaryService.getBeneficiaries(params);
      setBeneficiaries(data.beneficiaries || []);
    } catch (err) {
      setError(err.message || 'Failed to load beneficiaries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBeneficiaries();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchBeneficiaries();
  };

  const handleCopy = (acc) => {
    navigator.clipboard.writeText(acc);
    setCopiedId(acc);
    setTimeout(() => setCopiedId(''), 2000);
  };

  // Add Beneficiary
  const handleOpenAdd = () => {
    setAddForm({
      name: '',
      accountNumber: '',
      bankName: 'Finova',
      nickname: '',
    });
    setAddError('');
    setVerifiedAccountInfo(null);
    setVerifyAccountError('');
    setIsAddModalOpen(true);
  };

  const handleVerifyBeneficiaryAccount = async (accountNum) => {
    const target = (accountNum || addForm.accountNumber)?.trim();
    if (!target || target.length < 8) {
      setVerifyAccountError('Please enter at least 8 digits to verify.');
      return;
    }

    try {
      setVerifyingAccount(true);
      setVerifyAccountError('');
      const data = await transactionService.lookupReceiver(target);
      if (data?.account) {
        setVerifiedAccountInfo(data.account);
        // Auto-populate name if not entered yet
        if (!addForm.name && data.account.user?.name) {
          setAddForm((prev) => ({ ...prev, name: data.account.user.name }));
        }
      }
    } catch (err) {
      setVerifiedAccountInfo(null);
      setVerifyAccountError(
        'Account not found in Finova Bank. Finova accounts are 12 digits (e.g. 408234977525).'
      );
    } finally {
      setVerifyingAccount(false);
    }
  };

  const handleCreateBeneficiary = async (e) => {
    e.preventDefault();
    setAddError('');
    setIsSubmittingAdd(true);

    try {
      await beneficiaryService.addBeneficiary(addForm);
      setIsAddModalOpen(false);
      fetchBeneficiaries();
    } catch (err) {
      setAddError(err.message || 'Failed to add beneficiary.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Edit Beneficiary
  const handleOpenEdit = (b) => {
    setSelectedBeneficiary(b);
    setEditForm({
      name: b.name,
      accountNumber: b.accountNumber,
      bankName: b.bankName || 'Finova',
      nickname: b.nickname || '',
      status: b.status || 'Active',
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleUpdateBeneficiary = async (e) => {
    e.preventDefault();
    setEditError('');
    setIsSubmittingEdit(true);

    try {
      await beneficiaryService.updateBeneficiary(selectedBeneficiary._id, editForm);
      setIsEditModalOpen(false);
      fetchBeneficiaries();
    } catch (err) {
      setEditError(err.message || 'Failed to update beneficiary.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Toggle Active / Inactive status directly
  const handleToggleStatus = async (b) => {
    const nextStatus = b.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await beneficiaryService.updateBeneficiary(b._id, { status: nextStatus });
      showToast(`Beneficiary ${b.name} marked as ${nextStatus}.`, 'success');
      fetchBeneficiaries();
    } catch (err) {
      showToast(err.message || 'Failed to toggle beneficiary status.', 'error');
    }
  };

  // Delete Beneficiary
  const handleOpenDelete = (b) => {
    setBeneficiaryToDelete(b);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!beneficiaryToDelete) return;
    setIsSubmittingDelete(true);

    try {
      await beneficiaryService.deleteBeneficiary(beneficiaryToDelete._id);
      showToast(`Beneficiary ${beneficiaryToDelete.name} deleted.`, 'info');
      setIsDeleteModalOpen(false);
      setBeneficiaryToDelete(null);
      fetchBeneficiaries();
    } catch (err) {
      showToast(err.message || 'Failed to delete beneficiary.', 'error');
    } finally {
      setIsSubmittingDelete(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="h-6 w-6 text-brand-600" />
            <span>Beneficiaries & Payees</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Save trusted recipients for instant, one-click money transfers
          </p>
        </div>

        <Button variant="primary" icon={UserPlus} onClick={handleOpenAdd}>
          Add Beneficiary
        </Button>
      </div>

      {/* Search & Status Filters */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by recipient name, nickname, account number, or bank..."
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

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1.5 w-full md:w-auto">
            {['ALL', 'Active', 'Inactive'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'All Payees' : st}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          {error}
        </div>
      )}

      {/* Beneficiaries Grid */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Loading saved beneficiaries..." />
        </div>
      ) : beneficiaries.length === 0 ? (
        <Card className="text-center py-16 p-6">
          <CardContent className="space-y-4">
            <Users className="h-12 w-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">No Beneficiaries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {search || statusFilter !== 'ALL'
                ? 'No recipients match your current search criteria.'
                : 'You have not added any beneficiaries yet. Add your frequently used recipients for quick transfers.'}
            </p>
            <Button variant="primary" size="sm" icon={UserPlus} onClick={handleOpenAdd}>
              Add First Beneficiary
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {beneficiaries.map((b) => {
            const isActive = b.status === 'Active';

            return (
              <Card
                key={b._id}
                hover
                className={`relative overflow-hidden flex flex-col justify-between border-2 transition-all ${
                  isActive ? 'border-[var(--finova-border)] bg-[var(--finova-card-bg)]' : 'border-[var(--finova-border-light)] opacity-60 bg-[var(--finova-bg-secondary)]'
                }`}
              >
                <div>
                  {/* Card Header Bar */}
                  <div className="p-5 pb-3 border-b border-[var(--finova-border-light)] flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-600 dark:text-brand-400 font-extrabold flex items-center justify-center text-sm uppercase">
                        {b.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-[var(--finova-text-heading)] leading-tight">
                          {b.name}
                        </h3>
                        {b.nickname && (
                          <p className="text-[11px] text-brand-500 font-medium mt-0.5">
                            "{b.nickname}"
                          </p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] border border-[var(--finova-border-light)]'
                      }`}
                    >
                      {isActive ? <CheckCircle2 className="h-3 w-3" /> : <Power className="h-3 w-3" />}
                      <span>{b.status}</span>
                    </span>
                  </div>

                  {/* Card Content Details */}
                  <div className="p-5 space-y-3">
                    {/* Bank Name */}
                    <div className="flex items-center gap-1.5 text-xs text-[var(--finova-text-muted)]">
                      <Building className="h-3.5 w-3.5 text-[var(--finova-text-muted)] shrink-0" />
                      <span className="font-semibold text-[var(--finova-text-secondary)]">{b.bankName || 'Finova'}</span>
                    </div>

                    {/* Account Number Box */}
                    <div className="p-2.5 rounded-lg bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] flex items-center justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[var(--finova-text-muted)] block">
                          Account Number
                        </span>
                        <span className="font-mono text-xs font-bold text-[var(--finova-text-heading)] tracking-wider">
                          {b.accountNumber}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(b.accountNumber)}
                        className="p-1.5 text-[var(--finova-text-muted)] hover:text-[var(--finova-text-heading)] rounded hover:bg-[var(--finova-card-hover)] transition-colors"
                        title="Copy Account Number"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {copiedId === b.accountNumber && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                        Account number copied!
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(b)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors text-xs font-semibold flex items-center gap-1"
                      title={isActive ? 'Deactivate Beneficiary' : 'Activate Beneficiary'}
                    >
                      <Power className="h-3.5 w-3.5" />
                      <span className="text-[11px]">{isActive ? 'Deactivate' : 'Activate'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(b)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors"
                      title="Edit Beneficiary"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDelete(b)}
                      className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                      title="Delete Beneficiary"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <Link to={`/transfer?receiver=${b.accountNumber}`}>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Send}
                      disabled={!isActive}
                      className="text-xs py-1 px-3 !bg-emerald-600 hover:!bg-emerald-700"
                    >
                      Send Money
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* ADD BENEFICIARY MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Beneficiary"
        description="Enter payee bank and account details"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmittingAdd}
              onClick={handleCreateBeneficiary}
            >
              Save Beneficiary
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateBeneficiary} className="space-y-4">
          {addError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{addError}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <p className="font-semibold text-slate-700">💡 Finova Transfer Tip:</p>
            <p className="mt-0.5 text-[11px] text-slate-500">
              For instant transfers within Finova, the payee must have an active 12-digit Finova account (format: <span className="font-mono font-bold text-slate-700">4082XXXXXXXX</span>).
            </p>
            <button
              type="button"
              onClick={() => {
                setAddForm({
                  ...addForm,
                  accountNumber: '408234977525',
                  name: 'Sarah Jenkins',
                  bankName: 'Finova',
                });
                handleVerifyBeneficiaryAccount('408234977525');
              }}
              className="mt-1.5 text-[11px] font-bold text-brand-600 hover:text-brand-700 hover:underline"
            >
              + Use Demo Customer: Sarah Jenkins (408234977525)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              12-Digit Account Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 408234977525"
                value={addForm.accountNumber}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setAddForm({ ...addForm, accountNumber: val });
                  if (val.length === 12) {
                    handleVerifyBeneficiaryAccount(val);
                  } else {
                    setVerifiedAccountInfo(null);
                    setVerifyAccountError('');
                  }
                }}
                maxLength={12}
                className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-mono font-semibold focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleVerifyBeneficiaryAccount()}
                isLoading={verifyingAccount}
              >
                Verify
              </Button>
            </div>
          </div>

          {/* Verification Status */}
          {verifiedAccountInfo && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <div>
                <span className="font-bold">{verifiedAccountInfo.user?.name}</span>
                <span className="text-emerald-700 ml-1">({verifiedAccountInfo.accountType} Account • {verifiedAccountInfo.status})</span>
              </div>
            </div>
          )}

          {verifyAccountError && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p>{verifyAccountError}</p>
                <button
                  type="button"
                  onClick={() => {
                    setAddForm({
                      ...addForm,
                      accountNumber: '408234977525',
                      name: 'Sarah Jenkins',
                      bankName: 'Finova',
                    });
                    handleVerifyBeneficiaryAccount('408234977525');
                  }}
                  className="mt-1 text-[11px] font-bold text-brand-600 hover:underline"
                >
                  Click here to use Demo Customer (408234977525)
                </button>
              </div>
            </div>
          )}

          <Input
            label="Beneficiary Full Name"
            placeholder="e.g. Sarah Jenkins"
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
            required
          />

          <Input
            label="Bank Name"
            placeholder="Finova"
            value={addForm.bankName}
            onChange={(e) => setAddForm({ ...addForm, bankName: e.target.value })}
            helperText="Default: Finova"
          />

          <Input
            label="Nickname / Memo (Optional)"
            placeholder="e.g. Landlord, Gym Trainer, Mom"
            value={addForm.nickname}
            onChange={(e) => setAddForm({ ...addForm, nickname: e.target.value })}
          />
        </form>
      </Modal>

      {/* EDIT BENEFICIARY MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Beneficiary Details"
        description="Modify payee information or operational status"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmittingEdit}
              onClick={handleUpdateBeneficiary}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateBeneficiary} className="space-y-4">
          {editError && (
            <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span>{editError}</span>
            </div>
          )}

          <Input
            label="Beneficiary Full Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />

          <Input
            label="Account Number"
            value={editForm.accountNumber}
            onChange={(e) =>
              setEditForm({ ...editForm, accountNumber: e.target.value.replace(/[^0-9]/g, '') })
            }
            maxLength={12}
            required
          />

          <Input
            label="Bank Name"
            value={editForm.bankName}
            onChange={(e) => setEditForm({ ...editForm, bankName: e.target.value })}
          />

          <Input
            label="Nickname / Memo"
            value={editForm.nickname}
            onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={editForm.status}
              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              className="w-full p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-brand-500"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isSubmittingDelete && setIsDeleteModalOpen(false)}
        title="Delete Beneficiary"
        description="Are you sure you want to delete this saved payee?"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isSubmittingDelete}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isSubmittingDelete}
              onClick={handleConfirmDelete}
            >
              Delete Beneficiary
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs text-slate-600">
          <p>
            You are about to remove{' '}
            <span className="font-bold text-slate-900">{beneficiaryToDelete?.name}</span> (Account:{' '}
            <span className="font-mono font-semibold">{beneficiaryToDelete?.accountNumber}</span>) from
            your saved beneficiaries list.
          </p>
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>This action cannot be undone. You will need to re-add the payee to transfer again.</span>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Beneficiaries;
