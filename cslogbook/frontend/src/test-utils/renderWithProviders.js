// ชุด helper สำหรับการทดสอบ component React ให้มี Provider ครบ (Router + Auth + Eligibility)
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';

// ตั้งค่า env หลัง import (สำหรับ test environment) แต่ก่อนใช้งานจริง
if (!process.env.REACT_APP_API_URL) {
  process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
}

// Mock StudentEligibilityContext เฉพาะค่าที่ Sidebar ใช้
const StudentEligibilityContext = React.createContext({
  canAccessInternship: false,
  canAccessProject: false,
  messages: {},
  lastUpdated: null,
  refreshEligibility: () => {}
});

export const MockAuthProvider = ({ children, value }) => {
  const defaultValue = {
    isAuthenticated: !!value?.userData,
    isLoading: false,
    token: 'test-token',
    userData: value?.userData || null,
    login: value?.login || (() => Promise.resolve(true)),
    logout: value?.logout || (() => {}),
  };
  return <AuthContext.Provider value={defaultValue}>{children}</AuthContext.Provider>;
};

export const MockStudentEligibilityProvider = ({ children, value }) => {
  const defaultValue = {
    canAccessInternship: false,
    canAccessProject: false,
    messages: {},
    lastUpdated: new Date(),
    refreshEligibility: () => {},
    ...value,
  };
  return (
    <StudentEligibilityContext.Provider value={defaultValue}>
      {children}
    </StudentEligibilityContext.Provider>
  );
};

// ใช้ใน component ที่เรียก useStudentEligibility -> เราจำเป็นต้อง export hook เดิมของโปรเจกต์
// แต่ใน test นี้เราจะ jest.mock ไฟล์ context ให้ชี้มายัง context mock ของเราแทน (ดูตัวอย่างในไฟล์ test)

export function renderWithProviders(
  ui,
  { route = '/', authValue = {}, eligibilityValue = {}, routerProps = {} } = {}
) {
  process.env.REACT_APP_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={[route]} {...routerProps}>
      <MockAuthProvider value={authValue}>
        <MockStudentEligibilityProvider value={eligibilityValue}>
          {children}
        </MockStudentEligibilityProvider>
      </MockAuthProvider>
    </MemoryRouter>
  );
  return render(ui, { wrapper: Wrapper });
}

// Helper สร้าง userData ยอดนิยม
export const createUser = (overrides = {}) => ({
  firstName: 'Test',
  lastName: 'User',
  role: 'student',
  studentCode: '650000001',
  teacherType: undefined,
  ...overrides,
});
