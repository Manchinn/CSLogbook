import { apiFetch, apiFetchData } from "@/lib/api/client";

export type NotificationSetting = {
  id: number;
  enabled: boolean;
  description?: string | null;
  lastUpdated?: string | null;
  createdAt?: string | null;
  updatedBy?: string | null;
  updatedByUsername?: string | null;
};

export type NotificationSettingsResponse = Record<string, NotificationSetting>;

export async function getNotificationSettings() {
  return apiFetchData<NotificationSettingsResponse>("/admin/notification-settings");
}

export async function toggleNotification(type: string, enabled: boolean) {
  return apiFetch("/admin/notification-settings/toggle", {
    method: "PUT",
    body: JSON.stringify({ type, enabled }),
    headers: { "Content-Type": "application/json" },
  });
}

export async function enableAllNotifications() {
  return apiFetch("/admin/notification-settings/enable-all", { method: "PUT" });
}

export async function disableAllNotifications() {
  return apiFetch("/admin/notification-settings/disable-all", { method: "PUT" });
}

export type AgentNotificationStats = {
  totalNotifications?: number;
  sentNotifications?: number;
  failedNotifications?: number;
  lastRunAt?: string | null;
  breakdown?: Record<string, number>;
};

export async function getAgentNotificationStats(days = 7) {
  return apiFetchData<AgentNotificationStats>(`/admin/agent-status/notifications?days=${days}`);
}
