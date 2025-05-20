import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../../services/adminService';

/**
 * Hook สำหรับดึงข้อมูลสถิติใน Dashboard (ใช้ useState/useEffect)
 */
export function useDashboardStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminService.getDashboardStats();
      setStats(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error };
}