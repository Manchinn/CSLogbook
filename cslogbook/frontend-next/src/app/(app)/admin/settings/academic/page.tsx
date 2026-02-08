"use client";

import { useEffect, useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import {
  getAcademicSettings,
  createAcademicSettings,
  updateAcademicSettings,
  listAcademicSchedules,
  createAcademicSchedule,
  updateAcademicSchedule,
  activateAcademicSchedule,
  getCurriculums,
  type AcademicSettings,
  type AcademicSchedule,
  type CurriculumRecord,
} from "@/lib/services/settingsService";
import {
  listImportantDeadlines,
  createImportantDeadline,
  updateImportantDeadline,
  updateDeadlinePolicy,
  deleteImportantDeadline,
  getImportantDeadlineStats,
  type ImportantDeadline,
} from "@/lib/services/importantDeadlineService";
import styles from "../settings.module.css";

type ScheduleFormState = {
  id?: number | null;
  academicYear: string;
  currentSemester: string;
  status: string;
  activeCurriculumId: string;
  semester1Start: string;
  semester1End: string;
  semester2Start: string;
  semester2End: string;
  semester3Start: string;
  semester3End: string;
  internshipStart: string;
  internshipEnd: string;
  projectStart: string;
  projectEnd: string;
  internshipSemesters: string;
  projectSemesters: string;
};

type DeadlineFormState = {
  id?: number | null;
  name: string;
  relatedTo: string;
  academicYear: string;
  semester: string;
  deadlineDate: string;
  deadlineTime: string;
  allowLate: boolean;
  gracePeriodMinutes: string;
  lockAfterDeadline: boolean;
  visibilityScope: string;
  isPublished: boolean;
  publishAt: string;
  windowStartDate: string;
  windowStartTime: string;
  windowEndDate: string;
  windowEndTime: string;
};

const emptyScheduleForm: ScheduleFormState = {
  id: null,
  academicYear: "",
  currentSemester: "",
  status: "draft",
  activeCurriculumId: "",
  semester1Start: "",
  semester1End: "",
  semester2Start: "",
  semester2End: "",
  semester3Start: "",
  semester3End: "",
  internshipStart: "",
  internshipEnd: "",
  projectStart: "",
  projectEnd: "",
  internshipSemesters: "",
  projectSemesters: "",
};

const emptyDeadlineForm: DeadlineFormState = {
  id: null,
  name: "",
  relatedTo: "project",
  academicYear: "",
  semester: "",
  deadlineDate: "",
  deadlineTime: "",
  allowLate: false,
  gracePeriodMinutes: "",
  lockAfterDeadline: false,
  visibilityScope: "ALL",
  isPublished: true,
  publishAt: "",
  windowStartDate: "",
  windowStartTime: "",
  windowEndDate: "",
  windowEndTime: "",
};

const getCurriculumId = (curriculum: CurriculumRecord) =>
  curriculum.curriculumId ?? curriculum.id ?? curriculum.curriculumID ?? null;

const toNumber = (value: string) => (value === "" ? null : Number(value));

const buildRange = (start: string, end: string) =>
  start && end ? { start, end } : null;

const buildRegistration = (start: string, end: string) =>
  start && end ? { startDate: start, endDate: end } : null;

const parseSemesterList = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item));

const formatRangeInputs = (range?: { start?: string | null; end?: string | null } | null) => ({
  start: range?.start ?? "",
  end: range?.end ?? "",
});

const formatRegistrationInputs = (range?: { startDate?: string | null; endDate?: string | null } | null) => ({
  start: range?.startDate ?? "",
  end: range?.endDate ?? "",
});

