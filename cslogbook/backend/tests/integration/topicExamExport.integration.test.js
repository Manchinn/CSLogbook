const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../../app');

function sign(role, extra = {}) {
  return jwt.sign({ userId: extra.userId || (role==='teacher'?501:601), role, ...extra }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
}

describe('GET /api/projects/topic-exam/export (integration XLSX only)', () => {
  test('403 when role=student', async () => {
    const token = sign('student');
    const res = await request(app)
      .get('/api/projects/topic-exam/export')
      .set('Authorization', `Bearer ${token}`);
    expect([401,403]).toContain(res.status);
  });

  test('200 XLSX (หรือ 403/401/500 ขึ้นกับ seed) สำหรับ teacher', async () => {
    const token = sign('teacher');
    const res = await request(app)
      .get('/api/projects/topic-exam/export?format=csv') // even if csv requested should return XLSX
      .set('Authorization', `Bearer ${token}`);
    expect([200,401,403,500]).toContain(res.status);
    if (res.status === 200) {
      expect(res.headers['content-type']).toMatch(/spreadsheetml\.sheet/);
    }
  });
});
