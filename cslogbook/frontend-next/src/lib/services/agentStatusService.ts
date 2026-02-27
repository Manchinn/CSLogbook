import {
  getAgentEmailStatsCompatibility,
  restartAgentStatus,
  type AgentEmailStats,
  type AgentStatus,
} from "@/lib/services/compatibilityService";
import { apiFetchData } from "@/lib/api/client";

export async function getAgentSystemStatus() {
  return apiFetchData<AgentStatus>("/admin/agent-status");
}

export async function getAgentEmailStats() {
  return getAgentEmailStatsCompatibility();
}

export type { AgentEmailStats };

export async function restartAgent(agentId: string | number) {
  return restartAgentStatus(agentId);
}
