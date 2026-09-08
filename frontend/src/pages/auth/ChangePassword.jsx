import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Card, { CardContent } from '../../components/ui/Card';
import { Lock, AlertCircle, CheckCircle2, KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import finovaLogo from '../../assets/finova-logo.png';

const ChangePassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { user, changePassword, logout } = useAuth();
  const navigate = useNavigate();

  const isMandatory = user?.mustChangePassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setFormError('All fields are required.');
      return;
    }

    if (newPassword.length < 6) {
      setFormError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      setFormError('New password cannot be the same as your temporary or current password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setFormError('New password and confirmation do not match.');
      return;
    }

    setIsLoading(true);
    const result = await changePassword({ currentPassword, newPassword });
    setIsLoading(false);

    if (result.success) {
      setFormSuccess('Password changed successfully! Redirecting to dashboard...');
      setTimeout(() => {
        const dest = user?.role === 'admin' ? '/admin/dashboard' : '/dashboard';
        navigate(dest, { replace: true });
      }, 1500);
    } else {
      setFormError(result.error || 'Failed to update password. Please check your current password.');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 px-4 py-12 sm:px-6 lg:px-8 relative">
      <div className="w-full max-w-md space-y-6">
        {/* Header Branding */}
        <div className="text-center">
          <img
            src={finovaLogo}
            alt="Finova"
            className="mx-auto h-20 sm:h-24 w-auto object-contain drop-shadow-sm"
          />
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {isMandatory ? 'Set Your New Password' : 'Change Password'}
          </h2>
          <p className="mt-1 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {isMandatory
              ? 'Security Policy: First-time login requires rotating your temporary credentials.'
              : 'Keep your Finova digital banking account secure.'}
          </p>
        </div>

        {/* Card Form */}
        <Card className="shadow-lg border-slate-200/80 dark:border-slate-800 dark:bg-slate-800">
          <CardContent className="p-6 sm:p-8 space-y-5">
            {isMandatory && (
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                <ShieldCheck className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-semibold block text-amber-900 dark:text-amber-200">First-Time Setup Required</span>
                  You must set a private password before accessing your banking dashboard.
                </div>
              </div>
            )}

            {formError && (
              <div className="flex items-center gap-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
                <span>{formError}</span>
              </div>
            )}

            {formSuccess && (
              <div className="flex items-center gap-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>{formSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={isMandatory ? 'Temporary Password' : 'Current Password'}
                type="password"
                placeholder="••••••••"
                leftIcon={KeyRound}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="At least 6 characters"
                leftIcon={Lock}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Re-enter new password"
                leftIcon={Lock}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full mt-2"
                isLoading={isLoading}
              >
                Update Password & Proceed
              </Button>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/60 text-center">
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Cancel & Sign Out</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChangePassword;
