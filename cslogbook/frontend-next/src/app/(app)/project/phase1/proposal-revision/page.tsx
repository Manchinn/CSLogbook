"use client";

import { useState, useRef } from "react";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { useHydrated } from "@/hooks/useHydrated";
import { useStudentProjectDetail } from "@/hooks/useStudentProjectDetail";
import { featureFlags } from "@/lib/config/featureFlags";
import { guardFeatureRoute } from "@/lib/navigation/routeGuards";
import { apiFetch } from "@/lib/api/client";
import styles from "./proposalRevision.module.css";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const dateFormatter = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return dateFormatter.format(d);
}

type FeedbackMessage = {
  tone: "success" | "warning" | "danger";
  text: string;
};

export default function ProposalRevisionPage() {
  guardFeatureRoute(featureFlags.enableProjectPhase1Page, "/app");

  const { token } = useAuth();
  const hydrated = useHydrated();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);

  const projectQuery = useStudentProjectDetail(token, hydrated && Boolean(token));

  const project = projectQuery.data;
  const projectId = project?.projectId ?? null;
  const latestProposal = project?.latestProposal ?? null;

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFeedback({
        tone: "danger",
        text: "รองรับเฉพาะไฟล์ PDF และ Word (.doc, .docx) เท่านั้น",
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setFeedback({
        tone: "danger",
        text: `ไฟล์ขนาดใหญ่เกินไป (สูงสุด ${MAX_FILE_SIZE / 1024 / 1024}MB)`,
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSelectedFile(file);
    setFeedback(null);
  };

  const handleUpload = async () => {
    if (!selectedFile || !projectId || !token) return;

    try {
      setUploading(true);
      setUploadProgress(0);
      setFeedback(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      // Simulate progress (since fetch doesn't support onProgress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await apiFetch(`/projects/${projectId}/proposal`, {
        method: "POST",
        token,
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      setFeedback({
        tone: "success",
        text: "อัปโหลด Proposal ฉบับแก้ไขเรียบร้อยแล้ว",
      });

      // Reset form
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadProgress(0);

      // Refetch project data to get latest proposal
      void projectQuery.refetch();
    } catch (error) {
      setFeedback({
        tone: "danger",
        text: error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการอัปโหลด",
      });
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setFeedback(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownload = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!hydrated) {
    return (
      <RoleGuard roles={["student"]}>
        <div className={styles.page}>
          <p className={styles.loading}>กำลังโหลด...</p>
        </div>
      </RoleGuard>
    );
  }

  if (projectQuery.isLoading) {
    return (
      <RoleGuard roles={["student"]}>
        <div className={styles.page}>
          <p className={styles.loading}>กำลังโหลดข้อมูลโครงงาน...</p>
        </div>
      </RoleGuard>
    );
  }

  if (projectQuery.isError || !project) {
    return (
      <RoleGuard roles={["student"]}>
        <div className={styles.page}>
          <section className={styles.card}>
            <p className={styles.error}>ไม่พบข้อมูลโครงงาน กรุณาลงทะเบียนโครงงานก่อน</p>
          </section>
        </div>
      </RoleGuard>
    );
  }

  return (
    <RoleGuard roles={["student"]}>
      <div className={styles.page}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>อัปโหลด Proposal ฉบับแก้ไข</h1>
            <p className={styles.subtitle}>
              อัปโหลด Proposal ฉบับแก้ไขตามข้อเสนอแนะจากการสอบหัวข้อโครงงาน
            </p>
            {project.titleTh || project.titleEn ? (
              <p className={styles.projectName}>
                โครงงาน: {project.titleTh || project.titleEn}
              </p>
            ) : null}
          </div>
        </header>

        {feedback ? (
          <div
            className={`${styles.alert} ${
              feedback.tone === "success"
                ? styles.alertSuccess
                : feedback.tone === "warning"
                  ? styles.alertWarning
                  : styles.alertDanger
            }`}
          >
            {feedback.text}
          </div>
        ) : null}

        {/* Latest Proposal Section */}
        {latestProposal ? (
          <section className={styles.card}>
            <h2 className={styles.sectionTitle}>Proposal ฉบับล่าสุด</h2>
            <div className={styles.proposalInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>ชื่อไฟล์:</span>
                <span className={styles.value}>{latestProposal.fileName || "Proposal.pdf"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>เวอร์ชัน:</span>
                <span className={styles.value}>{latestProposal.version || "1"}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>อัปโหลดเมื่อ:</span>
                <span className={styles.value}>{formatDate(latestProposal.uploadedAt)}</span>
              </div>
              {latestProposal.uploadedBy ? (
                <div className={styles.infoRow}>
                  <span className={styles.label}>อัปโหลดโดย:</span>
                  <span className={styles.value}>{latestProposal.uploadedBy.name}</span>
                </div>
              ) : null}
            </div>
            {latestProposal.fileUrl ? (
              <button
                type="button"
                className={styles.button}
                onClick={() => handleDownload(latestProposal.fileUrl!)}
              >
                📄 ดาวน์โหลด Proposal ฉบับปัจจุบัน
              </button>
            ) : null}
          </section>
        ) : (
          <section className={styles.card}>
            <div className={styles.notice}>
              <p>ยังไม่มี Proposal ในระบบ</p>
              <p className={styles.subText}>กรุณาอัปโหลด Proposal ฉบับแรก</p>
            </div>
          </section>
        )}

        {/* Upload Section */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>
            {latestProposal ? "อัปโหลด Proposal ฉบับแก้ไข" : "อัปโหลด Proposal"}
          </h2>

          <div className={styles.uploadInfo}>
            <p className={styles.infoItem}>📌 รองรับไฟล์: PDF, Word (.doc, .docx)</p>
            <p className={styles.infoItem}>📌 ขนาดไฟล์สูงสุด: 10MB</p>
            <p className={styles.infoItem}>
              📌 Proposal ควรเป็นฉบับสมบูรณ์ตามแบบฟอร์มของสาขา
            </p>
          </div>

          <div className={styles.uploadForm}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleFileSelect}
              disabled={uploading}
              className={styles.fileInput}
            />

            {selectedFile ? (
              <div className={styles.selectedFile}>
                <p className={styles.fileName}>📎 {selectedFile.name}</p>
                <p className={styles.fileSize}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : null}

            {uploading ? (
              <div className={styles.progressSection}>
                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className={styles.progressText}>กำลังอัปโหลด... {uploadProgress}%</p>
              </div>
            ) : null}

            <div className={styles.buttonRow}>
              <button
                type="button"
                className={styles.button}
                onClick={handleClear}
                disabled={uploading || !selectedFile}
              >
                ล้าง
              </button>
              <button
                type="button"
                className={`${styles.button} ${styles.buttonPrimary}`}
                onClick={() => void handleUpload()}
                disabled={uploading || !selectedFile || !projectId}
              >
                {uploading ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์"}
              </button>
            </div>
          </div>
        </section>

        {/* Guidelines Section */}
        <section className={styles.card}>
          <h2 className={styles.sectionTitle}>แนวทางการแก้ไข Proposal</h2>
          <div className={styles.guidelines}>
            <ol className={styles.guidelineList}>
              <li>ตรวจสอบข้อเสนอแนะจากกรรมการสอบหัวข้อให้ครบถ้วน</li>
              <li>แก้ไขเนื้อหาตามข้อเสนอแนะที่ได้รับ</li>
              <li>ตรวจสอบรูปแบบและการจัดหน้าให้ถูกต้องตามแบบฟอร์ม</li>
              <li>ปรึกษาอาจารย์ที่ปรึกษาก่อนส่ง Proposal ฉบับแก้ไข</li>
              <li>อัปโหลดไฟล์ในรูปแบบ PDF เพื่อความเรียบร้อย</li>
            </ol>
          </div>
        </section>
      </div>
    </RoleGuard>
  );
}
