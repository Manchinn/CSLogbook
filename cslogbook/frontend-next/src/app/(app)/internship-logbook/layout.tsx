import { EligibilityGuard } from "@/components/auth/EligibilityGuard";

export default function InternshipLogbookLayout({ children }: { children: React.ReactNode }) {
  return <EligibilityGuard require="internship">{children}</EligibilityGuard>;
}
