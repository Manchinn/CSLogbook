import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';


const { Title, Text } = Typography;

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values)
      });
  
      const data = await response.json();
      console.log('Response data:', data); // Debug log
  
      // ตรวจสอบ response.ok แทน data.success
      if (response.ok) {
        // Store user data
        localStorage.setItem('studentID', data.studentID);
        localStorage.setItem('firstName', data.firstName);
        localStorage.setItem('lastName', data.lastName);
        localStorage.setItem('email', data.email);
        localStorage.setItem('role', data.role);
        if (data.isEligibleForInternship !== undefined) {
          localStorage.setItem('isEligibleForInternship', data.isEligibleForInternship);
        }
        if (data.isEligibleForProject !== undefined) {
          localStorage.setItem('isEligibleForProject', data.isEligibleForProject);
        }
  
        message.success('เข้าสู่ระบบสำเร็จ');
        navigate('/dashboard');
      } else {
        // แสดง error message จาก server
        throw new Error(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error(error.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      backgroundColor: '#f0f2f5' 
    }}>
      <Card style={{ width: 400, padding: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2}>เข้าสู่ระบบ</Title>
          <Text type="secondary">กรุณาใช้บัญชี ICIT Account ของท่าน</Text>
        </div>

        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'กรุณากรอก ICIT Account' }]}
          >
            <Input 
              prefix={<UserOutlined />}
              placeholder="ICIT Account"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="รหัสผ่าน"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={loading}
              block
              size="large"
            >
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default LoginForm;