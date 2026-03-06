# Staging / Regression Test Plan

**Last Updated**: 2026-03-06
**Sessions Covered**: 1-19 (all changes since 2026-02-27)
**Environment**: Staging (backend + frontend running locally or on VPS)

---

## Summary of Changes to Test

### Architecture Changes
- Unified Project Page: Phase 1 + Phase 2 merged into `/project/phase1`
- `/project/phase2` now redirects to `/project/phase1`
- Feature flags removed — all features enabled by default
- CI/CD pipeline via GitHub Actions (`production-deploy.yml`)
- CORS dynamic origins via `ALLOWED_ORIGINS` env var
- Design tokens (CSS custom properties) in `globals.css`

### Bug Fixes (Sessions 1-2, 12, 14, 19)
- Login error messages now show Thai text instead of raw JSON
- Status badges use `labelStatus()` instead of raw enum strings
- `submitKP02AdvisorDecision` sends `defenseType` correctly
- Teacher overview query key mismatch fixed (dashboard refreshes after approve)
- Meeting-approvals `logId` → `id` mapping fixed (no React key warnings)
- Certificate PDF renders Thai font (Loma)
- Referral letter query fixed (removed invalid Academic association)

### New Features (Sessions 3-19)
- Phase 2 overview: thesis exam result card, tone-aware badges, gate notice
- Advisor name display in project hero card
- Admin UI: drawers with detailSection grouping, ConfirmDialog, Skeleton loading
- Teacher queue: status filters, summary stats (total/pending/approved/rejected)
- Teacher queue UI redesign: toolbar layout, gradient headers, animations
- DefenseRequestStepper shared component
- SurveyBanner in dashboards
- Internship logbook approval request button + modal
- Referral letter status + download hooks
- Timesheet entry delete with confirmation
- Custom 404 Not Found page
- CSLogbook logo branding

### Security Fixes (Sessions 11-12)
- RBAC on admin workflow statistics endpoint
- TODO stub controllers return 501 instead of fake success
- Centralized scoring config (`config/scoring.js`)
- Orphaned route files removed

---

## P0: Critical Path Testing

### 1. Authentication Flow
- [ ] Normal login with valid credentials
- [ ] Login error shows Thai message (not raw JSON)
- [ ] Token persists on page refresh
- [ ] Logout clears session
- [ ] Expired token redirects to login
- [ ] SSO login callback works (if configured)
- [ ] `teacherPosition` included in token (teacher login)

### 2. Student Project Flow (Unified Page)
**Route**: `/project/phase1`
- [ ] Page loads with unified Phase 1 + Phase 2 content
- [ ] `/project/phase2` redirects to `/project/phase1`
- [ ] Advisor name + co-advisor name display in hero card
- [ ] Phase labels show Thai text (not raw enum)
- [ ] Section dividers between Phase 1 and Phase 2 steps
- [ ] Step badges show tone-aware colors (success/danger/warning/info)
- [ ] Phase 2 gate notice shows when workflow state blocks thesis
- [ ] Thesis exam result card shows pass (green) / fail (red) when available
- [ ] "ปริญญานิพนธ์" used everywhere (never "โครงงานพิเศษ 2")
- [ ] Meeting logbook link button works
- [ ] SurveyBanner displays when configured
- [ ] Loading state shows while fetching
- [ ] Empty state shows "ยังไม่มีโครงงาน" when no project

### 3. Topic Submit (CreateWizard)
**Route**: `/project/phase1/topic-submit`
- [ ] Single form layout renders (refactored from wizard steps)
- [ ] Classification step works
- [ ] Members step works
- [ ] Review step works
- [ ] Form submission creates project

### 4. Exam Submit + Defense Request
**Route**: `/project/phase1/exam-submit`
- [ ] DefenseRequestStepper renders correctly
- [ ] Request submission works
- [ ] Status updates reflect in stepper

### 5. Meeting Logbook
**Route**: `/project/phase1/meeting-logbook`
- [ ] Logbook entries list loads
- [ ] Progress bar for approved logs displays
- [ ] Add new entry works
- [ ] Delete entry shows ConfirmDialog (not window.confirm)
- [ ] Delete works after confirmation

### 6. System Test + Thesis Defense (Phase 2 sub-pages)
**Route**: `/project/phase2/system-test`, `/project/phase2/thesis-defense`
- [ ] DefenseRequestStepper renders
- [ ] Request submission includes correct `defenseType`
- [ ] Advisor name + comment fields display

---

## P1: Teacher Module

### 7. Teacher Dashboard
**Route**: `/dashboard/teacher`
- [ ] Overview widget loads and shows accurate stats
- [ ] Dashboard refreshes after approving items (query key fix verified)
- [ ] SurveyBanner displays

### 8. Meeting Approvals
**Route**: `/teacher/meeting-approvals`
- [ ] Table always shows (even when empty — empty row message)
- [ ] Status filter dropdown works (all/pending/approved/rejected)
- [ ] Summary badges show correct counts (total/pending/approved/rejected)
- [ ] Toolbar layout: filter left, summary right
- [ ] Bulk action bar works (select multiple → approve/reject)
- [ ] No React key warnings in console (logId mapping fix)
- [ ] Approve/reject individual items works
- [ ] Expanded row shows details with fade-in animation

### 9. Advisor Queue — Project1 (คพ.02)
**Route**: `/teacher/project1/advisor-queue`
- [ ] Table always shows (empty row when no items)
- [ ] Status filter dropdown works
- [ ] Summary badges from backend (`{ items, summary }` response)
- [ ] `defenseType: "PROJECT1"` sent on approve/reject
- [ ] Expanded row details display correctly
- [ ] Approve/reject modal with backdrop blur + slide-in

