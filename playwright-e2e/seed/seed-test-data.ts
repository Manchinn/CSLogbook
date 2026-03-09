/**
 * Seed test data สำหรับ E2E workflow tests
 *
 * Usage: npm run seed (หรือ npx tsx seed/seed-test-data.ts)
 *
 * Pipeline (7 steps):
 * 1. Login 3 roles
 * 2. Ensure student project exists
 * 3. Create 4+ meetings + logs
 * 4. Advisor approve logs (เว้น 1 pending สำหรับ approval test)
 * 5. Submit KP02 defense → advisor approve → officer verify
 * 6. Record exam result PASS → unlock thesis tab
 * 7. Check internship eligibility (info only)
 */
import dotenv from 'dotenv';
import { SEED_DATA } from './seed-config';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000/api';

// ─── Helpers ────────────────────────────────────────────────────────

async function login(username: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${username}: ${res.status}`);
  }
  const data = await res.json();
  // Login response: { success, token, userId, ... } — token อยู่ top level
  return data.token || data.data?.token;
}

function authHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}

async function apiGet(path: string, token: string) {
  const res = await fetch(`${API_URL}${path}`, { headers: authHeaders(token) });
  if (!res.ok) return null;
  return res.json();
}

async function apiPost(path: string, token: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

async function apiPut(path: string, token: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

async function apiPatch(path: string, token: string, body: Record<string, unknown>) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PATCH',
    headers: authHeaders(token),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { ok: res.ok, status: res.status, data };
}

// ─── Step 2: Ensure Project ─────────────────────────────────────────

async function ensureProject(
  studentToken: string,
  officerToken: string,
): Promise<number | null> {
  // ตรวจว่ามี project อยู่แล้วหรือไม่
  const myProjects = await apiGet('/projects/mine', studentToken);
  if (myProjects?.data?.length > 0) {
    // filter เฉพาะ active projects (ไม่ใช่ archived/cancelled)
    const activeProject = myProjects.data.find(
      (p: any) => !['archived', 'cancelled'].includes(p.status),
    );
    if (activeProject) {
      const name = activeProject.projectNameTh || activeProject.project_name_th;
      const id = activeProject.projectId || activeProject.id;
      console.log(`  ✓ Project exists: #${id} — ${name} (status: ${activeProject.status})`);
      return id;
    }
  }

  // ลองสร้างด้วย student token ก่อน
  const result = await apiPost('/projects', studentToken, {
    projectNameTh: SEED_DATA.testProject.title,
    projectNameEn: SEED_DATA.testProject.titleEn,
  });

  if (result.ok) {
    const projectId = result.data?.data?.id || result.data?.id;
    console.log(`  ✓ Created project #${projectId}`);
    return projectId;
  }

  // ถ้า deadline ปิด → ใช้ admin endpoint bypass
  console.log(`  ℹ Student create failed (${result.data?.message || result.status}) — trying admin endpoint...`);

  // ดึง student info จาก JWT
  const tokenPayload = JSON.parse(atob(studentToken.split('.')[1]));
  const studentCode = tokenPayload.studentCode;

  const adminResult = await apiPost('/admin/projects/manual', officerToken, {
    studentCode,
    projectNameTh: SEED_DATA.testProject.title,
    projectNameEn: SEED_DATA.testProject.titleEn,
  });

  if (adminResult.ok) {
    const projectId =
      adminResult.data?.data?.projectId ||
      adminResult.data?.data?.id ||
      adminResult.data?.id;
    console.log(`  ✓ Created project #${projectId} (via admin)`);
    return projectId;
  }

  console.log(`  ⚠ Cannot create project: ${adminResult.status} — ${adminResult.data?.message || ''}`);
  console.log(`    Tests will adapt via skip()`);
  return null;
}

// ─── Step 2b: Ensure Advisor Assigned ────────────────────────────────

async function ensureAdvisor(
  projectId: number,
  advisorUserId: number,
  officerToken: string,
  studentToken: string,
) {
  // ตรวจว่ามี advisor อยู่แล้วหรือไม่
  const myProjects = await apiGet('/projects/mine', studentToken);
  const project = myProjects?.data?.find(
    (p: any) => (p.projectId || p.id) === projectId,
  );

  if (project?.advisorId) {
    console.log(`  ✓ Advisor already assigned: ${project.advisorName || project.advisorId}`);
    return;
  }

  // ใช้ admin endpoint assign advisor
  const result = await apiPut(`/admin/projects/${projectId}`, officerToken, {
    advisorId: advisorUserId,
  });

  if (result.ok) {
    console.log(`  ✓ Assigned advisor (userId: ${advisorUserId}) to project #${projectId}`);
  } else {
    console.log(`  ⚠ Failed to assign advisor: ${result.status} — ${result.data?.message || ''}`);
  }
}

