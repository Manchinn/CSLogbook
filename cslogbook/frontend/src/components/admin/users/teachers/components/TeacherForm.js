import React, { useEffect } from 'react';
import { Form, Input, Switch } from 'antd';

const TeacherForm = ({ form, teacher, initialValues = {} }) => {
  useEffect(() => {
    if (teacher) {
      form.setFieldsValue({
        teacherCode: teacher.teacherCode,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        canAccessTopicExam: Boolean(teacher.canAccessTopicExam),
        canExportProject1: Boolean(teacher.canExportProject1),
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
        name="position"
        label="ตำแหน่ง"
        rules={[{ required: true, message: "กรุณาเลือกตำแหน่ง!" }]}
      >
        <select style={{ width: '100%', height: 32 }}>
          <option value="หัวหน้าภาควิชา">หัวหน้าภาควิชา</option>
          <option value="รองหัวหน้าภาควิชา">รองหัวหน้าภาควิชา</option>
          <option value="ผู้ช่วยหัวหน้าภาควิชา (ฝ่ายสารสนเทศและวิจัย)">ผู้ช่วยหัวหน้าภาควิชา (ฝ่ายสารสนเทศและวิจัย)</option>
          <option value="ผู้ช่วยหัวหน้าภาควิชา (ฝ่ายกิจการนักศึกษา)">ผู้ช่วยหัวหน้าภาควิชา (ฝ่ายกิจการนักศึกษา)</option>
          <option value="ผู้ช่วยหัวหน้าภาควิชา (ฝ่ายประกันคุณภาพการศึกษาและบริหารความเสี่ยง)">ผู้ช่วยหัวหน้าภาควิชา (ฝ่ายประกันคุณภาพการศึกษาและบริหารความเสี่ยง)</option>
          <option value="ผู้ช่วยหัวหน้าภาควิชา (ฝ่ายสหกิจศึกษาและบริการวิชาการ)">ผู้ช่วยหัวหน้าภาควิชา (ฝ่ายสหกิจศึกษาและบริการวิชาการ)</option>
          <option value="คณาจารย์">คณาจารย์ (อาจารย์สอนทั่วไป)</option>
        </select>
      </Form.Item>
      <Form.Item
        name="canAccessTopicExam"
        label="เปิดสิทธิ์ Topic Exam Overview"
        valuePropName="checked"
      >
        <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
      </Form.Item>
      <Form.Item
        name="canExportProject1"
        label="เปิดสิทธิ์ส่งออกรายชื่อ คพ.02"
        valuePropName="checked"
        tooltip="สำหรับอาจารย์ที่ได้รับมอบหมายให้จัดตารางสอบ"
      >
        <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
      </Form.Item>
    </Form>
  );
};

export default TeacherForm;