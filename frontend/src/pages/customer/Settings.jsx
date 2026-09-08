import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun,
  KeyRound,
  User,
  LogOut,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ThemeSelector from '../../components/ThemeSelector';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--finova-text-heading)]">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-[var(--finova-text-secondary)] mt-1">
          Customize your display appearance and manage your account security.
        </p>
      </div>

      {/* 1. Appearance & Theme Mode (Fully functional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sun className="h-5 w-5 text-amber-500" />
            <span>Theme & Display Mode</span>
          </CardTitle>
          <CardDescription>
            Select your preferred color mode. The selected theme applies immediately and is saved for your next visit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      {/* 2. Security & Account Actions (Fully functional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Shield className="h-5 w-5 text-[var(--finova-primary)]" />
            <span>Account & Security</span>
          </CardTitle>
          <CardDescription>
            Manage your credentials and view your profile information.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-[var(--finova-border)]">
          {/* Change Password Link */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--finova-mint)] text-[var(--finova-success)] border border-[var(--finova-sage)]/25 shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--finova-text-heading)]">
                  Account Password
                </p>
                <p className="text-xs text-[var(--finova-text-secondary)] mt-0.5">
                  Update your account password to keep your banking profile protected.
                </p>
              </div>
            </div>
            <Link to="/change-password">
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs whitespace-nowrap">
                Change Password
              </Button>
            </Link>
          </div>

          {/* Profile & Personal Info Link */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--finova-bg-secondary)] text-[var(--finova-primary)] border border-[var(--finova-border)] shrink-0">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--finova-text-heading)]">
                  Profile & Contact Information
                </p>
                <p className="text-xs text-[var(--finova-text-secondary)] mt-0.5">
                  View and update your personal details, email, phone, and address.
                </p>
              </div>
            </div>
            <Link to="/profile">
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs whitespace-nowrap">
                Manage Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 3. Active Session Info & Sign Out (Fully functional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Layers className="h-5 w-5 text-[var(--finova-text-secondary)]" />
            <span>Active Session</span>
          </CardTitle>
          <CardDescription>
            Details regarding your currently authenticated banking session.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-xs">
            <div>
              <span className="text-[var(--finova-text-muted)] block text-[11px]">Logged in as</span>
              <span className="font-bold text-[var(--finova-text-heading)] truncate block mt-0.5">
                {user?.name || 'User'}
              </span>
            </div>
            <div>
              <span className="text-[var(--finova-text-muted)] block text-[11px]">Email Address</span>
              <span className="font-bold text-[var(--finova-text-heading)] truncate block mt-0.5">
                {user?.email || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[var(--finova-text-muted)] block text-[11px]">Customer ID</span>
              <span className="font-mono font-bold text-[var(--finova-primary)] block mt-0.5">
                {user?.customerId || 'N/A'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-[var(--finova-text-secondary)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--finova-success)]" />
              <span>Encrypted JWT Authenticated Session</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="text-xs text-[var(--finova-danger)] hover:bg-[var(--finova-danger-bg)] border-[var(--finova-danger)]/30 hover:border-[var(--finova-danger)]"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
