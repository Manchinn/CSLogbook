"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  getCurriculums,
  createCurriculum,
  updateCurriculum,
  deleteCurriculum,
  getCurriculumMappings,
  type CurriculumRecord,
} from "@/lib/services/settingsService";
import styles from "../settings.module.css";

type CurriculumFormState = {
  id?: number | null;
  code: string;
  name: string;
  shortName: string;
  startYear: number | "";
  endYear: number | "";
  active: boolean;
  maxCredits: number | "";
  totalCredits: number | "";
  majorCredits: number | "";
  internshipBaseCredits: number | "";
  projectBaseCredits: number | "";
  projectMajorBaseCredits: number | "";
};

type CurriculumRow = {
  id?: number | null;
  code: string;
  name: string;
  shortName: string;
  startYear: string;
  endYear: string;
  active: boolean;
};

type CurriculumMappings = unknown[];

const emptyForm: CurriculumFormState = {
  id: null,
  code: "",
  name: "",
  shortName: "",
  startYear: "",
  endYear: "",
  active: true,
  maxCredits: "",
  totalCredits: "",
  majorCredits: "",
  internshipBaseCredits: "",
  projectBaseCredits: "",
  projectMajorBaseCredits: "",
};

const getCurriculumId = (curriculum: CurriculumRecord) =>
  curriculum.curriculumId ?? curriculum.id ?? curriculum.curriculumID ?? null;

const mapCurriculum = (curriculum: CurriculumRecord) => ({
  id: getCurriculumId(curriculum),
  code: curriculum.code ?? "",
  name: curriculum.name ?? "",
  shortName: curriculum.shortName ?? "",
  startYear: curriculum.startYear ?? (curriculum as Record<string, unknown>).start_year ?? null,
  endYear: curriculum.endYear ?? (curriculum as Record<string, unknown>).end_year ?? null,
  active: Boolean(curriculum.active),
  maxCredits: curriculum.maxCredits ?? (curriculum as Record<string, unknown>).max_credits ?? null,
  totalCredits: curriculum.totalCredits ?? (curriculum as Record<string, unknown>).total_credits ?? null,
  majorCredits: curriculum.majorCredits ?? (curriculum as Record<string, unknown>).major_credits ?? null,
  internshipBaseCredits:
    curriculum.internshipBaseCredits ?? (curriculum as Record<string, unknown>).internship_base_credits ?? null,
  projectBaseCredits:
    curriculum.projectBaseCredits ?? (curriculum as Record<string, unknown>).project_base_credits ?? null,
  projectMajorBaseCredits:
    curriculum.projectMajorBaseCredits ?? (curriculum as Record<string, unknown>).project_major_base_credits ?? null,
});