// ─── Step 3: Create Meetings + Logs ─────────────────────────────────

interface MeetingInfo {
  meetingId: number;
  logs: Array<{ logId: number; approvalStatus: string }>;
}

async function ensureMeetingsAndLogs(
  projectId: number,
  studentToken: string,
): Promise<MeetingInfo[]> {
  // ดึง meetings ที่มีอยู่
  const existing = await apiGet(`/projects/${projectId}/meetings`, studentToken);
  const existingMeetings: MeetingInfo[] = (existing?.data || []).map((m: any) => ({
    meetingId: m.meetingId || m.meeting_id || m.id,
    logs: (m.logs || []).map((l: any) => ({
      logId: l.logId || l.log_id || l.id,
      approvalStatus: l.approvalStatus || l.approval_status || 'pending',
    })),
  }));

  if (existingMeetings.length >= 5) {
    console.log(`  ✓ Meetings already seeded (${existingMeetings.length} records)`);
    return existingMeetings;
  }

  // สร้าง meetings + logs ที่ยังขาด (4 ตัวหลัก + 1 pending สำหรับ approval test)
  const allMeetingData = [...SEED_DATA.meetings, SEED_DATA.pendingMeetingLog];
  const toCreate = allMeetingData.slice(existingMeetings.length);

  for (const record of toCreate) {
    const meetingResult = await apiPost(`/projects/${projectId}/meetings`, studentToken, {
      meetingTitle: record.title,
      meetingDate: record.date,
      meetingMethod: 'onsite',
    });

    if (!meetingResult.ok) {
      console.log(`  ⚠ Failed to create meeting "${record.title}": ${meetingResult.status}`);
      continue;
    }

    const meetingId =
      meetingResult.data?.data?.meetingId ||
      meetingResult.data?.data?.meeting_id ||
      meetingResult.data?.data?.id ||
      meetingResult.data?.id;
    console.log(`  ✓ Created meeting #${meetingId}: ${record.title}`);

    // สร้าง log สำหรับ meeting นี้
    const logResult = await apiPost(
      `/projects/${projectId}/meetings/${meetingId}/logs`,
      studentToken,
      record.log,
    );

    if (logResult.ok) {
      const logId =
        logResult.data?.data?.logId ||
        logResult.data?.data?.log_id ||
        logResult.data?.data?.id ||
        logResult.data?.id;
      console.log(`  ✓ Created log #${logId} for meeting #${meetingId}`);
      existingMeetings.push({
        meetingId,
        logs: [{ logId, approvalStatus: 'pending' }],
      });
    } else {
      console.log(`  ⚠ Failed to create log for meeting #${meetingId}: ${logResult.status}`);
      existingMeetings.push({ meetingId, logs: [] });
    }
  }

  return existingMeetings;
}

// ─── Step 4: Approve Meeting Logs ───────────────────────────────────

async function approveMeetingLogs(
  projectId: number,
  studentToken: string,
  advisorToken: string,
) {
  // ดึง meetings ด้วย student token (advisor อาจถูก block โดย eligibility middleware)
  const freshData = await apiGet(`/projects/${projectId}/meetings`, studentToken);
  const freshMeetings: any[] = freshData?.data || [];

  let approvedCount = 0;
  let pendingCount = 0;

  for (const meeting of freshMeetings) {
    const meetingId = meeting.meetingId || meeting.meeting_id || meeting.id;
    const logs: any[] = meeting.logs || [];

    for (const log of logs) {
      const logId = log.logId || log.log_id || log.id;
      const status = log.approvalStatus || log.approval_status;

      if (status === 'approved') {
        approvedCount++;
        continue;
      }

      // เว้น log ของ meeting สุดท้าย (pendingMeetingLog) ไว้เป็น pending
      // สำหรับ meeting-approvals test
      if (approvedCount >= 4) {
        pendingCount++;
        continue;
      }

      const result = await apiPatch(
        `/projects/${projectId}/meetings/${meetingId}/logs/${logId}/approval`,
        advisorToken,
        { status: 'approved', approvalNote: 'E2E seed auto-approve' },
      );

      if (result.ok) {
        approvedCount++;
        console.log(`  ✓ Approved log #${logId} (meeting #${meetingId})`);
      } else {
        console.log(`  ⚠ Failed to approve log #${logId}: ${result.status}`);
        pendingCount++;
      }
    }
  }

  console.log(`  Summary: ${approvedCount} approved, ${pendingCount} pending`);
  return approvedCount;
}

