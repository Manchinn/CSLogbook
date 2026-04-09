-- ============================================================
-- fix-data.sql — เพิ่มข้อมูลที่ขาดสำหรับ thesis screenshots
-- รัน: docker exec -i cslogbook-mysql mysql -u deploy_cslogbook -pcs6404062630295 cslogbook_prod < fix-data.sql
-- ============================================================

-- ── 1. หา IDs ──────────────────────────────────────────────
SET @proj_uid  = (SELECT user_id FROM users WHERE username = 'uat_proj'   LIMIT 1);
SET @thesis_uid= (SELECT user_id FROM users WHERE username = 'uat_thesis' LIMIT 1);
SET @adv_uid   = (SELECT user_id FROM users WHERE username = 'uat_advisor' LIMIT 1);

SET @proj_sid  = (SELECT student_id FROM students WHERE user_id = @proj_uid   LIMIT 1);
SET @thesis_sid= (SELECT student_id FROM students WHERE user_id = @thesis_uid LIMIT 1);
SET @adv_tid   = (SELECT teacher_id FROM teachers WHERE user_id = @adv_uid   LIMIT 1);

-- project_id ของ uat_proj  (owner ของโครงงาน)
SET @proj_pid  = (
  SELECT pm.project_id
  FROM project_members pm
  WHERE pm.student_id = @proj_sid AND pm.role = 'owner'
  LIMIT 1
);

-- project_id ของ uat_thesis (owner ของโครงงาน)
SET @thesis_pid = (
  SELECT pm.project_id
  FROM project_members pm
  WHERE pm.student_id = @thesis_sid AND pm.role = 'owner'
  LIMIT 1
);

SELECT
  @proj_uid  AS proj_user_id,
  @thesis_uid AS thesis_user_id,
  @adv_uid   AS advisor_user_id,
  @proj_sid  AS proj_student_id,
  @thesis_sid AS thesis_student_id,
  @adv_tid   AS advisor_teacher_id,
  @proj_pid  AS proj_project_id,
  @thesis_pid AS thesis_project_id;

-- ── 2. ลบ request เก่าของ UAT (ถ้ามี) ───────────────────────
DELETE FROM project_defense_request_approvals
WHERE request_id IN (
  SELECT request_id FROM project_defense_requests
  WHERE project_id IN (@proj_pid, @thesis_pid)
);

DELETE FROM project_defense_requests
WHERE project_id IN (@proj_pid, @thesis_pid);

DELETE FROM project_test_requests
WHERE project_id = @thesis_pid;

-- ── 3. uat_proj: PROJECT1 defense request (advisor_in_review) ──
-- → แสดงใน: /teacher/project1/advisor-queue (ภาพ 5-44)
INSERT INTO project_defense_requests
  (project_id, defense_type, status, form_payload,
   submitted_by_student_id, submitted_at, submitted_late, created_at, updated_at)
VALUES
  (@proj_pid, 'PROJECT1', 'advisor_in_review',
   '{"requestDate":"2026-04-05","additionalNotes":"UAT คำร้องคพ.02 ขอสอบโครงงานพิเศษ 1"}',
   @proj_sid, NOW(), 0, NOW(), NOW());

SET @proj_req_id = LAST_INSERT_ID();

-- approval record สำหรับ uat_advisor (status = pending)
INSERT INTO project_defense_request_approvals
  (request_id, teacher_id, teacher_role, status, created_at, updated_at)
VALUES
  (@proj_req_id, @adv_tid, 'advisor', 'pending', NOW(), NOW());

-- ── 4. uat_thesis: THESIS defense request #1 (advisor_in_review) ──
-- → แสดงใน: /teacher/thesis/advisor-queue (ภาพ 5-53)
INSERT INTO project_defense_requests
  (project_id, defense_type, status, form_payload,
   submitted_by_student_id, submitted_at, submitted_late, created_at, updated_at)
VALUES
  (@thesis_pid, 'THESIS', 'advisor_in_review',
   '{"requestDate":"2026-04-05","intendedDefenseDate":"2026-05-01","additionalNotes":"UAT คำร้องคพ.03 ขอสอบปริญญานิพนธ์"}',
   @thesis_sid, NOW(), 0, NOW(), NOW());

SET @thesis_req1_id = LAST_INSERT_ID();

-- approval record สำหรับ uat_advisor
INSERT INTO project_defense_request_approvals
  (request_id, teacher_id, teacher_role, status, created_at, updated_at)
VALUES
  (@thesis_req1_id, @adv_tid, 'advisor', 'pending', NOW(), NOW());

-- ── 5. uat_thesis: THESIS defense request #2 (staff_verified) ──
-- → แสดงใน: /admin/thesis/exam-results (ภาพ 5-55/56/57)
--   (status ต้องเป็น staff_verified, scheduled, หรือ completed ถึงจะขึ้นใน exam-results)
INSERT INTO project_defense_requests
  (project_id, defense_type, status, form_payload,
   submitted_by_student_id, submitted_at,
   advisor_approved_at, staff_verified_at,
   defense_scheduled_at, defense_location,
   submitted_late, created_at, updated_at)
VALUES
  (@thesis_pid, 'THESIS', 'staff_verified',
   '{"requestDate":"2026-03-15","intendedDefenseDate":"2026-04-20","additionalNotes":"UAT thesis defense (ready for exam)"}',
   @thesis_sid, DATE_SUB(NOW(), INTERVAL 10 DAY),
   DATE_SUB(NOW(), INTERVAL 8 DAY),
   DATE_SUB(NOW(), INTERVAL 5 DAY),
   DATE_ADD(NOW(), INTERVAL 15 DAY), 'ห้อง CS-301',
   0, DATE_SUB(NOW(), INTERVAL 10 DAY), NOW());

SET @thesis_req2_id = LAST_INSERT_ID();

-- ── 6. uat_thesis: ProjectTestRequest (pending_advisor) ──
-- → แสดงใน: /teacher/system-test/advisor-queue (ภาพ 5-49)
INSERT INTO project_test_requests
  (project_id, submitted_by_student_id, status, student_note,
   submitted_at, test_start_date, test_due_date,
   advisor_teacher_id, submitted_late, created_at, updated_at)
VALUES
  (@thesis_pid, @thesis_sid, 'pending_advisor',
   'ขอทดสอบระบบปริญญานิพนธ์ UAT — ระบบพร้อมสำหรับตรวจสอบ',
   NOW(),
   DATE_ADD(NOW(), INTERVAL 7 DAY),
   DATE_ADD(NOW(), INTERVAL 21 DAY),
   @adv_tid, 0, NOW(), NOW());

-- ── 7. ตรวจสอบผล ────────────────────────────────────────────
SELECT 'project_defense_requests' AS tbl, request_id, project_id, defense_type, status
FROM project_defense_requests
WHERE project_id IN (@proj_pid, @thesis_pid)
ORDER BY request_id;

SELECT 'project_defense_request_approvals' AS tbl, approval_id, request_id, teacher_id, status
FROM project_defense_request_approvals
WHERE request_id IN (@proj_req_id, @thesis_req1_id)
ORDER BY approval_id;

SELECT 'project_test_requests' AS tbl, request_id, project_id, status, advisor_teacher_id
FROM project_test_requests
WHERE project_id = @thesis_pid;
