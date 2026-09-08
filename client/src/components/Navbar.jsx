import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, User, RefreshCw, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import NotificationDropdown from './NotificationDropdown';
import ThemeToggle from './ThemeToggle';
import finovaLogo from '../assets/finova-logo.png';

const Navbar = ({ onMenuToggle }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const [serverHealth, setServerHealth] = useState({
    status: 'checking',
    loading: true,
  });

  const checkHealth = async () => {
    try {
      setServerHealth((prev) => ({ ...prev, loading: true }));
      const res = await api.get('/health');
      if (res.data?.status === 'ok') {
        setServerHealth({
          status: 'online',
          db: res.data.database?.status || 'unknown',
          loading: false,
        });
      } else {
        setServerHealth({ status: 'offline', loading: false });
      }
    } catch {
      setServerHealth({ status: 'offline', loading: false });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-[var(--finova-border)] bg-[var(--finova-card-bg)] px-4 sm:px-6 shadow-xs">
      {/* Left: Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden rounded-xl p-2 text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)] hover:text-[var(--finova-text-heading)] transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src={finovaLogo}
            alt="Finova"
            className="h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-[var(--finova-text-heading)]">
                FINOVA
              </span>
              <span className="rounded-full bg-[var(--finova-mint)] px-2 py-0.5 text-[10px] font-bold text-[var(--finova-success)] border border-[var(--finova-sage)]/25">
                v1.0
              </span>
            </div>
            <p className="hidden text-[10px] font-medium text-[var(--finova-text-secondary)] sm:block">
              Smart Banking. Smarter Future.
            </p>
          </div>
        </Link>
      </div>

      {/* Middle: Search input */}
      <div className="hidden md:flex items-center max-w-md w-full mx-6">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[var(--finova-text-secondary)]" />
          <input
            type="text"
            placeholder="Search accounts, transactions, transfers..."
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-[var(--finova-border)] bg-[var(--finova-bg-secondary)] text-[var(--finova-text-main)] focus:bg-[var(--finova-card-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--finova-blue)]/20 focus:border-[var(--finova-primary)] transition-all placeholder:text-[var(--finova-text-muted)]"
          />
        </div>
      </div>

      {/* Right: Server Status, Theme Toggle & Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Live Backend Indicator */}
        <div
          onClick={checkHealth}
          title={`Backend: ${serverHealth.status} (Click to refresh)`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer border border-[var(--finova-border)] bg-[var(--finova-card-bg)] hover:bg-[var(--finova-bg-secondary)] transition-colors"
        >
          <span
            className={`h-2 w-2 rounded-full ${
              serverHealth.status === 'online'
                ? 'bg-[var(--finova-success)]'
                : serverHealth.status === 'checking'
                ? 'bg-[var(--finova-warning)] animate-ping'
                : 'bg-[var(--finova-danger)]'
            }`}
          />
          <span className="hidden sm:inline font-semibold text-[11px] text-[var(--finova-text-main)]">
            {serverHealth.status === 'online'
              ? 'API Online'
              : serverHealth.status === 'checking'
              ? 'Connecting...'
              : 'API Offline'}
          </span>
          <RefreshCw
            className={`h-3 w-3 text-[var(--finova-text-secondary)] ${serverHealth.loading ? 'animate-spin' : ''}`}
          />
        </div>

        {/* Theme Toggle Button */}
        <ThemeToggle />

        {/* Real-time Notifications Bell & Dropdown */}
        {isAuthenticated && <NotificationDropdown />}

        {/* User Account / Profile Menu */}
        {isAuthenticated ? (
          <div className="relative pl-2 border-l border-[var(--finova-border)]">
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-2 rounded-xl p-1 hover:bg-[var(--finova-bg-secondary)] transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--finova-deep)] text-[var(--finova-card-bg)] font-bold text-xs shadow-xs overflow-hidden border border-[var(--finova-border)]">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-[var(--finova-text-heading)] leading-tight">
                  {user?.name}
                </p>
                <p className="text-[10px] text-[var(--finova-text-secondary)] capitalize">
                  {user?.role === 'admin' ? 'Administrator' : 'Customer'}
                </p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--finova-card-bg)] p-2 shadow-lg border border-[var(--finova-border)] z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2.5 border-b border-[var(--finova-border)]">
                    <p className="text-xs font-bold text-[var(--finova-text-heading)]">{user?.name}</p>
                    <p className="text-[11px] text-[var(--finova-text-secondary)] truncate">{user?.email}</p>
                    <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-[var(--finova-bg-secondary)] px-2 py-0.5 text-[10px] font-semibold text-[var(--finova-text-heading)] uppercase border border-[var(--finova-border)]">
                      <Shield className="h-3 w-3 text-[var(--finova-sage)]" />
                      <span>{user?.role}</span>
                    </div>
                  </div>

                  <div className="py-1 space-y-0.5">
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--finova-text-main)] hover:bg-[var(--finova-bg-secondary)] hover:text-[var(--finova-text-heading)] transition-colors"
                    >
                      <User className="h-4 w-4 text-[var(--finova-text-secondary)]" />
                      <span>My Profile & Settings</span>
                    </Link>

                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--finova-text-heading)] bg-[var(--finova-mint)]/40 hover:bg-[var(--finova-mint)]/70 transition-colors"
                      >
                        <Shield className="h-4 w-4 text-[var(--finova-success)]" />
                        <span>Finova Admin Console</span>
                      </Link>
                    )}
                  </div>

                  <div className="pt-1 border-t border-[var(--finova-border)]">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--finova-danger)] hover:bg-[var(--finova-danger-bg)] transition-colors"
                    >
                      <LogOut className="h-4 w-4 text-[var(--finova-danger)]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-[var(--finova-border)]">
            <Link
              to="/login"
              className="text-xs font-semibold text-[var(--finova-text-main)] hover:text-[var(--finova-text-heading)] px-3 py-1.5 rounded-xl hover:bg-[var(--finova-bg-secondary)]"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-[var(--finova-deep)] px-3.5 py-1.5 text-xs font-semibold text-[var(--finova-card-bg)] shadow-xs hover:opacity-90"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
