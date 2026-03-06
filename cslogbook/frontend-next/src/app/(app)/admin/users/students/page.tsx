"use client";

import { useMemo, useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAdminStudentFilterOptions, useAdminStudentMutations, useAdminStudents } from "@/hooks/useAdminStudents";
import { useConfirmDialog } from "@/components/common/ConfirmDialog";
import { StatSkeleton, TableSkeleton } from "@/components/common/Skeleton";
import type { AdminStudent, StudentFilters } from "@/lib/services/adminStudentService";
import btn from "@/styles/shared/buttons.module.css";
import responsive from "@/styles/shared/responsive.module.css";
import styles from "./page.module.css";

type FormState = {
  studentCode: string;
  firstName: string;
  lastName: string;
  email: string;
  totalCredits: string;
  majorCredits: string;
};

const emptyForm: FormState = {
  studentCode: "",
  firstName: "",
  lastName: "",
  email: "",
  totalCredits: "0",
  majorCredits: "0",
};

const PAGE_SIZE = 20;

function formatName(student: AdminStudent) {
  return [student.firstName, student.lastName].filter(Boolean).join(" ").trim() || "-";
}

function getEligibilityTags(student: AdminStudent) {
  const tags: Array<{ text: string; ok: boolean }> = [];
  const internship = Boolean(student.isEligibleForInternship ?? student.isEligibleInternship);
  const project = Boolean(student.isEligibleForProject ?? student.isEligibleProject);

  tags.push({ text: internship ? "มีสิทธิ์ฝึกงาน" : "ยังไม่ผ่านฝึกงาน", ok: internship });
  tags.push({ text: project ? "มีสิทธิ์โครงงาน" : "ยังไม่ผ่านโครงงาน", ok: project });

  const status = (student.status ?? "").toLowerCase();
  if (status === "in_progress_internship") {
    tags.push({ text: "กำลังฝึกงาน", ok: true });
  } else if (status === "in_progress_project") {
    tags.push({ text: "กำลังทำโครงงาน", ok: true });
  } else if (status === "completed_internship") {
    tags.push({ text: "ฝึกงานเสร็จสิ้น", ok: true });
  } else if (status === "completed_project") {
    tags.push({ text: "โครงงานเสร็จสิ้น", ok: true });
  }

  return tags;
}

function toFormState(student: AdminStudent): FormState {
  return {
    studentCode: student.studentCode ?? "",
    firstName: student.firstName ?? "",
    lastName: student.lastName ?? "",
    email: student.email ?? "",
    totalCredits: String(student.totalCredits ?? 0),
    majorCredits: String(student.majorCredits ?? 0),
  };
}

