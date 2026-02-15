# Frontend-Next Staging Testing Plan

**Last Updated**: 2026-02-15
**Target**: Feature flags rollout testing before production deployment
**Environment**: Staging (with `.env.staging` configuration)

---

## 🎯 Testing Objectives

1. Verify all newly enabled features work correctly
2. Test integration with backend APIs
3. Confirm no regressions in existing features
4. Validate permission and role-based access control
5. Check responsive design and UX consistency

---

## 🚦 Newly Enabled Features (Priority Testing)

### 1. ✅ Internship Logbook Page
**Route**: `/internship/logbook`
**Flag**: `NEXT_PUBLIC_ENABLE_INTERNSHIP_LOGBOOK_PAGE=true`

**Test Cases**:
- [ ] Page renders without errors for students
- [ ] Company info section displays correctly
- [ ] Logbook entries list loads with pagination
- [ ] Timesheet stats display accurately
- [ ] Add new logbook entry form works
- [ ] Edit existing entry works
- [ ] Delete entry triggers confirmation and works
- [ ] Hour calculation is accurate
- [ ] Date validation works (no future dates, within internship period)
- [ ] File attachments upload successfully
- [ ] Timesheet summary shows correct totals
- [ ] Supervisor approval status displays correctly
- [ ] Loading states show during API calls
- [ ] Error states show appropriate messages
- [ ] Empty state shows when no entries exist
- [ ] Permission check: Non-students cannot access
- [ ] API endpoints:
  - [ ] `GET /internship/logbook`
  - [ ] `POST /internship/logbook/entry`
  - [ ] `PUT /internship/logbook/entry/:id`
  - [ ] `DELETE /internship/logbook/entry/:id`
  - [ ] `GET /logbooks/internship/timesheet/stats`

**Expected Issues**: None (feature is complete)

---

### 2. ✅ Internship Certificate Page
**Route**: `/internship/certificate`
**Flag**: `NEXT_PUBLIC_ENABLE_INTERNSHIP_CERTIFICATE_PAGE=true`

**Test Cases**:
- [ ] Page renders without errors for students
- [ ] Certificate request status displays correctly
- [ ] Request form shows when no request exists
- [ ] Form validation works (required fields, file types)
- [ ] File upload works for certificate documents
- [ ] Submit request triggers backend API
- [ ] Success message shows after submission
- [ ] Certificate number displays after approval
- [ ] Download certificate button works (if approved)
- [ ] Request details show (submission date, status, reviewer)
- [ ] Status badge shows correct color (pending, approved, rejected)
- [ ] Rejection reason displays if rejected
- [ ] Loading states work correctly
- [ ] Error handling works
- [ ] Permission check: Only eligible students can access
- [ ] API endpoints:
  - [ ] `GET /internship/certificate-status`
  - [ ] `POST /internship/certificate/request`
  - [ ] `GET /internship/certificate/download`

**Expected Issues**: None (feature is complete)

---

### 3. ✅ Project Phase 2 Page (Enhanced)
**Route**: `/project/phase2`
**Flag**: `NEXT_PUBLIC_ENABLE_PROJECT_PHASE2_PAGE=true`

**Test Cases**:
- [ ] Main overview page renders
- [ ] Workflow timeline displays correctly
- [ ] Current phase status shows
- [ ] System test step content works
- [ ] Thesis defense step content works
- [ ] Navigation between steps works
- [ ] Deadlines display correctly
- [ ] Member information shows
- [ ] Advisor information displays
- [ ] Permission check: Only students with projects can access
- [ ] API endpoints:
  - [ ] `GET /projects/mine`
  - [ ] `GET /projects/:id/workflow-state`
  - [ ] `GET /projects/:id/system-test/request`

**Expected Issues**: Main overview page may need content refinement (partial implementation)

---

### 4. ✅ Admin Widget Migration
**Route**: `/dashboard/admin`
**Flag**: `NEXT_PUBLIC_ENABLE_ADMIN_WIDGET_MIGRATION=true`

**Test Cases**:
- [ ] Admin dashboard shows all widgets
- [ ] Admin stats widget displays (students, internships, projects counts)
- [ ] Project workflow widget shows phase statistics
- [ ] Loading states work
- [ ] Error states work
- [ ] Refresh button works
- [ ] Widgets are responsive
- [ ] Permission check: Only admin can access
- [ ] API endpoints:
  - [ ] `GET /admin/dashboard-stats`
  - [ ] `GET /admin/projects/workflow-stats`

