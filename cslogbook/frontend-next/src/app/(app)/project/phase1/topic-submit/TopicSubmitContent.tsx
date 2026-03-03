"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import { getProject } from "@/lib/services/projectService";
import { CreateWizard } from "./CreateWizard";
import { ProjectDraftProvider, useProjectDraft } from "./ProjectDraftContext";
import styles from "./topicSubmit.module.css";

function TopicSubmitInner() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const editPid = searchParams.get("pid");
  const { data: projectDetail } = useStudentProjectDetail(token, Boolean(token));
  const { hydrateFromProject, projectStatus, basic, projectId } = useProjectDraft();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        setLoading(true);
        if (editPid) {
          const response = await getProject(token, Number(editPid));
          const project = response.data ?? response.project;
          if (project) {
            hydrateFromProject(project);
          }
          return;
        }

        if (projectDetail) {
          hydrateFromProject(projectDetail);
        }
      } catch (err) {
        setError((err as Error).message || "โหลดข้อมูลไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [editPid, hydrateFromProject, projectDetail, token]);

  const readOnly = useMemo(() => ["completed", "archived"].includes(projectStatus), [projectStatus]);

  // label ปุ่มเปิด modal
  const openLabel = useMemo(() => {
    if (loading) return "กำลังโหลด...";
    if (projectId) return "แก้ไขข้อมูลโครงงาน";
    return "เริ่มเสนอหัวข้อ";
  }, [loading, projectId]);

  const closeModal = () => setModalOpen(false);

  return (
    <div className={styles.page}>
      {/* ─── ส่วนหัวหน้า ─────────────────────────────────────── */}
      <section className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>เสนอหัวข้อโครงงานพิเศษ</h1>
            <p className={styles.subtitle}>กรอกข้อมูลในฟอร์มเดียวได้เลย สามารถกลับมาแก้ไขได้ภายหลัง</p>
          </div>
          {!readOnly ? (
            <button
              type="button"
              className={styles.primaryButton}
              onClick={() => setModalOpen(true)}
              disabled={loading}
            >
              {openLabel}
            </button>
          ) : null}
        </div>
      </section>

      {/* ─── สรุปสถานะปัจจุบัน (เมื่อมีโครงงานอยู่แล้ว) ────── */}
      {error ? <div className={styles.notice}>{error}</div> : null}
      {readOnly ? (
        <div className={styles.notice}>โครงงานนี้ผ่านการสอบหัวข้อแล้ว ไม่สามารถแก้ไขได้</div>
      ) : null}
      {!loading && projectId ? (
        <div className={styles.panel}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>ชื่อโครงงานภาษาไทย</label>
              <div>{basic.projectNameTh || "-"}</div>
            </div>
            <div className={styles.field}>
              <label>ชื่อโครงงานภาษาอังกฤษ</label>
              <div>{basic.projectNameEn || "-"}</div>
            </div>
            <div className={styles.field}>
              <label>สถานะ</label>
              <div>{projectStatus}</div>
            </div>
          </div>
        </div>
      ) : null}
      {!loading && !projectId && !readOnly ? (
        <div className={styles.notice}>ยังไม่มีโครงงาน กดปุ่ม "เริ่มเสนอหัวข้อ" เพื่อเปิดฟอร์ม</div>
      ) : null}
      {loading ? <div className={styles.notice}>กำลังโหลดข้อมูล...</div> : null}

      {/* ─── Modal ───────────────────────────────────────────── */}
      {modalOpen ? (
        <>
          {/* backdrop */}
          <div
            className={styles.modalOverlay}
            role="presentation"
            onClick={closeModal}
          />
          {/* dialog */}
          <div className={styles.modal} role="dialog" aria-modal="true" aria-label="ฟอร์มเสนอหัวข้อโครงงาน">
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>เสนอหัวข้อโครงงานพิเศษ</h2>
              <button type="button" className={styles.modalClose} onClick={closeModal} aria-label="ปิด">
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <CreateWizard />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export function TopicSubmitContent() {
  return (
    <ProjectDraftProvider>
      <TopicSubmitInner />
    </ProjectDraftProvider>
  );
}
