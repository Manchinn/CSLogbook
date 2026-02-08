"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  getNotificationSettings,
  toggleNotification,
  enableAllNotifications,
  disableAllNotifications,
  getAgentNotificationStats,
  type NotificationSetting,
} from "@/lib/services/notificationSettingsService";
import { getAgentSystemStatus, getAgentEmailStats } from "@/lib/services/agentStatusService";
import styles from "../settings.module.css";

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Record<string, NotificationSetting>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"info" | "warning" | "success">("info");
  const [agentStats, setAgentStats] = useState<Record<string, unknown> | null>(null);
  const [agentEmailStats, setAgentEmailStats] = useState<Record<string, unknown> | null>(null);
  const [agentNotifyStats, setAgentNotifyStats] = useState<Record<string, unknown> | null>(null);

  const loadSettings = async () => {
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
  };

  const loadAgentStats = async () => {
    try {
      const [systemStatus, emailStats, notifyStats] = await Promise.all([
        getAgentSystemStatus(),
        getAgentEmailStats(),
        getAgentNotificationStats(),
      ]);
      setAgentStats(systemStatus ?? null);
      setAgentEmailStats(emailStats ?? null);
      setAgentNotifyStats(notifyStats ?? null);
    } catch {
      setAgentStats(null);
      setAgentEmailStats(null);
      setAgentNotifyStats(null);
    }
  };

  useEffect(() => {
    loadSettings();
    loadAgentStats();
  }, []);

  const items = useMemo(() => Object.entries(settings), [settings]);

  const handleToggle = async (type: string, enabled: boolean) => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  const handleEnableAll = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await enableAllNotifications();
      setMessageTone("success");
      setMessage("เปิดการแจ้งเตือนทั้งหมดแล้ว");
      await loadSettings();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถเปิดการแจ้งเตือนทั้งหมดได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDisableAll = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await disableAllNotifications();
      setMessageTone("success");
      setMessage("ปิดการแจ้งเตือนทั้งหมดแล้ว");
      await loadSettings();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถปิดการแจ้งเตือนทั้งหมดได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>การตั้งค่าการแจ้งเตือน</h1>
          <p className={styles.subtitle}>ควบคุมการเปิด/ปิดการแจ้งเตือนและตรวจสอบสถานะระบบแจ้งเตือน</p>
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
            <strong>การแจ้งเตือน</strong>
            <div className={styles.actions}>
              <button type="button" className={styles.button} onClick={loadSettings} disabled={loading}>
                รีเฟรช
              </button>
              <button type="button" className={styles.button} onClick={handleEnableAll} disabled={loading}>
                เปิดทั้งหมด
              </button>
              <button type="button" className={styles.button} onClick={handleDisableAll} disabled={loading}>
                ปิดทั้งหมด
              </button>
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ประเภท</th>
                  <th>คำอธิบาย</th>
                  <th>สถานะ</th>
                  <th>อัปเดตล่าสุด</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {items.map(([key, item]) => (
                  <tr key={key}>
                    <td>{key}</td>
                    <td>{item.description ?? "-"}</td>
                    <td>
                      <span className={`${styles.badge} ${item.enabled ? styles.badgeSuccess : styles.badgeMuted}`}>
                        {item.enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </td>
                    <td>{item.lastUpdated ? new Date(item.lastUpdated).toLocaleString("th-TH") : "-"}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => handleToggle(key, !item.enabled)}
                        >
                          {item.enabled ? "ปิด" : "เปิด"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <strong>Agent Status</strong>
            <button type="button" className={styles.button} onClick={loadAgentStats} disabled={loading}>
              รีเฟรชสถานะ
            </button>
          </div>
          <div className={styles.grid}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>ระบบ Agent</div>
              <pre className={styles.cardMeta}>{JSON.stringify(agentStats, null, 2)}</pre>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>อีเมลสรุป</div>
              <pre className={styles.cardMeta}>{JSON.stringify(agentEmailStats, null, 2)}</pre>
            </div>
            <div className={styles.card}>
              <div className={styles.cardTitle}>สถิติแจ้งเตือน</div>
              <pre className={styles.cardMeta}>{JSON.stringify(agentNotifyStats, null, 2)}</pre>
            </div>
          </div>
        </section>

      </div>
    </RoleGuard>
  );
}
