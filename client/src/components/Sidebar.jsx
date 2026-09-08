import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  CreditCard,
  Landmark,
  Settings,
  ShieldCheck,
  User,
  ShieldAlert,
  X,
  Users,
  Bell,
  FileText,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import finovaLogo from '../assets/finova-logo.png';

const customerNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Deposit Funds', path: '/deposit', icon: ArrowDownLeft },
  { name: 'Withdraw Funds', path: '/withdraw', icon: ArrowUpRight },
  { name: 'Accounts', path: '/accounts', icon: Wallet },
  { name: 'Transfer Funds', path: '/transfer', icon: ArrowLeftRight },
  { name: 'Beneficiaries', path: '/beneficiaries', icon: Users },
  { name: 'Transactions', path: '/transactions', icon: Receipt },
  { name: 'Cards', path: '/cards', icon: CreditCard },
  { name: 'Loans & Credit', path: '/loans', icon: Landmark },
  { name: 'Notifications', path: '/notifications', icon: Bell },
  { name: 'Profile & Security', path: '/profile', icon: User },
  { name: 'Settings', path: '/settings', icon: Settings },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user, isAdmin } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 flex flex-col justify-between bg-[var(--finova-card-bg)] border-r border-[var(--finova-border)] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--finova-border)]">
            <div className="flex items-center gap-2.5">
              <img src={finovaLogo} alt="Finova" className="h-8 w-auto object-contain" />
              <div>
                <span className="font-extrabold text-sm tracking-tight text-[var(--finova-text-heading)] block leading-tight">FINOVA</span>
                <span className="text-[9px] font-medium text-[var(--finova-text-secondary)] block leading-tight">Smart Banking. Smarter Future.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] hover:bg-[var(--finova-bg-secondary)] lg:hidden transition-colors"
              aria-label="Close Navigation"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Status Bar in Sidebar */}
          {user && (
            <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--finova-deep)] text-[var(--finova-card-bg)] font-bold text-xs shrink-0 overflow-hidden shadow-xs border border-[var(--finova-border)]">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.name} className="h-full w-full object-cover" />
                  ) : (
                    <span>{user.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-[var(--finova-text-heading)] truncate">{user.name}</p>
                  <p className="text-[10px] text-[var(--finova-text-secondary)] truncate">{user.email}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between pt-2 border-t border-[var(--finova-border)] text-[10px]">
                <span className="text-[var(--finova-text-secondary)]">Security Tier:</span>
                <span className="font-bold uppercase text-[var(--finova-text-heading)] bg-[var(--finova-mint)] px-2 py-0.5 rounded border border-[var(--finova-sage)]/30">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          {/* Navigation Items */}
          <div className="px-3 py-2 space-y-1">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-muted)] mb-2">
              Banking Menu
            </p>
            {customerNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose && onClose()}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-[var(--finova-mint)] text-[var(--finova-text-heading)] shadow-xs border border-[var(--finova-sage)]/35 font-bold'
                        : 'text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)] hover:text-[var(--finova-text-heading)]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon className={`h-4 w-4 shrink-0 transition-colors ${isActive ? 'text-[var(--finova-sage)]' : 'text-[var(--finova-text-secondary)]'}`} />
                      <span>{item.name}</span>
                    </>
                  )}
                </NavLink>
              );
            })}

            {/* Admin Section (Conditional) */}
            {isAdmin && (
              <div className="pt-4 mt-3 border-t border-[var(--finova-border)]">
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--finova-blue)] mb-2">
                  Admin Controls
                </p>
                <div className="space-y-1">
                  {[
                    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
                    { name: 'Customers', path: '/admin/customers', icon: Users },
                    { name: 'Accounts', path: '/admin/accounts', icon: Wallet },
                    { name: 'Transactions', path: '/admin/transactions', icon: Receipt },
                    { name: 'Loan Approvals', path: '/admin/loans', icon: Landmark },
                    { name: 'Fraud Alerts', path: '/admin/fraud-alerts', icon: ShieldAlert },
                    { name: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
                  ].map((adminItem) => {
                    const AdminIcon = adminItem.icon;
                    return (
                      <NavLink
                        key={adminItem.path}
                        to={adminItem.path}
                        end={adminItem.path === '/admin'}
                        onClick={() => onClose && onClose()}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                            isActive
                              ? 'bg-[var(--finova-primary)] text-[var(--finova-card-bg)] shadow-xs border border-[var(--finova-primary)]'
                              : 'text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)] hover:text-[var(--finova-text-heading)]'
                          }`
                        }
                      >
                        <AdminIcon className="h-4 w-4 shrink-0" />
                        <span>{adminItem.name}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Security Card */}
        <div className="p-4 border-t border-[var(--finova-border)]">
          <div className="rounded-xl bg-[var(--finova-bg-secondary)] p-3 border border-[var(--finova-border)] flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-[var(--finova-sage)] shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-[var(--finova-text-heading)]">JWT Protected Session</p>
              <p className="text-[10px] text-[var(--finova-text-secondary)] mt-0.5">Role-based access verification active</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
