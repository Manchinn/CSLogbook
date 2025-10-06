# แนวทางดูแลโค้ดและลดขนาด Bundle สำหรับ CSLogbook Frontend

> เอกสารนี้สรุปข้อควรระวังจากประสบการณ์แก้ไขการ build ล่าสุด พร้อมแนวปฏิบัติที่ช่วยให้การพัฒนาครั้งถัดไปคงคุณภาพ build และลดขนาด bundle ตามรายงานของ Create React App

## 1. วัตถุประสงค์
- รักษา build ให้ผ่านโดยไม่มี warning หรือ error จาก ESLint/CRA
- ป้องกันไม่ให้เกิดปัญหา import/hook เหมือนก่อนหน้า
- วางรากฐานสำหรับลดขนาดไฟล์ `main.*.js` (~1.35 MB) ด้วย code splitting และการวิเคราะห์ bundle

## 2. สภาพแวดล้อมและเครื่องมือแนะนำ
- Node.js 18 LTS (>= 18.19.x)
- npm 9.x (หรือใช้ `npm ci` บน CI เพื่อให้ dependency ตรงกับ lockfile)
- VS Code + ESLint extension (เช็ก warning ตั้งแต่ระหว่างพิมพ์)

คำสั่งพื้นฐานที่ควรรันก่อน commit:

```powershell
npm run lint
npm run test -- --watch=false
npm run build
```

> ถ้ายังไม่มี script `lint` ให้เพิ่มใน `package.json` ฝั่ง frontend เพื่อรัน ESLint แยกจาก build

## 3. เวิร์กโฟลว์ตรวจสอบก่อนส่งงาน
1. **ติดตั้ง dependencies** ด้วย `npm install` (หรือ `npm ci` บน CI)
2. **รัน Lint** – จับ `no-unused-vars`, `import/no-anonymous-default-export`, `react-hooks/exhaustive-deps`
3. **รัน Test** – ถ้ามีการเปลี่ยน logic หรือ service
4. **รัน Build** – `npm run build` ต้องขึ้น `Compiled successfully.`
5. **ตรวจดู warning** ใน terminal และแก้ก่อน push ทุกครั้ง

## 4. แนวทางเขียนโค้ดที่ควรยึด

### 4.1 การจัดการ Import / Export
- นำเข้าเฉพาะสิ่งที่ใช้จริง หากไม่ใช้ให้ลบทิ้งทันที
- Default export ของ utility/constant ควรประกาศตัวแปรก่อน เช่น:
  ```javascript
  const dateUtils = { /* ... */ };
  export default dateUtils;
  ```
  เพื่อตอบโจทย์ rule `import/no-anonymous-default-export`
- สำหรับตัวแปรสำรองที่ยังไม่ใช้ให้ตั้งชื่อขึ้นต้น `_` (config ESLint ให้ยกเว้น `_`)

### 4.2 React Hooks และฟังก์ชัน
- `useEffect` / `useCallback` / `useMemo` ต้องมี dependency ครบถ้วนเสมอ
- ฟังก์ชันที่สร้างใน component แล้วถูก pass ลงไป (เช่น `loadDocuments`) ควรห่อด้วย `useCallback` เพื่อไม่ให้ effect ทำงานซ้ำไม่จำเป็น
- หาก hook คืนค่ามากเกินความจำเป็น ให้ลดเฉพาะสิ่งที่ใช้งานจริง เพื่อลด unused state

### 4.3 การเขียนเทมเพลต PDF และ Utility
- ในไฟล์เทมเพลต (`src/components/internship/templates/**`) ให้ import utility เท่าที่ใช้จริงเท่านั้น
- คอมเมนต์ไทยอธิบาย logic ซับซ้อนตามกติกาใน `.github/instructions`
- หากต้องการ helper ใหม่ ให้ประกาศใน `src/utils/**` แล้ว export ให้ชัดเจน

## 5. แนวทางลดขนาด Bundle

### 5.1 วิเคราะห์ก่อนปรับ
1. ติดตั้ง `source-map-explorer`
2. เปรียบเทียบขนาดไฟล์หลัง build

```powershell
cd cslogbook/frontend
npm install --save-dev source-map-explorer
npm run build
npx source-map-explorer "build/static/js/*.js"
```

> ใช้รายงานนี้ระบุว่า dependency ใดกินพื้นที่มากที่สุด (เช่น Ant Design, @react-pdf/renderer)

### 5.2 Code Splitting / Lazy Loading
- เปลี่ยนเส้นทาง router ให้นำเข้าแบบ dynamic:
  ```javascript
  const AdminSettings = React.lazy(() => import('../components/admin/settings'));
  ```
- ใช้ `React.Suspense` ครอบ เพื่อแสดง fallback ขณะโหลด
- แยกหน้า/โมดูลที่ไม่จำเป็นต้องโหลดพร้อมกัน เช่น หน้าบริหาร (admin) หรือเทมเพลต PDF

### 5.3 ลดน้ำหนัก Ant Design และ Icon
- นำเข้า component เป็นรายตัว เช่น `import Button from 'antd/es/button';`
- ตรวจสอบว่ามี icon หรือ component ไหนไม่ได้ใช้ แล้วลบออก

### 5.4 แยกข้อมูล/ไฟล์ใหญ่
- Mock data หรือเนื้อหาเอกสารยาวให้เก็บเป็น JSON และโหลดเมื่อกดดูจริง
- รูป/ฟอนต์ ที่ไม่จำเป็นทุกหน้าให้ lazy load หรือใช้ CDN

### 5.5 เครื่องมือช่วยอื่นๆ
- ใช้ `webpack-bundle-analyzer` ชั่วคราวเพื่อดู heatmap ของ bundle:
  ```powershell
  npm install --save-dev webpack-bundle-analyzer
  npm run build -- --profile --stats=stats.json
  npx webpack-bundle-analyzer stats.json
  ```
- ถ้าต้องการปรับ splitChunks ลึกกว่านี้ อาจใช้ `craco` หรือ `react-app-rewired` แทนการ eject

## 6. Checklist ก่อน Merge
- [ ] ไม่มี ESLint warning/ error เมื่อรัน `npm run lint`
- [ ] `npm run build` สำเร็จและไม่มี warning
- [ ] Command วิเคราะห์ bundle ถูกบันทึกผลไว้ (เช่น capture ภาพหรือสรุปใน PR)
- [ ] อัปเดต README/เอกสารถ้ามีการเพิ่ม command หรือ dependency ใหม่

---
> เอกสารนี้ควรอยู่ใกล้กับโค้ด (เช่นโฟลเดอร์ `knowledge/`) และอัปเดตทุกครั้งที่มีการเปลี่ยนกติกา build หรือ dependency สำคัญ เพื่อให้ทีมเห็นภาพรวมเหมือนกันครับ
