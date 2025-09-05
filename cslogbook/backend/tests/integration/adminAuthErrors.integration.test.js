const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');

jest.mock('../../models', () => ({
  User: { findOne: jest.fn(({ where }) => {
    if (where.userId === 10) return { userId: 10, role: 'teacher', activeStatus: true };
    if (where.userId === 11) return { userId: 11, role: 'teacher', activeStatus: true };
    return null;
  }) },
  Student: { findOne: jest.fn() },
  Teacher: { findOne: jest.fn(({ where }) => {
    if (where.userId === 10) return { teacherType: 'academic' };
    if (where.userId === 11) return { teacherType: 'support' };
    return null;
  }) }
}), { virtual: true });

describe('admin route auth error paths', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-chars-long-for-jest';
    process.env.JWT_EXPIRES_IN = '1h';
  });

  test('401 when no token', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  test('403 when teacherType not support', async () => {
    const token = jwt.sign({ userId: 10, role: 'teacher' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app).get('/api/admin/stats').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
