import React from 'react';
import apiClient from '../../services/apiClient';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import LoginForm from '../../features/auth/components/LoginForm';

// Mock apiClient ให้ตรงกับ __mocks__
jest.mock('../../services/apiClient');

describe('LoginForm', () => {
  it('แสดงฟิลด์และส่ง login สำเร็จ', async () => {
    const fakeResponse = {
      data: {
        success: true,
        token: 'jwt-token',
        role: 'student',
        firstName: 'Alice',
        lastName: 'Tester'
      }
    };
    apiClient.post.mockResolvedValueOnce(fakeResponse);

    const loginSpy = jest.fn().mockResolvedValue(true);

    renderWithProviders(<LoginForm />, {
      route: '/login',
      authValue: { userData: null, login: loginSpy }
    });

    fireEvent.change(screen.getByPlaceholderText(/ICIT Account/i), { target: { value: 'alice' } });
    fireEvent.change(screen.getByPlaceholderText(/รหัสผ่าน/i), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /เข้าสู่ระบบ/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/auth/login', { username: 'alice', password: 'secret' }));
    expect(loginSpy).toHaveBeenCalled();
  });
});
