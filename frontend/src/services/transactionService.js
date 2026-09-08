import api from './api';

export const transactionService = {
  // Get current account details & live balance
  getAccount: async () => {
    const response = await api.get('/transactions/account');
    return response.data;
  },

  // Deposit funds
  deposit: async ({ amount, description, reference }) => {
    const response = await api.post('/transactions/deposit', {
      amount: parseFloat(amount),
      description,
      reference,
    });
    return response.data;
  },

  // Withdraw funds
  withdraw: async ({ amount, description, reference }) => {
    const response = await api.post('/transactions/withdraw', {
      amount: parseFloat(amount),
      description,
      reference,
    });
    return response.data;
  },

  // Transfer funds between accounts (supports optional OTP and hold flags)
  transfer: async (transferData) => {
    const response = await api.post('/transactions/transfer', {
      ...transferData,
      amount: parseFloat(transferData.amount),
    });
    return response.data;
  },

  // Lookup receiver account details for verification
  lookupReceiver: async (accountNumber) => {
    const response = await api.get(`/accounts/lookup/${accountNumber.trim()}`);
    return response.data;
  },

  // Get paginated and filtered transactions
  getTransactions: async (params = {}) => {
    const response = await api.get('/transactions', { params });
    return response.data;
  },

  // Get single transaction details by ID or transactionId
  getTransactionById: async (id) => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  // Get bank statement with official summary & balances
  getStatement: async (params = {}) => {
    const response = await api.get('/transactions/statement', { params });
    return response.data;
  },

  // Get transaction history
  getHistory: async (limit = 20) => {
    const response = await api.get(`/transactions/history?limit=${limit}`);
    return response.data;
  },
};

export default transactionService;

