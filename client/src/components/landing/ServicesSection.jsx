import React from 'react';
import { 
  Wallet, Send, CreditCard, Landmark, FileSpreadsheet, 
  ArrowRight, Check 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ServicesSection = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const services = [
    {
      id: 'accounts',
      title: 'Accounts',
      icon: Wallet,
      headline: 'Flexible Checking & High-Yield Savings',
      description: 'Open a digital account in under 3 minutes. Enjoy zero maintenance fees, instant interest accrual, and seamless multi-account management.',
      actionLabel: 'Explore Accounts',
      route: '/accounts',
      perks: ['Instant account number generation', 'Zero minimum balance penalty', 'Real-time balance notifications'],
      color: 'border-blue-500/30 hover:border-blue-500'
    },
    {
      id: 'transfers',
      title: 'Transfers',
      icon: Send,
      headline: 'Lightning-Fast Peer & Wire Payments',
      description: 'Move funds across bank accounts with zero friction. Save frequent payees as beneficiaries for lightning-fast 1-click execution.',
      actionLabel: 'Send Money',
      route: '/transfer',
      perks: ['Instant peer-to-peer transfers', 'Beneficiary address book', 'Custom transfer descriptions'],
      color: 'border-amber-500/30 hover:border-amber-500'
    },
    {
      id: 'cards',
      title: 'Cards',
      icon: CreditCard,
      headline: 'Digital & Physical Card Controls',
      description: 'Experience instant virtual card issuance for secure e-commerce shopping, accompanied by freeze/unfreeze security switches.',
      actionLabel: 'Manage Cards',
      route: '/cards',
      perks: ['Virtual & physical issuance', 'Instant freeze & unfreeze toggle', 'Configurable daily spending limits'],
      color: 'border-cyan-500/30 hover:border-cyan-500'
    },
    {
      id: 'loans',
      title: 'Loans',
      icon: Landmark,
      headline: 'Low-APR Lending & Credit Facilities',
      description: 'Access capital when you need it most. Calculate fixed monthly installments (EMI) in real time and monitor underwriting status live.',
      actionLabel: 'Explore Loans',
      route: '/loans',
      perks: ['Fixed interest rate transparency', 'Simulated instant EMI calculator', 'Step-by-step application tracker'],
      color: 'border-emerald-500/30 hover:border-emerald-500'
    },
    {
      id: 'transactions',
      title: 'Transactions',
      icon: FileSpreadsheet,
      headline: 'Detailed Ledger & Audit Records',
      description: 'Search, filter, and inspect detailed receipts for every debit, credit, fee, or refund with full institutional transparency.',
      actionLabel: 'View Transactions',
      route: '/transactions',
      perks: ['Category-based search & filter', 'Downloadable PDF & CSV receipts', 'Cryptographically logged audit trail'],
      color: 'border-purple-500/30 hover:border-purple-500'
    }
  ];

  const handleAction = (route) => {
    if (isAuthenticated) {
      navigate(route);
    } else {
      navigate('/login');
    }
  };

  return (
    <section id="services" className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--finova-sage)]/10 text-[var(--finova-sage)] text-xs font-bold uppercase tracking-wider">
            Integrated Solutions
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--finova-text-heading)] tracking-tight">
            One Platform. Multiple Financial Services.
          </h2>
          <p className="text-base text-[var(--finova-text-secondary)] leading-relaxed">
            Everything your financial life requires, consolidated into an intuitive, 
            cohesive digital ecosystem designed for simplicity and trust.
          </p>
        </div>

        {/* Services Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {services.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                className={`p-6 sm:p-7 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] ${srv.color} shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-2xl bg-[var(--finova-navy)]/10 text-[var(--finova-navy)] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold text-[var(--finova-text-muted)] tracking-wider uppercase">
                      {srv.title}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--finova-text-heading)] group-hover:text-[var(--finova-navy)] transition-colors">
                      {srv.headline}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--finova-text-secondary)] mt-2 leading-relaxed">
                      {srv.description}
                    </p>
                  </div>

                  {/* Feature Perks */}
                  <ul className="space-y-2 pt-2 text-xs text-[var(--finova-text-secondary)]">
                    {srv.perks.map((perk, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-[var(--finova-sage)] shrink-0" />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-[var(--finova-border)]/60">
                  <button
                    type="button"
                    onClick={() => handleAction(srv.route)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--finova-navy)] hover:opacity-90 shadow-sm transition-opacity"
                  >
                    <span>{srv.actionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default ServicesSection;
