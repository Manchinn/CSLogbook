import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithProviders, createUser } from '../../test-utils/renderWithProviders';
import Sidebar from '../common/Layout/Sidebar/Sidebar';

// Mock context ให้คืนค่า simplified (ไม่ต้องพึ่ง provider จริง)
jest.mock('../../contexts/StudentEligibilityContext', () => ({
  useStudentEligibility: () => ({
    canAccessInternship: true,
    canAccessProject: true,
    messages: {},
    lastUpdated: new Date(),
    refreshEligibility: jest.fn()
  })
}));

describe('Sidebar role-based menu', () => {
  test('แสดงเมนู student พื้นฐาน', () => {
    renderWithProviders(<Sidebar />, { authValue: { userData: createUser({ role: 'student' }) } });
    expect(screen.getByText('ประวัตินักศึกษา')).toBeInTheDocument();
    expect(screen.getByText('ระบบฝึกงาน')).toBeInTheDocument();
    expect(screen.getByText('โครงงานพิเศษ')).toBeInTheDocument();
  });

  test('แสดงเมนู admin เฉพาะ (เช่น จัดการข้อมูล)', () => {
    renderWithProviders(<Sidebar />, { authValue: { userData: createUser({ role: 'admin' }) } });
    expect(screen.getByText('จัดการข้อมูล')).toBeInTheDocument();
    expect(screen.getByText('ตั้งค่าระบบ')).toBeInTheDocument();
  });
});
