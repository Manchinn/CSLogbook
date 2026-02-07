import { redirect } from "next/navigation";
import { buildLegacyHref } from "./legacyNavigation";

export function guardFeatureRoute(enabled: boolean, legacyPath: string, fallback = "/app") {
  if (enabled) return;

  const legacyHref = buildLegacyHref(legacyPath);
  if (legacyHref) {
    redirect(legacyHref);
  }

  redirect(fallback);
}