export default function AdminStudentsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [semester, setSemester] = useState("");
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selected, setSelected] = useState<AdminStudent | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);
  const { containerRef: drawerRef, saveTrigger } = useFocusTrap(drawerOpen);

  const filters: StudentFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      status: status || undefined,
      academicYear: academicYear || undefined,
      semester: semester || undefined,
    }),
    [academicYear, search, semester, status],
  );

  const studentsQuery = useAdminStudents(filters);
  const optionsQuery = useAdminStudentFilterOptions();
  const { createStudent, updateStudent, deleteStudent } = useAdminStudentMutations();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();

  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedStudents = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return students.slice(start, start + PAGE_SIZE);
  }, [currentPage, students]);

  const stats = useMemo(() => {
    const total = students.length;
    const internshipEligible = students.filter((s) => Boolean(s.isEligibleForInternship ?? s.isEligibleInternship)).length;
    const projectEligible = students.filter((s) => Boolean(s.isEligibleForProject ?? s.isEligibleProject)).length;
    const noEligibility = students.filter((s) => {
      const internship = Boolean(s.isEligibleForInternship ?? s.isEligibleInternship);
      const project = Boolean(s.isEligibleForProject ?? s.isEligibleProject);
      return !internship && !project;
    }).length;
    return { total, internshipEligible, projectEligible, noEligibility };
  }, [students]);

  const academicYearOptions = useMemo(() => {
    const source = optionsQuery.data?.academicYears ?? [];
    const seen = new Set<string>();

    return source
      .map((item, index) => {
        const rawValue = item?.value;
        const value = rawValue === undefined || rawValue === null ? "" : String(rawValue);
        const label = item?.label ?? value;
        const key = `${value || "empty"}-${label}-${index}`;
        return { key, value, label };
      })
      .filter((item) => {
        // กัน option ว่างซ้ำกับค่า default "ทุกปีการศึกษา"
        if (!item.value) return false;
        if (seen.has(item.value)) return false;
        seen.add(item.value);
        return true;
      });
  }, [optionsQuery.data?.academicYears]);

  const semesterOptions = useMemo(() => {
    const source = optionsQuery.data?.semesters ?? [];
    const seen = new Set<string>();

    return source
      .map((item, index) => {
        const rawValue = item?.value;
        const value = rawValue === undefined || rawValue === null ? "" : String(rawValue);
        const label = item?.label ?? value;
        const key = `${value || "empty"}-${label}-${index}`;
        return { key, value, label };
      })
      .filter((item) => {
        if (!item.value) return false;
        if (seen.has(item.value)) return false;
        seen.add(item.value);
        return true;
      });
  }, [optionsQuery.data?.semesters]);

  const emptyMessage = useMemo(() => {
    if (search.trim()) return `ไม่พบนักศึกษาที่ตรงกับคำค้นหา "${search.trim()}"`;
    if (status) return `ไม่พบนักศึกษาที่มีสถานะ "${status === "internship" ? "มีสิทธิ์ฝึกงาน" : "มีสิทธิ์โครงงาน"}"`;
    if (academicYear) return `ไม่พบนักศึกษาของปีการศึกษา ${academicYear}`;
    if (semester) return `ไม่พบนักศึกษาของภาคเรียน ${semester}`;
    return "ไม่พบข้อมูลนักศึกษา";
  }, [academicYear, search, semester, status]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setIsEditMode(false);
    setSelected(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    saveTrigger();
    setFeedback(null);
    setSelected(null);
    setIsEditMode(true);
    setForm(emptyForm);
    setDrawerOpen(true);
  };

  const openView = (student: AdminStudent) => {
    saveTrigger();
    setFeedback(null);
    setSelected(student);
    setIsEditMode(false);
    setForm(toFormState(student));
    setDrawerOpen(true);
  };

  const openEdit = (student: AdminStudent) => {
    saveTrigger();
    setFeedback(null);
    setSelected(student);
    setIsEditMode(true);
    setForm(toFormState(student));
    setDrawerOpen(true);
  };

  const onChangeField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return "กรุณากรอกชื่อและนามสกุล";
    }

    if (!form.email.trim()) {
      return "กรุณากรอกอีเมล";
    }

    if (!isEditMode || !selected) {
      if (!/^\d{13}$/.test(form.studentCode.trim())) {
        return "รหัสนักศึกษาต้องเป็นตัวเลข 13 หลัก";
      }
    }

    const totalCredits = Number(form.totalCredits || 0);
    const majorCredits = Number(form.majorCredits || 0);

    if (Number.isNaN(totalCredits) || Number.isNaN(majorCredits) || totalCredits < 0 || majorCredits < 0) {
      return "หน่วยกิตต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป";
    }

    if (majorCredits > totalCredits) {
      return "หน่วยกิตภาควิชาต้องน้อยกว่าหรือเท่ากับหน่วยกิตรวม";
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFeedback({ tone: "warning", message: validationError });
      return;
    }

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      totalCredits: Number(form.totalCredits || 0),
      majorCredits: Number(form.majorCredits || 0),
    };

    try {
      if (selected?.studentCode) {
        await updateStudent.mutateAsync({ studentCode: selected.studentCode, payload });
        setFeedback({ tone: "success", message: "อัปเดตข้อมูลนักศึกษาเรียบร้อยแล้ว" });
      } else {
        await createStudent.mutateAsync({
          studentCode: form.studentCode.trim(),
          ...payload,
        });
        setFeedback({ tone: "success", message: "เพิ่มนักศึกษาเรียบร้อยแล้ว" });
      }
      closeDrawer();
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลนักศึกษาได้",
      });
    }
  };

  const handleDelete = async (studentCode: string) => {
    confirm(
      {
        title: "ยืนยันการลบข้อมูล",
        message: `คุณต้องการลบข้อมูลนักศึกษารหัส ${studentCode} ใช่หรือไม่?`,
        variant: "danger",
      },
      async () => {
        try {
          await deleteStudent.mutateAsync(studentCode);
          setFeedback({ tone: "success", message: "ลบข้อมูลนักศึกษาเรียบร้อยแล้ว" });
        } catch (error) {
          setFeedback({
            tone: "warning",
            message: error instanceof Error ? error.message : "ไม่สามารถลบข้อมูลนักศึกษาได้",
          });
        }
      },
    );
  };

  const isSaving = createStudent.isPending || updateStudent.isPending;

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>จัดการข้อมูลนักศึกษา</h1>
            <p className={styles.subtitle}>จัดการข้อมูลนักศึกษา ตรวจสอบ และแก้ไขสถานะการใช้งานระบบ</p>
          </div>
          <div className={btn.buttonRow}>
            <button
              type="button"
              className={btn.button}
              onClick={() => {
                setSearch("");
                setStatus("");
                setAcademicYear("");
                setSemester("");
                setPage(1);
              }}
            >
              รีเฟรช
            </button>
            <button type="button" className={`${btn.button} ${btn.buttonPrimary}`} onClick={openCreate}>
              เพิ่มนักศึกษา
            </button>
          </div>
        </header>

        {feedback ? (
          <div className={`${styles.alert} ${feedback.tone === "success" ? styles.alertSuccess : styles.alertWarning}`}>
            {feedback.message}
          </div>
        ) : null}

        <section className={styles.card}>
          {studentsQuery.isLoading ? (
            <StatSkeleton count={4} />
          ) : (
            <div className={styles.stats}>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>นักศึกษาทั้งหมด</p>
                <p className={styles.statValue}>{stats.total}</p>
              </div>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>มีสิทธิ์ฝึกงาน</p>
                <p className={styles.statValue}>{stats.internshipEligible}</p>
              </div>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>มีสิทธิ์โครงงาน</p>
                <p className={styles.statValue}>{stats.projectEligible}</p>
              </div>
              <div className={styles.statItem}>
                <p className={styles.statLabel}>ยังไม่มีสิทธิ์</p>
                <p className={styles.statValue}>{stats.noEligibility}</p>
              </div>
            </div>
          )}
        </section>

        <section className={styles.card}>
          <div className={styles.filters}>
            <input
              className={styles.input}
              placeholder="ค้นหารหัส, ชื่อ, นามสกุล, อีเมล"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
            <select
              className={styles.select}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกสถานะ</option>
              <option value="internship">มีสิทธิ์ฝึกงาน</option>
              <option value="project">มีสิทธิ์โครงงาน</option>
            </select>
            <select
              className={styles.select}
              value={academicYear}
              onChange={(event) => {
                setAcademicYear(event.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกปีการศึกษา</option>
              {academicYearOptions.map((year) => (
                <option key={year.key} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={semester}
              onChange={(event) => {
                setSemester(event.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกภาคเรียน</option>
              {semesterOptions.map((item) => (
                <option key={item.key} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${btn.button} ${btn.buttonGhost}`}
              onClick={() => {
                setSearch("");
                setStatus("");
                setAcademicYear("");
                setSemester("");
                setPage(1);
              }}
            >
              ล้างตัวกรอง
            </button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>รหัสนักศึกษา</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th className={responsive.hideOnMobile}>หน่วยกิต</th>
                  <th>สถานะสิทธิ์</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {studentsQuery.isLoading ? (
                  <TableSkeleton rows={5} columns={5} />
                ) : students.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <p className={styles.empty}>{emptyMessage}</p>
                    </td>
                  </tr>
                ) : (
                  pagedStudents.map((student) => (
                    <tr key={student.studentId ?? student.userId ?? student.studentCode}>
                      <td>{student.studentCode}</td>
                      <td>
                        <p className={styles.name}>{formatName(student)}</p>
                        <p className={styles.subText}>{student.email || "-"}</p>
                      </td>
                      <td className={responsive.hideOnMobile}>
                        <p className={styles.name}>สะสม {student.totalCredits ?? 0}</p>
                        <p className={styles.subText}>ภาควิชา {student.majorCredits ?? 0}</p>
                      </td>
                      <td>
                        <div className={styles.tagRow}>
                          {getEligibilityTags(student).map((tag) => (
                            <span key={tag.text} className={`${styles.tag} ${tag.ok ? styles.tagOk : styles.tagMuted}`}>
                              {tag.text}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div className={btn.buttonRow}>
                          <button type="button" className={btn.button} onClick={() => openView(student)}>
                            ดู
                          </button>
                          <button type="button" className={btn.button} onClick={() => openEdit(student)}>
                            แก้ไข
                          </button>
                          <button
                            type="button"
                            className={`${btn.button} ${btn.buttonDanger}`}
                            onClick={() => handleDelete(student.studentCode)}
                            disabled={deleteStudent.isPending}
                          >
                            ลบ
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!studentsQuery.isLoading && students.length > 0 ? (
            <div className={styles.pagination}>
              <button
                type="button"
                className={btn.button}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage <= 1}
              >
                ก่อนหน้า
              </button>
              <span className={styles.paginationInfo}>
                หน้า {currentPage} / {totalPages} ({students.length} รายการ)
              </span>
              <button
                type="button"
                className={btn.button}
                onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                disabled={currentPage >= totalPages}
              >
                ถัดไป
              </button>
            </div>
          ) : null}
        </section>

        {drawerOpen ? (
          <div className={styles.drawerOverlay} onClick={closeDrawer}>
            <aside ref={drawerRef} className={styles.drawer} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={isEditMode ? (selected ? "แก้ไขข้อมูลนักศึกษา" : "เพิ่มนักศึกษา") : "ข้อมูลนักศึกษา"}>
              <header className={styles.drawerHeader}>
                <strong>
                  {isEditMode ? (selected ? "แก้ไขข้อมูลนักศึกษา" : "เพิ่มนักศึกษา") : "ข้อมูลนักศึกษา"}
                </strong>
                <button type="button" className={btn.button} onClick={closeDrawer}>
                  ปิด
                </button>
              </header>

              <div className={styles.drawerBody}>
                {!isEditMode ? (
                  selected ? (
                    <>
                      <div className={styles.detailSection}>
                        <p className={styles.detailTitle}>ข้อมูลทั่วไป</p>
                        <p className={styles.name}>{formatName(selected)}</p>
                        <p className={styles.subText}>รหัส: {selected.studentCode}</p>
                        <p className={styles.subText}>อีเมล: {selected.email || "-"}</p>
                        <p className={styles.subText}>ห้องเรียน: {selected.classroom || "-"}</p>
                      </div>
                      <div className={styles.detailSection}>
                        <p className={styles.detailTitle}>ข้อมูลการศึกษา</p>
                        <p className={styles.subText}>
                          หน่วยกิตสะสม: {selected.totalCredits ?? 0} | หน่วยกิตภาควิชา: {selected.majorCredits ?? 0}
                        </p>
                        <p className={styles.subText}>ปีการศึกษา: {selected.academicYear || "-"}</p>
                        <p className={styles.subText}>ภาคเรียน: {selected.semester || "-"}</p>
                      </div>
                      <div className={styles.detailSection}>
                        <p className={styles.detailTitle}>สถานะการมีสิทธิ์</p>
                        <div className={styles.tagRow}>
                          {getEligibilityTags(selected).map((tag) => (
                            <span key={`${selected.studentCode}-${tag.text}`} className={`${styles.tag} ${tag.ok ? styles.tagOk : styles.tagMuted}`}>
                              {tag.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className={styles.empty}>ไม่พบข้อมูลนักศึกษา</p>
                  )
                ) : (
                  <div className={styles.formGrid}>
                    <label className={styles.field} htmlFor="studentCode">
                      <span>รหัสนักศึกษา</span>
                      <input
                        id="studentCode"
                        className={styles.input}
                        value={form.studentCode}
                        disabled={Boolean(selected)}
                        onChange={(event) => onChangeField("studentCode", event.target.value)}
                        placeholder="ตัวเลข 13 หลัก"
                      />
                    </label>
                    <label className={styles.field} htmlFor="email">
                      <span>อีเมล</span>
                      <input
                        id="email"
                        type="email"
                        className={styles.input}
                        value={form.email}
                        onChange={(event) => onChangeField("email", event.target.value)}
                        placeholder="example@kmutnb.ac.th"
                      />
                    </label>
                    <label className={styles.field} htmlFor="firstName">
                      <span>ชื่อ</span>
                      <input
                        id="firstName"
                        className={styles.input}
                        value={form.firstName}
                        onChange={(event) => onChangeField("firstName", event.target.value)}
                      />
                    </label>
                    <label className={styles.field} htmlFor="lastName">
                      <span>นามสกุล</span>
                      <input
                        id="lastName"
                        className={styles.input}
                        value={form.lastName}
                        onChange={(event) => onChangeField("lastName", event.target.value)}
                      />
                    </label>
                    <label className={styles.field} htmlFor="totalCredits">
                      <span>หน่วยกิตรวม</span>
                      <input
                        id="totalCredits"
                        type="number"
                        className={styles.input}
                        min={0}
                        value={form.totalCredits}
                        onChange={(event) => onChangeField("totalCredits", event.target.value)}
                      />
                    </label>
                    <label className={styles.field} htmlFor="majorCredits">
                      <span>หน่วยกิตภาควิชา</span>
                      <input
                        id="majorCredits"
                        type="number"
                        className={styles.input}
                        min={0}
                        value={form.majorCredits}
                        onChange={(event) => onChangeField("majorCredits", event.target.value)}
                      />
                    </label>
                  </div>
                )}
              </div>

              <footer className={styles.drawerFooter}>
                <div className={btn.buttonRow}>
                  {!isEditMode ? (
                    selected ? (
                      <button type="button" className={`${btn.button} ${btn.buttonPrimary}`} onClick={() => setIsEditMode(true)}>
                        แก้ไข
                      </button>
                    ) : null
                  ) : (
                    <>
                      <button type="button" className={btn.button} onClick={closeDrawer}>
                        ยกเลิก
                      </button>
                      <button
                        type="button"
                        className={`${btn.button} ${btn.buttonPrimary}`}
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                      </button>
                    </>
                  )}
                </div>
              </footer>
            </aside>
          </div>
        ) : null}
      </div>
      <ConfirmDialogComponent />
    </RoleGuard>
  );
}
