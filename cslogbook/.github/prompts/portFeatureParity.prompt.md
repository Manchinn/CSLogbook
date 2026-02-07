---
name: portFeatureParity
description: Recreate a feature/page in the new stack using legacy behavior as reference
argument-hint: Specify the target feature/page and legacy source to mirror
---
You are tasked with porting an existing feature/page from a legacy implementation into the current codebase, matching functionality and UX expectations.

Follow these steps:
1) Inventory legacy behavior:
   - Identify the legacy files/components/services involved for the feature (UI, hooks, services, guards, status logic, actions like send/approve).
   - List key states, guards, and user flows (e.g., eligibility checks, pending/approved/rejected/cancelled states, empty/error/loading handling).
   - Note required data: APIs, payloads, stats, tables, reflections/notes, progress thresholds, call-to-actions (preview/download/send), and visibility conditions.

2) Map to the new stack:
   - Locate or create equivalent services/hooks/endpoints; ensure paths/params match backend mounts (avoid double prefixes).
   - Implement guards/empty/error/loading states consistent with legacy intent.
   - Recreate UI sections: headers/meta, progress/stats, tables/lists, forms/edit modes, action buttons (with enable/disable rules), and callouts/alerts.
   - Preserve thresholds (e.g., hour/day requirements) and status labels; map status values if they differ.

3) Implement:
   - Update or add components, hooks, and services; keep code concise and typed.
   - Add minimal styles to support new UI elements (tables, tags, progress, forms/buttons).
   - Ensure mutations invalidate/refetch relevant queries.

4) Validate:
   - Cross-check required states/actions against the legacy list.
   - Confirm API calls succeed with correct base URL and mount paths.
   - Note follow-up steps (restart dev server, run lint/tests) if needed.

Input to provide: target feature/page and legacy source to mirror. Apply the above to produce the updated implementation.
