// Service สำหรับบันทึกผลสอบหัวข้อโครงงาน
// ใช้ endpoint POST /api/projects/:id/exam-result
// เปลี่ยนมาใช้ apiClient กลาง (axios instance) แทน utils/api เดิม
import apiClient from './apiClient';

function normalizeResult(rawResult) {
  const value = typeof rawResult === 'string' ? rawResult.trim().toLowerCase() : '';
  if (['pass', 'passed', 'p'].includes(value)) return 'PASS';
  if (['fail', 'failed', 'f'].includes(value)) return 'FAIL';
  throw new Error('ผลสอบต้องเป็น passed หรือ failed');
}

function normalizeExamType(rawType) {
  const value = typeof rawType === 'string' ? rawType.trim().toUpperCase() : '';
  if (!value) return 'PROJECT1';
  if (['PROJECT1', 'THESIS'].includes(value)) return value;
  throw new Error('ประเภทการสอบไม่ถูกต้อง');
}

export async function recordTopicExamResult(projectId, payload = {}) {
  const examType = normalizeExamType(payload.examType);
  const result = normalizeResult(payload.result ?? payload.examResult);

  const requestBody = {
    examType,
    result,
    requireScopeRevision: result === 'PASS' ? Boolean(payload.requireScopeRevision) : false
  };

  if (payload.score !== undefined && payload.score !== null && payload.score !== '') {
    const numericScore = Number(payload.score);
    if (!Number.isNaN(numericScore)) {
      requestBody.score = numericScore;
    }
  }

  const noteSource = result === 'FAIL'
    ? (payload.reason ?? payload.notes)
    : payload.notes;

  if (typeof noteSource === 'string' && noteSource.trim()) {
    requestBody.notes = noteSource.trim();
  }

  return apiClient.post(`/projects/${projectId}/exam-result`, requestBody);
}
