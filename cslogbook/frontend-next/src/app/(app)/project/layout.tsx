import { EligibilityGuard } from "@/components/auth/EligibilityGuard";

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return <EligibilityGuard require="project">{children}</EligibilityGuard>;
}
