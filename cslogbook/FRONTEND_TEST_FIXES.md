# 🔧 Frontend Test Fixes

เอกสารนี้อธิบายการแก้ไขที่ทำเพื่อให้ frontend tests ทำงานได้

## 🐛 ปัญหาที่พบและแก้ไข

### 1. **AuthContext Environment Variable Error**

**ปัญหา:** `AuthContext.js` throw error เมื่อไม่มี `REACT_APP_API_URL` ใน test environment

**แก้ไข:**
- แก้ไข `frontend/src/contexts/AuthContext.js`
- เพิ่มการตรวจสอบ test environment และใช้ค่า default แทนการ throw error

```javascript
// ก่อน
if (!process.env.REACT_APP_API_URL) {
  throw new Error('REACT_APP_API_URL is not defined');
}

// หลัง
if (!process.env.REACT_APP_API_URL) {
  if (process.env.NODE_ENV === 'test' || process.env.CI) {
    process.env.REACT_APP_API_URL = 'http://localhost:5000/api';
  } else {
    throw new Error('REACT_APP_API_URL is not defined');
  }
}
```

### 2. **Setup Tests Missing Environment Variables**

**ปัญหา:** `setupTests.js` ไม่ได้ import `setupEnvTest.js` เพื่อตั้งค่า environment variables

**แก้ไข:**
- แก้ไข `frontend/src/setupTests.js`
- เพิ่มการ import `setupEnvTest` เพื่อตั้งค่า environment variables

```javascript
import '@testing-library/jest-dom';
import './setupEnvTest'; // เพิ่มบรรทัดนี้
```

### 3. **PDF TemplateDataService Test Coverage**

**ปัญหา:** Test file มี test cases น้อยเกินไป

**แก้ไข:**
- ปรับปรุง `frontend/src/services/PDFServices/__tests__/TemplateDataService.cs05.test.js`
- เพิ่ม test cases:
  - รองรับ studentData เป็น array หลายคน
  - รองรับข้อมูลบางส่วนหาย (ใช้ค่า default)
  - ตรวจสอบ error handling ที่ดีขึ้น

---

## ✅ ไฟล์ที่แก้ไข

1. **`frontend/src/contexts/AuthContext.js`**
   - แก้ไข environment variable check ให้ไม่ throw error ใน test environment

2. **`frontend/src/setupTests.js`**
   - เพิ่มการ import `setupEnvTest` เพื่อตั้งค่า environment variables

3. **`frontend/src/services/PDFServices/__tests__/TemplateDataService.cs05.test.js`**
   - เพิ่ม test cases เพิ่มเติม
   - ปรับปรุง assertions ให้ครอบคลุมมากขึ้น

---

## 🧪 วิธีทดสอบ

### ทดสอบ Locally:

```bash
cd frontend
npm test -- --coverage --watchAll=false
```

### ทดสอบเฉพาะไฟล์:

```bash
# Test TemplateDataService
npm test -- TemplateDataService.cs05.test.js

# Test AuthContext
npm test -- AuthContext

# Test Sidebar
npm test -- Sidebar.role.test.js

# Test LoginForm
npm test -- LoginForm.test.js
```

---

## 📋 Checklist

- [x] แก้ไข AuthContext environment variable check
- [x] เพิ่ม setupEnvTest import ใน setupTests.js
- [x] ปรับปรุง TemplateDataService test cases
- [ ] ทดสอบว่า tests ผ่านทั้งหมด
- [ ] ตรวจสอบ coverage reports

---

## 🔍 Troubleshooting

### Tests ยัง fail อยู่?

1. **ตรวจสอบ environment variables:**
   ```bash
   echo $REACT_APP_API_URL
   ```

2. **ตรวจสอบว่า setupEnvTest.js ถูก import:**
   - ดูใน `setupTests.js`
   - ตรวจสอบว่าไฟล์ `setupEnvTest.js` มีอยู่

3. **ตรวจสอบ mocks:**
   - ดูว่า `__mocks__/apiClient.js` มีอยู่
   - ตรวจสอบว่า mocks ถูกต้อง

4. **Clear cache และรันใหม่:**
   ```bash
   npm test -- --clearCache
   npm test
   ```

---

## 📝 หมายเหตุ

- **Environment Variables:** ใน test environment จะใช้ค่า default `http://localhost:5000/api`
- **Mocks:** ต้องมี `__mocks__/apiClient.js` สำหรับ mock API calls
- **Context Providers:** Tests ใช้ `renderWithProviders` helper เพื่อ wrap components ด้วย providers

---

**Last Updated:** 2024

