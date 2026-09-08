import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Cpu, ArrowRight, CheckCircle2, 
  Lock, KeyRound, Server, AlertTriangle, Layers, Zap 
} from 'lucide-react';

import LandingNavbar from '../components/landing/LandingNavbar';
import HeroSection from '../components/landing/HeroSection';
import TrustSection from '../components/landing/TrustSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import HowItWorks from '../components/landing/HowItWorks';
import SecuritySection from '../components/landing/SecuritySection';
import DashboardPreview from '../components/landing/DashboardPreview';
import ServicesSection from '../components/landing/ServicesSection';
import CTASection from '../components/landing/CTASection';
import LandingFooter from '../components/landing/LandingFooter';
import LandingModal from '../components/landing/LandingModal';

const LandingPage = () => {
  // Modal states
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [fraudModalOpen, setFraudModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

  return (
    <div className="min-h-screen bg-[var(--finova-bg-main)] text-[var(--finova-text-heading)] transition-colors duration-200 selection:bg-[var(--finova-navy)] selection:text-white">
      
      {/* 1. Header & Navigation */}
      <LandingNavbar />

      <main id="main-content">
        {/* 2. Hero Section with phone UI & floating card */}
        <HeroSection onWatchDemo={() => setDemoModalOpen(true)} />

        {/* 3. Trust & Benefits Bar */}
        <TrustSection />

        {/* 4. Core Features */}
        <FeaturesSection onSelectFeature={(feat) => setSelectedFeature(feat)} />

        {/* 5. How Finova Works */}
        <HowItWorks />

        {/* 6 & 7. Security & Real-Time Fraud Detection Section */}
        <SecuritySection 
          onLearnMoreSecurity={() => setSecurityModalOpen(true)}
          onExploreFraud={() => setFraudModalOpen(true)}
        />

        {/* 8. Dashboard Preview */}
        <DashboardPreview />

        {/* 9. Modular Services */}
        <ServicesSection />

        {/* 10. Final Call to Action */}
        <CTASection />
      </main>

      {/* 11. Footer */}
      <LandingFooter />

      {/* ================= MODALS ================= */}

      {/* 1. Watch Demo Modal */}
      <LandingModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        title="Interactive Platform Walkthrough"
        subtitle="Experience how Finova streamlines digital banking and security in seconds."
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] space-y-1">
              <span className="text-[10px] font-bold text-[var(--finova-navy)] uppercase">Stage 01</span>
              <h4 className="text-sm font-bold text-[var(--finova-text-heading)]">Zero-Paperwork KYC</h4>
              <p className="text-xs text-[var(--finova-text-muted)]">
                Create accounts instantly with simulated KYC identification.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] space-y-1">
              <span className="text-[10px] font-bold text-[var(--finova-sage)] uppercase">Stage 02</span>
              <h4 className="text-sm font-bold text-[var(--finova-text-heading)]">Instant Transfers</h4>
              <p className="text-xs text-[var(--finova-text-muted)]">
                Dispatch internal transfers with real-time Socket.IO alerts.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] space-y-1">
              <span className="text-[10px] font-bold text-amber-600 uppercase">Stage 03</span>
              <h4 className="text-sm font-bold text-[var(--finova-text-heading)]">AI Fraud Check</h4>
              <p className="text-xs text-[var(--finova-text-muted)]">
                Transactions are scored in &lt;50ms by the machine learning engine.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[var(--finova-navy)]/10 border border-[var(--finova-navy)]/20 flex items-start gap-3">
            <Zap className="h-5 w-5 text-[var(--finova-navy)] shrink-0 mt-0.5" />
            <div className="text-xs text-[var(--finova-text-secondary)] space-y-1">
              <p className="font-bold text-[var(--finova-text-heading)]">
                Try the Live Interactive Banking Simulation
              </p>
              <p>
                You can immediately test customer accounts, fund deposits, card limits, and EMI loan applications with pre-configured demo credentials.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDemoModalOpen(false)}
              className="px-4 py-2 text-xs font-bold rounded-xl text-[var(--finova-text-heading)] hover:bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]"
            >
              Close
            </button>
            <Link
              to="/login"
              onClick={() => setDemoModalOpen(false)}
              className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[var(--finova-navy)] hover:opacity-90 shadow-sm"
            >
              Launch Customer Portal
            </Link>
          </div>
        </div>
      </LandingModal>

      {/* 2. Security Architecture Modal */}
      <LandingModal
        isOpen={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        title="Finova Security Architecture"
        subtitle="Institutional multi-tier protection specifications"
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] flex items-start gap-3">
              <Lock className="h-4 w-4 text-[var(--finova-navy)] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--finova-text-heading)] block">Cryptographic Authentication</span>
                <p className="text-[var(--finova-text-muted)] mt-0.5">
                  Stateless JSON Web Tokens (JWT) combined with industry-standard bcrypt salt password hashing.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] flex items-start gap-3">
              <Server className="h-4 w-4 text-[var(--finova-sage)] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--finova-text-heading)] block">Atomic Database Transactions</span>
                <p className="text-[var(--finova-text-muted)] mt-0.5">
                  MongoDB 2-phase ledger commits to prevent double-spending and ledger inconsistencies.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] flex items-start gap-3">
              <ShieldCheck className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[var(--finova-text-heading)] block">Role-Based Access Control (RBAC)</span>
                <p className="text-[var(--finova-text-muted)] mt-0.5">
                  Strict separation of customer self-service scopes and administrator underwriting authority.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300">
            <strong>Simulation Disclosure:</strong> Finova is an academic MERN banking simulation designed for portfolio presentation. It does not interface with the central clearing bank network or handle real fiat currency.
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setSecurityModalOpen(false)}
              className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[var(--finova-navy)]"
            >
              Got It
            </button>
          </div>
        </div>
      </LandingModal>

      {/* 3. AI Fraud Detection Modal */}
      <LandingModal
        isOpen={fraudModalOpen}
        onClose={() => setFraudModalOpen(false)}
        title="Real-Time Machine Learning Fraud Detection"
        subtitle="FastAPI + Random Forest AI Scoring Pipeline"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[var(--finova-text-secondary)] leading-relaxed">
            Finova incorporates a dedicated Python FastAPI microservice that analyzes transactions 
            synchronously before funds are finalized.
          </p>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block uppercase">Low Risk</span>
              <span className="text-base font-black text-emerald-700 dark:text-emerald-300">0 - 30</span>
              <p className="text-[9px] text-[var(--finova-text-muted)] mt-0.5">Instant Clear</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase">Medium Risk</span>
              <span className="text-base font-black text-amber-700 dark:text-amber-300">31 - 70</span>
              <p className="text-[9px] text-[var(--finova-text-muted)] mt-0.5">OTP Step-Up</p>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase">High Risk</span>
              <span className="text-base font-black text-rose-700 dark:text-rose-300">71 - 100</span>
              <p className="text-[9px] text-[var(--finova-text-muted)] mt-0.5">Account Hold</p>
            </div>
          </div>

          <div className="space-y-2 p-3.5 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
            <span className="font-bold text-[var(--finova-text-heading)] block">Scoring Feature Vectors:</span>
            <ul className="list-disc pl-4 space-y-1 text-[var(--finova-text-muted)]">
              <li>Transaction amount deviation from 30-day historical mean</li>
              <li>Geographic travel velocity & foreign IP geolocation matches</li>
              <li>Consecutive rapid burst velocity within 60-second windows</li>
              <li>Beneficiary account creation age and verification status</li>
            </ul>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setFraudModalOpen(false)}
              className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[var(--finova-navy)]"
            >
              Close
            </button>
          </div>
        </div>
      </LandingModal>

      {/* 4. Feature Detail Modal */}
      {selectedFeature && (
        <LandingModal
          isOpen={!!selectedFeature}
          onClose={() => setSelectedFeature(null)}
          title={selectedFeature.title}
          subtitle={`Detailed Finova Capability: ${selectedFeature.tag}`}
        >
          <div className="space-y-4 text-xs">
            <p className="text-sm text-[var(--finova-text-heading)] font-semibold leading-relaxed">
              {selectedFeature.description}
            </p>

            <div className="p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] space-y-2">
              <span className="font-bold text-[var(--finova-navy)] uppercase text-[10px]">Production Capabilities</span>
              <p className="text-[var(--finova-text-secondary)]">
                This service connects directly with Finova's Node.js ledger API, executing atomic database mutations and emitting real-time event alerts to all logged-in customer devices.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedFeature(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl text-[var(--finova-text-heading)] hover:bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]"
              >
                Close
              </button>
              <Link
                to={selectedFeature.route.startsWith('#') ? '/' : selectedFeature.route}
                onClick={() => setSelectedFeature(null)}
                className="px-5 py-2 text-xs font-bold rounded-xl text-white bg-[var(--finova-navy)] hover:opacity-90 shadow-sm inline-flex items-center gap-1.5"
              >
                <span>Launch in App</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </LandingModal>
      )}

    </div>
  );
};

export default LandingPage;
