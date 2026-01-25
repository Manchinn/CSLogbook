import React, { useState, useEffect } from 'react';
import { Typography, Button, Card, Spin, message, Input, Form, Divider } from 'antd';
import {
  LoginOutlined,
  ScheduleOutlined,
  TeamOutlined,
  SafetyOutlined,
  UserOutlined,
  LockOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import authService from '../../services/authService';
import styles from './LoginForm.module.css';

const { Title, Text, Paragraph } = Typography;

/**
 * LoginForm - หน้า Login ที่ redirect ไป KMUTNB SSO
 */
const LoginForm = () => {
  const { isAuthenticated, login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [ssoEnabled, setSsoEnabled] = useState(true);
  const [checkingSSO, setCheckingSSO] = useState(true);
  // formData ไม่ต้องใช้แล้วเพราะใช้ Ant Design Form
  const [showDevLogin, setShowDevLogin] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        const response = await authService.checkSSOStatus();
        setSsoEnabled(response.ssoEnabled);
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
    const errorParam = params.get('error');
    
    const errorMessages = {
      'sso_error': 'เกิดข้อผิดพลาดจากระบบ KMUTNB SSO',
      'invalid_state': 'Session หมดอายุ กรุณาลองใหม่อีกครั้ง',
      'no_code': 'ไม่ได้รับรหัสยืนยันจากระบบ SSO',
      'token_error': 'ไม่สามารถยืนยันตัวตนได้',
      'userinfo_error': 'ไม่สามารถดึงข้อมูลผู้ใช้ได้',
      'server_error': 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์'
    };

    if (errorParam) {
      const msg = errorMessages[errorParam] || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ';
      setError(msg);
      message.error(msg);
      
      // ลบ error param ออกจาก URL
      window.history.replaceState({}, '', '/login');
    }
  }, [location.search]);

  /**
   * Redirect ไป KMUTNB SSO
   */
  const handleSSOLogin = () => {
    setIsLoading(true);
    
    // สร้าง redirect URL พร้อม path ที่ต้องการกลับไปหลัง login
    const redirectPath = from !== '/login' ? from : '/dashboard';
    const ssoUrl = `${process.env.REACT_APP_API_URL}/auth/sso/authorize?redirectPath=${encodeURIComponent(redirectPath)}`;
    
    // Redirect ไป SSO
    window.location.href = ssoUrl;
  };

  const handleDevLogin = async (values) => {
    setError('');
    setIsLoading(true);

    try {
      const result = await authService.login(values);

      if (result.success) {
        // ใช้ logic เดียวกับ SSOCallback ในการ login
        const userData = {
          userId: result.userId,
          role: result.role,
          studentId: result.studentID, // Note: API returns studentID or teacherId
          teacherId: result.teacherId,
          teacherType: result.teacherType,
          firstName: result.firstName,
          lastName: result.lastName,
          email: result.email,
          isSystemAdmin: result.isSystemAdmin
        };
        
        await login({
          token: result.token,
          userData
        });
        
        // Redirect logic based on role
        let targetPath = result.redirectPath || '/dashboard';
        
        // ถ้าเป็น Admin หรือ เจ้าหน้าที่ (Teacher Type = support) ให้ไป Admin Dashboard
        if (userData.role === 'admin' || (userData.role === 'teacher' && userData.teacherType === 'support')) {
           // ถ้า targetPath ไม่ใช่ path เฉพาะเจาะจง (เช่น มาจาก link) ให้ไป admin dashboard
           if (targetPath === '/dashboard' || targetPath === '/') {
             targetPath = '/admin/dashboard';
           }
        }
        
        navigate(targetPath);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ';
      setError(msg);
      message.error(msg);
    } finally {
      setIsLoading(false);
    }
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
              {showDevLogin ? 'เข้าสู่ระบบ (Dev)' : 'ลงชื่อเข้าใช้ระบบ'}
            </Title>
            <Text className={styles.subtitle}>
              {showDevLogin ? 'สำหรับผู้ดูแลระบบและทดสอบระบบ' : 'เข้าสู่ระบบด้วยบัญชี KMUTNB (ICIT Account) ของท่าน'}
            </Text>
          </div>

          <div className={styles.ssoSection}>
            
            {!showDevLogin ? (
              <>
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
                  loading={isLoading}
                  disabled={!ssoEnabled}
                  onClick={handleSSOLogin}
                  block
                  size="large"
                >
                  {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบด้วย KMUTNB SSO'}
                </Button>

                {!ssoEnabled && (
                  <div className={styles.ssoDisabled}>
                    <Text type="danger">
                      ระบบ SSO ไม่พร้อมใช้งาน กรุณาติดต่อผู้ดูแลระบบ
                    </Text>
                  </div>
                )}
                
                <Divider plain style={{ margin: '20px 0', fontSize: '12px', color: '#999' }}>หรือ</Divider>
                
                <div style={{ textAlign: 'center' }}>
                    <Button 
                        type="link" 
                        size="small"
                        style={{ color: '#888' }}
                        onClick={() => setShowDevLogin(true)}
                    >
                        เข้าสู่ระบบด้วยชื่อผู้ใช้ (สำหรับทดสอบ)
                    </Button>
                </div>
              </>
            ) : (
                <Form
                    layout="vertical"
                    onFinish={handleDevLogin}
                    size="large"
                    className="dev-login-form"
                >
                    <Form.Item
                        name="username"
                        rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="ชื่อผู้ใช้" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="รหัสผ่าน" />
                    </Form.Item>
                    
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={isLoading}>
                            เข้าสู่ระบบ
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center' }}>
                        <Button 
                            type="link" 
                            icon={<ArrowLeftOutlined />} 
                            onClick={() => setShowDevLogin(false)}
                        >
                            กลับไปใช้ SSO
                        </Button>
                    </div>
                </Form>
            )}

            {!showDevLogin && (
                <div className={styles.ssoInfo}>
                <Text type="secondary" className={styles.ssoInfoText}>
                    ใช้บัญชีเดียวกับ email@kmutnb.ac.th หรือระบบ REG, LMS
                </Text>
                </div>
            )}
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