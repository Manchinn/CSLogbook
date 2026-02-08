## Plan: Project Phase1 Next.js Migration

Next phase focuses on migrating the old Project Phase 1 dashboard into frontend-next, using the existing Next.js shell and hooks while matching the old React data shape and behavior. The current Next.js Phase 1 page is already feature-flagged and wired to basic data sources, but it lacks the full step cards, eligibility gating, and action routes seen in the old Phase 1 dashboard. This plan catalogs old React requirements, maps them to existing Next.js services, and fills any backend data gaps needed to keep parity. It culminates in updating the plan prompt file with a concise proposal that reflects these findings and prerequisites.

**Steps**
1. Inventory old Phase 1 UI, steps, and gating logic in frontend/src/features/project/components/student-view/Phase1Dashboard/Phase1Dashboard.js and related exports in frontend/src/features/project/index.js.
2. Catalog old data sources and endpoints from project hooks/services and compare to Next.js equivalents in frontend-next/src/hooks/useStudentProjectStatus.ts, frontend-next/src/hooks/useWorkflowTimeline.ts, and frontend-next/src/hooks/useStudentDeadlines.ts.
3. Map required data fields to existing Next.js services in frontend-next/src/lib/services/studentService.ts and frontend-next/src/lib/services/workflowService.ts; identify backend gaps if old UI expects additional fields.
4. Expand the Next.js Phase 1 page to cover old dashboard parity, starting from frontend-next/src/app/(app)/project/phase1/page.tsx and frontend-next/src/app/(app)/project/phase1/view/ProjectPhase1Content.tsx.
5. Ensure menu and feature-flag rollout stays consistent via frontend-next/src/lib/navigation/menuConfig.ts and frontend-next/src/lib/config/featureFlags.ts.
6. Update the next-phase proposal content in .github/prompts/planNextPhase.prompt.md to reflect the agreed scope, prerequisites, risks, and verification.

**Verification**
- Run `npm run dev` in frontend-next and confirm Phase 1 renders with the flag on.
- Navigate to /project/phase1 and validate data loads, errors, and empty states.
- Spot-check key endpoints used by Phase 1 for auth, project status, workflow, and deadlines.
- Confirm menu visibility toggles with `NEXT_PUBLIC_ENABLE_PROJECT_PHASE1_PAGE`.

**Decisions**
- Use old React Phase 1 dashboard as the behavior baseline for parity.
- Reuse existing Next.js hooks/services where possible; only extend as needed.
- Keep rollout controlled by the Phase 1 feature flag.
