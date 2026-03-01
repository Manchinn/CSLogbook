# Project Page Unified Redesign — โครงงานพิเศษ & ปริญญานิพนธ์

**Session:** 6 (2026-03-01)
**Branch:** `claude/claude-md-mm56ik11ksjo6flh-JgWXL`
**Commit:** `fa629074`

---

## Summary

Redesigned the `/project/phase1` page into a single unified flow covering both "โครงงานพิเศษ 1" (Phase 1, 5 steps) and "ปริญญานิพนธ์" (Phase 2, 2 steps). Merged `/project/phase2` into phase1, removed it from the navigation menu, and completed a naming audit across all project-related pages.

---

## Motivation

Previously the project section was split into two separate pages (`/project/phase1` and `/project/phase2`). Students had to navigate between them to track their full project lifecycle. The redesign unifies the flow and makes the phase transition visible in one place.

---

## UI Layout (Implemented)

```
╔══════════════════════════════════════════════════════╗
║  KICKER: โครงงานพิเศษ & ปริญญานิพนธ์               ║
║  TITLE: [ชื่อโครงงาน TH]                            ║
║  SUBTITLE: [EN title] | [semester/year]              ║
║  META: อาจารย์ที่ปรึกษา: [ชื่อ] + ร่วม: [ชื่อ]     ║
╚══════════════════════════════════════════════════════╝

[EligibilityNotices / AcknowledgeNotice / ProjectLockNotices]

[Phase 2 Summary Cards — แสดงเมื่อปริญญานิพนธ์ปลดล็อกแล้ว]
[Phase2GateNotice — แสดงเมื่อยัง lock]

[TABS: ทั้งหมด | โครงงานพิเศษ 1 | ปริญญานิพนธ์]

"ทั้งหมด" tab:
  ── โครงงานพิเศษ 1 (5 ขั้นตอน) ─────────────────
  [KP01] [EXM] [REV] [LOG] [KP02]
                            ↓
  ── ปริญญานิพนธ์ (2 ขั้นตอน) ──────────────────
  [TEST] [KP03]

[MeetingLogbookSection — แสดงเมื่อปริญญานิพนธ์ปลดล็อก]
[ProjectOverviewPanels]
[WorkflowTimeline]
```

---

## Changes Made

### 1. `project/phase1/view/ProjectContent.tsx` — **NEW**

Unified component replacing `ProjectPhase1Content` as the main page component.

**Key features:**
- Hero: kicker "โครงงานพิเศษ & ปริญญานิพนธ์" + project name TH/EN + advisors
- `allSteps = [...phase1Steps, ...phase2Steps.filter(s => s.key !== "phase2-overview")]`
  — excludes `phase2-overview` step (replaced by visual section divider)
- Phase 2 summary cards + `MeetingLogbookSection` shown only when `phase2Unlocked` (i.e. `phase2GateReasons.length === 0`)
- `Phase2GateNotice` shown when Phase 2 is still locked
- `PhaseStepsGrid` with `showSectionDividers={true}`
- Imports `SummaryCards`, `Phase2GateNotice`, `MeetingLogbookSection` from `../../phase2/view/ProjectPhase2Sections` (correct CSS scope)

### 2. `project/phase1/view/ProjectPhase1Sections.tsx`

- Removed broken `_LegacyStepMap` fragment artifact
- `PhaseStepsGrid`: added `showSectionDividers?: boolean` prop
- When `activePhaseTab === "all"` and `showSectionDividers === true`: renders `<SectionDivider>` between phase1 and phase2 step groups
- Tab label: `"โครงงานพิเศษ 2"` → `"ปริญญานิพนธ์"`

### 3. `project/phase1/view/phase1.module.css`

Added `.sectionDivider`, `.sectionDividerLabel`, `.sectionDividerArrow` CSS for the visual divider between phases.

### 4. `project/phase1/page.tsx`

```tsx
// Before
const ProjectPhase1Content = dynamic(() => import("./view/ProjectPhase1Content"), { ssr: false });
const ProjectPhase2Content = dynamic(() => import("../phase2/view/ProjectPhase2Content"), { ssr: false });

// After
const ProjectContent = dynamic(() => import("./view/ProjectContent"), { ssr: false });
```

### 5. `project/phase2/page.tsx`

```tsx
// Before: complex conditional render (Phase1Content or Phase2Content based on feature flag)
// After: clean redirect
import { redirect } from "next/navigation";
export default function ProjectPhase2Page() {
  redirect("/project/phase1");
}
```

