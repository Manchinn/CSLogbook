// Service สำหรับบันทึกผลสอบหัวข้อโครงงานพิเศษ (สอบเสนอหัวข้อ / KP02)
// ใช้ endpoint POST /api/projects/:id/topic-exam-result
// เปลี่ยนมาใช้ apiClient กลาง (axios instance) แทน utils/api เดิม
import apiClient from './apiClient';

function normalizeResult(rawResult) {
  const value = typeof rawResult === 'string' ? rawResult.trim().toLowerCase() : '';
  if (['pass', 'passed', 'p'].includes(value)) return 'passed';
  if (['fail', 'failed', 'f'].includes(value)) return 'failed';
  throw new Error('ผลสอบต้องเป็น passed หรือ failed');
}

function normalizeAdvisorId(rawAdvisorId) {
  if (rawAdvisorId === undefined || rawAdvisorId === null || rawAdvisorId === '') {
    return undefined;
  }
  const numeric = Number(rawAdvisorId);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    throw new Error('advisorId ต้องเป็นเลขจำนวนเต็มบวก');
  }
  return numeric;
}

export async function recordTopicExamResult(projectId, payload = {}, isEdit = false) {
  const result = normalizeResult(payload.result ?? payload.examResult);
  const advisorId = normalizeAdvisorId(payload.advisorId ?? payload.selectedAdvisorId);
  
  // coAdvisorId: ถ้าเป็น null ตรงๆ (ต้องการลบ) ให้ส่ง null, ถ้าเป็น undefined/empty ให้ normalize, ถ้าเป็น number ให้ส่งไป
  let coAdvisorId;
  if (payload.coAdvisorId === null) {
    // กรณีต้องการลบ co-advisor (ส่ง null ตรงๆ)
    coAdvisorId = null;
  } else if (payload.coAdvisorId !== undefined && payload.coAdvisorId !== '') {
    // กรณีเลือก co-advisor
    coAdvisorId = normalizeAdvisorId(payload.coAdvisorId ?? payload.selectedCoAdvisorId);
  }
  // ถ้าเป็น undefined/empty -> ไม่ส่ง coAdvisorId ใน requestBody

  const requestBody = { result };

  if (advisorId !== undefined) {
    requestBody.advisorId = advisorId;
  }

  // coAdvisorId: ถ้าเป็น undefined = ไม่ส่ง, ถ้าเป็น null = ส่ง null (ลบ), ถ้าเป็น number = ส่ง number (ตั้งค่า)
  if (coAdvisorId !== undefined) {
    requestBody.coAdvisorId = coAdvisorId;
  }

  if (isEdit) {
    requestBody.allowOverwrite = true; // ส่ง allowOverwrite เมื่อเป็นการแก้ไข
  }

  if (result === 'failed') {
    const reasonSource = typeof payload.reason === 'string' ? payload.reason : payload.notes;
    const reason = typeof reasonSource === 'string' ? reasonSource.trim() : '';
    if (reason) {
      requestBody.reason = reason;
    }
  }

  return apiClient.post(`/projects/${projectId}/topic-exam-result`, requestBody);
}
