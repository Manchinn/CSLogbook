import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ฟังก์ชันการส่งข้อมูลการล็อกอิน
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const data = await response.json();
        message.success('Login successful');

        // เก็บข้อมูลที่ได้รับจาก API ใน localStorage
        localStorage.setItem('studentID', data.studentID);
        localStorage.setItem('firstName', data.firstName);
        localStorage.setItem('lastName', data.lastName);
        localStorage.setItem('email', data.email);
        localStorage.setItem('role', data.role);

        // นำผู้ใช้ไปยังหน้า Dashboard
        navigate('/dashboard');
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <Card style={{ width: 400, padding: '30px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)', borderRadius: '10px' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <Title level={3} style={{ color: '#1890ff' }}>เข้าสู่ระบบ</Title>
          <Text type="secondary">กรุณาป้อน ICT Account และรหัสผ่าน</Text>
        </div>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            label="ICT Account"
            name="username"
            rules={[{ required: true, message: 'Please input your username!' }]}
          >
            <Input placeholder="*********" />
          </Form.Item>

          <Form.Item
            label="รหัสผ่าน"
            name="password"
            rules={[{ required: true, message: 'Please input your password!' }]}
          >
            <Input.Password placeholder="******" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ backgroundColor: '#1890ff', borderColor: '#1890ff' }}>
              Login
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginForm;
