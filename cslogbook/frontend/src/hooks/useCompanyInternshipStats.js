import { useEffect, useState, useCallback } from 'react';
import internshipStatsService from '../services/internshipStatsService';

// Hook ดึงข้อมูลสถิติบริษัท + ประเมิน capacity (>=2 เตือน)
export function useCompanyInternshipStats({ academicYear, semester, limit, refreshInterval = 0 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await internshipStatsService.getCompanyStats({ academicYear, semester, limit });
      // enrich เพิ่ม capacityStatus
      const rows = (res.rows || []).map(r => ({
        ...r,
        capacityUsed: Number(r.totalStudents),
        capacityLimit: 2, // rule ปัจจุบัน
        capacityStatus: Number(r.totalStudents) >= 2 ? 'full' : 'available'
      }));
      setData({ ...res, rows });
    } catch (e) {
      setError(e.message || 'ไม่สามารถดึงข้อมูลสถิติ');
    } finally {
      setLoading(false);
    }
  }, [academicYear, semester, limit]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!refreshInterval) return;
    const id = setInterval(fetchData, refreshInterval);
    return () => clearInterval(id);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, reload: fetchData };
}

export default useCompanyInternshipStats;
