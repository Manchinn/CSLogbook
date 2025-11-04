// Hook สำหรับหน้า ProjectReport
import { useCallback, useEffect, useState } from 'react';
import { getAdministrativeReport, getExamTrends } from '../../../../services/projectReportService';

export function useProjectReport(initialYear) {
  const [year, setYear] = useState(initialYear);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [examTrends, setExamTrends] = useState(null);

  const fetchAll = useCallback(async (targetYear = year) => {
    setLoading(true); 
    setError(null);
    try {
      // ดึงรายงานครบถ้วนจาก endpoint ใหม่
      const report = await getAdministrativeReport({ academicYear: targetYear });
      setReportData(report);

      // ดึงแนวโน้มการสอบ 3 ปีย้อนหลัง
      const trends = await getExamTrends({ 
        startYear: targetYear - 2, 
        endYear: targetYear 
      });
      setExamTrends(trends);
    } catch (e) {
      console.error('Load project report failed', e);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [year]);

  useEffect(() => { 
    fetchAll(year); 
  }, [year, fetchAll]);

  return { 
    year, 
    setYear, 
    loading, 
    error, 
    reportData,
    examTrends,
    refresh: fetchAll 
  };
}
