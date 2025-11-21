# 🧪 Test CI/CD Push

ไฟล์นี้สร้างขึ้นเพื่อทดสอบ CI/CD workflows เมื่อ push ไปยัง master branch

**วันที่สร้าง:** 2024

**วัตถุประสงค์:**
- ✅ ทดสอบ GitHub Actions workflows
- ✅ ตรวจสอบว่า CI pipeline ทำงานถูกต้อง
- ✅ ทดสอบ Docker build process
- ✅ ตรวจสอบ deployment workflow (ถ้ามีการตั้งค่า secrets)

---

## 📋 Workflows ที่ควรทำงาน

เมื่อ push ไฟล์นี้ไปยัง master branch จะ trigger workflows ต่อไปนี้:

### 1. CI - Continuous Integration (`ci.yml`)
- ✅ Backend tests
- ✅ Frontend tests  
- ✅ Linting checks
- ✅ Build verification

### 2. Docker Build & Push (`docker-build.yml`)
- ✅ Build backend Docker image
- ✅ Build frontend Docker image
- ✅ Test docker-compose configuration

### 3. Deploy to Production (`deploy.yml`)
- ✅ Deploy to server (ถ้ามีการตั้งค่า secrets)

---

## 🚀 วิธีทดสอบ

### วิธีที่ 1: ใช้ Git Commands

```bash
# 1. ตรวจสอบ branch
git branch

# 2. Switch ไป master (ถ้ายังไม่อยู่)
git checkout master

# 3. Pull latest code
git pull origin master

# 4. แก้ไขไฟล์นี้ (เพิ่มข้อความอะไรก็ได้)
# หรือ commit ไฟล์นี้เลย

# 5. Commit
git add TEST_CI_PUSH.md
git commit -m "test: verify CI/CD workflows"

# 6. Push
git push origin master
```

### วิธีที่ 2: ใช้ Scripts

**Windows (PowerShell):**
```powershell
.\scripts\test-ci-push.ps1
```

**Linux/Mac:**
```bash
chmod +x scripts/test-ci-push.sh
./scripts/test-ci-push.sh
```

---

## 📊 ตรวจสอบผล

1. ไปที่ GitHub Repository
2. คลิกแท็บ **"Actions"**
3. ดู workflow runs ที่เพิ่ง trigger
4. คลิกเข้าไปดู logs และผลลัพธ์

---

## ✅ Checklist

หลังจาก push แล้ว ตรวจสอบว่า:

- [ ] CI workflow ทำงาน (tests, lint, build)
- [ ] Docker build workflow ทำงาน
- [ ] Deployment workflow ทำงาน (ถ้ามีการตั้งค่า secrets)
- [ ] ไม่มี errors ใน workflow runs

---

## 🗑️ ลบไฟล์ทดสอบ

หลังจากทดสอบเสร็จแล้ว สามารถลบไฟล์นี้ได้:

```bash
git rm TEST_CI_PUSH.md
git commit -m "chore: remove test file"
git push origin master
```

---

**หมายเหตุ:** ไฟล์นี้สามารถลบได้หลังจากทดสอบเสร็จแล้ว

