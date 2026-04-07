"use client";

import type { SystemAction } from "@/lib/services/monitoringService";

const BADGE_STYLES: Record<string, { bg: string; color: string }> = {
  LOGIN: { bg: "#dbeafe", color: "#2563eb" },
  APPROVE: { bg: "#d1fae5", color: "#059669" },
  REJECT: { bg: "#fee2e2", color: "#dc2626" },
  UPDATE: { bg: "#fef3c7", color: "#d97706" },
  CREATE: { bg: "#e0e7ff", color: "#4338ca" },
  DELETE: { bg: "#fce7f3", color: "#be185d" },
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

type Props = { actions: SystemAction[] | undefined; isLoading: boolean };

export function SystemActionsTable({ actions, isLoading }: Props) {
  if (isLoading || !actions) {
    return (
      <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
        <h2 style={{ fontSize: 15, color: "#666", textTransform: "uppercase", fontWeight: 600 }}>Recent System Actions</h2>
        <p style={{ color: "#888" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <h2 style={{ fontSize: 15, color: "#666", marginBottom: 14, textTransform: "uppercase", fontWeight: 600 }}>Recent System Actions</h2>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["\u0E40\u0E27\u0E25\u0E32", "\u0E1C\u0E39\u0E49\u0E43\u0E0A\u0E49", "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17", "\u0E23\u0E32\u0E22\u0E25\u0E30\u0E40\u0E2D\u0E35\u0E22\u0E14", "IP"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", borderBottom: "2px solid #e5e7eb", color: "#666", fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {actions.map((action) => {
              const badge = BADGE_STYLES[action.actionType] || BADGE_STYLES.UPDATE;
              return (
                <tr key={action.logId} style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 12px" }}>{formatTime(action.created_at)}</td>
                  <td style={{ padding: "8px 12px" }}>{action.user ? `${action.user.firstName} ${action.user.lastName}` : "-"}</td>
                  <td style={{ padding: "8px 12px" }}>
                    <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, background: badge.bg, color: badge.color }}>{action.actionType}</span>
                  </td>
                  <td style={{ padding: "8px 12px" }}>{action.actionDescription}</td>
                  <td style={{ padding: "8px 12px", color: "#888" }}>{action.ipAddress || "-"}</td>
                </tr>
              );
            })}
            {actions.length === 0 && <tr><td colSpan={5} style={{ padding: 20, textAlign: "center", color: "#888" }}>{"\u0E44\u0E21\u0E48\u0E21\u0E35\u0E02\u0E49\u0E2D\u0E21\u0E39\u0E25"}</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