**Expected Issues**: None

---

## 📋 Regression Testing (Existing Features)

### Student Module

**Dashboard** (`/dashboard/student`):
- [ ] All 4 widgets render correctly
- [ ] Eligibility widget shows accurate data
- [ ] Deadlines widget shows upcoming deadlines
- [ ] Internship status widget displays correctly
- [ ] Project status widget displays correctly
- [ ] No layout breaks

**Internship Registration** (`/internship-registration`):
- [ ] Flow page explains process correctly
- [ ] Registration form loads
- [ ] CS05 form submission works
- [ ] Transcript upload works
- [ ] Validation works
- [ ] Success/error feedback works

**Project Phase 1** (`/project/phase1/*`):
- [ ] Overview page shows workflow
- [ ] All 7 step pages accessible
- [ ] Topic submit works
- [ ] Meeting logbook accessible
- [ ] Exam submit works
- [ ] No regressions from Phase 2 changes

**Deadlines Calendar** (`/student-deadlines/calendar`):
- [ ] Calendar renders
- [ ] Deadlines display correctly
- [ ] Filter by academic year works
- [ ] Status indicators work
- [ ] Responsive on mobile

**Company Stats** (`/internship-companies`):
- [ ] Table renders
- [ ] Search/filter works
- [ ] Pagination works
- [ ] Company detail drawer opens
- [ ] Student list in drawer displays
- [ ] Responsive layout

---

### Admin Module

**User Management**:
- `/admin/users/students`:
  - [ ] List loads
  - [ ] Search/filter works
  - [ ] Add student works
  - [ ] Edit student works
  - [ ] Delete student works
  - [ ] Statistics display correctly

- `/admin/users/teachers`:
  - [ ] List loads
  - [ ] CRUD operations work
  - [ ] Permission toggles work

- `/project-pairs`:
  - [ ] List loads
  - [ ] Filter works
  - [ ] Add project modal works
  - [ ] Update project works
  - [ ] Cancel project works

**Document Management**:
- `/admin/documents/internship`:
  - [ ] List loads
  - [ ] Filter works
  - [ ] Bulk review works
  - [ ] Reject modal works
  - [ ] Document preview works
  - [ ] Late submission badges show

- `/admin/documents/certificates`:
  - [ ] List loads
  - [ ] Detail drawer works
  - [ ] Approve with certificate number works
  - [ ] Reject with remarks works
  - [ ] Download works

**Project Documents** (6 pages):
- `/admin/topic-exam/results`:
  - [ ] List loads
  - [ ] Record result works
  - [ ] Edit result works
  - [ ] Export works

- `/admin/project1/kp02-queue`:
  - [ ] Queue loads
  - [ ] Verify flow works
  - [ ] Export works

- `/admin/project-exam/results`:
  - [ ] Pending list loads
  - [ ] Record result works

- `/admin/system-test/staff-queue`:
  - [ ] Queue loads
  - [ ] Decision flow works
  - [ ] Evidence preview works

- `/admin/thesis/staff-queue`:
  - [ ] Queue loads
  - [ ] Verify flow works

- `/admin/thesis/exam-results`:
  - [ ] Pending list loads
  - [ ] Record result works
  - [ ] Final document status update works

**Settings** (5 pages):
- [ ] `/admin/settings/curriculum` - CRUD works
- [ ] `/admin/settings/academic` - Year/semester management works
- [ ] `/admin/settings/status` - Status types management works
- [ ] `/admin/settings/notification-settings` - Toggle works
- [ ] `/admin/settings/workflow-steps` - CRUD/reorder works

**Upload**:
- `/admin/upload`:
  - [ ] Prerequisite checks work
  - [ ] File upload works
  - [ ] Import summary displays
  - [ ] Filter results works

---

### Teacher Module

**Dashboard** (`/dashboard/teacher`):
- [ ] Teacher overview widget displays
- [ ] Statistics accurate
- [ ] Refresh works

---

### Public Pages

**Supervisor Evaluation** (`/evaluate/supervisor/[token]`):
- [ ] Form loads with valid token
- [ ] Expired token shows error
- [ ] Used token shows error
- [ ] Form validation works
- [ ] Submission works
- [ ] Success message shows

