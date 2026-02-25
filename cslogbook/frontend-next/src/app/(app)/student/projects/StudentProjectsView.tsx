"use client";

import { useState, useCallback, FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  getStudentProjects,
  getProjectById,
  type ProjectSummary,
  type ProjectDetail,
  type ProjectMemberSummary,
} from "@/lib/services/studentService";
import {
  updateProject,
  addMember,
  activateProject,
  type ProjectUpdatePayload,
} from "@/lib/services/projectService";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import styles from "./projects.module.css";

const STATUS_LABEL: Record<string, string> = {
  draft:            "ฉบับร่าง",
  advisor_assigned: "รอเริ่มดำเนินงาน",
  in_progress:      "กำลังดำเนินการ",
  completed:        "เสร็จสิ้น",
  archived:         "ถูกเก็บถาวร",
};

const STATUS_TONE: Record<string, string> = {
  draft:            "muted",
  advisor_assigned: "info",
  in_progress:      "positive",
  completed:        "positive",
  archived:         "muted",
};

const TYPE_LABEL: Record<string, string> = {
  govern:  "ความร่วมมือกับหน่วยงานรัฐ",
  private: "ความร่วมมือกับภาคเอกชน",
  research:"โครงงานวิจัย",
};

function statusToneClass(status: string | null | undefined, s: typeof styles) {
  const tone = STATUS_TONE[status ?? ""] ?? "muted";
  if (tone === "positive") return s.badgePositive;
  if (tone === "info")     return s.badgeInfo;
  return s.badgeMuted;
}

// ---------------------------------------------------------------- modals

type EditFormState = {
  projectNameTh: string;
  projectNameEn: string;
  projectType:   string;
  objective:     string;
  background:    string;
  benefit:       string;
};

type ViewModalState = { open: false } | { open: true; project: ProjectDetail };
type EditModalState = { open: false } | { open: true; projectId: number; form: EditFormState };
type MemberModalState = { open: false } | { open: true; projectId: number; studentCode: string };

// ----------------------------------------------------------------

