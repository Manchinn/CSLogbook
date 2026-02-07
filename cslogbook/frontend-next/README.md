# CSLogbook Frontend (Next.js + TypeScript)

โปรเจกต์นี้เป็นจุดเริ่มต้นของ frontend ใหม่สำหรับระบบ CSLogbook โดยใช้
**Next.js (App Router)** และ **TypeScript**

## เริ่มต้นใช้งาน

```bash
npm install
npm run dev
```

จากนั้นเปิด `http://localhost:3000`

## Scripts หลัก

```bash
npm run dev     # รันโหมดพัฒนา
npm run lint    # ตรวจ lint
npm run build   # build สำหรับ production
npm run start   # รัน production server หลัง build
```

## โครงสร้างหลัก

- `src/app/layout.tsx` – layout และ metadata หลัก
- `src/app/page.tsx` – หน้าเริ่มต้น
- `src/app/globals.css` – global styles

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- ESLint (eslint-config-next)
