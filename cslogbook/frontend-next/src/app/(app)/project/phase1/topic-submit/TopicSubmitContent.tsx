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
  const { hydrateFromProject, projectStatus } = useProjectDraft();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className={styles.page}>
      <section className={styles.header}>
        <h1 className={styles.title}>เสนอหัวข้อโครงงานพิเศษ</h1>
        <p className={styles.subtitle}>กรอกข้อมูลทีละขั้น สามารถกลับมาแก้ไขได้ภายหลัง</p>
      </section>
      {loading ? <div className={styles.notice}>กำลังโหลดข้อมูล...</div> : null}
      {error ? <div className={styles.notice}>{error}</div> : null}
      {readOnly ? (
        <div className={styles.notice}>โครงงานนี้ผ่านการสอบหัวข้อแล้ว ไม่สามารถแก้ไขได้</div>
      ) : null}
      <CreateWizard />
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
