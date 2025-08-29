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
- Unit (service): mock models (Sequelize) ด้วย `jest.spyOn(Model, 'findAll')`
- Integration (route): ใช้ `request(app)` + seed หรือ mock service
- เพิ่ม `jest.setup.js` สำหรับ global mock (เช่น DB connection) หากจำเป็น

## ขยายต่อ
- สร้าง in-memory sqlite (กำหนด `DB_DIALECT=sqlite` และ storage=:memory: ใน config) สำหรับ integration จริงบางส่วน
- เพิ่ม coverage: แก้ script `test` ใส่ `--coverage`
