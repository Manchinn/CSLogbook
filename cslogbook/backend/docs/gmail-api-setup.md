# คู่มือการตั้งค่า Gmail API สำหรับระบบ CSLogbook

## ภาพรวม
ระบบ CSLogbook ได้เปลี่ยนจากการใช้ SendGrid เป็น Gmail API เพื่อการส่งอีเมลแจ้งเตือนที่เสถียรและประหยัดค่าใช้จ่าย

## ขั้นตอนการตั้งค่า Gmail API

### 1. สร้าง Google Cloud Project
1. ไปที่ [Google Cloud Console](https://console.cloud.google.com/)
2. สร้าง Project ใหม่หรือเลือก Project ที่มีอยู่
3. เปิดใช้งาน Gmail API:
   - ไปที่ "APIs & Services" > "Library"
   - ค้นหา "Gmail API" และคลิก "Enable"

### 2. สร้าง OAuth 2.0 Credentials
1. ไปที่ "APIs & Services" > "Credentials"
2. คลิก "Create Credentials" > "OAuth client ID"
3. เลือก Application type: "Web application"
4. เพิ่ม Authorized redirect URIs:
   ```
   https://developers.google.com/oauthplayground
   ```
5. บันทึก Client ID และ Client Secret

### 3. ได้รับ Refresh Token
1. ไปที่ [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. คลิกไอคอน Settings (เฟือง) ที่มุมขวาบน
3. เช็ค "Use your own OAuth credentials"
4. ใส่ OAuth Client ID และ OAuth Client Secret ที่ได้จากขั้นตอนที่ 2
5. ใน Step 1: Select & authorize APIs
   - ใส่ scope: `https://www.googleapis.com/auth/gmail.send`
   - คลิก "Authorize APIs"
6. ใน Step 2: Exchange authorization code for tokens
   - คลิก "Exchange authorization code for tokens"
   - คัดลอก Refresh token

### 4. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.development` หรือแก้ไขไฟล์ที่มีอยู่:

```bash
# Email Configuration
EMAIL_PROVIDER=gmail
EMAIL_SENDER=your-gmail@gmail.com

# Gmail API Configuration
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
GMAIL_USER_EMAIL=your-gmail@gmail.com
```

### 5. ติดตั้ง Dependencies
```bash
npm install googleapis
```

## การทดสอบ
1. รันเซิร์ฟเวอร์: `npm run dev`
2. ทดสอบการส่งอีเมลผ่าน API endpoints ที่มีการแจ้งเตือน
3. ตรวจสอบ logs เพื่อดูว่าการส่งอีเมลสำเร็จหรือไม่

## การแก้ไขปัญหา

### ปัญหาที่พบบ่อย
1. **Invalid grant error**: Refresh token หมดอายุ - ต้องสร้างใหม่
2. **Insufficient permissions**: ตรวจสอบ scope ใน OAuth playground
3. **Rate limit exceeded**: Gmail API มี rate limit - ใช้ retry mechanism

### การตรวจสอบ logs
```bash
# ดู logs ของระบบ email
tail -f logs/combined.log | grep -i email
```

## Fallback Options
หากมีปัญหากับ Gmail API สามารถเปลี่ยนกลับไปใช้ SendGrid หรือ SMTP:

```bash
# SendGrid
EMAIL_PROVIDER=sendgrid

# SMTP
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Console (สำหรับ development)
EMAIL_PROVIDER=console
```

## Security Notes
- ไม่เก็บ credentials ใน code repository
- ใช้ environment variables เสมอ
- Refresh token ควรเก็บไว้อย่างปลอดภัย
- ตั้งค่า rate limiting ที่เหมาะสม

## การ Monitor
- ตรวจสอบ Gmail API quota ใน Google Cloud Console
- ติดตาม error logs สำหรับการส่งอีเมลที่ล้มเหลว
- ใช้ notification alerts สำหรับ critical email failures