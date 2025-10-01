import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminService } from '../../services/adminService';

const initialStats = {
  students: { total: 0, internshipEligible: 0, projectEligible: 0 },
  documents: { total: 0, pending: 0 },
  system: { onlineUsers: 0, lastUpdate: null }
};

/**
 * Hook สำหรับดึงข้อมูลสถิติใน Dashboard (ใช้ useState/useEffect)
 */
export function useDashboardStats() {
  const [stats, setStats] = useState(initialStats);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const fetchStats = useCallback(async () => {
    setIsStatsLoading(true);
    setStatsError(null);
    try {
      const data = await adminService.getStats();
      setStats(data);
      setLastFetchedAt(new Date().toISOString());
    } catch (err) {
      setStatsError(err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  // ดึงข้อมูลครั้งแรกและตั้ง interval สำหรับรีเฟรชข้อมูลสถิติ
  useEffect(() => {
    fetchStats();

    const statsInterval = setInterval(fetchStats, 1000 * 60 * 3); // 3 นาที

    return () => {
      clearInterval(statsInterval);
    };
  }, [fetchStats]);

  const refetch = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  const isLoading = useMemo(() => isStatsLoading, [isStatsLoading]);

  return {
    stats,
    isLoading,
    isStatsLoading,
    statsError,
    lastFetchedAt,
    refetch,
    refreshStats: fetchStats
  };
}