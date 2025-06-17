import { useQuery } from '@tanstack/react-query';
import { adminService } from '../services/adminService';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: adminService.getStats,
  });
};