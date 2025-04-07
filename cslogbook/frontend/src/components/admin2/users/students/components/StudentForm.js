import React from 'react';
import { Form, Input, InputNumber } from 'antd';

const StudentForm = ({ form, student }) => {
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{ totalCredits: 0, majorCredits: 0 }}
      className="student-form"
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
          { type: 'number', min: 0, max: 200 },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('totalCredits') >= value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('หน่วยกิตภาควิชาต้องน้อยกว่าหรือเท่ากับหน่วยกิตรวม'));
            }
          })
        ]}
        dependencies={['totalCredits']}
      >
        <InputNumber min={0} max={200} style={{ width: '100%' }} />
      </Form.Item>
    </Form>
  );
};

export default StudentForm;