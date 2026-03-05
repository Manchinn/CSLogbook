"use client";

import { useMemo, useState } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useProjectPairMeta, useProjectPairMutations, useProjectPairs, useProjectStudentLookup } from "@/hooks/useProjectPairs";
import type { ProjectPairFilters, ProjectPairRecord, ProjectStudentLookup } from "@/lib/services/projectPairsService";
import btn from "@/styles/shared/buttons.module.css";
import styles from "./page.module.css";

type AddForm = {
  studentCode: string;
  student2Code: string;
  projectNameTh: string;
  projectNameEn: string;
  projectType: string;
  advisorId: string;
  coAdvisorId: string;
  trackCodes: string[];
};

type EditForm = {
  projectNameTh: string;
  projectNameEn: string;
  projectType: string;
  advisorId: string;
  coAdvisorId: string;
  trackCodes: string[];
  objective: string;
  background: string;
  scope: string;
  expectedOutcome: string;
  benefit: string;
  methodology: string;
  timelineNote: string;
  constraints: string;
  risk: string;
};

const statusLabels: Record<string, string> = {
  draft: "ร่าง",
  advisor_assigned: "มีอาจารย์ที่ปรึกษาแล้ว",
  in_progress: "กำลังดำเนินการ",
  completed: "เสร็จสิ้น",
  archived: "เก็บถาวร",
  cancelled: "ยกเลิกแล้ว",
};

const projectTypeLabels: Record<string, string> = {
  individual: "โครงงานเดี่ยว",
  group: "โครงงานกลุ่ม",
  research: "โครงงานวิจัย",
  development: "โครงงานพัฒนา",
};

const projectTypeOptions = ["", "individual", "group", "research", "development"];

const emptyAdd: AddForm = {
  studentCode: "",
  student2Code: "",
  projectNameTh: "",
  projectNameEn: "",
  projectType: "",
  advisorId: "",
  coAdvisorId: "",
  trackCodes: [],
};

const emptyEdit: EditForm = {
  projectNameTh: "",
  projectNameEn: "",
  projectType: "",
  advisorId: "",
  coAdvisorId: "",
  trackCodes: [],
  objective: "",
  background: "",
  scope: "",
  expectedOutcome: "",
  benefit: "",
  methodology: "",
  timelineNote: "",
  constraints: "",
  risk: "",
};

const PAGE_SIZE = 20;

function projectName(p: ProjectPairRecord) {
  return p.projectNameTh || p.projectNameEn || p.projectCode || "-";
}

function toEdit(p: ProjectPairRecord): EditForm {
  return {
    projectNameTh: p.projectNameTh || "",
    projectNameEn: p.projectNameEn || "",
    projectType: p.projectType || "",
    advisorId: p.advisorId ? String(p.advisorId) : p.advisor?.teacherId ? String(p.advisor.teacherId) : "",
    coAdvisorId: p.coAdvisorId ? String(p.coAdvisorId) : p.coAdvisor?.teacherId ? String(p.coAdvisor.teacherId) : "",
    trackCodes: p.tracks ?? [],
    objective: p.objective || "",
    background: p.background || "",
    scope: p.scope || "",
    expectedOutcome: p.expectedOutcome || "",
    benefit: p.benefit || "",
    methodology: p.methodology || p.tools || "",
    timelineNote: p.timelineNote || "",
    constraints: p.constraints || "",
    risk: p.risk || "",
  };
}

function roleLabel(role?: string | null) {
  return role === "leader" ? "หัวหน้าทีม" : "สมาชิก";
}