### 10. Advisor Queue — Thesis
**Route**: `/teacher/thesis/advisor-queue`
- [ ] Same as Project1 queue but with `defenseType: "THESIS"`
- [ ] Summary badges show correct thesis-specific counts
- [ ] Table + filter + summary all work

### 11. Advisor Queue — System Test
**Route**: `/teacher/system-test/advisor-queue`
- [ ] Status filter sends query param to backend
- [ ] Summary maps system-test statuses → pending/approved/rejected
- [ ] Table renders with status dot indicators

---

## P1: Admin Module

### 12. Admin User Management
**Route**: `/admin/users/students`, `/admin/users/teachers`
- [ ] Skeleton loading shows during fetch
- [ ] Table loads with data
- [ ] Search/filter works
- [ ] Add/Edit drawer opens with detailSection grouping
- [ ] Form labels associated with inputs (htmlFor/id)
- [ ] Delete shows ConfirmDialog (not window.confirm)
- [ ] Custom select dropdown styles render correctly (SVG arrow)
- [ ] Teacher drawer: sections for ข้อมูลทั่วไป / ตำแหน่ง / สิทธิ์การใช้งาน

### 13. Project Pairs
**Route**: `/project-pairs`
- [ ] Skeleton loading shows
- [ ] Feedback banner uses `.alert.alertSuccess/alertWarning` styling
- [ ] "เพิ่มโครงงานพิเศษ" button is blue (buttonPrimary)
- [ ] Drawer has drawerFooter (action buttons separate from body)
- [ ] View mode uses detailSection grouping

### 14. Admin Documents
- [ ] `/admin/documents/internship` — icon buttons, UI improvements work
- [ ] `/admin/documents/certificates` — approve/reject flow works
- [ ] `/admin/documents/project` — detailed view renders (adminProjectDocumentsService)
- [ ] `/approve-documents` — teacherPosition-based access works

### 15. Admin Settings
- [ ] Academic semester settings load and save
- [ ] Validation works on semester form

### 16. Admin Dashboard
**Route**: `/dashboard/admin`
- [ ] All widgets render
- [ ] SurveyBanner displays
- [ ] Workflow statistics endpoint has RBAC (non-admin gets 403)

---

## P1: Student Internship Module

### 17. Internship Logbook
**Route**: `/internship/logbook`
- [ ] Logbook entries load
- [ ] Approval request button + modal works
- [ ] Timesheet stats display

### 18. Internship Timesheet
- [ ] Timesheet entries list
- [ ] Delete entry shows ConfirmDialog
- [ ] Delete works after confirmation

### 19. Internship Certificate
**Route**: `/internship/certificate`
- [ ] Certificate request flow works
- [ ] PDF renders Thai text correctly (Loma font)
- [ ] Date display is correct

### 20. Referral Letter
- [ ] Status check works (`useInternshipReferralLetter` hook)
- [ ] Download works

### 21. Internship Summary View
**Route**: `/internship-registration/view`
- [ ] Status tags show tone-aware colors
- [ ] Text wrapping works (no overflow)
- [ ] `labelStatus()` used for all status displays

---

## P2: Cross-Cutting Concerns

### 22. Status Label Consistency
- [ ] All status badges use `labelStatus()` — no raw enum strings anywhere
- [ ] "หน้าหลัก" used everywhere (not "แดชบอร์ด")
- [ ] "ปริญญานิพนธ์" used for project2 (not "โครงงานพิเศษ 2")

### 23. UI Components
- [ ] ConfirmDialog works across all pages (students, teachers, meeting-logbook, timesheet)
- [ ] Skeleton loading shows on admin pages during fetch
- [ ] DefenseRequestStepper renders in exam-submit, system-test, thesis-defense
- [ ] SurveyBanner shows in student/teacher/admin dashboards
- [ ] 404 Not Found page renders for invalid routes

### 24. Security
- [ ] Admin-only routes return 403 for non-admin users
- [ ] Teacher routes blocked for non-teachers
- [ ] Student routes blocked for non-students
- [ ] `teacherPosition` controls document approval menu visibility
- [ ] RBAC on workflow statistics endpoint
- [ ] Scoring uses centralized config (no hardcoded `70`)

### 25. CORS & Infrastructure
- [ ] `ALLOWED_ORIGINS` env var works for dynamic CORS
- [ ] Healthcheck endpoint responds
- [ ] Backend logs no CORS errors for configured origins

---

## P3: UI/UX Quality

### 26. Responsive Design
- [ ] Desktop (1920x1080) — no layout breaks
- [ ] Laptop (1366x768) — tables readable
- [ ] Mobile (375x667) — basic usability

### 27. Console Errors
- [ ] No React key warnings
- [ ] No hydration mismatches
- [ ] No uncaught promise rejections

### 28. Design Consistency
- [ ] Design tokens from `globals.css` applied consistently
- [ ] Teacher queue gradient headers + status dots render
- [ ] Admin select dropdowns have custom SVG arrow styling
- [ ] Button animations work (spring-curve on teacher queue)

---

## Test Session Template

| Field | Value |
|-------|-------|
| Date | _________ |
| Tester | _________ |
| Environment | Staging / Local |
| Backend commit | _________ |
| Frontend commit | _________ |

### Results

| Priority | Total | Pass | Fail | Blocked |
|----------|-------|------|------|---------|
| P0 | | | | |
| P1 | | | | |
| P2 | | | | |
| P3 | | | | |

### Failed Tests

| # | Test Case | Expected | Actual | Severity |
|---|-----------|----------|--------|----------|
| | | | | |

### Verdict
- [ ] Ready for production
- [ ] Needs minor fixes (list issues)
- [ ] Needs major fixes (list blockers)
