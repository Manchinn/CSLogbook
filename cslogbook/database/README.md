# Database Management Guide

คู่มือการจัดการ Database MySQL สำหรับระบบ CSLogbook

## 📋 ภาพรวม

ระบบใช้ MySQL 8.0 เป็นฐานข้อมูลหลัก รองรับ UTF-8MB4 สำหรับภาษาไทย และใช้ Sequelize ORM สำหรับการจัดการ database schema ผ่าน migrations

## 🗂️ โครงสร้างไฟล์

```
database/
├── init/                    # ไฟล์ SQL ที่จะรันอัตโนมัติเมื่อสร้าง container ใหม่
│   └── backup.sql          # SQL backup file (ถ้ามี)
└── README.md               # คู่มือนี้
```

**หมายเหตุ**: ระบบใช้ Sequelize migrations แทน SQL files สำหรับการจัดการ schema

## 🐳 การทำงานของ Database ใน Docker

### MySQL Container Configuration

MySQL container จะ:
- สร้าง database ตามชื่อที่กำหนดใน `MYSQL_DATABASE`
- รันไฟล์ SQL ทั้งหมดใน `/docker-entrypoint-initdb.d/` เรียงตามชื่อไฟล์ (ถ้ามี)
- เก็บข้อมูลใน Docker volume `mysql-data`
- ใช้ character set `utf8mb4` และ collation `utf8mb4_unicode_ci` สำหรับรองรับภาษาไทย

### MySQL Configuration
```yaml
command: >-
  --default-authentication-plugin=mysql_native_password
  --character-set-server=utf8mb4
  --collation-server=utf8mb4_unicode_ci
```

### ลำดับการทำงาน:
1. สร้าง database และ user ตาม environment variables
2. รันไฟล์ SQL ใน `database/init/` (ถ้ามี) เรียงตามชื่อไฟล์
3. Backend จะรัน Sequelize migrations อัตโนมัติ (ถ้าตั้งค่าไว้)

## 📊 Database Schema Management

### ใช้ Sequelize Migrations (แนะนำ)

ระบบใช้ Sequelize migrations สำหรับการจัดการ database schema:

```bash
# จาก backend directory
cd backend

# รัน migrations ทั้งหมด
npm run migrate

# Rollback migration ล่าสุด
npm run migrate:undo

# สร้าง migration ใหม่
npm run migrate:create <migration-name>

# ตรวจสอบสถานะ migrations
npm run migrate:status
```

### ใช้ SQL Dump (สำหรับการ restore)

#### วิธีที่ 1: วางไฟล์ใน init directory
```bash
# วางไฟล์ dump ใน database/init/
cp your-project-dump.sql database/init/backup.sql
```

#### วิธีที่ 2: Restore ผ่าน Docker
```bash
# Restore จากไฟล์ SQL
docker exec -i cslogbook-mysql mysql -u root -p cslogbook < backup.sql
```

## 🔐 Environment Variables

### Database Configuration (ใน `.env.docker` หรือ `.env.production`)

```env
# Database Connection (สำหรับ Backend)
DB_HOST=mysql                    # ชื่อ service ใน docker-compose (development)
                                 # หรือ hostname/IP (production)
DB_PORT=3306                     # port ภายใน container
DB_NAME=cslogbook               # ชื่อ database
DB_USER=cslogbook               # username
DB_PASSWORD=your_secure_password # password ที่ปลอดภัย

# MySQL Container Configuration
MYSQL_ROOT_PASSWORD=root_password # root password
MYSQL_PORT=3307                  # port ที่เปิดออกมาจาก host (development)
```

### Production Configuration

ใน production อาจใช้ external MySQL server:
```env
DB_HOST=your-mysql-host.com
DB_PORT=3306
DB_NAME=cslogbook
DB_USER=cslogbook_user
DB_PASSWORD=secure_password
```

## 💾 การ Backup และ Restore

### Backup Database

#### วิธีที่ 1: ใช้ mysqldump (แนะนำ)
```bash
# Backup ทั้ง database
docker exec cslogbook-mysql mysqldump -u root -p cslogbook > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup เฉพาะโครงสร้าง (schema)
docker exec cslogbook-mysql mysqldump -u root -p --no-data cslogbook > schema_backup.sql

# Backup เฉพาะข้อมูล (data)
docker exec cslogbook-mysql mysqldump -u root -p --no-create-info cslogbook > data_backup.sql
```

#### วิธีที่ 2: Backup Docker Volume
```bash
# Backup volume
docker run --rm -v cslogbook_mysql-data:/data -v $(pwd):/backup alpine tar czf /backup/mysql-data-backup.tar.gz /data

# Restore volume
docker run --rm -v cslogbook_mysql-data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql-data-backup.tar.gz -C /
```

### Restore Database

```bash
# Restore จากไฟล์ SQL
docker exec -i cslogbook-mysql mysql -u root -p cslogbook < backup.sql

# หรือใช้ mysql client จากภายนอก
mysql -h 127.0.0.1 -P 3307 -u root -p cslogbook < backup.sql
```

### Automated Backup (แนะนำสำหรับ Production)

