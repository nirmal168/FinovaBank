import api from './api';

export const beneficiaryService = {
  // Get all beneficiaries (supports search & status query params)
  getBeneficiaries: async (params = {}) => {
    const response = await api.get('/beneficiaries', { params });
    return response.data;
  },

  // Add a new beneficiary
  addBeneficiary: async (data) => {
    const response = await api.post('/beneficiaries', data);
    return response.data;
  },

  // Update beneficiary details or status
  updateBeneficiary: async (id, data) => {
    const response = await api.put(`/beneficiaries/${id}`, data);
    return response.data;
  },

  // Delete beneficiary
  deleteBeneficiary: async (id) => {
    const response = await api.delete(`/beneficiaries/${id}`);
    return response.data;
  },
};

export default beneficiaryService;