### 6. `lib/navigation/menuConfig.ts`

Removed the Phase 2 menu item — `/project/phase1` now covers the full flow.

---

## Naming Audit — 10 Files

All user-facing strings updated: `"โครงงานพิเศษ 2"` → `"ปริญญานิพนธ์"` across the frontend.

| File | Change |
|---|---|
| `projectPhase1Steps.ts` | `phaseLabel` for phase2 steps |
| `phase2Gate.ts` | Gate reason messages |
| `ProjectPhase2Sections.tsx` | `Phase2GateNotice` + `MeetingLogbookSection` labels |
| `SystemTestRequestContent.tsx` | Lock notice title |
| `ThesisDefenseRequestContent.tsx` | Page `<h1>` + lock notice title |
| `meeting-logbook/page.tsx` | Tab button + select options + section heading |
| `student-profile/[studentCode]/page.tsx` | Phase label map |
| `ProjectPhase1Content.tsx` | Status labels + lead text + timeline subtitle |
| `ProjectPhase2Content.tsx` | Kicker + title + lead + loading text |
| `InternshipSummaryView.tsx` + `summary.module.css` | Text wrapping + tone-aware status tags (bonus fix) |

---

## Component Roles After Redesign

| Component | Status | Role |
|---|---|---|
| `ProjectContent.tsx` | ✅ Active | Main page component for `/project/phase1` |
| `ProjectPhase1Content.tsx` | 🗂 Unused (kept) | Legacy — no longer mounted |
| `ProjectPhase2Content.tsx` | 🗂 Unused (kept) | Legacy — no longer mounted |
| `ProjectPhase1Sections.tsx` | ✅ Active | `PhaseStepsGrid` + step cards |
| `ProjectPhase2Sections.tsx` | ✅ Active | `SummaryCards`, `Phase2GateNotice`, `MeetingLogbookSection` |

---

## Files Changed

```
cslogbook/frontend-next/src/app/(app)/internship-summary/InternshipSummaryView.tsx
cslogbook/frontend-next/src/app/(app)/internship-summary/summary.module.css
cslogbook/frontend-next/src/app/(app)/project/phase1/meeting-logbook/page.tsx
cslogbook/frontend-next/src/app/(app)/project/phase1/page.tsx
cslogbook/frontend-next/src/app/(app)/project/phase1/view/ProjectContent.tsx         ← NEW
cslogbook/frontend-next/src/app/(app)/project/phase1/view/ProjectPhase1Content.tsx
cslogbook/frontend-next/src/app/(app)/project/phase1/view/ProjectPhase1Sections.tsx
cslogbook/frontend-next/src/app/(app)/project/phase1/view/phase1.module.css
cslogbook/frontend-next/src/app/(app)/project/phase1/view/projectPhase1Steps.ts
cslogbook/frontend-next/src/app/(app)/project/phase2/page.tsx
cslogbook/frontend-next/src/app/(app)/project/phase2/system-test/SystemTestRequestContent.tsx
cslogbook/frontend-next/src/app/(app)/project/phase2/thesis-defense/ThesisDefenseRequestContent.tsx
cslogbook/frontend-next/src/app/(app)/project/phase2/view/ProjectPhase2Content.tsx
cslogbook/frontend-next/src/app/(app)/project/phase2/view/ProjectPhase2Sections.tsx
cslogbook/frontend-next/src/app/(app)/student-profile/[studentCode]/page.tsx
cslogbook/frontend-next/src/lib/navigation/menuConfig.ts
cslogbook/frontend-next/src/lib/project/phase2Gate.ts
```

---

## Verification Checklist

- [x] `npx tsc --noEmit` — TypeScript zero errors
- [ ] `/project/phase1` hero shows project name + advisors
- [ ] "ทั้งหมด" tab shows section dividers: "โครงงานพิเศษ 1" → arrow → "ปริญญานิพนธ์"
- [ ] Tab label shows "ปริญญานิพนธ์" (not "โครงงานพิเศษ 2")
- [ ] Phase 2 summary cards appear when unlocked
- [ ] `Phase2GateNotice` appears when Phase 2 is still locked
- [ ] Navigate to `/project/phase2` → redirects to `/project/phase1`
- [ ] Phase 2 sub-pages (`/project/phase2/system-test`, `/thesis-defense`) still work
- [ ] Navigation menu shows only "ขั้นตอนโครงงานพิเศษ" (no Phase 2 entry)