export default function ProjectPairsPage() {
  const [query, setQuery] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [projectType, setProjectType] = useState("");
  const [trackCode, setTrackCode] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ProjectPairRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(emptyEdit);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(emptyAdd);
  const [student1, setStudent1] = useState<ProjectStudentLookup | null>(null);
  const [student2, setStudent2] = useState<ProjectStudentLookup | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);
  // state สำหรับ dialog ยืนยันการยกเลิกโครงงาน
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const { containerRef: drawerRef, saveTrigger } = useFocusTrap(selected !== null);

  const filters: ProjectPairFilters = useMemo(
    () => ({
      projectStatus: projectStatus || undefined,
      projectType: projectType || undefined,
      trackCodes: trackCode || undefined,
    }),
    [projectStatus, projectType, trackCode],
  );

  const listQuery = useProjectPairs(filters);
  const { advisorsQuery, tracksQuery } = useProjectPairMeta();
  const { createProject, updateProject, cancelProject } = useProjectPairMutations();
  const s1Lookup = useProjectStudentLookup(addForm.studentCode.trim() || null, false);
  const s2Lookup = useProjectStudentLookup(addForm.student2Code.trim() || null, false);

  const projects = useMemo(() => listQuery.data?.data ?? [], [listQuery.data?.data]);
  const advisors = advisorsQuery.data ?? [];
  const tracks = tracksQuery.data ?? [];

  const filtered = useMemo(() => {
    const k = query.trim().toLowerCase();
    if (!k) return projects;
    return projects.filter((p) =>
      [
        p.projectNameTh,
        p.projectNameEn,
        p.projectCode,
        p.advisor?.fullName,
        ...(p.members ?? []).flatMap((m) => [m.fullName, m.studentCode]),
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(k)),
    );
  }, [projects, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  const pagedProjects = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [currentPage, filtered]);

  const statusOptions = useMemo(
    () => Array.from(new Set(projects.map((p) => p.status).filter(Boolean))) as string[],
    [projects],
  );

  const trackOptions = useMemo(
    () => Array.from(new Set(projects.flatMap((p) => p.tracks ?? []))),
    [projects],
  );

  const stats = useMemo(() => {
    const statusMap = filtered.reduce<Record<string, number>>((acc, p) => {
      const key = p.status || "unknown";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});
    return {
      total: filtered.length,
      inProgress: statusMap.in_progress ?? 0,
      completed: statusMap.completed ?? 0,
      draft: statusMap.draft ?? 0,
    };
  }, [filtered]);

  const lookup = async (slot: 1 | 2) => {
    if (slot === 1) {
      if (!addForm.studentCode.trim()) return setFeedback({ tone: "warning", message: "กรุณาระบุรหัสนักศึกษา" });
      const r = await s1Lookup.refetch();
      if (r.error) return setFeedback({ tone: "warning", message: r.error.message });
      setStudent1(r.data ?? null);
      return;
    }
    if (!addForm.student2Code.trim()) return setStudent2(null);
    if (addForm.studentCode.trim() === addForm.student2Code.trim())
      return setFeedback({ tone: "warning", message: "ไม่สามารถเลือกนักศึกษาคนเดียวกันได้" });
    const r = await s2Lookup.refetch();
    if (r.error) return setFeedback({ tone: "warning", message: r.error.message });
    setStudent2(r.data ?? null);
  };

  const validateAdd = () => {
    if (!student1) return "กรุณาค้นหาและเลือกนักศึกษาก่อน";
    if (!student1.isEligibleProject) return "นักศึกษาคนที่ 1 ยังไม่มีสิทธิ์ทำโครงงานพิเศษ";
    if (student1.hasActiveProject) return "นักศึกษาคนที่ 1 มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว";
    if (addForm.student2Code.trim()) {
      if (!student2) return "กรุณาค้นหาและเลือกนักศึกษาคนที่ 2";
      if (!student2.isEligibleProject) return "นักศึกษาคนที่ 2 ยังไม่มีสิทธิ์ทำโครงงานพิเศษ";
      if (student2.hasActiveProject) return "นักศึกษาคนที่ 2 มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว";
      if (student1.studentCode === student2.studentCode) return "ไม่สามารถเลือกนักศึกษาคนเดียวกันได้";
    }
    return null;
  };

  const addValidationMessage = validateAdd();

  const onCreate = async () => {
    const m = validateAdd();
    if (m) return setFeedback({ tone: "warning", message: m });
    try {
      const res = await createProject.mutateAsync({
        studentCode: student1?.studentCode || "",
        student2Code: student2?.studentCode || null,
        projectNameTh: addForm.projectNameTh || null,
        projectNameEn: addForm.projectNameEn || null,
        projectType: addForm.projectType || null,
        advisorId: addForm.advisorId ? Number(addForm.advisorId) : null,
        coAdvisorId: addForm.coAdvisorId ? Number(addForm.coAdvisorId) : null,
        trackCodes: addForm.trackCodes,
      });
      setFeedback({ tone: "success", message: res.message || "เพิ่มโครงงานพิเศษสำเร็จ" });
      setAddOpen(false);
      setAddForm(emptyAdd);
      setStudent1(null);
      setStudent2(null);
    } catch (e) {
      setFeedback({ tone: "warning", message: e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการเพิ่มโครงงาน" });
    }
  };

  const onUpdate = async () => {
    if (!selected?.projectId) return;
    try {
      const res = await updateProject.mutateAsync({
        projectId: selected.projectId,
        payload: {
          projectNameTh: editForm.projectNameTh || null,
          projectNameEn: editForm.projectNameEn || null,
          projectType: editForm.projectType || null,
          advisorId: editForm.advisorId ? Number(editForm.advisorId) : null,
          coAdvisorId: editForm.coAdvisorId ? Number(editForm.coAdvisorId) : null,
          trackCodes: editForm.trackCodes,
          objective: editForm.objective || null,
          background: editForm.background || null,
          scope: editForm.scope || null,
          expectedOutcome: editForm.expectedOutcome || null,
          benefit: editForm.benefit || null,
          methodology: editForm.methodology || null,
          timelineNote: editForm.timelineNote || null,
          constraints: editForm.constraints || null,
          risk: editForm.risk || null,
        },
      });
      setFeedback({ tone: "success", message: res.message || "อัปเดตข้อมูลโครงงานสำเร็จ" });
      setIsEditMode(false);
      await listQuery.refetch();
    } catch (e) {
      setFeedback({ tone: "warning", message: e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการอัปเดตโครงงาน" });
    }
  };

  const onCancelProject = () => {
    if (!selected?.projectId) return;
    // เปิด dialog แทนการใช้ window.prompt()
    setCancelReason("");
    setCancelDialogOpen(true);
  };

  const executeCancelProject = async () => {
    if (!selected?.projectId) return;
    setCancelDialogOpen(false);
    try {
      const res = await cancelProject.mutateAsync({ projectId: selected.projectId, reason: cancelReason || undefined });
      setFeedback({ tone: "success", message: res.message || "ยกเลิกโครงงานพิเศษสำเร็จ" });
      setSelected(null);
      await listQuery.refetch();
    } catch (e) {
      setFeedback({ tone: "warning", message: e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการยกเลิกโครงงาน" });
    }
  };

  const closeDrawer = () => {
    setSelected(null);
    setIsEditMode(false);
    setEditForm(emptyEdit);
  };

  const closeAddModal = () => {
    setAddOpen(false);
    setAddForm(emptyAdd);
    setStudent1(null);
    setStudent2(null);
  };

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>นักศึกษาโครงงานพิเศษ</h1>
            <p className={styles.subtitle}>จัดการคู่โครงงานพิเศษ เพิ่ม แก้ไข และยกเลิกโครงงานของนักศึกษา</p>
          </div>
          <div className={btn.buttonRow}>
            <button
              type="button"
              className={btn.button}
              onClick={() => {
                setPage(1);
                void listQuery.refetch();
              }}
            >
              รีเฟรช
            </button>
            <button
              type="button"
              className={`${btn.button} ${btn.buttonPrimary}`}
              onClick={() => setAddOpen(true)}
            >
              เพิ่มโครงงานพิเศษ
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
              <p className={styles.statLabel}>โครงงานทั้งหมด</p>
              <p className={styles.statValue}>{stats.total}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>กำลังดำเนินการ</p>
              <p className={styles.statValue}>{stats.inProgress}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>เสร็จสิ้น</p>
              <p className={styles.statValue}>{stats.completed}</p>
            </div>
            <div className={styles.statItem}>
              <p className={styles.statLabel}>สถานะร่าง</p>
              <p className={styles.statValue}>{stats.draft}</p>
            </div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.filters}>
            <input
              className={styles.input}
              placeholder="ค้นหาโครงงาน, รหัสนักศึกษา, อาจารย์ที่ปรึกษา"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
            <select
              className={styles.select}
              value={projectStatus}
              onChange={(e) => {
                setProjectStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกสถานะ</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {statusLabels[s] ?? s}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={projectType}
              onChange={(e) => {
                setProjectType(e.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกประเภท</option>
              {projectTypeOptions.filter(Boolean).map((t) => (
                <option key={t} value={t}>
                  {projectTypeLabels[t] ?? t}
                </option>
              ))}
            </select>
            <select
              className={styles.select}
              value={trackCode}
              onChange={(e) => {
                setTrackCode(e.target.value);
                setPage(1);
              }}
            >
              <option value="">ทุกแทร็ก</option>
              {trackOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={`${btn.button} ${btn.buttonGhost}`}
              onClick={() => {
                setQuery("");
                setProjectStatus("");
                setProjectType("");
                setTrackCode("");
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
                  <th>โครงงาน</th>
                  <th>สถานะ</th>
                  <th>สมาชิก</th>
                  <th>ที่ปรึกษา</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {listQuery.isLoading ? (
                  <tr>
                    <td colSpan={5}>
                      <p className={styles.empty}>กำลังโหลดข้อมูลโครงงาน...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <p className={styles.empty}>ไม่พบข้อมูลโครงงาน</p>
                    </td>
                  </tr>
                ) : (
                  pagedProjects.map((p) => (
                    <tr key={p.projectId ?? `${p.projectCode}-${p.projectNameTh}`}>
                      <td>
                        <p className={styles.name}>{projectName(p)}</p>
                        <p className={styles.subText}>{p.projectNameEn || "-"}</p>
                      </td>
                      <td>
                        <span className={`${styles.tag} ${p.status === "completed" ? styles.tagOk : styles.tagMuted}`}>
                          {statusLabels[p.status ?? ""] ?? p.status ?? "-"}
                        </span>
                      </td>
                      <td>
                        {(p.members ?? [])
                          .map((m) => `${m.fullName || "-"}${m.studentCode ? ` (${m.studentCode})` : ""}`)
                          .join(", ") || "-"}
                      </td>
                      <td>
                        {p.advisor?.fullName || "-"}
                        {p.coAdvisor?.fullName ? ` / ร่วม: ${p.coAdvisor.fullName}` : ""}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={btn.button}
                          onClick={() => {
                            saveTrigger();
                            setSelected(p);
                            setEditForm(toEdit(p));
                            setIsEditMode(false);
                          }}
                        >
                          ดูรายละเอียด
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {!listQuery.isLoading && filtered.length > 0 ? (
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
                หน้า {currentPage} / {totalPages} ({filtered.length} รายการ)
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

        {selected ? (
          <div className={styles.drawerOverlay} onClick={closeDrawer}>
            <aside ref={drawerRef} className={styles.drawer} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={isEditMode ? "แก้ไขโครงงานพิเศษ" : "รายละเอียดโครงงาน"}>
              <header className={styles.drawerHeader}>
                <strong>{isEditMode ? "แก้ไขโครงงานพิเศษ" : "รายละเอียดโครงงาน"}</strong>
                <button type="button" className={btn.button} onClick={closeDrawer}>
                  ปิด
                </button>
              </header>

              <div className={styles.drawerBody}>
                {!isEditMode ? (
                  <>
                    <div className={styles.detailSection}>
                      <p className={styles.detailTitle}>{projectName(selected)}</p>
                      <p className={styles.subText}>สถานะ: {statusLabels[selected.status ?? ""] ?? selected.status ?? "-"}</p>
                      <p className={styles.subText}>ประเภท: {projectTypeLabels[selected.projectType ?? ""] ?? selected.projectType ?? "-"}</p>
                      <p className={styles.subText}>อัปเดตล่าสุด: {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString("th-TH") : "-"}</p>
                    </div>
                    <div className={styles.detailSection}>
                      <p className={styles.detailTitle}>อาจารย์ที่ปรึกษา</p>
                      <p className={styles.subText}>ที่ปรึกษาหลัก: {selected.advisor?.fullName || "-"}</p>
                      <p className={styles.subText}>ที่ปรึกษาร่วม: {selected.coAdvisor?.fullName || "-"}</p>
                    </div>
                    <div className={styles.detailSection}>
                      <p className={styles.detailTitle}>สมาชิกโครงงาน</p>
                      {(selected.members ?? []).length === 0 ? (
                        <p className={styles.subText}>ไม่พบข้อมูลสมาชิก</p>
                      ) : (
                        (selected.members ?? []).map((m) => (
                          <p key={`${m.studentId}-${m.studentCode}`} className={styles.subText}>
                            [{roleLabel(m.role)}] {m.fullName || "-"}
                            {m.studentCode ? ` (${m.studentCode})` : ""}
                          </p>
                        ))
                      )}
                    </div>
                    <div className={styles.detailSection}>
                      <p className={styles.detailTitle}>รายละเอียดโครงงาน</p>
                      <p className={styles.subText}>ที่มา/ปัญหา: {selected.background || "-"}</p>
                      <p className={styles.subText}>วัตถุประสงค์: {selected.objective || "-"}</p>
                      <p className={styles.subText}>ขอบเขตงาน: {selected.scope || "-"}</p>
                      <p className={styles.subText}>ผลลัพธ์ที่คาดหวัง: {selected.expectedOutcome || "-"}</p>
                      <p className={styles.subText}>ประโยชน์ที่คาดว่าจะได้รับ: {selected.benefit || "-"}</p>
                      <p className={styles.subText}>กระบวนการ/เทคโนโลยีที่ใช้: {selected.methodology || selected.tools || "-"}</p>
                      <p className={styles.subText}>Timeline/หมายเหตุ: {selected.timelineNote || "-"}</p>
                      <p className={styles.subText}>ข้อจำกัด: {selected.constraints || "-"}</p>
                      <p className={styles.subText}>ความเสี่ยง: {selected.risk || "-"}</p>
                    </div>
                  </>
                ) : (
                  <div className={styles.detailSection}>
                    <div className={styles.formGrid}>
                      <label className={styles.field} htmlFor="projectNameTh">
                        <span>ชื่อโครงงาน (ไทย)</span>
                        <input
                          id="projectNameTh"
                          className={styles.input}
                          value={editForm.projectNameTh}
                          onChange={(e) => setEditForm((p) => ({ ...p, projectNameTh: e.target.value }))}
                        />
                      </label>
                      <label className={styles.field} htmlFor="projectNameEn">
                        <span>ชื่อโครงงาน (อังกฤษ)</span>
                        <input
                          id="projectNameEn"
                          className={styles.input}
                          value={editForm.projectNameEn}
                          onChange={(e) => setEditForm((p) => ({ ...p, projectNameEn: e.target.value }))}
                        />
                      </label>
                      <label className={styles.field} htmlFor="projectType">
                        <span>ประเภท</span>
                        <select
                          id="projectType"
                          className={styles.select}
                          value={editForm.projectType}
                          onChange={(e) => setEditForm((p) => ({ ...p, projectType: e.target.value }))}
                        >
                          {projectTypeOptions.map((o) => (
                            <option key={o || "empty"} value={o}>
                              {projectTypeLabels[o] ?? (o || "ไม่ระบุ")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.field} htmlFor="advisorId">
                        <span>อาจารย์ที่ปรึกษาหลัก</span>
                        <select
                          id="advisorId"
                          className={styles.select}
                          value={editForm.advisorId}
                          onChange={(e) => setEditForm((p) => ({ ...p, advisorId: e.target.value }))}
                        >
                          <option value="">ไม่ระบุ</option>
                          {advisors.map((a) => (
                            <option key={a.teacherId} value={String(a.teacherId)}>
                              {(a.user?.firstName || "") + " " + (a.user?.lastName || "")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={styles.field} htmlFor="coAdvisorId">
                        <span>อาจารย์ที่ปรึกษาร่วม</span>
                        <select
                          id="coAdvisorId"
                          className={styles.select}
                          value={editForm.coAdvisorId}
                          onChange={(e) => setEditForm((p) => ({ ...p, coAdvisorId: e.target.value }))}
                        >
                          <option value="">ไม่ระบุ</option>
                          {advisors.map((a) => (
                            <option key={a.teacherId} value={String(a.teacherId)}>
                              {(a.user?.firstName || "") + " " + (a.user?.lastName || "")}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`} htmlFor="trackCodes">
                        <span>Track</span>
                        <select
                          id="trackCodes"
                          className={styles.select}
                          multiple
                          value={editForm.trackCodes}
                          onChange={(e) =>
                            setEditForm((p) => ({
                              ...p,
                              trackCodes: Array.from(e.target.selectedOptions).map((x) => x.value),
                            }))
                          }
                        >
                          {tracks.map((t) => (
                            <option key={t.code} value={t.code}>
                              {t.code} - {t.nameTh || t.name || "-"}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`} htmlFor="background">
                        <span>ที่มา/ปัญหา</span>
                        <textarea
                          id="background"
                          className={styles.textarea}
                          value={editForm.background}
                          onChange={(e) => setEditForm((p) => ({ ...p, background: e.target.value }))}
                        />
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`} htmlFor="objective">
                        <span>วัตถุประสงค์</span>
                        <textarea
                          id="objective"
                          className={styles.textarea}
                          value={editForm.objective}
                          onChange={(e) => setEditForm((p) => ({ ...p, objective: e.target.value }))}
                        />
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`} htmlFor="scope">
                        <span>ขอบเขตงาน</span>
                        <textarea
                          id="scope"
                          className={styles.textarea}
                          value={editForm.scope}
                          onChange={(e) => setEditForm((p) => ({ ...p, scope: e.target.value }))}
                        />
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`} htmlFor="expectedOutcome">
                        <span>ผลลัพธ์ที่คาดหวัง</span>
                        <textarea
                          id="expectedOutcome"
                          className={styles.textarea}
                          value={editForm.expectedOutcome}
                          onChange={(e) => setEditForm((p) => ({ ...p, expectedOutcome: e.target.value }))}
                        />
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`} htmlFor="benefit">
                        <span>ประโยชน์ที่คาดว่าจะได้รับ</span>
                        <textarea
                          id="benefit"
                          className={styles.textarea}
                          value={editForm.benefit}
                          onChange={(e) => setEditForm((p) => ({ ...p, benefit: e.target.value }))}
                        />
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`} htmlFor="methodology">
                        <span>กระบวนการ/เทคโนโลยีที่ใช้</span>
                        <textarea
                          id="methodology"
                          className={styles.textarea}
                          value={editForm.methodology}
                          onChange={(e) => setEditForm((p) => ({ ...p, methodology: e.target.value }))}
                        />
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`} htmlFor="timelineNote">
                        <span>Timeline/หมายเหตุ</span>
                        <textarea
                          id="timelineNote"
                          className={styles.textarea}
                          value={editForm.timelineNote}
                          onChange={(e) => setEditForm((p) => ({ ...p, timelineNote: e.target.value }))}
                        />
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`} htmlFor="constraints">
                        <span>ข้อจำกัด</span>
                        <textarea
                          id="constraints"
                          className={styles.textarea}
                          value={editForm.constraints}
                          onChange={(e) => setEditForm((p) => ({ ...p, constraints: e.target.value }))}
                        />
                      </label>
                      <label className={`${styles.field} ${styles.fieldFull}`} htmlFor="risk">
                        <span>ความเสี่ยง</span>
                        <textarea
                          id="risk"
                          className={styles.textarea}
                          value={editForm.risk}
                          onChange={(e) => setEditForm((p) => ({ ...p, risk: e.target.value }))}
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <footer className={styles.drawerFooter}>
                <div className={btn.buttonRow}>
                  {!isEditMode ? (
                    <>
                      <button
                        type="button"
                        className={`${btn.button} ${btn.buttonPrimary}`}
                        onClick={() => setIsEditMode(true)}
                      >
                        แก้ไขข้อมูล
                      </button>
                      <button
                        type="button"
                        className={`${btn.button} ${btn.buttonDanger}`}
                        onClick={onCancelProject}
                        disabled={
                          cancelProject.isPending ||
                          ["cancelled", "completed", "archived"].includes(selected.status || "")
                        }
                      >
                        ยกเลิกโครงงาน
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" className={btn.button} onClick={() => setIsEditMode(false)}>
                        ย้อนกลับ
                      </button>
                      <button
                        type="button"
                        className={`${btn.button} ${btn.buttonPrimary}`}
                        onClick={onUpdate}
                        disabled={updateProject.isPending}
                      >
                        {updateProject.isPending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                      </button>
                    </>
                  )}
                </div>
              </footer>
            </aside>
          </div>
        ) : null}

        {addOpen ? (
          <div className={styles.modalOverlay} onClick={closeAddModal}>
            <section className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3 className={styles.sectionTitle}>เพิ่มโครงงานพิเศษใหม่</h3>
                <button type="button" className={btn.button} onClick={closeAddModal}>
                  ปิด
                </button>
              </div>

              <div className={styles.cardLite}>
                <div className={styles.formGrid}>
                  <label className={styles.field} htmlFor="addStudentCode">
                    <span>รหัสนักศึกษาคนที่ 1</span>
                    <input
                      id="addStudentCode"
                      className={styles.input}
                      value={addForm.studentCode}
                      onChange={(e) => {
                        setAddForm((p) => ({ ...p, studentCode: e.target.value }));
                        setStudent1(null);
                      }}
                    />
                    <button type="button" className={btn.button} onClick={() => lookup(1)}>
                      ค้นหา
                    </button>
                  </label>
                  <label className={styles.field} htmlFor="addStudent2Code">
                    <span>รหัสนักศึกษาคนที่ 2 (ไม่บังคับ)</span>
                    <input
                      id="addStudent2Code"
                      className={styles.input}
                      value={addForm.student2Code}
                      onChange={(e) => {
                        setAddForm((p) => ({ ...p, student2Code: e.target.value }));
                        setStudent2(null);
                      }}
                    />
                    <button type="button" className={btn.button} onClick={() => lookup(2)}>
                      ค้นหา
                    </button>
                  </label>
                </div>
                {student1 ? (
                  <p className={styles.helper}>
                    คนที่ 1: {(student1.user?.firstName || "-") + " " + (student1.user?.lastName || "-")} ({student1.studentCode || "-"}) |
                    สิทธิ์โครงงาน: {student1.isEligibleProject ? "มีสิทธิ์" : "ไม่มีสิทธิ์"}
                    {student1.hasActiveProject ? " | มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว" : ""}
                  </p>
                ) : null}
                {student2 ? (
                  <p className={styles.helper}>
                    คนที่ 2: {(student2.user?.firstName || "-") + " " + (student2.user?.lastName || "-")} ({student2.studentCode || "-"}) |
                    สิทธิ์โครงงาน: {student2.isEligibleProject ? "มีสิทธิ์" : "ไม่มีสิทธิ์"}
                    {student2.hasActiveProject ? " | มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว" : ""}
                  </p>
                ) : null}
                {addValidationMessage ? (
                  <p className={styles.helper}>ตรวจสอบก่อนบันทึก: {addValidationMessage}</p>
                ) : (
                  <p className={styles.helper}>พร้อมเพิ่มโครงงานได้</p>
                )}
              </div>

              <div className={styles.cardLite}>
                <div className={styles.formGrid}>
                  <label className={styles.field} htmlFor="addProjectNameTh">
                    <span>ชื่อโครงงาน (ไทย)</span>
                    <input
                      id="addProjectNameTh"
                      className={styles.input}
                      value={addForm.projectNameTh}
                      onChange={(e) => setAddForm((p) => ({ ...p, projectNameTh: e.target.value }))}
                    />
                  </label>
                  <label className={styles.field} htmlFor="addProjectNameEn">
                    <span>ชื่อโครงงาน (อังกฤษ)</span>
                    <input
                      id="addProjectNameEn"
                      className={styles.input}
                      value={addForm.projectNameEn}
                      onChange={(e) => setAddForm((p) => ({ ...p, projectNameEn: e.target.value }))}
                    />
                  </label>
                  <label className={styles.field} htmlFor="addProjectType">
                    <span>ประเภท</span>
                    <select
                      id="addProjectType"
                      className={styles.select}
                      value={addForm.projectType}
                      onChange={(e) => setAddForm((p) => ({ ...p, projectType: e.target.value }))}
                    >
                      {projectTypeOptions.map((o) => (
                        <option key={o || "empty"} value={o}>
                          {projectTypeLabels[o] ?? (o || "ไม่ระบุ")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field} htmlFor="addAdvisorId">
                    <span>อาจารย์ที่ปรึกษาหลัก</span>
                    <select
                      id="addAdvisorId"
                      className={styles.select}
                      value={addForm.advisorId}
                      onChange={(e) => setAddForm((p) => ({ ...p, advisorId: e.target.value }))}
                    >
                      <option value="">ไม่ระบุ</option>
                      {advisors.map((a) => (
                        <option key={a.teacherId} value={String(a.teacherId)}>
                          {(a.user?.firstName || "") + " " + (a.user?.lastName || "")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={styles.field} htmlFor="addCoAdvisorId">
                    <span>อาจารย์ที่ปรึกษาร่วม</span>
                    <select
                      id="addCoAdvisorId"
                      className={styles.select}
                      value={addForm.coAdvisorId}
                      onChange={(e) => setAddForm((p) => ({ ...p, coAdvisorId: e.target.value }))}
                    >
                      <option value="">ไม่ระบุ</option>
                      {advisors.map((a) => (
                        <option key={a.teacherId} value={String(a.teacherId)}>
                          {(a.user?.firstName || "") + " " + (a.user?.lastName || "")}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={`${styles.field} ${styles.fieldFull}`} htmlFor="addTrackCodes">
                    <span>Track</span>
                    <select
                      id="addTrackCodes"
                      className={styles.select}
                      multiple
                      value={addForm.trackCodes}
                      onChange={(e) =>
                        setAddForm((p) => ({
                          ...p,
                          trackCodes: Array.from(e.target.selectedOptions).map((x) => x.value),
                        }))
                      }
                    >
                      {tracks.map((t) => (
                        <option key={t.code} value={t.code}>
                          {t.code} - {t.nameTh || t.name || "-"}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className={btn.buttonRow}>
                <button type="button" className={btn.button} onClick={closeAddModal}>
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className={`${btn.button} ${btn.buttonPrimary}`}
                  onClick={onCreate}
                  disabled={createProject.isPending || Boolean(addValidationMessage)}
                >
                  {createProject.isPending ? "กำลังเพิ่ม..." : "เพิ่มโครงงานพิเศษ"}
                </button>
              </div>
            </section>
          </div>
        ) : null}

        {/* Cancel project dialog — แทน window.prompt() */}
        {cancelDialogOpen ? (
          <div className={styles.modalOverlay} onClick={() => setCancelDialogOpen(false)}>
            <section className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h3>ยืนยันการยกเลิกโครงงาน</h3>
                <button type="button" className={btn.button} onClick={() => setCancelDialogOpen(false)}>×</button>
              </div>
              <div className={styles.cardLite}>
                <p style={{ marginBottom: 12 }}>
                  ต้องการยกเลิกโครงงานนี้ใช่ไหม? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>
                <label htmlFor="cancel-reason" style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
                  เหตุผลการยกเลิก (ไม่บังคับ)
                </label>
                <textarea
                  id="cancel-reason"
                  className={styles.input}
                  rows={3}
                  placeholder="ระบุเหตุผล..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{ width: "100%", resize: "vertical" }}
                />
              </div>
              <div className={styles.drawerFooter}>
                <button type="button" className={btn.button} onClick={() => setCancelDialogOpen(false)}>
                  ยกเลิก
                </button>
                <button
                  type="button"
                  className={`${btn.button} ${btn.buttonDanger}`}
                  onClick={() => void executeCancelProject()}
                  disabled={cancelProject.isPending}
                >
                  {cancelProject.isPending ? "กำลังดำเนินการ..." : "ยืนยันยกเลิก"}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}
