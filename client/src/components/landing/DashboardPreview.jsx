import React from 'react';
import { 
  LayoutDashboard, Wallet, ArrowRightLeft, CreditCard, Landmark, 
  Users, BarChart2, Settings, ArrowRight, Eye, TrendingUp, TrendingDown 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandLogo from '../BrandLogo';
import { useAuth } from '../../context/AuthContext';

const DashboardPreview = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    if (isAuthenticated) {
      navigate(path);
    } else {
      navigate('/login');
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-[var(--finova-bg-secondary)]/30 border-t border-[var(--finova-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-10 sm:mb-12">
          <div className="lg:col-span-8 space-y-3 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--finova-navy)]/10 text-[var(--finova-navy)] text-xs font-bold uppercase tracking-wider">
              Modern Banking Experience
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[var(--finova-text-heading)] tracking-tight">
              Everything You Need in One Dashboard
            </h2>
            <p className="text-base text-[var(--finova-text-secondary)] max-w-2xl leading-relaxed">
              Get a complete view of your finances, manage accounts, track spending, 
              apply for loans and more — all in a clean, unified and intuitive interface.
            </p>
          </div>

          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <button
              type="button"
              onClick={() => handleNavigate('/dashboard')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-[var(--finova-navy)] hover:opacity-90 shadow-md transition-all transform hover:-translate-y-0.5"
            >
              <span>{isAuthenticated ? 'Open Full Dashboard' : 'Explore Features'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Big Interactive Dashboard Browser Mockup Container */}
        <div className="rounded-3xl border border-[var(--finova-border)] bg-[var(--finova-card-bg)] shadow-2xl overflow-hidden">
          
          {/* Browser Window Chrome Top Bar */}
          <div className="px-4 py-3 bg-[var(--finova-bg-secondary)] border-b border-[var(--finova-border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-rose-400 inline-block" />
              <span className="h-3 w-3 rounded-full bg-amber-400 inline-block" />
              <span className="h-3 w-3 rounded-full bg-emerald-400 inline-block" />
              <span className="ml-2 font-mono text-[11px] text-[var(--finova-text-muted)] hidden sm:inline">
                https://app.finova.bank/dashboard
              </span>
            </div>

            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--finova-sage)]/10 text-[var(--finova-sage)] border border-[var(--finova-sage)]/20">
              Live Interactive Simulation
            </span>
          </div>

          {/* Interior Dashboard Frame */}
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
            
            {/* Sidebar Simulation */}
            <div className="hidden md:flex md:col-span-3 lg:col-span-2.5 p-4 border-r border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]/60 flex-col justify-between">
              <div className="space-y-4">
                <div className="px-2 pt-1 pb-2">
                  <BrandLogo size="sm" showText={true} />
                </div>

                <nav className="space-y-1">
                  <button
                    onClick={() => handleNavigate('/dashboard')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-[var(--finova-navy)] bg-[var(--finova-navy)]/10"
                  >
                    <LayoutDashboard className="h-4 w-4 text-[var(--finova-navy)]" />
                    <span>Dashboard</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/accounts')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] hover:bg-[var(--finova-border)]/40 transition-colors"
                  >
                    <Wallet className="h-4 w-4" />
                    <span>Accounts</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/transactions')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] hover:bg-[var(--finova-border)]/40 transition-colors"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                    <span>Transactions</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/cards')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] hover:bg-[var(--finova-border)]/40 transition-colors"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>Cards</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/loans')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] hover:bg-[var(--finova-border)]/40 transition-colors"
                  >
                    <Landmark className="h-4 w-4" />
                    <span>Loans</span>
                  </button>

                  <button
                    onClick={() => handleNavigate('/beneficiaries')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] hover:bg-[var(--finova-border)]/40 transition-colors"
                  >
                    <Users className="h-4 w-4" />
                    <span>Beneficiaries</span>
                  </button>
                </nav>
              </div>

              <div className="pt-4 border-t border-[var(--finova-border)]">
                <button
                  onClick={() => handleNavigate('/profile')}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
              </div>
            </div>

            {/* Dashboard Content Simulation */}
            <div className="col-span-1 md:col-span-9 lg:col-span-9.5 p-4 sm:p-6 space-y-6">
              
              {/* Header inside mockup */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[var(--finova-text-heading)]">
                    Welcome back, Nirmal 👋
                  </h3>
                  <p className="text-xs text-[var(--finova-text-muted)]">
                    Here's your simulated financial overview for today.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline-flex text-[10px] font-bold px-2 py-1 rounded bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-[var(--finova-text-muted)]">
                    Tier 1 Verified
                  </span>
                  <div className="h-8 w-8 rounded-full bg-[var(--finova-navy)] text-white flex items-center justify-center font-bold text-xs">
                    N
                  </div>
                </div>
              </div>

              {/* 4 Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                
                {/* Balance */}
                <div className="p-3.5 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--finova-text-muted)] block">
                    Total Balance
                  </span>
                  <span className="text-base sm:text-lg font-black text-[var(--finova-text-heading)] mt-0.5 block">
                    ₹1,25,450
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 mt-1">
                    <TrendingUp className="h-3 w-3" /> +12.4% this mo
                  </span>
                </div>

                {/* Income */}
                <div className="p-3.5 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--finova-text-muted)] block">
                    Income
                  </span>
                  <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    ₹45,000
                  </span>
                  <span className="text-[10px] text-[var(--finova-text-muted)] font-medium block mt-1">
                    Direct deposits
                  </span>
                </div>

                {/* Expenses */}
                <div className="p-3.5 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--finova-text-muted)] block">
                    Expenses
                  </span>
                  <span className="text-base sm:text-lg font-black text-rose-600 dark:text-rose-400 mt-0.5 block">
                    ₹18,500
                  </span>
                  <span className="text-[10px] text-[var(--finova-text-muted)] font-medium block mt-1">
                    Bills & outlays
                  </span>
                </div>

                {/* Savings */}
                <div className="p-3.5 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--finova-text-muted)] block">
                    Savings
                  </span>
                  <span className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5 block">
                    ₹26,500
                  </span>
                  <span className="text-[10px] text-[var(--finova-text-muted)] font-medium block mt-1">
                    Net monthly delta
                  </span>
                </div>

              </div>

              {/* Chart & Recent Transactions preview 2-column grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* Simulated Chart Container */}
                <div className="lg:col-span-7 p-4 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-[var(--finova-text-heading)]">Transaction Overview</span>
                    <span className="text-[10px] font-semibold text-[var(--finova-text-muted)]">This Month</span>
                  </div>

                  {/* Visual Bar chart simulation */}
                  <div className="h-32 flex items-end justify-between gap-1.5 px-2 pt-4">
                    {[35, 55, 40, 70, 45, 80, 60, 90, 75, 95, 65, 85].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group/bar">
                        <div
                          style={{ height: `${h}%` }}
                          className="w-full rounded-t-md bg-[var(--finova-navy)] group-hover/bar:bg-[var(--finova-sage)] transition-colors"
                        />
                        <span className="text-[8px] text-[var(--finova-text-muted)]">
                          {i + 1}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions List */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[var(--finova-text-heading)]">Recent Activity</span>
                    <button
                      type="button"
                      onClick={() => handleNavigate('/transactions')}
                      className="text-[10px] font-bold text-[var(--finova-navy)] hover:underline"
                    >
                      See All
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[var(--finova-text-heading)] text-[11px]">Amazon Shopping</p>
                        <p className="text-[9px] text-[var(--finova-text-muted)]">Today, 10:24 AM</p>
                      </div>
                      <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px]">-₹2,499</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[var(--finova-text-heading)] text-[11px]">Salary Payroll Inflow</p>
                        <p className="text-[9px] text-[var(--finova-text-muted)]">01 Sep, 2025</p>
                      </div>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">+₹45,000</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-[var(--finova-text-heading)] text-[11px]">Electricity Utility</p>
                        <p className="text-[9px] text-[var(--finova-text-muted)]">30 Aug, 2025</p>
                      </div>
                      <span className="font-bold text-rose-600 dark:text-rose-400 text-[11px]">-₹1,200</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default DashboardPreview;
