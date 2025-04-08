import React, { useEffect } from 'react';
import { Drawer, Button, Space, Empty } from 'antd';
import { SaveOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import StudentDetail from './StudentDetail';
import StudentForm from './StudentForm';

const StudentDrawer = ({
  visible,
  student,
  editMode,
  form,
  onClose,
  onEdit,
  onCancelEdit,
  onSave,
  confirmLoading
}) => {
  
  // ตรวจสอบและเซ็ตค่าฟอร์มเมื่อมีการเปิด drawer หรือเปลี่ยน student
  useEffect(() => {
    if (visible && student && form) {
      form.setFieldsValue({
        studentCode: student.studentCode || '',
        firstName: student.firstName || '',
        lastName: student.lastName || '',
        email: student.email || '',
        totalCredits: student.totalCredits || 0,
        majorCredits: student.majorCredits || 0
      });
    }
  }, [visible, student, form]);

  const drawerExtra = editMode ? (
    <Space>
      <Button onClick={onCancelEdit} icon={<CloseOutlined />}>
        ยกเลิก
      </Button>
      <Button type="primary" onClick={onSave} icon={<SaveOutlined />} loading={confirmLoading}>
        บันทึก
      </Button>
    </Space>
  ) : (
    student && (
      <Button
        type="primary"
        onClick={onEdit}
        icon={<EditOutlined />}
      >
        แก้ไขข้อมูล
      </Button>
    )
  );

  return (
    <Drawer
      title={editMode ? (student ? 'แก้ไขข้อมูลนักศึกษา' : 'เพิ่มนักศึกษา') : 'ข้อมูลนักศึกษา'}
      placement="right"
      width={520}
      onClose={onClose}
      open={visible}
      className="student-drawer"
      extra={drawerExtra}
    >
      {editMode ? (
        <StudentForm form={form} student={student} />
      ) : (
        student ? <StudentDetail student={student} /> : <Empty description="ไม่มีข้อมูลนักศึกษา" />
      )}
    </Drawer>
  );
};

export default StudentDrawer;