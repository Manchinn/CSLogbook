// Hook ดึงข้อมูลรายงานสำหรับ Support Staff Dashboard
// แยก concerns: network fetching + state management ออกจาก UI
import { useCallback, useEffect, useState } from 'react';
import { getOverview, getInternshipLogbookCompliance, getProjectStatusSummary, getAdvisorLoad, getInternshipEvaluationSummary } from '../../../../services/reportService';

export function useSupportStaffReports(initialYear) {
  const [year, setYear] = useState(initialYear);
  const [semester, setSemester] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [logbookCompliance, setLogbookCompliance] = useState(null);
  const [advisorLoad, setAdvisorLoad] = useState(null);
  const [internshipEvaluation, setInternshipEvaluation] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);

  const fetchAll = useCallback(async (targetYear = year, targetSemester = semester) => {
    setLoading(true); setError(null);
    try {
      const [ov, logComp, projStat, advLoad, evalSummary] = await Promise.all([
        getOverview({ year: targetYear }),
        getInternshipLogbookCompliance({ year: targetYear }),
        getProjectStatusSummary({ year: targetYear }),
        getAdvisorLoad({ year: targetYear }),
        getInternshipEvaluationSummary({ year: targetYear, semester: targetSemester })
      ]);
      setOverview(ov);
      setLogbookCompliance(logComp);
      setProjectStatus(projStat);
      setAdvisorLoad(advLoad);
      setInternshipEvaluation(evalSummary);
    } catch (e) {
      console.error('Fetch reports failed', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [year, semester]);

  useEffect(() => { fetchAll(year, semester); }, [year, semester, fetchAll]);

  return {
    year,
  setYear,
  semester,
  setSemester,
    loading,
    error,
    overview,
    logbookCompliance,
    advisorLoad,
    projectStatus,
  internshipEvaluation,
    refresh: fetchAll
  };
}
