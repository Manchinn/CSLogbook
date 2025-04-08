import { useState } from 'react';
import { Form, message, notification, Modal } from 'antd';
import { calculateStudentYear, isEligibleForInternship, isEligibleForProject } from '../../../../../utils/studentUtils';
import { useQueryClient } from '@tanstack/react-query';

export const useStudentForm = (addStudent, updateStudent) => {
  const [form] = Form.useForm();
  const [editMode, setEditMode] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const queryClient = useQueryClient();

  const handleAddStudent = () => {
    setSelectedStudent(null);
    setEditMode(true);
    form.resetFields();
    setDrawerVisible(true);
  };
  
  const handleViewStudent = (student) => {
    if (!student) return;
    
    // สร้างสำเนาข้อมูล
    const studentCopy = JSON.parse(JSON.stringify(student));
    setSelectedStudent(studentCopy);
    
    // เซ็ตค่าฟอร์ม
    form.setFieldsValue({
      studentCode: studentCopy.studentCode || '',
      firstName: studentCopy.firstName || '',
      lastName: studentCopy.lastName || '',
      email: studentCopy.email || '',
      totalCredits: studentCopy.totalCredits || 0,
      majorCredits: studentCopy.majorCredits || 0,
    });
    
    // เปิด drawer ในโหมดดูข้อมูล
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
    // ไม่ต้องรีเซ็ต selectedStudent เพราะจะทำให้ข้อมูลหายก่อนที่ drawer จะปิดสนิท
  };
  
  const handleSaveStudent = async () => {
    try {
      const values = await form.validateFields();
      
      // ตรวจสอบความถูกต้องของหน่วยกิต
      if (values.majorCredits > values.totalCredits) {
        message.error('หน่วยกิตภาควิชาต้องไม่มากกว่าหน่วยกิตรวม');
        return;
      }
      
      try {
        // กรณีแก้ไขข้อมูลนักศึกษา
        if (selectedStudent) {
          const updateValues = {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            totalCredits: parseInt(values.totalCredits, 10) || 0,
            majorCredits: parseInt(values.majorCredits, 10) || 0
          };
          
          const result = await updateStudent(selectedStudent.studentCode, updateValues);
          
          if (result.success) {
            message.success('อัปเดตข้อมูลนักศึกษาสำเร็จ');
            
            // อัพเดท selectedStudent ด้วยข้อมูลใหม่
            setSelectedStudent({
              ...selectedStudent,
              ...updateValues
            });
            
            setEditMode(false);
            // Refresh data
            queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
          }
        } else {
          // กรณีเพิ่มนักศึกษาใหม่
          const newStudentData = { ...values };
          const result = await addStudent(newStudentData);
          
          if (result && result.success) {
            message.success('เพิ่มนักศึกษาสำเร็จ');
            setDrawerVisible(false);
            form.resetFields();
            // Refresh data
            queryClient.invalidateQueries({ queryKey: ['adminStudents'] });
          }
        }
      } catch (error) {
        if (error.isConflict || 
            error.message?.toLowerCase().includes('มีอยู่แล้ว') || 
            error.message?.toLowerCase().includes('ซ้ำ') || 
            error.response?.status === 409) {
          Modal.error({
            title: 'ไม่สามารถเพิ่มข้อมูลได้',
            content: error.message || 'รหัสนักศึกษานี้มีอยู่แล้วในระบบ'
          });
        } else {
          message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        }
      }
    } catch (error) {
      message.error('กรุณากรอกข้อมูลให้ถูกต้องและครบถ้วน');
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