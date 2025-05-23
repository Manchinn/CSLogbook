import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { message } from "antd";
import { userService } from "../../../../../services/admin/userService";

export const useStudentData = (filterParams = {}) => {
  const [selectedStudent, setSelectedStudent] = useState(null);
  const queryClient = useQueryClient();

  // Query สำหรับดึงข้อมูลนักศึกษา
  const {
    data: response = { success: false, data: [] },
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["adminStudents", filterParams], // ⚠️ เปลี่ยนเป็น adminStudents เพื่อไม่ให้ชนกับ key อื่น
    queryFn: () => userService.getAllStudents(filterParams),
    staleTime: 1000 * 60 * 5, // 5 นาที
    onSuccess: (data) => {
      console.log("Successfully fetched students data:", data);
    },
    onError: (error) => {
      console.error("Error fetching students:", error);
      message.error(
        "ไม่สามารถโหลดข้อมูลนักศึกษา: " + (error.message || "เกิดข้อผิดพลาด")
      );
    },
  });

  // Mutation สำหรับการเพิ่มนักศึกษา
  const addStudentMutation = useMutation({
    mutationFn: userService.addStudent,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
      return data; // คืนค่าจาก API โดยตรง
    },
    onError: (error) => {
      console.error('Error adding student:', error);
      // จัดการ error ตามประเภทไว้ใน component ที่เรียกใช้จะเหมาะสมกว่า
      throw error; // ส่ง error กลับไปให้ผู้เรียกใช้จัดการ
    }
  });

  // Mutation สำหรับการอัพเดตนักศึกษา
  const updateStudentMutation = useMutation({
    mutationFn: ({ studentCode, data }) =>
      userService.updateStudent(studentCode, data),
    onSuccess: (response) => {
      message.success("อัปเดตข้อมูลนักศึกษาสำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["adminStudents"] }); // ⚠️ ปรับ key ให้ตรงกัน
      return { success: true, data: response.data };
    },
    onError: (error) => {
      console.error("Error updating student:", error);
      message.error(error.message || "เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
      return { success: false };
    },
  });

  // Mutation สำหรับการลบนักศึกษา
  const deleteStudentMutation = useMutation({
    mutationFn: userService.deleteStudent,
    onSuccess: () => {
      message.success("ลบข้อมูลนักศึกษาสำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["adminStudents"] }); // ⚠️ ปรับ key ให้ตรงกัน
      return true;
    },
    onError: (error) => {
      console.error("Error deleting student:", error);
      message.error(error.message || "เกิดข้อผิดพลาดในการลบข้อมูล");
      return false;
    },
  });

  // ฟังก์ชัน wrapper เพื่อให้ใช้งานได้เหมือนเดิม
  const addStudent = async (studentData) => {
    try {
      return await addStudentMutation.mutateAsync(studentData);
    } catch (error) {
      // ส่ง error กลับไปให้ handleSaveStudent จัดการ
      throw error;
    }
  };

  // เพิ่มการจัดการ selectedStudent หลังจากอัพเดท
  const updateStudent = async (studentCode, studentData) => {
    try {
      const { studentCode: omitted, ...cleanData } = studentData;
      
      const result = await updateStudentMutation.mutateAsync({
        studentCode,
        data: cleanData
      });
      
      if (result.success) {
        // อัพเดทข้อมูลใน selectedStudent โดยใช้ข้อมูลที่ได้จากการอัพเดท
        const updatedStudent = {
          studentCode,
          ...cleanData,
        };
        setSelectedStudent(prev => ({
          ...prev,
          ...updatedStudent
        }));
      }
      
      return result;
    } catch (error) {
      throw error;
    }
  };

  const deleteStudent = async (studentCode) => {
    try {
      return await deleteStudentMutation.mutateAsync(studentCode);
    } catch (error) {
      return false;
    }
  };

  // เรียกใช้งาน refetch ด้วยพารามิเตอร์ใหม่
  const fetchStudentsWithParams = (params) => {
    queryClient.invalidateQueries({ queryKey: ["adminStudents", params] }); // ⚠️ ปรับ key ให้ตรงกัน
  };

  // เพิ่มการ log ข้อมูลเพื่อการ debug
  useEffect(() => {
    console.log("Current students data:", response?.data);
  }, [response?.data]);

  return {
    students: response?.data || [],
    loading:
      isLoading ||
      addStudentMutation.isPending ||
      updateStudentMutation.isPending ||
      deleteStudentMutation.isPending,
    selectedStudent,
    setSelectedStudent,
    fetchStudentsWithParams,
    refetch,
    addStudent,
    updateStudent,
    deleteStudent,
    // ส่งข้อมูลสถานะเพิ่มเติม
    isAdding: addStudentMutation.isPending,
    isUpdating: updateStudentMutation.isPending,
    isDeleting: deleteStudentMutation.isPending,
  };
};