export default function AcademicSettingsPage() {
  const [currentSettings, setCurrentSettings] = useState<AcademicSettings | null>(null);
  const [scheduleForm, setScheduleForm] = useState<ScheduleFormState>(emptyScheduleForm);
  const [schedules, setSchedules] = useState<AcademicSchedule[]>([]);
  const [curriculums, setCurriculums] = useState<CurriculumRecord[]>([]);
  const [deadlines, setDeadlines] = useState<ImportantDeadline[]>([]);
  const [deadlineForm, setDeadlineForm] = useState<DeadlineFormState>(emptyDeadlineForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"info" | "warning" | "success">("info");
  const [deadlineStats, setDeadlineStats] = useState<Record<string, unknown> | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [deadlineIssues, setDeadlineIssues] = useState<string[]>([]);

  const loadSchedules = async () => {
    const data = await listAcademicSchedules();
    setSchedules(data ?? []);
  };

  const loadCurrent = async () => {
    try {
      const data = await getAcademicSettings();
      setCurrentSettings(data ?? null);
      if (data) {
        const sem1 = formatRangeInputs(data.semester1Range ?? null);
        const sem2 = formatRangeInputs(data.semester2Range ?? null);
        const sem3 = formatRangeInputs(data.semester3Range ?? null);
        const internship = formatRegistrationInputs(data.internshipRegistration ?? null);
        const project = formatRegistrationInputs(data.projectRegistration ?? null);

        setScheduleForm({
          id: data.id ?? null,
          academicYear: data.academicYear ? String(data.academicYear) : "",
          currentSemester: data.currentSemester ? String(data.currentSemester) : "",
          status: data.status ?? "draft",
          activeCurriculumId: data.activeCurriculumId ? String(data.activeCurriculumId) : "",
          semester1Start: sem1.start,
          semester1End: sem1.end,
          semester2Start: sem2.start,
          semester2End: sem2.end,
          semester3Start: sem3.start,
          semester3End: sem3.end,
          internshipStart: internship.start,
          internshipEnd: internship.end,
          projectStart: project.start,
          projectEnd: project.end,
          internshipSemesters: data.internshipSemesters?.join(", ") ?? "",
          projectSemesters: data.projectSemesters?.join(", ") ?? "",
        });
      }
    } catch (error) {
      setCurrentSettings(null);
    }
  };

  const loadCurriculums = async () => {
    try {
      const data = await getCurriculums();
      setCurriculums(data);
    } catch {
      setCurriculums([]);
    }
  };

  const loadDeadlines = async (filters: { academicYear?: string; semester?: string } = {}) => {
    const params: Record<string, unknown> = {};
    if (filters.academicYear) params.academicYear = filters.academicYear;
    if (filters.semester) params.semester = filters.semester;

    const data = await listImportantDeadlines(params);
    setDeadlines(data ?? []);
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setMessage(null);
      try {
        await Promise.all([loadCurrent(), loadSchedules(), loadCurriculums(), loadDeadlines()]);
      } catch (error) {
        setMessageTone("warning");
        setMessage(error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลได้");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    const issues: string[] = [];
    if (!scheduleForm.activeCurriculumId) {
      issues.push("กรุณาเลือกหลักสูตรที่ใช้งาน");
    }
    if (!scheduleForm.academicYear) {
      issues.push("กรุณาระบุปีการศึกษา");
    }
    if (!scheduleForm.currentSemester) {
      issues.push("กรุณาระบุภาคเรียนปัจจุบัน");
    }

    const ranges = [
      { label: "ภาคเรียน 1", start: scheduleForm.semester1Start, end: scheduleForm.semester1End },
      { label: "ภาคเรียน 2", start: scheduleForm.semester2Start, end: scheduleForm.semester2End },
      { label: "ภาคฤดูร้อน", start: scheduleForm.semester3Start, end: scheduleForm.semester3End },
      { label: "ลงทะเบียนฝึกงาน", start: scheduleForm.internshipStart, end: scheduleForm.internshipEnd },
      { label: "ลงทะเบียนโครงงาน", start: scheduleForm.projectStart, end: scheduleForm.projectEnd },
    ];

    ranges.forEach((range) => {
      if (range.start && !range.end) {
        issues.push(`${range.label}: กรุณาระบุวันสิ้นสุด`);
      }
      if (!range.start && range.end) {
        issues.push(`${range.label}: กรุณาระบุวันเริ่มต้น`);
      }
      if (range.start && range.end && range.start > range.end) {
        issues.push(`${range.label}: วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น`);
      }
    });

    setValidationIssues(issues);
  }, [
    scheduleForm.activeCurriculumId,
    scheduleForm.academicYear,
    scheduleForm.currentSemester,
    scheduleForm.semester1Start,
    scheduleForm.semester1End,
    scheduleForm.semester2Start,
    scheduleForm.semester2End,
    scheduleForm.semester3Start,
    scheduleForm.semester3End,
    scheduleForm.internshipStart,
    scheduleForm.internshipEnd,
    scheduleForm.projectStart,
    scheduleForm.projectEnd,
  ]);

  useEffect(() => {
    const issues: string[] = [];
    if (!deadlineForm.name) {
      issues.push("กรุณากรอกชื่อกำหนดการ");
    }
    if (deadlineForm.deadlineDate && !deadlineForm.deadlineTime) {
      issues.push("กำหนดเวลาสำหรับวันครบกำหนด");
    }
    if (!deadlineForm.deadlineDate && deadlineForm.deadlineTime) {
      issues.push("กำหนดวันที่สำหรับวันครบกำหนด");
    }
    if (deadlineForm.windowStartDate && deadlineForm.windowEndDate) {
      if (deadlineForm.windowStartDate > deadlineForm.windowEndDate) {
        issues.push("หน้าต่างเปิดส่ง: วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น");
      }
    }
    if (deadlineForm.allowLate && deadlineForm.gracePeriodMinutes === "") {
      issues.push("กรุณาระบุ grace period เมื่อตั้งค่าอนุญาตส่งล่าช้า");
    }

    setDeadlineIssues(issues);
  }, [
    deadlineForm.name,
    deadlineForm.deadlineDate,
    deadlineForm.deadlineTime,
    deadlineForm.windowStartDate,
    deadlineForm.windowEndDate,
    deadlineForm.allowLate,
    deadlineForm.gracePeriodMinutes,
  ]);

  const handleScheduleField = (key: keyof ScheduleFormState, value: string) => {
    setScheduleForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleDeadlineField = (key: keyof DeadlineFormState, value: string | boolean) => {
    setDeadlineForm((prev) => ({ ...prev, [key]: value }));
  };

  const schedulePayload = () => {
    const semester1Range = buildRange(scheduleForm.semester1Start, scheduleForm.semester1End);
    const semester2Range = buildRange(scheduleForm.semester2Start, scheduleForm.semester2End);
    const semester3Range = buildRange(scheduleForm.semester3Start, scheduleForm.semester3End);
    const internshipRegistration = buildRegistration(scheduleForm.internshipStart, scheduleForm.internshipEnd);
    const projectRegistration = buildRegistration(scheduleForm.projectStart, scheduleForm.projectEnd);

    return {
      id: scheduleForm.id ?? undefined,
      academicYear: toNumber(scheduleForm.academicYear),
      currentSemester: toNumber(scheduleForm.currentSemester),
      status: scheduleForm.status || undefined,
      activeCurriculumId: toNumber(scheduleForm.activeCurriculumId),
      semester1Range,
      semester2Range,
      semester3Range,
      internshipRegistration,
      projectRegistration,
      internshipSemesters: parseSemesterList(scheduleForm.internshipSemesters),
      projectSemesters: parseSemesterList(scheduleForm.projectSemesters),
    };
  };

  const handleSaveCurrent = async () => {
    if (validationIssues.length > 0) {
      setMessageTone("warning");
      setMessage("กรุณาแก้ไขข้อมูลปีการศึกษาก่อนบันทึก");
      return;
    }
    if (!scheduleForm.id) {
      setMessageTone("warning");
      setMessage("ไม่พบข้อมูลปีการศึกษาปัจจุบันสำหรับอัปเดต");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await updateAcademicSettings(schedulePayload());
      setMessageTone("success");
      setMessage("อัปเดตปีการศึกษาปัจจุบันเรียบร้อยแล้ว");
      await Promise.all([loadCurrent(), loadSchedules()]);
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถอัปเดตข้อมูลได้");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async () => {
    if (validationIssues.length > 0) {
      setMessageTone("warning");
      setMessage("กรุณาแก้ไขข้อมูลปีการศึกษาก่อนสร้าง");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      await createAcademicSchedule(schedulePayload());
      setMessageTone("success");
      setMessage("สร้างปีการศึกษาใหม่เรียบร้อยแล้ว");
      await loadSchedules();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถสร้างปีการศึกษาได้");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchedule = async () => {
    if (validationIssues.length > 0) {
      setMessageTone("warning");
      setMessage("กรุณาแก้ไขข้อมูลปีการศึกษาก่อนอัปเดต");
      return;
    }
    if (!scheduleForm.id) {
      setMessageTone("warning");
      setMessage("กรุณาเลือกปีการศึกษาที่ต้องการแก้ไข");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      await updateAcademicSchedule(scheduleForm.id, schedulePayload());
      setMessageTone("success");
      setMessage("อัปเดตปีการศึกษาเรียบร้อยแล้ว");
      await loadSchedules();
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถอัปเดตปีการศึกษาได้");
    } finally {
      setLoading(false);
    }
  };

  const handleActivateSchedule = async (id: number) => {
    setLoading(true);
    setMessage(null);
    try {
      await activateAcademicSchedule(id);
      setMessageTone("success");
      setMessage("ตั้งปีการศึกษานี้เป็น Active แล้ว");
      await Promise.all([loadCurrent(), loadSchedules()]);
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถ Activate ปีการศึกษาได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDeadlineSave = async () => {
    if (deadlineIssues.length > 0) {
      setMessageTone("warning");
      setMessage("กรุณาแก้ไขข้อมูลกำหนดการก่อนบันทึก");
      return;
    }
    if (!deadlineForm.name) {
      setMessageTone("warning");
      setMessage("กรุณากรอกชื่อกำหนดการ");
      return;
    }

    const payload = {
      name: deadlineForm.name,
      relatedTo: deadlineForm.relatedTo,
      academicYear: toNumber(deadlineForm.academicYear),
      semester: toNumber(deadlineForm.semester),
      deadlineDate: deadlineForm.deadlineDate || undefined,
      deadlineTime: deadlineForm.deadlineTime || undefined,
      allowLate: deadlineForm.allowLate,
      gracePeriodMinutes: toNumber(deadlineForm.gracePeriodMinutes),
      lockAfterDeadline: deadlineForm.lockAfterDeadline,
      visibilityScope: deadlineForm.visibilityScope,
      isPublished: deadlineForm.isPublished,
      publishAt: deadlineForm.publishAt || undefined,
      windowStartDate: deadlineForm.windowStartDate || undefined,
      windowStartTime: deadlineForm.windowStartTime || undefined,
      windowEndDate: deadlineForm.windowEndDate || undefined,
      windowEndTime: deadlineForm.windowEndTime || undefined,
    };

    setLoading(true);
    setMessage(null);
    try {
      if (deadlineForm.id) {
        await updateImportantDeadline(deadlineForm.id, payload);
        await updateDeadlinePolicy(deadlineForm.id, {
          allowLate: deadlineForm.allowLate,
          gracePeriodMinutes: toNumber(deadlineForm.gracePeriodMinutes),
          lockAfterDeadline: deadlineForm.lockAfterDeadline,
        });
        setMessageTone("success");
        setMessage("อัปเดตกำหนดการสำเร็จ");
      } else {
        await createImportantDeadline(payload);
        setMessageTone("success");
        setMessage("สร้างกำหนดการสำเร็จ");
      }
      setDeadlineForm(emptyDeadlineForm);
      await loadDeadlines({
        academicYear: deadlineForm.academicYear,
        semester: deadlineForm.semester,
      });
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถบันทึกกำหนดการได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDeadlineEdit = (deadline: ImportantDeadline) => {
    setDeadlineForm({
      id: deadline.id,
      name: deadline.name,
      relatedTo: deadline.relatedTo ?? "project",
      academicYear: deadline.academicYear ? String(deadline.academicYear) : "",
      semester: deadline.semester ? String(deadline.semester) : "",
      deadlineDate: deadline.deadlineDate ?? "",
      deadlineTime: deadline.deadlineTime ?? "",
      allowLate: Boolean(deadline.allowLate),
      gracePeriodMinutes: deadline.gracePeriodMinutes ? String(deadline.gracePeriodMinutes) : "",
      lockAfterDeadline: Boolean(deadline.lockAfterDeadline),
      visibilityScope: deadline.visibilityScope ?? "ALL",
      isPublished: deadline.isPublished ?? true,
      publishAt: deadline.publishAt ?? "",
      windowStartDate: deadline.windowStartDate ?? "",
      windowStartTime: deadline.windowStartTime ?? "",
      windowEndDate: deadline.windowEndDate ?? "",
      windowEndTime: deadline.windowEndTime ?? "",
    });
  };

  const handleDeadlineDelete = async (id: number) => {
    setLoading(true);
    setMessage(null);
    try {
      await deleteImportantDeadline(id);
      setMessageTone("success");
      setMessage("ลบกำหนดการสำเร็จ");
      await loadDeadlines({
        academicYear: deadlineForm.academicYear,
        semester: deadlineForm.semester,
      });
    } catch (error) {
      setMessageTone("warning");
      setMessage(error instanceof Error ? error.message : "ไม่สามารถลบกำหนดการได้");
    } finally {
      setLoading(false);
    }
  };

  const handleDeadlineStats = async (id: number) => {
    try {
      const stats = await getImportantDeadlineStats(id);
      setDeadlineStats(stats ?? null);
    } catch {
      setDeadlineStats(null);
    }
  };

  const currentScheduleLabel = useMemo(() => {
    if (!currentSettings) return "ยังไม่กำหนดปีการศึกษาปัจจุบัน";
    return `ปีการศึกษา ${currentSettings.academicYear ?? "-"} / ภาคเรียน ${currentSettings.currentSemester ?? "-"}`;
  }, [currentSettings]);

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>ตั้งค่าปีการศึกษาและกำหนดการ</h1>
          <p className={styles.subtitle}>บริหารปีการศึกษา ตารางเวลา และกำหนดการสำคัญของระบบ</p>
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
            <strong>ปีการศึกษาปัจจุบัน</strong>
            <span className={styles.badge}>{currentScheduleLabel}</span>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Wizard (Legacy Flow)</div>
            <div className={styles.cardMeta}>1) เลือกหลักสูตร/ปีการศึกษา 2) ตั้งช่วงภาคเรียน 3) ตั้งช่วงลงทะเบียน</div>
            {validationIssues.length > 0 ? (
              <ul className={styles.cardMeta}>
                {validationIssues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            ) : (
              <div className={styles.cardMeta}>ข้อมูลครบถ้วน พร้อมบันทึก</div>
            )}
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              ปีการศึกษา
              <input
                type="number"
                className={styles.input}
                value={scheduleForm.academicYear}
                onChange={(event) => handleScheduleField("academicYear", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ภาคเรียนปัจจุบัน
              <input
                type="number"
                className={styles.input}
                value={scheduleForm.currentSemester}
                onChange={(event) => handleScheduleField("currentSemester", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              หลักสูตรที่ใช้งาน
              <select
                className={styles.select}
                value={scheduleForm.activeCurriculumId}
                onChange={(event) => handleScheduleField("activeCurriculumId", event.target.value)}
              >
                <option value="">เลือกหลักสูตร</option>
                {curriculums.map((curriculum) => {
                  const id = getCurriculumId(curriculum);
                  return (
                    <option key={id ?? curriculum.code} value={id ?? ""}>
                      {curriculum.code ?? "-"} - {curriculum.shortName ?? curriculum.name ?? "-"}
                    </option>
                  );
                })}
              </select>
            </label>
            <label className={styles.field}>
              สถานะ
              <select
                className={styles.select}
                value={scheduleForm.status}
                onChange={(event) => handleScheduleField("status", event.target.value)}
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="active">Active</option>
              </select>
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              ภาคเรียน 1 (เริ่ม)
              <input
                type="date"
                className={styles.input}
                value={scheduleForm.semester1Start}
                onChange={(event) => handleScheduleField("semester1Start", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ภาคเรียน 1 (สิ้นสุด)
              <input
                type="date"
                className={styles.input}
                value={scheduleForm.semester1End}
                onChange={(event) => handleScheduleField("semester1End", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ภาคเรียน 2 (เริ่ม)
              <input
                type="date"
                className={styles.input}
                value={scheduleForm.semester2Start}
                onChange={(event) => handleScheduleField("semester2Start", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ภาคเรียน 2 (สิ้นสุด)
              <input
                type="date"
                className={styles.input}
                value={scheduleForm.semester2End}
                onChange={(event) => handleScheduleField("semester2End", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ภาคฤดูร้อน (เริ่ม)
              <input
                type="date"
                className={styles.input}
                value={scheduleForm.semester3Start}
                onChange={(event) => handleScheduleField("semester3Start", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ภาคฤดูร้อน (สิ้นสุด)
              <input
                type="date"
                className={styles.input}
                value={scheduleForm.semester3End}
                onChange={(event) => handleScheduleField("semester3End", event.target.value)}
              />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              ลงทะเบียนฝึกงาน (เริ่ม)
              <input
                type="date"
                className={styles.input}
                value={scheduleForm.internshipStart}
                onChange={(event) => handleScheduleField("internshipStart", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ลงทะเบียนฝึกงาน (สิ้นสุด)
              <input
                type="date"
                className={styles.input}
                value={scheduleForm.internshipEnd}
                onChange={(event) => handleScheduleField("internshipEnd", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ลงทะเบียนโครงงาน (เริ่ม)
              <input
                type="date"
                className={styles.input}
                value={scheduleForm.projectStart}
                onChange={(event) => handleScheduleField("projectStart", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ลงทะเบียนโครงงาน (สิ้นสุด)
              <input
                type="date"
                className={styles.input}
                value={scheduleForm.projectEnd}
                onChange={(event) => handleScheduleField("projectEnd", event.target.value)}
              />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              ภาคเรียนที่อนุญาตฝึกงาน (เช่น 1,2)
              <input
                className={styles.input}
                value={scheduleForm.internshipSemesters}
                onChange={(event) => handleScheduleField("internshipSemesters", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ภาคเรียนที่อนุญาตโครงงาน (เช่น 1,2)
              <input
                className={styles.input}
                value={scheduleForm.projectSemesters}
                onChange={(event) => handleScheduleField("projectSemesters", event.target.value)}
              />
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.button} onClick={() => setScheduleForm(emptyScheduleForm)}>
              ล้างฟอร์ม
            </button>
            <button type="button" className={styles.button} onClick={handleCreateSchedule} disabled={loading}>
              สร้างปีการศึกษาใหม่
            </button>
            <button type="button" className={styles.button} onClick={handleUpdateSchedule} disabled={loading}>
              อัปเดตรายการที่เลือก
            </button>
            <button
              type="button"
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={handleSaveCurrent}
              disabled={loading}
            >
              บันทึกเป็นปีปัจจุบัน
            </button>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <strong>รายการปีการศึกษา</strong>
            <button type="button" className={styles.button} onClick={loadSchedules} disabled={loading}>
              รีเฟรช
            </button>
          </div>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ปีการศึกษา</th>
                  <th>ภาคเรียน</th>
                  <th>สถานะ</th>
                  <th>หลักสูตร</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td>{schedule.academicYear ?? "-"}</td>
                    <td>{schedule.currentSemester ?? "-"}</td>
                    <td>
                      <span className={`${styles.badge} ${schedule.status === "active" ? styles.badgeSuccess : styles.badgeMuted}`}>
                        {schedule.status ?? "draft"}
                      </span>
                    </td>
                    <td>{schedule.activeCurriculumId ?? "-"}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => {
                            setScheduleForm({
                              id: schedule.id,
                              academicYear: schedule.academicYear ? String(schedule.academicYear) : "",
                              currentSemester: schedule.currentSemester ? String(schedule.currentSemester) : "",
                              status: schedule.status ?? "draft",
                              activeCurriculumId: schedule.activeCurriculumId ? String(schedule.activeCurriculumId) : "",
                              semester1Start: schedule.semester1Range?.start ?? "",
                              semester1End: schedule.semester1Range?.end ?? "",
                              semester2Start: schedule.semester2Range?.start ?? "",
                              semester2End: schedule.semester2Range?.end ?? "",
                              semester3Start: schedule.semester3Range?.start ?? "",
                              semester3End: schedule.semester3Range?.end ?? "",
                              internshipStart: schedule.internshipRegistration?.startDate ?? "",
                              internshipEnd: schedule.internshipRegistration?.endDate ?? "",
                              projectStart: schedule.projectRegistration?.startDate ?? "",
                              projectEnd: schedule.projectRegistration?.endDate ?? "",
                              internshipSemesters: schedule.internshipSemesters?.join(", ") ?? "",
                              projectSemesters: schedule.projectSemesters?.join(", ") ?? "",
                            });
                          }}
                        >
                          โหลด
                        </button>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.buttonPrimary}`}
                          onClick={() => handleActivateSchedule(schedule.id)}
                        >
                          Activate
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
            <strong>กำหนดการสำคัญ</strong>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.button}
                onClick={() => loadDeadlines({ academicYear: deadlineForm.academicYear, semester: deadlineForm.semester })}
                disabled={loading}
              >
                รีเฟรช
              </button>
              <button type="button" className={styles.button} onClick={() => setDeadlineForm(emptyDeadlineForm)}>
                ล้างฟอร์ม
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={handleDeadlineSave}
                disabled={loading}
              >
                บันทึกกำหนดการ
              </button>
            </div>
          </div>

          {deadlineIssues.length > 0 ? (
            <div className={`${styles.alert} ${styles.alertWarning}`}>
              {deadlineIssues.join(" / ")}
            </div>
          ) : null}

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              ชื่อกำหนดการ
              <input
                className={styles.input}
                value={deadlineForm.name}
                onChange={(event) => handleDeadlineField("name", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              หมวด
              <select
                className={styles.select}
                value={deadlineForm.relatedTo}
                onChange={(event) => handleDeadlineField("relatedTo", event.target.value)}
              >
                <option value="project">โครงงาน</option>
                <option value="project1">Project 1</option>
                <option value="project2">Project 2</option>
                <option value="internship">ฝึกงาน</option>
                <option value="general">ทั่วไป</option>
              </select>
            </label>
            <label className={styles.field}>
              ปีการศึกษา
              <input
                type="number"
                className={styles.input}
                value={deadlineForm.academicYear}
                onChange={(event) => handleDeadlineField("academicYear", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ภาคเรียน
              <input
                type="number"
                className={styles.input}
                value={deadlineForm.semester}
                onChange={(event) => handleDeadlineField("semester", event.target.value)}
              />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              วันครบกำหนด
              <input
                type="date"
                className={styles.input}
                value={deadlineForm.deadlineDate}
                onChange={(event) => handleDeadlineField("deadlineDate", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              เวลา
              <input
                type="time"
                className={styles.input}
                value={deadlineForm.deadlineTime}
                onChange={(event) => handleDeadlineField("deadlineTime", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              เผยแพร่
              <select
                className={styles.select}
                value={deadlineForm.isPublished ? "true" : "false"}
                onChange={(event) => handleDeadlineField("isPublished", event.target.value === "true")}
              >
                <option value="true">เผยแพร่</option>
                <option value="false">ยังไม่เผยแพร่</option>
              </select>
            </label>
            <label className={styles.field}>
              Publish At (optional)
              <input
                type="datetime-local"
                className={styles.input}
                value={deadlineForm.publishAt}
                onChange={(event) => handleDeadlineField("publishAt", event.target.value)}
              />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              หน้าต่างเปิดส่ง (เริ่ม)
              <input
                type="date"
                className={styles.input}
                value={deadlineForm.windowStartDate}
                onChange={(event) => handleDeadlineField("windowStartDate", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              เวลาเริ่ม
              <input
                type="time"
                className={styles.input}
                value={deadlineForm.windowStartTime}
                onChange={(event) => handleDeadlineField("windowStartTime", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              หน้าต่างเปิดส่ง (สิ้นสุด)
              <input
                type="date"
                className={styles.input}
                value={deadlineForm.windowEndDate}
                onChange={(event) => handleDeadlineField("windowEndDate", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              เวลาสิ้นสุด
              <input
                type="time"
                className={styles.input}
                value={deadlineForm.windowEndTime}
                onChange={(event) => handleDeadlineField("windowEndTime", event.target.value)}
              />
            </label>
          </div>

          <div className={styles.fieldRow}>
            <label className={styles.field}>
              อนุญาตส่งล่าช้า
              <select
                className={styles.select}
                value={deadlineForm.allowLate ? "true" : "false"}
                onChange={(event) => handleDeadlineField("allowLate", event.target.value === "true")}
              >
                <option value="true">อนุญาต</option>
                <option value="false">ไม่อนุญาต</option>
              </select>
            </label>
            <label className={styles.field}>
              Grace Period (นาที)
              <input
                type="number"
                className={styles.input}
                value={deadlineForm.gracePeriodMinutes}
                onChange={(event) => handleDeadlineField("gracePeriodMinutes", event.target.value)}
              />
            </label>
            <label className={styles.field}>
              ปิดรับหลังหมดเวลา
              <select
                className={styles.select}
                value={deadlineForm.lockAfterDeadline ? "true" : "false"}
                onChange={(event) => handleDeadlineField("lockAfterDeadline", event.target.value === "true")}
              >
                <option value="true">ปิดรับ</option>
                <option value="false">ไม่ปิดรับ</option>
              </select>
            </label>
            <label className={styles.field}>
              การมองเห็น
              <select
                className={styles.select}
                value={deadlineForm.visibilityScope}
                onChange={(event) => handleDeadlineField("visibilityScope", event.target.value)}
              >
                <option value="ALL">ทั้งหมด</option>
                <option value="INTERNSHIP_ONLY">ฝึกงานเท่านั้น</option>
                <option value="PROJECT_ONLY">โครงงานเท่านั้น</option>
              </select>
            </label>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ชื่อ</th>
                  <th>หมวด</th>
                  <th>กำหนดส่ง</th>
                  <th>สถานะ</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {deadlines.map((deadline) => (
                  <tr key={deadline.id}>
                    <td>{deadline.name}</td>
                    <td>{deadline.relatedTo ?? "-"}</td>
                    <td>{deadline.deadlineDate ?? "-"}</td>
                    <td>
                      <span className={styles.badge}>{deadline.status ?? "-"}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button type="button" className={styles.button} onClick={() => handleDeadlineEdit(deadline)}>
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          className={styles.button}
                          onClick={() => handleDeadlineStats(deadline.id)}
                        >
                          ดูสถิติ
                        </button>
                        <button
                          type="button"
                          className={`${styles.button} ${styles.buttonDanger}`}
                          onClick={() => handleDeadlineDelete(deadline.id)}
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

          {deadlineStats ? (
            <div className={styles.card}>
              <div className={styles.cardTitle}>สถิติการส่งเอกสาร</div>
              <pre className={styles.cardMeta}>{JSON.stringify(deadlineStats, null, 2)}</pre>
            </div>
          ) : null}
        </section>

      </div>
    </RoleGuard>
  );
}
