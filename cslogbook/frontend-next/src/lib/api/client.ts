import { env } from "@/lib/config/env";
import { AUTH_TOKEN_KEY, LEGACY_TOKEN_KEY } from "@/lib/auth/storageKeys";

type RequestOptions = RequestInit & {
  token?: string;
};

export type ApiSuccessResponse<T> = {
  success: boolean;
  data?: T;
  message?: string;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const fallbackToken =
    typeof window !== "undefined"
      ? window.localStorage.getItem(AUTH_TOKEN_KEY) ?? window.localStorage.getItem(LEGACY_TOKEN_KEY)
      : null;
  const effectiveToken = token ?? fallbackToken;
  const hasBody = Object.prototype.hasOwnProperty.call(rest, "body");
  const isFormData = typeof FormData !== "undefined" && rest.body instanceof FormData;

  const response = await fetch(`${env.apiUrl}${path}`, {
    ...rest,
    headers: {
      ...(hasBody && !isFormData ? { "Content-Type": "application/json" } : {}),
      ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    let message = "API request failed";
    try {
      const parsed = JSON.parse(errorBody) as { message?: string };
      message = parsed.message ?? message;
    } catch {
      message = errorBody || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}

export async function apiFetchData<T>(path: string, options: RequestOptions = {}): Promise<T | null> {
  const response = await apiFetch<ApiSuccessResponse<T>>(path, options);
  return response.data ?? null;
}
