import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cardService from '../../services/cardService';
import accountService from '../../services/accountService';
import { useAuth } from '../../context/AuthContext';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Loader from '../../components/ui/Loader';
import {
  CreditCard,
  Plus,
  Lock,
  Unlock,
  KeyRound,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  RotateCw,
  Wallet,
  Sparkles,
  Zap,
  Globe,
  Radio,
  Info,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const CARD_TYPES = [
  {
    id: 'Visa Platinum Debit',
    name: 'Visa Platinum Debit',
    network: 'visa',
    tier: 'Platinum',
    bgClass: 'from-slate-900 via-indigo-950 to-slate-950',
    accentColor: 'text-indigo-400',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    description: 'Complimentary travel insurance & worldwide acceptance',
  },
  {
    id: 'Mastercard Gold Debit',
    name: 'Mastercard Gold Debit',
    network: 'mastercard',
    tier: 'Gold',
    bgClass: 'from-amber-950 via-yellow-900 to-amber-900',
    accentColor: 'text-amber-400',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    description: '1% cashback on online purchases & purchase protection',
  },
  {
    id: 'Visa Signature Debit',
    name: 'Visa Signature Debit',
    network: 'visa',
    tier: 'Signature',
    bgClass: 'from-sky-950 via-slate-900 to-cyan-950',
    accentColor: 'text-cyan-400',
    badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    description: 'VIP airport lounge access & 24/7 concierge assistance',
  },
  {
    id: 'Mastercard World Debit',
    name: 'Mastercard World Debit',
    network: 'mastercard',
    tier: 'World',
    bgClass: 'from-emerald-950 via-teal-950 to-slate-950',
    accentColor: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    description: 'Zero foreign transaction fees & priority booking privileges',
  },
];

const Cards = () => {
  const { user } = useAuth();

  // Cards & Accounts state
  const [cards, setCards] = useState([]);
  const [userAccounts, setUserAccounts] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Card view state (flip & reveal)
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  // Simulated ephemeral CVV (consistent per card based on its last 4 digits)
  const simulatedCvv = selectedCard ? `${(parseInt(selectedCard.lastFour, 10) % 900) + 100}` : '842';

  // Apply Card Modal state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    accountId: '',
    cardType: 'Visa Platinum Debit',
    pin: '',
    confirmPin: '',
    transactionLimit: 25000,
  });
  const [applyError, setApplyError] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  // Block/Unblock state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Change PIN state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinForm, setPinForm] = useState({
    currentPin: '',
    newPin: '',
    confirmPin: '',
  });
  const [pinError, setPinError] = useState('');
  const [isSubmittingPin, setIsSubmittingPin] = useState(false);

  // Set Limit state
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitValue, setLimitValue] = useState(25000);
  const [limitError, setLimitError] = useState('');
  const [isSubmittingLimit, setIsSubmittingLimit] = useState(false);

  // Toast / notification state
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load user cards and accounts
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [cardsRes, accountsRes] = await Promise.all([
        cardService.getCards(),
        accountService.getAccounts(),
      ]);

      const fetchedCards = cardsRes?.cards || [];
      setCards(fetchedCards);

      const fetchedAccounts = accountsRes?.accounts || [];
      setUserAccounts(fetchedAccounts.filter((a) => a.status === 'Active'));

      if (fetchedCards.length > 0) {
        setSelectedCard(fetchedCards[0]);
      } else {
        setSelectedCard(null);
      }
    } catch (err) {
      console.error('Failed to load card data:', err);
      showToast(err.message || 'Failed to load debit cards', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Apply Card
  const handleOpenApplyModal = () => {
    setApplyError('');
    setApplyForm({
      accountId: userAccounts.length > 0 ? userAccounts[0]._id : '',
      cardType: 'Visa Platinum Debit',
      pin: '',
      confirmPin: '',
      transactionLimit: 25000,
    });
    setIsApplyModalOpen(true);
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    setApplyError('');

    if (!applyForm.accountId) {
      setApplyError('Please select a bank account to link with this card.');
      return;
    }

    if (!/^[0-9]{4}$/.test(applyForm.pin)) {
      setApplyError('PIN must be exactly 4 numeric digits.');
      return;
    }

    if (applyForm.pin !== applyForm.confirmPin) {
      setApplyError('PIN and confirmation PIN do not match.');
      return;
    }

    try {
      setIsApplying(true);
      const res = await cardService.applyCard({
        accountId: applyForm.accountId,
        cardType: applyForm.cardType,
        pin: applyForm.pin,
        transactionLimit: applyForm.transactionLimit,
      });

      showToast(res.message || 'Virtual debit card issued successfully!');
      setIsApplyModalOpen(false);
      await loadData();
      if (res.card) {
        setSelectedCard(res.card);
      }
    } catch (err) {
      setApplyError(err.message || 'Failed to issue card. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  // Handle Status Toggle (Block/Unblock)
  const handleToggleStatus = async () => {
    if (!selectedCard) return;
    const newStatus = selectedCard.status === 'Blocked' ? 'Active' : 'Blocked';

    try {
      setIsUpdatingStatus(true);
      const res = await cardService.updateStatus(selectedCard._id, newStatus);
      showToast(res.message);
      setIsBlockModalOpen(false);

      // Update local state
      setSelectedCard(res.card);
      setCards((prev) =>
        prev.map((c) => (c._id === res.card._id ? res.card : c))
      );
    } catch (err) {
      showToast(err.message || 'Failed to update card status', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle PIN Change
  const handleOpenPinModal = () => {
    setPinError('');
    setPinForm({ currentPin: '', newPin: '', confirmPin: '' });
    setIsPinModalOpen(true);
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');

    if (!/^[0-9]{4}$/.test(pinForm.newPin)) {
      setPinError('New PIN must be exactly 4 numeric digits.');
      return;
    }

    if (pinForm.newPin !== pinForm.confirmPin) {
      setPinError('New PIN and confirmation PIN do not match.');
      return;
    }

    try {
      setIsSubmittingPin(true);
      const res = await cardService.changePin(selectedCard._id, pinForm);
      showToast(res.message || 'Card PIN updated successfully!');
      setIsPinModalOpen(false);
    } catch (err) {
      setPinError(err.message || 'Failed to change PIN.');
    } finally {
      setIsSubmittingPin(false);
    }
  };

  // Handle Limit Change
  const handleOpenLimitModal = () => {
    setLimitError('');
    setLimitValue(selectedCard?.transactionLimit || 25000);
    setIsLimitModalOpen(true);
  };

  const handleLimitSubmit = async (e) => {
    e.preventDefault();
    setLimitError('');

    const val = Number(limitValue);
    if (isNaN(val) || val < 100 || val > 500000) {
      setLimitError(`Daily limit must be between ${formatCurrency(100)} and ${formatCurrency(500000)}.`);
      return;
    }

    try {
      setIsSubmittingLimit(true);
      const res = await cardService.updateLimit(selectedCard._id, val);
      showToast(res.message);
      setIsLimitModalOpen(false);

      // Update local state
      setSelectedCard(res.card);
      setCards((prev) =>
        prev.map((c) => (c._id === res.card._id ? res.card : c))
      );
    } catch (err) {
      setLimitError(err.message || 'Failed to update transaction limit.');
    } finally {
      setIsSubmittingLimit(false);
    }
  };

  // Find visual theme based on card type
  const activeCardTypeTheme = CARD_TYPES.find(
    (t) => t.name === selectedCard?.cardType
  ) || CARD_TYPES[0];

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center">
        <Loader size="lg" label="Loading virtual cards..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-xs font-semibold border transition-all ${
            toastMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}
        >
          {toastMessage.type === 'error' ? (
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CreditCard className="h-6 w-6 text-brand-600" />
            <span>Virtual Debit Cards</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulated digital debit card credentials with 256-bit tokenization and instant freeze controls
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={handleOpenApplyModal}
          disabled={userAccounts.length === 0}
        >
          Apply for Card
        </Button>
      </div>

      {cards.length === 0 ? (
        /* Empty State */
        <Card className="py-16 text-center border-dashed border-2 border-slate-200">
          <CardContent className="max-w-md mx-auto space-y-4">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center border border-brand-100">
              <CreditCard className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">No Debit Cards Issued</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                You do not have any virtual debit cards linked to your Finova account yet.
                Apply now to unlock instant online spending and contactless payment controls.
              </p>
            </div>
            <div className="pt-2">
              <Button
                variant="primary"
                icon={Plus}
                onClick={handleOpenApplyModal}
                disabled={userAccounts.length === 0}
              >
                Issue My First Card
              </Button>
              {userAccounts.length === 0 && (
                <p className="text-[11px] text-rose-600 mt-2">
                  You need an active bank account before issuing a card.{' '}
                  <Link to="/accounts" className="underline font-semibold">
                    Open an account
                  </Link>
                  .
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Main Cards Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Virtual Card Display & Action Buttons */}
          <div className="lg:col-span-7 space-y-6">
            {/* Multi-card selector tabs if user has > 1 card */}
            {cards.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {cards.map((card, idx) => {
                  const isSelected = selectedCard?._id === card._id;
                  return (
                    <button
                      key={card._id}
                      type="button"
                      onClick={() => {
                        setSelectedCard(card);
                        setIsFlipped(false);
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        isSelected
                          ? 'bg-[var(--finova-deep)] text-white shadow-sm'
                          : 'bg-[var(--finova-card-bg)] text-[var(--finova-text-secondary)] border border-[var(--finova-border)] hover:bg-[var(--finova-card-hover)]'
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span>
                        {card.cardType.split(' ')[0]} •••• {card.lastFour}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                          card.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}
                      >
                        {card.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* VIRTUAL DEBIT CARD COMPONENT */}
            <div className="perspective-1000 max-w-md mx-auto">
              <div
                className={`relative w-full aspect-[1.586/1] rounded-3xl p-6 text-white shadow-2xl transition-all duration-700 select-none overflow-hidden bg-gradient-to-br ${
                  activeCardTypeTheme.bgClass
                } ${
                  selectedCard?.status === 'Blocked'
                    ? 'ring-4 ring-rose-500/50'
                    : 'ring-1 ring-white/10 hover:shadow-brand-500/20'
                }`}
              >
                {/* Background decorative watermark patterns */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />

                {!isFlipped ? (
                  /* CARD FRONT */
                  <div className="relative h-full flex flex-col justify-between z-10">
                    {/* Top Row: Brand & Chip & Contactless */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center text-white backdrop-blur-xs">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black tracking-widest uppercase text-white/95">
                            FINOVA
                          </p>
                          <p className="text-[9px] font-semibold text-white/60 -mt-0.5">
                            {selectedCard?.cardType}
                          </p>
                        </div>
                      </div>

                      {/* Contactless Wave Icon */}
                      <div className="text-white/70">
                        <Radio className="h-5 w-5 rotate-90" />
                      </div>
                    </div>

                    {/* Middle Row: EMV Chip & Masked Card Number */}
                    <div className="my-auto space-y-3">
                      {/* Realistic EMV Chip Graphic */}
                      <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 shadow-inner border border-amber-600/40 relative overflow-hidden flex items-center justify-center">
                        <div className="w-full h-[1px] bg-amber-700/40 absolute top-2.5" />
                        <div className="w-full h-[1px] bg-amber-700/40 absolute bottom-2.5" />
                        <div className="h-full w-[1px] bg-amber-700/40 absolute left-3.5" />
                        <div className="h-full w-[1px] bg-amber-700/40 absolute right-3.5" />
                      </div>

                      {/* Card Number */}
                      <div className="font-mono text-lg sm:text-xl font-bold tracking-[0.25em] text-white text-shadow-sm">
                        {selectedCard?.maskedCardNumber || '4532 •••• •••• 8921'}
                      </div>
                    </div>

                    {/* Bottom Row: Cardholder Name, Expiry, and Network Logo */}
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="block text-[8px] uppercase tracking-widest text-white/50 font-bold">
                          Cardholder
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-wider uppercase text-white truncate max-w-[170px] block">
                          {selectedCard?.cardholderName || user?.name || 'VALUED CUSTOMER'}
                        </span>
                      </div>

                      <div className="text-center">
                        <span className="block text-[8px] uppercase tracking-widest text-white/50 font-bold">
                          Expires
                        </span>
                        <span className="font-mono text-xs sm:text-sm font-bold tracking-wider text-white">
                          {selectedCard?.expiryDate || '12/29'}
                        </span>
                      </div>

                      {/* Network Logo Badge (Visa / Mastercard) */}
                      <div className="text-right">
                        {selectedCard?.cardType.toLowerCase().includes('mastercard') ? (
                          <div className="flex -space-x-3 items-center">
                            <div className="h-7 w-7 rounded-full bg-rose-500 opacity-90 shadow-sm" />
                            <div className="h-7 w-7 rounded-full bg-amber-400 opacity-90 shadow-sm" />
                          </div>
                        ) : (
                          <span className="font-black italic text-lg tracking-tighter text-white drop-shadow-md">
                            VISA
                          </span>
                        )}
                        <span className="block text-[8px] font-black uppercase tracking-widest text-white/60 text-right">
                          DEBIT
                        </span>
                      </div>
                    </div>

                    {/* Blocked Overlay Banner */}
                    {selectedCard?.status === 'Blocked' && (
                      <div className="absolute inset-0 -m-6 bg-slate-950/80 backdrop-blur-xs z-20 flex flex-col items-center justify-center text-center p-4">
                        <div className="h-12 w-12 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-2">
                          <Lock className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-black uppercase tracking-wider text-white">
                          Card Frozen / Blocked
                        </p>
                        <p className="text-[11px] text-slate-300 mt-1">
                          Transactions and online payments are suspended
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* CARD BACK */
                  <div className="relative h-full flex flex-col justify-between -mx-6 -my-6 z-10">
                    {/* Magnetic Stripe */}
                    <div className="w-full h-10 bg-slate-950 mt-4 shadow-md" />

                    {/* CVV & Signature Panel */}
                    <div className="px-6 py-2">
                      <div className="flex items-center justify-between text-[8px] text-white/60 font-semibold mb-1">
                        <span>AUTHORIZED SIGNATURE</span>
                        <span>SECURITY CODE</span>
                      </div>
                      <div className="flex items-center">
                        <div className="flex-1 h-8 bg-slate-200/90 rounded-l flex items-center px-3 font-mono text-[10px] text-slate-500 italic tracking-widest">
                          Finova Verified Member
                        </div>
                        <div className="w-16 h-8 bg-white rounded-r flex items-center justify-center font-mono font-bold text-xs text-slate-900 border-l border-slate-300">
                          {showCvv ? simulatedCvv : '•••'}
                        </div>
                      </div>
                    </div>

                    {/* Legal & Security Statement */}
                    <div className="px-6 pb-4 text-[8px] text-white/60 leading-tight space-y-1">
                      <p>
                        This virtual debit card is issued by Finova pursuant to license.
                        Protected by 256-bit simulated encryption for educational demonstration.
                      </p>
                      <div className="flex justify-between items-center text-white/80 pt-1 border-t border-white/10">
                        <span>Customer Service: +1 (800) 555-BANK</span>
                        <span className="font-mono">{selectedCard?.lastFour}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Flip and CVV Toggle Controls */}
              <div className="flex items-center justify-center gap-4 mt-3">
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors py-1 px-3 rounded-lg hover:bg-slate-100"
                >
                  <RotateCw className="h-3.5 w-3.5" />
                  <span>{isFlipped ? 'Show Card Front' : 'Flip to View CVV / Back'}</span>
                </button>

                {isFlipped && (
                  <button
                    type="button"
                    onClick={() => setShowCvv(!showCvv)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 transition-colors py-1 px-3 rounded-lg hover:bg-brand-50"
                  >
                    {showCvv ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    <span>{showCvv ? 'Hide CVV' : 'Reveal CVV'}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Quick Action Controls Panel */}
            {selectedCard && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Card Management Controls</CardTitle>
                  <CardDescription>Instant security toggles and configuration for this card</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* 1. Block / Unblock Button */}
                    <button
                      type="button"
                      onClick={() => setIsBlockModalOpen(true)}
                      className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                        selectedCard.status === 'Blocked'
                          ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60'
                          : 'border-rose-200 bg-rose-50/60 hover:bg-rose-100/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className={`p-2 rounded-lg ${
                            selectedCard.status === 'Blocked'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {selectedCard.status === 'Blocked' ? (
                            <Unlock className="h-4 w-4" />
                          ) : (
                            <Lock className="h-4 w-4" />
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            selectedCard.status === 'Blocked'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {selectedCard.status}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-slate-900">
                          {selectedCard.status === 'Blocked' ? 'Unfreeze Card' : 'Freeze Card'}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {selectedCard.status === 'Blocked'
                            ? 'Resume transactions'
                            : 'Temporarily block payments'}
                        </p>
                      </div>
                    </button>

                    {/* 2. Change PIN Button */}
                    <button
                      type="button"
                      onClick={handleOpenPinModal}
                      disabled={selectedCard.status === 'Blocked'}
                      className="p-4 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] hover:bg-[var(--finova-card-hover)] text-left transition-all flex flex-col justify-between disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                          <KeyRound className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--finova-bg-secondary)] text-[var(--finova-text-secondary)] border border-[var(--finova-border-light)]">
                          4 Digits
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[var(--finova-text-heading)]">Change PIN</p>
                        <p className="text-[11px] text-[var(--finova-text-secondary)] mt-0.5">
                          Update secure card authorization code
                        </p>
                      </div>
                    </button>

                    {/* 3. Set Transaction Limit Button */}
                    <button
                      type="button"
                      onClick={handleOpenLimitModal}
                      className="p-4 rounded-xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] hover:bg-[var(--finova-card-hover)] text-left transition-all flex flex-col justify-between shadow-xs"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <Sliders className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--finova-bg-secondary)] text-[var(--finova-text-heading)] border border-[var(--finova-border-light)]">
                          {formatCurrency(selectedCard.transactionLimit || 0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[var(--finova-text-heading)]">Daily Limit</p>
                        <p className="text-[11px] text-[var(--finova-text-secondary)] mt-0.5">
                          Configure daily spending ceiling
                        </p>
                      </div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Card Analytics, Linked Account & Security Features */}
          <div className="lg:col-span-5 space-y-6">
            {selectedCard && (
              <>
                {/* Linked Bank Account Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Linked Bank Account</span>
                      <Link
                        to={`/accounts/${selectedCard.account?._id || ''}`}
                        className="text-xs font-semibold text-brand-600 hover:underline"
                      >
                        View Account →
                      </Link>
                    </CardTitle>
                    <CardDescription>
                       Primary debit account funding this virtual card
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                          <Wallet className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-900">
                            {selectedCard.account?.accountType || 'Savings'} Account
                          </p>
                          <p className="font-mono text-[11px] text-slate-500">
                            {selectedCard.account?.accountNumber || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase text-slate-400">Available</span>
                        <p className="text-sm font-extrabold text-slate-900">
                          {formatCurrency(selectedCard.account?.balance || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Spend Limit Meter */}
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 font-medium">Daily Spend Limit</span>
                        <span className="font-extrabold text-slate-900">
                          {formatCurrency(selectedCard.transactionLimit || 0)}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-indigo-600 rounded-full"
                          style={{ width: '15%' }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                        <span>{formatCurrency(0)} Spent Today</span>
                        <span>
                          {formatCurrency(selectedCard.transactionLimit || 0)} Remaining
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Card Specs & Audit Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Card Specifications</CardTitle>
                    <CardDescription>Technical specifications & verification status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Network Tier</span>
                        <span className="font-bold text-slate-800">{selectedCard.cardType}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Card Form</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Sparkles className="h-3 w-3 text-brand-600" /> Virtual Digital Card
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Cardholder Name</span>
                        <span className="font-mono font-bold text-slate-800">
                          {selectedCard.cardholderName}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Expiration Date</span>
                        <span className="font-mono font-bold text-slate-800">
                          {selectedCard.expiryDate}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100">
                        <span className="text-slate-500">Issue Date</span>
                        <span className="font-medium text-slate-700">
                          {new Date(selectedCard.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between py-1.5">
                        <span className="text-slate-500">Status</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                            selectedCard.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {selectedCard.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Guarantees */}
                <div className="rounded-2xl bg-gradient-to-br from-brand-900 to-indigo-950 p-5 text-white shadow-md">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-white/10 backdrop-blur-xs text-white">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold tracking-tight">Zero-Liability Security</h4>
                      <p className="text-[11px] text-brand-200">
                        College project simulated protection
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2 text-[11px] text-white/80">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>No plaintext credentials stored on server</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Bcrypt cryptographic PIN encryption</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span>Instant freeze & transaction limit caps</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 1. APPLY FOR NEW CARD MODAL */}
      <Modal
        isOpen={isApplyModalOpen}
        onClose={() => !isApplying && setIsApplyModalOpen(false)}
        title="Apply for Virtual Debit Card"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleApplySubmit} className="space-y-5">
          {applyError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{applyError}</span>
            </div>
          )}

          {/* Account selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Link to Bank Account
            </label>
            <select
              value={applyForm.accountId}
              onChange={(e) => setApplyForm({ ...applyForm, accountId: e.target.value })}
              className="w-full rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)] px-3.5 py-2.5 text-xs font-semibold text-[var(--finova-text-heading)] transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              required
            >
              {userAccounts.map((acc) => (
                <option key={acc._id} value={acc._id}>
                  {acc.accountType} Account • {acc.accountNumber} ({formatCurrency(acc.balance || 0)})
                </option>
              ))}
            </select>
          </div>

          {/* Card Network & Tier Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Card Network & Tier
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CARD_TYPES.map((type) => {
                const isSelected = applyForm.cardType === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setApplyForm({ ...applyForm, cardType: type.id })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 ring-1 ring-brand-600'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-xs text-slate-900">{type.name}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${type.badge}`}>
                        {type.tier}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4-digit PIN setup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Set 4-Digit PIN
              </label>
              <Input
                type="password"
                placeholder="••••"
                maxLength={4}
                value={applyForm.pin}
                onChange={(e) =>
                  setApplyForm({
                    ...applyForm,
                    pin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4),
                  })
                }
                className="font-mono text-center text-sm font-bold tracking-widest"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm 4-Digit PIN
              </label>
              <Input
                type="password"
                placeholder="••••"
                maxLength={4}
                value={applyForm.confirmPin}
                onChange={(e) =>
                  setApplyForm({
                    ...applyForm,
                    confirmPin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4),
                  })
                }
                className="font-mono text-center text-sm font-bold tracking-widest"
                required
              />
            </div>
          </div>

          {/* Initial Limit */}
          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1.5">
              <span>Daily Transaction Limit</span>
              <span className="font-extrabold text-brand-600">
                {formatCurrency(applyForm.transactionLimit)}
              </span>
            </div>
            <input
              type="range"
              min={100}
              max={500000}
              step={500}
              value={applyForm.transactionLimit}
              onChange={(e) =>
                setApplyForm({ ...applyForm, transactionLimit: Number(e.target.value) })
              }
              className="w-full accent-brand-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
              <span>{formatCurrency(100)} (Min)</span>
              <span>{formatCurrency(500000)} (Max)</span>
            </div>
          </div>

          {/* Notice */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
            <Info className="h-4 w-4 text-brand-600 shrink-0" />
            <span>
              Virtual cards are issued instantly. Real card numbers and credentials are never stored.
            </span>
          </div>

          {/* Modal Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsApplyModalOpen(false)}
              disabled={isApplying}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isApplying}>
              Issue Virtual Card
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. BLOCK / UNBLOCK CONFIRMATION MODAL */}
      <Modal
        isOpen={isBlockModalOpen}
        onClose={() => !isUpdatingStatus && setIsBlockModalOpen(false)}
        title={selectedCard?.status === 'Blocked' ? 'Unfreeze Debit Card' : 'Freeze Debit Card'}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div
            className={`p-4 rounded-2xl flex items-center gap-3 ${
              selectedCard?.status === 'Blocked'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-rose-50 text-rose-800'
            }`}
          >
            <div
              className={`p-2.5 rounded-xl ${
                selectedCard?.status === 'Blocked'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {selectedCard?.status === 'Blocked' ? (
                <Unlock className="h-5 w-5" />
              ) : (
                <Lock className="h-5 w-5" />
              )}
            </div>
            <div>
              <p className="font-bold text-xs">
                {selectedCard?.status === 'Blocked'
                  ? 'Reactivate card payments?'
                  : 'Temporarily block all card transactions?'}
              </p>
              <p className="text-[11px] opacity-80 mt-0.5">
                {selectedCard?.status === 'Blocked'
                  ? 'Your card will be immediately usable for transactions.'
                  : 'No funds can be debited while the card remains blocked.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBlockModalOpen(false)}
              disabled={isUpdatingStatus}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={selectedCard?.status === 'Blocked' ? 'primary' : 'danger'}
              onClick={handleToggleStatus}
              isLoading={isUpdatingStatus}
            >
              {selectedCard?.status === 'Blocked' ? 'Confirm Unfreeze' : 'Freeze Card Now'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. CHANGE PIN MODAL */}
      <Modal
        isOpen={isPinModalOpen}
        onClose={() => !isSubmittingPin && setIsPinModalOpen(false)}
        title="Change 4-Digit Card PIN"
        maxWidth="max-w-md"
      >
        <form onSubmit={handlePinSubmit} className="space-y-4">
          {pinError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{pinError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Current PIN (Optional for verified sessions)
            </label>
            <Input
              type="password"
              placeholder="••••"
              maxLength={4}
              value={pinForm.currentPin}
              onChange={(e) =>
                setPinForm({
                  ...pinForm,
                  currentPin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4),
                })
              }
              className="font-mono text-center text-sm font-bold tracking-widest"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                New 4-Digit PIN
              </label>
              <Input
                type="password"
                placeholder="••••"
                maxLength={4}
                value={pinForm.newPin}
                onChange={(e) =>
                  setPinForm({
                    ...pinForm,
                    newPin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4),
                  })
                }
                className="font-mono text-center text-sm font-bold tracking-widest"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Confirm New PIN
              </label>
              <Input
                type="password"
                placeholder="••••"
                maxLength={4}
                value={pinForm.confirmPin}
                onChange={(e) =>
                  setPinForm({
                    ...pinForm,
                    confirmPin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4),
                  })
                }
                className="font-mono text-center text-sm font-bold tracking-widest"
                required
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            PINs are cryptographically hashed using bcrypt and are never stored in plaintext.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPinModalOpen(false)}
              disabled={isSubmittingPin}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingPin}>
              Update PIN
            </Button>
          </div>
        </form>
      </Modal>

      {/* 4. SET TRANSACTION LIMIT MODAL */}
      <Modal
        isOpen={isLimitModalOpen}
        onClose={() => !isSubmittingLimit && setIsLimitModalOpen(false)}
        title="Set Daily Transaction Limit"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleLimitSubmit} className="space-y-4">
          {limitError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{limitError}</span>
            </div>
          )}

          <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-200/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              New Daily Limit
            </span>
            <div className="text-3xl font-black text-brand-600 mt-1">
              {formatCurrency(Number(limitValue))}
            </div>
          </div>

          <div>
            <input
              type="range"
              min={100}
              max={500000}
              step={500}
              value={limitValue}
              onChange={(e) => setLimitValue(Number(e.target.value))}
              className="w-full accent-brand-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1">
              <span>{formatCurrency(100)} (Minimum)</span>
              <span>{formatCurrency(500000)} (Maximum)</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Transactions exceeding your daily limit will be declined automatically to prevent fraud.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsLimitModalOpen(false)}
              disabled={isSubmittingLimit}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingLimit}>
              Save Limit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Cards;
