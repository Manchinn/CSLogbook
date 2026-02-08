import { apiFetchData } from "@/lib/api/client";

export type AgentStatus = Record<string, unknown>;

export async function getAgentSystemStatus() {
  return apiFetchData<AgentStatus>("/admin/agent-status");
}

export async function getAgentEmailStats() {
  return apiFetchData<Record<string, unknown>>("/admin/agent-status/email-stats");
}
