import apiClient from 'services/apiClient';

/**
 * ดึงข้อมูลคู่โปรเจคสำหรับเจ้าหน้าที่
 * @param {Object} params ตัวเลือก query เช่น projectStatus, trackCodes, academicYear, semester
 * @returns {{success: boolean, total: number, data: Array}}
 */
export const fetchProjectPairs = async (params = {}) => {
  // กรองและจัดการ parameters ก่อนส่งไป backend
  const cleanParams = {};
  
  // เพิ่ม parameters ที่มีอยู่แล้ว
  if (params.projectStatus) cleanParams.projectStatus = params.projectStatus;
  if (params.documentStatus) cleanParams.documentStatus = params.documentStatus;
  if (params.trackCodes) cleanParams.trackCodes = params.trackCodes;
  if (params.projectType) cleanParams.projectType = params.projectType;
  
  // เพิ่ม parameters ใหม่สำหรับ filter ปีการศึกษาและภาคการศึกษา
  if (params.academicYear) cleanParams.academicYear = params.academicYear;
  if (params.semester) cleanParams.semester = params.semester;

  const response = await apiClient.get('/project-members', { params: cleanParams });
  const payload = response?.data;

  // รองรับทั้ง response รูปแบบเก่า (array ตรง ๆ) และรูปแบบใหม่ { success, total, data }
  if (Array.isArray(payload)) {
    return {
      success: true,
      total: payload.length,
      data: payload,
    };
  }

  return {
    success: Boolean(payload?.success),
    total: Number.isInteger(payload?.total) ? payload.total : Array.isArray(payload?.data) ? payload.data.length : 0,
    data: Array.isArray(payload?.data) ? payload.data : [],
  };
};

const projectPairsService = {
  fetchProjectPairs,
};

export default projectPairsService;
