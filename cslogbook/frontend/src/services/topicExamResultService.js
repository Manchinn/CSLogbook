// Service สำหรับบันทึกผลสอบหัวข้อโครงงาน
// ใช้ endpoint POST /api/projects/:id/exam-result
// เปลี่ยนมาใช้ apiClient กลาง (axios instance) แทน utils/api เดิม
import apiClient from './apiClient';

export async function recordTopicExamResult(projectId, payload) {
  // payload: { result: 'passed', advisorId } หรือ { result: 'failed', reason, advisorId }
  return apiClient.post(`/projects/${projectId}/exam-result`, payload);
}
