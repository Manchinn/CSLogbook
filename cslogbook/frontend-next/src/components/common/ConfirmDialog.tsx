"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "ยืนยัน",
  cancelText = "ยกเลิก",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) {
      // Focus cancel button by default for safety
      cancelRef.current?.focus();

      // Handle escape key
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          onCancel();
        }
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, onCancel]);

  if (!open) return null;

  const variantStyles = {
    danger: {
      confirmBg: "#dc2626",
      confirmHover: "#b91c1c",
      iconBg: "#fef2f2",
      iconColor: "#dc2626",
    },
    warning: {
      confirmBg: "#f59e0b",
      confirmHover: "#d97706",
      iconBg: "#fffbeb",
      iconColor: "#f59e0b",
    },
    info: {
      confirmBg: "#2563eb",
      confirmHover: "#1d4ed8",
      iconBg: "#eff6ff",
      iconColor: "#2563eb",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "400px",
          width: "90%",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: styles.iconBg,
              color: styles.iconColor,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              fontSize: "20px",
            }}
          >
            {variant === "danger" ? "✕" : variant === "warning" ? "!" : "i"}
          </div>
          <div style={{ flex: 1 }}>
            <h2
              id="confirm-title"
              style={{
                margin: "0 0 8px",
                fontSize: "1.1rem",
                fontWeight: 600,
                color: "#1f2937",
              }}
            >
              {title}
            </h2>
            <p
              id="confirm-message"
              style={{
                margin: 0,
                color: "#6b7280",
                fontSize: "0.95rem",
                lineHeight: 1.5,
              }}
            >
              {message}
            </p>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "flex-end",
            marginTop: "24px",
          }}
        >
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            style={{
              padding: "10px 16px",
              borderRadius: "6px",
              border: "1px solid #d1d5db",
              background: "#fff",
              color: "#374151",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "0.95rem",
            }}
          >
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            style={{
              padding: "10px 16px",
              borderRadius: "6px",
              border: "none",
              background: styles.confirmBg,
              color: "#fff",
              fontWeight: 500,
              cursor: "pointer",
              fontSize: "0.95rem",
              transition: "background 0.15s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = styles.confirmHover)}
            onMouseOut={(e) => (e.currentTarget.style.background = styles.confirmBg)}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook for easy usage with confirmation state
export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  variant?: "danger" | "warning" | "info";
  onConfirm: (() => void) | null;
}

export function useConfirmDialog() {
  const [dialogState, setDialogState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: "",
    message: "",
    variant: "danger",
    onConfirm: null,
  });

  const confirm = useCallback(
    (
      options: {
        title: string;
        message: string;
        variant?: "danger" | "warning" | "info";
      },
      onConfirm: () => void,
    ) => {
      setDialogState({
        isOpen: true,
        title: options.title,
        message: options.message,
        variant: options.variant || "danger",
        onConfirm,
      });
    },
    [],
  );

  const close = useCallback(() => {
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const Dialog = useCallback(
    () => (
      <ConfirmDialog
        open={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        variant={dialogState.variant}
        onConfirm={() => {
          dialogState.onConfirm?.();
          close();
        }}
        onCancel={close}
      />
    ),
    [dialogState, close],
  );

  return { confirm, close, Dialog };
}
