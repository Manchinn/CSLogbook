import React from 'react';
import { Form, Input, Button, Card, Typography, Space } from 'antd';

const { Title } = Typography;

const CompanyInfoForm = () => {
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    console.log('Form values:', values);
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '85vh', 
      backgroundColor: '#f5f5f5', 
      padding: '20px'
    }}>
      <Card 
        style={{ 
          width: '100%', 
          maxWidth: 1000, 
          padding: 10, 
          borderRadius: 10, 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
        }}
      >
        <Title level={3} style={{ textAlign: 'center', marginBottom: 20 }}>ข้อมูลสถานประกอบการ</Title>
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
            <Input placeholder="ชื่อบริษัท" />
          </Form.Item>

          <Form.Item
            name="contact_name"
            label="ชื่อผู้ควบคุมงาน"
            rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ควบคุมงาน' }]}
          >
            <Input placeholder="ชื่อชื่อผู้ควบคุมงาน" />
          </Form.Item>

          <Form.Item
            name="contact_phone"
            label="เบอร์โทรศัพท์"
            rules={[{ required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' }]}
          >
            <Input placeholder="เบอร์โทรศัพท์" />
          </Form.Item>

          <Form.Item
            name="contact_email"
            label="อีเมลผู้ควบคุมงาน"
            rules={[
              { required: true, message: 'กรุณากรอกอีเมล' },
              { type: 'email', message: 'กรุณากรอกอีเมลให้ถูกต้อง' }
            ]}
          >
            <Input placeholder="อีเมล" />
          </Form.Item>

          <Form.Item>
            <Space style={{ display: 'flex', justifyContent: 'center' }}>
              <Button type="primary" htmlType="submit" size="large">
                บันทึกข้อมูล
              </Button>
              <Button type="primary" size="large">
                ต่อไป
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CompanyInfoForm;
