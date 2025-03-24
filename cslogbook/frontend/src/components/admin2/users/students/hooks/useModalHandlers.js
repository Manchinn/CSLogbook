import { useState } from 'react';
import { Modal, message } from 'antd';

export const useModalHandlers = (deleteStudentAction, fetchStudentsWithParams) => {
  const [uploadModalVisible, setUploadModalVisible] = useState(false);

  const handleUploadSuccess = (filterParams) => {
    setUploadModalVisible(false);
    fetchStudentsWithParams(filterParams);
    message.success('อัปโหลดข้อมูลนักศึกษาสำเร็จ');
  };

  const handleDeleteStudent = (studentCode, selectedStudent, setDrawerVisible, filterParams) => {
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
          fetchStudentsWithParams(filterParams);
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