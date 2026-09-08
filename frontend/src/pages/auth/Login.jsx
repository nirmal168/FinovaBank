import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import { Mail, Lock, AlertCircle, ArrowRight, ArrowLeft, UserCheck, ShieldCheck } from 'lucide-react';
import finovaLogo from '../../assets/finova-logo.png';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!identifier || !password) {
      setFormError('Please enter your email or Customer ID and password.');
      return;
    }

    setIsLoading(true);
    const result = await login({ identifier, email: identifier, password });
    setIsLoading(false);

    if (result.success) {
      if (result.user?.mustChangePassword) {
        navigate('/change-password', { replace: true });
      } else if (result.user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setFormError(result.error || 'Invalid credentials');
    }
  };

  const handleFillDemo = (demoIdentifier, demoPassword) => {
    setIdentifier(demoIdentifier);
    setPassword(demoPassword);
    setFormError('');
  };

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
            FINOVA
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Smart Banking. Smarter Future.
          </p>
        </div>

        {/* Card Form */}
        <Card className="shadow-lg border-slate-200/80 dark:border-slate-800 dark:bg-slate-800">
          <CardContent className="p-6 sm:p-8 space-y-5">
            {formError && (
              <div className="flex items-center gap-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email Address or Customer ID"
                type="text"
                placeholder="customer@finova.com or FIN-CUS-10001"
                leftIcon={Mail}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Input
                  type="password"
                  placeholder="••••••••"
                  leftIcon={Lock}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/60">
              <p className="text-[11px] font-bold text-[#667085] dark:text-slate-400 uppercase tracking-wider mb-2">
                Quick Demo Accounts (Click to Fill)
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFillDemo('customer@finova.com', 'password123')}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#DDEDE4] dark:bg-[#1b3d2d] hover:bg-[#cbe2d5] text-[11px] font-medium text-[#102A43] dark:text-[#a3e3c2] transition-colors border border-[#5B8C72]/30"
                >
                  <UserCheck className="h-3.5 w-3.5 text-[#5B8C72]" />
                  <span>Customer Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleFillDemo('admin@finova.com', 'admin123')}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-[#E9EDF2] dark:bg-[#192738] hover:bg-[#d9e2ea] text-[11px] font-medium text-[#102A43] dark:text-[#a8cbef] transition-colors border border-[#17324D]/20"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#17324D] dark:text-[#5892ce]" />
                  <span>Admin Demo</span>
                </button>
              </div>
            </div>

            {/* Admin Provisioning Notice */}
            <div className="pt-2 text-center">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Customer Access Notice</span>
                Finova customer accounts are provisioned exclusively by Bank Administration. Contact your institution administrator to obtain credentials.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
