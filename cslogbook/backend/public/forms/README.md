# Forms Directory

เก็บแบบฟอร์ม PDF สาธารณะ (ไม่ต้อง auth) ที่ให้นักศึกษาดาวน์โหลดได้

## ไฟล์ที่ต้องวางในโฟลเดอร์นี้

| ชื่อไฟล์ | คำอธิบาย | Endpoint |
|---|---|---|
| `acceptance-letter-template.pdf` | **แบบฟอร์มหนังสือตอบรับ** (acceptance letter template) | `GET /api/internship/acceptance-letter-template` |

## หมายเหตุ

- วางไฟล์ PDF จริงชื่อ `acceptance-letter-template.pdf` ในโฟลเดอร์นี้ก่อนใช้งาน
- ถ้ายังไม่มีไฟล์ endpoint จะ return 404 พร้อม message "ไม่พบไฟล์แบบฟอร์มหนังสือตอบรับ กรุณาติดต่อเจ้าหน้าที่"
- ไฟล์ใน `public/` ถูก serve ผ่าน Express static middleware และ custom route
