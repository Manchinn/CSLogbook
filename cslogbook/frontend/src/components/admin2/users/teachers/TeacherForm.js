import React, { useEffect } from 'react';
import { Modal, Form, Input } from 'antd';

const TeacherForm = ({ visible, teacher, onCancel, onSubmit }) => {
  const [form] = Form.useForm();

  // กำหนดค่าเริ่มต้นของฟอร์มเมื่อแก้ไข
  useEffect(() => {
    if (visible && teacher) {
      form.setFieldsValue({
        teacherCode: teacher.teacherCode,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        contactExtension: teacher.contactExtension
      });
    } else {
      form.resetFields();
    }
  }, [form, teacher, visible]);

  // ตรวจสอบและส่งข้อมูล
  const handleOk = () => {
    form.validateFields()
      .then(values => {
        onSubmit(values);
        form.resetFields();
      })
      .catch(info => {
        console.error('Validation Failed:', info);
      });
  };

  return (
    <Modal
      title={teacher ? "แก้ไขข้อมูลอาจารย์" : "เพิ่มอาจารย์"}
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={teacher ? "บันทึก" : "เพิ่ม"}
      cancelText="ยกเลิก"
    >
      <Form form={form} layout="vertical">
        <Form.Item 
          name="teacherCode" 
          label="รหัสอาจารย์" 
          rules={[{ required: true, message: "กรุณากรอกรหัสอาจารย์!" }]}
        >
          <Input disabled={!!teacher} />
        </Form.Item>
        <Form.Item 
          name="firstName" 
          label="ชื่อ" 
          rules={[{ required: true, message: "กรุณากรอกชื่ออาจารย์!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item 
          name="lastName" 
          label="นามสกุล" 
          rules={[{ required: true, message: "กรุณากรอกนามสกุล!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item 
          name="email" 
          label="อีเมล" 
          rules={[
            { required: true, message: "กรุณากรอกอีเมล!" },
            { type: "email", message: "กรุณากรอกอีเมลที่ถูกต้อง!" }
          ]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="contactExtension"
          label="เบอร์ภายใน"
        >
          <Input />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default TeacherForm;