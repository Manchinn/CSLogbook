import { AUTH_TOKEN_KEY, LEGACY_TOKEN_KEY } from "@/lib/auth/storageKeys";
import { env } from "@/lib/config/env";

interface ExcelDownloadOptions {
  /** API endpoint path e.g. '/admin/documents/export' */
  endpoint: string;
  /** Query params — undefined/empty values are filtered out */
  params?: Record<string, string | number | undefined | null>;
  /** Fallback filename if server doesn't send Content-Disposition */
  fallbackFilename?: string;
  /** Override token (for SSR or testing) */
  token?: string;
}

export async function downloadExcelFile({
  endpoint,
  params,
  fallbackFilename = "export.xlsx",
  token,
}: ExcelDownloadOptions): Promise<void> {
  const authToken =
    token ??
    localStorage.getItem(AUTH_TOKEN_KEY) ??
    localStorage.getItem(LEGACY_TOKEN_KEY);

  const url = new URL(`${env.apiUrl}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "ไม่สามารถส่งออกข้อมูลได้");
  }

  const filename = extractFileName(
    response.headers.get("content-disposition"),
    fallbackFilename,
  );

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = blobUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}

function extractFileName(
  contentDisposition: string | null,
  fallback: string,
): string {
  if (!contentDisposition) return fallback;
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const plainMatch = /filename="?([^";\n]+)"?/i.exec(contentDisposition);
  if (plainMatch?.[1]) return plainMatch[1];
  return fallback;
}
