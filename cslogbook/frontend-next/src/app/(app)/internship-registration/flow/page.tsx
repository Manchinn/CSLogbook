import { redirect } from "next/navigation";
import { featureFlags } from "@/lib/config/featureFlags";
import FlowPageClient from "./FlowPageClient";

export default function InternshipRegistrationFlowPage() {
  if (!featureFlags.enableInternshipFlowPage) {
    redirect("/app");
  }

  return <FlowPageClient />;
}
