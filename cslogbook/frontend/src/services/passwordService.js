import apiClient from './apiClient';

// Two-step password change (current password + new password -> OTP -> confirm)
const passwordService = {
  initChange: async ({ currentPassword, newPassword }) => {
    const { data } = await apiClient.post('/auth/password/change/init', { currentPassword, newPassword });
    return data;
  },
  confirmChange: async ({ otp }) => {
    const { data } = await apiClient.post('/auth/password/change/confirm', { otp });
    return data;
  }
};

export default passwordService;
