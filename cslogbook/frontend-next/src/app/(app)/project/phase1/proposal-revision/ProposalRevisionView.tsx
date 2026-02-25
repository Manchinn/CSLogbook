"use client";

import { useCallback, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import {
  getProjectArtifacts,
  uploadProposalFile,
  type ProjectArtifact,
} from "@/lib/services/projectService";
import styles from "./proposalRevision.module.css";

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function formatSize(bytes?: number) {
  if (!bytes) return "-";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProposalRevisionView() {
  const { token } = useAuth();
  const hydrated = useHydrated();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const enabled = hydrated && Boolean(token);
  const { data: project, isLoading: projectLoading } = useStudentProjectDetail(token, enabled);
  const projectId = project?.projectId;

  const {
    data: artifacts,
    isLoading: artifactsLoading,
    error: artifactsError,
  } = useQuery({
    queryKey: ["project-artifacts", token, projectId, "proposal"],
    queryFn: () => getProjectArtifacts(token ?? "", projectId!, "proposal"),
    enabled: Boolean(token) && Boolean(projectId),
    staleTime: 1000 * 60 * 2,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const handleUpload = useCallback(async () => {
    if (!token || !projectId || !selectedFile) return;
    if (selectedFile.type !== "application/pdf") {
      setUploadError("กรุณาเลือกไฟล์ PDF เท่านั้น");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadError("ไฟล์มีขนาดเกิน 10 MB");
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    try {
      const res = await uploadProposalFile(token, projectId, selectedFile);
      if (res.success) {
        setUploadSuccess(true);
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        void queryClient.invalidateQueries({
          queryKey: ["project-artifacts", token, projectId, "proposal"],
        });
      } else {
        setUploadError(res.message ?? "อัปโหลดไม่สำเร็จ");
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "อัปโหลดไม่สำเร็จ");
    } finally {
      setUploading(false);
    }
  }, [token, projectId, selectedFile, queryClient]);

  if (!hydrated || projectLoading) {
    return (
      <div className={styles.page}>
        <p className={styles.lead}>กำลังโหลดข้อมูล...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className={styles.page}>
        <div className={styles.callout}>
          <p className={styles.calloutTitle}>ไม่พบข้อมูลโครงงาน</p>
          <p className={styles.formHint}>กรุณาลงทะเบียนโครงงานก่อนอัปโหลด Proposal</p>
          <Link href="/student/projects" className={styles.primaryButton}>
            ไปหน้าโครงงาน
          </Link>
        </div>
      </div>
    );
  }

  const proposalList: ProjectArtifact[] = artifacts ?? [];

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.hero}>
        <div>
          <p className={styles.kicker}>Phase 1 · Proposal</p>
          <h1 className={styles.title}>อัปโหลด Proposal</h1>
          <p className={styles.lead}>
            อัปโหลดเอกสาร Proposal ในรูปแบบ PDF (ไม่เกิน 10 MB)
          </p>
        </div>
        <Link href="/project/phase1" className={styles.secondaryButton}>
          ย้อนกลับ
        </Link>
      </header>

      {/* Project info */}
      <div className={styles.infoBar}>
        <span className={styles.infoLabel}>โครงงาน:</span>
        <span className={styles.infoValue}>
          {project.projectNameTh ?? project.projectNameEn ?? `#${project.projectId}`}
        </span>
        <span className={styles.badge}>{project.projectCode ?? "-"}</span>
      </div>

      {/* Upload section */}
      <section className={styles.sectionCard}>
        <p className={styles.panelKicker}>อัปโหลดเอกสาร</p>
        <h2 className={styles.sectionTitle}>เลือกไฟล์ PDF</h2>

        <div className={styles.uploadArea}>
          <input
            ref={fileInputRef}
            id="proposal-file"
            type="file"
            accept="application/pdf"
            className={styles.fileInput}
            onChange={handleFileChange}
            disabled={uploading}
          />
          <label htmlFor="proposal-file" className={styles.uploadLabel}>
            {selectedFile
              ? `${selectedFile.name} (${formatSize(selectedFile.size)})`
              : "คลิกเพื่อเลือกไฟล์ PDF"}
          </label>
        </div>

        {uploadError && <p className={styles.error}>{uploadError}</p>}
        {uploadSuccess && (
          <p className={styles.success}>อัปโหลด Proposal สำเร็จแล้ว</p>
        )}

        <div className={styles.btnRow} style={{ marginTop: 16 }}>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!selectedFile || uploading}
            onClick={() => void handleUpload()}
          >
            {uploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
          </button>
        </div>

        <p className={styles.formHint} style={{ marginTop: 12 }}>
          รองรับเฉพาะไฟล์ PDF ขนาดไม่เกิน 10 MB · การอัปโหลดใหม่จะสร้าง version ใหม่โดยอัตโนมัติ
        </p>
      </section>

      {/* Version history */}
      <section className={styles.sectionCard}>
        <p className={styles.panelKicker}>ประวัติการอัปโหลด</p>
        <h2 className={styles.sectionTitle}>เวอร์ชันที่อัปโหลดแล้ว</h2>

        {artifactsLoading ? (
          <p className={styles.formHint}>กำลังโหลด...</p>
        ) : artifactsError ? (
          <p className={styles.error}>โหลดข้อมูลไม่สำเร็จ</p>
        ) : proposalList.length === 0 ? (
          <p className={styles.formHint}>ยังไม่เคยอัปโหลด Proposal</p>
        ) : (
          <div className={styles.versionList}>
            {proposalList.map((a) => (
              <div key={a.artifactId} className={styles.versionItem}>
                <div className={styles.versionHeader}>
                  <span className={styles.badge}>v{a.version ?? 1}</span>
                  <span className={styles.versionName}>{a.originalName}</span>
                </div>
                <div className={styles.versionMeta}>
                  <span>ขนาด: {formatSize(a.size)}</span>
                  <span>อัปโหลดเมื่อ: {formatDate(a.uploadedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
