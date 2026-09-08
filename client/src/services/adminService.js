import api from './api';

export const adminService = {
  // Get all admin dashboard analytics and charts
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  // Get quick stats KPI numbers
  getQuickStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Customer Management
  getCustomers: async (params = {}) => {
    const response = await api.get('/admin/customers', { params });
    return response.data;
  },

  updateCustomerStatus: async (id, isActive) => {
    const response = await api.put(`/admin/customers/${id}/status`, { isActive });
    return response.data;
  },

  // Account Management
  getAccounts: async (params = {}) => {
    const response = await api.get('/admin/accounts', { params });
    return response.data;
  },

  updateAccountStatus: async (id, status) => {
    const response = await api.put(`/admin/accounts/${id}/status`, { status });
    return response.data;
  },

  // Transaction Auditing
  getTransactions: async (params = {}) => {
    const response = await api.get('/admin/transactions', { params });
    return response.data;
  },

  // Loan Management
  getLoans: async (params = {}) => {
    const response = await api.get('/admin/loans', { params });
    return response.data;
  },

  approveLoan: async (id) => {
    const response = await api.put(`/admin/loans/${id}/approve`);
    return response.data;
  },

  rejectLoan: async (id, reason) => {
    const response = await api.put(`/admin/loans/${id}/reject`, { reason });
    return response.data;
  },

  // Fraud Detection & Alerts
  getFraudAlerts: async (params = {}) => {
    const response = await api.get('/admin/fraud-alerts', { params });
    return response.data;
  },

  getFraudAlertById: async (id) => {
    const response = await api.get(`/admin/fraud-alerts/${id}`);
    return response.data;
  },

  resolveFraudAlert: async (id, data = {}) => {
    const response = await api.put(`/admin/fraud-alerts/${id}/resolve`, data);
    return response.data;
  },

  dismissFraudAlert: async (id, data = {}) => {
    const response = await api.put(`/admin/fraud-alerts/${id}/dismiss`, data);
    return response.data;
  },

  // Audit Logs & Security Trails
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/admin/audit-logs', { params });
    return response.data;
  },

  getAuditLogById: async (id) => {
    const response = await api.get(`/admin/audit-logs/${id}`);
    return response.data;
  },
};

export default adminService;
