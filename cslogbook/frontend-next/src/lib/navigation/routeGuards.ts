import { redirect } from "next/navigation";

export function guardFeatureRoute(enabled: boolean, fallback = "/app") {
  if (!enabled) {
    redirect(fallback);
  }
}
