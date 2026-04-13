# Privacy Policy + Support Pages — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างหน้า public Privacy Policy และ Support สำหรับ KMUTNB SSO approval + เพิ่ม link ที่หน้า login

**Architecture:** 2 public Next.js pages นอก route groups + แก้ login page เพิ่ม footer links ใช้ CSS Modules + design tokens ที่มีอยู่ ไม่มี client-side state

**Tech Stack:** Next.js 16 App Router, CSS Modules, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-13-privacy-support-pages-design.md`

---

### Task 1: สร้าง shared CSS สำหรับ public pages

ทั้ง privacy-policy และ support ใช้ layout เดียวกัน (background blobs + card) จึงสร้าง shared CSS file เพื่อไม่ซ้ำ

**Files:**
- Create: `frontend-next/src/app/(public)/layout.module.css`
- Create: `frontend-next/src/app/(public)/layout.tsx`

- [ ] **Step 1: สร้าง shared layout CSS**

สร้างไฟล์ `frontend-next/src/app/(public)/layout.module.css`:

```css
.page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem 1.5rem;
  background: linear-gradient(135deg, #e6f7ff 0%, #ffffff 50%, #bae7ff 100%);
  position: relative;
  overflow: hidden;
}

.backgroundLayer {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.bgCircle {
  position: absolute;
  width: 280px;
  height: 280px;
  border-radius: 999px;
  background: rgba(219, 234, 254, 0.7);
  filter: blur(0.5px);
}

.bgCircleTop {
  top: -120px;
  left: 40px;
}

.bgCircleBottom {
  bottom: -140px;
  right: 60px;
  background: rgba(209, 250, 229, 0.65);
}

.card {
  position: relative;
  z-index: 1;
  width: min(720px, 100%);
  background: rgba(255, 255, 255, 0.85);
  border-radius: 1.75rem;
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.18);
  -webkit-backdrop-filter: blur(16px);
  backdrop-filter: blur(16px);
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.logoLink {
  display: block;
  border-radius: 14px;
  width: fit-content;
  margin-bottom: 0.5rem;
  outline-offset: 4px;
}

.title {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-secondary-dark, #0f172a);
}

.section {
  margin-top: 1.5rem;
}

.sectionTitle {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-secondary-dark, #0f172a);
  margin: 0 0 0.5rem;
}

.text {
  margin: 0;
  color: var(--color-text-muted, #5a5a5a);
  font-size: 0.9rem;
  line-height: 1.7;
}

.list {
  margin: 0.25rem 0 0;
  padding-left: 1.25rem;
  color: var(--color-text-muted, #5a5a5a);
  font-size: 0.9rem;
  line-height: 1.8;
}

.scopeTable {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
  font-size: 0.85rem;
}

.scopeTable th {
  text-align: left;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-subtle, #f5f7fa);
  border-bottom: 1px solid var(--color-border-strong, #d9d9d9);
  font-weight: 600;
  color: var(--color-secondary-dark, #0f172a);
}

.scopeTable td {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--color-border, #f0f0f0);
  color: var(--color-text-muted, #5a5a5a);
}

.scopeTable code {
  background: var(--color-bg-subtle, #f5f7fa);
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  font-size: 0.82rem;
}

.footer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border, #f0f0f0);
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  font-size: 0.82rem;
}

.footerLink {
  color: var(--color-text-muted, #5a5a5a);
  text-decoration: none;
  transition: color 0.15s;
}

.footerLink:hover {
  color: var(--color-primary, #2563eb);
}

.infoCard {
  margin-top: 0.5rem;
  padding: 1rem 1.25rem;
  background: var(--color-bg-subtle, #f5f7fa);
  border-radius: 0.75rem;
  border: 1px solid var(--color-border, #f0f0f0);
}

.infoRow {
  display: flex;
  gap: 0.5rem;
  padding: 0.35rem 0;
  font-size: 0.9rem;
  color: var(--color-text-muted, #5a5a5a);
}

.infoLabel {
  font-weight: 600;
  color: var(--color-secondary-dark, #0f172a);
  min-width: 120px;
  flex-shrink: 0;
}

@media (max-width: 640px) {
  .card {
    padding: 1.75rem 1.25rem;
    border-radius: 1.5rem;
  }

  .infoRow {
    flex-direction: column;
    gap: 0.1rem;
  }

  .infoLabel {
    min-width: unset;
  }
}
```

- [ ] **Step 2: สร้าง shared layout component**

สร้างไฟล์ `frontend-next/src/app/(public)/layout.tsx`:

```tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: "noindex",
};

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/\(public\)/layout.module.css frontend-next/src/app/\(public\)/layout.tsx
git commit -m "feat: add shared (public) layout and styles for policy pages"
```

---

### Task 2: สร้างหน้า Privacy Policy

**Files:**
- Create: `frontend-next/src/app/(public)/privacy-policy/page.tsx`

- [ ] **Step 1: สร้าง Privacy Policy page**

สร้างไฟล์ `frontend-next/src/app/(public)/privacy-policy/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CSLogbookLogo } from "@/components/common/Logo";
import styles from "../layout.module.css";

export const metadata: Metadata = {
  title: "นโยบายความเป็นส่วนตัว — CS Logbook",
  description: "นโยบายความเป็นส่วนตัวและการคุ้มครองข้อมูลส่วนบุคคลของระบบ CS Logbook",
};

export default function PrivacyPolicyPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundLayer} aria-hidden="true">
        <span className={`${styles.bgCircle} ${styles.bgCircleTop}`} />
        <span className={`${styles.bgCircle} ${styles.bgCircleBottom}`} />
      </div>

      <div className={styles.card}>
        <Link href="/login" className={styles.logoLink} aria-label="กลับหน้าเข้าสู่ระบบ">
          <CSLogbookLogo size={44} />
        </Link>

        <h1 className={styles.title}>นโยบายความเป็นส่วนตัว</h1>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. ข้อมูลที่เก็บรวบรวม</h2>
          <p className={styles.text}>
            ระบบ CS Logbook เก็บรวบรวมข้อมูลส่วนบุคคลผ่านการเข้าสู่ระบบด้วย KMUTNB SSO (ICIT Account) ดังนี้:
          </p>
          <ul className={styles.list}>
            <li>ชื่อ-นามสกุล (ภาษาไทยและภาษาอังกฤษ)</li>
            <li>อีเมลมหาวิทยาลัย (@kmutnb.ac.th / @sci.kmutnb.ac.th)</li>
            <li>รหัสนักศึกษาหรือรหัสบุคลากร</li>
            <li>ภาควิชา / สาขาวิชา / ตำแหน่ง</li>
            <li>ประเภทบัญชี (นักศึกษา / บุคลากร)</li>
          </ul>
          <p className={styles.text} style={{ marginTop: "0.75rem" }}>
            นอกจากนี้ ระบบยังเก็บข้อมูลที่เกิดจากการใช้งาน ได้แก่:
          </p>
          <ul className={styles.list}>
            <li>บันทึกการเข้าสู่ระบบ (วันเวลา, IP address)</li>
            <li>ข้อมูลการฝึกงาน, โครงงานพิเศษ และปริญญานิพนธ์</li>
            <li>เอกสารที่อัปโหลด (ไฟล์ PDF)</li>
            <li>บันทึก Logbook รายสัปดาห์</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. วัตถุประสงค์ในการใช้ข้อมูล</h2>
          <ul className={styles.list}>
            <li>ยืนยันตัวตนผู้ใช้งานผ่าน KMUTNB SSO</li>
            <li>จัดการ workflow การฝึกงาน โครงงานพิเศษ และปริญญานิพนธ์</li>
            <li>ติดตามความคืบหน้าของนักศึกษา</li>
            <li>แจ้งเตือนกำหนดส่งเอกสารและสถานะการอนุมัติ</li>
            <li>ออกเอกสารทางวิชาการ เช่น หนังสือขอความอนุเคราะห์ หนังสือส่งตัว</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>3. ขอบเขตการเข้าถึงข้อมูลจาก SSO (Scopes)</h2>
          <p className={styles.text}>ระบบขอเข้าถึงข้อมูลจาก KMUTNB SSO เฉพาะที่จำเป็นต่อการให้บริการ:</p>
          <table className={styles.scopeTable}>
            <thead>
              <tr>
                <th>Scope</th>
                <th>เหตุผลที่ขอ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>openid</code></td>
                <td>ยืนยันตัวตนผ่าน OpenID Connect</td>
              </tr>
              <tr>
                <td><code>profile</code></td>
                <td>ดึงชื่อ-นามสกุลสำหรับแสดงผลในระบบ</td>
              </tr>
              <tr>
                <td><code>email</code></td>
                <td>สำหรับส่งการแจ้งเตือนและติดต่อผู้ใช้</td>
              </tr>
              <tr>
                <td><code>student_info</code></td>
                <td>ดึงรหัสนักศึกษาและสาขาวิชา เพื่อจับคู่กับข้อมูลในระบบ</td>
              </tr>
              <tr>
                <td><code>personnel_info</code></td>
                <td>ดึงรหัสบุคลากรและตำแหน่ง สำหรับอาจารย์และเจ้าหน้าที่</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. การเก็บรักษาข้อมูล</h2>
          <ul className={styles.list}>
            <li>ข้อมูลถูกจัดเก็บในฐานข้อมูล MySQL บน server ที่ควบคุมโดยภาควิชา</li>
            <li>การสื่อสารระหว่างผู้ใช้กับระบบผ่าน HTTPS เท่านั้น</li>
            <li>ไม่เปิดเผยหรือแบ่งปันข้อมูลส่วนบุคคลกับบุคคลหรือหน่วยงานภายนอก</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>5. ระยะเวลาการเก็บข้อมูล</h2>
          <p className={styles.text}>
            ระบบจัดเก็บข้อมูลตลอดระยะเวลาที่ผู้ใช้ศึกษาอยู่ในมหาวิทยาลัย
            และอีก 1 ปีหลังสำเร็จการศึกษา หลังจากนั้นข้อมูลจะถูกลบออกจากระบบ
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>6. สิทธิ์ของผู้ใช้</h2>
          <p className={styles.text}>ผู้ใช้มีสิทธิ์ดังต่อไปนี้:</p>
          <ul className={styles.list}>
            <li>เข้าถึงข้อมูลส่วนบุคคลของตนเองในระบบ</li>
            <li>ขอแก้ไขข้อมูลที่ไม่ถูกต้อง</li>
            <li>ขอลบข้อมูลส่วนบุคคล โดยติดต่อผู้ดูแลระบบ</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>7. หน่วยงานที่รับผิดชอบ</h2>
          <p className={styles.text}>
            ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์ประยุกต์
            มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
          </p>
        </div>

        <div className={styles.section}>
          <p className={styles.text}>
            <strong>ปรับปรุงล่าสุด:</strong> 13 เมษายน 2569
          </p>
        </div>

        <nav className={styles.footer}>
          <Link href="/support" className={styles.footerLink}>
            ติดต่อผู้ดูแลระบบ
          </Link>
          <Link href="/login" className={styles.footerLink}>
            กลับหน้าเข้าสู่ระบบ
          </Link>
        </nav>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: ทดสอบ build**

Run: `cd frontend-next && npm run build`
Expected: Build สำเร็จ ไม่มี error

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/\(public\)/privacy-policy/page.tsx
git commit -m "feat: add privacy policy page for SSO approval"
```

---

### Task 3: สร้างหน้า Support

**Files:**
- Create: `frontend-next/src/app/(public)/support/page.tsx`

- [ ] **Step 1: สร้าง Support page**

สร้างไฟล์ `frontend-next/src/app/(public)/support/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { CSLogbookLogo } from "@/components/common/Logo";
import styles from "../layout.module.css";

export const metadata: Metadata = {
  title: "ติดต่อผู้ดูแลระบบ — CS Logbook",
  description: "ช่องทางติดต่อผู้ดูแลระบบ CS Logbook ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ มจพ.",
};

export default function SupportPage() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundLayer} aria-hidden="true">
        <span className={`${styles.bgCircle} ${styles.bgCircleTop}`} />
        <span className={`${styles.bgCircle} ${styles.bgCircleBottom}`} />
      </div>

      <div className={styles.card}>
        <Link href="/login" className={styles.logoLink} aria-label="กลับหน้าเข้าสู่ระบบ">
          <CSLogbookLogo size={44} />
        </Link>

        <h1 className={styles.title}>ติดต่อผู้ดูแลระบบ</h1>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>ผู้พัฒนาและดูแลระบบ</h2>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ชื่อ-นามสกุล</span>
              <span>ชินกฤต ศรีป่าน</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>รหัสนักศึกษา</span>
              <span>6404062630295</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>สาขา</span>
              <span>ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ</span>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>สถานที่ติดต่อ</h2>
          <p className={styles.text}>
            ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
            <br />
            คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
            <br />
            ตึก 78 ชั้น 6
          </p>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>วิธีแจ้งปัญหา</h2>
          <ul className={styles.list}>
            <li>ติดต่อผ่านอีเมลผู้ดูแลระบบ หรือเจ้าหน้าที่ภาควิชา</li>
            <li>แจ้งโดยตรงที่ภาควิชา ตึก 78 ชั้น 6</li>
          </ul>
        </div>

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>เวลาทำการ</h2>
          <p className={styles.text}>
            วันจันทร์ – ศุกร์ เวลา 08:30 – 16:30 น. (ยกเว้นวันหยุดราชการ)
          </p>
        </div>

        <nav className={styles.footer}>
          <Link href="/privacy-policy" className={styles.footerLink}>
            นโยบายความเป็นส่วนตัว
          </Link>
          <Link href="/login" className={styles.footerLink}>
            กลับหน้าเข้าสู่ระบบ
          </Link>
        </nav>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: ทดสอบ build**

Run: `cd frontend-next && npm run build`
Expected: Build สำเร็จ ไม่มี error

- [ ] **Step 3: Commit**

```bash
git add frontend-next/src/app/\(public\)/support/page.tsx
git commit -m "feat: add support/contact page for SSO approval"
```

---

### Task 4: เพิ่ม footer links ที่หน้า Login

**Files:**
- Modify: `frontend-next/src/app/(auth)/login/page.tsx:94` — เพิ่ม footer nav ก่อนปิด `</section>`
- Modify: `frontend-next/src/app/(auth)/login/page.module.css` — เพิ่ม styles

- [ ] **Step 1: เพิ่ม CSS styles สำหรับ footer links**

เพิ่มที่ท้ายไฟล์ `frontend-next/src/app/(auth)/login/page.module.css` (ก่อน `@media (max-width: 980px)`):

```css
.pageFooter {
  grid-column: 1 / -1;
  text-align: center;
  padding-top: 0.5rem;
  font-size: 0.8rem;
}

.pageFooterLink {
  color: var(--color-text-muted, #5a5a5a);
  text-decoration: none;
  transition: color 0.15s;
}

.pageFooterLink:hover {
  color: var(--color-primary, #2563eb);
}

.pageFooterSep {
  color: var(--color-text-disabled, #858484);
  margin: 0 0.5rem;
}
```

- [ ] **Step 2: เพิ่ม footer nav ใน login page**

แก้ไขไฟล์ `frontend-next/src/app/(auth)/login/page.tsx` — เพิ่ม import `Link` และ footer nav ก่อนปิด `</section>`:

เพิ่ม import ที่บรรทัดบนสุด:
```tsx
import Link from "next/link";
```

เพิ่ม footer nav หลัง `</div>` ของ highlightList (ก่อน `</section>`):

```tsx
        <nav className={styles.pageFooter}>
          <Link href="/privacy-policy" className={styles.pageFooterLink}>
            นโยบายความเป็นส่วนตัว
          </Link>
          <span className={styles.pageFooterSep}>·</span>
          <Link href="/support" className={styles.pageFooterLink}>
            ติดต่อผู้ดูแลระบบ
          </Link>
        </nav>
```

- [ ] **Step 3: ทดสอบ build**

Run: `cd frontend-next && npm run build`
Expected: Build สำเร็จ ไม่มี error

- [ ] **Step 4: ทดสอบ dev server**

Run: `cd frontend-next && npm run dev`

ทดสอบ:
1. เปิด `http://localhost:3000/login` — เห็น footer links "นโยบายความเป็นส่วนตัว · ติดต่อผู้ดูแลระบบ"
2. กด "นโยบายความเป็นส่วนตัว" → navigate ไป `/privacy-policy` — เห็นเนื้อหาครบ 7 sections
3. กด "ติดต่อผู้ดูแลระบบ" → navigate ไป `/support` — เห็นข้อมูลติดต่อ
4. ทดสอบ cross-links ระหว่าง privacy-policy ↔ support
5. ทดสอบ responsive — resize browser ลง mobile width (~375px)

- [ ] **Step 5: Commit**

```bash
git add frontend-next/src/app/\(auth\)/login/page.tsx frontend-next/src/app/\(auth\)/login/page.module.css
git commit -m "feat: add privacy policy and support links to login page footer"
```
