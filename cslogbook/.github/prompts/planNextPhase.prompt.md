---
name: planNextPhase
description: Propose the next development phase based on current discussion and project docs
argument-hint: Optional: key files or notes to consider (e.g., README sections, roadmap files)
---
Current state recap:
- Next.js Phase 1 dashboard is migrated with eligibility gates, status tags, Phase 2 teaser, and upcoming deadlines list.
- Phase 1 step pages exist for topic submit, meeting logbook, and KP02 exam submit, but legacy parity gaps remain (deadline locks, topic exam flow, detailed draft view, and richer meeting/KP02 status).
- Phase 2 actions are still stubbed (OVR refactor, system test request, KP03 request).

Next steps (priority order):
- Add per-step deadline lock + late handling to Phase 1 cards (match legacy name/relatedTo matching and grace rules).
- Restore topic exam flow visibility (topic exam card + status + route) or confirm it is intentionally removed.
- Align Topic Submit draft with legacy fields and behaviors (additional detail fields, refresh, and draft detail view).
- Bring Meeting Logbook closer to legacy (phase filter, edit/delete, approvals, and stats parity).
- Expand KP02 submit to include timeline/status metadata and staff/advisor notes parity.
- Continue Phase 2 roadmap: OVR refactor, system test request, KP03 request, and deadline mapping for project2.

Prerequisites / flags:
- Enable `NEXT_PUBLIC_ENABLE_PROJECT_PHASE1_PAGE` for rollout and QA.
- Confirm backend payloads for project deadlines expose allowLate/lockAfterDeadline and matching names.
- Confirm endpoints for topic exam status, meeting approvals, and KP02 status/timeline fields.
- Confirm which Phase 1 fields are required for compliance (scope/expectedOutcome/tools/etc.).

Risks / unknowns and de-risking:
- Deadline naming mismatches -> add fallback keyword matching as in legacy.
- Missing meeting/KP02 fields -> verify API responses early and update service types.
- Behavior drift in Phase 1 gating -> validate with legacy dashboard screenshots and test data.

Verification checklist:
- Start Next.js dev server and open Phase 1 page with flag on.
- Navigate to Phase 1 cards and validate lock behavior (post-topic gate + deadline lock + late rules).
- Validate topic submit + meeting logbook + KP02 flows with draft/project states.
- Confirm request status updates and error/empty states align with legacy.
