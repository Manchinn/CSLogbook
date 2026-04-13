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
