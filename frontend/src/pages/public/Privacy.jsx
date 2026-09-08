import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Eye, FileText } from 'lucide-react';
import LandingNavbar from '../../components/landing/LandingNavbar';
import LandingFooter from '../../components/landing/LandingFooter';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[var(--finova-bg-main)] text-[var(--finova-text-heading)] transition-colors duration-200 flex flex-col justify-between">
      <LandingNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 space-y-8">
        
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--finova-navy)] hover:text-[var(--finova-sage)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--finova-navy)]/10 text-[var(--finova-navy)] text-xs font-bold uppercase tracking-wider">
            Legal & Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--finova-text-heading)] tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-xs text-[var(--finova-text-muted)]">
            Last Updated: September 2026 • Finova Simulation Guidelines
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs space-y-6 text-sm text-[var(--finova-text-secondary)] leading-relaxed">
          
          <div className="p-4 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-xs text-amber-800 dark:text-amber-300">
            <strong>Academic Simulation Notice:</strong> Finova is a software engineering educational project. 
            All customer accounts, balances, credit card numbers, and transaction logs represent simulated sandbox 
            data and are not shared with credit bureaus, advertising brokers, or real banks.
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--finova-text-heading)]">1. Information We Collect in Simulation</h2>
            <p>
              When users register test accounts, we store hashed passwords (bcrypt), mock account numbers, 
              and user-submitted transaction remarks. We do not store or collect government tax IDs, real credit cards, 
              or personal social security records.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--finova-text-heading)]">2. Use of Local Storage & Cookies</h2>
            <p>
              Finova utilizes client-side <code>localStorage</code> solely to preserve active theme selections 
              (<code>finova-theme</code>) and session authentication tokens (<code>token</code>). We do not employ third-party 
              tracking cookies or commercial behavioral tracking scripts.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--finova-text-heading)]">3. Machine Learning Data Processing</h2>
            <p>
              Simulated transaction metadata is evaluated ephemerally by our local Python FastAPI microservice 
              to determine risk scores (0-100). No data is transmitted to third-party artificial intelligence vendors.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--finova-text-heading)]">4. Data Deletion & Reset</h2>
            <p>
              As an open demonstration project, administrators reserve the authority to re-seed or reset simulated 
              database ledgers periodically. Users can clear their browser session at any time by selecting Sign Out.
            </p>
          </section>

        </div>

      </main>

      <LandingFooter />
    </div>
  );
};

export default Privacy;
