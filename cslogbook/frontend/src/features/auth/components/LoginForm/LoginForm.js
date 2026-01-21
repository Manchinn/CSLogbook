import React, { useState, useEffect } from 'react';
import { Typography, Button, Card, Spin, message } from 'antd';
import {
  LoginOutlined,
  ScheduleOutlined,
  TeamOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import apiClient from '../../../../services/apiClient';
import styles from './LoginForm.module.css';

const { Title, Text, Paragraph } = Typography;

/**
 * LoginForm - หน้า Login ที่ redirect ไป KMUTNB SSO
 */
const LoginForm = () => {
  const [loading, setLoading] = useState(false);
  const [ssoEnabled, setSsoEnabled] = useState(true);
  const [checkingSSO, setCheckingSSO] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  // ดึง path ที่ user พยายามจะเข้าถึง
  const from = location.state?.from?.pathname || '/dashboard';

  // ถ้า login แล้ว redirect ไป dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // ตรวจสอบสถานะ SSO
  useEffect(() => {
    const checkSSOStatus = async () => {
      try {
        const response = await apiClient.get('/auth/sso/status');
        setSsoEnabled(response.data.ssoEnabled);
      } catch (error) {
        console.error('Error checking SSO status:', error);
        setSsoEnabled(false);
      } finally {
        setCheckingSSO(false);
      }
    };

    checkSSOStatus();
  }, []);

  // ตรวจสอบ error จาก URL (กรณี SSO callback error)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const error = params.get('error');
    
    if (error) {
      const errorMessages = {
        'sso_error': 'เกิดข้อผิดพลาดจากระบบ KMUTNB SSO',
        'invalid_state': 'Session หมดอายุ กรุณาลองใหม่อีกครั้ง',
        'no_code': 'ไม่ได้รับรหัสยืนยันจากระบบ SSO',
        'token_error': 'ไม่สามารถยืนยันตัวตนได้',
        'userinfo_error': 'ไม่สามารถดึงข้อมูลผู้ใช้ได้',
        'server_error': 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์'
      };
      message.error(errorMessages[error] || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      
      // ลบ error param ออกจาก URL
      window.history.replaceState({}, '', '/login');
    }
  }, [location.search]);

  /**
   * Redirect ไป KMUTNB SSO
   */
  const handleSSOLogin = () => {
    setLoading(true);
    
    // สร้าง redirect URL พร้อม path ที่ต้องการกลับไปหลัง login
    const redirectPath = from !== '/login' ? from : '/dashboard';
    const ssoUrl = `${process.env.REACT_APP_API_URL}/auth/sso/authorize?redirectPath=${encodeURIComponent(redirectPath)}`;
    
    // Redirect ไป SSO
    window.location.href = ssoUrl;
  };

  if (checkingSSO) {
    return (
      <div className={styles.container}>
        <div className={styles.content} style={{ textAlign: 'center', padding: '60px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px', color: '#666' }}>กำลังตรวจสอบระบบ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.background} aria-hidden="true">
        <div className={styles.gradient} />
        <div className={`${styles.circle} ${styles.circleOne}`} />
        <div className={`${styles.circle} ${styles.circleTwo}`} />
      </div>

      <div className={styles.layout}>
        <div className={styles.brandPanel}>
          <div className={styles.brandHeader}>
            <img src="/logo.svg" alt="CS Logbook" className={styles.schoolLogo} />
            <Title level={1} className={styles.brandTitle}>
              CS Logbook
            </Title>
            <Paragraph className={styles.brandDescription}>
              ระบบบันทึกและติดตามการฝึกงาน โครงงานพิเศษและปริญญานิพนธ์สำหรับนักศึกษา อาจารย์ และเจ้าหน้าที่ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
            </Paragraph>
          </div>

          <div className={styles.brandHighlights}>
            <div className={styles.highlight}>
              <div className={styles.highlightIcon}>
                <SafetyOutlined />
              </div>
              <div>
                <Text className={styles.highlightTitle}>ล็อกอินด้วย KMUTNB SSO</Text>
                <Text type="secondary">เข้าสู่ระบบด้วยบัญชี ICIT Account เพียงครั้งเดียว ปลอดภัยด้วย Two-Factor Authentication</Text>
              </div>
            </div>

            <div className={styles.highlight}>
              <div className={styles.highlightIcon}>
                <ScheduleOutlined />
              </div>
              <div>
                <Text className={styles.highlightTitle}>อัปเดตสถานะฝึกงานเรียลไทม์</Text>
                <Text type="secondary">ดูความคืบหน้าจากทุกบันทึกที่ส่งและสถานะการอนุมัติได้ในหน้าเดียว</Text>
              </div>
            </div>

            <div className={styles.highlight}>
              <div className={styles.highlightIcon}>
                <TeamOutlined />
              </div>
              <div>
                <Text className={styles.highlightTitle}>ทำงานร่วมกันได้ราบรื่น</Text>
                <Text type="secondary">อาจารย์ที่ปรึกษาและเจ้าหน้าที่สามารถตรวจสอบอนุมัติได้ทันที</Text>
              </div>
            </div>
          </div>

          <div className={styles.brandFooter}>
            <Text type="secondary">ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ • คณะวิทยาศาสตร์ประยุกต์ • มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ</Text>
          </div>
        </div>

        <Card className={styles.card} variant={false}>
          <div className={styles.formHeader}>
            <Title level={3} className={styles.title}>
              ลงชื่อเข้าใช้ระบบ
            </Title>
            <Text className={styles.subtitle}>
              เข้าสู่ระบบด้วยบัญชี KMUTNB (ICIT Account) ของท่าน
            </Text>
          </div>

          <div className={styles.ssoSection}>
            {/* KMUTNB SSO Logo */}
            <div className={styles.ssoLogo}>
              <img 
                src="https://sso.kmutnb.ac.th/images/logo_kmutnb.png" 
                alt="KMUTNB" 
                className={styles.kmutnbLogo}
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>

            <Button
              className={styles.ssoButton}
              type="primary"
              icon={<LoginOutlined />}
              loading={loading}
              disabled={!ssoEnabled}
              onClick={handleSSOLogin}
              block
              size="large"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย KMUTNB SSO'}
            </Button>

            {!ssoEnabled && (
              <div className={styles.ssoDisabled}>
                <Text type="danger">
                  ระบบ SSO ไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ
                </Text>
              </div>
            )}

            <div className={styles.ssoInfo}>
              <Text type="secondary" className={styles.ssoInfoText}>
                ใช้บัญชีเดียวกับ email@kmutnb.ac.th หรือระบบ REG, LMS
              </Text>
            </div>
          </div>

          <div className={styles.help}>
            <Text type="secondary">ต้องการความช่วยเหลือ?</Text>{' '}
            <Typography.Link href="mailto:natee.p@sci.kmutnb.ac.th">ติดต่อเจ้าหน้าที่ระบบ</Typography.Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginForm;