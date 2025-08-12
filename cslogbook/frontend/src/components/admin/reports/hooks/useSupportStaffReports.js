// Hook ดึงข้อมูลรายงานสำหรับ Support Staff Dashboard
// แยก concerns: network fetching + state management ออกจาก UI
import { useCallback, useEffect, useState } from 'react';
import { getOverview, getInternshipLogbookCompliance, getProjectStatusSummary, getAdvisorLoad } from '../../../../services/reportService';

export function useSupportStaffReports(initialYear) {
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [logbookCompliance, setLogbookCompliance] = useState(null);
  const [advisorLoad, setAdvisorLoad] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);

  const fetchAll = useCallback(async (targetYear = year) => {
    setLoading(true); setError(null);
    try {
      const [ov, logComp, projStat, advLoad] = await Promise.all([
        getOverview({ year: targetYear }),
        getInternshipLogbookCompliance({ year: targetYear }),
        getProjectStatusSummary({ year: targetYear }),
        getAdvisorLoad({ year: targetYear })
      ]);
      setOverview(ov);
      setLogbookCompliance(logComp);
      setProjectStatus(projStat);
      setAdvisorLoad(advLoad);
    } catch (e) {
      console.error('Fetch reports failed', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { fetchAll(year); }, [year, fetchAll]);

  return {
    year,
    setYear,
    loading,
    error,
    overview,
    logbookCompliance,
    advisorLoad,
    projectStatus,
    refresh: fetchAll
  };
}
