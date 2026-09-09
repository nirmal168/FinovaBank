import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
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
  BookOpen,
  ArrowDownLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import finovaShield from '../assets/finova-shield.png';

const customerNavItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Accounts', path: '/accounts', icon: Wallet },
  { name: 'Deposit / Withdraw', path: '/deposit-withdrawal-requests', icon: ArrowDownLeft },
  { name: 'Transfer Funds', path: '/transfer', icon: ArrowLeftRight },
  { name: 'Beneficiaries', path: '/beneficiaries', icon: Users },
  { name: 'Transactions', path: '/transactions', icon: Receipt },
  { name: 'Bank Statement', path: '/statements', icon: FileText },
  { name: 'Cards', path: '/cards', icon: CreditCard },
  { name: 'Cheque & Passbook', path: '/service-requests', icon: BookOpen },
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
          {/* Header (Visible only on mobile drawer, since Navbar handles desktop header branding) */}
          <div className="flex h-20 items-center justify-between px-4 border-b border-[var(--finova-border)] lg:hidden">
            <div className="flex items-center gap-3">
              <img src={finovaShield} alt="Finova" className="h-10 w-auto object-contain" />
              <div>
                <span className="font-black text-xl tracking-tight text-[var(--finova-text-heading)] block leading-tight">FINOVA</span>
                <span className="text-[10px] font-semibold text-[var(--finova-text-secondary)] block leading-tight">Smart Banking. Smarter Future.</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-[var(--finova-text-secondary)] hover:text-[var(--finova-text-heading)] hover:bg-[var(--finova-bg-secondary)] transition-colors"
              aria-label="Close Navigation"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* User Status Bar in Sidebar */}
          {user && (
            <div className="mx-3 mt-4 mb-2 p-3 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--finova-navy)] to-[var(--finova-primary)] text-white font-black text-xs shrink-0 overflow-hidden shadow-xs border border-[var(--finova-border)]">
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
                <span className="text-[var(--finova-text-secondary)] font-medium">Security Tier:</span>
                <span className={`font-bold uppercase px-2 py-0.5 rounded border ${
                  isAdmin
                    ? 'bg-[var(--finova-warning-bg)] text-[var(--finova-warning)] border-[var(--finova-warning)]/30'
                    : 'bg-[var(--finova-mint)] text-[var(--finova-text-heading)] border-[var(--finova-sage)]/30'
                }`}>
                  {user.role}
                </span>
              </div>
              {user.customerId && (
                <div className="mt-1 flex items-center justify-between text-[10px]">
                  <span className="text-[var(--finova-text-secondary)]">Customer ID:</span>
                  <span className="font-mono font-bold text-[var(--finova-text-heading)]">
                    {user.customerId}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Navigation Items - Strict Portal Separation */}
          <div className="px-3 py-2 space-y-1">
            {isAdmin ? (
              <>
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--finova-blue)] mb-2">
                  Admin Console
                </p>
                {[
                  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
                  { name: 'Customer Management', path: '/admin/customers', icon: Users },
                  { name: 'Bank Accounts', path: '/admin/accounts', icon: Wallet },
                  { name: 'Deposit & Withdrawal Requests', path: '/admin/deposit-withdrawal', icon: ArrowDownLeft },
                  { name: 'Cards & Merchant Issuance', path: '/admin/cards', icon: CreditCard },
                  { name: 'Cheque & Passbook Issuance', path: '/admin/service-requests', icon: BookOpen },
                  { name: 'Transactions Audit', path: '/admin/transactions', icon: Receipt },
                  { name: 'Loan Decisions', path: '/admin/loans', icon: Landmark },
                  { name: 'Fraud Intelligence', path: '/admin/fraud-alerts', icon: ShieldAlert },
                  { name: 'System Audit Logs', path: '/admin/audit-logs', icon: FileText },
                  { name: 'Settings', path: '/admin/settings', icon: Settings },
                ].map((adminItem) => {
                  const AdminIcon = adminItem.icon;
                  return (
                    <NavLink
                      key={adminItem.path}
                      to={adminItem.path}
                      end={adminItem.path === '/admin'}
                      onClick={() => onClose && onClose()}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                          isActive
                            ? 'bg-[var(--finova-primary)] text-white shadow-xs border border-[var(--finova-primary)] font-bold'
                            : 'text-[var(--finova-text-secondary)] hover:bg-[var(--finova-bg-secondary)] hover:text-[var(--finova-text-heading)]'
                        }`
                      }
                    >
                      <AdminIcon className="h-4 w-4 shrink-0" />
                      <span>{adminItem.name}</span>
                    </NavLink>
                  );
                })}
              </>
            ) : (
              <>
                <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-[var(--finova-text-muted)] mb-2">
                  Customer Banking
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
              </>
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
