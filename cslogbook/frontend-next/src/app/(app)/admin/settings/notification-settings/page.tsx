"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  getNotificationSettings,
  toggleNotification,
  enableAllNotifications,
  disableAllNotifications,
  type NotificationSetting,
} from "@/lib/services/notificationSettingsService";
import btn from "@/styles/shared/buttons.module.css";
import styles from "../settings.module.css";
import ns from "./notification.module.css";

/* ─── Mapping ชื่อไทย + รายละเอียดย่อยของแต่ละ notification type ─── */
const NOTIFICATION_META: Record<string, { label: string; description: string; details: string[] }> = {
  LOGIN: {
    label: "เข้าสู่ระบบ",
    description: "แจ้งเตือนทางอีเมลเมื่อมีการเข้าสู่ระบบ",
    details: ["ส่งอีเมลแจ้งผู้ใช้เมื่อเข้าสู่ระบบสำเร็จ"],
  },
  DOCUMENT: {
    label: "เอกสาร",
    description: "แจ้งเตือนเกี่ยวกับเอกสารและกำหนดส่ง",
    details: [
      "แจ้งผลอนุมัติ/ปฏิเสธเอกสาร เช่น คพ.05, หนังสือตอบรับ",
      "แจ้งผลการอนุมัติ/ปฏิเสธบันทึกการฝึกงาน (Timesheet)",
      "เตือนกำหนดส่งเอกสารที่ใกล้ถึง",
      "แจ้งอาจารย์เมื่อมีเอกสารค้างรอตรวจสอบ",
    ],
  },
  LOGBOOK: {
    label: "บันทึกประจำวัน",
    description: "แจ้งเตือนเกี่ยวกับบันทึกการฝึกงานประจำวัน",
    details: [
      "แจ้งผู้ควบคุมงานเมื่อนักศึกษาส่งบันทึกประจำวัน",
      "คำแนะนำปรับปรุงคุณภาพบันทึก (ระบบตรวจอัตโนมัติ)",
    ],
  },
  EVALUATION: {
    label: "การประเมินฝึกงาน",
    description: "แจ้งเตือนเกี่ยวกับการประเมินผลการฝึกงาน",
    details: [
      "ส่งลิงก์แบบประเมินไปยังผู้ควบคุมงาน (Supervisor)",
      "แจ้งนักศึกษาเมื่อได้รับการประเมินแล้ว",
      "แจ้งอาจารย์ที่ปรึกษาเมื่อมีผลประเมิน",
    ],
  },
  APPROVAL: {
    label: "การขออนุมัติ",
    description: "แจ้งเตือนเกี่ยวกับคำขออนุมัติบันทึกการฝึกงาน",
    details: [
      "ส่งคำขออนุมัติบันทึกการฝึกงานไปยังผู้ควบคุมงาน",
      "แจ้งนักศึกษาเมื่อมีคุณสมบัติครบสำหรับลงทะเบียน",
    ],
  },
  MEETING: {
    label: "การนัดพบอาจารย์",
    description: "แจ้งเตือนเกี่ยวกับการนัดหมายพบอาจารย์โครงงาน",
    details: ["ส่งอีเมลแจ้งผู้เข้าร่วมเมื่อสร้างนัดหมายการพบ"],
  },
};

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Record<string, NotificationSetting>>({});
  const [loading, setLoading] = useState(false);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"info" | "warning" | "success">("info");

  /* ─── Loaders ─── */
  const loadSettings = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await getNotificationSettings();
      setSettings(data ?? {});
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถดึงข้อมูลการแจ้งเตือนได้");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const items = useMemo(() => Object.entries(settings), [settings]);

  const formatDateTime = useCallback(
    (value?: string | null) => (value ? new Date(value).toLocaleString("th-TH") : "-"),
    []
  );

  /* ─── Handlers ─── */
  const handleToggle = async (type: string, enabled: boolean) => {
    setTogglingKey(type);
    setMessage(null);
    try {
      await toggleNotification(type, enabled);
      setMessageTone("success");
      setMessage("อัปเดตการแจ้งเตือนเรียบร้อยแล้ว");
      await loadSettings();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถอัปเดตการแจ้งเตือนได้");
    } finally {
      setTogglingKey(null);
    }
  };

  const handleBulk = async (action: "enable" | "disable") => {
    setLoading(true);
    setMessage(null);
    try {
      if (action === "enable") await enableAllNotifications();
      else await disableAllNotifications();
      setMessageTone("success");
      setMessage(action === "enable" ? "เปิดการแจ้งเตือนทั้งหมดแล้ว" : "ปิดการแจ้งเตือนทั้งหมดแล้ว");
      await loadSettings();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถดำเนินการได้");
    } finally {
      setLoading(false);
    }
  };

  const enabledCount = items.filter(([, v]) => v.enabled).length;

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        {/* ─── Header ─── */}
        <header className={styles.header}>
          <p className={styles.subtitle}>ควบคุมการเปิด/ปิดการแจ้งเตือนของระบบ</p>
        </header>

        {/* ─── Alert ─── */}
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

        {/* ═══ Notification Settings ═══ */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <strong>การแจ้งเตือน ({enabledCount}/{items.length} เปิดใช้งาน)</strong>
            <div className={styles.actions}>
              <button type="button" className={btn.button} onClick={loadSettings} disabled={loading}>
                รีเฟรช
              </button>
              <button
                type="button"
                className={btn.button}
                onClick={() => handleBulk("enable")}
                disabled={loading}
              >
                เปิดทั้งหมด
              </button>
              <button
                type="button"
                className={btn.button}
                onClick={() => handleBulk("disable")}
                disabled={loading}
              >
                ปิดทั้งหมด
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyStateText}>ยังไม่มีการตั้งค่าการแจ้งเตือน</div>
            </div>
          ) : (
            <div className={ns.notifList}>
              {items.map(([key, item]) => {
                const meta = NOTIFICATION_META[key];
                return (
                  <div key={key} className={ns.notifRow}>
                    <div className={ns.notifInfo}>
                      <div className={ns.notifHeader}>
                        <span className={ns.notifLabel}>{meta?.label ?? key}</span>
                        <span className={ns.notifBadge}>{key}</span>
                      </div>
                      <div className={ns.notifDesc}>
                        {meta?.description ?? item.description}
                      </div>
                      {meta?.details.length ? (
                        <ul className={ns.notifDetails}>
                          {meta.details.map((d) => (
                            <li key={d} className={ns.notifDetailItem}>{d}</li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                    <div className={ns.notifControls}>
                      <span className={ns.notifMeta}>{formatDateTime(item.lastUpdated)}</span>
                      <label className={ns.toggle}>
                        <input
                          type="checkbox"
                          checked={item.enabled}
                          disabled={togglingKey === key || loading}
                          onChange={() => handleToggle(key, !item.enabled)}
                          aria-label={`สลับการแจ้งเตือน ${meta?.label ?? key}`}
                        />
                        <span className={ns.toggleTrack} />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </RoleGuard>
  );
}
