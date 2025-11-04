import React, { useState } from 'react';
import { Form, Input, Button, Typography, message, Card } from 'antd';
import {
  UserOutlined,
  LockOutlined,
  ScheduleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../services/apiClient';
import './LoginForm.css';

const { Title, Text, Paragraph } = Typography;
// ใช้ apiClient (baseURL + interceptors) แทนการเรียก axios ตรง

const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form] = Form.useForm();

  // ดึง path ที่ user พยายามจะเข้าถึง; ถ้าไม่มีให้ใช้ /login เป็นค่าเริ่มต้น
  const from = location.state?.from?.pathname || '/login';

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // เพิ่ม redirectPath ใน request body
      const loginData = {
        ...values,
        redirectPath: from !== '/login' ? from : undefined
      };
      
      const response = await apiClient.post('/auth/login', loginData);

      const { success, token, finalRedirectPath, ...userData } = response.data;

      if (success) {
        // รวมข้อมูลผู้ใช้เพื่อเก็บใน context (กัน null/undefined)
        const loginSuccess = await login({
          token,
          userData: {
            studentID: userData.studentID || null,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            role: userData.role || '',
            ...userData,
          },
        });

        if (loginSuccess) {
          message.success('เข้าสู่ระบบสำเร็จ');

          // ใช้ finalRedirectPath จาก backend หรือ fallback ไปยัง dashboard
          let targetPath = finalRedirectPath || '/dashboard';

          // จัดการเส้นทางปลายทางตามบทบาทผู้ใช้ (เฉพาะกรณีที่เป็น dashboard)
          if (targetPath === '/dashboard') {
            const role = userData.role;
            const teacherType = userData.teacherType;

            if (role === 'admin' || (role === 'teacher' && teacherType === 'support')) {
              targetPath = '/admin/dashboard';
            } else if (role === 'teacher') {
              targetPath = '/dashboard';
            } else if (role === 'student') {
              targetPath = '/dashboard';
            } else {
              targetPath = '/dashboard';
            }
          }

          navigate(targetPath, { replace: true });
        }
      }
    } catch (error) {

      const errorMessage = error.response?.data?.message || 'ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่อีกครั้ง';
      console.log('=== Showing error message:', errorMessage);
      
      message.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-background" aria-hidden="true">
        <div className="login-gradient" />
        <div className="login-circle login-circle--one" />
        <div className="login-circle login-circle--two" />
      </div>

      <div className="login-layout">
        <div className="login-brand-panel">
          <div className="login-brand-header">
            <img src="/logo.svg" alt="CS Logbook" className="school-logo" />
            <Title level={1} className="login-brand-title">
              CS Logbook
            </Title>
            <Paragraph className="login-brand-description">
              ระบบบันทึกและติดตามการฝึกงาน โครงงานพิเศษและปริญญานิพนธ์สำหรับนักศึกษา อาจารย์ และเจ้าหน้าที่ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
            </Paragraph>
          </div>

          <div className="login-brand-highlights">
            <div className="login-highlight">
              <div className="login-highlight-icon">
                <ScheduleOutlined />
              </div>
              <div>
                <Text className="login-highlight-title">อัปเดตสถานะฝึกงานเรียลไทม์</Text>
                <Text type="secondary">ดูความคืบหน้าจากทุกบันทึกที่ส่งและสถานะการอนุมัติได้ในหน้าเดียว</Text>
              </div>
            </div>

            <div className="login-highlight">
              <div className="login-highlight-icon">
                <TeamOutlined />
              </div>
              <div>
                <Text className="login-highlight-title">ทำงานร่วมกันได้ราบรื่น</Text>
                <Text type="secondary">อาจารย์ที่ปรึกษาและเจ้าหน้าที่สามารถตรวจสอบอนุมัติได้ทันที</Text>
              </div>
            </div>
          </div>

          <div className="login-brand-footer">
            <Text type="secondary">ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ • คณะวิทยาศาสตร์ประยุกต์ • มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</Text>
          </div>
        </div>

        <Card className={`login-card ${errorShake ? 'shake' : ''}`} variant={false}>
          <div className="login-form-header">
            <Title level={3} className="login-title">
              ลงชื่อเข้าใช้ระบบ
            </Title>
            <Text className="login-subtitle">โปรดใช้บัญชี ICIT Account ของท่านในการเข้าสู่ระบบ</Text>
          </div>

          <Form form={form} onFinish={handleSubmit} layout="vertical" className="login-form">
            <Form.Item
              name="username"
              className="login-form-item"
              rules={[{ required: true, message: 'กรุณากรอก ICIT Account' }]}
            >
              <Input
                className="login-input"
                prefix={<UserOutlined />}
                placeholder="ICIT Account"
                size="large"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              className="login-form-item"
              rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
            >
              <Input.Password
                className="login-input"
                prefix={<LockOutlined />}
                placeholder="รหัสผ่าน"
                size="large"
                autoComplete="current-password"
                onPressEnter={() => form.submit()}
              />
            </Form.Item>

            <Form.Item>
              <Button
                className="login-button"
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

          <div className="login-help">
            <Text type="secondary">ต้องการความช่วยเหลือ?</Text>{' '}
            <Typography.Link href="mailto:natee.p@sci.kmutnb.ac.th">ติดต่อเจ้าหน้าที่ระบบ</Typography.Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;