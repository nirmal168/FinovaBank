import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Landmark, CreditCard, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TrustSection = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const trustItems = [
    {
      id: 'secure-banking',
      icon: Shield,
      title: 'Secure Banking',
      description: 'Your money is protected with advanced security.',
      actionType: 'scroll',
      target: 'security',
      color: 'text-blue-600 bg-blue-500/10'
    },
    {
      id: 'instant-transfers',
      icon: Zap,
      title: 'Instant Transfers',
      description: 'Send and receive money instantly, anytime.',
      actionType: 'route',
      target: '/transfer',
      color: 'text-amber-600 bg-amber-500/10'
    },
    {
      id: 'loans-credit',
      icon: Landmark,
      title: 'Loans & Credit',
      description: 'Get the financial support you need, easily.',
      actionType: 'route',
      target: '/loans',
      color: 'text-emerald-600 bg-emerald-500/10'
    },
    {
      id: 'cards-management',
      icon: CreditCard,
      title: 'Cards Management',
      description: 'Control your cards, transactions and limits.',
      actionType: 'route',
      target: '/cards',
      color: 'text-cyan-600 bg-cyan-500/10'
    },
    {
      id: 'ai-fraud-detection',
      icon: ShieldCheck,
      title: 'AI Fraud Detection',
      description: 'Stay ahead with intelligent monitoring.',
      actionType: 'scroll',
      target: 'fraud',
      color: 'text-teal-600 bg-teal-500/10'
    },
    {
      id: '24-7-access',
      icon: Clock,
      title: '24/7 Access',
      description: 'Bank from anywhere, anytime.',
      actionType: 'scroll',
      target: 'services',
      color: 'text-indigo-600 bg-indigo-500/10'
    }
  ];

  const handleCardClick = (item) => {
    if (item.actionType === 'scroll') {
      const element = document.getElementById(item.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (item.actionType === 'route') {
      if (isAuthenticated) {
        navigate(item.target);
      } else {
        navigate('/login');
      }
    }
  };

  return (
    <section className="py-8 sm:py-12 border-y border-[var(--finova-border)] bg-[var(--finova-bg-secondary)]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {trustItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleCardClick(item)}
                className="p-4 sm:p-5 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] hover:border-[var(--finova-navy)]/40 shadow-xs hover:shadow-md transition-all duration-200 text-center flex flex-col items-center justify-between group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--finova-navy)]/30 transform hover:-translate-y-1"
              >
                <div className={`h-11 w-11 rounded-2xl ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[var(--finova-text-heading)] group-hover:text-[var(--finova-navy)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[11px] text-[var(--finova-text-muted)] mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TrustSection;
