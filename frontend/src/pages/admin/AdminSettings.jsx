import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sun,
  Shield,
  KeyRound,
  FileText,
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  LogOut,
  Server,
  Database,
  Lock,
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ThemeSelector from '../../components/ThemeSelector';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const AdminSettings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [systemHealth, setSystemHealth] = useState({
    status: 'checking',
    db: 'checking',
    timestamp: null,
    loading: true,
  });

  const checkHealth = async () => {
    try {
      setSystemHealth((prev) => ({ ...prev, loading: true }));
      const res = await api.get('/health');
      if (res.data?.status === 'ok') {
        setSystemHealth({
          status: 'online',
          db: res.data.database?.status || 'connected',
          timestamp: new Date().toLocaleTimeString(),
          loading: false,
        });
      } else {
        setSystemHealth({
          status: 'degraded',
          db: 'unknown',
          timestamp: new Date().toLocaleTimeString(),
          loading: false,
        });
      }
    } catch {
      setSystemHealth({
        status: 'offline',
        db: 'disconnected',
        timestamp: new Date().toLocaleTimeString(),
        loading: false,
      });
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--finova-text-heading)]">
          Admin Console Settings
        </h1>
        <p className="text-xs sm:text-sm text-[var(--finova-text-secondary)] mt-1">
          Configure administrative display theme, inspect core system health, and manage administrator access.
        </p>
      </div>

      {/* 1. Theme & Display Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Sun className="h-5 w-5 text-amber-500" />
            <span>Theme & Display Mode</span>
          </CardTitle>
          <CardDescription>
            Choose your preferred color theme for the Administrator Console.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ThemeSelector />
        </CardContent>
      </Card>

      {/* 2. Core System & API Health Monitor */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Activity className="h-5 w-5 text-emerald-500" />
              <span>System & API Services</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={checkHealth}
              disabled={systemHealth.loading}
              className="text-xs flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${systemHealth.loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </Button>
          </div>
          <CardDescription>
            Live operational status of the banking API and database cluster.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* API Status */}
            <div className="p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
              <div className="flex items-center gap-2 mb-1.5">
                <Server className="h-4 w-4 text-[var(--finova-primary)]" />
                <span className="text-xs font-semibold text-[var(--finova-text-secondary)]">REST API</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    systemHealth.status === 'online'
                      ? 'bg-[var(--finova-success)]'
                      : systemHealth.status === 'checking'
                      ? 'bg-[var(--finova-warning)] animate-ping'
                      : 'bg-[var(--finova-danger)]'
                  }`}
                />
                <span className="text-sm font-bold text-[var(--finova-text-heading)] uppercase">
                  {systemHealth.status === 'online'
                    ? 'Operational'
                    : systemHealth.status === 'checking'
                    ? 'Connecting'
                    : 'Offline'}
                </span>
              </div>
            </div>

            {/* Database Status */}
            <div className="p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
              <div className="flex items-center gap-2 mb-1.5">
                <Database className="h-4 w-4 text-[var(--finova-primary)]" />
                <span className="text-xs font-semibold text-[var(--finova-text-secondary)]">Database</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    systemHealth.db === 'connected' || systemHealth.db === 'ok'
                      ? 'bg-[var(--finova-success)]'
                      : systemHealth.db === 'checking'
                      ? 'bg-[var(--finova-warning)] animate-ping'
                      : 'bg-[var(--finova-danger)]'
                  }`}
                />
                <span className="text-sm font-bold text-[var(--finova-text-heading)] capitalize">
                  {systemHealth.db}
                </span>
              </div>
            </div>

            {/* Last Checked */}
            <div className="p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)]">
              <div className="flex items-center gap-2 mb-1.5">
                <CheckCircle2 className="h-4 w-4 text-[var(--finova-primary)]" />
                <span className="text-xs font-semibold text-[var(--finova-text-secondary)]">Last Ping</span>
              </div>
              <span className="text-sm font-bold text-[var(--finova-text-heading)]">
                {systemHealth.timestamp || 'Just now'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3. Security & Auditing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Shield className="h-5 w-5 text-[var(--finova-primary)]" />
            <span>Security & Audit Trails</span>
          </CardTitle>
          <CardDescription>
            Administrative security credentials and system compliance records.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-[var(--finova-border)]">
          {/* Change Password */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--finova-mint)] text-[var(--finova-success)] border border-[var(--finova-sage)]/25 shrink-0">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--finova-text-heading)]">
                  Administrator Password
                </p>
                <p className="text-xs text-[var(--finova-text-secondary)] mt-0.5">
                  Update administrative authentication credentials.
                </p>
              </div>
            </div>
            <Link to="/change-password">
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs whitespace-nowrap">
                Change Password
              </Button>
            </Link>
          </div>

          {/* Audit Logs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--finova-bg-secondary)] text-[var(--finova-primary)] border border-[var(--finova-border)] shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-[var(--finova-text-heading)]">
                  System Audit Logs
                </p>
                <p className="text-xs text-[var(--finova-text-secondary)] mt-0.5">
                  Inspect RBAC actions, user logins, and administrative overrides.
                </p>
              </div>
            </div>
            <Link to="/admin/audit-logs">
              <Button variant="outline" size="sm" className="w-full sm:w-auto text-xs whitespace-nowrap">
                View Audit Logs
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 4. Active Admin Session */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Lock className="h-5 w-5 text-[var(--finova-text-secondary)]" />
            <span>Administrator Session</span>
          </CardTitle>
          <CardDescription>
            Authenticated with Tier-1 Institutional Administrator permissions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[var(--finova-bg-secondary)] border border-[var(--finova-border)] text-xs">
            <div>
              <span className="text-[var(--finova-text-muted)] block text-[11px]">Administrator</span>
              <span className="font-bold text-[var(--finova-text-heading)] truncate block mt-0.5">
                {user?.name || 'Finova Admin'}
              </span>
            </div>
            <div>
              <span className="text-[var(--finova-text-muted)] block text-[11px]">Email</span>
              <span className="font-bold text-[var(--finova-text-heading)] truncate block mt-0.5">
                {user?.email || 'admin@finova.com'}
              </span>
            </div>
            <div>
              <span className="text-[var(--finova-text-muted)] block text-[11px]">Role Permission</span>
              <span className="font-bold uppercase text-[var(--finova-success)] block mt-0.5">
                {user?.role || 'admin'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-xs text-[var(--finova-text-secondary)]">
              <CheckCircle2 className="h-4 w-4 text-[var(--finova-success)]" />
              <span>Privileged Access Protected Session</span>
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

export default AdminSettings;
