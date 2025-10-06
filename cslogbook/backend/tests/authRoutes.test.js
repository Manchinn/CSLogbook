// Integration test เบื้องต้นสำหรับ /api/auth/login (mock DB layer ให้เร็ว)
const request = require('supertest');
const app = require('../app');

// Mock models เพื่อตัด DB ออก (Academic/Curriculum ใช้ใน studentUtils)
jest.mock('../models', () => ({
  Academic: { findOne: jest.fn().mockResolvedValue(null) },
  Curriculum: { findOne: jest.fn().mockResolvedValue(null) },
}));

// Mock authService ให้ method authenticateUser ตรงกับที่ controller เรียก
jest.mock('../services/authService', () => ({
  authenticateUser: jest.fn(async (username, password) => {
    if (username === 'student1' && password === 'pass123') {
      return {
        success: true,
        data: {
          token: 'fake-jwt',
          userId: 1,
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          role: 'student',
          teacherType: null
        }
      };
    }
    return { success: false, statusCode: 401, message: 'Invalid credentials' };
  })
}));

describe('POST /api/auth/login', () => {
  it('เข้าสู่ระบบสำเร็จ', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'student1', password: 'pass123' });
    expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('token', 'fake-jwt');
  expect(res.body).toHaveProperty('role', 'student');
  });

  it('เข้าสู่ระบบล้มเหลว (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      // ใช้ password ยาว >=6 เพื่อผ่าน validator แล้วเจอ 401 จาก service mock
      .send({ username: 'student1', password: 'wrongpw' });
    expect(res.status).toBe(401);
  });
});
