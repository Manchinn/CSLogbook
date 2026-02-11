"use client";

import { useMemo, useState } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useProjectPairMeta, useProjectPairMutations, useProjectPairs, useProjectStudentLookup } from "@/hooks/useProjectPairs";
import type { ProjectPairFilters, ProjectPairRecord, ProjectStudentLookup } from "@/lib/services/projectPairsService";
import styles from "./page.module.css";

type AddForm = { studentCode: string; student2Code: string; projectNameTh: string; projectNameEn: string; projectType: string; advisorId: string; coAdvisorId: string; trackCodes: string[] };
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

const statusLabels: Record<string, string> = { draft: "ร่าง", advisor_assigned: "มีอาจารย์ที่ปรึกษาแล้ว", in_progress: "กำลังดำเนินการ", completed: "เสร็จสิ้น", archived: "เก็บถาวร", cancelled: "ยกเลิกแล้ว" };
const projectTypeLabels: Record<string, string> = { individual: "โครงงานเดี่ยว", group: "โครงงานกลุ่ม", research: "โครงงานวิจัย", development: "โครงงานพัฒนา" };
const projectTypeOptions = ["", "individual", "group", "research", "development"];
const emptyAdd: AddForm = { studentCode: "", student2Code: "", projectNameTh: "", projectNameEn: "", projectType: "", advisorId: "", coAdvisorId: "", trackCodes: [] };
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

const projectName = (p: ProjectPairRecord) => p.projectNameTh || p.projectNameEn || p.projectCode || "-";
const toEdit = (p: ProjectPairRecord): EditForm => ({
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
});
const roleLabel = (role?: string | null) => (role === "leader" ? "หัวหน้าทีม" : "สมาชิก");