// ─── Step 4b: Ensure Student Contact Info ───────────────────────────

async function ensureStudentContact(studentToken: string) {
  const payload = JSON.parse(atob(studentToken.split('.')[1]));
  const studentCode = payload.studentCode;

  const result = await apiPut(`/students/${studentCode}/contact-info`, studentToken, {
    phoneNumber: '0812345678',
  });

  if (result.ok) {
    console.log(`  ✓ Student contact info updated`);
  } else {
    console.log(`  ⚠ Failed to update contact: ${result.status}`);
  }
}

// ─── Step 5: KP02 Defense Flow ──────────────────────────────────────

async function seedKP02Flow(
  projectId: number,
  studentToken: string,
  advisorToken: string,
  officerToken: string,
): Promise<boolean> {
  // ตรวจว่ามี KP02 อยู่แล้วหรือไม่
  const existing = await apiGet(`/projects/${projectId}/kp02`, studentToken);
  if (existing?.data) {
    const status = existing.data.status || existing.data.requestStatus || 'unknown';
    console.log(`  ✓ KP02 already exists (status: ${status})`);
    // ถ้า verified แล้ว → ถือว่าสำเร็จ
    return ['verified', 'scheduled', 'completed'].includes(status);
  }

  // 5a. Student submit KP02 — ต้องส่ง students array + requestDate
  const studentPayload = JSON.parse(atob(studentToken.split('.')[1]));
  const submitResult = await apiPost(`/projects/${projectId}/kp02`, studentToken, {
    defenseType: 'PROJECT1',
    requestDate: new Date().toISOString().slice(0, 10),
    students: [
      {
        studentId: studentPayload.studentId,
        phone: '0812345678',
        email: studentPayload.email || 'student1@test.com',
      },
    ],
  });

  if (!submitResult.ok) {
    console.log(`  ⚠ Cannot submit KP02: ${submitResult.status} — ${submitResult.data?.message || ''}`);
    return false;
  }
  console.log(`  ✓ Submitted KP02 defense request`);

  // 5b. Advisor approve
  const approveResult = await apiPost(
    `/projects/${projectId}/kp02/advisor-approve`,
    advisorToken,
    { decision: 'approved', note: 'E2E seed — advisor approved' },
  );

  if (!approveResult.ok) {
    console.log(`  ⚠ Advisor approve failed: ${approveResult.status} — ${approveResult.data?.message || ''}`);
    return false;
  }
  console.log(`  ✓ Advisor approved KP02`);

  // 5c. Officer verify
  const verifyResult = await apiPost(
    `/projects/${projectId}/kp02/verify`,
    officerToken,
    { note: 'E2E seed — officer verified' },
  );

  if (!verifyResult.ok) {
    console.log(`  ⚠ Officer verify failed: ${verifyResult.status} — ${verifyResult.data?.message || ''}`);
    return false;
  }
  console.log(`  ✓ Officer verified KP02`);

  return true;
}

// ─── Step 6: Record Exam Result ─────────────────────────────────────

async function recordExamResult(projectId: number, officerToken: string): Promise<boolean> {
  // ตรวจว่ามีผลสอบอยู่แล้วหรือไม่
  const existing = await apiGet(
    `/projects/${projectId}/exam-result?examType=PROJECT1`,
    officerToken,
  );
  if (existing?.data?.result) {
    console.log(`  ✓ Exam result already exists: ${existing.data.result}`);
    return existing.data.result === 'PASS' || existing.data.result === 'passed';
  }

  // ใช้ endpoint สำหรับ topic exam result (โครงงานพิเศษ 1)
  const result = await apiPost(`/projects/${projectId}/topic-exam-result`, officerToken, {
    result: 'passed',
  });

  if (result.ok) {
    console.log(`  ✓ Recorded exam result: PASS`);
    return true;
  }

  // ลอง endpoint อีกตัว
  const result2 = await apiPost(`/projects/${projectId}/exam-result`, officerToken, {
    examType: 'PROJECT1',
    result: 'PASS',
  });

  if (result2.ok) {
    console.log(`  ✓ Recorded exam result: PASS (via exam-result endpoint)`);
    return true;
  }

  console.log(`  ⚠ Failed to record exam result: ${result2.status} — ${result2.data?.message || ''}`);
  return false;
}

