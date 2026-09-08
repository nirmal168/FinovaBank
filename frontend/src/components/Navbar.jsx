import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, User, LogOut, Shield, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import finovaShield from '../assets/finova-shield.png';

const Navbar = ({ onMenuToggle }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-20 w-full items-center justify-between border-b border-[var(--finova-border)] bg-[var(--finova-card-bg)] px-4 sm:px-6 lg:px-8 shadow-xs">
      {/* Left: Mobile Toggle & Big Finova Brand Logo */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden rounded-xl p-2 text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)] hover:text-[var(--finova-text-heading)] transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link to="/" className="flex items-center gap-3.5 group focus:outline-none">
          <img
            src={finovaShield}
            alt="Finova"
            className="h-11 sm:h-13 w-auto object-contain transition-transform duration-200 group-hover:scale-105 drop-shadow-xs"
          />
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-2xl sm:text-3xl tracking-tight text-[var(--finova-text-heading)] leading-none">
                FINOVA
              </span>
              <span className="rounded-full bg-[var(--finova-mint)] px-2 py-0.5 text-[10px] font-bold text-[var(--finova-success)] border border-[var(--finova-sage)]/25">
                v1.0
              </span>
            </div>
            <p className="text-[11px] sm:text-xs font-semibold text-[var(--finova-text-secondary)] tracking-tight mt-0.5">
              Smart Banking. Smarter Future.
            </p>
          </div>
        </Link>
      </div>

      {/* Right: Only Account Detail / Profile Menu */}
      <div className="flex items-center">
        {isAuthenticated ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-3 rounded-2xl p-1.5 sm:px-3 sm:py-2 hover:bg-[var(--finova-bg-secondary)] transition-all border border-transparent hover:border-[var(--finova-border)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--finova-navy)] to-[var(--finova-primary)] text-white font-black text-sm shadow-xs overflow-hidden border border-[var(--finova-border)]">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span>{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-[var(--finova-text-heading)] leading-tight">
                  {user?.name}
                </p>
                <p className="text-xs font-medium text-[var(--finova-text-secondary)] capitalize">
                  {user?.role === 'admin' ? 'Administrator' : 'Customer'}
                </p>
              </div>
              <ChevronDown
                className={`hidden sm:block h-4 w-4 text-[var(--finova-text-secondary)] transition-transform duration-200 ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
              />
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
                    {user?.customerId && (
                      <p className="text-[10px] font-mono text-brand-600 dark:text-brand-400 mt-0.5">
                        ID: {user.customerId}
                      </p>
                    )}
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

                    <Link
                      to="/change-password"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[var(--finova-text-main)] hover:bg-[var(--finova-bg-secondary)] hover:text-[var(--finova-text-heading)] transition-colors"
                    >
                      <Shield className="h-4 w-4 text-[var(--finova-text-secondary)]" />
                      <span>Change Password</span>
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
              className="rounded-xl bg-[var(--finova-deep)] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:opacity-90"
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
