import { useQuery } from '@tanstack/react-query';
import { studentService } from '../services/studentService';
import { useAuth } from '../contexts/AuthContext';

export const useStudentInfo = () => {
  const { userData } = useAuth();
  const studentCode = userData?.studentCode;
  
  return useQuery({
    queryKey: ['studentInfo', studentCode],
    queryFn: () => studentService.getStudentInfo(studentCode),
    enabled: !!studentCode, // ทำงานเมื่อมี studentCode เท่านั้น
  });
};