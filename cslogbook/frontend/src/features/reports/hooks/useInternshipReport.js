// Hook สำหรับหน้า InternshipReport
import { useCallback, useEffect, useState } from 'react';
import { getInternshipLogbookCompliance, getOverview, getInternshipStudentSummary } from 'features/reports/services/reportService';

export function useInternshipReport(initialYear) {
  const [year, setYear] = useState(initialYear);
  const [semester, setSemester] = useState(); // undefined = รวมทุกภาค
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logbookCompliance, setLogbookCompliance] = useState(null);
  const [internshipSummary, setInternshipSummary] = useState(null);
  const [overview, setOverview] = useState(null);

  const fetchAll = useCallback(async (targetYear = year, targetSemester = semester) => {
    setLoading(true); setError(null);
    try {
      const [logComp, ov, summary] = await Promise.all([
        getInternshipLogbookCompliance({ year: targetYear, semester: targetSemester }),
        getOverview({ year: targetYear }),
        getInternshipStudentSummary({ year: targetYear, semester: targetSemester })
      ]);
      setLogbookCompliance(logComp);
      setOverview(ov);
      setInternshipSummary(summary);
    } catch (e) {
      console.error('Load internship report failed', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [year, semester]);

  useEffect(()=>{ fetchAll(year, semester); }, [year, semester, fetchAll]);
  return { year, setYear, semester, setSemester, loading, error, logbookCompliance, overview, internshipSummary, refresh: fetchAll };
}