export default function ProjectPairsPage() {
  const [query, setQuery] = useState("");
  const [projectStatus, setProjectStatus] = useState("");
  const [projectType, setProjectType] = useState("");
  const [trackCode, setTrackCode] = useState("");
  const [selected, setSelected] = useState<ProjectPairRecord | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>(emptyEdit);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState<AddForm>(emptyAdd);
  const [student1, setStudent1] = useState<ProjectStudentLookup | null>(null);
  const [student2, setStudent2] = useState<ProjectStudentLookup | null>(null);
  const [feedback, setFeedback] = useState<{ tone: "success" | "warning"; message: string } | null>(null);

  const filters: ProjectPairFilters = useMemo(() => ({ projectStatus: projectStatus || undefined, projectType: projectType || undefined, trackCodes: trackCode || undefined }), [projectStatus, projectType, trackCode]);
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
    return projects.filter((p) => [p.projectNameTh, p.projectNameEn, p.projectCode, p.advisor?.fullName, ...(p.members ?? []).flatMap((m) => [m.fullName, m.studentCode])].filter(Boolean).some((v) => String(v).toLowerCase().includes(k)));
  }, [projects, query]);

  const statusOptions = useMemo(() => Array.from(new Set(projects.map((p) => p.status).filter(Boolean))) as string[], [projects]);
  const trackOptions = useMemo(() => Array.from(new Set(projects.flatMap((p) => p.tracks ?? []))), [projects]);
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
    if (addForm.studentCode.trim() === addForm.student2Code.trim()) return setFeedback({ tone: "warning", message: "ไม่สามารถเลือกนักศึกษาคนเดียวกันได้" });
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
      const res = await createProject.mutateAsync({ studentCode: student1?.studentCode || "", student2Code: student2?.studentCode || null, projectNameTh: addForm.projectNameTh || null, projectNameEn: addForm.projectNameEn || null, projectType: addForm.projectType || null, advisorId: addForm.advisorId ? Number(addForm.advisorId) : null, coAdvisorId: addForm.coAdvisorId ? Number(addForm.coAdvisorId) : null, trackCodes: addForm.trackCodes });
      setFeedback({ tone: "success", message: res.message || "เพิ่มโครงงานพิเศษสำเร็จ" });
      setAddOpen(false); setAddForm(emptyAdd); setStudent1(null); setStudent2(null);
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

  const onCancelProject = async () => {
    if (!selected?.projectId) return;
    const reason = window.prompt("ระบุเหตุผลการยกเลิกโครงงาน (ไม่บังคับ)", "");
    if (reason === null) return;
    try {
      const res = await cancelProject.mutateAsync({ projectId: selected.projectId, reason });
      setFeedback({ tone: "success", message: res.message || "ยกเลิกโครงงานพิเศษสำเร็จ" });
      setSelected(null);
      await listQuery.refetch();
    } catch (e) {
      setFeedback({ tone: "warning", message: e instanceof Error ? e.message : "เกิดข้อผิดพลาดในการยกเลิกโครงงาน" });
    }
  };

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>นักศึกษาโครงงานพิเศษ</h1>
            <p className={styles.subtitle}>เพิ่ม/แก้ไข/ยกเลิกโครงงาน พร้อม validation message ตาม legacy</p>
          </div>
          <div className={styles.buttonRow}>
            <button className={styles.button} onClick={() => listQuery.refetch()}>รีเฟรช</button>
            <button className={styles.button} onClick={() => setAddOpen(true)}>เพิ่มโครงงานพิเศษ</button>
          </div>
        </header>

        {feedback ? <div className={`${styles.card} ${feedback.tone === "success" ? styles.tagOk : styles.tagMuted}`}>{feedback.message}</div> : null}

        <section className={styles.card}>
          <div className={styles.stats}>
            <div className={styles.statItem}><p className={styles.statLabel}>โครงงานทั้งหมด</p><p className={styles.statValue}>{stats.total}</p></div>
            <div className={styles.statItem}><p className={styles.statLabel}>กำลังดำเนินการ</p><p className={styles.statValue}>{stats.inProgress}</p></div>
            <div className={styles.statItem}><p className={styles.statLabel}>เสร็จสิ้น</p><p className={styles.statValue}>{stats.completed}</p></div>
            <div className={styles.statItem}><p className={styles.statLabel}>สถานะร่าง</p><p className={styles.statValue}>{stats.draft}</p></div>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.filters}>
            <input className={styles.input} placeholder="ค้นหาโครงงาน, รหัสนักศึกษา, อาจารย์ที่ปรึกษา" value={query} onChange={(e) => setQuery(e.target.value)} />
            <select className={styles.select} value={projectStatus} onChange={(e) => setProjectStatus(e.target.value)}><option value="">ทุกสถานะ</option>{statusOptions.map((s) => <option key={s} value={s}>{statusLabels[s] ?? s}</option>)}</select>
            <select className={styles.select} value={projectType} onChange={(e) => setProjectType(e.target.value)}><option value="">ทุกประเภท</option>{projectTypeOptions.filter(Boolean).map((t) => <option key={t} value={t}>{t}</option>)}</select>
            <select className={styles.select} value={trackCode} onChange={(e) => setTrackCode(e.target.value)}><option value="">ทุกแทร็ก</option>{trackOptions.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            <button className={`${styles.button} ${styles.buttonGhost}`} onClick={() => { setQuery(""); setProjectStatus(""); setProjectType(""); setTrackCode(""); }}>ล้างตัวกรอง</button>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>โครงงาน</th><th>สถานะ</th><th>สมาชิก</th><th>ที่ปรึกษา</th><th>จัดการ</th></tr></thead>
              <tbody>
                {listQuery.isLoading ? <tr><td colSpan={5}><p className={styles.empty}>กำลังโหลดข้อมูลโครงงาน...</p></td></tr> : null}
                {!listQuery.isLoading && filtered.length === 0 ? <tr><td colSpan={5}><p className={styles.empty}>ไม่พบข้อมูลโครงงาน</p></td></tr> : null}
                {filtered.map((p) => (
                  <tr key={p.projectId ?? `${p.projectCode}-${p.projectNameTh}`}>
                    <td><p className={styles.name}>{projectName(p)}</p><p className={styles.subText}>{p.projectNameEn || "-"}</p></td>
                    <td><span className={`${styles.tag} ${p.status === "completed" ? styles.tagOk : styles.tagMuted}`}>{statusLabels[p.status ?? ""] ?? p.status ?? "-"}</span></td>
                    <td>{(p.members ?? []).map((m) => `${m.fullName || "-"}${m.studentCode ? ` (${m.studentCode})` : ""}`).join(", ") || "-"}</td>
                    <td>{p.advisor?.fullName || "-"}{p.coAdvisor?.fullName ? ` / ร่วม: ${p.coAdvisor.fullName}` : ""}</td>
                    <td><button className={styles.button} onClick={() => { setSelected(p); setEditForm(toEdit(p)); setIsEditMode(false); }}>ดูรายละเอียด</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {selected ? (
          <div className={styles.drawerOverlay} onClick={() => setSelected(null)}>
            <aside className={styles.drawer} onClick={(e) => e.stopPropagation()}>
              <header className={styles.drawerHeader}><strong>{isEditMode ? "แก้ไขโครงงานพิเศษ" : "รายละเอียดโครงงาน"}</strong><button className={styles.button} onClick={() => setSelected(null)}>ปิด</button></header>
              <div className={styles.drawerBody}>
                {!isEditMode ? (
                  <>
                    <section className={styles.detailCard}>
                      <h3 className={styles.detailTitle}>{projectName(selected)}</h3>
                      <p className={styles.subText}>สถานะ: {statusLabels[selected.status ?? ""] ?? selected.status ?? "-"}</p>
                      <p className={styles.subText}>ประเภท: {projectTypeLabels[selected.projectType ?? ""] ?? selected.projectType ?? "-"}</p>
                      <p className={styles.subText}>ที่ปรึกษาหลัก: {selected.advisor?.fullName || "-"}</p>
                      <p className={styles.subText}>ที่ปรึกษาร่วม: {selected.coAdvisor?.fullName || "-"}</p>
                      <p className={styles.subText}>อัปเดตล่าสุด: {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString("th-TH") : "-"}</p>
                    </section>
                    <section className={styles.detailCard}>
                      <h4 className={styles.detailTitle}>สมาชิกโครงงาน</h4>
                      {(selected.members ?? []).length === 0 ? <p className={styles.subText}>ไม่พบข้อมูลสมาชิก</p> : null}
                      {(selected.members ?? []).map((m) => (
                        <p key={`${m.studentId}-${m.studentCode}`} className={styles.subText}>
                          [{roleLabel(m.role)}] {m.fullName || "-"}{m.studentCode ? ` (${m.studentCode})` : ""}
                        </p>
                      ))}
                    </section>
                    <section className={styles.detailCard}>
                      <h4 className={styles.detailTitle}>รายละเอียดโครงงาน</h4>
                      <p className={styles.subText}>ที่มา/ปัญหา: {selected.background || "-"}</p>
                      <p className={styles.subText}>วัตถุประสงค์: {selected.objective || "-"}</p>
                      <p className={styles.subText}>ขอบเขตงาน: {selected.scope || "-"}</p>
                      <p className={styles.subText}>ผลลัพธ์ที่คาดหวัง: {selected.expectedOutcome || "-"}</p>
                      <p className={styles.subText}>ประโยชน์ที่คาดว่าจะได้รับ: {selected.benefit || "-"}</p>
                      <p className={styles.subText}>กระบวนการ/เทคโนโลยีที่ใช้: {selected.methodology || selected.tools || "-"}</p>
                      <p className={styles.subText}>Timeline/หมายเหตุ: {selected.timelineNote || "-"}</p>
                      <p className={styles.subText}>ข้อจำกัด: {selected.constraints || "-"}</p>
                      <p className={styles.subText}>ความเสี่ยง: {selected.risk || "-"}</p>
                    </section>
                    <div className={styles.buttonRow}>
                      <button className={styles.button} onClick={() => setIsEditMode(true)}>แก้ไขข้อมูล</button>
                      <button className={styles.button} onClick={onCancelProject} disabled={cancelProject.isPending || ["cancelled", "completed", "archived"].includes(selected.status || "")}>ยกเลิกโครงงาน</button>
                    </div>
                  </>
                ) : (
                  <>
                    <section className={styles.detailCard}>
                      <div className={styles.formGrid}>
                        <label className={styles.field}>ชื่อโครงงาน (ไทย)<input className={styles.input} value={editForm.projectNameTh} onChange={(e) => setEditForm((p) => ({ ...p, projectNameTh: e.target.value }))} /></label>
                        <label className={styles.field}>ชื่อโครงงาน (อังกฤษ)<input className={styles.input} value={editForm.projectNameEn} onChange={(e) => setEditForm((p) => ({ ...p, projectNameEn: e.target.value }))} /></label>
                        <label className={styles.field}>ประเภท<select className={styles.select} value={editForm.projectType} onChange={(e) => setEditForm((p) => ({ ...p, projectType: e.target.value }))}>{projectTypeOptions.map((o) => <option key={o || "empty"} value={o}>{o || "ไม่ระบุ"}</option>)}</select></label>
                        <label className={styles.field}>อาจารย์ที่ปรึกษาหลัก<select className={styles.select} value={editForm.advisorId} onChange={(e) => setEditForm((p) => ({ ...p, advisorId: e.target.value }))}><option value="">ไม่ระบุ</option>{advisors.map((a) => <option key={a.teacherId} value={String(a.teacherId)}>{(a.user?.firstName || "") + " " + (a.user?.lastName || "")}</option>)}</select></label>
                        <label className={styles.field}>อาจารย์ที่ปรึกษาร่วม<select className={styles.select} value={editForm.coAdvisorId} onChange={(e) => setEditForm((p) => ({ ...p, coAdvisorId: e.target.value }))}><option value="">ไม่ระบุ</option>{advisors.map((a) => <option key={a.teacherId} value={String(a.teacherId)}>{(a.user?.firstName || "") + " " + (a.user?.lastName || "")}</option>)}</select></label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>Track<select className={styles.select} multiple value={editForm.trackCodes} onChange={(e) => setEditForm((p) => ({ ...p, trackCodes: Array.from(e.target.selectedOptions).map((x) => x.value) }))}>{tracks.map((t) => <option key={t.code} value={t.code}>{t.code} - {t.nameTh || t.name || "-"}</option>)}</select></label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>ที่มา/ปัญหา<textarea className={styles.textarea} value={editForm.background} onChange={(e) => setEditForm((p) => ({ ...p, background: e.target.value }))} /></label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>วัตถุประสงค์<textarea className={styles.textarea} value={editForm.objective} onChange={(e) => setEditForm((p) => ({ ...p, objective: e.target.value }))} /></label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>ขอบเขตงาน<textarea className={styles.textarea} value={editForm.scope} onChange={(e) => setEditForm((p) => ({ ...p, scope: e.target.value }))} /></label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>ผลลัพธ์ที่คาดหวัง<textarea className={styles.textarea} value={editForm.expectedOutcome} onChange={(e) => setEditForm((p) => ({ ...p, expectedOutcome: e.target.value }))} /></label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>ประโยชน์ที่คาดว่าจะได้รับ<textarea className={styles.textarea} value={editForm.benefit} onChange={(e) => setEditForm((p) => ({ ...p, benefit: e.target.value }))} /></label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>กระบวนการ/เทคโนโลยีที่ใช้<textarea className={styles.textarea} value={editForm.methodology} onChange={(e) => setEditForm((p) => ({ ...p, methodology: e.target.value }))} /></label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>Timeline/หมายเหตุ<textarea className={styles.textarea} value={editForm.timelineNote} onChange={(e) => setEditForm((p) => ({ ...p, timelineNote: e.target.value }))} /></label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>ข้อจำกัด<textarea className={styles.textarea} value={editForm.constraints} onChange={(e) => setEditForm((p) => ({ ...p, constraints: e.target.value }))} /></label>
                        <label className={`${styles.field} ${styles.fieldFull}`}>ความเสี่ยง<textarea className={styles.textarea} value={editForm.risk} onChange={(e) => setEditForm((p) => ({ ...p, risk: e.target.value }))} /></label>
                      </div>
                    </section>
                    <div className={styles.buttonRow}><button className={styles.button} onClick={() => setIsEditMode(false)}>ย้อนกลับ</button><button className={styles.button} onClick={onUpdate} disabled={updateProject.isPending}>{updateProject.isPending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}</button></div>
                  </>
                )}
              </div>
            </aside>
          </div>
        ) : null}

        {addOpen ? (
          <div className={styles.modalOverlay} onClick={() => { setAddOpen(false); setAddForm(emptyAdd); setStudent1(null); setStudent2(null); }}>
            <section className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}><h3 className={styles.sectionTitle}>เพิ่มโครงงานพิเศษใหม่</h3><button className={styles.button} onClick={() => setAddOpen(false)}>ปิด</button></div>
              <div className={styles.cardLite}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>รหัสนักศึกษาคนที่ 1<input className={styles.input} value={addForm.studentCode} onChange={(e) => { setAddForm((p) => ({ ...p, studentCode: e.target.value })); setStudent1(null); }} /><button className={styles.button} onClick={() => lookup(1)}>ค้นหา</button></label>
                  <label className={styles.field}>รหัสนักศึกษาคนที่ 2 (ไม่บังคับ)<input className={styles.input} value={addForm.student2Code} onChange={(e) => { setAddForm((p) => ({ ...p, student2Code: e.target.value })); setStudent2(null); }} /><button className={styles.button} onClick={() => lookup(2)}>ค้นหา</button></label>
                </div>
                {student1 ? <p className={styles.helper}>คนที่ 1: {(student1.user?.firstName || "-") + " " + (student1.user?.lastName || "-")} ({student1.studentCode || "-"}) | สิทธิ์โครงงาน: {student1.isEligibleProject ? "มีสิทธิ์" : "ไม่มีสิทธิ์"} {student1.hasActiveProject ? "| มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว" : ""}</p> : null}
                {student2 ? <p className={styles.helper}>คนที่ 2: {(student2.user?.firstName || "-") + " " + (student2.user?.lastName || "-")} ({student2.studentCode || "-"}) | สิทธิ์โครงงาน: {student2.isEligibleProject ? "มีสิทธิ์" : "ไม่มีสิทธิ์"} {student2.hasActiveProject ? "| มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว" : ""}</p> : null}
                {addValidationMessage ? <p className={styles.helper}>ตรวจสอบก่อนบันทึก: {addValidationMessage}</p> : <p className={styles.helper}>พร้อมเพิ่มโครงงานได้</p>}
              </div>
              <div className={styles.cardLite}>
                <div className={styles.formGrid}>
                  <label className={styles.field}>ชื่อโครงงาน (ไทย)<input className={styles.input} value={addForm.projectNameTh} onChange={(e) => setAddForm((p) => ({ ...p, projectNameTh: e.target.value }))} /></label>
                  <label className={styles.field}>ชื่อโครงงาน (อังกฤษ)<input className={styles.input} value={addForm.projectNameEn} onChange={(e) => setAddForm((p) => ({ ...p, projectNameEn: e.target.value }))} /></label>
                  <label className={styles.field}>ประเภท<select className={styles.select} value={addForm.projectType} onChange={(e) => setAddForm((p) => ({ ...p, projectType: e.target.value }))}>{projectTypeOptions.map((o) => <option key={o || "empty"} value={o}>{o || "ไม่ระบุ"}</option>)}</select></label>
                  <label className={styles.field}>อาจารย์ที่ปรึกษาหลัก<select className={styles.select} value={addForm.advisorId} onChange={(e) => setAddForm((p) => ({ ...p, advisorId: e.target.value }))}><option value="">ไม่ระบุ</option>{advisors.map((a) => <option key={a.teacherId} value={String(a.teacherId)}>{(a.user?.firstName || "") + " " + (a.user?.lastName || "")}</option>)}</select></label>
                  <label className={styles.field}>อาจารย์ที่ปรึกษาร่วม<select className={styles.select} value={addForm.coAdvisorId} onChange={(e) => setAddForm((p) => ({ ...p, coAdvisorId: e.target.value }))}><option value="">ไม่ระบุ</option>{advisors.map((a) => <option key={a.teacherId} value={String(a.teacherId)}>{(a.user?.firstName || "") + " " + (a.user?.lastName || "")}</option>)}</select></label>
                  <label className={`${styles.field} ${styles.fieldFull}`}>Track<select className={styles.select} multiple value={addForm.trackCodes} onChange={(e) => setAddForm((p) => ({ ...p, trackCodes: Array.from(e.target.selectedOptions).map((x) => x.value) }))}>{tracks.map((t) => <option key={t.code} value={t.code}>{t.code} - {t.nameTh || t.name || "-"}</option>)}</select></label>
                </div>
              </div>
              <div className={styles.buttonRow}><button className={styles.button} onClick={() => setAddOpen(false)}>ยกเลิก</button><button className={styles.button} onClick={onCreate} disabled={createProject.isPending || Boolean(addValidationMessage)}>{createProject.isPending ? "กำลังเพิ่ม..." : "เพิ่มโครงงานพิเศษ"}</button></div>
            </section>
          </div>
        ) : null}
      </div>
    </RoleGuard>
  );
}
