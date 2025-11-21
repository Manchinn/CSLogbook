// Hook ใหม่สำหรับ Dashboard ความคืบหน้าฝึกงานรูปแบบใหม่
// ดึง: สรุปนักศึกษาฝึกงาน, การประเมิน (criteria averages), รายชื่อนักศึกษา
// หมายเหตุ: ใช้ getAllStudents เพื่อดึงรายชื่อทั้งหมดแล้ว map ฟิลด์ที่ต้องใช้ในตาราง
import { useCallback, useEffect, useState } from 'react';
import { getInternshipStudentSummary, getInternshipEvaluationSummary, getEnrolledInternshipStudents } from 'features/reports/services/reportService';

export function useInternshipProgressDashboard(initialYear) {
  const [year, setYear] = useState(initialYear);
  const [semester, setSemester] = useState(); // undefined = รวมทุกภาค
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null); // จาก getInternshipStudentSummary
  const [evaluation, setEvaluation] = useState(null); // จาก getInternshipEvaluationSummary (criteriaAverages, gradeDistribution)
  const [students, setStudents] = useState([]); // รายชื่อ

  const fetchAll = useCallback(async (targetYear = year, targetSemester = semester) => {
    setLoading(true); setError(null);
    try {
      const [sum, evalSum, studentList] = await Promise.all([
        getInternshipStudentSummary({ year: targetYear, semester: targetSemester }),
        getInternshipEvaluationSummary({ year: targetYear, semester: targetSemester }),
        getEnrolledInternshipStudents({ year: targetYear })
      ]);
      setSummary(sum);
      setEvaluation(evalSum);
      // ปกป้องกรณี backend ส่ง null
      setStudents(Array.isArray(studentList) ? studentList : []);
    } catch (e) {
      console.error('Load internship progress dashboard failed', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [year, semester]);

  useEffect(()=>{ fetchAll(year, semester); }, [year, semester, fetchAll]);
  return { year, setYear, semester, setSemester, loading, error, summary, evaluation, students, refresh: fetchAll };
}
