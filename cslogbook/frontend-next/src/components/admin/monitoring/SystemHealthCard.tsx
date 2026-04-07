"use client";

import type { HealthStats } from "@/lib/services/monitoringService";

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return days > 0 ? `${days}d ${hours}h` : `${hours}h`;
}

type Props = { stats: HealthStats | undefined; isLoading: boolean };

export function SystemHealthCard({ stats, isLoading }: Props) {
  if (isLoading || !stats) {
    return (
      <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
        <h2 style={{ fontSize: 15, color: "#666", textTransform: "uppercase", fontWeight: 600 }}>System Health</h2>
        <p style={{ color: "#888" }}>Loading...</p>
      </div>
    );
  }

  const items = [
    { label: "Uptime", value: formatUptime(stats.uptime), color: "#22c55e" },
    { label: "Agents Running", value: `${stats.agentsRunning}/${stats.agentsTotal}`, color: "#3b82f6" },
    { label: "Errors (24h)", value: String(stats.errors24h), color: stats.errors24h > 0 ? "#ef4444" : "#22c55e" },
    { label: "Memory", value: `${stats.memoryMB} MB`, color: stats.memoryMB > 512 ? "#f59e0b" : "#3b82f6" },
  ];

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <h2 style={{ fontSize: 15, color: "#666", marginBottom: 14, textTransform: "uppercase", fontWeight: 600 }}>System Health</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {items.map((item) => (
          <div key={item.label} style={{ textAlign: "center", padding: 12, background: "#f8f9fa", borderRadius: 8 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: item.color }}>{item.value}</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
