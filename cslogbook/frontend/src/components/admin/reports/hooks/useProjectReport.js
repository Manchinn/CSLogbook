// Hook สำหรับหน้า ProjectReport
import { useCallback, useEffect, useState } from 'react';
import { getProjectStatusSummary, getAdvisorLoad, getOverview } from '../../../../services/reportService';

export function useProjectReport(initialYear) {
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);
  const [advisorLoad, setAdvisorLoad] = useState(null);
  const [overview, setOverview] = useState(null);

  const fetchAll = useCallback(async (targetYear = year) => {
    setLoading(true); setError(null);
    try {
      const [projStatus, advLoad, ov] = await Promise.all([
        getProjectStatusSummary({ year: targetYear }),
        getAdvisorLoad({ year: targetYear }),
        getOverview({ year: targetYear })
      ]);
      setProjectStatus(projStatus);
      // เก็บเฉพาะ advisors array (ไม่เก็บ academicYear)
      setAdvisorLoad(advLoad?.advisors || []);
      setOverview(ov);
    } catch (e) {
      console.error('Load project report failed', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(()=>{ fetchAll(year); }, [year, fetchAll]);

  return { year, setYear, loading, error, projectStatus, advisorLoad, overview, refresh: fetchAll };
}
