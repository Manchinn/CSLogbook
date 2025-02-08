import React from 'react';
import { Form, Input, Button, Card, Typography } from 'antd';

const { Title } = Typography;

const CompanyInfoForm = () => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    // จะเพิ่ม API call ต่อไป
    console.log('Form values:', values);
  };

  return (
    <Card>
      <Title level={3}>ข้อมูลสถานประกอบการ</Title>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Form.Item
          name="company_name"
          label="ชื่อสถานประกอบการ"
          rules={[{ required: true, message: 'กรุณากรอกชื่อสถานประกอบการ' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="company_address"
          label="ที่อยู่"
          rules={[{ required: true, message: 'กรุณากรอกที่อยู่' }]}
        >
          <Input.TextArea />
        </Form.Item>

        <Form.Item
          name="province"
          label="จังหวัด"
          rules={[{ required: true, message: 'กรุณากรอกจังหวัด' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="postal_code"
          label="รหัสไปรษณีย์"
          rules={[{ required: true, message: 'กรุณากรอกรหัสไปรษณีย์' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="contact_name"
          label="ชื่อผู้ประสานงาน"
          rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ประสานงาน' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="contact_phone"
          label="เบอร์โทรศัพท์"
          rules={[{ required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="contact_email"
          label="อีเมล"
          rules={[
            { required: true, message: 'กรุณากรอกอีเมล' },
            { type: 'email', message: 'กรุณากรอกอีเมลให้ถูกต้อง' }
          ]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="business_type"
          label="ประเภทธุรกิจ"
          rules={[{ required: true, message: 'กรุณากรอกประเภทธุรกิจ' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            บันทึกข้อมูล
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default CompanyInfoForm;