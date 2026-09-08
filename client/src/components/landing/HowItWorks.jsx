import React, { useState } from 'react';
import { UserPlus, Wallet, Landmark, TrendingUp, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const HowItWorks = ({ onSelectStep }) => {
  const [activeStep, setActiveStep] = useState(0);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const steps = [
    {
      stepNumber: '01',
      title: 'Create Account',
      tagline: 'Sign up in minutes with simple verification.',
      icon: UserPlus,
      details: 'Complete quick digital onboarding with email & KYC simulation. Your initial savings account is instantly generated with zero paperwork.',
      actionLabel: 'Sign Up Free',
      actionType: 'route',
      target: '/register'
    },
    {
      stepNumber: '02',
      title: 'Add Funds',
      tagline: 'Deposit money to your account securely.',
      icon: Wallet,
      details: 'Credit opening capital into your account via simulated card or bank transfer. Real-time balance updates confirm your deposit immediately.',
      actionLabel: 'Make Deposit',
      actionType: 'route',
      target: '/deposit'
    },
    {
      stepNumber: '03',
      title: 'Start Banking',
      tagline: 'Transfer, pay, invest or apply for loans.',
      icon: Landmark,
      details: 'Execute instant peer transfers, schedule utility bill settlements, issue virtual cards, and calculate EMI terms for low-interest loans.',
      actionLabel: 'Open Dashboard',
      actionType: 'route',
      target: '/dashboard'
    },
    {
      stepNumber: '04',
      title: 'Grow with Confidence',
      tagline: 'Track your finances and achieve your goals.',
      icon: TrendingUp,
      details: 'Monitor monthly cash flow charts, receive real-time fraud alerts, and watch your savings accumulate with high-yield interest.',
      actionLabel: 'Explore Platform',
      actionType: 'scroll',
      target: 'cta'
    }
  ];

  const handleStepAction = (step) => {
    if (step.actionType === 'scroll') {
      const el = document.getElementById(step.target);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      if (isAuthenticated) {
        navigate(step.target === '/register' ? '/dashboard' : step.target);
      } else {
        navigate(step.target === '/register' ? '/register' : '/login');
      }
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-[var(--finova-bg-secondary)]/30 border-y border-[var(--finova-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--finova-sage)]/10 text-[var(--finova-sage)] text-xs font-bold uppercase tracking-wider">
            Simple 4-Step Onboarding
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-[var(--finova-text-heading)] tracking-tight">
            How Finova Works
          </h2>
          <p className="text-base text-[var(--finova-text-secondary)] leading-relaxed">
            Get started in minutes and take complete control of your financial future. 
            No branch visits, no tedious queues.
          </p>
        </div>

        {/* 4 Interactive Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isSelected = activeStep === idx;
            return (
              <div
                key={step.stepNumber}
                onClick={() => setActiveStep(idx)}
                className={`p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between cursor-pointer relative group ${
                  isSelected
                    ? 'bg-[var(--finova-card-bg)] border-[var(--finova-navy)] shadow-lg ring-1 ring-[var(--finova-navy)]'
                    : 'bg-[var(--finova-card-bg)]/80 border-[var(--finova-border)] hover:border-[var(--finova-navy)]/40 hover:shadow-md'
                }`}
              >
                {/* Step Pill Header */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-black tracking-widest text-[var(--finova-navy)] px-2.5 py-1 rounded-lg bg-[var(--finova-navy)]/10">
                      STEP {step.stepNumber}
                    </span>
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-[var(--finova-navy)] text-white' : 'bg-[var(--finova-bg-secondary)] text-[var(--finova-text-muted)] group-hover:text-[var(--finova-text-heading)]'
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-[var(--finova-text-heading)]">
                    {step.title}
                  </h3>

                  <p className="text-xs text-[var(--finova-text-muted)] font-medium mt-1">
                    {step.tagline}
                  </p>

                  <p className="text-xs text-[var(--finova-text-secondary)] mt-3 leading-relaxed">
                    {step.details}
                  </p>
                </div>

                {/* Step Action Button */}
                <div className="pt-4 mt-4 border-t border-[var(--finova-border)]/60">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStepAction(step);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--finova-navy)] hover:opacity-90 transition-opacity shadow-xs"
                  >
                    <span>{step.actionLabel}</span>
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

export default HowItWorks;
