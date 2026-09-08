import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LayoutDashboard, User, LogOut, ArrowRight, ShieldCheck } from 'lucide-react';
import BrandLogo from '../BrandLogo';
import ThemeToggle from '../ThemeToggle';
import { useAuth } from '../../context/AuthContext';

const LandingNavbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e, targetId) => {
    setMobileMenuOpen(false);

    if (location.pathname !== '/') {
      e.preventDefault();
      navigate('/');
      setTimeout(() => {
        if (targetId && targetId !== 'home') {
          const el = document.getElementById(targetId);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
      return;
    }

    if (targetId === 'home') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const el = document.getElementById(targetId);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/');
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-[var(--finova-bg-secondary)]/90 backdrop-blur-md shadow-sm border-b border-[var(--finova-border)] py-3'
          : 'bg-transparent py-4 sm:py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={() => {
              setMobileMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--finova-navy)] rounded-lg"
          >
            <BrandLogo size="md" showText={true} />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8" aria-label="Main Navigation">
            <a
              href="#home"
              onClick={(e) => handleNavClick(e, 'home')}
              className="text-sm font-semibold text-[var(--finova-text-heading)] hover:text-[var(--finova-navy)] transition-colors"
            >
              Home
            </a>
            <a
              href="#features"
              onClick={(e) => handleNavClick(e, 'features')}
              className="text-sm font-semibold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] transition-colors"
            >
              Features
            </a>
            <a
              href="#services"
              onClick={(e) => handleNavClick(e, 'services')}
              className="text-sm font-semibold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] transition-colors"
            >
              Services
            </a>
            <a
              href="#security"
              onClick={(e) => handleNavClick(e, 'security')}
              className="text-sm font-semibold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] transition-colors"
            >
              Security
            </a>
            <Link
              to="/about"
              className="text-sm font-semibold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] transition-colors"
            >
              About
            </Link>
            <Link
              to="/contact"
              className="text-sm font-semibold text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] transition-colors"
            >
              Contact
            </Link>
          </nav>

          {/* Desktop Right Controls (Theme & Auth) */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Auth Actions */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl text-white bg-[var(--finova-navy,#102A43)] hover:opacity-90 shadow-sm transition-all"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/profile"
                  className="p-2 rounded-xl text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] hover:bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] transition-colors"
                  title="My Profile"
                >
                  <User className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold rounded-xl text-[var(--finova-text-heading)] hover:text-[var(--finova-navy)] hover:bg-[var(--finova-card-bg)] border border-[var(--finova-border)] transition-all"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-[var(--finova-navy,#102A43)] hover:opacity-90 shadow-sm transition-all"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Right Bar: Theme Toggle + Hamburger */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[var(--finova-text-heading)] hover:bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] transition-colors"
              aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 p-4 rounded-2xl bg-[var(--finova-card-bg)] border border-[var(--finova-border)] shadow-xl animate-fade-in space-y-3">
            <nav className="flex flex-col space-y-2">
              <a
                href="#home"
                onClick={(e) => handleNavClick(e, 'home')}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--finova-text-heading)] hover:bg-[var(--finova-bg-secondary)]"
              >
                Home
              </a>
              <a
                href="#features"
                onClick={(e) => handleNavClick(e, 'features')}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)]"
              >
                Features
              </a>
              <a
                href="#services"
                onClick={(e) => handleNavClick(e, 'services')}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)]"
              >
                Services
              </a>
              <a
                href="#security"
                onClick={(e) => handleNavClick(e, 'security')}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)]"
              >
                Security
              </a>
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)]"
              >
                About
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm font-semibold text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)]"
              >
                Contact
              </Link>
            </nav>

            <div className="pt-3 border-t border-[var(--finova-border)]">
              {isAuthenticated ? (
                <div className="space-y-2">
                  <div className="px-3 py-1.5 text-xs text-[var(--finova-text-muted)] flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-[var(--finova-sage)]" />
                    <span>Signed in as <strong>{user?.name || 'Customer'}</strong></span>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--finova-navy,#102A43)] shadow-sm"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    <span>Go to Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-600 bg-rose-500/10 border border-rose-500/20"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-[var(--finova-text-heading)] bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--finova-navy,#102A43)] shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default LandingNavbar;
