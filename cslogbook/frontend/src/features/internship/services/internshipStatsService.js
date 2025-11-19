import apiClient from 'services/apiClient';

// Service สำหรับดึงสถิติบริษัทที่รับนักศึกษาฝึกงาน (CS05 approved)
const internshipStatsService = {
  async getCompanyStats({ academicYear, semester, limit } = {}) {
    const params = {};
    if (academicYear) params.academicYear = academicYear;
    if (semester) params.semester = semester;
    if (limit) params.limit = limit;

    const res = await apiClient.get('/internship/company-stats', { params });
    return res.data; // success, meta, rows
  },
  async getCompanyDetail(companyName) {
    const res = await apiClient.get(`/internship/company-stats/${encodeURIComponent(companyName)}/detail`);
    if (!res.data.success) throw new Error(res.data.message || 'โหลดรายละเอียดล้มเหลว');
    return res.data;
  }
};

export default internshipStatsService;
