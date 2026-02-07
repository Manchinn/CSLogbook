const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api";

type RequestOptions = RequestInit & {
  token?: string;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const fallbackToken = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
  const effectiveToken = token ?? fallbackToken;
  const hasBody = Boolean(rest.body);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...rest,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();

    try {
      const parsed = JSON.parse(errorBody) as { message?: string };
      throw new Error(parsed.message ?? "API request failed");
    } catch {
      throw new Error(errorBody || "API request failed");
    }
  }

  return (await response.json()) as T;
}
