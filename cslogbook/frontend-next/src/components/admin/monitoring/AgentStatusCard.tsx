"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";

type AgentDetail = { name: string; description: string; isRunning: boolean; schedule: string };
type Props = { agents: Record<string, AgentDetail> | undefined; token: string | null; isLoading: boolean; onRefresh: () => void };

export function AgentStatusCard({ agents, token, isLoading, onRefresh }: Props) {
  const [restarting, setRestarting] = useState<string | null>(null);

  const handleRestart = async (agentName: string) => {
    if (!token) return;
    setRestarting(agentName);
    try {
      await apiFetch(`/admin/agent-status/${agentName}/restart`, { token, method: "POST" });
      setTimeout(onRefresh, 2500);
    } catch (err) {
      console.error("Restart failed:", err);
    } finally {
      setRestarting(null);
    }
  };

  if (isLoading || !agents) {
    return (
      <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
        <h2 style={{ fontSize: 15, color: "#666", textTransform: "uppercase", fontWeight: 600 }}>Agent Status</h2>
        <p style={{ color: "#888" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 1px 3px rgba(0,0,0,.08)" }}>
      <h2 style={{ fontSize: 15, color: "#666", marginBottom: 14, textTransform: "uppercase", fontWeight: 600 }}>Agent Status</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
        {Object.entries(agents).map(([key, agent]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: "#f8f9fa", borderRadius: 8, fontSize: 13 }}>
            <span style={{ fontWeight: 600, flex: 1 }}>{agent.name}</span>
            <span style={{ color: "#888", fontSize: 12, flex: 1, textAlign: "center" }}>{agent.schedule}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 80 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: agent.isRunning ? "#22c55e" : "#ccc", display: "inline-block" }} />
              {agent.isRunning ? "Running" : "Stopped"}
            </span>
            <button onClick={() => handleRestart(key)} disabled={restarting === key}
              style={{ background: "none", border: "1px solid #ddd", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer" }}>
              {restarting === key ? "..." : "\u21BB"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
