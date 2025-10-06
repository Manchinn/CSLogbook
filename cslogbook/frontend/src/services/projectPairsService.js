import apiClient from './apiClient';

/**
 * ดึงข้อมูลคู่โปรเจคสำหรับเจ้าหน้าที่
 * @param {Object} params ตัวเลือก query เช่น projectStatus, trackCodes
 * @returns {{success: boolean, total: number, data: Array}}
 */
export const fetchProjectPairs = async (params = {}) => {
  const response = await apiClient.get('/project-members', { params });
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
