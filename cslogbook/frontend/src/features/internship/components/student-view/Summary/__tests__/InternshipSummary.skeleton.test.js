import { screen } from '@testing-library/react';
import { renderWithProviders, createUser } from 'test-utils/renderWithProviders';
import InternshipSummary from '../Summary';

// Mock @react-pdf/renderer (ESM) ให้เป็น noop เพื่อเลี่ยง SyntaxError ใน Jest (CommonJS)
jest.mock('@react-pdf/renderer', () => ({
  pdf: () => ({ toBlob: async () => new Blob() }),
  Document: () => null,
  Page: () => null,
  Text: () => null,
  View: () => null,
  Image: () => null,
  StyleSheet: { create: () => ({}) },
  Font: { register: () => {} }
}));

// Mock custom hooks ใช้ข้อมูลย่อเพื่อไม่ดึง API จริง
jest.mock('../hooks/useSummaryData', () => ({
  useSummaryData: () => ({
    loading: false,
    summaryData: { studentData: [{ firstName: 'Test', lastName: 'User' }] },
    logEntries: [],
    error: null,
    hasCS05: true,
    isCS05Approved: true,
    totalApprovedHours: 120,
    weeklyData: [],
    skillCategories: [],
    skillTags: [],
    reflection: null,
    evaluationFormSent: false,
    evaluationSentDate: null,
    setReflection: jest.fn(),
    fetchSummaryData: jest.fn(),
  })
}));

jest.mock('../hooks/useFormActions', () => ({
  useReflectionForm: () => ({ saveReflection: jest.fn() })
}));

// Mock useAuth ให้คืนค่า user พื้นฐาน (ไฟล์ summary ใช้ user จาก useAuth แบบ user / userData ต่างเวอร์ชัน)
jest.mock('contexts/AuthContext', () => {
  return {
    AuthContext: {
      Provider: ({ children }) => children,
      Consumer: ({ children }) => children({})
    },
    useAuth: () => ({ user: { firstName: 'Test', lastName: 'User', studentId: '650000001' } })
  };
});

describe('InternshipSummary skeleton render', () => {
  test('แสดงหัวข้อหรือส่วนสำคัญเบื้องต้น', () => {
    renderWithProviders(<InternshipSummary />, {
      authValue: { userData: createUser({ role: 'student' }) }
    });
  // ตรวจองค์ประกอบบางอย่างที่ควรมีในหน้า summary (ใช้หัวข้อหลักภาษาไทย)
  expect(screen.getByText(/สรุปผลการฝึกงาน/)).toBeInTheDocument();
  });
});
