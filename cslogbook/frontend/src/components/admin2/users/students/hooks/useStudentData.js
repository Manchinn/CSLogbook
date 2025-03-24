import { useState, useCallback } from 'react';
import { message } from 'antd';
import { userService } from '../../../../../services/admin/userService';

export const useStudentData = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  // Fetch students
  const fetchStudents = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const response = await userService.getAllStudents(params);
      
      if (response.success && Array.isArray(response.data)) {
        setStudents(response.data);
      } else {
        console.error('Invalid response format:', response);
        message.error('รูปแบบข้อมูลไม่ถูกต้อง');
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      message.error('ไม่สามารถโหลดข้อมูลนักศึกษา: ' + (error.message || 'เกิดข้อผิดพลาด'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Add student
  const addStudent = async (studentData) => {
    try {
      await userService.addStudent(studentData);
      message.success('เพิ่มนักศึกษาสำเร็จ');
      return true;
    } catch (error) {
      console.error('Error adding student:', error);
      message.error(error.message || 'เกิดข้อผิดพลาดในการเพิ่มข้อมูล');
      return false;
    }
  };
  
  // Update student
  const updateStudent = async (studentCode, studentData) => {
    try {
      const response = await userService.updateStudent(studentCode, studentData);
      message.success('อัปเดตข้อมูลนักศึกษาสำเร็จ');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error updating student:', error);
      message.error(error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล');
      return { success: false };
    }
  };
  
  // Delete student
  const deleteStudent = async (studentCode) => {
    try {
      await userService.deleteStudent(studentCode);
      message.success('ลบข้อมูลนักศึกษาสำเร็จ');
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      message.error(error.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
      return false;
    }
  };
  
  return {
    students,
    loading,
    selectedStudent,
    setSelectedStudent,
    fetchStudents,
    addStudent,
    updateStudent,
    deleteStudent
  };
};