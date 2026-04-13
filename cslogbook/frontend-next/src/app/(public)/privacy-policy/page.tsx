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
        <p className={styles.text}>
          ระบบ CS Logbook เป็นระบบย่อยภายใต้มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ (มจพ.)
          จัดทำขึ้นเพื่อจัดการ workflow การฝึกงาน โครงงานพิเศษ และปริญญานิพนธ์
          ของภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์ประยุกต์
          นโยบายฉบับนี้อธิบายถึงการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่าน
          ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
        </p>

        {/* Section 1 — ข้อมูลที่เก็บรวบรวม */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>1. ข้อมูลส่วนบุคคลที่เก็บรวบรวม</h2>
          <p className={styles.text}>
            ระบบเก็บรวบรวมข้อมูลส่วนบุคคลผ่านการเข้าสู่ระบบด้วย KMUTNB SSO (ICIT Account) ดังนี้:
          </p>
          <ul className={styles.list}>
            <li>ชื่อ-นามสกุล (ภาษาไทยและภาษาอังกฤษ)</li>
            <li>อีเมลมหาวิทยาลัย (@kmutnb.ac.th / @sci.kmutnb.ac.th)</li>
            <li>รหัสนักศึกษาหรือรหัสบุคลากร</li>
            <li>ภาควิชา / สาขาวิชา / ตำแหน่ง</li>
            <li>ประเภทบัญชี (นักศึกษา / บุคลากร)</li>
          </ul>
          <p className={styles.text} style={{ marginTop: "0.75rem" }}>
            ข้อมูลที่เกิดจากการใช้งานระบบ:
          </p>
          <ul className={styles.list}>
            <li>บันทึกการเข้าสู่ระบบ (วันเวลา, IP address)</li>
            <li>ข้อมูลการฝึกงาน, โครงงานพิเศษ และปริญญานิพนธ์</li>
            <li>เอกสารที่อัปโหลด (ไฟล์ PDF)</li>
            <li>บันทึก Logbook รายสัปดาห์</li>
            <li>บันทึกพบอาจารย์ที่ปรึกษาและผลการสอบ</li>
          </ul>
          <p className={styles.text} style={{ marginTop: "0.75rem" }}>
            ระบบไม่เก็บรวบรวมข้อมูลส่วนบุคคลที่มีความอ่อนไหว (Sensitive Data) ตามมาตรา 26
          </p>
        </div>

        {/* Section 2 — วัตถุประสงค์และฐานทางกฎหมาย */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>2. วัตถุประสงค์และฐานทางกฎหมาย</h2>
          <table className={styles.scopeTable}>
            <thead>
              <tr>
                <th>วัตถุประสงค์</th>
                <th>ฐานทางกฎหมาย (มาตรา 24)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>ยืนยันตัวตนผู้ใช้งานผ่าน KMUTNB SSO</td>
                <td>สัญญา / ความยินยอม</td>
              </tr>
              <tr>
                <td>จัดการ workflow การฝึกงาน โครงงานพิเศษ และปริญญานิพนธ์</td>
                <td>สัญญา</td>
              </tr>
              <tr>
                <td>ติดตามความคืบหน้าของนักศึกษา</td>
                <td>สัญญา</td>
              </tr>
              <tr>
                <td>แจ้งเตือนกำหนดส่งเอกสารและสถานะการอนุมัติ</td>
                <td>ประโยชน์โดยชอบด้วยกฎหมาย</td>
              </tr>
              <tr>
                <td>ออกเอกสารทางวิชาการ เช่น หนังสือขอความอนุเคราะห์ หนังสือส่งตัว</td>
                <td>สัญญา</td>
              </tr>
              <tr>
                <td>บันทึกข้อมูลการเข้าใช้งาน (Log) เพื่อความปลอดภัยของระบบ</td>
                <td>ประโยชน์โดยชอบด้วยกฎหมาย</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3 — Scopes */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>3. ขอบเขตการเข้าถึงข้อมูลจาก SSO (Scopes)</h2>
          <p className={styles.text}>
            ระบบขอเข้าถึงข้อมูลจาก KMUTNB SSO เฉพาะที่จำเป็นต่อการให้บริการ
            โดย มจพ. เป็นผู้ควบคุมข้อมูลส่วนบุคคล (Data Controller) ของข้อมูล SSO
            และ CS Logbook เป็นระบบย่อยที่ประมวลผลข้อมูลภายใต้ขอบเขตที่ได้รับอนุญาต:
          </p>
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

        {/* Section 4 — การเปิดเผยข้อมูล */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>4. การเปิดเผยข้อมูลแก่บุคคลภายนอก</h2>
          <p className={styles.text}>
            ระบบอาจเปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลหรือหน่วยงานดังต่อไปนี้
            เฉพาะเท่าที่จำเป็นต่อการปฏิบัติตามวัตถุประสงค์ที่ระบุไว้:
          </p>
          <ul className={styles.list}>
            <li>อาจารย์ที่ปรึกษา — ติดตามความคืบหน้าโครงงาน/ปริญญานิพนธ์ อนุมัติบันทึกพบอาจารย์</li>
            <li>คณะกรรมการสอบ — ประเมินผลการสอบหัวข้อ/โครงงาน/ปริญญานิพนธ์</li>
            <li>ผู้ควบคุมงาน (Supervisor) — ประเมินผลนักศึกษาฝึกงาน ณ สถานประกอบการ</li>
            <li>เจ้าหน้าที่ภาควิชา — บริหารจัดการเอกสารและอนุมัติคำร้อง</li>
            <li>สถานประกอบการ — ข้อมูลในหนังสือขอความอนุเคราะห์และหนังสือส่งตัว</li>
          </ul>
          <p className={styles.text} style={{ marginTop: "0.75rem" }}>
            ระบบจะไม่เปิดเผยข้อมูลส่วนบุคคลแก่บุคคลภายนอกเกินกว่าที่ระบุไว้
            เว้นแต่จะได้รับความยินยอมจากท่าน หรือเป็นไปตามที่กฎหมายกำหนด
          </p>
        </div>

        {/* Section 5 — การเก็บรักษาและมาตรการความปลอดภัย */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>5. การเก็บรักษาและมาตรการความปลอดภัย</h2>
          <ul className={styles.list}>
            <li>ข้อมูลถูกจัดเก็บในฐานข้อมูลบน server ที่ควบคุมโดยภาควิชา</li>
            <li>การสื่อสารระหว่างผู้ใช้กับระบบผ่าน HTTPS (TLS encryption) เท่านั้น</li>
            <li>การยืนยันตัวตนใช้ JSON Web Token (JWT) พร้อมกลไก token blacklist เมื่อออกจากระบบ</li>
            <li>รหัสผ่านถูกเข้ารหัสด้วย bcrypt ก่อนจัดเก็บ</li>
            <li>มีการจำกัดอัตราการเข้าถึง (Rate Limiting) เพื่อป้องกันการโจมตี</li>
            <li>มีระบบบันทึกกิจกรรม (Audit Log) สำหรับตรวจสอบการใช้งาน</li>
          </ul>
        </div>

        {/* Section 6 — ระยะเวลาการเก็บ */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>6. ระยะเวลาการเก็บข้อมูล</h2>
          <p className={styles.text}>
            ระบบจัดเก็บข้อมูลตลอดระยะเวลาที่ผู้ใช้ศึกษาหรือปฏิบัติงานอยู่ในมหาวิทยาลัย
            และอีก 1 ปีหลังสำเร็จการศึกษาหรือสิ้นสุดการปฏิบัติงาน
            หลังจากนั้นข้อมูลจะถูกลบออกจากระบบ
            ยกเว้นข้อมูลที่จำเป็นต้องเก็บรักษาตามกฎหมายหรือระเบียบของมหาวิทยาลัย
          </p>
        </div>

        {/* Section 7 — สิทธิของเจ้าของข้อมูล */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>7. สิทธิของเจ้าของข้อมูล</h2>
          <p className={styles.text}>
            ท่านมีสิทธิตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ดังต่อไปนี้:
          </p>
          <ul className={styles.list}>
            <li><strong>สิทธิในการเข้าถึง</strong> (มาตรา 30) — ขอดูหรือขอสำเนาข้อมูลส่วนบุคคลของท่าน</li>
            <li><strong>สิทธิในการขอให้โอนย้ายข้อมูล</strong> (มาตรา 31) — ขอรับข้อมูลในรูปแบบอิเล็กทรอนิกส์ที่อ่านได้ทั่วไป</li>
            <li><strong>สิทธิในการคัดค้าน</strong> (มาตรา 32) — คัดค้านการประมวลผลข้อมูลในกรณีที่ใช้ฐานประโยชน์โดยชอบด้วยกฎหมาย</li>
            <li><strong>สิทธิในการขอลบ</strong> (มาตรา 33) — ขอลบหรือทำให้ข้อมูลไม่สามารถระบุตัวตนได้</li>
            <li><strong>สิทธิในการขอแก้ไข</strong> (มาตรา 34) — ขอแก้ไขข้อมูลที่ไม่ถูกต้องหรือไม่ครบถ้วน</li>
            <li><strong>สิทธิในการระงับการใช้</strong> (มาตรา 34) — ขอระงับการประมวลผลข้อมูลชั่วคราว</li>
            <li><strong>สิทธิในการถอนความยินยอม</strong> (มาตรา 19) — ถอนความยินยอมได้ทุกเมื่อ
              โดยการถอนความยินยอมจะไม่กระทบต่อการประมวลผลที่ทำไปก่อนหน้า</li>
          </ul>
          <p className={styles.text} style={{ marginTop: "0.75rem" }}>
            ท่านสามารถใช้สิทธิข้างต้นโดยติดต่อผู้ดูแลระบบผ่านหน้า{" "}
            <Link href="/support" style={{ color: "var(--color-primary)" }}>ติดต่อผู้ดูแลระบบ</Link>{" "}
            หรือติดต่อเจ้าหน้าที่ภาควิชาโดยตรง
            ระบบจะดำเนินการตามคำขอภายใน 30 วันนับจากวันที่ได้รับคำขอ
          </p>
        </div>

        {/* Section 8 — ผู้ควบคุมข้อมูลและ DPO */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>8. ผู้ควบคุมข้อมูลส่วนบุคคลและเจ้าหน้าที่คุ้มครองข้อมูล</h2>
          <div className={styles.infoCard}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>ผู้ควบคุมข้อมูล</span>
              <span>มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>หน่วยงานดูแลระบบ</span>
              <span>ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ คณะวิทยาศาสตร์ประยุกต์</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>สถานที่</span>
              <span>ตึก 78 ชั้น 6 มจพ.</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>DPO (เจ้าหน้าที่คุ้มครองข้อมูล)</span>
              <span>
                <a href="mailto:PDPA@kmutnb.ac.th" style={{ color: "var(--color-primary)" }}>
                  PDPA@kmutnb.ac.th
                </a>
              </span>
            </div>
          </div>
        </div>

        {/* Section 9 — ช่องทางร้องเรียน */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>9. ช่องทางร้องเรียน</h2>
          <p className={styles.text}>
            หากท่านเห็นว่าการประมวลผลข้อมูลส่วนบุคคลของท่านไม่เป็นไปตามกฎหมาย
            ท่านมีสิทธิร้องเรียนต่อสำนักงานคณะกรรมการคุ้มครองข้อมูลส่วนบุคคล (สคส.)
            ตามช่องทางที่สำนักงานกำหนด
          </p>
        </div>

        {/* Section 10 — การเปลี่ยนแปลงนโยบาย */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>10. การเปลี่ยนแปลงนโยบาย</h2>
          <p className={styles.text}>
            ภาควิชาอาจปรับปรุงนโยบายฉบับนี้เป็นครั้งคราวเพื่อให้สอดคล้องกับการเปลี่ยนแปลงของระบบหรือกฎหมาย
            โดยจะแจ้งให้ทราบผ่านการแสดงวันที่ปรับปรุงล่าสุดในหน้านี้
            การใช้งานระบบต่อหลังการเปลี่ยนแปลงถือว่าท่านรับทราบนโยบายฉบับปรับปรุงแล้ว
          </p>
        </div>

        {/* Section 11 — อ้างอิง */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>11. นโยบายที่เกี่ยวข้อง</h2>
          <ul className={styles.list}>
            <li>
              <a
                href="https://kmutnb.ac.th/privacynotice.aspx"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--color-primary)" }}
              >
                ประกาศความเป็นส่วนตัวของมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
              </a>
            </li>
            <li>พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562</li>
          </ul>
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
