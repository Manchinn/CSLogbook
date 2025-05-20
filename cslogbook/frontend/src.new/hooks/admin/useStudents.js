import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/admin/userService'; // Updated import path
import { message } from 'antd';

/**
 * Hook สำหรับการจัดการข้อมูลนักศึกษาในส่วน Admin
 */
export function useStudents(filters = {}) {
  const queryClient = useQueryClient();

  // Query เพื่อดึงข้อมูลนักศึกษาทั้งหมด
  const studentsQuery = useQuery(['students', filters], () => userService.getAllStudents(filters), {
    staleTime: 5000,
    cacheTime: 10000,
    onError: (error) => {
      message.error(error.message);
    },
  });

  // Mutation สำหรับการเพิ่มนักศึกษา
  const addStudentMutation = useMutation(userService.addStudent, {
    onSuccess: () => {
      queryClient.invalidateQueries('students');
      message.success('เพิ่มนักศึกษาเรียบร้อยแล้ว');
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  // Mutation สำหรับการแก้ไขนักศึกษา
  const updateStudentMutation = useMutation(userService.updateStudent, {
    onSuccess: () => {
      queryClient.invalidateQueries('students');
      message.success('แก้ไขนักศึกษาเรียบร้อยแล้ว');
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  // Mutation สำหรับการลบนักศึกษา
  const deleteStudentMutation = useMutation(userService.deleteStudent, {
    onSuccess: () => {
      queryClient.invalidateQueries('students');
      message.success('ลบนักศึกษาเรียบร้อยแล้ว');
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  return {
    students: studentsQuery.data,
    isLoading: studentsQuery.isLoading,
    isError: studentsQuery.isError,
    addStudent: addStudentMutation.mutate,
    updateStudent: updateStudentMutation.mutate,
    deleteStudent: deleteStudentMutation.mutate,
  };
}