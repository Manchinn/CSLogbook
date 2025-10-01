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
  const [activities, setActivities] = useState([]);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);
  const [activitiesError, setActivitiesError] = useState(null);
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

  const fetchActivities = useCallback(async () => {
    setIsActivitiesLoading(true);
    setActivitiesError(null);
    try {
      const data = await adminService.getRecentActivities({ mode: 'documents', limit: 10 });
      setActivities(data);
    } catch (err) {
      setActivitiesError(err);
    } finally {
      setIsActivitiesLoading(false);
    }
  }, []);

  // ดึงข้อมูลครั้งแรกและตั้ง interval สำหรับรีเฟรช (คุมคิวข้อมูลสถิติและกิจกรรมแยกกัน)
  useEffect(() => {
    fetchStats();
    fetchActivities();

    const statsInterval = setInterval(fetchStats, 1000 * 60 * 3); // 3 นาที
    const activitiesInterval = setInterval(fetchActivities, 1000 * 60 * 2); // 2 นาที

    return () => {
      clearInterval(statsInterval);
      clearInterval(activitiesInterval);
    };
  }, [fetchStats, fetchActivities]);

  const refetch = useCallback(() => {
    fetchStats();
    fetchActivities();
  }, [fetchStats, fetchActivities]);

  const isLoading = useMemo(() => isStatsLoading || isActivitiesLoading, [isStatsLoading, isActivitiesLoading]);

  return {
    stats,
    activities,
    isLoading,
    isStatsLoading,
    isActivitiesLoading,
    statsError,
    activitiesError,
    lastFetchedAt,
    refetch,
    refreshStats: fetchStats,
    refreshActivities: fetchActivities
  };
}