สร้าง cron job หรือ scheduled task:
```bash
# ตัวอย่าง cron job (backup ทุกวันเวลา 2:00 AM)
0 2 * * * docker exec cslogbook-mysql mysqldump -u root -p'password' cslogbook > /backups/cslogbook_$(date +\%Y\%m\%d).sql
```

## 🔍 การ Debug และ Troubleshooting

### เข้าถึง MySQL CLI

#### วิธีที่ 1: ผ่าน Docker Container
```bash
# เข้า container
docker exec -it cslogbook-mysql bash

# เชื่อมต่อ MySQL
mysql -u root -p
# หรือใช้ user อื่น
mysql -u cslogbook -p
```

#### วิธีที่ 2: เชื่อมต่อจากภายนอก
```bash
# Development (port 3307)
mysql -h 127.0.0.1 -P 3307 -u root -p

# หรือใช้ user อื่น
mysql -h 127.0.0.1 -P 3307 -u cslogbook -p
```

### ตรวจสอบสถานะ

```bash
# ดู logs ของ MySQL container
docker logs cslogbook-mysql

# ดู logs แบบ real-time
docker logs -f cslogbook-mysql

# ตรวจสอบ health check
docker ps

# ตรวจสอบว่า MySQL พร้อมใช้งาน
docker exec cslogbook-mysql mysqladmin ping -h localhost
```

### คำสั่ง MySQL ที่มีประโยชน์

```sql
-- ดู databases ทั้งหมด
SHOW DATABASES;

-- ใช้ database
USE cslogbook;

-- ดู tables ทั้งหมด
SHOW TABLES;

-- ดูโครงสร้าง table
DESCRIBE table_name;
SHOW CREATE TABLE table_name;

-- ตรวจสอบ character set
SHOW VARIABLES LIKE 'character_set%';
SHOW VARIABLES LIKE 'collation%';

-- ดูขนาด database
SELECT 
    table_schema AS 'Database',
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'cslogbook'
GROUP BY table_schema;
```

## 🔗 การใช้งานกับ Backend

### Backend Connection

Backend จะ:
- รอให้ MySQL พร้อมใช้งานผ่าน `healthcheck` (ใน docker-compose)
- เชื่อมต่อผ่าน Sequelize ORM
- ใช้ connection pool สำหรับประสิทธิภาพ

### Migrations และ Seeders

```bash
# เข้า backend container
docker exec -it cslogbook-backend bash

# รัน migrations
npm run migrate

# ตรวจสอบสถานะ migrations
npm run migrate:status

# Rollback migration
npm run migrate:undo

# รัน seeders (ข้อมูลเริ่มต้น)
npm run seed

# รัน seeder เฉพาะ
npm run seed:one <seeder-name>
```

### Database Checks

```bash
# ตรวจสอบการเชื่อมต่อ database
npm run db:check

# ตรวจสอบ models
npm run db:check:models

# ตรวจสอบทั้งหมด
npm run db:check:all
```

## ⚠️ ข้อควรระวัง

### 1. ไฟล์ init จะรันเฉพาะครั้งแรก
- หาก Docker volume `mysql-data` มีข้อมูลอยู่แล้ว ไฟล์ใน `database/init/` จะไม่รันอีก
- ต้องลบ volume ก่อน: `docker-compose down -v`

### 2. การลบ Volume
```bash
# ⚠️ คำเตือน: คำสั่งนี้จะลบข้อมูลทั้งหมด!
docker-compose down -v
```

### 3. การ Backup
- **ควร backup ข้อมูลสำคัญก่อน deploy production**
- ตั้งค่า automated backup สำหรับ production
- เก็บ backup ไว้ในที่ปลอดภัย

### 4. Security
- **เปลี่ยน password default ใน production**
- ใช้ strong passwords
- จำกัดการเข้าถึง database จากภายนอก
- ใช้ SSL/TLS สำหรับ production connections

### 5. Performance
- ตั้งค่า connection pool ที่เหมาะสม
- ใช้ indexes สำหรับ queries ที่ใช้บ่อย
- Monitor slow queries

## 🚀 Production Deployment

### Development Setup
```bash
# สร้าง .env.docker จาก template
cp .env.docker.example .env.docker

# แก้ไขค่า database ใน .env.docker
# DB_PASSWORD=your_secure_password
# MYSQL_ROOT_PASSWORD=your_root_password

# Start services
docker-compose up -d
```

### Production Setup
```bash
# ใช้ docker-compose.production.yml
# แก้ไข .env.production

# Start services
docker-compose -f docker-compose.production.yml up -d

# รัน migrations
docker exec cslogbook-backend npm run migrate

# รัน seeders (ถ้าจำเป็น)
docker exec cslogbook-backend npm run seed:prod
```

## 📚 Related Documentation

- [Backend README](../backend/README.md) - ข้อมูลเกี่ยวกับ migrations และ seeders
- [Project Summary](../PROJECT_SUMMARY.md) - ภาพรวมระบบ
- [MySQL 8.0 Documentation](https://dev.mysql.com/doc/refman/8.0/en/)
- [Sequelize Documentation](https://sequelize.org/docs/v6/)