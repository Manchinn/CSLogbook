import { featureFlags } from "@/lib/config/featureFlags";

const legacyBase = process.env.NEXT_PUBLIC_LEGACY_FRONTEND_URL;

export function buildLegacyHref(path: string): string | null {
  if (!legacyBase) return null;

  try {
    return new URL(path, legacyBase).toString();
  } catch (error) {
    console.warn("Failed to build legacy href", error);
    return null;
  }
}

export function resolveAppLink(path: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const legacyHref = buildLegacyHref(path);

  if (!enabled || featureFlags.useLegacyFrontend) {
    if (legacyHref) {
      return { href: legacyHref, external: true } as const;
    }
  }

  return { href: path, external: false } as const;
}
