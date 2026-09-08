import api from './api';

const cardService = {
  /**
   * Get all virtual debit cards for current user
   */
  getCards: async (params = {}) => {
    const res = await api.get('/cards', { params });
    return res.data;
  },

  /**
   * Get single card details
   */
  getCardById: async (id) => {
    const res = await api.get(`/cards/${id}`);
    return res.data;
  },

  /**
   * Apply for a new virtual debit card
   */
  applyCard: async (data) => {
    const res = await api.post('/cards/apply', data);
    return res.data;
  },

  /**
   * Update card status (Active, Blocked, Inactive)
   */
  updateStatus: async (id, status) => {
    const res = await api.put(`/cards/${id}/status`, { status });
    return res.data;
  },

  /**
   * Update / Change card 4-digit PIN
   */
  changePin: async (id, pinData) => {
    const res = await api.put(`/cards/${id}/pin`, pinData);
    return res.data;
  },

  /**
   * Update daily transaction limit
   */
  updateLimit: async (id, transactionLimit) => {
    const res = await api.put(`/cards/${id}/limit`, { transactionLimit });
    return res.data;
  },
};

export default cardService;
