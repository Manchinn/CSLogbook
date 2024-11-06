import React, { useState } from 'react';
import { Form, Input, Button, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),  // ส่ง username และ password จากฟอร์ม
      });

      if (response.ok) {
        message.success('Login successful');
        navigate('/dashboard');  // เปลี่ยนหน้าไปที่ dashboard
      } else {
        message.error('Invalid username or password');
      }
    } catch (error) {
      message.error('Something went wrong. Please try again later.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 300, margin: 'auto', padding: '50px', textAlign: 'center' }}>
      <Title level={2}>Login</Title>
      <Form
        name="login"
        initialValues={{ remember: true }}
        onFinish={handleSubmit}
        layout="vertical"
      >
        <Form.Item
          label="Username"
          name="username"
          rules={[{ required: true, message: 'Please input your username!' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Login
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default LoginForm;
