# CI Workflow Guide (GitHub Actions) – CSLogbook

ภาษา: ไทย | เป้าหมาย: อธิบายโครงสร้าง CI ปัจจุบัน + วิธีขยายในอนาคต (Docker / MySQL / Frontend)

---
## 1. วัตถุประสงค์
ตั้งค่า Continuous Integration (CI) ให้รันทดสอบ (unit + integration Jest) ของ backend อัตโนมัติทุกครั้งที่มีการ push หรือเปิด Pull Request เพื่อ:
1. ป้องกันโค้ดพังเข้า branch หลัก
2. ให้เห็นผล test/coverage บน GitHub โดยไม่ต้องรันเครื่อง local
3. ปูทางไปสู่การ build image / deploy (CD) ในอนาคต

ปัจจุบันเทส backend ใช้ sqlite in-memory จึงยังไม่ต้องมี MySQL จริง → workflow เรียบง่าย รันเร็ว

---
## 2. ไฟล์ Workflow
ที่สร้าง: `.github/workflows/ci.yml`

Trigger:
- push ไปที่ `master`, `create/pdf-generate`
- pull_request ที่เปิดเข้าหา `master`

Job ปัจจุบัน: 
1. `backend-tests` (Jest + coverage)
2. `frontend-tests` (React Jest + jsdom + coverage)

รายละเอียด backend (เหมือนเดิม):
- Checkout repo → setup node → `npm ci` → `npx jest --runInBand --coverage`

รายละเอียด frontend:
- Checkout → setup node → `npm ci` ใน `cslogbook/frontend`
- รัน `npm test -- --watchAll=false --coverage` (ปิด watch เพื่อ CI)
- เก็บ coverage แยก artifact

เหตุผลเลือก `--runInBand`: ลด race condition / memory บน runner (โดยเฉพาะถ้า integration test มี mock DB)

Environment เพิ่มเติม:
- `TZ=Asia/Bangkok` เพื่อให้เทสวันที่/เวลาไม่ต่างจากโซนที่ใช้งานจริง

---
## 3. การดูผล
บน GitHub: แท็บ Actions → เลือก workflow CI → ดู Job Logs
ใน Pull Request: จะเห็นสถานะ (เช่น ✅ หรือ ❌) ใต้รายการ check

หากเทสล้ม:
1. เปิด log → หา test suite ที่ fail
2. รันซ้ำใน local: 
   ```bash
   cd cslogbook/backend
   npm ci
   npx jest --runInBand path/to/failing.test.js
   ```
3. แก้แล้ว commit/push → Workflow จะรันใหม่อัตโนมัติ

---
## 4. Frontend Tests (เพิ่มแล้ว)
ตอนนี้ตั้งค่า job `frontend-tests` แล้ว ใช้ Jest + jsdom (ตาม config ใน `frontend/package.json`).

ถ้าจะเพิ่มขั้นตอน lint / build:
```yaml
      - name: Lint (ถ้าเพิ่มสคริปต์ใน package.json)
        run: npm run lint
      - name: Build (sanity check production build)
        run: npm run build
```
ข้อควรระวัง:
- ถ้า test เริ่มใช้ network (Axios) ควร mock ด้วย msw หรือ jest.mock เพื่อไม่ยิง backend จริง
- ควรหลีกเลี่ยง snapshot ใหญ่ ๆ (แตกง่าย) ให้เน้น behavior (assert text / role / aria)

---
## 5. การเพิ่ม MySQL Service (เมื่อเทสต้องการ DB จริง)
เพิ่ม services → mysql (image official) + รอ healthcheck → run migrations:
```yaml
services:
  mysql:
    image: mysql:8
    env:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: cslog_test
    ports: [3306:3306]
    options: >-
      --health-cmd="mysqladmin ping -h 127.0.0.1"
      --health-interval=10s
      --health-timeout=5s
      --health-retries=5
```
จากนั้น step:
```yaml
run: npx sequelize-cli db:migrate
```
ถ้ามี seed หรือ test data เฉพาะ: เพิ่ม `db:seed:all` หรือสคริปต์ setup เฉพาะเทส

---
## 6. การเตรียม Docker ในอนาคต (แผนล่วงหน้า)
Phase 1 (ปัจจุบัน): CI test backend (เสร็จแล้ว)
Phase 2: เพิ่ม MySQL service (ถ้าจำเป็น)
Phase 3: สร้าง `Dockerfile` backend + job build image + รันทดสอบใน container
Phase 4: docker-compose รวม backend + db + frontend + e2e test (เช่น Playwright/Cypress)
Phase 5: Publish image (GitHub Container Registry / Docker Hub) + CD deploy

ตัวอย่างโครง `Dockerfile` (backbone เริ่มต้น):
```Dockerfile
FROM node:18-alpine AS deps
WORKDIR /app
COPY cslogbook/backend/package*.json ./
RUN npm ci

FROM node:18-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY cslogbook/backend ./
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "server.js"]
```
ใน CI: `docker build -t cslogbook-backend:${GITHUB_SHA} -f cslogbook/backend/Dockerfile .`

---
## 7. เคล็ดลับปรับปรุงเร็ว ๆ
| ความต้องการ | วิธีทำ |
|--------------|--------|
| ลดเวลา install | ใช้ `npm ci` + cache dependency path |
| แยก job ขนาน | backend-tests + frontend-build แยก ต่าง runner |
| ลด log รก | ตั้ง `--silent` หรือ filter ด้วย grep (ไม่จำเป็นยัง) |
| ตรวจ coverage | เพิ่ม threshold ใน Jest config หรือใช้ action badge |
| Fail fast หลาย job | ใช้ `needs:` กำหนด dependency, หรือ `max-parallel` |

---
## 8. ปัญหาที่พบบ่อย
1. cache ไม่ถูกใช้ → ตรวจ path ใน `cache-dependency-path`
2. เวลาเพี้ยน → ตั้ง TZ แล้ว (ทำแล้ว)
3. Memory OOM (เทสมาก) → ลองตัด `--coverage` หรือไม่ใช้ `--runInBand` ถ้าเทสไม่พึ่ง shared state
4. Sequelize ต่อ MySQL ไม่ได้ใน service → รอ health check หรือเพิ่ม retry logic ก่อน migrate

---
## 9. สิ่งที่ยังไม่ทำ (Intentional)
- ยังไม่ build Docker image (รอ phase deploy)
- ยังไม่ publish coverage badge (รอทีมตัดสินใจ tooling)
- ยังไม่เพิ่ม e2e test (เช่น Playwright/Cypress)

---
## 10. สรุป
CI พร้อมใช้งานแล้วสำหรับ backend: ทุก push/PR รัน Jest + coverage อัตโนมัติ → ปูพื้นฐานสู่การเพิ่ม MySQL, Frontend, Docker และ CD ในอนาคตได้สะดวก

หากต้องแก้/ขยาย ให้เริ่มจากปรับไฟล์ `.github/workflows/ci.yml` ตามตัวอย่างคอมเมนต์ที่แนบไว้

---
ผู้จัดทำ: AI Assistant (ปรับปรุงต่อได้ตามทีม)
