import apiClient from './apiClient';

/**
 * Service: ProjectExamResultService
 * จัดการ API สำหรับผลการสอบโครงงานพิเศษ (PROJECT1 และ THESIS)
 */
class ProjectExamResultService {
  /**
   * ดึงรายการโครงงานที่พร้อมบันทึกผลสอบ PROJECT1
   */
  async getProject1PendingResults(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
  if (filters.semester) params.append('semester', filters.semester);
  if (filters.search) params.append('search', filters.search.trim());

      const response = await apiClient.get(
        `/projects/exam-results/project1/pending${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching project1 pending results:', error);
      throw error;
    }
  }

  /**
   * บันทึกผลสอบโครงงานพิเศษ
   */
  async recordExamResult(projectId, examData) {
    try {
      const response = await apiClient.post(`/projects/${projectId}/exam-result`, examData);
      return response.data;
    } catch (error) {
      console.error('Error recording exam result:', error);
      throw error;
    }
  }

  /**
   * ดึงผลสอบของโครงงาน
   */
  async getExamResult(projectId, examType = 'PROJECT1') {
    try {
      const response = await apiClient.get(`/projects/${projectId}/exam-result`, {
        params: { examType }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching exam result:', error);
      throw error;
    }
  }

  /**
   * นักศึกษารับทราบผลสอบ (กรณีไม่ผ่าน)
   */
  async acknowledgeExamResult(projectId, examType = 'PROJECT1') {
    try {
      const response = await apiClient.patch(`/projects/${projectId}/exam-result/acknowledge`, {
        examType
      });
      return response.data;
    } catch (error) {
      console.error('Error acknowledging exam result:', error);
      throw error;
    }
  }

  /**
   * ดึงสถิติผลสอบ
   */
  async getExamStatistics(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.semester) params.append('semester', filters.semester);
      if (filters.examType) params.append('examType', filters.examType);

      const response = await apiClient.get(
        `/projects/exam-results/statistics${params.toString() ? `?${params.toString()}` : ''}`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching exam statistics:', error);
      throw error;
    }
  }
}

const projectExamResultService = new ProjectExamResultService();
export default projectExamResultService;
