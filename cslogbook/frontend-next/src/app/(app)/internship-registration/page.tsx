import { redirect } from "next/navigation";
import { featureFlags } from "@/lib/config/featureFlags";
import LandingPageClient from "./LandingPageClient";

export default function InternshipRegistrationPage() {
  if (!featureFlags.enableInternshipFlowPage) {
    redirect("/app");
  }

  return <LandingPageClient />;
}
