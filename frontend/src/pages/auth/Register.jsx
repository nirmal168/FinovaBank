import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import { ShieldAlert, ArrowLeft, ArrowRight, Building2, HelpCircle } from 'lucide-react';
import finovaLogo from '../../assets/finova-logo.png';

const Register = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 relative">
      <div className="w-full max-w-md space-y-6">
        {/* Navigation back to landing page */}
        <div className="flex justify-between items-center px-1">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header Branding */}
        <div className="text-center">
          <Link to="/" className="inline-block group focus:outline-none">
            <img
              src={finovaLogo}
              alt="Finova"
              className="mx-auto h-24 sm:h-28 w-auto object-contain drop-shadow-sm transition-all duration-200 group-hover:scale-105"
            />
          </Link>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            FINOVA BANK
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Institutional Digital Banking System
          </p>
        </div>

        {/* Info Card */}
        <Card className="shadow-lg border-slate-200/80 dark:border-slate-800 dark:bg-slate-800">
          <CardContent className="p-6 sm:p-8 space-y-5 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50 shadow-inner">
              <Building2 className="h-8 w-8" />
            </div>

            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 mb-2">
                Public Self-Registration Disabled
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Admin-Provisioned Accounts Only
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                In compliance with strict banking security standards and KYC regulations, customer accounts cannot be self-registered online.
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-4 border border-slate-200/80 dark:border-slate-700/60 text-left space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                <span>How do I get an account?</span>
              </div>
              <ul className="space-y-1.5 pl-5 list-disc text-[11px] text-slate-500 dark:text-slate-400">
                <li>Contact your authorized Finova branch administrator.</li>
                <li>Upon identity verification, your administrator will provision your account and issue your unique <strong>Customer ID</strong> and temporary credentials.</li>
                <li>Log in using your Customer ID or Email and rotate your temporary password on first login.</li>
              </ul>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <Link to="/login" className="w-full">
                <Button variant="primary" size="lg" className="w-full justify-center gap-2">
                  <span>Proceed to Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
