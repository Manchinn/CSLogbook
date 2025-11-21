# 🔧 CSS Module Test Fix

## ปัญหา

Jest ไม่สามารถ resolve CSS module files:
```
Could not locate module ./LoginForm.module.css mapped as: identity-obj-proxy
Could not locate module ./Summary.module.css mapped as: identity-obj-proxy
Could not locate module ./Sidebar.module.css mapped as: identity-obj-proxy
```

## สาเหตุ

1. `identity-obj-proxy` อาจไม่ได้ติดตั้งใน devDependencies
2. หรือ Jest ไม่สามารถ resolve path ได้

## การแก้ไข

### 1. สร้าง Custom CSS Module Mock

สร้างไฟล์ `frontend/src/__mocks__/cssModuleMock.js`:
```javascript
// Mock สำหรับ CSS modules - return object ที่มี properties เหมือน CSS class names
module.exports = new Proxy({}, {
  get: function(target, name) {
    return name;
  }
});
```

### 2. อัปเดต Jest Configuration

เปลี่ยนจาก:
```json
"^.+\\.module\\.(css|sass|scss)$": "identity-obj-proxy"
```

เป็น:
```json
"^.+\\.module\\.(css|sass|scss)$": "<rootDir>/src/__mocks__/cssModuleMock.js"
```

## ไฟล์ที่แก้ไข

1. ✅ `frontend/src/__mocks__/cssModuleMock.js` - สร้างใหม่
2. ✅ `frontend/package.json` - อัปเดต moduleNameMapper

## วิธีทดสอบ

```bash
cd frontend
npm test -- --watchAll=false
```

## หมายเหตุ

- Custom mock จะ return class name เป็น string (เช่น `styles.container` → `"container"`)
- วิธีนี้ไม่ต้องติดตั้ง `identity-obj-proxy` เพิ่มเติม
- ทำงานได้ดีกับ tests ที่ไม่ต้องตรวจสอบ CSS classes จริงๆ

