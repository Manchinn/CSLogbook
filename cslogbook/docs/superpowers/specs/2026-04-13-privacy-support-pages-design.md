# Design Spec: Privacy Policy + Support Pages

**Date:** 2026-04-13
**Purpose:** สร้างหน้า public สำหรับ KMUTNB SSO approval — Privacy Policy และ Support/ติดต่อผู้ดูแล

---

## 1. Routes

| Route | File | Type |
|-------|------|------|
| `/privacy-policy` | `src/app/privacy-policy/page.tsx` + `page.module.css` | Public |
| `/support` | `src/app/support/page.tsx` + `page.module.css` | Public |

อยู่นอก `(app)` และ `(auth)` route groups — เข้าถึงได้โดยไม่ต้อง login

## 2. Visual Design

ใช้ pattern เดียวกับ `not-found.tsx`:

- Background: gradient blobs (reuse จาก login/not-found)
- Card: centered, max-width ~720px, white background, rounded corners, shadow
- Header: CSLogbookLogo + page title
- Content: sections แบ่งด้วย heading + paragraphs
- Footer: cross-links ระหว่างสองหน้า + link กลับ login
- CSS: ใช้ design tokens จาก `globals.css` (--color-primary, --color-text, --color-text-muted, etc.)
- Responsive: single column, padding ปรับตาม viewport

## 3. Privacy Policy Page (`/privacy-policy`)

### Sections

#### 3.1 ข้อมูลที่เก็บรวบรวม
ข้อมูลที่ได้รับผ่าน SSO KMUTNB:
- ชื่อ-นามสกุล (ภาษาไทยและอังกฤษ)
- อีเมล (@kmutnb.ac.th / @sci.kmutnb.ac.th)
- รหัสนักศึกษาหรือรหัสบุคลากร
- ภาควิชา / สาขาวิชา / ตำแหน่ง
- ประเภทบัญชี (นักศึกษา / บุคลากร)

ข้อมูลที่เกิดจากการใช้งานระบบ:
- บันทึกการเข้าสู่ระบบ (วันเวลา, IP address)
- ข้อมูลการฝึกงาน, โครงงานพิเศษ, ปริญญานิพนธ์
- เอกสารที่อัปโหลด (PDF)
- บันทึก Logbook

#### 3.2 วัตถุประสงค์
- ยืนยันตัวตนผู้ใช้งาน
- จัดการ workflow ฝึกงาน / โครงงานพิเศษ / ปริญญานิพนธ์
- ติดตามความคืบหน้าของนักศึกษา
- แจ้งเตือนกำหนดส่งและสถานะเอกสาร
- ออกเอกสารทางวิชาการ (หนังสือขอความอนุเคราะห์, หนังสือส่งตัว ฯลฯ)

#### 3.3 ขอบเขตการเข้าถึงข้อมูลจาก SSO (Scopes)

| Scope | เหตุผล |
|-------|--------|
| `openid` | ยืนยันตัวตนผ่าน OpenID Connect |
| `profile` | ดึงชื่อ-นามสกุลสำหรับแสดงในระบบ |
| `email` | สำหรับส่งการแจ้งเตือนและติดต่อ |
| `student_info` | ดึงรหัสนักศึกษา, สาขาวิชา เพื่อ match กับข้อมูลในระบบ |
| `personnel_info` | ดึงรหัสบุคลากร, ตำแหน่ง สำหรับอาจารย์และเจ้าหน้าที่ |

#### 3.4 การเก็บรักษาข้อมูล
- เก็บใน MySQL database บน server ที่ควบคุมโดยภาควิชา
- การสื่อสารผ่าน HTTPS เท่านั้น
- ไม่เปิดเผยหรือแชร์ข้อมูลส่วนบุคคลกับบุคคลภายนอก

#### 3.5 ระยะเวลาการเก็บ
ตลอดระยะเวลาที่ศึกษาอยู่ในมหาวิทยาลัย + 1 ปีหลังสำเร็จการศึกษา หลังจากนั้นข้อมูลจะถูกลบออกจากระบบ

#### 3.6 สิทธิ์ของผู้ใช้
- เข้าถึงข้อมูลส่วนบุคคลของตนเอง
- ขอแก้ไขข้อมูลที่ไม่ถูกต้อง
- ขอลบข้อมูลส่วนบุคคล (ติดต่อผู้ดูแลระบบ)

#### 3.7 ผู้รับผิดชอบ
ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ

#### 3.8 วันที่ปรับปรุงล่าสุด
แสดง hardcoded: 13 เมษายน 2569

## 4. Support Page (`/support`)

### Sections

#### 4.1 ข้อมูลผู้ดูแลระบบ
- ชื่อ: ชินกฤต ศรีป่าน
- รหัสนักศึกษา: 6404062630295
- สาขา: ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ

#### 4.2 สถานที่ติดต่อ
ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
คณะวิทยาศาสตร์ประยุกต์
มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
ตึก 78 ชั้น 6

#### 4.3 วิธีแจ้งปัญหา
- ติดต่อผ่านอีเมลผู้ดูแลระบบ
- แจ้งโดยตรงที่ภาควิชา

#### 4.4 เวลาทำการ
วันจันทร์ - ศุกร์ เวลา 08:30 - 16:30 น. (ยกเว้นวันหยุดราชการ)

## 5. Login Page Changes

เพิ่ม footer links ใต้ login card (ใน `src/app/(auth)/login/page.tsx`):

```
นโยบายความเป็นส่วนตัว  ·  ติดต่อผู้ดูแลระบบ
```

- Style: font-size 0.8rem, color --color-text-muted, text-decoration none
- Hover: color --color-primary
- Position: ใต้ login card, centered

## 6. Files to Create/Modify

| Action | File |
|--------|------|
| Create | `src/app/privacy-policy/page.tsx` |
| Create | `src/app/privacy-policy/page.module.css` |
| Create | `src/app/support/page.tsx` |
| Create | `src/app/support/page.module.css` |
| Modify | `src/app/(auth)/login/page.tsx` — เพิ่ม footer links |

## 7. No Dependencies

- ไม่ต้องติดตั้ง packages เพิ่ม
- ใช้ CSS Modules + design tokens ที่มีอยู่
- ใช้ CSLogbookLogo component ที่มีอยู่
- ใช้ Next.js Link สำหรับ navigation
