# Backend Patch Plan: Settings Endpoint Mismatches

Date: 2026-02-27

Remaining frontend/backend mismatches after frontend fixes:

1. `GET /api/admin/settings/eligibility`
2. `PUT /api/admin/settings/eligibility`
3. `GET /api/admin/settings/student-statuses`
4. `POST /api/admin/settings/student-statuses`
5. `PUT /api/admin/settings/student-statuses/:id`
6. `DELETE /api/admin/settings/student-statuses/:id`

## Why these mismatch

- `frontend-next` has pages using these routes:
  - `src/app/(app)/admin/settings/status/page.tsx`
  - `src/lib/services/settingsService.ts`
- `backend` currently has no mounted routes for `/api/admin/settings/*`.

## Recommended backend implementation

## 1) Add routes in `routes/adminRoutes.js`

```js
router.get('/settings/eligibility', adminAuth, adminSettingsController.getEligibilitySettings);
router.put('/settings/eligibility', adminAuth, adminSettingsController.updateEligibilitySettings);

router.get('/settings/student-statuses', adminAuth, adminSettingsController.listStudentStatuses);
router.post('/settings/student-statuses', adminAuth, adminSettingsController.createStudentStatus);
router.put('/settings/student-statuses/:id', adminAuth, adminSettingsController.updateStudentStatus);
router.delete('/settings/student-statuses/:id', adminAuth, adminSettingsController.deleteStudentStatus);
```

## 2) Add controller

- New file: `controllers/adminSettingsController.js`
- Responsibilities:
  - validate payload
  - call service layer
  - return `{ success: true, data }`

## 3) Add service + model/migration

- New service: `services/adminSettingsService.js`
- New model: `models/StudentStatus.js`
- New migration: create `student_statuses` table:
  - `id`, `code`, `name`, `description`, `color`, `active`, `conditions` (JSON), timestamps

## 4) Eligibility settings storage

Choose one:
- Option A: New table `eligibility_settings`
- Option B: Store in existing academic settings table as JSON field

Frontend expects free-form object (`Record<string, unknown>`), so JSON storage is fine.

## 5) Authorization scope

- Keep `adminAuth` (admin + support teacher) to match current frontend guard behavior in settings pages.

