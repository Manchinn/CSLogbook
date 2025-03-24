import React, { useEffect } from 'react';
import { Form, Input } from 'antd';

const TeacherForm = ({ form, teacher, initialValues = {} }) => {
  useEffect(() => {
    if (teacher) {
      form.setFieldsValue({
        teacherCode: teacher.teacherCode,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        extension: teacher.contactExtension,
        department: teacher.department,
        ...initialValues
      });
    } else {
      form.resetFields();
      if (Object.keys(initialValues).length > 0) {
        form.setFieldsValue(initialValues);
      }
    }
  }, [form, teacher, initialValues]);

  return (
    <Form
      form={form}
      layout="vertical"
      className="teacher-form"
    >
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
      <Form.Item
        name="department"
        label="ภาควิชา"
      >
        <Input />
      </Form.Item>
    </Form>
  );
};

export default TeacherForm;