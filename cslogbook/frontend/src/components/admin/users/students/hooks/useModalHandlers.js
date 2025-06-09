import { useState } from 'react';
import { Modal, message } from 'antd';
import { useQueryClient } from '@tanstack/react-query';

export const useModalHandlers = (deleteStudentAction) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const queryClient = useQueryClient();

  const handleUploadSuccess = () => {
    setUploadModalVisible(false);
    // ใช้ invalidateQueries แทนการเรียก API โดยตรง
    queryClient.invalidateQueries({ queryKey: ['students'] });
    message.success('อัปโหลดข้อมูลนักศึกษาสำเร็จ');
  };

  const handleDeleteStudent = (studentCode, selectedStudent, setDrawerVisible) => {
    Modal.confirm({
      title: 'ยืนยันการลบข้อมูล',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนักศึกษานี้? การดำเนินการนี้ไม่สามารถเรียกคืนได้',
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        const success = await deleteStudentAction(studentCode);
        if (success) {
          if (selectedStudent && selectedStudent.studentCode === studentCode) {
            setDrawerVisible(false);
          }
          // ไม่ต้องเรียก API ซ้ำเพราะ mutation จะทำให้อัตโนมัติแล้ว
        }
      }
    });
  };

  return {
    uploadModalVisible,
    setUploadModalVisible,
    handleUploadSuccess,
    handleDeleteStudent
  };
};