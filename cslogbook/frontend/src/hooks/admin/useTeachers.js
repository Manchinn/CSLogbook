import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/admin/userService';
import { message } from 'antd';

/**
 * Hook สำหรับการจัดการข้อมูลอาจารย์ในส่วน Admin
 */
export function useTeachers(filters = {}) {
  const queryClient = useQueryClient();
  
  // ดึงรายการอาจารย์
  const teachersQuery = useQuery({
    queryKey: ['admin', 'teachers', filters],
    queryFn: () => userService.getTeachers(filters),
    staleTime: 1000 * 60 * 5, // 5 นาที
  });
  
  // เพิ่มอาจารย์
  const addTeacherMutation = useMutation({
    mutationFn: userService.createTeacher,
    onSuccess: () => {
      message.success('เพิ่มอาจารย์สำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] });
    },
    onError: (error) => {
      message.error('เกิดข้อผิดพลาดในการเพิ่มอาจารย์: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  });
  
  // อัพเดทอาจารย์
  const updateTeacherMutation = useMutation({
    mutationFn: ({ teacherId, data }) => userService.updateTeacher(teacherId, data),
    onSuccess: () => {
      message.success('อัปเดตข้อมูลอาจารย์สำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] });
    },
    onError: (error) => {
      message.error('เกิดข้อผิดพลาดในการอัปเดตข้อมูลอาจารย์: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  });
  
  // ลบอาจารย์
  const deleteTeacherMutation = useMutation({
    mutationFn: userService.deleteTeacher,
    onSuccess: () => {
      message.success('ลบอาจารย์สำเร็จ');
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] });
    },
    onError: (error) => {
      message.error('เกิดข้อผิดพลาดในการลบอาจารย์: ' + (error.message || 'กรุณาลองใหม่อีกครั้ง'));
    }
  });
  
  return {
    teachers: teachersQuery.data?.teachers || [],
    isLoading: teachersQuery.isLoading,
    isError: teachersQuery.isError,
    error: teachersQuery.error,
    refetch: teachersQuery.refetch,
    addTeacher: addTeacherMutation.mutate,
    updateTeacher: updateTeacherMutation.mutate,
    deleteTeacher: deleteTeacherMutation.mutate,
  };
}