# Best Practice: Manual Testing Guide for CS Logbook System

This document outlines the best practices for manually testing the "Internship" (ฝึกงาน) and "Special Project" (โครงงานพิเศษ) workflows. It covers the entire lifecycle from student registration to completion.

## 1. Prerequisites & Setup

Before starting manual testing, ensure you have the following:

### 1.1 Test Accounts
You need access to accounts for each role involved in the workflow:
- **Student**: The primary user initiating requests.
- **Advisor (Teacher)**: Approves topics, logbooks, and proposals.
- **Staff (Admin)**: Verifies documents (CS05, Company Response) and manages defense schedules.

### 1.2 Data Preparation
For a clean test run, it is recommended to reset the relevant data or use a fresh student account.
- **Reset Data**: Use the provided seeders to reset student data if needed.
  ```bash
  npx sequelize-cli db:seed:undo:all
  npx sequelize-cli db:seed:all
  ```
- **Specific Seeders**:
  - `20250825090000-reset-students-data.js`: Resets student data.
  - `20250513000001-initial-internship-steps.js`: Ensures internship steps are defined.

## 2. Internship Workflow Testing (ระบบฝึกงาน)

### Phase 1: Registration & Document Submission
| Step | Actor | Action | Expected Result |
|------|-------|--------|-----------------|
| 1. Eligibility | Student | Log in and navigate to "Internship". | System checks eligibility. Status: `INTERNSHIP_ELIGIBILITY_MET`. |
| 2. Submit CS05 | Student | Fill in internship details and submit "CS05 Form". | Status changes to `INTERNSHIP_CS05_SUBMITTED`. |
| 3. Verify CS05 | Staff | Log in, view "Internship Requests", and **Approve** CS05. | Status changes to `INTERNSHIP_CS05_APPROVED`. |
| 4. Upload Response | Student | Upload "Company Acceptance Letter" (หนังสือตอบรับ). | Status changes to `INTERNSHIP_COMPANY_RESPONSE_RECEIVED`. |
| 5. Verify Response | Staff | Verify the uploaded document. | Status changes to `INTERNSHIP_AWAITING_START` or `INTERNSHIP_IN_PROGRESS` (depending on date). |

### Phase 2: During Internship (Logbook)
| Step | Actor | Action | Expected Result |
|------|-------|--------|-----------------|
| 6. Daily Log | Student | Create a "Daily Log" entry with details and hours. | Entry appears in "Pending" state. |
| 7. Approve Log | Advisor | Review student's logbook and **Approve**. | Log status becomes "Approved". Hours are added to total. |

### Phase 3: Completion
| Step | Actor | Action | Expected Result |
|------|-------|--------|-----------------|
| 8. Summary | Student | Submit "Internship Summary/Report". | Status changes to `INTERNSHIP_SUMMARY_PENDING`. |
| 9. Final Approval | Staff | Verify completion of hours and documents. | Status changes to `INTERNSHIP_COMPLETED`. |

---

## 3. Special Project Workflow Testing (โครงงานพิเศษ)

The project workflow is divided into Project 1 (Preparation) and Project 2 (Implementation/Thesis).

### Phase 1: Project 1 (Preparation)
| Step | Actor | Action | Expected Result |
|------|-------|--------|-----------------|
| 1. Team Formation | Student | Invite partner (optional) and submit "Project Topic" (TH/EN). | Status: `PROJECT1_TEAM_READY`. |
| 2. Topic Approval | Advisor | Approve the proposed topic. | Status changes to `PROJECT1_IN_PROGRESS`. |
| 3. Progress Log | Student | Submit progress update (Meeting Log). | Log recorded. |
| 4. Log Approval | Advisor | Approve progress log. | Progress count increases. |
| 5. Readiness | System | Check if minimum logs/meetings are met. | Status: `PROJECT1_READINESS_REVIEW`. |
| 6. Defense Request | Student | Request "Project 1 Defense". | Request sent to Staff/Committee. |
| 7. Defense Result | Staff | Record result as **Passed**. | Status: `PROJECT1_DEFENSE_RESULT`. Transition to Project 2 enabled. |

### Phase 2: Project 2 (Thesis)
| Step | Actor | Action | Expected Result |
|------|-------|--------|-----------------|
| 8. Implementation | Student | Work on project, submit logs (continuous from Project 1). | Status: `THESIS_PROPOSAL_SUBMITTED` / `THESIS_IN_PROGRESS`. System allows log submission immediately. |
| 9. System Test | Student | Submit "System Test Results". | Status: `THESIS_SYSTEM_TEST`. |
| 10. Defense Request | Student | Request "Thesis Defense" (CS03). | Status: `THESIS_DEFENSE_REQUEST`. |
| 11. Final Defense | Committee | Conduct defense and record **Pass**. | Status: `THESIS_DEFENSE_RESULT`. |
| 12. Submission | Student | Submit "Final Thesis Book" (PDF). | Status: `THESIS_FINAL_SUBMISSION`. |

> [!IMPORTANT]
> **Testing Focus (จุดที่ต้องเน้น)**
> 1. **Transition Check**: ทันทีที่ Project 1 ผ่าน (Pass), ลองล็อกอินเป็นนักศึกษาแล้วกดเข้าเมนู Project 2 -> ต้องเข้าได้ทันที และ ปุ่ม "Create Log" ต้องกดได้ (ไม่ควรมี Alert ว่า "กรุณารออนุมัติ Proposal")
> 2. **State Consistency**: ตรวจสอบว่า Log ที่จดในช่วงนี้ ถูกนับจำนวนเข้าไปใน Project 2 อย่างถูกต้อง (ไม่ไปปนกับยอดของ Project 1)

## 4. Edge Cases & Best Practices

### 4.1 Rejection Flows
- **Test**: Have an Advisor **Reject** a logbook or a Topic Proposal.
- **Verify**: Student receives notification/status update and can **Edit/Resubmit**.

### 4.2 Late Submissions
- **Test**: Attempt to submit a document after the configured deadline.
- **Verify**: System should flag as "Late" (ส่งช้า) or block submission (depending on policy).

### 4.3 Role Switching
- **Best Practice**: Use different browsers or Incognito windows to log in as Student and Advisor simultaneously to test real-time updates and avoid session conflicts.

### 4.4 Database Verification
- **Best Practice**: Occasionally check the database (`student_workflow_activities`, `logbooks`) to ensure the backend state matches the UI.

## 5. Automated Verification
Before starting manual testing, it is recommended to run the existing integration tests to ensure core functionalities are stable.
```bash
cd backend
npm test
```
Key integration tests:
- `meetingApprovalRequest.integration.test.js`: Verifies meeting log flows.
- `topicExamOverview.integration.test.js`: Verifies project topic flows.
