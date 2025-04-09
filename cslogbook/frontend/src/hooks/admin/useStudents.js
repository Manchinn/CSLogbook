import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/admin/userService';
import { message } from 'antd';

/**
 * Hook สำหรับการจัดการข้อมูลนักศึกษาในส่วน Admin
 */
export function useStudents(filters = {}) {
  const queryClient = useQueryClient();
  
  // ดึงรายการนักศึกษา
  const studentsQuery = useQuery({
    queryKey: ['admin', 'students', filters],
    queryFn: () => userService.getStudents(filters),
    staleTime: 1000 * 60 * 2, // 2 นาที
  });
  
  // เพิ่มนักศึกษา
  const addStudentMutation = useMutation({
    mutationFn: userService.addStudent,
    onSuccess: () => {
      message.success('เพิ่มนักศึกษาสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (error) => {
      message.error('เกิดข้อผิดพลาดในการเพิ่มนักศึกษา: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  });
  
  // อัพเดทนักศึกษา
  const updateStudentMutation = useMutation({
    mutationFn: ({ studentCode, data }) => userService.updateStudent(studentCode, data),
    onSuccess: () => {
      message.success('อัปเดตข้อมูลนักศึกษาสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
    },
    onError: (error) => {
      message.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูลนักศึกษา: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  });
  
  // ลบนักศึกษา
  const deleteStudentMutation = useMutation({
    mutationFn: userService.deleteStudent,
    onSuccess: () => {
      message.success('ลบนักศึกษาสำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] });
      queryClient.invalidateQueries({ queryKey: ['adminStats'] });
    },
    onError: (error) => {
      message.error('เกิดข้อผิดพลาดในการลบนักศึกษา: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  });
  
  return {
    students: studentsQuery.data?.students || [],
    statistics: studentsQuery.data?.statistics || {},
    isLoading: studentsQuery.isLoading,
    isError: studentsQuery.isError,
    error: studentsQuery.error,
    refetch: studentsQuery.refetch,
    addStudent: addStudentMutation.mutate,
    updateStudent: updateStudentMutation.mutate,
    deleteStudent: deleteStudentMutation.mutate,
  };
}