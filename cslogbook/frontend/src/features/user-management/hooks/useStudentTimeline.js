import { useState, useEffect, useCallback } from 'react';
import { timelineService } from 'services/timelineService';
import { DEFAULT_STUDENT_DATA, DEFAULT_PROGRESS_DATA } from '../components/StudentProfile/StudentTimeline/helpers';

/**
 * Hook สำหรับจัดการข้อมูล timeline ของนักศึกษา
 * @param {string|number} studentId - รหัสนักศึกษา
 */
export function useStudentTimeline(studentId) {
  const [student, setStudent] = useState(DEFAULT_STUDENT_DATA);
  const [progress, setProgress] = useState(DEFAULT_PROGRESS_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStudentSearchModal, setShowStudentSearchModal] = useState(false);

  // ฟังก์ชันค้นหานักศึกษาด้วยรหัส
  const searchStudent = useCallback(async (searchStudentId) => {
    if (!searchStudentId || searchStudentId.trim().length === 0) {
      return { success: false, message: 'กรุณากรอกรหัสนักศึกษา' };
    }

    try {
      setLoading(true);
      setError(null);

      const response = await timelineService.getStudentTimeline(searchStudentId.trim());
      
      if (response && response.success) {
        if (response.data && response.data.student) {
          // บันทึก studentId จริงลงใน localStorage
          if (response.data.student.studentId) {
            localStorage.setItem("studentId", response.data.student.studentId);
          } else if (response.data.student.id) {
            localStorage.setItem("studentId", response.data.student.id);
          }

          setStudent((prev) => ({
            ...prev,
            ...response.data.student,
          }));

          if (response.data && response.data.progress) {
            setProgress(response.data.progress);
          }

          setShowStudentSearchModal(false);
          return { success: true, data: response.data };
        }
      } else {
        const errorMsg = response?.message || 'ไม่พบข้อมูลนักศึกษา';
        setError(errorMsg);
        return { success: false, message: errorMsg };
      }
    } catch (error) {
      console.error('Error searching student:', error);
      const errorMsg = error.message || 'เกิดข้อผิดพลาดในการค้นหา';
      setError(errorMsg);
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, [setShowStudentSearchModal]);

  // ฟังก์ชันดึงข้อมูล timeline
  const fetchTimelineData = useCallback(async () => {
    if (!studentId) {
      setError('ไม่พบรหัสนักศึกษา');
      setLoading(false);
      setShowStudentSearchModal(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log("=== TIMELINE DATA ===");
      console.log("Fetching timeline for student:", studentId);

      const response = await timelineService.getStudentTimeline(studentId);
      console.log("API Response:", response);

      if (response && response.success) {
        if (response.data && response.data.student) {
          // บันทึก studentId จริงลงใน localStorage เพื่อใช้ต่อไป
          if (response.data.student.studentId) {
            localStorage.setItem("studentId", response.data.student.studentId);
          } else if (response.data.student.id) {
            localStorage.setItem("studentId", response.data.student.id);
          }

          setStudent((prev) => ({
            ...prev,
            ...response.data.student,
          }));
        }

        if (response.data && response.data.progress) {
          setProgress(response.data.progress);
        }
      } else {
        setError(response?.message || "ไม่สามารถโหลดข้อมูล timeline ได้");
        console.log("API response error:", response?.message);

        // เมื่อไม่พบข้อมูลนักศึกษา แสดง modal ค้นหา
        if (response?.message?.includes("ไม่พบนักศึกษา") ||
          response?.message?.includes("Student not found")) {
          setShowStudentSearchModal(true);
        }
      }
    } catch (error) {
      console.error("Error fetching timeline data:", error);
      setError(error.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    fetchTimelineData();
  }, [fetchTimelineData]);

  return {
    student,
    progress,
    loading,
    error,
    showStudentSearchModal,
    setShowStudentSearchModal,
    searchStudent,
    refresh: fetchTimelineData
  };
}
