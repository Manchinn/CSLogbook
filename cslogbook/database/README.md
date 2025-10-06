# Database Management Guide

## การจัดการ Database MySQL ใน Docker

### 1. โครงสร้างไฟล์

```
database/
├── init/                    # ไฟล์ SQL ที่จะรันอัตโนมัติเมื่อสร้าง container ใหม่
│   ├── 01-schema.sql       # Schema และตารางพื้นฐาน
│   └── 02-data.sql         # ข้อมูลเริ่มต้น
└── README.md               # คู่มือนี้
```

### 2. การทำงานของ Database ใน Docker

#### MySQL Container จะ:
- สร้าง database ตามชื่อที่กำหนดใน `MYSQL_DATABASE`
- รันไฟล์ SQL ทั้งหมดใน `/docker-entrypoint-initdb.d/` เรียงตามชื่อไฟล์
- เก็บข้อมูลใน Docker volume `mysql-data`

#### ลำดับการทำงาน:
1. สร้าง database และ user ตาม environment variables
2. รัน `01-schema.sql` (สร้างตาราง)
3. รัน `02-data.sql` (เพิ่มข้อมูลเริ่มต้น)
4. รันไฟล์ SQL อื่นๆ ตามลำดับชื่อไฟล์

### 3. การใช้ SQL Dump ของโครงงานพิเศษ

#### วิธีที่ 1: แทนที่ไฟล์ init
```bash
# วางไฟล์ dump ของคุณใน database/init/
cp your-project-dump.sql database/init/01-schema.sql
```

#### วิธีที่ 2: เพิ่มไฟล์ dump ใหม่
```bash
# วางไฟล์ dump ใน database/init/ โดยใช้ชื่อที่เรียงลำดับได้
cp your-project-dump.sql database/init/03-project-schema.sql
```

### 4. การ Deploy ใน Production

#### Environment Variables ที่สำคัญ:
```env
# Database Configuration
DB_HOST=mysql                    # ชื่อ service ใน docker-compose
DB_PORT=3306                     # port ภายใน container
DB_NAME=cslogbook               # ชื่อ database
DB_USER=cslogbook               # username
DB_PASSWORD=your_secure_password # password ที่ปลอดภัย
MYSQL_ROOT_PASSWORD=root_password # root password
MYSQL_PORT=3307                  # port ที่เปิดออกมาจาก host
```

#### การ Backup และ Restore:
```bash
# Backup
docker exec cslogbook-mysql mysqldump -u root -p cslogbook > backup.sql

# Restore
docker exec -i cslogbook-mysql mysql -u root -p cslogbook < backup.sql
```

### 5. การ Debug Database

#### เข้าถึง MySQL CLI:
```bash
# เข้า container
docker exec -it cslogbook-mysql bash

# เชื่อมต่อ MySQL
mysql -u root -p

# หรือเชื่อมต่อจากภายนอก
mysql -h 127.0.0.1 -P 3307 -u cslogbook -p
```

#### ตรวจสอบสถานะ:
```bash
# ดู logs ของ MySQL
docker logs cslogbook-mysql

# ตรวจสอบ health check
docker ps
```

### 6. การใช้งานกับ Backend

Backend จะ:
- รอให้ MySQL พร้อมใช้งานผ่าน `healthcheck`
- เชื่อมต่อผ่าน Sequelize ORM
- รัน migrations อัตโนมัติ (ถ้าตั้งค่าไว้)

#### การรัน Migrations:
```bash
# เข้า backend container
docker exec -it cslogbook-backend bash

# รัน migrations
npm run migrate

# รัน seeders
npm run seed
```

### 7. ข้อควรระวัง

1. **ไฟล์ init จะรันเฉพาะครั้งแรกเท่านั้น** - หาก volume มีข้อมูลอยู่แล้ว จะไม่รันใหม่
2. **การลบ volume** - `docker-compose down -v` จะลบข้อมูลทั้งหมด
3. **การ backup** - ควร backup ข้อมูลสำคัญก่อน deploy production
4. **Security** - เปลี่ยน password default ใน production

### 8. Production Deployment

```bash
# สร้าง .env.docker จาก template
cp .env.docker.example .env.docker

# แก้ไขค่า database ใน .env.docker
# DB_PASSWORD=your_secure_password
# MYSQL_ROOT_PASSWORD=your_root_password

# Deploy
docker-compose up -d
```