# 🚀 CSLogbook Production Deployment Guide

## 📋 คำสั่งที่ใช้บน Production Host

### 1. **เตรียม Environment**
```bash
# คัดลอกไฟล์ตัวอย่าง
cp .env.production.example .env.production

# แก้ไขค่าต่างๆ ให้ตรงกับ production
nano .env.production
```

### 2. **คำสั่ง Docker สำหรับ Production**

#### **หยุดและลบ containers เก่า**
```bash
docker-compose --env-file .env.production down -v
```

#### **Build และรัน Production**
```bash
# Build images ใหม่
docker-compose --env-file .env.production build --no-cache

# รัน services
docker-compose --env-file .env.production up -d

# ตรวจสอบสถานะ
docker-compose --env-file .env.production ps
```

#### **ตรวจสอบ logs**
```bash
# ดู logs ทั้งหมด
docker-compose --env-file .env.production logs

# ดู logs แต่ละ service
docker-compose --env-file .env.production logs mysql
docker-compose --env-file .env.production logs backend
docker-compose --env-file .env.production logs frontend

# ติดตาม logs แบบ real-time
docker-compose --env-file .env.production logs -f
```

### 3. **คำสั่งจัดการฐานข้อมูล**

#### **Backup Database**
```bash
# ใช้ script ที่มีอยู่
./scripts/backup-database.sh

# หรือใช้ docker exec
docker exec cslogbook-mysql mysqldump -u root -p cslogbook_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### **Restore Database**
```bash
# ใช้ script ที่มีอยู่
./scripts/restore-database.sh backup_file.sql

# หรือใช้ docker exec
docker exec -i cslogbook-mysql mysql -u root -p cslogbook_prod < backup_file.sql
```

### 4. **คำสั่งตรวจสอบระบบ**

#### **Health Check**
```bash
# ตรวจสอบ Backend API
curl https://api.yourdomain.com/api/health

# ตรวจสอบ Frontend
curl -I https://cslogbook.yourdomain.com

# ตรวจสอบ Database connection
docker exec cslogbook-mysql mysql -u root -p -e "SELECT 1"
```

#### **ตรวจสอบ Resources**
```bash
# ดู resource usage
docker stats

# ดู disk usage
docker system df

# ดู network
docker network ls
```

### 5. **คำสั่งบำรุงรักษา**

#### **อัปเดตระบบ**
```bash
# Pull code ใหม่
git pull origin main

# Rebuild และ restart
docker-compose --env-file .env.production down
docker-compose --env-file .env.production build --no-cache
docker-compose --env-file .env.production up -d
```

#### **ทำความสะอาด**
```bash
# ลบ images ที่ไม่ใช้
docker image prune -f

# ลบ volumes ที่ไม่ใช้
docker volume prune -f

# ลบทุกอย่างที่ไม่ใช้
docker system prune -af
```

## 🔧 ค่าที่ต้องกรอกเองใน .env.production

### **1. ฐานข้อมูล**
```bash
DB_PASSWORD=YourSecurePassword123!        # รหัสผ่านฐานข้อมูลที่ปลอดภัย
MYSQL_ROOT_PASSWORD=YourRootPassword456!  # รหัสผ่าน root MySQL
```

### **2. JWT Security**
```bash
JWT_SECRET=YourVerySecureJWTSecret64CharactersLongForProductionUse!
# ต้องยาวอย่างน้อย 32 ตัวอักษร, แนะนำ 64+ ตัวอักษร
```

### **3. Domain/URL**
```bash
BASE_URL=https://api.yourdomain.com           # Backend API URL
FRONTEND_URL=https://cslogbook.yourdomain.com # Frontend URL
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_UPLOAD_URL=https://api.yourdomain.com/uploads
```

### **4. Email Configuration (SendGrid)**
```bash
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here  # API Key จาก SendGrid
EMAIL_SENDER=no-reply@yourdomain.com             # อีเมลผู้ส่ง
```

## 🌐 ตัวอย่างการตั้งค่าสำหรับ DigitalOcean

### **กรณีใช้ IP Address**
```bash
BASE_URL=http://159.89.123.45:5000
FRONTEND_URL=http://159.89.123.45:3000
REACT_APP_API_URL=http://159.89.123.45:5000/api
REACT_APP_UPLOAD_URL=http://159.89.123.45:5000/uploads
```

### **กรณีใช้ Domain + SSL**
```bash
BASE_URL=https://api.cslogbook.sci.kmutnb.ac.th
FRONTEND_URL=https://cslogbook.sci.kmutnb.ac.th
REACT_APP_API_URL=https://api.cslogbook.sci.kmutnb.ac.th/api
REACT_APP_UPLOAD_URL=https://api.cslogbook.sci.kmutnb.ac.th/uploads
```

## 🔒 Security Checklist

- [ ] เปลี่ยน default passwords ทั้งหมด
- [ ] ใช้ JWT_SECRET ที่ปลอดภัยและยาว
- [ ] ตั้งค่า firewall ให้เปิดเฉพาะพอร์ตที่จำเป็น
- [ ] ใช้ HTTPS สำหรับ production
- [ ] ตั้งค่า backup อัตโนมัติ
- [ ] ตรวจสอบ logs เป็นประจำ

## 📊 Monitoring

### **ตรวจสอบ logs แบบ real-time**
```bash
# ทุก services
docker-compose --env-file .env.production logs -f

# เฉพาะ backend
docker-compose --env-file .env.production logs -f backend

# เฉพาะ errors
docker-compose --env-file .env.production logs --tail=100 | grep -i error
```

### **ตรวจสอบ performance**
```bash
# Resource usage
docker stats --no-stream

# Disk usage
df -h
docker system df
```