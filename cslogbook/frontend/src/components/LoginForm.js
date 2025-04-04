import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const { Title, Text } = Typography;
const API_URL = process.env.REACT_APP_API_URL;

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form] = Form.useForm();

  // ดึง path ที่ user พยายามจะเข้าถึง
  const from = location.state?.from?.pathname || "/admin2/";

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
        const response = await axios.post(`${API_URL}/auth/login`, values, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000  // Add timeout
        });

        console.log('Login response:', response.data);  // Debug log

        const { success, token, ...userData } = response.data;
        
        if (success) {
            const loginSuccess = await login({
                token,
                userData: {
                    studentID: userData.studentID || null,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.email || '',
                    role: userData.role || '',
                    ...userData  // Include all role-specific data
                }
            });

            if (loginSuccess) {
                message.success('เข้าสู่ระบบสำเร็จ');
                
                // เพิ่มเงื่อนไขเฉพาะ admin
                if (userData.role === 'admin') {
                    navigate('/admin2/dashboard');
                } else {
                    // ถ้าเป็น roles อื่น (teacher, student) ใช้ path เดิม
                    navigate(from);
                }
            }
        }
    } catch (error) {
        console.error('Login error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });

        message.error(
            error.response?.data?.message || 
            'ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง'
        );
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