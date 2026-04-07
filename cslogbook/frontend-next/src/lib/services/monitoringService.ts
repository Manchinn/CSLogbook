import { apiFetch } from "@/lib/api/client";

export interface HealthStats {
  uptime: number;
  agentsRunning: number;
  agentsTotal: number;
  errors24h: number;
  memoryMB: number;
}

export interface LogLine {
  timestamp: string;
  level: string;
  message: string;
  raw: string;
}

export interface SystemAction {
  logId: number;
  actionType: string;
  actionDescription: string;
  ipAddress: string | null;
  userId: number | null;
  user: { userId: number; firstName: string; lastName: string; role: string } | null;
  created_at: string;
}

export async function getHealthStats(token: string): Promise<HealthStats> {
  const res = await apiFetch<{ success: boolean; data: HealthStats }>("/admin/monitoring/health", { token });
  return res.data;
}

export async function getRecentLogs(token: string, file = "app.log", lines = 100): Promise<LogLine[]> {
  const res = await apiFetch<{ success: boolean; data: LogLine[] }>(`/admin/monitoring/logs?file=${file}&lines=${lines}`, { token });
  return res.data;
}

export async function getSystemActions(token: string, limit = 20, offset = 0): Promise<{ data: SystemAction[]; total: number }> {
  const res = await apiFetch<{ success: boolean; data: SystemAction[]; total: number }>(`/admin/monitoring/system-logs?limit=${limit}&offset=${offset}`, { token });
  return { data: res.data, total: res.total };
}
