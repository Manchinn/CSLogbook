"use client";

import { useState } from "react";
import styles from "./PDFPreviewModal.module.css";

type PDFPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  title?: string;
  fileName?: string;
};

export function PDFPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  title = "ดูเอกสาร PDF",
  fileName,
}: PDFPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!isOpen) return null;

  const handleIframeLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleIframeError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = fileName || "document.pdf";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalBackdrop} onClick={onClose} />
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerContent}>
            <h2 className={styles.modalTitle}>{title}</h2>
            {fileName && <span className={styles.fileName}>{fileName}</span>}
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.btnDownload}
              onClick={handleDownload}
              title="ดาวน์โหลด PDF"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              ดาวน์โหลด
            </button>
            <button
              type="button"
              className={styles.btnClose}
              onClick={onClose}
              title="ปิด"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {isLoading && (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
              <p>กำลังโหลดเอกสาร...</p>
            </div>
          )}

          {hasError && (
            <div className={styles.errorState}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p>ไม่สามารถโหลดเอกสารได้</p>
              <button type="button" className={styles.btnRetry} onClick={handleDownload}>
                ดาวน์โหลดแทน
              </button>
            </div>
          )}

          <iframe
            src={`${pdfUrl}#view=FitH`}
            className={styles.pdfFrame}
            title="PDF Preview"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            style={{ display: isLoading || hasError ? "none" : "block" }}
          />
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <p className={styles.footerNote}>
            💡 หากเอกสารไม่แสดง กรุณาคลิก &quot;ดาวน์โหลด&quot; เพื่อดูในโปรแกรมอื่น
          </p>
        </div>
      </div>
    </div>
  );
}
