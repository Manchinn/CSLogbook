"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { labelStatus } from "@/lib/utils/statusLabels";
import {
  formatThaiDateTime,
  bangkokLocalInputToISO,
  isoToBangkokLocalInput,
  academicYearPlaceholder,
  validateBuddhistYear,
  ensureBuddhistYear,
} from "@/lib/utils/thaiDateUtils";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  getAcademicSettings,
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
import btn from "@/styles/shared/buttons.module.css";
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
  deadlineType: string;
  isCritical: boolean;
  acceptingSubmissions: boolean;
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
  deadlineType: "SUBMISSION",
  isCritical: false,
  acceptingSubmissions: true,
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);
  const [deadlineIssues, setDeadlineIssues] = useState<string[]>([]);

  const loadSchedules = useCallback(async () => {
    const data = await listAcademicSchedules();
    setSchedules(data ?? []);
  }, []);

  const loadCurrent = useCallback(async () => {
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
    } catch {
      setCurrentSettings(null);
    }
  }, []);

  const loadCurriculums = useCallback(async () => {
    try {
      // ดึงหลักสูตรทั้งหมด (รวม inactive) เพื่อให้สามารถเลือกเป็น activeCurriculumId ได้
      const data = await getCurriculums(false);
      setCurriculums(data);
    } catch {
      setCurriculums([]);
    }
  }, []);

  const loadDeadlines = useCallback(async (filters: { academicYear?: string; semester?: string } = {}) => {
    const params: Record<string, unknown> = {};
    if (filters.academicYear) params.academicYear = filters.academicYear;
    if (filters.semester) params.semester = filters.semester;

    const data = await listImportantDeadlines(params);
    setDeadlines(data ?? []);
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      setMessage(null);

      const results = await Promise.allSettled([
        loadCurrent(),
        loadSchedules(),
        loadCurriculums(),
        loadDeadlines(),
      ]);

      const rejected = results.find((result) => result.status === "rejected");
      if (rejected && rejected.status === "rejected") {
        setMessageTone("warning");
        setMessage(
          rejected.reason instanceof Error ? rejected.reason.message : "ไม่สามารถโหลดข้อมูลได้"
        );
      }

      setLoading(false);
    };

    void init();
  }, [loadCurrent, loadSchedules, loadCurriculums, loadDeadlines]);

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

    // ตรวจปีการศึกษา (พ.ศ.)
    if (scheduleForm.academicYear) {
      const yearErr = validateBuddhistYear(scheduleForm.academicYear);
      if (yearErr) issues.push(`ปีการศึกษา: ${yearErr}`);
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

    // ตรวจ overlap ระหว่างภาคเรียน 1/2/3
    const semesterRanges = [
      { label: "ภาคเรียน 1", start: scheduleForm.semester1Start, end: scheduleForm.semester1End },
      { label: "ภาคเรียน 2", start: scheduleForm.semester2Start, end: scheduleForm.semester2End },
      { label: "ภาคฤดูร้อน", start: scheduleForm.semester3Start, end: scheduleForm.semester3End },
    ];
    for (let i = 0; i < semesterRanges.length; i++) {
      for (let j = i + 1; j < semesterRanges.length; j++) {
        const a = semesterRanges[i];
        const b = semesterRanges[j];
        if (a.start && a.end && b.start && b.end) {
          if (a.start <= b.end && b.start <= a.end) {
            issues.push(`ช่วงเวลาของ${a.label}และ${b.label}ซ้อนทับกัน`);
          }
        }
      }
    }

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
      deadlineType: deadlineForm.deadlineType || undefined,
      isCritical: deadlineForm.isCritical,
      acceptingSubmissions: deadlineForm.acceptingSubmissions,
      allowLate: deadlineForm.allowLate,
      gracePeriodMinutes: toNumber(deadlineForm.gracePeriodMinutes),
      lockAfterDeadline: deadlineForm.lockAfterDeadline,
      visibilityScope: deadlineForm.visibilityScope,
      isPublished: deadlineForm.isPublished,
      // แปลง datetime-local → ISO +07:00 ก่อนส่ง backend เพื่อป้องกัน UTC shifting
      publishAt: deadlineForm.publishAt ? bangkokLocalInputToISO(deadlineForm.publishAt) : undefined,
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
      deadlineType: deadline.deadlineType ?? "SUBMISSION",
      isCritical: Boolean(deadline.isCritical),
      acceptingSubmissions: deadline.acceptingSubmissions !== false,
      allowLate: Boolean(deadline.allowLate),
      gracePeriodMinutes: deadline.gracePeriodMinutes ? String(deadline.gracePeriodMinutes) : "",
      lockAfterDeadline: Boolean(deadline.lockAfterDeadline),
      visibilityScope: deadline.visibilityScope ?? "ALL",
      isPublished: deadline.isPublished ?? true,
      // แปลง ISO จาก backend → local datetime-local value (Bangkok time)
      publishAt: deadline.publishAt ? isoToBangkokLocalInput(deadline.publishAt) : "",
      windowStartDate: deadline.windowStartDate ?? "",
      windowStartTime: deadline.windowStartTime ?? "",
      windowEndDate: deadline.windowEndDate ?? "",
      windowEndTime: deadline.windowEndTime ?? "",
    });
  };

  const handleDeadlineDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    setConfirmDeleteId(null);
    setLoading(true);
    setMessage(null);
    try {
      await deleteImportantDeadline(confirmDeleteId);
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
    // แสดงปีเป็น พ.ศ. เสมอ (รองรับกรณีที่ DB เก็บเป็น ค.ศ. โดยไม่ตั้งใจ)
    const displayYear = ensureBuddhistYear(currentSettings.academicYear) ?? "-";
    return `ปีการศึกษา ${displayYear}/ ภาคเรียน ${currentSettings.currentSemester ?? "-"}`;
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

          {/* Validation summary */}
          {validationIssues.length > 0 && (
            <div className={`${styles.alert} ${styles.alertWarning}`}>
              {validationIssues.join(" · ")}
            </div>
          )}

          {/* ━━ กลุ่ม 1: ข้อมูลหลัก ━━ */}
          <div className={styles.formGroup}>
            <div className={styles.formGroupLabel}>ข้อมูลหลัก</div>
            <div className={styles.fieldGridInfo}>
              <label className={styles.field}>
                ปีการศึกษา (พ.ศ.)
                <input
                  type="number"
                  className={styles.input}
                  placeholder={academicYearPlaceholder()}
                  value={scheduleForm.academicYear}
                  onChange={(event) => handleScheduleField("academicYear", event.target.value)}
                />
                {validateBuddhistYear(scheduleForm.academicYear) ? (
                  <span className={styles.fieldWarn}>{validateBuddhistYear(scheduleForm.academicYear)}</span>
                ) : scheduleForm.academicYear ? (
                  <span className={styles.fieldHint}></span>
                ) : null}
              </label>
              <label className={styles.field}>
                ภาคเรียนปัจจุบัน
                <input
                  type="number"
                  className={styles.input}
                  placeholder="เช่น 1"
                  min={1}
                  max={3}
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
                        {curriculum.code ?? "-"} — {curriculum.shortName ?? curriculum.name ?? "-"}
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
                  <option value="draft">ร่าง (Draft)</option>
                  <option value="published">เผยแพร่ (Published)</option>
                  <option value="active">ใช้งาน (Active)</option>
                </select>
              </label>
            </div>
          </div>

          {/* ━━ กลุ่ม 2: ช่วงเวลาภาคเรียน ━━ */}
          <div className={styles.formGroup}>
            <div className={styles.formGroupLabel}>ช่วงเวลาภาคเรียน</div>
            <div className={styles.fieldGrid3}>
              <div className={styles.semesterBlock}>
                <div className={styles.semesterBlockLabel}>ภาคเรียน 1</div>
                <div className={styles.semesterDatePair}>
                  <label>วันเริ่มต้น
                    <input type="date" className={styles.input} value={scheduleForm.semester1Start}
                      onChange={(e) => handleScheduleField("semester1Start", e.target.value)} />
                  </label>
                  <label>วันสิ้นสุด
                    <input type="date" className={styles.input} value={scheduleForm.semester1End}
                      onChange={(e) => handleScheduleField("semester1End", e.target.value)} />
                  </label>
                </div>
              </div>
              <div className={styles.semesterBlock}>
                <div className={styles.semesterBlockLabel}>ภาคเรียน 2</div>
                <div className={styles.semesterDatePair}>
                  <label>วันเริ่มต้น
                    <input type="date" className={styles.input} value={scheduleForm.semester2Start}
                      onChange={(e) => handleScheduleField("semester2Start", e.target.value)} />
                  </label>
                  <label>วันสิ้นสุด
                    <input type="date" className={styles.input} value={scheduleForm.semester2End}
                      onChange={(e) => handleScheduleField("semester2End", e.target.value)} />
                  </label>
                </div>
              </div>
              <div className={styles.semesterBlock}>
                <div className={styles.semesterBlockLabel}>ภาคฤดูร้อน</div>
                <div className={styles.semesterDatePair}>
                  <label>วันเริ่มต้น
                    <input type="date" className={styles.input} value={scheduleForm.semester3Start}
                      onChange={(e) => handleScheduleField("semester3Start", e.target.value)} />
                  </label>
                  <label>วันสิ้นสุด
                    <input type="date" className={styles.input} value={scheduleForm.semester3End}
                      onChange={(e) => handleScheduleField("semester3End", e.target.value)} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ━━ กลุ่ม 3: ช่วงลงทะเบียน ━━ */}
          <div className={styles.formGroup}>
            <div className={styles.formGroupLabel}>ช่วงลงทะเบียน</div>
            <div className={styles.fieldGrid2}>
              <div className={styles.semesterBlock}>
                <div className={styles.semesterBlockLabel}>ลงทะเบียนฝึกงาน</div>
                <div className={styles.semesterDatePair}>
                  <label>วันเริ่มต้น
                    <input type="date" className={styles.input} value={scheduleForm.internshipStart}
                      onChange={(e) => handleScheduleField("internshipStart", e.target.value)} />
                  </label>
                  <label>วันสิ้นสุด
                    <input type="date" className={styles.input} value={scheduleForm.internshipEnd}
                      onChange={(e) => handleScheduleField("internshipEnd", e.target.value)} />
                  </label>
                </div>
              </div>
              <div className={styles.semesterBlock}>
                <div className={styles.semesterBlockLabel}>ลงทะเบียนโครงงาน</div>
                <div className={styles.semesterDatePair}>
                  <label>วันเริ่มต้น
                    <input type="date" className={styles.input} value={scheduleForm.projectStart}
                      onChange={(e) => handleScheduleField("projectStart", e.target.value)} />
                  </label>
                  <label>วันสิ้นสุด
                    <input type="date" className={styles.input} value={scheduleForm.projectEnd}
                      onChange={(e) => handleScheduleField("projectEnd", e.target.value)} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ━━ กลุ่ม 4: ภาคเรียนที่อนุญาต ━━ */}
          <div className={styles.formGroup}>
            <div className={styles.formGroupLabel}>ภาคเรียนที่อนุญาต</div>
            <div className={styles.fieldGrid2}>
              <label className={styles.field}>
                ฝึกงาน (ระบุหมายเลข คั่นด้วยจุลภาค)
                <input className={styles.input} placeholder="เช่น 1, 2"
                  value={scheduleForm.internshipSemesters}
                  onChange={(event) => handleScheduleField("internshipSemesters", event.target.value)} />
              </label>
              <label className={styles.field}>
                โครงงาน (ระบุหมายเลข คั่นด้วยจุลภาค)
                <input className={styles.input} placeholder="เช่น 1, 2"
                  value={scheduleForm.projectSemesters}
                  onChange={(event) => handleScheduleField("projectSemesters", event.target.value)} />
              </label>
            </div>
          </div>

          <div className={styles.actionsRight}>
            <button type="button" className={btn.button} onClick={() => setScheduleForm(emptyScheduleForm)}>
              ล้างฟอร์ม
            </button>
            <button type="button" className={btn.button} onClick={handleCreateSchedule} disabled={loading}>
              สร้างปีการศึกษาใหม่
            </button>
            <button type="button" className={btn.button} onClick={handleUpdateSchedule} disabled={loading}>
              อัปเดตรายการที่เลือก
            </button>
            <button
              type="button"
              className={`${btn.button} ${btn.buttonPrimary}`}
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
            <button type="button" className={btn.button} onClick={loadSchedules} disabled={loading}>
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
                    {/* แสดงปีเป็น พ.ศ. เสมอ (รองรับกรณี DB เก็บ ค.ศ.) */}
                    <td>{ensureBuddhistYear(schedule.academicYear) ?? "-"} พ.ศ.</td>
                    <td>{schedule.currentSemester ?? "-"}</td>
                    <td>
                      <span className={`${styles.badge} ${schedule.status === "active" ? styles.badgeSuccess : styles.badgeMuted}`}>
                        {labelStatus(schedule.status, "ร่าง")}
                      </span>
                    </td>
                    <td>{schedule.activeCurriculumId ?? "-"}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={btn.button}
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
                          className={`${btn.button} ${btn.buttonPrimary}`}
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
                className={btn.button}
                onClick={() => loadDeadlines({ academicYear: deadlineForm.academicYear, semester: deadlineForm.semester })}
                disabled={loading}
              >
                รีเฟรช
              </button>
              <button type="button" className={btn.button} onClick={() => setDeadlineForm(emptyDeadlineForm)}>
                ล้างฟอร์ม
              </button>
              <button
                type="button"
                className={`${btn.button} ${btn.buttonPrimary}`}
                onClick={handleDeadlineSave}
                disabled={loading}
              >
                บันทึกกำหนดการ
              </button>
            </div>
          </div>

          {deadlineIssues.length > 0 && (
            <div className={`${styles.alert} ${styles.alertWarning}`}>
              {deadlineIssues.join(" · ")}
            </div>
          )}

          {/* ━━ กลุ่ม A: ข้อมูลกำหนดการ ━━ */}
          <div className={styles.formGroup}>
            <div className={styles.formGroupLabel}>ข้อมูลกำหนดการ</div>
            <label className={styles.field}>
              ชื่อกำหนดการ
              <input
                className={styles.input}
                placeholder="เช่น วันสุดท้ายของการส่งเอกสารออกโรงงาน"
                value={deadlineForm.name}
                onChange={(event) => handleDeadlineField("name", event.target.value)}
              />
            </label>
            <div className={styles.fieldGrid3}>
              <label className={styles.field}>
                หมวด
                <select className={styles.select} value={deadlineForm.relatedTo}
                  onChange={(event) => handleDeadlineField("relatedTo", event.target.value)}>
                  <option value="project">โครงงานพิเศษ</option>
                  <option value="project1">โครงงานพิเศษ 1</option>
                  <option value="project2">ปริญญานิพนธ์</option>
                  <option value="internship">ฝึกงาน</option>
                  <option value="general">ทั่วไป</option>
                </select>
              </label>
              <label className={styles.field}>
                ปีการศึกษา
                <input type="number" className={styles.input} placeholder={academicYearPlaceholder()}
                  value={deadlineForm.academicYear}
                  onChange={(event) => handleDeadlineField("academicYear", event.target.value)} />
                {validateBuddhistYear(deadlineForm.academicYear) ? (
                  <span className={styles.fieldWarn}>{validateBuddhistYear(deadlineForm.academicYear)}</span>
                ) : deadlineForm.academicYear ? (
                  <span className={styles.fieldHint}></span>
                ) : null}
              </label>
              <label className={styles.field}>
                ภาคเรียน
                <input type="number" className={styles.input} placeholder="เช่น 1"
                  min={1} max={3}
                  value={deadlineForm.semester}
                  onChange={(event) => handleDeadlineField("semester", event.target.value)} />
              </label>
            </div>
            <div className={styles.fieldGrid4}>
              <label className={styles.field}>
                ประเภท
                <select className={styles.select} value={deadlineForm.deadlineType}
                  onChange={(event) => handleDeadlineField("deadlineType", event.target.value)}>
                  <option value="SUBMISSION">ส่งเอกสาร</option>
                  <option value="ANNOUNCEMENT">ประกาศ</option>
                  <option value="MILESTONE">ไมล์สโตน</option>
                  <option value="MANUAL">กำหนดเอง</option>
                </select>
              </label>
              <label className={styles.field}>
                สำคัญ (Critical)
                <select className={styles.select}
                  value={deadlineForm.isCritical ? "true" : "false"}
                  onChange={(event) => handleDeadlineField("isCritical", event.target.value === "true")}>
                  <option value="false">ปกติ</option>
                  <option value="true">สำคัญ</option>
                </select>
              </label>
              <label className={styles.field}>
                เปิดรับงาน
                <select className={styles.select}
                  value={deadlineForm.acceptingSubmissions ? "true" : "false"}
                  onChange={(event) => handleDeadlineField("acceptingSubmissions", event.target.value === "true")}>
                  <option value="true">เปิดรับ</option>
                  <option value="false">ไม่เปิดรับ</option>
                </select>
              </label>
            </div>
          </div>

          {/* ━━ กลุ่ม B: วันและเวลาครบกำหนด ━━ */}
          <div className={styles.formGroup}>
            <div className={styles.formGroupLabel}>วันและเวลาครบกำหนด</div>
            <div className={styles.fieldGrid4}>
              <label className={styles.field}>
                วันครบกำหนด
                <input type="date" className={styles.input} value={deadlineForm.deadlineDate}
                  onChange={(event) => handleDeadlineField("deadlineDate", event.target.value)} />
              </label>
              <label className={styles.field}>
                เวลา
                <input type="time" className={styles.input} value={deadlineForm.deadlineTime}
                  onChange={(event) => handleDeadlineField("deadlineTime", event.target.value)} />
              </label>
              <label className={styles.field}>
                สถานะการเผยแพร่
                <select className={styles.select}
                  value={deadlineForm.isPublished ? "true" : "false"}
                  onChange={(event) => handleDeadlineField("isPublished", event.target.value === "true")}>
                  <option value="true">เผยแพร่แล้ว</option>
                  <option value="false">ยังไม่เผยแพร่</option>
                </select>
              </label>
              <label className={styles.field}>
                เผยแพร่อัตโนมัติเมื่อ
                <input type="datetime-local" className={styles.input} value={deadlineForm.publishAt}
                  onChange={(event) => handleDeadlineField("publishAt", event.target.value)} />
              </label>
            </div>
          </div>

          {/* ━━ กลุ่ม C: หน้าต่างการส่ง (optional) ━━ */}
          <div className={styles.formGroup}>
            <div className={styles.formGroupLabel}>หน้าต่างการส่ง (ไม่บังคับ)</div>
            <div className={styles.fieldGrid2}>
              <div className={styles.semesterBlock}>
                <div className={styles.semesterBlockLabel}>ช่วงเปิดรับ — เริ่มต้น</div>
                <div className={styles.semesterDatePair}>
                  <label>วันที่
                    <input type="date" className={styles.input} value={deadlineForm.windowStartDate}
                      onChange={(e) => handleDeadlineField("windowStartDate", e.target.value)} />
                  </label>
                  <label>เวลา
                    <input type="time" className={styles.input} value={deadlineForm.windowStartTime}
                      onChange={(e) => handleDeadlineField("windowStartTime", e.target.value)} />
                  </label>
                </div>
              </div>
              <div className={styles.semesterBlock}>
                <div className={styles.semesterBlockLabel}>ช่วงเปิดรับ — สิ้นสุด</div>
                <div className={styles.semesterDatePair}>
                  <label>วันที่
                    <input type="date" className={styles.input} value={deadlineForm.windowEndDate}
                      onChange={(e) => handleDeadlineField("windowEndDate", e.target.value)} />
                  </label>
                  <label>เวลา
                    <input type="time" className={styles.input} value={deadlineForm.windowEndTime}
                      onChange={(e) => handleDeadlineField("windowEndTime", e.target.value)} />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* ━━ กลุ่ม D: นโยบาย ━━ */}
          <div className={styles.formGroup}>
            <div className={styles.formGroupLabel}>นโยบายกำหนดส่ง</div>
            <div className={styles.fieldGrid4}>
              <label className={styles.field}>
                อนุญาตส่งล่าช้า
                <select className={styles.select}
                  value={deadlineForm.allowLate ? "true" : "false"}
                  onChange={(event) => handleDeadlineField("allowLate", event.target.value === "true")}>
                  <option value="true">อนุญาต</option>
                  <option value="false">ไม่อนุญาต</option>
                </select>
              </label>
              <label className={styles.field}>
                Grace Period (นาที)
                <input type="number" className={styles.input} value={deadlineForm.gracePeriodMinutes}
                  onChange={(event) => handleDeadlineField("gracePeriodMinutes", event.target.value)} />
                <span className={styles.fieldHint}>ใช้เมื่ออนุญาตส่งล่าช้าเท่านั้น</span>
              </label>
              <label className={styles.field}>
                ปิดรับหลังหมดเวลา
                <select className={styles.select}
                  value={deadlineForm.lockAfterDeadline ? "true" : "false"}
                  onChange={(event) => handleDeadlineField("lockAfterDeadline", event.target.value === "true")}>
                  <option value="true">ล็อก — ไม่รับอีก</option>
                  <option value="false">ไม่ล็อก</option>
                </select>
              </label>
              <label className={styles.field}>
                การมองเห็น
                <select className={styles.select} value={deadlineForm.visibilityScope}
                  onChange={(event) => handleDeadlineField("visibilityScope", event.target.value)}>
                  <option value="ALL">ทุกกลุ่ม</option>
                  <option value="INTERNSHIP_ONLY">ฝึกงานเท่านั้น</option>
                  <option value="PROJECT_ONLY">โครงงานเท่านั้น</option>
                </select>
              </label>
            </div>
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
                    {/* แสดงวันที่-เวลาในรูปแบบไทย DD/MM/YYYY (พ.ศ.) HH:mm */}
                    <td>{formatThaiDateTime(deadline.deadlineDate, deadline.deadlineTime)}</td>
                    <td>
                      <span className={styles.badge}>{labelStatus(deadline.status)}</span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button type="button" className={btn.button} onClick={() => handleDeadlineEdit(deadline)}>
                          แก้ไข
                        </button>
                        <button
                          type="button"
                          className={btn.button}
                          onClick={() => handleDeadlineStats(deadline.id)}
                        >
                          ดูสถิติ
                        </button>
                        <button
                          type="button"
                          className={`${btn.button} ${btn.buttonDanger}`}
                          onClick={() => setConfirmDeleteId(deadline.id)}
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
              <div className={styles.actions}>
                {deadlineStats.total !== undefined && (
                  <span className={styles.badge}>ทั้งหมด: {String(deadlineStats.total)}</span>
                )}
                {deadlineStats.onTime !== undefined && (
                  <span className={`${styles.badge} ${styles.badgeSuccess}`}>ตรงเวลา: {String(deadlineStats.onTime)}</span>
                )}
                {deadlineStats.late !== undefined && (
                  <span className={`${styles.badge} ${styles.badgeWarning}`}>ช้า: {String(deadlineStats.late)}</span>
                )}
              </div>
            </div>
          ) : null}
        </section>

        <ConfirmDialog
          open={confirmDeleteId !== null}
          title="ยืนยันการลบกำหนดการ"
          message="กำหนดการนี้จะถูกลบออกจากระบบถาวร ต้องการดำเนินการต่อหรือไม่?"
          confirmText="ลบ"
          variant="danger"
          onConfirm={handleDeadlineDeleteConfirmed}
          onCancel={() => setConfirmDeleteId(null)}
        />
      </div>
    </RoleGuard>
  );
}