export default function CurriculumSettingsPage() {
  const [rows, setRows] = useState<ReturnType<typeof mapCurriculum>[]>([]);
  const [formState, setFormState] = useState<CurriculumFormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"info" | "warning" | "success">("info");
  const [mappings, setMappings] = useState<CurriculumMappings | null>(null);

  const rawRows = useMemo<CurriculumRow[]>(() => {
    if (!mappings) return [];
    return mappings.map((item) => {
      const record = item as Record<string, unknown>;
      const idValue = record.curriculumId ?? record.id ?? record.curriculumID ?? null;
      return {
        id: typeof idValue === "number" ? idValue : null,
        code: String(record.code ?? "-"),
        name: String(record.name ?? "-"),
        shortName: String(record.shortName ?? record.short_name ?? "-"),
        startYear: String(record.startYear ?? record.start_year ?? "-"),
        endYear: String(record.endYear ?? record.end_year ?? "ปัจจุบัน"),
        active: Boolean(record.active),
      };
    });
  }, [mappings]);

  const rawRowMap = useMemo(() => {
    const map = new Map<string, CurriculumRow>();
    rawRows.forEach((row) => {
      if (row.id != null) {
        map.set(`id:${row.id}`, row);
      }
      if (row.code) {
        map.set(`code:${row.code}`, row);
      }
    });
    return map;
  }, [rawRows]);

  const listRows = useMemo<CurriculumRow[]>(() => {
    if (!rows.length && rawRows.length) {
      return rawRows;
    }
    return rows.map((row) => {
      const raw =
        (row.id != null ? rawRowMap.get(`id:${row.id}`) : null) ?? rawRowMap.get(`code:${row.code}`) ?? null;
      return {
        id: row.id ?? raw?.id ?? null,
        code: raw?.code ?? row.code,
        name: raw?.name ?? row.name,
        shortName: raw?.shortName ?? (row.shortName || "-"),
        startYear: raw?.startYear ?? String(row.startYear ?? "-"),
        endYear: raw?.endYear ?? String(row.endYear ?? "ปัจจุบัน"),
        active: raw?.active ?? row.active,
      };
    });
  }, [rawRowMap, rawRows, rows]);

  const editableRowMap = useMemo(() => {
    const map = new Map<string, ReturnType<typeof mapCurriculum>>();
    rows.forEach((row) => {
      if (row.id != null) {
        map.set(`id:${row.id}`, row);
      }
      if (row.code) {
        map.set(`code:${row.code}`, row);
      }
    });
    return map;
  }, [rows]);

  const activeCount = useMemo(() => rows.filter((row) => row.active).length, [rows]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    const [curriculumResult, mappingsResult] = await Promise.allSettled([
      getCurriculums(),
      getCurriculumMappings(),
    ]);

    if (curriculumResult.status === "fulfilled") {
      setRows(curriculumResult.value.map(mapCurriculum));
    } else {
      setMessageTone("warning");
      setMessage(
        curriculumResult.reason instanceof Error
          ? curriculumResult.reason.message
          : "ไม่สามารถดึงข้อมูลหลักสูตรได้"
      );
    }

    if (mappingsResult.status === "fulfilled") {
      const mappingData = mappingsResult.value;
      setMappings(Array.isArray(mappingData) ? mappingData : null);
    } else {
      setMappings(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const updateField = <Key extends keyof CurriculumFormState>(key: Key, value: CurriculumFormState[Key]) => {
    setFormState((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetForm = () => {
    setFormState(emptyForm);
  };

  const handleEdit = (row: ReturnType<typeof mapCurriculum>) => {
    setFormState({
      id: row.id ?? null,
      code: row.code,
      name: row.name,
      shortName: row.shortName ?? "",
      startYear: (row.startYear ?? "") as number | "",
      endYear: (row.endYear ?? "") as number | "",
      active: row.active,
      maxCredits: (row.maxCredits ?? "") as number | "",
      totalCredits: (row.totalCredits ?? "") as number | "",
      majorCredits: (row.majorCredits ?? "") as number | "",
      internshipBaseCredits: (row.internshipBaseCredits ?? "") as number | "",
      projectBaseCredits: (row.projectBaseCredits ?? "") as number | "",
      projectMajorBaseCredits: (row.projectMajorBaseCredits ?? "") as number | "",
    });
  };

  const handleSubmit = async () => {
    if (!formState.code || !formState.name) {
      setMessageTone("warning");
      setMessage("กรุณากรอกรหัสและชื่อหลักสูตร");
      return;
    }

    const toNullableNumber = (value: number | "") => (value === "" ? null : value);
    const toNullableString = (value: string) => (value.trim() ? value.trim() : null);

    setLoading(true);
    try {
      const payload = {
        code: formState.code,
        name: formState.name,
        shortName: toNullableString(formState.shortName),
        startYear: toNullableNumber(formState.startYear),
        endYear: toNullableNumber(formState.endYear),
        active: formState.active,
        maxCredits: toNullableNumber(formState.maxCredits),
        totalCredits: toNullableNumber(formState.totalCredits),
        majorCredits: toNullableNumber(formState.majorCredits),
        internshipBaseCredits: toNullableNumber(formState.internshipBaseCredits),
        projectBaseCredits: toNullableNumber(formState.projectBaseCredits),
        projectMajorBaseCredits: toNullableNumber(formState.projectMajorBaseCredits),
      };

      if (formState.id) {
        await updateCurriculum(formState.id, payload);
        setMessageTone("success");
        setMessage("อัปเดตหลักสูตรเรียบร้อยแล้ว");
      } else {
        await createCurriculum(payload);
        setMessageTone("success");
        setMessage("เพิ่มหลักสูตรเรียบร้อยแล้ว");
      }

      resetForm();
      await loadData();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลหลักสูตรได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id?: number | null) => {
    if (!id) return;

    const deleting = rows.find((row) => row.id === id);
    if (deleting?.active && activeCount <= 1) {
      setMessageTone("warning");
      setMessage("ต้องมีหลักสูตรที่เปิดใช้งานอย่างน้อย 1 อัน");
      return;
    }

    setLoading(true);
    try {
      await deleteCurriculum(id);
      setMessageTone("success");
      setMessage("ลบหลักสูตรเรียบร้อยแล้ว");
      await loadData();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถลบหลักสูตรได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>จัดการหลักสูตรการศึกษา</h1>
          <p className={styles.subtitle}>กำหนดและจัดการหลักสูตร รวมถึงเกณฑ์หน่วยกิตสำหรับฝึกงานและโครงงาน</p>
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
            <strong>{formState.id ? "แก้ไขหลักสูตร" : "เพิ่มหลักสูตรใหม่"}</strong>
            <div className={styles.actions}>
              <button type="button" className={styles.button} onClick={resetForm} disabled={loading}>
                ล้างฟอร์ม
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleSubmit}
                disabled={loading}
              >
                บันทึกหลักสูตร
              </button>
            </div>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              รหัสหลักสูตร
              <input
                className={styles.input}
                value={formState.code}
                onChange={(event) => updateField("code", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ชื่อหลักสูตร
              <input
                className={styles.input}
                value={formState.name}
                onChange={(event) => updateField("name", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ชื่อย่อ
              <input
                className={styles.input}
                value={formState.shortName}
                onChange={(event) => updateField("shortName", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ปีเริ่มต้น
              <input
                type="number"
                className={styles.input}
                value={formState.startYear}
                onChange={(event) => updateField("startYear", event.target.value ? Number(event.target.value) : "")}
              />
            </label>
            <label className={styles.field}>
              ปีสิ้นสุด
              <input
                type="number"
                className={styles.input}
                value={formState.endYear}
                onChange={(event) => updateField("endYear", event.target.value ? Number(event.target.value) : "")}
              />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              หน่วยกิตสูงสุด
              <input
                type="number"
                className={styles.input}
                value={formState.maxCredits}
                onChange={(event) => updateField("maxCredits", event.target.value ? Number(event.target.value) : "")}
              />
            </label>
            <label className={styles.field}>
              หน่วยกิตสะสมรวม
              <input
                type="number"
                className={styles.input}
                value={formState.totalCredits}
                onChange={(event) => updateField("totalCredits", event.target.value ? Number(event.target.value) : "")}
              />
            </label>
            <label className={styles.field}>
              หน่วยกิตวิชาเอก
              <input
                type="number"
                className={styles.input}
                value={formState.majorCredits}
                onChange={(event) => updateField("majorCredits", event.target.value ? Number(event.target.value) : "")}
              />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              หน่วยกิตฝึกงานขั้นต่ำ
              <input
                type="number"
                className={styles.input}
                value={formState.internshipBaseCredits}
                onChange={(event) =>
                  updateField("internshipBaseCredits", event.target.value ? Number(event.target.value) : "")
                }
              />
            </label>
            <label className={styles.field}>
              หน่วยกิตโครงงานขั้นต่ำ
              <input
                type="number"
                className={styles.input}
                value={formState.projectBaseCredits}
                onChange={(event) => updateField("projectBaseCredits", event.target.value ? Number(event.target.value) : "")}
              />
            </label>
            <label className={styles.field}>
              หน่วยกิตโครงงานเอกขั้นต่ำ
              <input
                type="number"
                className={styles.input}
                value={formState.projectMajorBaseCredits}
                onChange={(event) =>
                  updateField("projectMajorBaseCredits", event.target.value ? Number(event.target.value) : "")
                }
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
                <option value="false">ไม่ใช้งาน</option>
              </select>
            </label>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <strong>รายการหลักสูตร</strong>
            <button type="button" className={styles.button} onClick={loadData} disabled={loading}>
              รีเฟรช
            </button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อ</th>
                  <th>ชื่อย่อ</th>
                  <th>ปีเริ่มต้น</th>
                  <th>ปีสิ้นสุด</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {listRows.map((row) => {
                  const editableRow =
                    (row.id != null ? editableRowMap.get(`id:${row.id}`) : null) ??
                    editableRowMap.get(`code:${row.code}`) ??
                    null;
                  return (
                    <tr key={row.id ?? row.code}>
                      <td>{row.code}</td>
                      <td>{row.name}</td>
                      <td>{row.shortName}</td>
                      <td>{row.startYear}</td>
                      <td>{row.endYear}</td>
                      <td>
                        <span className={`${styles.badge} ${row.active ? styles.badgeSuccess : styles.badgeMuted}`}>
                          {row.active ? "ใช้งาน" : "ปิดใช้"}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            className={styles.button}
                            onClick={() => editableRow && handleEdit(editableRow)}
                            disabled={!editableRow}
                          >
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            className={`${styles.button} ${styles.buttonDanger}`}
                            onClick={() => editableRow && handleDelete(editableRow.id)}
                            disabled={!editableRow}
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!listRows.length ? <div className={styles.cardMeta}>ไม่พบข้อมูลหลักสูตร</div> : null}
          </div>
        </section>
      </div>
    </RoleGuard>
  );
}
