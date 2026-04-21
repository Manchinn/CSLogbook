# Docker — Local Development

Hybrid setup: **MySQL + Adminer รันใน Docker**, **Backend + Frontend รัน native** บน host ผ่าน `npm run dev`

> Next.js + Turbopack บน Windows ใน Docker volume mount ช้ามาก (file watcher + I/O overhead)
> → รัน native เร็วกว่า 10-30 เท่า + IDE autocomplete ใช้ได้เต็มที่

---

## Prerequisites

- Node.js 18+ (แนะนำ 20 LTS)
- Docker Desktop (Windows/Mac) หรือ Docker Engine (Linux)
- npm 9+

---

## First-time Setup

จาก `cslogbook/` root:

```bash
# 1) Copy env templates
cp .env.docker.example .env.docker
cp backend/.env.example backend/.env.development
cp frontend-next/env.example frontend-next/.env.local

# 2) Start MySQL + Adminer (background)
docker compose --env-file .env.docker up -d

# 3) รอให้ MySQL healthy (~30 วินาที ครั้งแรก — auto-import backup.sql 695K)
docker compose ps
# → mysql ต้องเป็น "healthy"

# 4) Install + migrate (terminal แยก)
cd backend
npm install
npm run migrate
npm run seed:dev
npm run dev       # → http://localhost:5000

# 5) Frontend (terminal อีกอัน)
cd frontend-next
npm install
npm run dev       # → http://localhost:3000
```

> **ทำไมต้องใช้ `.env.docker` ไม่ใช่ `.env`?**
> ถ้ามีไฟล์ `.env` ที่มี `DB_USER=root` (เช่น config ของ production) อยู่ก่อน →
> MySQL container จะ boot ไม่ขึ้นเพราะ mysql image ห้ามสร้าง user ชื่อ `root`
> การแยกเป็น `.env.docker` ทำให้ทั้ง 2 ไฟล์อยู่ร่วมกันได้โดยไม่ชนกัน

---

## Daily Workflow

```bash
# Start MySQL (cd cslogbook ก่อน)
docker compose --env-file .env.docker up -d

# Backend (terminal 1)
cd backend && npm run dev

# Frontend (terminal 2)
cd frontend-next && npm run dev

# Stop MySQL เมื่อเลิกงาน (optional — ไม่ stop ก็ได้)
docker compose stop
```

---

## Access Points

| Service | URL | Credentials |
|---|---|---|
| Frontend | http://localhost:3000 | — |
| Backend API | http://localhost:5000/api | — |
| Swagger | http://localhost:5000/api-docs | — |
| Adminer (DB GUI) | http://localhost:8080 | Server: `mysql`, User: `cslogbook`, DB: `cslogbook_prod` |
| MySQL (client เช่น DBeaver) | `localhost:3307` | root / `rootpass` (หรือตาม `.env`) |

---

## Common Commands

```bash
# Start
docker compose --env-file .env.docker up -d

# Stop (keep data)
docker compose stop

# Down (remove containers, keep data)
docker compose down

# Reset ทั้งหมด (wipe DB → re-import backup.sql)
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d

# ดู logs
docker compose logs -f mysql
docker compose logs -f adminer

# Enter MySQL shell
docker compose exec mysql mysql -ucslogbook -pdevpass cslogbook_prod

# Check status
docker compose ps
```

---

## Troubleshooting

### Port 3307 already in use
มี MySQL container อื่นหรือ process อื่นใช้ port อยู่
```bash
# เปลี่ยน port ใน .env
DB_PORT_HOST=3308
```

### Port 3306 ถูกใช้โดย MySQL80 (Windows)
**ตั้งใจออกแบบไว้** — default port คือ 3307 เพื่อเลี่ยง conflict
ถ้าอยากใช้ 3306 ต้อง stop `MySQL80` service ก่อน:
```powershell
# Run as Administrator
net stop MySQL80
```

### Backend เชื่อม DB ไม่ได้
1. ตรวจว่า MySQL container healthy: `docker compose ps`
2. ตรวจ `backend/.env.development` → `DB_PORT=3307`
3. ตรวจ logs: `docker compose logs mysql`

### Backup.sql ไม่ import
Init scripts รันแค่ตอน volume ว่าง ถ้าเคย up แล้วต้อง wipe ก่อน:
```bash
docker compose --env-file .env.docker down -v
docker compose --env-file .env.docker up -d
```

### อยาก fresh start (ทิ้งทุก schema)
```bash
docker compose --env-file .env.docker down -v
# แก้ไข database/init/backup.sql ถ้าต้องการ
docker compose --env-file .env.docker up -d
cd backend && npm run migrate && npm run seed:dev
```

---

## ถ้าใช้ Windows MySQL80 (native) แทน Docker

ตัวเลือกนี้มีถ้ามี MySQL 8.0 ติดตั้งบน Windows อยู่แล้ว — ข้าม `docker compose up` ได้

ใน `backend/.env.development`:
```
DB_HOST=127.0.0.1
DB_PORT=3306          # ← port default ของ MySQL80
DB_USER=root          # ← ตรงกับ config MySQL80
DB_PASSWORD=<ของคุณ>
DB_NAME=cslogbook
```

แล้วต้อง import `database/init/backup.sql` ด้วยตัวเอง (MySQL80 ไม่มี auto-import):
```bash
mysql -uroot -p cslogbook < database/init/backup.sql
```

---

## Production Deploy (reference)

ใช้ `docker-compose.production.yml` — ไม่แตะไฟล์นี้จาก local
ดู CI/CD workflow: `.github/workflows/deploy.yml`
