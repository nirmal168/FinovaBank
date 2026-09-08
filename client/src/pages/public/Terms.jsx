import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Scale, FileCheck, AlertCircle } from 'lucide-react';
import LandingNavbar from '../../components/landing/LandingNavbar';
import LandingFooter from '../../components/landing/LandingFooter';

const Terms = () => {
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
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--finova-sage)]/10 text-[var(--finova-sage)] text-xs font-bold uppercase tracking-wider">
            Terms of Use
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[var(--finova-text-heading)] tracking-tight">
            Terms of Service
          </h1>
          <p className="text-xs text-[var(--finova-text-muted)]">
            Last Updated: September 2026 • Finova Simulation Guidelines
          </p>
        </div>

        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs space-y-6 text-sm text-[var(--finova-text-secondary)] leading-relaxed">
          
          <div className="p-4 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-xs text-amber-800 dark:text-amber-300">
            <strong>Portfolio Simulation Notice:</strong> By testing the Finova application, you acknowledge that 
            this software is an academic engineering exercise and not a chartered financial depository institution.
          </div>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--finova-text-heading)]">1. Authorized Evaluation Use</h2>
            <p>
              Users are encouraged to interact with customer workflows, review transaction ledgers, test 
              loan calculations, and examine the fraud scoring pipeline. Automated penetration stress-testing 
              or malicious payloads intended to disrupt backend processes are prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--finova-text-heading)]">2. Simulated Assets & Liability</h2>
            <p>
              All currency figures (₹ INR) shown across Finova accounts are entirely fictional. 
              Finova assumes no liability for monetary expectations, real-world investments, or transactions 
              conducted outside the simulated local environment.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--finova-text-heading)]">3. Intellectual Property</h2>
            <p>
              The Finova application codebase, UI components, color palette, and microservices architecture 
              remain the intellectual property of the repository developers. The Finova brand name and logo 
              are reserved for project demonstration.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-bold text-[var(--finova-text-heading)]">4. Disclaimers & Warranty</h2>
            <p>
              The platform is provided &ldquo;as is&rdquo; without warranties of continuous availability or 
              error-free operation. Features and database models may evolve as development phases progress.
            </p>
          </section>

        </div>

      </main>

      <LandingFooter />
    </div>
  );
};

export default Terms;
