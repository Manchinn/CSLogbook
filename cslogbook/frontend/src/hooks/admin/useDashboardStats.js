import { useQuery } from '@tanstack/react-query';
import { adminService } from '../../services/adminService';

/**
 * Hook สำหรับดึงข้อมูลสถิติใน Dashboard
 */
export function useDashboardStats() {
  // ดึงข้อมูลสถิติหลัก
  const statsQuery = useQuery({
    queryKey: ['adminStats'],
    queryFn: adminService.getStats,
    refetchInterval: 1000 * 60 * 3, // รีเฟรชทุก 3 นาที
    staleTime: 1000 * 60, // stale หลังจาก 1 นาที
  });
  
  // ดึงข้อมูลกิจกรรมล่าสุด
  const activitiesQuery = useQuery({
    queryKey: ['adminActivities'],
    queryFn: adminService.getRecentActivities,
    refetchInterval: 1000 * 60 * 2, // รีเฟรชทุก 2 นาที
  });
  
  return {
    stats: statsQuery.data || {
      students: { total: 0, internshipEligible: 0, projectEligible: 0 },
      documents: { total: 0, pending: 0 },
      system: { onlineUsers: 0, lastUpdate: null }
    },
    activities: activitiesQuery.data || [],
    isLoading: statsQuery.isLoading || activitiesQuery.isLoading,
    isError: statsQuery.isError || activitiesQuery.isError,
    error: statsQuery.error || activitiesQuery.error,
    refetch: () => {
      statsQuery.refetch();
      activitiesQuery.refetch();
    }
  };
}