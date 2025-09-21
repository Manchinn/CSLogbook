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

