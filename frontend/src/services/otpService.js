import api from './api';

export const otpService = {
  // Request OTP for given purpose
  requestOtp: async ({ email, purpose, metadata = {} }) => {
    const response = await api.post('/otp/request', { email, purpose, metadata });
    return response.data;
  },

  // Verify standalone OTP
  verifyOtp: async ({ email, otp, purpose }) => {
    const response = await api.post('/otp/verify', { email, otp, purpose });
    return response.data;
  },

  // Resend OTP respecting cooldown
  resendOtp: async ({ email, purpose }) => {
    const response = await api.post('/otp/resend', { email, purpose });
    return response.data;
  },
};

export default otpService;
