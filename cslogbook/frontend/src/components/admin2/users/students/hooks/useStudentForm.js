import { useState } from 'react';
import { Form, message, notification } from 'antd';
import { calculateStudentYear, isEligibleForInternship, isEligibleForProject } from '../../../../../utils/studentUtils';

export const useStudentForm = (onSuccess, fetchStudentsWithParams) => {
  const [form] = Form.useForm();
  const [editMode, setEditMode] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setEditMode(true);
    form.resetFields();
    setDrawerVisible(true);
  };
  
  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setEditMode(false);
    setDrawerVisible(true);
  };
  
  const handleEditStudent = () => {
    setEditMode(true);
  };
  
  const handleCancelEdit = () => {
    setEditMode(false);
  };
  
  const handleCloseDrawer = () => {
    setDrawerVisible(false);
    setEditMode(false);
  };
  
  const handleSaveStudent = async (addStudent, updateStudent, filterParams) => {
    try {
      const values = await form.validateFields();
      
      // ตรวจสอบความถูกต้องของหน่วยกิต
      if (values.majorCredits > values.totalCredits) {
        message.error('หน่วยกิตภาควิชาต้องไม่มากกว่าหน่วยกิตรวม');
        return;
      }
      
      // คำนวณสิทธิ์เบื้องต้น
      if (values.studentCode) {
        const studentYear = calculateStudentYear(values.studentCode);
        if (!studentYear.error) {
          const internshipStatus = isEligibleForInternship(studentYear.year, values.totalCredits);
          const projectStatus = isEligibleForProject(studentYear.year, values.totalCredits, values.majorCredits);
          
          // แสดงผลลัพธ์เบื้องต้น
          notification.info({
            message: 'ข้อมูลสิทธิ์หลังปรับปรุง',
            description: 
              `การเปลี่ยนแปลงนี้จะส่งผลให้นักศึกษา${internshipStatus.eligible ? ' "มีสิทธิ์ฝึกงาน"' : ' "ไม่มีสิทธิ์ฝึกงาน"'} 
               และ${projectStatus.eligible ? ' "มีสิทธิ์ทำโครงงาน"' : ' "ไม่มีสิทธิ์ทำโครงงาน"'}`,
            duration: 4
          });
        }
      }
      
      let success = false;
      
      if (selectedStudent) {
        const result = await updateStudent(selectedStudent.studentCode, values);
        if (result.success) {
          setSelectedStudent({...selectedStudent, ...result.data});
          success = true;
        }
      } else {
        success = await addStudent(values);
        if (success) {
          setDrawerVisible(false);
        }
      }
      
      if (success) {
        setEditMode(false);
        fetchStudentsWithParams(filterParams);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (error) {
      console.error('Error saving student:', error);
      message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    }
  };
  
  return {
    form,
    drawerVisible,
    setDrawerVisible,
    editMode,
    setEditMode,
    selectedStudent,
    setSelectedStudent,
    handleAddStudent,
    handleViewStudent,
    handleEditStudent,
    handleCancelEdit,
    handleCloseDrawer,
    handleSaveStudent
  };
};