// ─── Step 7: Check Internship ───────────────────────────────────────

async function checkInternshipEligibility(studentToken: string) {
  const internship = await apiGet('/internship/summary', studentToken);
  if (internship?.data) {
    console.log(`  ✓ Internship record exists (status: ${internship.data.status || 'unknown'})`);
    return;
  }
  console.log(`  ℹ No internship record — internship-flow tests will start from CS05 submission`);
}

// ─── Main ───────────────────────────────────────────────────────────

async function seedTestData() {
  console.log('═══ E2E Test Data Seeder ═══\n');

  // Step 1: Health check + login all roles
  const healthRes = await fetch(`${API_URL}/health`);
  if (!healthRes.ok) {
    throw new Error('Backend health check failed — is the server running?');
  }
  console.log('✓ Backend healthy\n');

  console.log('Step 1: Login test accounts...');
  const studentToken = await login(
    process.env.STUDENT_USERNAME || 'student1',
    process.env.STUDENT_PASSWORD || 'studentOne',
  );
  console.log('  ✓ Student login OK');

  const advisorToken = await login(
    process.env.ADVISOR_USERNAME || 'teacher_dev',
    process.env.ADVISOR_PASSWORD || 'password123',
  );
  console.log('  ✓ Advisor login OK');

  const officerToken = await login(
    process.env.OFFICER_USERNAME || 'staff_dev',
    process.env.OFFICER_PASSWORD || 'password123',
  );
  console.log('  ✓ Officer login OK\n');

  // Step 2: Ensure project
  console.log('Step 2: Ensure project...');
  const projectId = await ensureProject(studentToken, officerToken);

  if (!projectId) {
    console.log('\n⚠ No project — skipping steps 3-6');
    console.log('\nStep 7: Check internship...');
    await checkInternshipEligibility(studentToken);
    console.log('\n═══ Seed complete (partial — no project) ═══');
    return;
  }

  // Step 2b: Ensure advisor assigned (ใช้ teacherId ไม่ใช่ userId)
  const advisorPayload = JSON.parse(atob(advisorToken.split('.')[1]));
  await ensureAdvisor(projectId, advisorPayload.teacherId, officerToken, studentToken);

  // Step 3: Create meetings + logs
  console.log('\nStep 3: Create meetings + logs...');
  const meetings = await ensureMeetingsAndLogs(projectId, studentToken);

  // Step 4: Approve meeting logs (เว้น 1 pending)
  console.log('\nStep 4: Approve meeting logs...');
  const approvedCount = await approveMeetingLogs(projectId, studentToken, advisorToken);

  // Step 4b: Ensure student contact info (required for KP02)
  await ensureStudentContact(studentToken);

  // Step 5: KP02 defense flow (ต้อง ≥4 approved meetings)
  let kp02Verified = false;
  if (approvedCount >= 4) {
    console.log('\nStep 5: KP02 defense flow...');
    kp02Verified = await seedKP02Flow(projectId, studentToken, advisorToken, officerToken);
  } else {
    console.log(`\nStep 5: Skip KP02 — only ${approvedCount}/4 approved meetings`);
  }

  // Step 6: Record exam result (ต้อง KP02 verified)
  if (kp02Verified) {
    console.log('\nStep 6: Record exam result...');
    await recordExamResult(projectId, officerToken);
  } else {
    console.log('\nStep 6: Skip exam result — KP02 not verified');
  }

  // Step 7: Check internship
  console.log('\nStep 7: Check internship...');
  await checkInternshipEligibility(studentToken);

  // Summary
  console.log('\n═══ Seed Summary ═══');
  console.log(`  Project: #${projectId}`);
  console.log(`  Meetings: ${meetings.length} (${approvedCount} approved logs)`);
  console.log(`  KP02: ${kp02Verified ? 'verified ✓' : 'not ready'}`);
  console.log(`  Thesis unlock: ${kp02Verified ? 'ready ✓' : 'blocked (need KP02 + exam PASS)'}`);
  console.log('\nNote: Tests use conditional skip() — partial seed is OK');
}

seedTestData().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
