"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listDeadlineOverrides,
  grantDeadlineOverride,
  revokeDeadlineOverride,
  type DeadlineOverride,
} from "@/lib/services/deadlineOverrideService";
import btn from "@/styles/shared/buttons.module.css";

interface DeadlineOverridePanelProps {
  deadlineId: number;
  deadlineName: string;
  onClose: () => void;
}

type GrantForm = {
  studentId: string;
  reason: string;
};

const emptyForm: GrantForm = {
  studentId: "",
  reason: "",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.45)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "1rem",
  zIndex: 1000,
};

const dialogStyle: React.CSSProperties = {
  background: "white",
  borderRadius: 12,
  padding: "1.5rem",
  maxWidth: 760,
  width: "100%",
  maxHeight: "85vh",
  overflow: "auto",
  boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
};

const sectionStyle: React.CSSProperties = {
  marginTop: "1rem",
  padding: "1rem",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  background: "#fafafa",
};

const inputStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  border: "1px solid #d1d5db",
  borderRadius: 6,
  fontSize: "0.95rem",
  fontFamily: "inherit",
  width: "100%",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginTop: "0.5rem",
  fontSize: "0.9rem",
};

const thStyle: React.CSSProperties = {
  background: "#f3f4f6",
  textAlign: "left",
  padding: "0.5rem 0.75rem",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
};

const tdStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  borderBottom: "1px solid #f3f4f6",
};

function formatStudent(o: DeadlineOverride): string {
  if (o.student) {
    const name = [o.student.firstName, o.student.lastName].filter(Boolean).join(" ").trim();
    const code = o.student.studentCode || "";
    return [code, name].filter(Boolean).join(" — ") || `#${o.studentId}`;
  }
  return `#${o.studentId}`;
}

function formatGranter(o: DeadlineOverride): string {
  if (!o.grantedByUser) return o.grantedBy ? `#${o.grantedBy}` : "-";
  const name = [o.grantedByUser.firstName, o.grantedByUser.lastName].filter(Boolean).join(" ");
  return name.trim() || `#${o.grantedByUser.userId}`;
}

export function DeadlineOverridePanel({
  deadlineId,
  deadlineName,
  onClose,
}: DeadlineOverridePanelProps) {
  const [overrides, setOverrides] = useState<DeadlineOverride[]>([]);
  const [form, setForm] = useState<GrantForm>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ tone: "info" | "success" | "warning"; text: string } | null>(
    null,
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listDeadlineOverrides(deadlineId);
      setOverrides(data ?? []);
    } catch (err) {
      setMessage({
        tone: "warning",
        text: err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ",
      });
    } finally {
      setLoading(false);
    }
  }, [deadlineId]);

  useEffect(() => {
    void load();
  }, [load]);

  // ESC to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleField = <K extends keyof GrantForm>(key: K, value: GrantForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleGrant = async () => {
    setMessage(null);
    const sid = Number(form.studentId);
    if (!Number.isFinite(sid) || sid <= 0) {
      setMessage({ tone: "warning", text: "กรุณาระบุ Student ID เป็นตัวเลข" });
      return;
    }
    setLoading(true);
    try {
      await grantDeadlineOverride(deadlineId, {
        studentId: sid,
        bypassLock: true,
        reason: form.reason || null,
      });
      setMessage({ tone: "success", text: "เปิด bypass สำเร็จ" });
      setForm(emptyForm);
      await load();
    } catch (err) {
      setMessage({
        tone: "warning",
        text: err instanceof Error ? err.message : "ไม่สามารถเปิด bypass ได้",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (studentId: number) => {
    if (!window.confirm("ยืนยันการปิด bypass นี้?")) return;
    setLoading(true);
    setMessage(null);
    try {
      await revokeDeadlineOverride(deadlineId, studentId);
      setMessage({ tone: "success", text: "ปิด bypass สำเร็จ" });
      await load();
    } catch (err) {
      setMessage({
        tone: "warning",
        text: err instanceof Error ? err.message : "ไม่สามารถปิด bypass ได้",
      });
    } finally {
      setLoading(false);
    }
  };

  const activeOverrides = overrides.filter((o) => o.isActive);

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="จัดการ bypass deadline รายบุคคล"
    >
      <div style={dialogStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.2rem" }}>Bypass Deadline รายบุคคล</h2>
            <div style={{ color: "#6b7280", fontSize: "0.9rem", marginTop: 4 }}>
              {deadlineName}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={btn.button}
            aria-label="ปิด"
          >
            ปิด
          </button>
        </div>

        {message && (
          <div
            style={{
              marginTop: "1rem",
              padding: "0.6rem 0.9rem",
              borderRadius: 6,
              background:
                message.tone === "success"
                  ? "#dcfce7"
                  : message.tone === "warning"
                    ? "#fef3c7"
                    : "#dbeafe",
              color: "#111827",
            }}
          >
            {message.text}
          </div>
        )}

        {/* Grant form */}
        <div style={sectionStyle}>
          <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>เปิด bypass ให้นักศึกษา</div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "0.75rem",
            }}
          >
            <label>
              <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>Student ID *</div>
              <input
                style={inputStyle}
                type="number"
                placeholder="เช่น 123"
                value={form.studentId}
                onChange={(e) => handleField("studentId", e.target.value)}
              />
            </label>
            <label>
              <div style={{ fontSize: "0.85rem", marginBottom: 4 }}>เหตุผล (ไม่บังคับ)</div>
              <input
                style={inputStyle}
                type="text"
                value={form.reason}
                onChange={(e) => handleField("reason", e.target.value)}
                placeholder="เช่น นักศึกษาป่วย / ขออนุญาตเป็นกรณีพิเศษ"
              />
            </label>
          </div>
          <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
            <button type="button" className={btn.button} onClick={() => setForm(emptyForm)}>
              ล้าง
            </button>
            <button
              type="button"
              className={`${btn.button} ${btn.buttonPrimary}`}
              onClick={handleGrant}
              disabled={loading}
            >
              เปิด bypass
            </button>
          </div>
        </div>

        {/* Active overrides table */}
        <div style={sectionStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <div style={{ fontWeight: 600 }}>
              นักศึกษาที่มี bypass เปิดอยู่ ({activeOverrides.length})
            </div>
            <button type="button" className={btn.button} onClick={load} disabled={loading}>
              รีเฟรช
            </button>
          </div>
          {activeOverrides.length === 0 ? (
            <div style={{ color: "#6b7280", fontSize: "0.9rem", padding: "0.5rem 0" }}>
              ยังไม่มีนักศึกษาที่ได้รับ bypass
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>นักศึกษา</th>
                    <th style={thStyle}>สถานะ</th>
                    <th style={thStyle}>เหตุผล</th>
                    <th style={thStyle}>อนุมัติโดย</th>
                    <th style={thStyle}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {activeOverrides.map((o) => (
                    <tr key={o.studentDeadlineStatusId}>
                      <td style={tdStyle}>{formatStudent(o)}</td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            padding: "0.15rem 0.5rem",
                            borderRadius: 999,
                            fontSize: "0.8rem",
                            background: "#dcfce7",
                            color: "#166534",
                          }}
                        >
                          เปิด
                        </span>
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          maxWidth: 220,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                        title={o.reason ?? ""}
                      >
                        {o.reason ?? "-"}
                      </td>
                      <td style={tdStyle}>{formatGranter(o)}</td>
                      <td style={tdStyle}>
                        <button
                          type="button"
                          className={`${btn.button} ${btn.buttonDanger}`}
                          onClick={() => handleRevoke(o.studentId)}
                          disabled={loading}
                        >
                          ปิด
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
