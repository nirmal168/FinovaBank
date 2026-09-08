import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';

const Unauthorized = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const targetDashboard = isAdmin ? '/admin/dashboard' : '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-rose-100 dark:border-rose-900/30 p-8 text-center animate-fade-in">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40 mb-6 shadow-inner">
          <ShieldAlert className="h-10 w-10 animate-pulse" />
        </div>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 mb-3">
          403 FORBIDDEN
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Access Restricted
        </h1>

        {/* Description */}
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          You do not have administrative clearance to access this portal or resource. Finova institutional consoles are strictly reserved for authorized banking personnel.
        </p>

        {user && (
          <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-500 dark:text-slate-400 text-left">
            <div className="flex justify-between">
              <span className="font-medium text-slate-700 dark:text-slate-300">Signed In As:</span>
              <span className="text-slate-900 dark:text-white font-semibold">{user.name}</span>
            </div>
            <div className="flex justify-between mt-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">Role:</span>
              <span className="uppercase font-bold text-rose-600 dark:text-rose-400">{user.role || 'customer'}</span>
            </div>
            {user.customerId && (
              <div className="flex justify-between mt-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Customer ID:</span>
                <span className="font-mono text-slate-900 dark:text-white">{user.customerId}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={targetDashboard} className="flex-1">
            <Button variant="primary" className="w-full justify-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex-1 justify-center gap-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
