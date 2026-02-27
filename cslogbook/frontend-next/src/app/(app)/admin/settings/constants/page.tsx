import Link from "next/link";
import { RoleGuard } from "@/components/auth/RoleGuard";
import styles from "./constants.module.css";

const SETTINGS_MODULES = [
  {
    href: "/admin/settings/curriculum",
    title: "หลักสูตรการศึกษา",
    description: "จัดการโครงสร้างหลักสูตรและรายวิชาที่เกี่ยวข้อง",
  },
  {
    href: "/admin/settings/academic",
    title: "ปีการศึกษา / ภาคเรียน",
    description: "ตั้งค่าปีการศึกษา ตารางเวลา และกำหนดการสำคัญ",
  },
  {
    href: "/admin/settings/status",
    title: "สถานะนักศึกษา",
    description: "กำหนดประเภทสถานะนักศึกษาและรายละเอียดที่เกี่ยวข้อง",
  },
  {
    href: "/admin/settings/notification-settings",
    title: "การแจ้งเตือน",
    description: "ตั้งค่า agent แจ้งเตือนและการส่ง notification อัตโนมัติ",
  },
  {
    href: "/admin/settings/workflow-steps",
    title: "ขั้นตอน Workflow",
    description: "จัดการลำดับขั้นตอนการดำเนินงานในระบบ",
  },
  {
    href: "/admin/settings/compatibility",
    title: "Compatibility APIs",
    description: "ทดสอบและเรียกใช้งาน Do Not Remove endpoints ผ่านหน้า UI กลาง",
  },
];

export default function AdminConstantsSettingsPage() {
  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1 className={styles.title}>การตั้งค่าระบบ</h1>
          <p className={styles.subtitle}>จัดการค่าคงที่และการตั้งค่าพื้นฐานของระบบ เลือกโมดูลที่ต้องการแก้ไข</p>
        </header>

        <div className={styles.grid}>
          {SETTINGS_MODULES.map((mod) => (
            <Link key={mod.href} href={mod.href} className={styles.card}>
              <h2 className={styles.cardTitle}>{mod.title}</h2>
              <p className={styles.cardDescription}>{mod.description}</p>
              <span className={styles.cardLink}>เปิดหน้า &rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </RoleGuard>
  );
}
