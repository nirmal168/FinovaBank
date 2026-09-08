import React from 'react';
import { Shield, CheckCircle2, ArrowRight, Lock, KeyRound, BellRing } from 'lucide-react';
import FraudDetectionSection from './FraudDetectionSection';

const SecuritySection = ({ onLearnMoreSecurity, onExploreFraud }) => {
  return (
    <section id="security" className="py-16 sm:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column: Security Overview & Checklist */}
          <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
            
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--finova-sage)]/10 border border-[var(--finova-sage)]/20 text-[var(--finova-sage)] text-xs font-bold uppercase tracking-wider">
              <Shield className="h-3.5 w-3.5" />
              <span>Your Security, Our Priority</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-black text-[var(--finova-text-heading)] tracking-tight">
              Bank with Confidence
            </h2>

            <p className="text-base text-[var(--finova-text-secondary)] leading-relaxed">
              We use advanced encryption, AI-powered fraud detection and real-time monitoring 
              to keep your money and data safe at every step of your financial journey.
            </p>

            {/* Checklist of security pillars */}
            <div className="space-y-4 pt-2 text-left">
              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--finova-text-heading)]">End-to-end encryption</h4>
                  <p className="text-xs text-[var(--finova-text-muted)] mt-0.5">
                    Military-grade AES-256 data protection and TLS 1.3 protocol standards for all active sessions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--finova-text-heading)]">AI-based fraud detection</h4>
                  <p className="text-xs text-[var(--finova-text-muted)] mt-0.5">
                    Instant anomaly detection trained on behavioral spending deviations and suspicious geolocations.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--finova-text-heading)]">24/7 transaction monitoring</h4>
                  <p className="text-xs text-[var(--finova-text-muted)] mt-0.5">
                    Uninterrupted background audit trails, real-time push notifications, and immediate freeze safeguards.
                  </p>
                </div>
              </div>
            </div>

            {/* Learn More Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={onLearnMoreSecurity}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-[var(--finova-navy)] hover:opacity-90 shadow-md transition-all transform hover:-translate-y-0.5"
              >
                <span>Learn More</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

          </div>

          {/* Right Column: AI Fraud Detection Interactive Card */}
          <div className="lg:col-span-7">
            <FraudDetectionSection onExploreFraud={onExploreFraud} />
          </div>

        </div>

      </div>
    </section>
  );
};

export default SecuritySection;
