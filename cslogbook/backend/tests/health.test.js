// ทดสอบ health endpoint พื้นฐาน
const request = require('supertest');
const app = require('../app');

describe('GET /api/health', () => {
  it('ควรตอบ 200 พร้อมสถานะ ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('env');
  });
});
