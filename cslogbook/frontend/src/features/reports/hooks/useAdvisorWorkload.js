import { useState, useEffect, useCallback } from 'react';
import { getAdvisorWorkload, getAdvisorDetail } from '../services/reportService';

/**
 * Hook สำหรับจัดการข้อมูลภาระงานอาจารย์ที่ปรึกษา
 */
export function useAdvisorWorkload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [advisorData, setAdvisorData] = useState([]);

  // Load Advisor Workload
  const loadAdvisorLoad = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdvisorWorkload();
      console.log('Advisor workload response:', data); // Debug log
      const advisors = data?.advisors || [];
      console.log('First advisor:', advisors[0]); // Debug log
      setAdvisorData(advisors);
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdvisorLoad();
  }, [loadAdvisorLoad]);

  return { 
    advisorData, 
    loading, 
    error, 
    refresh: loadAdvisorLoad 
  };
}

/**
 * Hook สำหรับจัดการรายละเอียดอาจารย์ที่ปรึกษาแต่ละคน
 */
export function useAdvisorDetail() {
  const [detailLoading, setDetailLoading] = useState(false);
  const [advisorDetail, setAdvisorDetail] = useState(null);
  const [detailError, setDetailError] = useState(null);

  // Load Advisor Detail
  const loadAdvisorDetail = useCallback(async (teacherId) => {
    if (!teacherId || isNaN(teacherId)) {
      console.error('Invalid teacherId:', teacherId);
      setDetailError('รหัสอาจารย์ไม่ถูกต้อง');
      return;
    }
    try {
      setDetailLoading(true);
      setDetailError(null);
      const data = await getAdvisorDetail(teacherId);
      setAdvisorDetail(data);
    } catch (err) {
      console.error('Error loading advisor detail:', err);
      setDetailError(err.response?.data?.error || 'ไม่สามารถโหลดรายละเอียดอาจารย์ได้');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const clearDetail = useCallback(() => {
    setAdvisorDetail(null);
    setDetailError(null);
  }, []);

  return {
    advisorDetail,
    detailLoading,
    detailError,
    loadAdvisorDetail,
    clearDetail
  };
}
