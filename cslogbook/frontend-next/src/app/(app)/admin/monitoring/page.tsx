"use client";

import { useQuery } from "@tanstack/react-query";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { useAuth } from "@/contexts/AuthContext";
import { getHealthStats, getRecentLogs, getSystemActions } from "@/lib/services/monitoringService";
import { SystemHealthCard } from "@/components/admin/monitoring/SystemHealthCard";
import { AgentStatusCard } from "@/components/admin/monitoring/AgentStatusCard";
import { LiveLogViewer } from "@/components/admin/monitoring/LiveLogViewer";
import { SystemActionsTable } from "@/components/admin/monitoring/SystemActionsTable";
import { apiFetch } from "@/lib/api/client";

export default function MonitoringPage() {
  const { token } = useAuth();

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: ["monitoring-health"],
    queryFn: () => getHealthStats(token!),
    enabled: Boolean(token),
    refetchInterval: 15_000,
  });

  const { data: agentData, isLoading: agentLoading, refetch: refetchAgents } = useQuery({
    queryKey: ["agent-status"],
    queryFn: async () => {
      const res = await apiFetch("/admin/agent-status", { token: token! }) as Record<string, unknown>;
      const data = (res.data ?? res) as Record<string, unknown>;
      return (data.agentDetails ?? {}) as Record<string, { name: string; description: string; isRunning: boolean; schedule: string }>;
    },
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });

  const { data: initialLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ["monitoring-logs-initial"],
    queryFn: () => getRecentLogs(token!, "app.log", 100),
    enabled: Boolean(token),
  });

  const { data: actionsData, isLoading: actionsLoading } = useQuery({
    queryKey: ["monitoring-system-actions"],
    queryFn: () => getSystemActions(token!, 20, 0),
    enabled: Boolean(token),
    refetchInterval: 30_000,
  });

  return (
    <RoleGuard roles={["admin", "teacher"]} teacherTypes={["support"]}>
      <div style={{ padding: 24, maxWidth: "100%", overflow: "hidden" }}>
        <h1 style={{ fontSize: 22, marginBottom: 20, color: "#1a1a2e" }}>
          System Monitoring
          <span style={{ background: "#1a1a2e", color: "#fff", fontSize: 11, padding: "3px 10px", borderRadius: 6, marginLeft: 8 }}>
            Admin Only
          </span>
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16, minWidth: 0 }}>
          <SystemHealthCard stats={healthData} isLoading={healthLoading} />
          <AgentStatusCard agents={agentData} token={token} isLoading={agentLoading} onRefresh={() => refetchAgents()} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <LiveLogViewer token={token} initialLines={initialLogs} />
        </div>

        <SystemActionsTable actions={actionsData?.data} isLoading={actionsLoading} />
      </div>
    </RoleGuard>
  );
}
