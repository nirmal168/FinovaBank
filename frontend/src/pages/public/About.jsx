import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Cpu, Landmark, Layers, 
  CheckCircle2, Code2, Database, Terminal 
} from 'lucide-react';
import LandingNavbar from '../../components/landing/LandingNavbar';
import LandingFooter from '../../components/landing/LandingFooter';

const About = () => {
  return (
    <div className="min-h-screen bg-[var(--finova-bg-main)] text-[var(--finova-text-heading)] transition-colors duration-200 flex flex-col justify-between">
      <LandingNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 flex-1 space-y-10">
        
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-[var(--finova-navy)] hover:text-[var(--finova-sage)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Hero Header */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--finova-navy)]/10 text-[var(--finova-navy)] text-xs font-bold uppercase tracking-wider">
            Academic Portfolio Simulation
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[var(--finova-text-heading)] tracking-tight">
            About Finova
          </h1>
          <p className="text-base sm:text-lg text-[var(--finova-text-secondary)] leading-relaxed">
            Finova is an institutional-grade digital banking management system architected 
            using the MERN stack and an asynchronous Python machine learning microservice.
          </p>
        </div>

        {/* Mission Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xs space-y-4">
          <h2 className="text-xl font-bold text-[var(--finova-text-heading)]">
            Project Architecture & Engineering Purpose
          </h2>
          <p className="text-sm text-[var(--finova-text-secondary)] leading-relaxed">
            Finova was conceptualized and developed as an advanced software engineering portfolio project 
            demonstrating end-to-end full-stack principles in financial technology. It showcases high-concurrency 
            database transactions, real-time push event messaging, reactive client architecture, and AI-driven 
            anomaly detection.
          </p>
          <div className="p-4 rounded-2xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-xs text-amber-800 dark:text-amber-300">
            <strong>Important Notice:</strong> Finova is strictly a simulated digital banking platform created 
            for technical portfolio evaluation and educational study. It does not provide actual financial advisory, 
            accept real legal tender, or connect to central reserve banking institutions.
          </div>
        </div>

        {/* Feature Grid */}
        <div id="architecture" className="space-y-6">
          <h2 className="text-xl font-bold text-[var(--finova-text-heading)]">
            Key Implemented Modules
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] space-y-2">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Landmark className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--finova-text-heading)]">Digital Account Management</h3>
              <p className="text-xs text-[var(--finova-text-secondary)] leading-relaxed">
                Savings and Current accounts with automated account generation, balance verification, and freeze protection.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] space-y-2">
              <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--finova-text-heading)]">Transfers & Beneficiaries</h3>
              <p className="text-xs text-[var(--finova-text-secondary)] leading-relaxed">
                Atomic ledger mutations supporting instant peer-to-peer transfers, address book payees, and audit logging.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] space-y-2">
              <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Cpu className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--finova-text-heading)]">FastAPI Machine Learning</h3>
              <p className="text-xs text-[var(--finova-text-secondary)] leading-relaxed">
                Python Random Forest scoring microservice running on port 8000 for sub-50ms fraud anomaly detection.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] space-y-2">
              <div className="h-9 w-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Layers className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm text-[var(--finova-text-heading)]">Loans & Virtual Cards</h3>
              <p className="text-xs text-[var(--finova-text-secondary)] leading-relaxed">
                Dynamic EMI calculation calculators, live loan application lifecycle states, and virtual card limit controls.
              </p>
            </div>
          </div>
        </div>

        {/* Tech Stack List */}
        <div className="p-6 rounded-3xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] space-y-3 text-xs">
          <h3 className="font-bold text-sm text-[var(--finova-text-heading)]">Technology Stack:</h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {['React 18', 'Vite 6', 'Tailwind CSS', 'Node.js', 'Express', 'MongoDB & Mongoose', 'Socket.IO', 'Python 3', 'FastAPI', 'Scikit-Learn', 'JWT & Bcrypt'].map((tech) => (
              <span key={tech} className="px-3 py-1 rounded-lg bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] font-semibold text-[var(--finova-text-heading)]">
                {tech}
              </span>
            ))}
          </div>
        </div>

      </main>

      <LandingFooter />
    </div>
  );
};

export default About;
