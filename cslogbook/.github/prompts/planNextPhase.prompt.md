---
name: planNextPhase
description: Propose the next development phase based on current discussion and project docs
argument-hint: Optional: key files or notes to consider (e.g., README sections, roadmap files)
---
Current state recap:
- Project Phase 1 dashboard is migrated with gating, deadline locks, and Phase 2 teaser.
- Phase 2 actions still stubbed: OVR refactor, system test request, KP03 request.

Next steps (priority order):
- Refactor Phase 2 overview (OVR) to mirror legacy behavior and labels.
- Implement system test request flow (form, submit, status, attachments).
- Implement KP03 request flow (form, submit, advisor/status tracking).
- Wire step cards to the new Phase 2 routes and actions.
- Align deadline mapping for system test and KP03 with project2 deadlines.
- Ensure eligibility gates reuse Phase 1 logic for Phase 2 unlock.

Prerequisites / flags:
- Enable `NEXT_PUBLIC_ENABLE_PROJECT_PHASE1_PAGE` for rollout and QA.
- Confirm backend endpoints for system test + KP03 submissions exist.
- Confirm project deadlines include project2 names for matching.

Risks / unknowns and de-risking:
- Missing project2 endpoints or fields for requests -> verify API responses early.
- Deadline naming mismatches -> compare names/relatedTo and add fallbacks.
- Status mapping drift between legacy and Next.js -> validate status states.

Verification checklist:
- Start Next.js dev server and open Phase 1 page with flag on.
- Navigate to OVR, system test, and KP03 flows end-to-end.
- Confirm locks, late rules, and errors render as expected.
- Validate request status changes after submissions.
