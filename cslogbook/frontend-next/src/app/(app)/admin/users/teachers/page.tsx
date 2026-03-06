"use client";

import { useMemo, useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAdminTeacherMutations, useAdminTeachers } from "@/hooks/useAdminTeachers";
import { useConfirmDialog } from "@/components/common/ConfirmDialog";
import { TableSkeleton } from "@/components/common/Skeleton";
import type { AdminTeacher, TeacherFilters } from "@/lib/services/adminTeacherService";
import btn from "@/styles/shared/buttons.module.css";
import responsive from "@/styles/shared/responsive.module.css";
import styles from "./page.module.css";

type FormState = {
  teacherCode: string;
  firstName: string;
  lastName: string;
  email: string;
  contactExtension: string;
  position: string;
  teacherType: string;
  canAccessTopicExam: boolean;
  canExportProject1: boolean;
};

const emptyForm: FormState = {
  teacherCode: "",
  firstName: "",
  lastName: "",
  email: "",
  contactExtension: "",
  position: "คณาจารย์",
  teacherType: "academic",
  canAccessTopicExam: false,
  canExportProject1: false,
};

const positionOptions = [
  { value: "หัวหน้าภาควิชา", label: "หัวหน้าภาควิชา", teacherType: "academic" },
  { value: "คณาจารย์", label: "คณาจารย์", teacherType: "academic" },
  { value: "เจ้าหน้าที่ภาควิชา", label: "เจ้าหน้าที่ภาควิชา", teacherType: "support" },
];

const teacherTypeOptions = [
  { value: "academic", label: "สายวิชาการ" },
  { value: "support", label: "เจ้าหน้าที่ภาควิชา" },
];

const PAGE_SIZE = 20;

function teacherTypeFromPosition(position: string) {
  return positionOptions.find((item) => item.value === position)?.teacherType ?? "academic";
}

function formatName(teacher: AdminTeacher) {
  return [teacher.firstName, teacher.lastName].filter(Boolean).join(" ").trim() || "-";
}

function toFormState(teacher: AdminTeacher): FormState {
  const nextPosition = teacher.position || "คณาจารย์";
  return {
    teacherCode: teacher.teacherCode ?? "",
    firstName: teacher.firstName ?? "",
    lastName: teacher.lastName ?? "",
    email: teacher.email ?? "",
    contactExtension: teacher.contactExtension ?? "",
    position: nextPosition,
    teacherType: teacher.teacherType ?? teacherTypeFromPosition(nextPosition),
    canAccessTopicExam: Boolean(teacher.canAccessTopicExam),
    canExportProject1: Boolean(teacher.canExportProject1),
  };
}

