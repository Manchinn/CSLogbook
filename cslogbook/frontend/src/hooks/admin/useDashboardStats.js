import { useState, useEffect, useCallback } from 'react';
import { adminService } from '../../services/adminService';

/**
 * Hook สำหรับดึงข้อมูลสถิติใน Dashboard (ใช้ useState/useEffect)
 */
export function useDashboardStats() {
  const [stats, setStats] = useState({
    students: { total: 0, internshipEligible: 0, projectEligible: 0 },
    documents: { total: 0, pending: 0 },
    system: { onlineUsers: 0, lastUpdate: null }
  });
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (err) {
      setIsError(true);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchActivities = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      const data = await adminService.getRecentActivities();
      setActivities(data);
    } catch (err) {
      setIsError(true);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ดึงข้อมูลครั้งแรกและตั้ง interval สำหรับรีเฟรช
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

  const refetch = () => {
    fetchStats();
    fetchActivities();
  };

  return {
    stats,
    activities,
    isLoading,
    isError,
    error,
    refetch
  };
}