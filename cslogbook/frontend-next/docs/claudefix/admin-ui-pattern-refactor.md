# Admin UI Pattern Refactor

**Session:** 5 (2026-03-01)
**Branch:** `claude/claude-md-mm56ik11ksjo6flh-JgWXL`

## Summary

Aligned `admin/users/teachers` and `project-pairs` pages to follow the same UI pattern already established in `admin/users/students` (reference page).

---

## Reference Pattern (students page)

The `admin/users/students/page.tsx` is the canonical pattern. All admin CRUD pages should follow:

| Element | Correct pattern |
|---|---|
| Feedback banner | `styles.alert` + `styles.alertSuccess / alertWarning` |
| Header add button | `styles.button styles.buttonPrimary` (blue) |
| Header subtitle | User-facing Thai text — NOT dev/internal notes |
| Drawer structure | `drawerOverlay > aside.drawer` with **3 rows**: header / body / footer |
| Drawer view mode | Grouped `styles.detailSection` blocks each with `styles.detailTitle` heading |
| Drawer form mode | `styles.formGrid > label.field > input.input` |
| Buttons | Always `type="button"` |
| CSS required | `.alert`, `.alertSuccess`, `.alertWarning`, `.buttonPrimary`, `.buttonDanger`, `.detailSection`, `.detailTitle`, `.drawerFooter` |

---

## Changes Made

### 1. `admin/users/teachers/page.tsx`

| Before | After |
|---|---|
| Subtitle: "รองรับ CRUD อาจารย์และสิทธิ์ใช้งานโครงงานตาม flow API เดิม" (dev text) | "จัดการข้อมูลอาจารย์ ตำแหน่ง และสิทธิ์การใช้งานระบบ" |
| Drawer view: flat `<p>` list | Grouped `detailSection` blocks: ข้อมูลทั่วไป / ตำแหน่ง / สิทธิ์การใช้งาน |

Note: Multi-select filters for position/teacherType were intentionally kept (user confirmed need to filter multiple values simultaneously).

### 2. `admin/users/teachers/page.module.css`

Added: `.detailSection`, `.detailTitle`, `.alert`, `.alertSuccess`, `.alertWarning`

### 3. `project-pairs/page.tsx`

| Before | After |
|---|---|
| Feedback: `styles.card + tagOk/tagMuted` (grey/green misuse) | `styles.alert + alertSuccess/alertWarning` (correct) |
| Add button: `styles.button` only | `styles.button styles.buttonPrimary` (blue) |
| Subtitle: dev text | "จัดการคู่โครงงานพิเศษ เพิ่ม แก้ไข และยกเลิกโครงงานของนักศึกษา" |
| Buttons: missing `type="button"` | All buttons have `type="button"` |
| Drawer: 2 rows (no footer) | 3 rows — action buttons moved to `<footer className={styles.drawerFooter}>` |
| Drawer view: mixed `detailCard` class | Consistent `detailSection` blocks matching student pattern |
| JSX: 200+ char one-liners | Expanded to readable multi-line JSX |
| Cancel button: no danger styling | `styles.buttonDanger` applied |

### 4. `project-pairs/page.module.css`

Added: `.alert`, `.alertSuccess`, `.alertWarning`, `.buttonPrimary`, `.buttonDanger`, `.drawerFooter`, `.detailSection` (replacing `.detailCard`), updated `.detailTitle`
Updated: `.drawer` grid from `auto 1fr` → `auto 1fr auto`

---

## Files Changed

```
cslogbook/frontend-next/src/app/(app)/admin/users/teachers/page.tsx
cslogbook/frontend-next/src/app/(app)/admin/users/teachers/page.module.css
cslogbook/frontend-next/src/app/(app)/project-pairs/page.tsx
cslogbook/frontend-next/src/app/(app)/project-pairs/page.module.css
```

---

## Verification Checklist

- [ ] `npm run lint` in `cslogbook/frontend-next` passes with no new errors
- [ ] Teachers drawer view shows 3 grouped sections (ข้อมูลทั่วไป / ตำแหน่ง / สิทธิ์การใช้งาน)
- [ ] Project-pairs feedback banner shows green on success, yellow on warning (not grey)
- [ ] Project-pairs "เพิ่มโครงงานพิเศษ" button is blue
- [ ] Project-pairs drawer has header / body / footer structure
- [ ] "ยกเลิกโครงงาน" button shows red styling
