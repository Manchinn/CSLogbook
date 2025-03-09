import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Statistic, Space, Button, message, Tooltip, Badge, Descriptions } from 'antd';
import { UserOutlined, ProjectOutlined, BookOutlined, CheckCircleOutlined, ClockCircleOutlined, UploadOutlined, FileTextOutlined, FormOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { adminService } from '../../services/adminService';
import { teacherService } from '../../services/teacherService';
import { studentService } from '../../services/studentService';
import moment from 'moment';

const API_URL = process.env.REACT_APP_API_URL;

if (!API_URL) {
  throw new Error('REACT_APP_API_URL is not defined in environment variables');
}

function Dashboard() {
  const { userData } = useAuth();

  function AdminView() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
      students: {
        total: 0,
        internshipEligible: 0, 
        projectEligible: 0
      },
      documents: {
        total: 0,
        pending: 0
      },
      system: {
        onlineUsers: 0,
        lastUpdate: null
      }
    });

    useEffect(() => {
      const fetchStats = async () => {
        try {
          const data = await adminService.getStats();
          setStats(data);
        } catch (error) {
          console.error('Error fetching stats:', error);
          message.error('ไม่สามารถโหลดข้อมูลสถิติได้');
        } finally {
          setLoading(false);
        }
      };

      fetchStats();
    }, []);

    const statsCards = [
      {
        title: 'นักศึกษาทั้งหมด',
        value: stats.students.total,
        icon: <UserOutlined />,
        color: '#1890ff',
        onClick: () => navigate('/students')
      },
      {
        title: 'มีสิทธิ์ฝึกงาน',
        value: stats.students.internshipEligible,
        icon: <BookOutlined />,
        color: '#52c41a',
        onClick: () => navigate('/students?filter=internship')
      },
      {
        title: 'มีสิทธิ์ทำโครงงาน', 
        value: stats.students.projectEligible,
        icon: <ProjectOutlined />,
        color: '#722ed1',
        onClick: () => navigate('/students?filter=project')
      }
    ];

    return (
      <div className="admin-dashboard">
        <Space direction="vertical" size="large" className="common-space-style">
          <Alert
            message={`สวัสดี ผู้ดูแลระบบ ${userData.firstName} ${userData.lastName}`}
            type="info"
            showIcon
            className="common-alert-style"
          />
          
          <Row gutter={[16, 16]}>
            {statsCards.map((card, index) => (
              <Col xs={24} sm={8} key={index}>
                <Card 
                  hoverable 
                  onClick={card.onClick}
                  className="stats-card"
                >
                  <Statistic
                    title={card.title}
                    value={card.value}
                    prefix={card.icon}
                    valueStyle={{ color: card.color }}
                    loading={loading}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card>
                <Statistic
                  title="เอกสารรอดำเนินการ"
                  value={stats.documents.pending}
                  suffix={`/ ${stats.documents.total}`}
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card>
                <Statistic
                  title="ผู้ใช้งานออนไลน์"
                  value={stats.system.onlineUsers}
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<UserOutlined />}
                />
                <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>
                  อัพเดทล่าสุด: {moment(stats.system.lastUpdate).format('HH:mm:ss')}
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Button 
                type="primary" 
                icon={<UploadOutlined />}
                onClick={() => navigate('/admin/upload')}
                block
              >
                อัปโหลดข้อมูลนักศึกษา (CSV)
              </Button>
            </Col>
            <Col xs={24} md={12}>
              <Button 
                type="default"
                icon={<FileTextOutlined />}
                onClick={() => navigate('/document-management/internship')}
                block
              >
                จัดการเอกสาร
                {stats.documents.pending > 0 && (
                  <Badge 
                    count={stats.documents.pending} 
                    style={{ marginLeft: 8 }}
                  />
                )}
              </Button>
            </Col>
          </Row>
        </Space>
      </div>
    );
  }

  function TeacherView() {
    const [loading, setLoading] = useState(true);
    const [teacherStats, setTeacherStats] = useState({
      totalStudents: 0,
      pendingActions: 0
    });

    useEffect(() => {
      const fetchTeacherStats = async () => {
        try {
          const data = await teacherService.getStats();
          setTeacherStats(data);
        } catch (error) {
          console.error('Error fetching teacher stats:', error);
          message.error('ไม่สามารถโหลดข้อมูลสถิติได้');
        } finally {
          setLoading(false);
        }
      };

      fetchTeacherStats();
    }, []);

    return (
      <div className="teacher-dashboard">
        <Row gutter={[16, 16]} className="stats-row">
          <Col xs={24} sm={12}>
            <Card hoverable className="stats-card">
              <Statistic
                title="นักศึกษาในที่ปรึกษา"
                value={teacherStats.totalStudents}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
                loading={loading}
              />
              <p>จำนวนนักศึกษาที่ดูแล</p>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card hoverable className="stats-card">
              <Statistic
                title="รายการที่ต้องดำเนินการ"
                value={teacherStats.pendingActions}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#faad14' }}
                loading={loading}
              />
              <p>รายการรอดำเนินการ</p>
            </Card>
          </Col>
        </Row>
      </div>
    );
  }

  function StudentView() {
    const { userData } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [eligibilityData, setEligibilityData] = useState(null);

    useEffect(() => {
      const fetchEligibility = async () => {
        // ตรวจสอบว่ามี userData และ studentCode ก่อน
        if (!userData || !userData.studentCode) {
          setError(new Error('ไม่พบข้อมูลนักศึกษา'));
          setLoading(false);
          return;
        }

        try {
          console.log('Fetching data for:', userData.studentCode);
          const response = await studentService.getStudentInfo(userData.studentCode);
          
          console.log('Backend response:', response);
          
          // ตรวจสอบ success flag จาก backend
          if (!response.success || !response.data) {
            throw new Error(response.message || 'ไม่พบข้อมูลจากเซิร์ฟเวอร์');
          }

          const formattedData = {
            studentCode: response.data.studentCode,
            totalCredits: response.data.totalCredits,
            majorCredits: response.data.majorCredits,
            studentYear: response.data.eligibility.studentYear,
            isEligibleInternship: response.data.eligibility.internship.eligible,
            isEligibleProject: response.data.eligibility.project.eligible,
            messages: {
              internship: response.data.eligibility.internship.message,
              project: response.data.eligibility.project.message
            }
          };
          
          setEligibilityData(formattedData);
          
        } catch (err) {
          console.error('Error:', err);
          setError(err);
          message.error(err.message || 'ไม่สามารถโหลดข้อมูลได้');
        } finally {
          setLoading(false);
        }
      };

      fetchEligibility();
    }, [userData]); // เปลี่ยน dependency เป็น userData

    if (loading) {
      return (
        <div className="student-dashboard">
          <Space direction="vertical" size="large">
            <Alert message="กำลังโหลดข้อมูล..." type="info" showIcon />
          </Space>
        </div>
      );
    }

    if (error) {
      return (
        <div className="student-dashboard">
          <Space direction="vertical" size="large">
            <Alert message="เกิดข้อผิดพลาด" description={error.message} type="error" showIcon />
          </Space>
        </div>
      );
    }

    return (
      <div className="student-dashboard">
        <Space direction="vertical" size="large" className="common-space-style">
          <Alert
            message={`สวัสดี ${userData.firstName} ${userData.lastName}`}
            description={`รหัสนักศึกษา: ${userData.studentCode}`}
            type="info"
            showIcon
          />

          <Row gutter={[16, 16]}>
            {/* สถานะการฝึกงาน */}
            <Col xs={24} sm={12}>
              <Card hoverable className="eligibility-card">
                <Statistic
                  title="สถานะการฝึกงาน"
                  value={eligibilityData?.isEligibleInternship ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                  valueStyle={{ 
                    color: eligibilityData?.isEligibleInternship ? '#52c41a' : '#ff4d4f' 
                  }}
                  prefix={eligibilityData?.isEligibleInternship ? 
                    <CheckCircleOutlined /> : 
                    <ClockCircleOutlined />
                  }
                />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="หน่วยกิตรวม">
                    {eligibilityData?.totalCredits || 0} หน่วยกิต
                  </Descriptions.Item>
                  <Descriptions.Item label="สถานะ">
                    {eligibilityData?.messages?.internship || 'ตรวจสอบหน่วยกิตและชั้นปี'}
                  </Descriptions.Item>
                </Descriptions>
                {eligibilityData?.isEligibleInternship && (
                  <Button 
                    type="primary" 
                    icon={<FormOutlined />}
                    onClick={() => navigate('/internship')}
                    style={{ marginTop: '16px' }}
                  >
                    จัดการฝึกงาน
                  </Button>
                )}
              </Card>
            </Col>

            {/* สถานะโครงงาน */}
            <Col xs={24} sm={12}>
              <Card hoverable className="eligibility-card">
                <Statistic
                  title="สถานะโครงงาน"
                  value={eligibilityData?.isEligibleProject ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                  valueStyle={{ 
                    color: eligibilityData?.isEligibleProject ? '#52c41a' : '#ff4d4f' 
                  }}
                  prefix={eligibilityData?.isEligibleProject ? 
                    <CheckCircleOutlined /> : 
                    <ClockCircleOutlined />
                  }
                />
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="ชั้นปี">
                    {eligibilityData?.studentYear?.year || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="หน่วยกิตรวม">
                    {eligibilityData?.totalCredits || 0} หน่วยกิต
                  </Descriptions.Item>
                  <Descriptions.Item label="หน่วยกิตเฉพาะ">
                    {eligibilityData?.majorCredits || 0} หน่วยกิต
                  </Descriptions.Item>
                  <Descriptions.Item label="สถานะ">
                    {eligibilityData?.messages?.project || 'ตรวจสอบหน่วยกิตและชั้นปี'}
                  </Descriptions.Item>
                </Descriptions>
                {eligibilityData?.isEligibleProject && (
                  <Button 
                    type="primary" 
                    icon={<ProjectOutlined />}
                    onClick={() => navigate('/project')}
                    style={{ marginTop: '16px' }}
                  >
                    จัดการโครงงาน
                  </Button>
                )}
              </Card>
            </Col>
          </Row>

          <Card title="ข้อมูลการศึกษา">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="หน่วยกิตรวม">
                {eligibilityData?.totalCredits || 0}
              </Descriptions.Item>
              <Descriptions.Item label="หน่วยกิตเฉพาะ">
                {eligibilityData?.majorCredits || 0}
              </Descriptions.Item>
              <Descriptions.Item label="ชั้นปี">
                {eligibilityData?.studentYear?.year || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="ประเภทการศึกษา">
                {userData.studyType === 'regular' ? 'ภาคปกติ' : 'ภาคพิเศษ'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Space>
      </div>
    );
  }

  function renderDashboard() {
    switch (userData?.role) {
      case 'admin':
        return <AdminView />;
      case 'teacher':
        return <TeacherView />;
      case 'student':
        return <StudentView />;
      default:
        return (
          <Alert
            message="ไม่พบข้อมูล"
            description="ไม่พบข้อมูลสำหรับแสดงผล"
            type="warning"
            showIcon
          />
        );
    }
  }

  return (
    <div className="dashboard-container">
      {renderDashboard()}
    </div>
  );
}

export default Dashboard;