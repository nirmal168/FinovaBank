import api from './api';

export const accountService = {
  // Create a new bank account
  createAccount: async (accountData) => {
    const response = await api.post('/accounts', accountData);
    return response.data;
  },

  // Get all user accounts
  getAccounts: async (includeAll = false) => {
    const response = await api.get(`/accounts${includeAll ? '?all=true' : ''}`);
    return response.data;
  },

  // Get account details by ID
  getAccountById: async (id) => {
    const response = await api.get(`/accounts/${id}`);
    return response.data;
  },

  // Update account status (Freeze / Unfreeze / Close)
  updateAccountStatus: async (id, status) => {
    const response = await api.put(`/accounts/${id}/status`, { status });
    return response.data;
  },
};

export default accountService;
