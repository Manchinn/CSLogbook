# Deployment Checklist - Project Workflow Deadline Integration

**Branch**: `fix/filter-projectpairs`  
**Target**: Production  
**Date**: 3 พฤศจิกายน 2568

---

## ✅ Pre-Deployment Tasks

### 1. Code Review & Testing

- [ ] ทดสอบ backend API ทั้งหมดใน development
  ```bash
  cd backend
  npm run test
  ```

- [ ] ทดสอบ deadline enforcement middleware
  - [ ] ส่งเอกสารก่อน deadline (should pass)
  - [ ] ส่งเอกสารหลัง deadline + lockAfterDeadline (should block)
  - [ ] ส่งเอกสารใน grace period (should warn but pass)

- [ ] ทดสอบ projectDeadlineMonitor agent
  ```bash
  node -e "const monitor = require('./agents/projectDeadlineMonitor'); monitor.triggerCheck().then(() => console.log(monitor.getStatistics())).catch(console.error);"
  ```

- [ ] ทดสอบ frontend components
  - [ ] DeadlineAlert แสดงถูกต้อง
  - [ ] DeadlineCountdown นับถอยหลังถูกต้อง
  - [ ] UpcomingDeadlines แสดงรายการถูกต้อง
  - [ ] Responsive layout (mobile & desktop)

- [ ] ตรวจสอบ browser console (ไม่มี errors)

- [ ] ตรวจสอบ ESLint warnings
  ```bash
  cd frontend
  npm run lint
  ```

### 2. Database & Environment

- [ ] ตรวจสอบว่า production database มี tables ที่จำเป็น:
  - [ ] `important_deadlines`
  - [ ] `project_workflow_states`
  - [ ] `project_documents`
  - [ ] `internship_documents`

- [ ] ตรวจสอบว่ามี deadline templates ในฐานข้อมูล production
  ```sql
  SELECT template_id, name, related_to FROM important_deadlines 
  WHERE is_active = 1 AND deleted_at IS NULL;
  ```

- [ ] ตรวจสอบ environment variables ใน production:
  - [ ] `NODE_ENV=production`
  - [ ] `ENABLE_AGENTS=true` (เปิดใช้ deadline monitor)
  - [ ] `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
  - [ ] `JWT_SECRET`
  - [ ] `FRONTEND_URL`

### 3. Backup

- [ ] Backup production database
  ```bash
  mysqldump -u root -p cslogbook > backup_before_deadline_integration_$(date +%Y%m%d).sql
  ```

- [ ] Backup production code (ถ้ายังไม่ใช้ Git)

- [ ] เก็บ environment file
  ```bash
  cp .env.production .env.production.backup
  ```

### 4. Git & Version Control

- [ ] Commit ทุกอย่างใน branch `fix/filter-projectpairs`
  ```bash
  git add .
  git commit -m "feat: integrate deadline system with project workflow state"
  ```

- [ ] Push ไปยัง remote repository
  ```bash
  git push origin fix/filter-projectpairs
  ```

- [ ] Create Pull Request (ถ้าใช้ GitHub workflow)

- [ ] Code review โดยทีม (ถ้ามี)

- [ ] Merge ไป `master` branch
  ```bash
  git checkout master
  git merge fix/filter-projectpairs
  git push origin master
  ```

---

## 🚀 Deployment Steps

### Step 1: Pull Latest Code

```bash
# SSH เข้า production server
ssh user@your-production-server

# ไปยัง project directory
cd /path/to/cslogbook

# Pull latest code
git fetch origin
git checkout master
git pull origin master
```

### Step 2: Backend Deployment

```bash
cd backend

# 1. Install new dependencies (ถ้ามี)
npm install

# 2. Run migrations (ถ้ามี - ในกรณีนี้ไม่มี migrations ใหม่)
npm run migrate

# 3. ตรวจสอบ database connection
npm run db:check:all

# 4. Restart backend server
pm2 restart cslogbook-backend
# หรือ
sudo systemctl restart cslogbook-backend

# 5. ตรวจสอบ logs
pm2 logs cslogbook-backend --lines 50
# หรือ
tail -f logs/combined.log
```

### Step 3: Frontend Deployment

```bash
cd frontend

# 1. Install new dependencies
npm install

# 2. Build production bundle
npm run build

