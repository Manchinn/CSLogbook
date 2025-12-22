import React, { useEffect, useMemo } from 'react';
import { Form, Input, Switch, Select } from 'antd';
import { TEACHER_POSITION_OPTIONS, getTeacherTypeByPosition } from '../constants';

const TeacherForm = ({ form, teacher, initialValues = {} }) => {
  const positionValue = Form.useWatch('position', form);

  const positionOptions = useMemo(() => {
    if (teacher?.position && !TEACHER_POSITION_OPTIONS.some((option) => option.value === teacher.position)) {
      return [
        ...TEACHER_POSITION_OPTIONS,
        {
          value: teacher.position,
          label: teacher.position,
          teacherType: teacher.teacherType || getTeacherTypeByPosition(teacher.position),
          disabled: true
        }
      ];
    }
    return TEACHER_POSITION_OPTIONS;
  }, [teacher]);

  useEffect(() => {
    if (teacher) {
      form.setFieldsValue({
        teacherCode: teacher.teacherCode,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        canAccessTopicExam: Boolean(teacher.canAccessTopicExam),
        canExportProject1: Boolean(teacher.canExportProject1),
        position: teacher.position || TEACHER_POSITION_OPTIONS[1].value,
  teacherType: teacher.teacherType || getTeacherTypeByPosition(teacher.position),
        ...initialValues
      });
    } else {
      form.resetFields();
      if (Object.keys(initialValues).length > 0) {
        form.setFieldsValue(initialValues);
      }
    }
  }, [form, teacher, initialValues]);

  useEffect(() => {
    if (positionValue) {
      const teacherType = getTeacherTypeByPosition(positionValue);
      if (form.getFieldValue('teacherType') !== teacherType) {
        form.setFieldsValue({ teacherType });
      }
    }
  }, [positionValue, form]);

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
        <Input />
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
        <Select options={positionOptions} />
      </Form.Item>
      <Form.Item name="teacherType" hidden>
        <Input type="hidden" />
      </Form.Item>
      <Form.Item
        name="canAccessTopicExam"
        label="เปิดสิทธิ์การเข้าถึงหัวข้อสอบโครงงานพิเศษ"
        valuePropName="checked"
      >
        <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
      </Form.Item>
      <Form.Item
        name="canExportProject1"
        label="เปิดสิทธิ์ส่งออกรายชื่อสอบโครงงานพิเศษ"
        valuePropName="checked"
        tooltip="สำหรับอาจารย์ที่ได้รับมอบหมายให้จัดตารางสอบ"
      >
        <Switch checkedChildren="เปิด" unCheckedChildren="ปิด" />
      </Form.Item>
    </Form>
  );
};

export default TeacherForm;