export default function StudentProjectsView() {
  const { token } = useAuth();
  const hydrated  = useHydrated();
  const qc        = useQueryClient();
  const enabled   = hydrated && Boolean(token);

  /* ---- queries ---- */
  const projectsQuery = useQuery({
    queryKey: ["student-projects", token],
    queryFn:  () => getStudentProjects(token ?? ""),
    enabled,
  });

  /* ---- modals & form state ---- */
  const [viewModal,   setViewModal]   = useState<ViewModalState>({ open: false });
  const [editModal,   setEditModal]   = useState<EditModalState>({ open: false });
  const [memberModal, setMemberModal] = useState<MemberModalState>({ open: false });
  const [formError,   setFormError]   = useState<string | null>(null);
  const [loadingView, setLoadingView] = useState(false);

  /* ---- mutations ---- */
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProjectUpdatePayload }) =>
      updateProject(token ?? "", id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["student-projects"] });
      setEditModal({ open: false });
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message ?? "ไม่สามารถอัปเดตโครงงานได้"),
  });

  const addMemberMutation = useMutation({
    mutationFn: ({ id, studentCode }: { id: number; studentCode: string }) =>
      addMember(token ?? "", id, studentCode),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["student-projects"] });
      setMemberModal({ open: false });
      setFormError(null);
    },
    onError: (err: Error) => setFormError(err.message ?? "ไม่สามารถเพิ่มสมาชิกได้"),
  });

  const activateMutation = useMutation({
    mutationFn: (id: number) => activateProject(token ?? "", id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["student-projects"] });
    },
  });

  /* ---- handlers ---- */
  const handleView = useCallback(
    async (p: ProjectSummary) => {
      setLoadingView(true);
      try {
        const detail = await getProjectById(token ?? "", p.projectId);
        if (detail) setViewModal({ open: true, project: detail });
      } finally {
        setLoadingView(false);
      }
    },
    [token]
  );

  const handleOpenEdit = (p: ProjectSummary) => {
    setFormError(null);
    setEditModal({
      open: true,
      projectId: p.projectId,
      form: {
        projectNameTh: p.projectNameTh ?? "",
        projectNameEn: p.projectNameEn ?? "",
        projectType:   p.projectType   ?? "",
        objective:     "",
        background:    "",
        benefit:       "",
      },
    });
  };

  const handleEditSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!editModal.open) return;
    updateMutation.mutate({
      id: editModal.projectId,
      payload: {
        projectNameTh: editModal.form.projectNameTh || null,
        projectNameEn: editModal.form.projectNameEn || null,
        projectType:   editModal.form.projectType   || null,
        objective:     editModal.form.objective     || null,
        background:    editModal.form.background    || null,
        benefit:       editModal.form.benefit       || null,
      },
    });
  };

  const handleMemberSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!memberModal.open) return;
    addMemberMutation.mutate({ id: memberModal.projectId, studentCode: memberModal.studentCode });
  };

  /* ---- render ---- */
  const projects: ProjectSummary[] = projectsQuery.data ?? [];

  if (!hydrated || projectsQuery.isLoading) {
    return <div className={styles.page}><p className={styles.lead}>กำลังโหลดข้อมูล...</p></div>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>My Projects</p>
          <h1 className={styles.title}>จัดการโครงงานพิเศษ</h1>
          <p className={styles.lead}>จัดการและแก้ไขรายละเอียดโครงงานพิเศษของคุณ</p>
        </div>
      </header>

      {projectsQuery.isError && (
        <div className={styles.callout}>
          <p className={styles.calloutTitle}>โหลดข้อมูลไม่สำเร็จ</p>
          <p className={styles.calloutText}>กรุณาลองใหม่หรือติดต่อเจ้าหน้าที่</p>
          <button className={styles.secondaryButton} type="button" onClick={() => projectsQuery.refetch()}>
            ลองใหม่
          </button>
        </div>
      )}

      {projects.length === 0 && !projectsQuery.isLoading && !projectsQuery.isError && (
        <div className={styles.callout}>
          <p className={styles.calloutTitle}>ไม่พบโครงงานพิเศษ</p>
          <p className={styles.calloutText}>
            คุณยังไม่มีโครงงานพิเศษในระบบ กรุณาติดต่อเจ้าหน้าที่ภาควิชาเพื่อสร้างโครงงาน
          </p>
          <Link href="/project/phase1" className={styles.primaryButton}>ไปหน้าโครงงานพิเศษ</Link>
        </div>
      )}

      {projects.length > 0 && (
        <section className={styles.tableSection}>
          <div className={styles.tableHead}>
            <span>ชื่อโครงงาน</span>
            <span>ประเภท</span>
            <span>สถานะ</span>
            <span>สมาชิก</span>
            <span>การดำเนินการ</span>
          </div>
          {projects.map((p) => (
            <div key={p.projectId} className={styles.tableRow}>
              <div>
                <p className={styles.rowTitle}>{p.projectNameTh ?? "-"}</p>
                {p.projectNameEn && <p className={styles.rowHint}>{p.projectNameEn}</p>}
              </div>
              <div>
                <p className={styles.rowValue}>{TYPE_LABEL[p.projectType ?? ""] ?? (p.projectType ?? "-")}</p>
              </div>
              <div>
                <span className={`${styles.badge} ${statusToneClass(p.status, styles)}`}>
                  {STATUS_LABEL[p.status ?? ""] ?? (p.status ?? "-")}
                </span>
              </div>
              <div>
                <p className={styles.rowValue}>{(p.members ?? []).length} คน</p>
              </div>
              <div className={styles.rowActions}>
                <button
                  className={styles.secondaryButton}
                  type="button"
                  disabled={loadingView}
                  onClick={() => void handleView(p)}
                >
                  ดูรายละเอียด
                </button>
                {p.status === "draft" && (
                  <>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                    >
                      แก้ไข
                    </button>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      onClick={() =>
                        setMemberModal({ open: true, projectId: p.projectId, studentCode: "" })
                      }
                    >
                      เพิ่มสมาชิก
                    </button>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      disabled={activateMutation.isPending}
                      onClick={() => activateMutation.mutate(p.projectId)}
                    >
                      เปิดใช้งาน
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ---- View Modal ---- */}
      {viewModal.open && (
        <div className={styles.modalOverlay} onClick={() => setViewModal({ open: false })} role="presentation">
          <div className={styles.modalContent} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalKicker}>รายละเอียดโครงงาน</p>
            <h2 className={styles.modalTitle}>{viewModal.project.projectNameTh ?? "-"}</h2>
            <dl className={styles.descList}>
              <dt>ชื่อภาษาอังกฤษ</dt><dd>{viewModal.project.projectNameEn ?? "-"}</dd>
              <dt>ประเภท</dt><dd>{TYPE_LABEL[viewModal.project.projectType ?? ""] ?? "-"}</dd>
              <dt>สถานะ</dt><dd>{STATUS_LABEL[viewModal.project.status ?? ""] ?? (viewModal.project.status ?? "-")}</dd>
            </dl>
            <h3 className={styles.modalSubtitle}>สมาชิก</h3>
            <div className={styles.memberList}>
              {(viewModal.project.members ?? []).map((m: ProjectMemberSummary) => (
                <div key={m.studentId} className={styles.memberTag}>
                  <span>{m.name ?? m.studentCode ?? "-"}</span>
                  <span className={styles.rowHint}>{m.studentCode}</span>
                </div>
              ))}
              {(viewModal.project.members ?? []).length === 0 && (
                <p className={styles.rowHint}>ยังไม่มีสมาชิก</p>
              )}
            </div>
            <div className={styles.modalActions}>
              <button className={styles.secondaryButton} type="button" onClick={() => setViewModal({ open: false })}>
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Edit Modal ---- */}
      {editModal.open && (
        <div className={styles.modalOverlay} onClick={() => setEditModal({ open: false })} role="presentation">
          <div className={styles.modalContent} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalKicker}>แก้ไขโครงงาน</p>
            <h2 className={styles.modalTitle}>แก้ไขรายละเอียดโครงงาน</h2>
            <form className={styles.form} onSubmit={handleEditSubmit}>
              <label className={styles.label}>ชื่อโครงงาน (ภาษาไทย)
                <input
                  className={styles.input}
                  value={editModal.form.projectNameTh}
                  onChange={(e) => setEditModal((prev) => prev.open ? { ...prev, form: { ...prev.form, projectNameTh: e.target.value } } : prev)}
                />
              </label>
              <label className={styles.label}>ชื่อโครงงาน (ภาษาอังกฤษ)
                <input
                  className={styles.input}
                  value={editModal.form.projectNameEn}
                  onChange={(e) => setEditModal((prev) => prev.open ? { ...prev, form: { ...prev.form, projectNameEn: e.target.value } } : prev)}
                />
              </label>
              <label className={styles.label}>ประเภทโครงงาน
                <select
                  className={styles.input}
                  value={editModal.form.projectType}
                  onChange={(e) => setEditModal((prev) => prev.open ? { ...prev, form: { ...prev.form, projectType: e.target.value } } : prev)}
                >
                  <option value="">-- เลือกประเภท --</option>
                  <option value="govern">ความร่วมมือกับหน่วยงานรัฐ</option>
                  <option value="private">ความร่วมมือกับภาคเอกชน</option>
                  <option value="research">โครงงานวิจัย</option>
                </select>
              </label>
              <label className={styles.label}>วัตถุประสงค์
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={editModal.form.objective}
                  onChange={(e) => setEditModal((prev) => prev.open ? { ...prev, form: { ...prev.form, objective: e.target.value } } : prev)}
                />
              </label>
              <label className={styles.label}>ที่มาและความสำคัญ
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={editModal.form.background}
                  onChange={(e) => setEditModal((prev) => prev.open ? { ...prev, form: { ...prev.form, background: e.target.value } } : prev)}
                />
              </label>
              {formError && <p className={styles.error}>{formError}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setEditModal({ open: false })}>
                  ยกเลิก
                </button>
                <button type="submit" className={styles.primaryButton} disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---- Add Member Modal ---- */}
      {memberModal.open && (
        <div className={styles.modalOverlay} onClick={() => setMemberModal({ open: false })} role="presentation">
          <div className={styles.modalContent} role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p className={styles.modalKicker}>เพิ่มสมาชิก</p>
            <h2 className={styles.modalTitle}>เพิ่มสมาชิกโครงงาน</h2>
            <form className={styles.form} onSubmit={handleMemberSubmit}>
              <label className={styles.label}>รหัสนักศึกษา
                <input
                  className={styles.input}
                  placeholder="เช่น 64070001"
                  value={memberModal.studentCode}
                  onChange={(e) =>
                    setMemberModal((prev) => prev.open ? { ...prev, studentCode: e.target.value } : prev)
                  }
                  required
                />
              </label>
              {formError && <p className={styles.error}>{formError}</p>}
              <div className={styles.modalActions}>
                <button type="button" className={styles.secondaryButton} onClick={() => setMemberModal({ open: false })}>
                  ยกเลิก
                </button>
                <button type="submit" className={styles.primaryButton} disabled={addMemberMutation.isPending}>
                  {addMemberMutation.isPending ? "กำลังเพิ่ม..." : "เพิ่มสมาชิก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
