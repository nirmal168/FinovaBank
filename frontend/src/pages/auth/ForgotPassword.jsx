import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import { ShieldCheck, Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound, ArrowRight } from 'lucide-react';
import finovaLogo from '../../assets/finova-logo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [tokenResult, setTokenResult] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await authService.forgotPassword(email);
      setTokenResult(data);
    } catch (err) {
      setError(err.message || 'Failed to request password reset');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <img
            src={finovaLogo}
            alt="Finova"
            className="mx-auto h-20 sm:h-24 w-auto object-contain drop-shadow-sm mb-2"
          />
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Forgot Password
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Enter your Finova registered email to reset your password
          </p>
        </div>

        <Card className="shadow-lg border-slate-200/80">
          <CardContent className="p-6 sm:p-8 space-y-5">
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {tokenResult ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Reset Token Generated</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Your password reset token has been generated:
                  </p>
                </div>

                <div className="p-3 bg-slate-100 rounded-lg font-mono text-xs break-all select-all text-slate-800 border border-slate-200 text-left">
                  {tokenResult.resetToken}
                </div>

                <Button
                  variant="primary"
                  className="w-full"
                  icon={ArrowRight}
                  iconPosition="right"
                  onClick={() =>
                    navigate(`/reset-password?token=${encodeURIComponent(tokenResult.resetToken)}`)
                  }
                >
                  Proceed to Reset Password
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Registered Email Address"
                  type="email"
                  placeholder="name@example.com"
                  leftIcon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Generate Reset Token
                </Button>
              </form>
            )}

            <div className="text-center text-xs pt-2 border-t border-slate-100">
              <Link
                to="/login"
                className="font-medium text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to login</span>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
