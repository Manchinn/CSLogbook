# 🌊 Digital Ocean + Docker Compose Deployment Guide

## 📋 ขั้นตอนการ Deploy CSLogbook บน Digital Ocean

### 1. 🖥️ สร้าง Digital Ocean Droplet

#### เลือก Droplet Configuration:
- **OS**: Ubuntu 22.04 LTS
- **Size**: Basic Plan
  - **Minimum**: 2GB RAM, 1 vCPU, 50GB SSD ($12/month)
  - **Recommended**: 4GB RAM, 2 vCPU, 80GB SSD ($24/month)
- **Region**: Singapore (ใกล้ที่สุดกับไทย)
- **Authentication**: SSH Key (แนะนำ) หรือ Password

#### เพิ่ม SSH Key (แนะนำ):
```bash
# สร้าง SSH key บนเครื่องของคุณ
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# คัดลอก public key
cat ~/.ssh/id_rsa.pub
```

### 2. 🔧 เตรียม Server (ครั้งแรก)

#### เชื่อมต่อ Server:
```bash
ssh root@YOUR_DROPLET_IP
```

#### รัน Setup Script:
```bash
# Download และรัน setup script
curl -fsSL https://raw.githubusercontent.com/your-repo/cslogbook/main/scripts/setup-ubuntu-server.sh | bash

# หรือ manual setup:
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git nginx certbot python3-certbot-nginx
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

#### สร้าง User ใหม่ (แนะนำ):
```bash
# สร้าง user สำหรับ deploy
sudo adduser cslogbook
sudo usermod -aG docker cslogbook
sudo usermod -aG sudo cslogbook

# เปลี่ยนไปใช้ user ใหม่
su - cslogbook
```

### 3. 📦 Deploy Application

#### Clone Repository:
```bash
cd /home/cslogbook
git clone https://github.com/your-username/cslogbook.git
cd cslogbook
```

#### แก้ไข Environment Variables:
```bash
# คัดลอกไฟล์ตัวอย่าง
cp .env.production.example .env.production

# แก้ไขค่าต่างๆ
nano .env.production
```

**ค่าที่ต้องแก้ไขใน .env.production:**
```bash
# เปลี่ยน YOUR_DROPLET_IP เป็น IP จริง
BASE_URL=http://YOUR_DROPLET_IP:5000
FRONTEND_URL=http://YOUR_DROPLET_IP:3000
REACT_APP_API_URL=http://YOUR_DROPLET_IP:5000/api
REACT_APP_UPLOAD_URL=http://YOUR_DROPLET_IP:5000/uploads

# ตั้งรหัสผ่านที่ปลอดภัย
DB_PASSWORD=YourSecurePassword123!
MYSQL_ROOT_PASSWORD=YourRootPassword456!

# ตั้ง JWT Secret ที่แข็งแกร่ง (64+ characters)
JWT_SECRET=your-very-long-and-secure-jwt-secret-key-here-at-least-64-characters

# SendGrid (ถ้าต้องการใช้อีเมล)
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here
EMAIL_SENDER=no-reply@yourdomain.com
```

#### รัน Docker Compose:
```bash
# Build และรัน
docker-compose -f docker-compose.production.yml up -d

# ตรวจสอบสถานะ
docker-compose -f docker-compose.production.yml ps

# ดู logs
docker-compose -f docker-compose.production.yml logs -f
```

### 4. 🔒 ตั้งค่า Firewall

```bash
# เปิด ports ที่จำเป็น
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000  # Frontend
sudo ufw allow 5000  # Backend
sudo ufw enable
```

### 5. 🌐 ตั้งค่า Domain และ SSL (Optional)

#### ถ้ามี Domain Name:
```bash
# ตั้งค่า Nginx reverse proxy
sudo nano /etc/nginx/sites-available/cslogbook

# เพิ่มการตั้งค่า:
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# เปิดใช้งาน site
sudo ln -s /etc/nginx/sites-available/cslogbook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# ติดตั้ง SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 6. 📊 คำสั่งจัดการระบบ

#### ตรวจสอบสถานะ:
```bash
# ดู containers ที่รันอยู่
docker ps

# ดู logs
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend
docker-compose -f docker-compose.production.yml logs mysql

# ตรวจสอบ resource usage
docker stats

# ตรวจสอบ disk space
df -h
docker system df
```

#### Restart Services:
```bash
# Restart ทั้งหมด
docker-compose -f docker-compose.production.yml restart

# Restart แต่ละ service
docker-compose -f docker-compose.production.yml restart backend
docker-compose -f docker-compose.production.yml restart frontend
```

#### อัปเดตแอปพลิเคชัน:
```bash
# Pull code ใหม่
git pull origin main

# Rebuild และ restart
docker-compose -f docker-compose.production.yml down
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d
```

### 7. 🔄 Backup และ Restore

#### Backup Database:
```bash
# ใช้ script ที่มีอยู่
./scripts/backup-database.sh

# หรือ manual
docker exec cslogbook-mysql mysqldump -u root -p cslogbook_prod > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Backup Files:
```bash
# Backup uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz -C backend uploads/

# Backup ทั้งโปรเจค
tar -czf cslogbook_backup_$(date +%Y%m%d).tar.gz cslogbook/
```

### 8. 🚨 Troubleshooting

#### ปัญหาที่พบบ่อย:

**1. Container ไม่สามารถเชื่อมต่อฐานข้อมูล:**
```bash
# ตรวจสอบ MySQL container
docker logs cslogbook-mysql

# ตรวจสอบ network
docker network ls
docker network inspect cslogbook_default
```

**2. Frontend ไม่สามารถเรียก API:**
```bash
# ตรวจสอบ environment variables
docker exec cslogbook-frontend env | grep REACT_APP

# Rebuild frontend ใหม่
docker-compose -f docker-compose.production.yml build --no-cache frontend
```

**3. Out of Memory:**
```bash
# เพิ่ม swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 9. 📈 Monitoring (Optional)

#### ติดตั้ง monitoring tools:
```bash
# Install htop, iotop
sudo apt install htop iotop

# Setup log rotation
sudo nano /etc/logrotate.d/docker-containers
```

### 10. 🔐 Security Best Practices

1. **เปลี่ยนรหัสผ่าน default ทั้งหมด**
2. **ใช้ SSH Key แทน password**
3. **ตั้งค่า fail2ban**
4. **อัปเดตระบบเป็นประจำ**
5. **ใช้ SSL certificate**
6. **Backup ข้อมูลเป็นประจำ**

---

## 🎯 Quick Start Commands

```bash
# 1. เชื่อมต่อ server
ssh root@YOUR_DROPLET_IP

# 2. Clone และ setup
git clone https://github.com/your-repo/cslogbook.git
cd cslogbook
cp .env.production.example .env.production
nano .env.production  # แก้ไข IP และรหัสผ่าน

# 3. รัน application
docker-compose -f docker-compose.production.yml up -d

# 4. ตรวจสอบ
docker-compose -f docker-compose.production.yml ps
curl http://YOUR_DROPLET_IP:3000
curl http://YOUR_DROPLET_IP:5000/api/health
```

**🌟 เสร็จแล้ว! แอปพลิเคชันของคุณพร้อมใช้งานแล้ว**

- **Frontend**: `http://YOUR_DROPLET_IP:3000`
- **Backend API**: `http://YOUR_DROPLET_IP:5000/api`
- **Admin Panel**: `http://YOUR_DROPLET_IP:3000/admin`