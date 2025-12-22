import React from 'react';
import { Drawer, Button, Space } from 'antd';
import { SaveOutlined, CloseOutlined, EditOutlined } from '@ant-design/icons';
import TeacherDetail from './TeacherDetail';
import TeacherForm from './TeacherForm';

const TeacherDrawer = ({
  visible,
  teacher,
  editMode,
  form,
  initialValues,
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
      title={editMode ? (teacher ? 'แก้ไขข้อมูลอาจารย์' : 'เพิ่มอาจารย์') : 'ข้อมูลอาจารย์'}
      placement="right"
      width={520}
      onClose={onClose}
      open={visible}
      className="teacher-drawer"
      extra={drawerExtra}
    >
      {editMode ? (
        <TeacherForm form={form} teacher={teacher} initialValues={initialValues} />
      ) : (
        <TeacherDetail teacher={teacher} />
      )}
    </Drawer>
  );
};

export default TeacherDrawer;