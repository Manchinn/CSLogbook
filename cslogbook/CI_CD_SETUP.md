# 🚀 CI/CD Setup Guide - Quick Start

คู่มือการตั้งค่า CI/CD สำหรับโปรเจค CSLogbook

## 📦 สิ่งที่ได้สร้างไว้แล้ว

✅ **GitHub Actions Workflows:**
- `ci.yml` - Continuous Integration (tests, lint, build)
- `docker-build.yml` - Build และ push Docker images
- `deploy.yml` - Deploy ไปยัง production/staging
- `database-migration.yml` - ตรวจสอบ database migrations

✅ **Documentation:**
- `.github/workflows/README.md` - เอกสารละเอียดเกี่ยวกับ workflows

## ⚡ Quick Start

### 1. เปิดใช้งาน GitHub Actions

GitHub Actions จะทำงานอัตโนมัติเมื่อคุณ push code ไปยัง repository

### 2. ตั้งค่า GitHub Secrets (สำหรับ Deployment)

ไปที่: **Repository Settings → Secrets and variables → Actions → New repository secret**

เพิ่ม secrets ต่อไปนี้:

| Secret Name | Description | Example |
|------------|-------------|---------|
| `SSH_PRIVATE_KEY` | SSH private key สำหรับเข้าถึง server | `-----BEGIN OPENSSH PRIVATE KEY-----...` |
| `SERVER_USER` | Username สำหรับ SSH | `ubuntu` |
| `SERVER_HOST` | Server IP หรือ domain | `119.59.102.136` |
| `SERVER_PATH` | Path ไปยัง project directory | `/var/www/cslogbook` |
| `BACKEND_HEALTH_URL` | URL สำหรับ health check (optional) | `http://119.59.102.136:5000/api/health` |
| `FRONTEND_URL` | Frontend URL (optional) | `http://119.59.102.136:3000` |
| `SLACK_WEBHOOK_URL` | Slack webhook สำหรับ notifications (optional) | `https://hooks.slack.com/...` |

### 3. สร้าง SSH Key สำหรับ Deployment

```bash
# สร้าง SSH key
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.github_actions_key

# Copy public key ไปยัง server
ssh-copy-id -i ~/.github_actions_key.pub user@your-server

# แสดง private key เพื่อ copy ไปเป็น GitHub Secret
cat ~/.github_actions_key
```

### 4. ทดสอบ Workflows

```bash
# สร้าง test branch
git checkout -b test/ci-setup

# Make a small change
echo "Test CI" >> README.md

# Commit และ push
git add .
git commit -m "test: verify CI workflows"
git push origin test/ci-setup

# สร้าง Pull Request
# GitHub Actions จะรัน workflows อัตโนมัติ
```

## 🔍 ตรวจสอบ Workflow Status

1. ไปที่ GitHub Repository
2. คลิกแท็บ **"Actions"**
3. ดู workflow runs และ logs

## 📋 Workflow Overview

### CI Workflow (`ci.yml`)
- ✅ รันทุกครั้งที่มี push หรือ pull request
- ✅ ทดสอบ backend และ frontend
- ✅ ตรวจสอบ code quality (linting)
- ✅ สร้าง build เพื่อตรวจสอบว่า build สำเร็จ

### Docker Build (`docker-build.yml`)
- ✅ Build Docker images สำหรับ backend และ frontend
- ✅ Push images ไปยัง GitHub Container Registry
- ✅ รองรับ multi-platform (amd64, arm64)

### Deployment (`deploy.yml`)
- ✅ Deploy อัตโนมัติเมื่อ push ไปยัง `main` หรือ `master`
- ✅ รองรับ manual trigger
- ✅ Health checks หลัง deployment
- ✅ Notifications (ถ้ามี Slack webhook)

### Migration Check (`database-migration.yml`)
- ✅ ตรวจสอบ migrations เมื่อมีการแก้ไข
- ✅ ทดสอบ migrations บน test database

## 🛠️ Customization

### แก้ไข Branch Names

ถ้าใช้ branch อื่นแทน `main` หรือ `master` แก้ไขใน workflow files:

```yaml
on:
  push:
    branches: [ main, master, develop ]  # แก้ไขตรงนี้
```

### ปิดการใช้งาน Deployment อัตโนมัติ

ถ้าไม่ต้องการ auto-deploy แก้ไข `deploy.yml`:

```yaml
on:
  workflow_dispatch:  # ใช้แค่ manual trigger
  # ลบ push triggers
```

### เพิ่ม Environment Variables

เพิ่ม environment variables ใน workflow:

```yaml
env:
  NEW_VAR: ${{ secrets.NEW_VAR }}
```

## 🚨 Troubleshooting

### CI Tests ล้มเหลว
- ตรวจสอบว่า test database connection ถูกต้อง
- ดู logs ใน GitHub Actions

### Docker Build ล้มเหลว
- ตรวจสอบ Dockerfile syntax
- ตรวจสอบ build context

### Deployment ล้มเหลว
- ตรวจสอบ SSH connection: `ssh user@server`
- ตรวจสอบว่า server มี Docker ติดตั้งแล้ว
- ตรวจสอบ server path

## 📚 เอกสารเพิ่มเติม

ดูเอกสารละเอียดได้ที่: `.github/workflows/README.md`

## ✅ Checklist

- [ ] GitHub Secrets ตั้งค่าเรียบร้อย
- [ ] SSH key setup เรียบร้อย
- [ ] ทดสอบ CI workflow (สร้าง PR)
- [ ] ทดสอบ Docker build
- [ ] ทดสอบ Deployment (ถ้าต้องการ)
- [ ] ตั้งค่า notifications (optional)

## 🎉 พร้อมใช้งาน!

เมื่อตั้งค่าเสร็จแล้ว CI/CD จะทำงานอัตโนมัติทุกครั้งที่:
- มี pull request
- Push code ไปยัง main/master
- Push version tags

---

**Questions?** ดูเอกสารเพิ่มเติมที่ `.github/workflows/README.md`

