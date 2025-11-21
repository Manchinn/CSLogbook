# CI/CD Workflows Documentation

เอกสารนี้อธิบายเกี่ยวกับ GitHub Actions workflows ที่ใช้ในโปรเจค CSLogbook

## 📋 Overview

โปรเจคนี้ใช้ GitHub Actions สำหรับ Continuous Integration และ Continuous Deployment (CI/CD) โดยมี workflows หลักดังนี้:

## 🔄 Workflows

### 1. CI - Continuous Integration (`ci.yml`)

**Trigger:** 
- Push ไปยัง branches: `main`, `master`, `develop`
- Pull requests ไปยัง branches: `main`, `master`, `develop`

**Jobs:**
- **Backend Tests**: รัน unit tests และ coverage reports
- **Backend Lint**: ตรวจสอบ code quality และ database models
- **Frontend Tests**: รัน React tests และ coverage
- **Frontend Lint**: ตรวจสอบ ESLint
- **Frontend Build**: สร้าง production build เพื่อตรวจสอบว่า build สำเร็จ
- **Backend Build**: ตรวจสอบว่า backend build สำเร็จ

**Output:**
- Test coverage reports (upload ไปยัง Codecov)
- Build artifacts (frontend build files)

### 2. Docker Build & Push (`docker-build.yml`)

**Trigger:**
- Push ไปยัง `main` หรือ `master`
- Push tags ที่ขึ้นต้นด้วย `v*` (เช่น `v1.0.0`)
- Pull requests ไปยัง `main` หรือ `master`

**Jobs:**
- **Build Backend Docker Image**: สร้าง Docker image สำหรับ backend
- **Build Frontend Docker Image**: สร้าง Docker image สำหรับ frontend
- **Docker Compose Test**: ตรวจสอบว่า docker-compose configuration ถูกต้อง

**Features:**
- Multi-platform builds (linux/amd64, linux/arm64)
- Docker layer caching ด้วย GitHub Actions cache
- Auto-tagging ตาม branch, PR, version tags
- Push images ไปยัง GitHub Container Registry (ghcr.io)

**Image Tags:**
- `latest` - สำหรับ default branch
- `main-<sha>` - สำหรับ commits บน main branch
- `v1.0.0` - สำหรับ version tags
- `pr-<number>` - สำหรับ pull requests

### 3. Deploy to Production (`deploy.yml`)

**Trigger:**
- Push ไปยัง `main` หรือ `master`
- Push version tags (`v*`)
- Manual trigger (workflow_dispatch)

**Jobs:**
- **Deploy**: Deploy ไปยัง production หรือ staging server

**Requirements (GitHub Secrets):**
- `SSH_PRIVATE_KEY`: SSH private key สำหรับเข้าถึง server
- `SERVER_USER`: Username สำหรับ SSH
- `SERVER_HOST`: Server hostname หรือ IP
- `SERVER_PATH`: Path ไปยัง project directory บน server
- `BACKEND_HEALTH_URL`: URL สำหรับ backend health check (optional)
- `FRONTEND_URL`: URL สำหรับ frontend (optional)
- `SLACK_WEBHOOK_URL`: Webhook URL สำหรับ notifications (optional)

**Deployment Process:**
1. SSH เข้าไปยัง server
2. Pull latest code จาก Git
3. Build และ start Docker containers
4. Run database migrations
5. Perform health checks
6. Send notification (ถ้ามี Slack webhook)

### 4. Database Migration Check (`database-migration.yml`)

**Trigger:**
- Pull requests ที่แก้ไข migrations หรือ models
- Manual trigger

**Jobs:**
- **Check Migrations**: ตรวจสอบว่า migrations ทำงานได้ถูกต้อง

**Checks:**
- Migration status
- Run migrations บน test database
- Verify database models
- Check for duplicate migration files

## 🔧 Setup Instructions

### 1. Enable GitHub Actions

GitHub Actions จะทำงานอัตโนมัติเมื่อมี workflows ใน `.github/workflows/` directory

### 2. Configure Secrets

สำหรับ deployment workflow ต้องตั้งค่า GitHub Secrets:

1. ไปที่ Repository Settings → Secrets and variables → Actions
2. เพิ่ม secrets ต่อไปนี้:

