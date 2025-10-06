# Backend Test Suite (Scaffold)

โครงสร้างที่เพิ่ม:
```
backend/
  app.js                # Express app แยกเพื่อ supertest
  server.js             # สร้าง server และเริ่มฟัง (export { app, server })
  tests/
    health.test.js      # ตัวอย่าง endpoint พื้นฐาน
    authRoutes.test.js  # ตัวอย่าง integration + mock service
    README.md           # คำอธิบาย
```

## รันเทส
```
cd backend
npm test
```

## แนวทางเพิ่มเทส
- Unit (service): mock models (Sequelize) ด้วย `jest.doMock('../../models', () => { ... })`
- Integration (route): ใช้ `request(app)` + mock service หรือ in-memory sqlite
- เพิ่ม `jest.setup.js` สำหรับปิด `console.log` เพื่อลด noise

### Pattern: In‑Memory Sequelize + Mock Models
1. `jest.resetModules()` (ถ้าต้องการ isolate)
2. สร้าง `sequelize = new Sequelize('sqlite::memory:')`
3. require factory โมเดลที่ต้องใช้โดยตรง (เช่น `require('../../models/Document')`)
4. ผูกกับ sequelize → ได้ model instance
5. สร้าง object `{ ModelA, ModelB, ... }` แล้ว `jest.doMock('../../models', () => object, { virtual: true })`
6. `await sequelize.sync()`
7. require service หลังจาก mock
8. ปิดด้วย `sequelize.close()` ใน `afterAll`

### Logger Snapshot / Verification
mock `../utils/logger` เป็น `{ info: jest.fn(), error: jest.fn() }` แล้วตรวจ call arguments หรือ snapshot `logger.info.mock.calls` (sanitize เวลา/ไอดีที่แปรผัน)

### Coverage
รัน `npm run test:cov` จะสร้างรายงานใน `coverage/` และใช้ threshold พื้นฐาน (จะค่อยๆ เพิ่มในอนาคต)

## ขยายต่อ
- เพิ่ม edge cases service อื่น (notification, workflow, upload policy)
- ค่อยๆ เพิ่ม threshold coverage (เป้า 60–70% ก่อน release)
- เพิ่ม snapshot สำหรับข้อความ audit สำคัญ
