# CSLogbook - Production Deploy (VPS 119.59.124.67)

## สถาปัตยกรรม (Nginx Reverse Proxy)

```
Public (port 80)
    ↓
Nginx (บน host)
    ├── /          → Frontend (127.0.0.1:3000)
    ├── /api/      → Backend  (127.0.0.1:5000)
    ├── /api-docs/ → Swagger
    └── /uploads/   → Backend uploads

Backend & Frontend: bind 127.0.0.1 เท่านั้น (ไม่เปิด public port)
```

**Public URLs:**
- http://119.59.124.67
- http://119.59.124.67/api
- http://119.59.124.67/api-docs

---

## ขั้นตอน Deploy

### 1. เตรียม VPS

```bash
# สร้าง user (ถ้ายังไม่มี)
sudo adduser deploy-cslogbook
sudo usermod -aG docker deploy-cslogbook

# ติดตั้ง Docker
# ดู: https://docs.docker.com/engine/install/

# ติดตั้ง Nginx
sudo apt update
sudo apt install nginx -y
```

### 2. ติดตั้ง Nginx Config

```bash
# Copy config จากโปรเจกต์
sudo cp nginx/cslogbook.conf /etc/nginx/sites-available/cslogbook

# เปิดใช้งาน
sudo ln -sf /etc/nginx/sites-available/cslogbook /etc/nginx/sites-enabled/

# ลบ default site (ถ้ามี)
sudo rm -f /etc/nginx/sites-enabled/default

# ตรวจสอบ config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 3. Firewall (สำคัญ)

```bash
# ปิด port 3000, 5000 (ถ้าเปิดอยู่)
sudo ufw delete allow 3000 2>/dev/null || true
sudo ufw delete allow 5000 2>/dev/null || true

# เปิดเฉพาะ port 80 และ SSH
sudo ufw allow 80
sudo ufw allow 22
sudo ufw enable
sudo ufw status
```

### 4. Clone และ Setup

```bash
cd /home/deploy-cslogbook
git clone <repo-url> app
cd app
```

### 5. สร้าง .env.production

```bash
cp .env.production.example .env.production
# แก้ไข .env.production - เปลี่ยน password, JWT_SECRET ตามต้องการ
# ตรวจสอบ BASE_URL, FRONTEND_URL, NEXT_PUBLIC_API_URL = http://119.59.124.67 (ไม่มี port)
```

### 6. Build และ Start

```bash
docker compose -f docker-compose.production.yml build --no-cache
docker compose -f docker-compose.production.yml up -d
```

### 7. ตรวจสอบ

```bash
# ดู logs
docker compose -f docker-compose.production.yml logs -f

# ตรวจสอบ migrations
docker exec cslogbook-backend npm run migrate:status

# Seed ข้อมูลเริ่มต้น (ถ้าต้องการ)
docker exec cslogbook-backend npm run seed:prod
```

### 8. Test Flow

1. เปิด http://119.59.124.67 → โหลด frontend ได้
2. DevTools → Network → API เรียกไปที่ http://119.59.124.67/api/...
3. เปิด http://119.59.124.67/api-docs → Swagger เข้าได้

---

## Codebase Checklist (ก่อน Deploy)

| # | รายการ | สถานะ |
|---|--------|-------|
| 1 | docker-compose: backend/frontend bind 127.0.0.1 เท่านั้น | ✅ |
| 2 | BASE_URL, FRONTEND_URL = http://119.59.124.67 (ไม่มี port) | ✅ |
| 3 | NEXT_PUBLIC_API_URL = http://119.59.124.67/api | ✅ |
| 4 | CORS ใช้ FRONTEND_URL เดียวกัน | ✅ |
| 5 | UFW ปิด 3000/5000, เปิด 80/22 | ตรวจบน VPS |
| 6 | nginx -t ผ่าน | ตรวจบน VPS |

---

## คำสั่งที่มีประโยชน์

```bash
# Restart ทุก service
docker compose -f docker-compose.production.yml restart

# Restart เฉพาะ backend
docker compose -f docker-compose.production.yml restart backend

# ดู logs
docker compose -f docker-compose.production.yml logs -f backend

# เข้า MySQL
docker exec -it cslogbook-mysql mysql -u root -p cslogbook_prod

# Backup database
docker exec cslogbook-mysql mysqldump -u root -p cslogbook_prod > backup_$(date +%Y%m%d).sql

# Reload Nginx (หลังแก้ config)
sudo nginx -t && sudo systemctl reload nginx
```

---

## หมายเหตุ

- Backend และ Frontend bind เฉพาะ 127.0.0.1 — public เข้าผ่าน Nginx port 80 เท่านั้น
- MySQL port 3306 ผูก 127.0.0.1 เท่านั้น (ไม่เปิด public)
- Backend รัน migrations อัตโนมัติทุกครั้งที่ start
- `client_max_body_size 10M` ใน Nginx — ป้องกัน upload error