```
SSH_PRIVATE_KEY          # SSH private key สำหรับ server access
SERVER_USER              # เช่น: ubuntu, root, deploy
SERVER_HOST              # เช่น: 119.59.102.136 หรือ your-domain.com
SERVER_PATH              # เช่น: /var/www/cslogbook หรือ /home/user/cslogbook
BACKEND_HEALTH_URL       # เช่น: http://119.59.102.136:5000/api/health
FRONTEND_URL             # เช่น: http://119.59.102.136:3000
SLACK_WEBHOOK_URL        # (optional) สำหรับ notifications
REACT_APP_API_URL        # (optional) สำหรับ frontend build
REACT_APP_UPLOAD_URL     # (optional) สำหรับ frontend build
```

### 3. Setup SSH Key

สร้าง SSH key pair และเพิ่ม public key ไปยัง server:

```bash
# สร้าง SSH key
ssh-keygen -t ed25519 -C "github-actions" -f ~/.github_actions_key

# Copy public key ไปยัง server
ssh-copy-id -i ~/.github_actions_key.pub user@your-server

# เพิ่ม private key เป็น GitHub Secret
cat ~/.github_actions_key
# Copy output และ paste เป็น SSH_PRIVATE_KEY secret
```

### 4. Setup Codecov (Optional)

สำหรับ code coverage reports:

1. ไปที่ [codecov.io](https://codecov.io)
2. Sign in ด้วย GitHub
3. Add repository
4. Copy token และเพิ่มเป็น `CODECOV_TOKEN` secret (ถ้าจำเป็น)

### 5. Test Workflows

ทดสอบ workflows โดย:

```bash
# สร้าง test branch
git checkout -b test/ci-workflow

# Make a small change
echo "# Test" >> README.md

# Commit และ push
git add .
git commit -m "test: CI workflow"
git push origin test/ci-workflow

# สร้าง Pull Request
# GitHub Actions จะรัน workflows อัตโนมัติ
```

## 📊 Monitoring

### View Workflow Runs

1. ไปที่ GitHub Repository
2. คลิก "Actions" tab
3. ดู workflow runs และ logs

### Workflow Status Badge

เพิ่ม badge ใน README.md:

```markdown
![CI](https://github.com/your-org/cslogbook/workflows/CI%20-%20Continuous%20Integration/badge.svg)
![Docker Build](https://github.com/your-org/cslogbook/workflows/Docker%20Build%20%26%20Push/badge.svg)
```

## 🚨 Troubleshooting

### CI Tests Fail

- ตรวจสอบว่า test database connection ถูกต้อง
- ตรวจสอบ environment variables ใน workflow file
- ดู logs ใน GitHub Actions

### Docker Build Fails

- ตรวจสอบว่า Dockerfile syntax ถูกต้อง
- ตรวจสอบว่า build context ถูกต้อง
- ดู build logs สำหรับ errors

### Deployment Fails

- ตรวจสอบ SSH connection: `ssh -i ~/.github_actions_key user@server`
- ตรวจสอบว่า server มี Docker และ Docker Compose ติดตั้งแล้ว
- ตรวจสอบว่า server path ถูกต้อง
- ดู deployment logs ใน GitHub Actions

### Migration Check Fails

- ตรวจสอบว่า migration files syntax ถูกต้อง
- ตรวจสอบว่า test database ถูกสร้างแล้ว
- ตรวจสอบว่า models ตรงกับ database schema

## 🔐 Security Best Practices

1. **Never commit secrets**: ใช้ GitHub Secrets เสมอ
2. **Use SSH keys**: ใช้ SSH keys แทน passwords
3. **Limit permissions**: ใช้ least privilege principle
4. **Review workflows**: ตรวจสอบ workflows ก่อน merge
5. **Use environment protection**: ตั้งค่า environment protection rules สำหรับ production

## 📝 Customization

### Modify Test Commands

แก้ไขใน `.github/workflows/ci.yml`:

```yaml
- name: Run backend tests
  run: npm run test:cov  # แก้ไข command ตรงนี้
```

### Add New Jobs

เพิ่ม job ใหม่ใน workflow file:

```yaml
jobs:
  new-job:
    name: New Job Name
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      # ... more steps
```

### Change Deployment Strategy

แก้ไข `.github/workflows/deploy.yml` ตาม deployment strategy ที่ต้องการ

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Codecov Action](https://github.com/codecov/codecov-action)

## 🤝 Contributing

เมื่อเพิ่ม workflows ใหม่:

1. ตรวจสอบว่า workflow syntax ถูกต้อง
2. ทดสอบบน test branch ก่อน
3. อัปเดต documentation นี้
4. แจ้งทีมเกี่ยวกับ changes

---

**Last Updated**: 2024
**Maintained By**: CSLogbook Development Team

