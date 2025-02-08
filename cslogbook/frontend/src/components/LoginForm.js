import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form] = Form.useForm();

  // ดึง path ที่ user พยายามจะเข้าถึง
  const from = location.state?.from?.pathname || "/dashboard";

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
      
      if (data.success) {
        // เรียกใช้ login function จาก AuthContext
        const loginSuccess = await login({
          token: data.token,
          refreshToken: data.refreshToken,
          userData: {
            studentID: data.studentID,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            role: data.role,
            isEligibleForInternship: data.isEligibleForInternship,
            isEligibleForProject: data.isEligibleForProject
          }
        });

        if (loginSuccess) {
          message.success('เข้าสู่ระบบสำเร็จ');
          navigate(from, { replace: true });
        }
      } else {
        throw new Error(data.error || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
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