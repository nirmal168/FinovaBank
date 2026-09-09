import api from './api';

export const depositWithdrawalService = {
  // ==========================================
  // CUSTOMER API METHODS
  // ==========================================

  // Submit a new deposit or withdrawal request
  createRequest: async ({ accountId, accountNumber, type, amount, description }) => {
    const response = await api.post('/deposit-withdrawal-requests', {
      accountId,
      accountNumber,
      type,
      amount: parseFloat(amount),
      description,
    });
    return response.data;
  },

  // Get customer's own requests (filtered/paginated)
  getMyRequests: async (params = {}) => {
    const response = await api.get('/deposit-withdrawal-requests', { params });
    return response.data;
  },

  // Get details of a single request
  getRequestById: async (id) => {
    const response = await api.get(`/deposit-withdrawal-requests/${id}`);
    return response.data;
  },

  // Cancel a pending request
  cancelRequest: async (id) => {
    const response = await api.put(`/deposit-withdrawal-requests/${id}/cancel`);
    return response.data;
  },

  // ==========================================
  // ADMIN API METHODS
  // ==========================================

  // Get all requests with filters & KPI summary
  getAdminRequests: async (params = {}) => {
    const response = await api.get('/admin/deposit-withdrawal-requests', { params });
    return response.data;
  },

  // Get full admin details for a request
  getAdminRequestById: async (id) => {
    const response = await api.get(`/admin/deposit-withdrawal-requests/${id}`);
    return response.data;
  },

  // Approve a pending deposit or withdrawal request
  approveRequest: async (id, adminNote = '') => {
    const response = await api.post(`/admin/deposit-withdrawal-requests/${id}/approve`, {
      adminNote,
    });
    return response.data;
  },

  // Reject a pending deposit or withdrawal request
  rejectRequest: async (id, adminNote) => {
    const response = await api.post(`/admin/deposit-withdrawal-requests/${id}/reject`, {
      adminNote,
      reason: adminNote,
    });
    return response.data;
  },
};

export default depositWithdrawalService;
