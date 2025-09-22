// frontend/src/services/topicExamService.js
// Service เรียก Backend Topic Exam Overview ให้ใช้ apiClient ตามมาตรฐาน repo
// โครงสร้างผลลัพธ์ backend: { success: true, count: number, data: [...] }

import apiClient from './apiClient';

// ฟังก์ชันหลักดึง overview
export async function fetchTopicExamOverview(params = {}) {
  // ถ้า baseURL ไม่ลงท้ายด้วย /api ให้เติม prefix เอง (ป้องกัน config ผิด)
  const url = '/projects/topic-exam/overview';
  const res = await apiClient.get(url, { params });
  return res.data; 
}

// ดาวน์โหลดไฟล์ export (CSV/XLSX) - จะคืนเป็น Blob ให้ผู้เรียกจัดการ save
export async function downloadTopicExamExport(params = {}) {
  const { format = 'csv', ...rest } = params;
  const url = '/projects/topic-exam/export';
  const res = await apiClient.get(url, { params: { format, ...rest }, responseType: 'blob' });
  return res; // caller จะใช้ headers และ data (Blob)
}

