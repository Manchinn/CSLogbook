import { useEffect, useState, useCallback } from 'react';
import internshipStatsService from 'features/internship/services/internshipStatsService';

// Hook ดึงข้อมูลสถิติบริษัท + ประเมิน capacity (>=2 เตือน)
export function useCompanyInternshipStats({ academicYear, semester, limit, refreshInterval = 0 }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);

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

  const fetchCompanyDetail = useCallback(async (companyName) => {
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const res = await internshipStatsService.getCompanyDetail(companyName);
      setDetail(res);
      return res; // คืนค่าให้ component ที่เรียกใช้งาน
    } catch (e) {
      setDetailError(e.message || 'ไม่สามารถโหลดรายละเอียดบริษัท');
      throw e; // ให้ caller จัดการ error ได้
    } finally {
      setDetailLoading(false);
    }
  }, []);

  return { data, loading, error, reload: fetchData, detail, detailLoading, detailError, fetchCompanyDetail };
}

export default useCompanyInternshipStats;
