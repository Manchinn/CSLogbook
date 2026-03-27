"use client";

import { useEffect, useRef } from "react";

interface RejectionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  rejectorName: string;
  rejectedAt: string | null;
  reason: string | null;
  guidance: string;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function RejectionDetailModal({
  isOpen,
  onClose,
  title = "รายละเอียดการปฏิเสธ",
  rejectorName,
  rejectedAt,
  reason,
  guidance,
}: RejectionDetailModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.45)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-bg, #fff)",
          borderRadius: 16,
          padding: "24px 28px",
          width: "min(480px, 92vw)",
          maxHeight: "85vh",
          overflow: "auto",
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        }}
      >
        <h3 style={{ margin: "0 0 16px", fontSize: "1.1rem", color: "var(--color-text)" }}>
          {title}
        </h3>

        <div style={{ display: "grid", gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
              ผู้พิจารณา
            </p>
            <p style={{ margin: "2px 0 0", fontWeight: 500 }}>{rejectorName || "-"}</p>
          </div>

          <div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
              วันที่
            </p>
            <p style={{ margin: "2px 0 0" }}>{formatDate(rejectedAt)}</p>
          </div>

          <div>
            <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
              เหตุผล
            </p>
            <p
              style={{
                margin: "4px 0 0",
                padding: "10px 14px",
                borderRadius: 10,
                background: "var(--tag-danger-bg, #fff1f0)",
                border: "1px solid #ffa39e",
                color: "var(--tag-danger-text, #cf1322)",
                lineHeight: 1.6,
              }}
            >
              {reason || "ไม่ระบุเหตุผล"}
            </p>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: 10,
              background: "var(--tag-info-bg, #e6f4ff)",
              border: "1px solid var(--tag-info-border, #91caff)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "var(--tag-info-text, #0958d9)",
              }}
            >
              ขั้นตอนถัดไป
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--tag-info-text, #0958d9)" }}>
              {guidance}
            </p>
          </div>
        </div>

        <div style={{ marginTop: 20, display: "flex", justifyContent: "flex-end" }}>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid var(--border-subtle, #d9d9d9)",
              background: "var(--color-bg, #fff)",
              color: "var(--color-text)",
              cursor: "pointer",
              fontSize: "0.9rem",
            }}
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