# 3. Deploy build files
# ถ้าใช้ nginx:
sudo cp -r build/* /var/www/cslogbook/
# หรือถ้าใช้ Docker:
docker-compose -f docker-compose.production.yml up -d --build frontend

# 4. Clear browser cache (แจ้ง users)
```

### Step 4: Verify Agent is Running

```bash
cd backend

# ตรวจสอบว่า projectDeadlineMonitor agent ทำงาน
pm2 logs cslogbook-backend | grep "Project Deadline Monitor"

# ควรเห็น log:
# "🤖 Project Deadline Monitor started"
# "✅ Project Deadline Monitor check completed"

# Manual trigger เพื่อทดสอบ (optional)
node -e "require('dotenv').config({ path: '.env.production' }); \
  const monitor = require('./agents/projectDeadlineMonitor'); \
  monitor.triggerCheck().then(() => { \
    console.log('Stats:', monitor.getStatistics()); \
    process.exit(0); \
  });"
```

### Step 5: Smoke Testing

```bash
# 1. ทดสอบ API endpoint
curl -X GET "https://your-domain.com/api/projects/123/workflow-state/deadlines" \
  -H "Authorization: Bearer YOUR_PROD_TOKEN"

# Expected: 200 OK with deadline data

# 2. ทดสอบ deadline middleware
curl -X POST "https://your-domain.com/api/projects/123/kp02" \
  -H "Authorization: Bearer YOUR_PROD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"data": "test"}'

# Expected: 200 OK (ถ้ายังไม่เลย deadline) หรือ 403 Forbidden (ถ้าเลยแล้ว)
```

### Step 6: Monitor Production

```bash
# 1. Monitor backend logs
pm2 logs cslogbook-backend --lines 100

# 2. Monitor error logs
tail -f backend/logs/error.log

# 3. Monitor database queries (ถ้ามี slow query log)
tail -f /var/log/mysql/slow-query.log

# 4. Monitor system resources
htop
# หรือ
pm2 monit
```

---

## 🔍 Post-Deployment Verification

### 1. Frontend Checks

- [ ] เปิดหน้า Project Dashboard
- [ ] ตรวจสอบว่า deadline components แสดง
  - [ ] DeadlineAlert (ถ้ามี overdue)
  - [ ] DeadlineCountdown
  - [ ] UpcomingDeadlines
- [ ] ตรวจสอบว่าสีและ icons แสดงถูกต้อง
- [ ] ทดสอบ responsive บน mobile
- [ ] ตรวจสอบ browser console (ไม่มี errors)

### 2. Backend API Checks

- [ ] Test GET `/api/projects/:id/workflow-state/deadlines`
  ```bash
  curl -X GET "https://api.yourdomain.com/api/projects/123/workflow-state/deadlines" \
    -H "Authorization: Bearer TOKEN"
  ```

- [ ] Test deadline enforcement
  - [ ] ส่งเอกสารก่อน deadline → ควรผ่าน
  - [ ] ส่งเอกสารหลัง deadline + lock → ควรถูกบล็อก

- [ ] ตรวจสอบ agent statistics
  ```bash
  node -e "const monitor = require('./agents/projectDeadlineMonitor'); \
    console.log(monitor.getStatistics());"
  ```

### 3. Database Checks

```sql
-- ตรวจสอบว่า isOverdue ถูกอัปเดต
SELECT COUNT(*) as overdue_count 
FROM project_workflow_states 
WHERE is_overdue = 1;

-- ตรวจสอบ deadline templates
SELECT COUNT(*) as active_deadlines 
FROM important_deadlines 
WHERE is_active = 1 AND deleted_at IS NULL;

-- ตรวจสอบ projects ที่มี workflow state
SELECT COUNT(*) as total_projects 
FROM project_workflow_states;
```

### 4. Performance Checks

- [ ] ตรวจสอบ response time ของ API
  ```bash
  time curl -X GET "https://api.yourdomain.com/api/projects/123/workflow-state/deadlines" \
    -H "Authorization: Bearer TOKEN"
  ```
  
- [ ] ตรวจสอบ memory usage
  ```bash
  pm2 monit
  ```

- [ ] ตรวจสอบ database query performance
  ```sql
  SHOW PROCESSLIST;
  ```

### 5. User Acceptance Testing

- [ ] ให้ทีมทดสอบ (QA team)
- [ ] ให้ pilot users ทดสอบ (1-2 นักศึกษา)
- [ ] รวบรวม feedback

---

## 🚨 Rollback Plan

หากพบปัญหาร้ายแรง ให้ rollback ทันที:

### Backend Rollback

```bash
cd /path/to/cslogbook

# 1. Checkout ไปยัง commit ก่อนหน้า
git log --oneline -10  # หา commit hash
git checkout <previous-commit-hash>

# 2. Restart backend
pm2 restart cslogbook-backend

# 3. ตรวจสอบ logs
pm2 logs cslogbook-backend
```

### Frontend Rollback

```bash
cd frontend

# 1. Checkout ไปยัง commit ก่อนหน้า
git checkout <previous-commit-hash>

# 2. Rebuild
npm run build

# 3. Deploy
sudo cp -r build/* /var/www/cslogbook/
```

### Database Rollback (ถ้าจำเป็น)

```bash
# Restore จาก backup
mysql -u root -p cslogbook < backup_before_deadline_integration_YYYYMMDD.sql
```

---

## 📊 Monitoring Schedule

### วันแรก (24 ชั่วโมง)
- [ ] เช็คทุก 2 ชั่วโมง
- [ ] Monitor error logs
- [ ] Monitor user feedback

### สัปดาห์แรก
- [ ] เช็คทุกเช้า
- [ ] ดู statistics จาก agent
- [ ] ตรวจสอบ deadline enforcement

### เดือนแรก
- [ ] Weekly review
- [ ] วิเคราะห์ performance
- [ ] รวบรวม feedback จาก users

---

## 📞 Emergency Contacts

- **Backend Developer**: [ชื่อ + เบอร์]
- **Database Admin**: [ชื่อ + เบอร์]
- **DevOps**: [ชื่อ + เบอร์]
- **Product Owner**: [ชื่อ + เบอร์]

---

## 📝 Post-Deployment Notes

### Success Criteria
- ✅ ไม่มี error logs ใน 24 ชั่วโมงแรก
- ✅ Deadline components แสดงถูกต้องใน production
- ✅ Agent ทำงานได้ปกติ (ไม่ crash)
- ✅ Response time < 2 วินาที
- ✅ ไม่มี user complaints

### Known Issues
- [ ] (เพิ่มหาก discover ปัญหาหลัง deploy)

### Future Improvements
- [ ] เพิ่ม email notifications
- [ ] เพิ่ม deadline display ใน Main Dashboard
- [ ] เพิ่ม Admin Dashboard สำหรับดู overdue projects
- [ ] เพิ่ม analytics dashboard

---

**Deployment Date**: _________________  
**Deployed By**: _________________  
**Verified By**: _________________  
**Sign-off**: _________________
