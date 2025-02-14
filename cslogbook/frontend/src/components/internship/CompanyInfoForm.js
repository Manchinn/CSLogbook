import React from 'react';
import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { useNavigate } from "react-router-dom";
import InternshipSteps from "./InternshipSteps";
import "./InternshipStyles.css"; // Import shared CSS

const { Title } = Typography;

const CompanyInfoForm = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    localStorage.setItem("companyInfo", JSON.stringify(values));
    console.log('Form values:', values);
    navigate("/internship-documents");
  };

  return (
    <div className="internship-container">
      <InternshipSteps />
      <Card className="internship-card">
        <Title level={3} style={{ textAlign: 'left', marginBottom: 20 }}>ข้อมูลสถานประกอบการ</Title>
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
              <Button type="primary" size="large" onClick={() => navigate("/internship-terms")}>
                ย้อนกลับ
              </Button>
              <Button type="primary" size="large" onClick={() => navigate("/internship-documents")}>
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
