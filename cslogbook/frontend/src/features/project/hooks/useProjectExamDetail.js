import { useState, useEffect, useCallback } from 'react';
import projectService from '../services/projectService';

/**
 * Hook สำหรับจัดการข้อมูลผลสอบโครงงาน
 * @param {Object} activeProject - โครงงานที่กำลังใช้งาน
 */
export function useProjectExamDetail(activeProject) {
  const [examDetail, setExamDetail] = useState(null);
  const [examLoading, setExamLoading] = useState(false);
  const [examError, setExamError] = useState(null);

  const loadExamDetail = useCallback(async () => {
    // ถ้าโครงงานยังไม่ผ่านการสอบหัวข้อ จะไม่ต้องยิง API เพื่อดึงรายละเอียดผลสอบเพิ่มเติม
    if (!activeProject || activeProject.examResult !== 'passed') {
      setExamDetail(null);
      setExamError(null);
      return;
    }

    setExamLoading(true);
    setExamError(null);

    try {
      const res = await projectService.getProjectExamResult(activeProject.projectId, { examType: 'PROJECT1' });
      if (res?.success) {
        setExamDetail(res?.data || null);
        setExamError(null);
      } else {
        setExamDetail(null);
        setExamError(res?.message || 'ไม่สามารถโหลดผลสอบได้');
      }
    } catch (error) {
      setExamDetail(null);
      setExamError(error.message || 'โหลดผลสอบไม่สำเร็จ');
    } finally {
      setExamLoading(false);
    }
  }, [activeProject]);

  useEffect(() => {
    loadExamDetail();
  }, [loadExamDetail]);

  return {
    examDetail,
    examLoading,
    examError,
    refresh: loadExamDetail
  };
}