**Timesheet Approval** (`/approval/timesheet/[token]`):
- [ ] Approval page loads
- [ ] Approve works
- [ ] Reject works
- [ ] Token status checked

---

## 🔒 Permission & Security Testing

### Role-Based Access
- [ ] Student routes blocked for non-students
- [ ] Admin routes blocked for non-admins
- [ ] Teacher routes blocked for non-teachers
- [ ] Public routes accessible without login
- [ ] AuthGuard redirects to login properly
- [ ] RoleGuard shows appropriate error messages

### Authentication
- [ ] SSO login works (if enabled)
- [ ] Normal login works
- [ ] Token refresh works
- [ ] Logout works
- [ ] Session persistence works
- [ ] Expired token handling works

---

## 🎨 UI/UX Testing

### Responsive Design
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

### Browser Compatibility
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### UI Consistency
- [ ] Loading states consistent across pages
- [ ] Error messages consistent
- [ ] Success messages show appropriately
- [ ] Modal/Drawer behavior consistent
- [ ] Form validation feedback consistent
- [ ] Typography consistent
- [ ] Color scheme consistent
- [ ] Spacing/padding consistent

---

## 🐛 Known Issues to Watch

1. **Project Phase 2 Overview**:
   - Main content may be incomplete
   - Workflow state may not update properly
   - Needs content refinement

2. **Hydration Warnings**:
   - Check browser console for hydration mismatches
   - Ensure `useHydrated` hook is used where needed

3. **API Integration**:
   - Backend must be running with correct endpoints
   - Database must have test data
   - CORS settings must allow staging origin

---

## 📊 Performance Testing

- [ ] Time to Interactive (TTI) < 3s
- [ ] First Contentful Paint (FCP) < 1.5s
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] No memory leaks when navigating
- [ ] Images load optimally
- [ ] API response times reasonable

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All priority test cases pass
- [ ] No critical regressions
- [ ] Performance metrics acceptable
- [ ] Security audit passed
- [ ] Feature flags configured correctly

### Staging Deployment
- [ ] Copy `.env.staging` to `.env` on staging server
- [ ] Run `npm install` (if dependencies changed)
- [ ] Run `npm run build`
- [ ] Start server with `npm run start`
- [ ] Verify app loads correctly
- [ ] Test one flow end-to-end
- [ ] Check logs for errors

### Production Rollout Plan
**Phase 1** (Week 1):
- [ ] Enable `ENABLE_INTERNSHIP_LOGBOOK_PAGE=true`
- [ ] Monitor for 2-3 days
- [ ] Collect user feedback

**Phase 2** (Week 1-2):
- [ ] Enable `ENABLE_INTERNSHIP_CERTIFICATE_PAGE=true`
- [ ] Monitor for 2-3 days

**Phase 3** (Week 2):
- [ ] Enable `ENABLE_PROJECT_PHASE2_PAGE=true`
- [ ] Monitor for 2-3 days

**Phase 4** (Week 2-3):
- [ ] Enable `ENABLE_ADMIN_WIDGET_MIGRATION=true`
- [ ] Monitor for 2-3 days

**Phase 5** (Week 3-4):
- [ ] Full production rollout
- [ ] Disable legacy routes gradually
- [ ] Monitor metrics

---

## 📝 Test Results Template

### Test Session Info
- **Date**: _________
- **Tester**: _________
- **Environment**: Staging
- **Backend Version**: _________
- **Frontend Version**: _________

### Summary
- **Total Tests**: _________
- **Passed**: _________
- **Failed**: _________
- **Blocked**: _________

### Failed Tests
| Test Case | Expected | Actual | Severity | Notes |
|-----------|----------|--------|----------|-------|
|           |          |        |          |       |

### Recommendations
- [ ] Ready for production
- [ ] Needs minor fixes
- [ ] Needs major fixes
- [ ] Blocked (requires external dependency)

---

## 📞 Support & Escalation

**For Issues Found**:
1. Check console for errors
2. Check network tab for API failures
3. Check browser compatibility
4. Document steps to reproduce
5. Report in issue tracker with:
   - Environment details
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos
   - Console logs

**Critical Issues**:
- Authentication failures
- Data loss
- Permission bypass
- API crashes
- Security vulnerabilities

**Non-Critical Issues**:
- UI misalignments
- Missing translations
- Performance degradation
- UX improvements

---

**Testing Status**: 🟡 In Progress

**Next Update**: After staging testing complete
