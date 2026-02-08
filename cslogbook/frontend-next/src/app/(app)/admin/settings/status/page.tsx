"use client";

import { useEffect, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  getStudentStatuses,
  createStudentStatus,
  updateStudentStatus,
  deleteStudentStatus,
  type StudentStatus,
} from "@/lib/services/settingsService";
import styles from "../settings.module.css";

type StatusForm = {
  id?: number | null;
  code: string;
  name: string;
  description: string;
  color: string;
  active: boolean;
  maxStudyYears: string;
};

const emptyForm: StatusForm = {
  id: null,
  code: "",
  name: "",
  description: "",
  color: "green",
  active: true,
  maxStudyYears: "",
};

export default function StatusSettingsPage() {
  const [rows, setRows] = useState<StudentStatus[]>([]);
  const [formState, setFormState] = useState<StatusForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"info" | "warning" | "success">("info");

  const loadStatuses = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const data = await getStudentStatuses();
      setRows(data ?? []);
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถดึงข้อมูลสถานะได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatuses();
  }, []);

  const updateField = (key: keyof StatusForm, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setFormState(emptyForm);

  const handleEdit = (row: StudentStatus) => {
    setFormState({
      id: row.id ?? null,
      code: row.code ?? "",
      name: row.name ?? "",
      description: row.description ?? "",
      color: row.color ?? "green",
      active: Boolean(row.active),
      maxStudyYears: row.conditions?.maxStudyYears ? String(row.conditions.maxStudyYears) : "",
    });
  };

  const handleSave = async () => {
    if (!formState.code || !formState.name) {
      setMessageTone("warning");
      setMessage("กรุณากรอกรหัสและชื่อสถานะ");
      return;
    }

    const payload: StudentStatus = {
      code: formState.code,
      name: formState.name,
      description: formState.description,
      color: formState.color,
      active: formState.active,
      conditions: {
        maxStudyYears: formState.maxStudyYears ? Number(formState.maxStudyYears) : null,
      },
    };

    setLoading(true);
    setMessage(null);
    try {
      if (formState.id) {
        await updateStudentStatus(formState.id, { id: formState.id, ...payload });
        setMessageTone("success");
        setMessage("อัปเดตสถานะเรียบร้อยแล้ว");
      } else {
        await createStudentStatus(payload);
        setMessageTone("success");
        setMessage("เพิ่มสถานะเรียบร้อยแล้ว");
      }
      resetForm();
      await loadStatuses();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถบันทึกสถานะได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (row: StudentStatus) => {
    if (!row.id) return;

    setLoading(true);
    setMessage(null);
    try {
      await deleteStudentStatus(row.id);
      setMessageTone("success");
      setMessage("ลบสถานะเรียบร้อยแล้ว");
      await loadStatuses();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถลบสถานะได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>ตั้งค่าสถานะนักศึกษา</h1>
          <p className={styles.subtitle}>จัดการสถานะและเงื่อนไขการใช้งานของนักศึกษาในระบบ</p>
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
            <strong>{formState.id ? "แก้ไขสถานะ" : "เพิ่มสถานะใหม่"}</strong>
            <div className={styles.actions}>
              <button type="button" className={styles.button} onClick={resetForm}>
                ล้างฟอร์ม
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleSave}
                disabled={loading}
              >
                บันทึกสถานะ
              </button>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              รหัส
              <input
                className={styles.input}
                value={formState.code}
                onChange={(event) => updateField("code", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ชื่อสถานะ
              <input
                className={styles.input}
                value={formState.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              สี
              <input
                className={styles.input}
                value={formState.color}
                onChange={(event) => updateField("color", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ใช้งาน
              <select
                className={styles.select}
                value={formState.active ? "true" : "false"}
                onChange={(event) => updateField("active", event.target.value === "true")}
              >
                <option value="true">ใช้งาน</option>
                <option value="false">ปิดใช้</option>
              </select>
            </label>
            <label className={styles.field}>
              ปีการศึกษาสูงสุด (ถ้ามี)
              <input
                type="number"
                className={styles.input}
                value={formState.maxStudyYears}
                onChange={(event) => updateField("maxStudyYears", event.target.value)}
              />
            </label>
          </div>

          <label className={styles.field}>
            คำอธิบาย
            <textarea
              className={styles.textarea}
              value={formState.description}
              onChange={(event) => updateField("description", event.target.value)}
            />
          </label>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <strong>รายการสถานะนักศึกษา</strong>
            <button type="button" className={styles.button} onClick={loadStatuses} disabled={loading}>
              รีเฟรช
            </button>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>สถานะ</th>
                  <th>คำอธิบาย</th>
                  <th>เงื่อนไขปีการศึกษา</th>
                  <th>ใช้งาน</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id ?? row.code}>
                    <td>{row.code}</td>
                    <td>{row.name}</td>
                    <td>{row.description}</td>
                    <td>{row.conditions?.maxStudyYears ? `<= ${row.conditions.maxStudyYears} ปี` : "-"}</td>
                    <td>
                      <span className={`${styles.badge} ${row.active ? styles.badgeSuccess : styles.badgeMuted}`}>
                        {row.active ? "ใช้งาน" : "ปิดใช้"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button type="button" className={styles.button} onClick={() => handleEdit(row)}>
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.buttonDanger}`}
                          onClick={() => handleDelete(row)}
                        >
                          ลบ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </RoleGuard>
  );
}
