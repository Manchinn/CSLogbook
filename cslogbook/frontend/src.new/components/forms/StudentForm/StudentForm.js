import React, { useEffect } from "react";
import { Modal, Form, Input, Select } from "antd";

const { Option } = Select;

const StudentForm = ({ visible, onCreate, onCancel, student }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (student) {
      form.setFieldsValue(student);
    } else {
      form.resetFields();
    }
  }, [student, visible, form]);

  return (
    <Modal
      open={visible}
      title={student ? "แก้ไขข้อมูลนักศึกษา" : "เพิ่มนักศึกษา"}
      okText={student ? "บันทึก" : "เพิ่ม"}
      cancelText="ยกเลิก"
      onCancel={onCancel}
      onOk={() => {
        form
          .validateFields()
          .then(values => {
            onCreate(values);
            form.resetFields();
          })
          .catch(info => {
            console.log("Validation Failed:", info);
          });
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="studentId"
          label="รหัสนักศึกษา"
          rules={[{ required: true, message: "กรุณากรอกรหัสนักศึกษา!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="name"
          label="ชื่อ"
          rules={[{ required: true, message: "กรุณากรอกชื่อนักศึกษา!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="email"
          label="อีเมล"
          rules={[{ required: true, type: "email", message: "กรุณากรอกอีเมลที่ถูกต้อง!" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="internshipStatus"
          label="สถานะฝึกงาน"
          rules={[{ required: true, message: "กรุณาเลือกสถานะฝึกงาน!" }]}
        >
          <Select>
            <Option value="active">กำลังฝึกงาน</Option>
            <Option value="completed">ฝึกงานเสร็จแล้ว</Option>
            <Option value="pending">รออนุมัติ</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default StudentForm;
