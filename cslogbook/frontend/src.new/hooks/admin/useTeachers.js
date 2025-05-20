import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/admin/userService'; // Updated import path
import { message } from 'antd';

/**
 * Hook สำหรับการจัดการข้อมูลอาจารย์ในส่วน Admin
 */
export function useTeachers(filters = {}) {
  const queryClient = useQueryClient();

  const queryKey = ['teachers', filters];

  const { data, isLoading, isError, error } = useQuery(queryKey, () => userService.getTeachers(filters), {
    keepPreviousData: true,
  });

  const mutation = useMutation((newTeacher) => userService.addTeacher(newTeacher), {
    onSuccess: () => {
      queryClient.invalidateQueries('teachers');
      message.success('เพิ่มอาจารย์ใหม่เรียบร้อยแล้ว');
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  const deleteMutation = useMutation((id) => userService.deleteTeacher(id), {
    onSuccess: () => {
      queryClient.invalidateQueries('teachers');
      message.success('ลบอาจารย์เรียบร้อยแล้ว');
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  return {
    teachers: data?.data,
    isLoading,
    isError,
    error,
    addTeacher: mutation.mutate,
    deleteTeacher: deleteMutation.mutate,
  };
}