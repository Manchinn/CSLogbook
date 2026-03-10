# Key Files Reference — CSLogbook

Full list of notable files. Essential files are in CLAUDE.md; this file covers the rest.

---

## Backend

| File | Notes |
|---|---|
| `backend/config/scoring.js` | `PASS_SCORE`, `SCORE_BUCKETS`, `scoreToBucket()` |
| `backend/utils/studentUtils.js` | CONSTANTS cache, `reloadDynamicConstants` — critical for academic/curriculum |
| `backend/utils/retryUtil.js` | `withRetry()` — exponential backoff สำหรับ email transport |
| `backend/templates/base.html` | Base email template — unified KMUTNB branding, `{{content}}` slot |
| `backend/config/corsOrigins.js` | Dynamic CORS via `ALLOWED_ORIGINS` env |
| `backend/config/departmentInfo.js` | ชื่อหัวหน้าภาค, คณะ, มหาวิทยาลัย — ใช้ใน PDF ทุกประเภท |

## Frontend — Utils & Constants

| File | Notes |
|---|---|
| `src/lib/utils/statusLabels.ts` | `labelStatus()`, `statusTone()`, `approvalStatusLabel()` — use instead of raw enums |
| `src/constants/workflowStates.ts` | Enums, transition maps, UI config, `canTransition()` — generated from WORKFLOW_STATES.md |
| `src/lib/utils/thaiDateUtils.ts` | `currentBuddhistYear()` shared function |

## Frontend — Services & Hooks

| File | Notes |
|---|---|
| `src/lib/services/teacherService.ts` | Teacher API — `submitKP02AdvisorDecision` needs `defenseType` |
| `src/hooks/useTeacherModule.ts` | Teacher hooks — supports `defenseType` |

## Frontend — Components

| File | Notes |
|---|---|
| `project/phase1/view/ProjectContent.tsx` | **Main project page** — unified Phase 1 + 2 |
| `ProjectPhase1Sections.tsx` | `PhaseStepsGrid` with section dividers |
| `ProjectPhase2Sections.tsx` | `SummaryCards`, `Phase2GateNotice`, `MeetingLogbookSection` |
| `src/lib/project/phase2Gate.ts` | Phase 2 gate reasons (Thai) |
| `src/app/globals.css` | Design tokens (spacing, shadows, surfaces) |
| `admin/settings/layout.tsx` | Shared settings tab navigation (6 pages) |
| `admin/settings/settings.module.css` | Shared CSS for all settings pages |
| `src/components/common/ConfirmDialog.tsx` | Replaces `window.confirm` |
| `src/components/common/Skeleton.tsx` | Table/card skeleton loading |
| `src/components/common/DefenseRequestStepper.tsx` | Defense request stepper |
| `src/components/dashboard/SurveyBanner.tsx` | Survey banner (3 dashboards) |

## Docs & Infrastructure

| File | Notes |
|---|---|
| `docs/compatibility/` | DO_NOT_REMOVE API usage lists |
| `docs/STAGING_TEST_PLAN.md` | Test checklist (P0-P3) |
| `.github/workflows/production-deploy.yml` | CI/CD pipeline |

## Legacy (kept, not mounted)

- `ProjectPhase1Content.tsx`, `ProjectPhase2Content.tsx` — replaced by `ProjectContent.tsx`
