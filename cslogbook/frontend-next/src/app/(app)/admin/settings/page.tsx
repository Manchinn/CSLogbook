"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { getCurriculumSettings, getEligibilitySettings, updateEligibilitySettings } from "@/lib/services/settingsService";
import styles from "./settings.module.css";

const settingsItems = [
  {
    key: "overview",
    title: "ภาพรวมการตั้งค่า",
    description: "สรุปสถานะระบบและลิงก์ไปยังเมนูหลัก",
    href: "/admin/settings",
  },
  {
    key: "curriculum",
    title: "หลักสูตรการศึกษา",
    description: "จัดการหลักสูตรและเกณฑ์หน่วยกิต",
    href: "/admin/settings/curriculum",
  },
  {
    key: "academic",
    title: "ปีการศึกษา/ภาคเรียน",
    description: "ตั้งค่าปีการศึกษา ตารางเวลา และกำหนดการสำคัญ",
    href: "/admin/settings/academic",
  },
  {
    key: "status",
    title: "สถานะนักศึกษา",
    description: "กำหนดสถานะและเงื่อนไขการใช้งาน",
    href: "/admin/settings/status",
  },
  {
    key: "notification",
    title: "การแจ้งเตือน",
    description: "ควบคุมการเปิด/ปิดอีเมลและแจ้งเตือนระบบ",
    href: "/admin/settings/notification-settings",
  },
  {
    key: "workflow",
    title: "ขั้นตอน Workflow",
    description: "จัดการขั้นตอนฝึกงานและโครงงานพิเศษ",
    href: "/admin/settings/workflow-steps",
  },
];

export default function AdminSettingsOverviewPage() {
  const [eligibility, setEligibility] = useState<string>("");
  const [curriculumSettings, setCurriculumSettings] = useState<string>("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"info" | "warning" | "success">("info");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadEligibility = async () => {
      try {
        const data = await getEligibilitySettings();
        setEligibility(JSON.stringify(data ?? {}, null, 2));
      } catch (error) {
        setMessageTone("warning");
        setMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูล eligibility ได้");
      }
    };
    const loadCurriculumSettings = async () => {
      try {
        const data = await getCurriculumSettings();
        setCurriculumSettings(JSON.stringify(data ?? {}, null, 2));
      } catch (error) {
        setMessageTone("warning");
        setMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลการตั้งค่าหลักสูตรได้");
      }
    };
    loadEligibility();
    loadCurriculumSettings();
  }, []);

  const handleEligibilitySave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const payload = eligibility ? JSON.parse(eligibility) : {};
      await updateEligibilitySettings(payload);
      setMessageTone("success");
      setMessage("บันทึก eligibility settings เรียบร้อยแล้ว");
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถบันทึก eligibility ได้");
    } finally {
      setLoading(false);
    }
  };


  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>ตั้งค่าระบบ</h1>
          <p className={styles.subtitle}>จัดการข้อมูลหลักและการกำหนดค่าที่ใช้ทั้งระบบ</p>
        </header>

        {message ? (
          <div
            className={`${styles.alert} ${
              messageTone === "success"
                ? styles.alertSuccess
                : messageTone === "warning"
                  ? styles.alertWarning
                  : styles.alertInfo
            }`}
          >
            {message}
          </div>
        ) : null}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <strong>เมนูตั้งค่าหลัก</strong>
          </div>
          <div className={styles.grid}>
            {settingsItems.map((item) => (
              <Link key={item.key} href={item.href} className={`${styles.card} ${styles.linkCard}`}>
                <div className={styles.cardTitle}>{item.title}</div>
                <div className={styles.cardMeta}>{item.description}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <strong>Eligibility Settings</strong>
            <div className={styles.actions}>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleEligibilitySave}
                disabled={loading}
              >
                บันทึก Eligibility
              </button>
            </div>
          </div>
          <label className={styles.field}>
            JSON Config
            <textarea
              className={styles.textarea}
              value={eligibility}
              onChange={(event) => setEligibility(event.target.value)}
            />
          </label>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <strong>Curriculum Settings</strong>
          </div>
          <div className={styles.cardMeta}>โหมดอ่านอย่างเดียว (ดึงจาก /admin/academic)</div>
          <label className={styles.field}>
            JSON Config
            <textarea
              className={styles.textarea}
              value={curriculumSettings}
              onChange={(event) => setCurriculumSettings(event.target.value)}
            />
          </label>
        </section>

      </div>
    </RoleGuard>
  );
}
