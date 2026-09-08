import React from 'react';
import { 
  Wallet, ArrowRightLeft, BarChart3, CreditCard, 
  Landmark, ShieldAlert, ArrowRight 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const FeaturesSection = ({ onSelectFeature }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const features = [
    {
      id: 'accounts',
      icon: Wallet,
      title: 'Smart Accounts',
      tag: 'Core Banking',
      description: 'High-yield savings and flexible checking accounts designed for digital-first financial management with instant balance updates.',
      route: '/accounts',
      color: 'text-blue-600 bg-blue-500/10'
    },
    {
      id: 'transfers',
      icon: ArrowRightLeft,
      title: 'Fast Transfers',
      tag: 'Instant Payments',
      description: 'Move funds across internal Finova accounts and external beneficiary payees instantly with zero hidden maintenance fees.',
      route: '/transfer',
      color: 'text-amber-600 bg-amber-500/10'
    },
    {
      id: 'insights',
      icon: BarChart3,
      title: 'Transaction Insights',
      tag: 'Financial Analytics',
      description: 'Real-time ledger classification, dynamic cash-flow charts, and downloadable monthly statement summaries.',
      route: '/transactions',
      color: 'text-emerald-600 bg-emerald-500/10'
    },
    {
      id: 'cards',
      icon: CreditCard,
      title: 'Digital Cards',
      tag: 'Card Management',
      description: 'Generate instant virtual debit cards, toggle freeze/unfreeze state, reset PINs, and adjust domestic daily spending limits.',
      route: '/cards',
      color: 'text-purple-600 bg-purple-500/10'
    },
    {
      id: 'loans',
      icon: Landmark,
      title: 'Flexible Loans',
      tag: 'Credit Facilities',
      description: 'Personal, auto, home, and student lending with instant EMI calculations, transparent APR rates, and live underwriting tracking.',
      route: '/loans',
      color: 'text-teal-600 bg-teal-500/10'
    },
    {
      id: 'security',
      icon: ShieldAlert,
      title: 'Intelligent Security',
      tag: 'ML Fraud Shield',
      description: 'Real-time transaction risk scoring powered by an integrated machine learning engine that flags suspicious activities in milliseconds.',
      route: '#fraud',
      color: 'text-rose-600 bg-rose-500/10'
    }
  ];

  const handleLearnMore = (feature) => {
    if (feature.route.startsWith('#')) {
      const el = document.getElementById(feature.route.replace('#', ''));
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      if (onSelectFeature) {
        onSelectFeature(feature);
      } else {
        if (isAuthenticated) {
          navigate(feature.route);
        } else {
          navigate('/login');
        }
      }
    }
  };

  return (
    <section id="features" className="py-16 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--finova-navy)]/10 text-[var(--finova-navy)] text-xs font-bold uppercase tracking-wider">
            Comprehensive Capabilities
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--finova-text-heading)] tracking-tight">
            Everything You Need to Bank Smarter
          </h2>
          <p className="text-base text-[var(--finova-text-secondary)] leading-relaxed">
            Built from the ground up for speed, transparency, and total financial control. 
            Explore the tools that put you in charge of every rupee.
          </p>
        </div>

        {/* Feature Cards Grid (1 col mobile, 2 tablet, 3 desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="p-6 sm:p-7 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] hover:border-[var(--finova-navy)]/40 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group transform hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`h-12 w-12 rounded-2xl ${feature.color} flex items-center justify-center group-hover:scale-105 transition-transform`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[var(--finova-bg-secondary)] text-[var(--finova-text-muted)] border border-[var(--finova-border)]">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-[var(--finova-text-heading)] group-hover:text-[var(--finova-navy)] transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[var(--finova-text-secondary)] mt-2 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-[var(--finova-border)]/60">
                  <button
                    type="button"
                    onClick={() => handleLearnMore(feature)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--finova-navy)] hover:text-[var(--finova-sage)] transition-colors group/btn"
                  >
                    <span>Learn More</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover/btn:translate-x-1 transition-transform" />
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

export default FeaturesSection;
