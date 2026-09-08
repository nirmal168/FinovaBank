import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Dashboard from './pages/customer/Dashboard';
import Profile from './pages/customer/Profile';
import Deposit from './pages/customer/Deposit';
import Withdraw from './pages/customer/Withdraw';
import Accounts from './pages/customer/Accounts';
import AccountDetails from './pages/customer/AccountDetails';
import Transfer from './pages/customer/Transfer';
import Transactions from './pages/customer/Transactions';
import TransactionDetails from './pages/customer/TransactionDetails';
import Beneficiaries from './pages/customer/Beneficiaries';
import Cards from './pages/customer/Cards';
import Loans from './pages/customer/Loans';
import LoanApply from './pages/customer/LoanApply';
import LoanDetails from './pages/customer/LoanDetails';
import Notifications from './pages/customer/Notifications';
import AdminDashboard from './pages/admin/Dashboard';
import AdminCustomers from './pages/admin/Customers';
import AdminAccounts from './pages/admin/Accounts';
import AdminTransactions from './pages/admin/Transactions';
import AdminLoans from './pages/admin/Loans';
import AdminFraudAlerts from './pages/admin/FraudAlerts';
import AdminAuditLogs from './pages/admin/AuditLogs';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import LandingPage from './pages/LandingPage';
import About from './pages/public/About';
import Contact from './pages/public/Contact';
import Privacy from './pages/public/Privacy';
import Terms from './pages/public/Terms';
import Card, { CardTitle, CardDescription, CardContent } from './components/ui/Card';
import Button from './components/ui/Button';
import { Construction } from 'lucide-react';

const PagePlaceholder = ({ title, phase }) => (
  <div className="py-12 flex justify-center">
    <Card className="max-w-md w-full text-center p-8">
      <CardContent className="space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 border border-brand-100">
          <Construction className="h-7 w-7" />
        </div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="mt-1">
            This module is scheduled for development in {phase || 'upcoming phases'}.
          </CardDescription>
        </div>
        <div className="pt-2">
          <Link to="/">
            <Button variant="primary" size="sm">
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  </div>
);

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastProvider>
            <Routes>
              {/* Public Landing & Institutional Pages */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />

              {/* Public Authentication Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Protected Customer & Core Banking Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/deposit" element={<Deposit />} />
                <Route path="/withdraw" element={<Withdraw />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/accounts/:id" element={<AccountDetails />} />
                <Route path="/transfer" element={<Transfer />} />
                <Route path="/transfers" element={<Navigate to="/transfer" replace />} />
                <Route path="/beneficiaries" element={<Beneficiaries />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/transactions/:id" element={<TransactionDetails />} />
                <Route path="/cards" element={<Cards />} />
                <Route path="/loans" element={<Loans />} />
                <Route path="/loans/apply" element={<LoanApply />} />
                <Route path="/loans/:id" element={<LoanDetails />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/settings" element={<PagePlaceholder title="System Settings" phase="Phase 6" />} />

            {/* Administrator Only Control Center Routes */}
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="admin/dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="admin/customers"
              element={
                <AdminRoute>
                  <AdminCustomers />
                </AdminRoute>
              }
            />
            <Route
              path="admin/accounts"
              element={
                <AdminRoute>
                  <AdminAccounts />
                </AdminRoute>
              }
            />
            <Route
              path="admin/transactions"
              element={
                <AdminRoute>
                  <AdminTransactions />
                </AdminRoute>
              }
            />
            <Route
              path="admin/loans"
              element={
                <AdminRoute>
                  <AdminLoans />
                </AdminRoute>
              }
            />
            <Route
              path="admin/fraud-alerts"
              element={
                <AdminRoute>
                  <AdminFraudAlerts />
                </AdminRoute>
              }
            />
            <Route
              path="admin/audit-logs"
              element={
                <AdminRoute>
                  <AdminAuditLogs />
                </AdminRoute>
              }
            />

            {/* 404 Fallback within Layout */}
            <Route path="*" element={<PagePlaceholder title="404 - Page Not Found" phase="Navigation" />} />
          </Route>
          </Routes>
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
