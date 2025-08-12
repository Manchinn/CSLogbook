// Hook สำหรับหน้า InternshipReport
import { useCallback, useEffect, useState } from 'react';
import { getInternshipLogbookCompliance, getOverview, getInternshipStudentSummary } from '../../../../services/reportService';

export function useInternshipReport(initialYear) {
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [logbookCompliance, setLogbookCompliance] = useState(null);
  const [internshipSummary, setInternshipSummary] = useState(null);
  const [overview, setOverview] = useState(null);

  const fetchAll = useCallback(async (targetYear = year) => {
    setLoading(true); setError(null);
    try {
      const [logComp, ov, summary] = await Promise.all([
        getInternshipLogbookCompliance({ year: targetYear }),
        getOverview({ year: targetYear }),
        getInternshipStudentSummary({ year: targetYear })
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
  }, [year]);

  useEffect(()=>{ fetchAll(year); }, [year, fetchAll]);

  return { year, setYear, loading, error, logbookCompliance, overview, internshipSummary, refresh: fetchAll };
}
