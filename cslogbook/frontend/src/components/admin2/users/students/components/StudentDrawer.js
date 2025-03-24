import React from 'react';
import { Drawer, Button, Space, Form } from 'antd';
import { SaveOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import StudentDetail from './StudentDetail';

const StudentDrawer = ({
  visible,
  student,
  editMode,
  form,
  onClose,
  onEdit,
  onCancelEdit,
  onSave
}) => {
  const drawerExtra = editMode ? (
    <Space>
      <Button onClick={onCancelEdit} icon={<CloseOutlined />}>
        ยกเลิก
      </Button>
      <Button type="primary" onClick={onSave} icon={<SaveOutlined />}>
        บันทึก
      </Button>
    </Space>
  ) : (
    <Button
      type="primary"
      onClick={onEdit}
      icon={<EditOutlined />}
    >
      แก้ไขข้อมูล
    </Button>
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
        // ใส่ StudentForm แบบ inline หรือแยกเป็นอีกคอมโพเนนต์
        <Form
          form={form}
          layout="vertical"
          initialValues={{ totalCredits: 0, majorCredits: 0 }}
          className="student-form"
        >
          {/* form fields จากไฟล์เดิม */}
        </Form>
      ) : (
        <StudentDetail student={student} />
      )}
    </Drawer>
  );
};

export default StudentDrawer;