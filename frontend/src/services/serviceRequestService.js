import api from './api';

export const serviceRequestService = {
  // Customer: Cheque Book Requests
  applyChequeBook: async (data) => {
    const response = await api.post('/service-requests/cheque-books', data);
    return response.data;
  },

  getCustomerChequeBooks: async () => {
    const response = await api.get('/service-requests/cheque-books');
    return response.data;
  },

  // Customer: Passbook Requests
  applyPassbook: async (data) => {
    const response = await api.post('/service-requests/passbooks', data);
    return response.data;
  },

  getCustomerPassbooks: async () => {
    const response = await api.get('/service-requests/passbooks');
    return response.data;
  },

  // Admin: Review & Issue Cheque Books
  getAdminChequeBooks: async (params = {}) => {
    const response = await api.get('/service-requests/admin/cheque-books', { params });
    return response.data;
  },

  processChequeBook: async (id, data) => {
    const response = await api.put(`/service-requests/admin/cheque-books/${id}`, data);
    return response.data;
  },

  // Admin: Review & Issue Passbooks
  getAdminPassbooks: async (params = {}) => {
    const response = await api.get('/service-requests/admin/passbooks', { params });
    return response.data;
  },

  processPassbook: async (id, data) => {
    const response = await api.put(`/service-requests/admin/passbooks/${id}`, data);
    return response.data;
  },
};

export default serviceRequestService;