export default function AdminTeachersPage() {
  const [search, setSearch] = useState("");
  const [positionFilters, setPositionFilters] = useState<string[]>([]);
  const [teacherTypeFilters, setTeacherTypeFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selected, setSelected] = useState<AdminTeacher | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);
  const { containerRef: drawerRef, saveTrigger } = useFocusTrap(drawerOpen);

  const filters: TeacherFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      // Keep backend query simple, then apply multi-filter client-side for parity with legacy.
    }),
    [search],
  );

  const teachersQuery = useAdminTeachers(filters);
  const { createTeacher, updateTeacher, deleteTeacher } = useAdminTeacherMutations();
  const { confirm, Dialog: ConfirmDialogComponent } = useConfirmDialog();

  const teachers = useMemo(() => teachersQuery.data ?? [], [teachersQuery.data]);

  const filteredTeachers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return teachers.filter((teacher) => {
      const normalizedTeacherType = teacher.teacherType ?? teacherTypeFromPosition(teacher.position ?? "");

      if (positionFilters.length && !positionFilters.includes(teacher.position ?? "")) return false;
      if (teacherTypeFilters.length && !teacherTypeFilters.includes(normalizedTeacherType)) return false;

      if (!keyword) return true;

      const fields = [
        teacher.teacherCode,
        teacher.firstName,
        teacher.lastName,
        `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}`,
        teacher.email,
        teacher.position,
      ];
      return fields.filter(Boolean).some((field) => String(field).toLowerCase().includes(keyword));
    });
  }, [positionFilters, search, teacherTypeFilters, teachers]);
  const totalPages = Math.max(1, Math.ceil(filteredTeachers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedTeachers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredTeachers.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredTeachers]);

  const stats = useMemo(
    () => ({
      total: teachers.length,
      filtered: filteredTeachers.length,
      support: filteredTeachers.filter((teacher) => (teacher.teacherType ?? teacherTypeFromPosition(teacher.position ?? "")) === "support")
        .length,
      academic: filteredTeachers.filter((teacher) => (teacher.teacherType ?? teacherTypeFromPosition(teacher.position ?? "")) === "academic")
        .length,
    }),
    [filteredTeachers, teachers.length],
  );

  const emptyMessage = useMemo(() => {
    if (search.trim()) return `ไม่พบอาจารย์ที่ตรงกับคำค้นหา "${search.trim()}"`;
    if (positionFilters.length) return `ไม่พบอาจารย์ในตำแหน่งที่เลือก`;
    if (teacherTypeFilters.length) return `ไม่พบอาจารย์ประเภทบุคลากรที่เลือก`;
    return "ไม่พบข้อมูลอาจารย์";
  }, [positionFilters.length, search, teacherTypeFilters.length]);

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

  const openView = (teacher: AdminTeacher) => {
    saveTrigger();
    setFeedback(null);
    setSelected(teacher);
    setIsEditMode(false);
    setForm(toFormState(teacher));
    setDrawerOpen(true);
  };

  const openEdit = (teacher: AdminTeacher) => {
    saveTrigger();
    setFeedback(null);
    setSelected(teacher);
    setIsEditMode(true);
    setForm(toFormState(teacher));
    setDrawerOpen(true);
  };

  const onChangeField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handlePositionChange = (value: string) => {
    onChangeField("position", value);
    onChangeField("teacherType", teacherTypeFromPosition(value));
  };

  const validateForm = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) {
      return "กรุณากรอกชื่อและนามสกุล";
    }
    if (!form.email.trim()) {
      return "กรุณากรอกอีเมล";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      return "กรุณากรอกอีเมลที่ถูกต้อง";
    }
    if (!selected && !form.teacherCode.trim()) {
      return "กรุณากรอกรหัสอาจารย์";
    }
    if (!form.position) {
      return "กรุณาเลือกตำแหน่ง";
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
      contactExtension: form.contactExtension.trim() || undefined,
      position: form.position,
      teacherType: form.teacherType,
      canAccessTopicExam: form.canAccessTopicExam,
      canExportProject1: form.canExportProject1,
    };

    try {
      if (selected?.teacherId) {
        await updateTeacher.mutateAsync({
          teacherId: selected.teacherId,
          payload: { teacherCode: form.teacherCode.trim(), ...payload },
        });
        setFeedback({ tone: "success", message: "อัปเดตข้อมูลอาจารย์เรียบร้อยแล้ว" });
      } else {
        await createTeacher.mutateAsync({
          teacherCode: form.teacherCode.trim(),
          ...payload,
        });
        setFeedback({ tone: "success", message: "เพิ่มอาจารย์เรียบร้อยแล้ว" });
      }
      closeDrawer();
    } catch (error) {
      setFeedback({
        tone: "warning",
        message: error instanceof Error ? error.message : "ไม่สามารถบันทึกข้อมูลอาจารย์ได้",
      });
    }
  };

  const handleDelete = async (teacherId: number, teacherCode: string) => {
    confirm(
      {
        title: "ยืนยันการลบข้อมูล",
        message: `คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลอาจารย์ ${teacherCode}? การดำเนินการนี้ไม่สามารถเรียกคืนได้`,
        variant: "danger",
      },
      async () => {
        try {
          await deleteTeacher.mutateAsync(teacherId);
          setFeedback({ tone: "success", message: "ลบข้อมูลอาจารย์เรียบร้อยแล้ว" });
        } catch (error) {
          setFeedback({
            tone: "warning",
            message: error instanceof Error ? error.message : "ไม่สามารถลบข้อมูลอาจารย์ได้",
          });
        }
      },
    );
  };

  const isSaving = createTeacher.isPending || updateTeacher.isPending;

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>จัดการข้อมูลอาจารย์</h1>
            <p className={styles.subtitle}>จัดการข้อมูลอาจารย์ ตำแหน่ง และสิทธิ์การใช้งานระบบ</p>
          </div>
          <div className={btn.buttonRow}>
            <button
              type="button"
              className={btn.button}
              onClick={() => {
                setSearch("");
                setPositionFilters([]);
                setTeacherTypeFilters([]);
                setPage(1);
              }}
            >
              รีเฟรช
            </button>
            <button type="button" className={`${btn.button} ${btn.buttonPrimary}`} onClick={openCreate}>
              เพิ่มอาจารย์
            </button>
          </div>
        </header>

        {feedback ? (
          <div className={`${styles.alert} ${feedback.tone === "success" ? styles.alertSuccess : styles.alertWarning}`}>
            {feedback.message}
          </div>
        ) : null}

        <section className={styles.card}>
          <div className={styles.stats}>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>อาจารย์ทั้งหมด</p>
              <p className={styles.statValue}>{stats.total}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>ผลลัพธ์ตามตัวกรอง</p>
              <p className={styles.statValue}>{stats.filtered}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>สายวิชาการ</p>
              <p className={styles.statValue}>{stats.academic}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>เจ้าหน้าที่ภาควิชา</p>
              <p className={styles.statValue}>{stats.support}</p>
            </div>
          </div>
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
              multiple
              value={positionFilters}
              onChange={(event) => {
                setPositionFilters(Array.from(event.target.selectedOptions).map((item) => item.value));
                setPage(1);
              }}
            >
              {positionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              multiple
              value={teacherTypeFilters}
              onChange={(event) => {
                setTeacherTypeFilters(Array.from(event.target.selectedOptions).map((item) => item.value));
                setPage(1);
              }}
            >
              {teacherTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${btn.button} ${btn.buttonGhost}`}
              onClick={() => {
                setSearch("");
                setPositionFilters([]);
                setTeacherTypeFilters([]);
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
                  <th>รหัสอาจารย์</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th className={responsive.hideOnMobile}>ตำแหน่ง</th>
                  <th className={responsive.hideOnMobile}>สิทธิ์โครงงาน</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {teachersQuery.isLoading ? (
                  <TableSkeleton rows={5} columns={5} />
                ) : filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <p className={styles.empty}>{emptyMessage}</p>
                    </td>
                  </tr>
                ) : (
                  pagedTeachers.map((teacher) => {
                    const normalizedTeacherType = teacher.teacherType ?? teacherTypeFromPosition(teacher.position ?? "");
                    return (
                      <tr key={teacher.teacherId ?? teacher.teacherCode}>
                        <td>{teacher.teacherCode}</td>
                        <td>
                          <p className={styles.name}>{formatName(teacher)}</p>
                          <p className={styles.subText}>{teacher.email || "-"}</p>
                          <p className={styles.subText}>เบอร์ภายใน: {teacher.contactExtension || "-"}</p>
                        </td>
                        <td className={responsive.hideOnMobile}>
                          <p className={styles.name}>{teacher.position || "-"}</p>
                          <p className={styles.subText}>
                            {normalizedTeacherType === "support" ? "เจ้าหน้าที่ภาควิชา" : "สายวิชาการ"}
                          </p>
                        </td>
                        <td className={responsive.hideOnMobile}>
                          <div className={styles.tagRow}>
                            <span className={`${styles.tag} ${teacher.canAccessTopicExam ? styles.tagOk : styles.tagMuted}`}>
                              {teacher.canAccessTopicExam ? "เปิดสิทธิ์หัวข้อสอบ" : "ปิดสิทธิ์หัวข้อสอบ"}
                            </span>
                            <span className={`${styles.tag} ${teacher.canExportProject1 ? styles.tagOk : styles.tagMuted}`}>
                              {teacher.canExportProject1 ? "เปิดสิทธิ์รายชื่อสอบ" : "ปิดสิทธิ์รายชื่อสอบ"}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={btn.buttonRow}>
                            <button type="button" className={btn.button} onClick={() => openView(teacher)}>
                              ดู
                            </button>
                            <button type="button" className={btn.button} onClick={() => openEdit(teacher)}>
                              แก้ไข
                            </button>
                            <button
                              type="button"
                              className={`${btn.button} ${btn.buttonDanger}`}
                              onClick={() => handleDelete(Number(teacher.teacherId), teacher.teacherCode)}
                              disabled={deleteTeacher.isPending || !teacher.teacherId}
                            >
                              ลบ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {!teachersQuery.isLoading && filteredTeachers.length > 0 ? (
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
                หน้า {currentPage} / {totalPages} ({filteredTeachers.length} รายการ)
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
            <aside ref={drawerRef} className={styles.drawer} onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={isEditMode ? (selected ? "แก้ไขข้อมูลอาจารย์" : "เพิ่มอาจารย์") : "ข้อมูลอาจารย์"}>
              <header className={styles.drawerHeader}>
                <strong>{isEditMode ? (selected ? "แก้ไขข้อมูลอาจารย์" : "เพิ่มอาจารย์") : "ข้อมูลอาจารย์"}</strong>
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
                        <p className={styles.subText}>รหัส: {selected.teacherCode}</p>
                        <p className={styles.subText}>อีเมล: {selected.email || "-"}</p>
                        <p className={styles.subText}>เบอร์ภายใน: {selected.contactExtension || "-"}</p>
                      </div>
                      <div className={styles.detailSection}>
                        <p className={styles.detailTitle}>ตำแหน่ง</p>
                        <p className={styles.subText}>ตำแหน่ง: {selected.position || "-"}</p>
                        <p className={styles.subText}>
                          ประเภท: {(selected.teacherType ?? teacherTypeFromPosition(selected.position ?? "")) === "support" ? "เจ้าหน้าที่ภาควิชา" : "สายวิชาการ"}
                        </p>
                      </div>
                      <div className={styles.detailSection}>
                        <p className={styles.detailTitle}>สิทธิ์การใช้งาน</p>
                        <div className={styles.tagRow}>
                          <span className={`${styles.tag} ${selected.canAccessTopicExam ? styles.tagOk : styles.tagMuted}`}>
                            สิทธิ์หัวข้อสอบ: {selected.canAccessTopicExam ? "เปิด" : "ปิด"}
                          </span>
                          <span className={`${styles.tag} ${selected.canExportProject1 ? styles.tagOk : styles.tagMuted}`}>
                            สิทธิ์รายชื่อสอบ: {selected.canExportProject1 ? "เปิด" : "ปิด"}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className={styles.empty}>ไม่พบข้อมูลอาจารย์</p>
                  )
                ) : (
                  <div className={styles.formGrid}>
                    <label className={styles.field} htmlFor="teacherCode">
                      <span>รหัสอาจารย์</span>
                      <input
                        id="teacherCode"
                        className={styles.input}
                        value={form.teacherCode}
                        disabled={Boolean(selected)}
                        onChange={(event) => onChangeField("teacherCode", event.target.value)}
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
                      />
                    </label>
                    <label className={styles.field} htmlFor="contactExtension">
                      <span>เบอร์ภายใน</span>
                      <input
                        id="contactExtension"
                        className={styles.input}
                        value={form.contactExtension}
                        onChange={(event) => onChangeField("contactExtension", event.target.value)}
                        placeholder="เช่น 1234"
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
                    <label className={styles.field} htmlFor="position">
                      <span>ตำแหน่ง</span>
                      <select id="position" className={styles.select} value={form.position} onChange={(event) => handlePositionChange(event.target.value)}>
                        {positionOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className={styles.field} htmlFor="teacherType">
                      <span>ประเภทอาจารย์</span>
                      <input
                        id="teacherType"
                        className={styles.input}
                        value={form.teacherType === "support" ? "เจ้าหน้าที่ภาควิชา" : "สายวิชาการ"}
                        readOnly
                      />
                    </label>
                    <div className={`${styles.field} ${styles.fieldFull}`}>
                      <div className={styles.switchGroup}>
                        <label className={styles.switchRow} htmlFor="canAccessTopicExam">
                          <input
                            id="canAccessTopicExam"
                            type="checkbox"
                            checked={form.canAccessTopicExam}
                            onChange={(event) => onChangeField("canAccessTopicExam", event.target.checked)}
                          />
                          เปิดสิทธิ์การเข้าถึงหัวข้อสอบโครงงานพิเศษ
                        </label>
                        <label className={styles.switchRow} htmlFor="canExportProject1">
                          <input
                            id="canExportProject1"
                            type="checkbox"
                            checked={form.canExportProject1}
                            onChange={(event) => onChangeField("canExportProject1", event.target.checked)}
                          />
                          เปิดสิทธิ์ส่งออกรายชื่อสอบโครงงานพิเศษ
                        </label>
                      </div>
                    </div>
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
