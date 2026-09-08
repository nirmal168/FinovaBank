import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Play, Eye, EyeOff, Send, Download, 
  FileText, MoreHorizontal, ShieldCheck, CreditCard, 
  Home, Landmark, User, Zap, Sparkles 
} from 'lucide-react';
import finovaLogoImg from '../../assets/finova-logo.png';
import { useAuth } from '../../context/AuthContext';

const HeroSection = ({ onWatchDemo }) => {
  const [showBalance, setShowBalance] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleAction = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate('/login');
    }
  };

  return (
    <section id="home" className="relative pt-6 pb-16 sm:pt-10 sm:pb-24 overflow-hidden">
      {/* Ambient background glows */}
      <div 
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--finova-sage)]/10 to-[var(--finova-navy)]/10 rounded-full blur-3xl pointer-events-none -z-10" 
        aria-hidden="true" 
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Description, CTAs, Trust Metrics */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8 text-center lg:text-left">
            
            {/* Small Top Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] shadow-xs">
              <span className="h-2 w-2 rounded-full bg-[var(--finova-sage)] animate-pulse" />
              <span className="text-xs font-bold text-[var(--finova-text-heading)] tracking-wide">
                A Smarter Way to Bank
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-1">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[var(--finova-text-heading)] leading-[1.12]">
                Smart Banking. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--finova-navy)] via-[#4F7CAC] to-[var(--finova-sage)]">
                  Smarter Future.
                </span>
              </h1>
            </div>

            {/* Description */}
            <p className="text-base sm:text-lg text-[var(--finova-text-secondary)] max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Finova is a modern digital banking platform designed to help you manage your money simple, 
              secure, and intelligent. Bank, invest, borrow and grow — all in one place.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
              <Link
                to={isAuthenticated ? "/dashboard" : "/register"}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-[var(--finova-navy)] hover:opacity-90 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started'}</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <button
                type="button"
                onClick={onWatchDemo}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm text-[var(--finova-text-heading)] bg-[var(--finova-card-bg)] border border-[var(--finova-border)] hover:bg-[var(--finova-bg-secondary)] shadow-xs transition-all transform hover:-translate-y-0.5"
              >
                <div className="h-5 w-5 rounded-full bg-[var(--finova-navy)] text-white flex items-center justify-center">
                  <Play className="h-2.5 w-2.5 fill-current ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>

            {/* Trust Metrics Bar */}
            <div className="pt-6 sm:pt-8 border-t border-[var(--finova-border)]/80 grid grid-cols-3 gap-4 text-center lg:text-left">
              <div>
                <p className="text-xl sm:text-2xl font-black text-[var(--finova-text-heading)]">50K+</p>
                <p className="text-[11px] sm:text-xs text-[var(--finova-text-muted)] font-medium mt-0.5">
                  Happy Customers <span className="text-[10px] opacity-75 block sm:inline">(Illustrative)</span>
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[var(--finova-text-heading)]">₹500Cr+</p>
                <p className="text-[11px] sm:text-xs text-[var(--finova-text-muted)] font-medium mt-0.5">
                  Volume Processed <span className="text-[10px] opacity-75 block sm:inline">(Demo)</span>
                </p>
              </div>
              <div>
                <p className="text-xl sm:text-2xl font-black text-[var(--finova-text-heading)]">99.9%</p>
                <p className="text-[11px] sm:text-xs text-[var(--finova-text-muted)] font-medium mt-0.5">
                  Secure & Reliable
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Phone Preview + Floating Visa Card + Fraud Badge */}
          <div className="lg:col-span-6 relative flex justify-center items-center py-6">
            
            {/* Handwritten script note (Top Right) */}
            <div className="hidden xl:block absolute -top-4 right-2 text-right pointer-events-none select-none">
              <span className="font-serif italic text-lg text-[var(--finova-navy)] opacity-85 block -rotate-3">
                &ldquo;More Than a Bank,
              </span>
              <span className="font-serif italic text-lg text-[var(--finova-sage)] opacity-85 block rotate-2">
                A Brighter Tomorrow&rdquo;
              </span>
            </div>

            {/* Mobile App Phone Shell Container */}
            <div className="w-full max-w-[320px] sm:max-w-[340px] rounded-[38px] p-3 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl border-4 border-slate-700/60 relative z-10 transition-transform duration-300 hover:scale-[1.01]">
              
              {/* Phone Screen Glass */}
              <div className="rounded-[30px] bg-[var(--finova-card-bg)] border border-[var(--finova-border)] overflow-hidden shadow-inner p-4 space-y-4">
                
                {/* Phone Top Status & User Greeting */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-[var(--finova-text-muted)] font-medium block">Good Morning,</span>
                    <span className="text-sm font-black text-[var(--finova-text-heading)]">Nirmal 👋</span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-[var(--finova-navy)] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    N
                  </div>
                </div>

                {/* Total Balance Mini Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--finova-navy)] to-[#102A43] text-white shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-300 font-medium tracking-wide">Total Balance</span>
                    <button
                      type="button"
                      onClick={() => setShowBalance(!showBalance)}
                      className="text-slate-300 hover:text-white p-0.5 rounded transition-colors"
                      aria-label={showBalance ? "Hide balance" : "Show balance"}
                    >
                      {showBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>

                  <div className="text-2xl font-black tracking-tight">
                    {showBalance ? '₹1,25,450.00' : '••••••••'}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-300/90 pt-1">
                    <span>Savings Account</span>
                    <span className="font-mono">•••• 4582</span>
                  </div>
                </div>

                {/* Quick Action Buttons (Transfer, Deposit, Pay Bills, More) */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAction('/transfer')}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[var(--finova-bg-secondary)] hover:bg-[var(--finova-border)]/50 transition-colors group"
                  >
                    <div className="h-7 w-7 rounded-lg bg-[var(--finova-navy)]/10 text-[var(--finova-navy)] group-hover:scale-105 transition-transform flex items-center justify-center">
                      <Send className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--finova-text-heading)]">Transfer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('/deposit')}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[var(--finova-bg-secondary)] hover:bg-[var(--finova-border)]/50 transition-colors group"
                  >
                    <div className="h-7 w-7 rounded-lg bg-[var(--finova-sage)]/10 text-[var(--finova-sage)] group-hover:scale-105 transition-transform flex items-center justify-center">
                      <Download className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--finova-text-heading)]">Deposit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('/transactions')}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[var(--finova-bg-secondary)] hover:bg-[var(--finova-border)]/50 transition-colors group"
                  >
                    <div className="h-7 w-7 rounded-lg bg-amber-500/10 text-amber-600 group-hover:scale-105 transition-transform flex items-center justify-center">
                      <FileText className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--finova-text-heading)]">Pay Bills</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAction('/cards')}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-[var(--finova-bg-secondary)] hover:bg-[var(--finova-border)]/50 transition-colors group"
                  >
                    <div className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 group-hover:scale-105 transition-transform flex items-center justify-center">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[10px] font-bold text-[var(--finova-text-heading)]">More</span>
                  </button>
                </div>

                {/* Recent Transactions List */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[var(--finova-text-heading)]">Recent Transactions</span>
                    <button
                      type="button"
                      onClick={() => handleAction('/transactions')}
                      className="text-[10px] font-bold text-[var(--finova-navy)] hover:underline"
                    >
                      See All
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {/* Tx 1 */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--finova-bg-secondary)] text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-orange-500/10 text-orange-600 font-bold flex items-center justify-center text-[10px]">
                          a
                        </div>
                        <div>
                          <p className="font-bold text-[11px] text-[var(--finova-text-heading)] leading-tight">Amazon</p>
                          <p className="text-[9px] text-[var(--finova-text-muted)]">Today, 10:24 AM</p>
                        </div>
                      </div>
                      <span className="font-bold text-[11px] text-rose-600 dark:text-rose-400">-₹2,499</span>
                    </div>

                    {/* Tx 2 */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--finova-bg-secondary)] text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold flex items-center justify-center text-[10px]">
                          ₹
                        </div>
                        <div>
                          <p className="font-bold text-[11px] text-[var(--finova-text-heading)] leading-tight">Salary Credit</p>
                          <p className="text-[9px] text-[var(--finova-text-muted)]">01 Sep, 2025</p>
                        </div>
                      </div>
                      <span className="font-bold text-[11px] text-emerald-600 dark:text-emerald-400">+₹45,000</span>
                    </div>

                    {/* Tx 3 */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--finova-bg-secondary)] text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-amber-500/10 text-amber-600 font-bold flex items-center justify-center text-[10px]">
                          💡
                        </div>
                        <div>
                          <p className="font-bold text-[11px] text-[var(--finova-text-heading)] leading-tight">Electricity Bill</p>
                          <p className="text-[9px] text-[var(--finova-text-muted)]">30 Aug, 2025</p>
                        </div>
                      </div>
                      <span className="font-bold text-[11px] text-rose-600 dark:text-rose-400">-₹1,200</span>
                    </div>

                    {/* Tx 4 */}
                    <div className="flex items-center justify-between p-2 rounded-xl bg-[var(--finova-bg-secondary)] text-xs">
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-blue-600 font-bold flex items-center justify-center text-[10px]">
                          ↗
                        </div>
                        <div>
                          <p className="font-bold text-[11px] text-[var(--finova-text-heading)] leading-tight">UPI Transfer</p>
                          <p className="text-[9px] text-[var(--finova-text-muted)]">29 Aug, 2025</p>
                        </div>
                      </div>
                      <span className="font-bold text-[11px] text-rose-600 dark:text-rose-400">-₹5,000</span>
                    </div>
                  </div>
                </div>

                {/* Bottom App Bar */}
                <div className="pt-2 border-t border-[var(--finova-border)] grid grid-cols-4 text-center">
                  <button onClick={() => handleAction('/dashboard')} className="flex flex-col items-center gap-0.5 text-[var(--finova-navy)]">
                    <Home className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-bold">Home</span>
                  </button>
                  <button onClick={() => handleAction('/cards')} className="flex flex-col items-center gap-0.5 text-[var(--finova-text-muted)] hover:text-[var(--finova-text-heading)]">
                    <CreditCard className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-medium">Cards</span>
                  </button>
                  <button onClick={() => handleAction('/loans')} className="flex flex-col items-center gap-0.5 text-[var(--finova-text-muted)] hover:text-[var(--finova-text-heading)]">
                    <Landmark className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-medium">Loans</span>
                  </button>
                  <button onClick={() => handleAction('/profile')} className="flex flex-col items-center gap-0.5 text-[var(--finova-text-muted)] hover:text-[var(--finova-text-heading)]">
                    <User className="h-3.5 w-3.5" />
                    <span className="text-[9px] font-medium">Profile</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Floating Metallic Finova Visa Card (Right Side Overlay) */}
            <div 
              onClick={() => handleAction('/cards')}
              className="hidden sm:block absolute -right-4 lg:-right-10 top-12 sm:top-16 w-60 sm:w-68 rounded-2xl p-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-2xl border border-slate-700/70 transform rotate-6 hover:rotate-2 hover:scale-105 transition-all duration-300 z-20 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <img src={finovaLogoImg} alt="Finova" className="h-5 w-auto object-contain brightness-125" />
                  <span className="font-extrabold tracking-wider text-xs uppercase">FINOVA</span>
                </div>
                <Zap className="h-4 w-4 text-cyan-400" />
              </div>

              {/* EMV Chip & Contactless waves */}
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-8 rounded bg-gradient-to-tr from-amber-300 to-yellow-500 shadow-inner" />
                <div className="text-[10px] text-slate-400 font-mono">RFID )))</div>
              </div>

              {/* Card Number */}
              <p className="font-mono text-xs sm:text-sm font-semibold tracking-widest text-slate-200 mb-3">
                4582 0000 1234 5578
              </p>

              {/* Cardholder Name & VISA Logo */}
              <div className="flex items-end justify-between text-xs">
                <div>
                  <span className="text-[8px] text-slate-400 uppercase block">Cardholder</span>
                  <span className="font-bold text-[10px] sm:text-[11px] tracking-wider uppercase text-slate-200">
                    NIRMAL PRAJAPAT
                  </span>
                </div>
                <span className="font-black italic text-base sm:text-lg tracking-wider text-white">
                  VISA
                </span>
              </div>
            </div>

            {/* Floating AI Fraud Protection Badge (Bottom Left/Right Overlay) */}
            <div 
              onClick={() => {
                const el = document.getElementById('fraud');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden sm:flex absolute -left-4 lg:-left-6 bottom-8 items-center gap-3 p-3.5 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xl z-20 cursor-pointer hover:scale-105 transition-transform"
            >
              <div className="h-10 w-10 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div className="pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs text-[var(--finova-text-heading)]">AI Fraud Protection</span>
                  <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Protected
                  </span>
                </div>
                <p className="text-[10px] text-[var(--finova-text-muted)] mt-0.5 max-w-[190px]">
                  Your transactions are monitored 24/7 with advanced AI.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
};

export default HeroSection;
