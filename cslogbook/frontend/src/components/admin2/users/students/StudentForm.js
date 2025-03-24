import React, { useEffect } from 'react';
import { Modal, Form, Input, InputNumber, message } from 'antd';

const StudentForm = ({ visible, student, onCancel, onSubmit }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (student) {
      form.setFieldsValue({
        studentCode: student.studentCode,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        totalCredits: student.totalCredits || 0,
        majorCredits: student.majorCredits || 0
      });
    } else {
      form.resetFields();
    }
  }, [form, student, visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Validate credits
      if (values.majorCredits > values.totalCredits) {
        message.error('หน่วยกิตภาควิชาต้องไม่มากกว่าหน่วยกิตรวม');
        return;
      }
      
      onSubmit(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Modal
      title={student ? 'แก้ไขข้อมูลนักศึกษา' : 'เพิ่มนักศึกษา'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={student ? 'บันทึก' : 'เพิ่ม'}
      cancelText="ยกเลิก"
      maskClosable={false}
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ totalCredits: 0, majorCredits: 0 }}
      >
        <Form.Item
          name="studentCode"
          label="รหัสนักศึกษา"
          rules={[
            { required: true, message: 'กรุณากรอกรหัสนักศึกษา' },
            { pattern: /^\d{13}$/, message: 'รหัสนักศึกษาต้องเป็นตัวเลข 13 หลัก' }
          ]}
        >
          <Input disabled={!!student} placeholder="รหัสนักศึกษา 13 หลัก" />
        </Form.Item>

        <Form.Item
          name="firstName"
          label="ชื่อ"
          rules={[{ required: true, message: 'กรุณากรอกชื่อ' }]}
        >
          <Input placeholder="ชื่อ" />
        </Form.Item>

        <Form.Item
          name="lastName"
          label="นามสกุล"
          rules={[{ required: true, message: 'กรุณากรอกนามสกุล' }]}
        >
          <Input placeholder="นามสกุล" />
        </Form.Item>

        <Form.Item
          name="email"
          label="อีเมล"
          rules={[
            { required: true, message: 'กรุณากรอกอีเมล' },
            { type: 'email', message: 'อีเมลไม่ถูกต้อง' }
          ]}
        >
          <Input placeholder="อีเมล" />
        </Form.Item>

        <Form.Item
          name="totalCredits"
          label="หน่วยกิตรวม"
          rules={[
            { required: true, message: 'กรุณากรอกหน่วยกิตรวม' },
            { type: 'number', min: 0, max: 200, message: 'หน่วยกิตต้องอยู่ระหว่าง 0-200' }
          ]}
        >
          <InputNumber min={0} max={200} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="majorCredits"
          label="หน่วยกิตภาควิชา"
          rules={[
            { required: true, message: 'กรุณากรอกหน่วยกิตภาควิชา' },
            { type: 'number', min: 0, max: 200, message: 'หน่วยกิตต้องอยู่ระหว่าง 0-200' }
          ]}
          dependencies={['totalCredits']}
        >
          <InputNumber min={0} max={200} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StudentForm;