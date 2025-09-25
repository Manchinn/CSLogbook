import apiClient from '../apiClient';

// NOTE: backend mount ที่ '/api/students' ไม่ใช่ '/api/student'
// ดึง deadlines ทั้งหมดสำหรับ student (อาจส่ง academicYear เพื่อกรองได้)
export const getStudentDeadlines = (params) =>
  apiClient.get('/students/important-deadlines', { params });

// ดึง deadline ที่จะถึงภายใน X วัน (default days=7)
export const getUpcomingStudentDeadlines = (params) =>
  apiClient.get('/students/important-deadlines/upcoming', { params });

const importantDeadlineStudentService = {
  getStudentDeadlines,
  getUpcomingStudentDeadlines,
};

export default importantDeadlineStudentService;
