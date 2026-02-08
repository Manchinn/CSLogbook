---
name: planNextPhase
description: Propose the next development phase based on current discussion and project docs
argument-hint: Optional: key files or notes to consider (e.g., README sections, roadmap files)
---
Current state recap:
- Next.js Phase 1 dashboard now mirrors legacy gating: eligibility checks, post-topic lock reasons, deadline matching/late handling, and per-step status tags.
- Phase 1 step pages are implemented for topic submit, topic exam, meeting logbook, and KP02 exam submit; proposal revision remains a placeholder route.
- Topic submit wizard supports draft create/update with core fields, but legacy draft detail view and extended fields (scope, expectedOutcome, tools, etc.) are not yet carried over.
- Phase 2 actions remain partially stubbed (OVR refactor, system test request, KP03 request), with the Phase 2 overview card in place.
- Dashboards, Reports, and Settings are partially migrated; teacher/admin views still rely heavily on legacy.
- Admin lists (users/students/teachers/project-pairs), document queues (KP02/KP03/system test/exam results), and bulk tools remain legacy-first.

Next steps (priority order):
- Prioritize teacher/admin dashboard parity: port core widgets, KPI cards, queue summaries, and navigation parity before further student-facing polish.
- Migrate admin lists (users/students/teachers/project-pairs) into Next.js and align filters/sorting/export with legacy.
- Migrate admin document queues (KP02/KP03/system test/exam results) with status/timeline parity and approval actions.
- Bring Reports and Settings to parity with legacy before widening feature flags.
- Then finish remaining student polish items after admin parity is stable.
- Decide whether Phase 1 should surface the topic exam card (legacy dashboard commented it out) and align the card list accordingly.
- Expand topic submit to include legacy draft fields (scope, expectedOutcome, tools, methodology, timelineNote, risk, constraints) and add a draft detail view (read-only + refresh) for parity.
- Add proposal revision page or remove the step from Phase 1 if it is not part of the current curriculum scope.
- Validate meeting logbook parity (phase filter, edit/delete, approval statuses, stats by phase) and close any missing UI affordances.
- Confirm KP02 status/timeline fields and staff/advisor notes are rendered from the current response shape.
- Continue Phase 2 roadmap: OVR refactor, system test request, KP03 request, and deadline mapping for project2.

Prerequisites / flags:
- Enable `NEXT_PUBLIC_ENABLE_PROJECT_PHASE1_PAGE` for rollout and QA.
- Confirm teacher/admin dashboard data sources and endpoints for queues, KPI stats, and workflow summaries.
- Confirm admin list endpoints support pagination, filtering, and export parity with legacy.
- Confirm admin queue endpoints support pagination, filtering, and export parity with legacy.
- Confirm backend payloads for project deadlines expose allowLate/lockAfterDeadline and matching names.
- Confirm endpoints for topic exam status, meeting approvals, and KP02 status/timeline fields.
- Confirm which Phase 1 fields are required for compliance (scope/expectedOutcome/tools/etc.).
- Confirm /projects/{id} includes extended draft fields and member credit metadata used in the legacy draft detail view.

Risks / unknowns and de-risking:
- Deadline naming mismatches -> add fallback keyword matching as in legacy.
- Missing meeting/KP02 fields -> verify API responses early and update service types.
- Behavior drift in Phase 1 gating -> validate with legacy dashboard screenshots and test data.
- Topic exam visibility -> legacy card is commented out; confirm expected UI and avoid double-surfacing.
- Draft field coverage -> ensure backend accepts/returns all new fields before wiring the UI.
- Admin queue workflows are complex -> migrate one queue end-to-end (KP02) before cloning to KP03/system test/results.

Verification checklist:
- Start Next.js dev server and open Phase 1 page with flag on.
- Navigate to Phase 1 cards and validate lock behavior (post-topic gate + deadline lock + late rules).
- Validate topic submit + meeting logbook + KP02 flows with draft/project states.
- Verify topic exam schedule page matches deadline filtering rules.
- Confirm request status updates and error/empty states align with legacy.
- Validate teacher/admin dashboards render key KPIs and queue counts.
- Validate at least one admin queue (KP02) works end-to-end in Next.js.
