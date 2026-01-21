import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Spin, message, Result, Button } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './SSOCallback.module.css';

/**
 * SSO Callback Page
 * รับ token จาก backend หลังจาก KMUTNB SSO login สำเร็จ
 */
const SSOCallback = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // ดึง parameters จาก URL
        const params = new URLSearchParams(location.search);
        const token = params.get('token');
        const redirectPath = params.get('redirectPath') || '/dashboard';
        const errorParam = params.get('error');

        // ตรวจสอบ error
        if (errorParam) {
          const errorMessages = {
            'sso_error': 'เกิดข้อผิดพลาดจากระบบ SSO',
            'invalid_state': 'Session หมดอายุ กรุณาลองใหม่อีกครั้ง',
            'no_code': 'ไม่ได้รับรหัสยืนยันจากระบบ SSO',
            'token_error': 'ไม่สามารถยืนยันตัวตนได้',
            'userinfo_error': 'ไม่สามารถดึงข้อมูลผู้ใช้ได้',
            'server_error': 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์'
          };
          setError(errorMessages[errorParam] || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
          setLoading(false);
          return;
        }

        // ตรวจสอบ token
        if (!token) {
          setError('ไม่พบ token สำหรับการเข้าสู่ระบบ');
          setLoading(false);
          return;
        }

        // Decode JWT เพื่อดึงข้อมูลผู้ใช้ (base64 decode payload)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
          setError('Token ไม่ถูกต้อง');
          setLoading(false);
          return;
        }

        // ฟังก์ชันสำหรับ Decode JWT ที่รองรับภาษาไทย (UTF-8)
        const parseJwt = (token) => {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
          } catch (e) {
            console.error('Error parsing JWT:', e);
            return {};
          }
        };

        const payload = parseJwt(token);

        console.log('SSO Callback - JWT Payload:', payload);

        // สร้าง userData จาก JWT payload ให้ครบตามที่ AuthContext ต้องการ
        const userData = {
          userId: payload.userId,
          role: payload.role,
          studentId: payload.studentId,
          studentCode: payload.studentCode || payload.studentID,
          firstName: payload.firstName,
          lastName: payload.lastName,
          email: payload.email,
          teacherId: payload.teacherId,
          teacherCode: payload.teacherCode,
          teacherType: payload.teacherType,
          teacherPosition: payload.teacherPosition,
          canAccessTopicExam: payload.canAccessTopicExam,
          canExportProject1: payload.canExportProject1,
          totalCredits: payload.totalCredits || 0,
          majorCredits: payload.majorCredits || 0,
          isEligibleForInternship: payload.isEligibleForInternship,
          isEligibleForProject: payload.isEligibleForProject,
          isSystemAdmin: payload.isSystemAdmin
        };

        // Login ผ่าน AuthContext
        const loginSuccess = await login({
          token,
          refreshToken: null, // SSO ไม่ใช้ refresh token ของระบบเรา
          userData
        });

        if (loginSuccess) {
          message.success('เข้าสู่ระบบสำเร็จ');

          // จัดการเส้นทางปลายทางตามบทบาทผู้ใช้
          let targetPath = redirectPath;
          if (targetPath === '/dashboard') {
            const role = payload.role;
            const teacherType = payload.teacherType;

            if (role === 'admin' || (role === 'teacher' && teacherType === 'support')) {
              targetPath = '/admin/dashboard';
            }
          }

          navigate(targetPath, { replace: true });
        } else {
          setError('ไม่สามารถเข้าสู่ระบบได้');
          setLoading(false);
        }

      } catch (err) {
        console.error('SSO Callback error:', err);
        setError('เกิดข้อผิดพลาดในการประมวลผล');
        setLoading(false);
      }
    };

    handleCallback();
  }, [location.search, login, navigate]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />} />
          <h2 className={styles.title}>กำลังเข้าสู่ระบบ...</h2>
          <p className={styles.subtitle}>กรุณารอสักครู่</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Result
          status="error"
          title="เข้าสู่ระบบไม่สำเร็จ"
          subTitle={error}
          extra={[
            <Button type="primary" key="retry" onClick={() => navigate('/login')}>
              กลับไปหน้าเข้าสู่ระบบ
            </Button>
          ]}
        />
      </div>
    );
  }

  return null;
};

export default SSOCallback;
