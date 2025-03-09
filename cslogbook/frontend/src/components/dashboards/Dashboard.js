import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Statistic, Space, Button, message, Tooltip } from 'antd';
import { UserOutlined, ProjectOutlined, BookOutlined, CheckCircleOutlined, ClockCircleOutlined, UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import { useStudentEligibility } from '../../hooks/useStudentEligibility';

function Dashboard() {
  const { userData } = useAuth();

  function AdminView() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
      totalStudents: 0,
      internshipEligible: 0,
      projectEligible: 0
    });

    // Fetch stats when component mounts
    useEffect(() => {
      const fetchStats = async () => {
        try {
          const response = await axios.get('/api/admin/stats');
          setStats(response.data);
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
        value: stats.totalStudents,
        icon: <UserOutlined />,
        color: '#1890ff',
        onClick: () => navigate('/students')
      },
      {
        title: 'นักศึกษาที่มีสิทธิ์ฝึกงาน',
        value: stats.internshipEligible,
        icon: <BookOutlined />,
        color: '#52c41a',
        onClick: () => navigate('/students?filter=internship')
      },
      {
        title: 'นักศึกษาที่มีสิทธิ์ทำโครงงาน',
        value: stats.projectEligible,
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
              </Button>
            </Col>
          </Row>

          <Card title="กิจกรรมล่าสุด" className="activity-card">
            {/* Add recent activities here */}
          </Card>
        </Space>
      </div>
    );
  }

  function TeacherView() {
    return (
      <div className="teacher-dashboard">
        <Row gutter={[16, 16]} className="stats-row">
          <Col xs={24} sm={12}>
            <Card hoverable className="stats-card">
              <Statistic
                title="นักศึกษาในที่ปรึกษา"
                value={0}
                prefix={<UserOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
              <p>จำนวนนักศึกษาที่ดูแล</p>
            </Card>
          </Col>
          <Col xs={24} sm={12}>
            <Card hoverable className="stats-card">
              <Statistic
                title="รายการที่ต้องดำเนินการ"
                value={0}
                prefix={<BookOutlined />}
                valueStyle={{ color: '#faad14' }}
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
    const { internshipStatus, projectStatus } = useStudentEligibility(userData);

    return (
      <div className="student-dashboard">
        <Space direction="vertical" size="large" className="common-space-style">
          <Alert
            message={`สวัสดี คุณ${userData.firstName} ${userData.lastName}`}
            description={`รหัสนักศึกษา: ${userData.studentCode}`}
            type="info"
            showIcon
            className="common-alert-style"
          />
          
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12}>
              <Card className="common-card-style">
                <Statistic
                  title="สถานะการฝึกงาน"
                  value={internshipStatus.value}
                  valueStyle={{ color: internshipStatus.color }}
                  prefix={internshipStatus.isEligible ? 
                    <CheckCircleOutlined /> : <ClockCircleOutlined />}
                />
                {internshipStatus.isEligible && (
                  <Button 
                    type="primary" 
                    onClick={() => navigate('/internship-terms')}
                    style={{ marginTop: '16px' }}
                  >
                    จัดการฝึกงาน
                  </Button>
                )}
                <Tooltip title={internshipStatus.message}>
                  <div style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(0,0,0,0.45)' }}>
                    หน่วยกิตรวม: {userData.totalCredits || 0}
                  </div>
                </Tooltip>
              </Card>
            </Col>

            <Col xs={24} sm={12}>
              <Card className="common-card-style">
                <Statistic
                  title="สถานะโครงงาน"
                  value={projectStatus.value}
                  valueStyle={{ color: projectStatus.color }}
                  prefix={projectStatus.isEligible ? 
                    <CheckCircleOutlined /> : <ClockCircleOutlined />}
                />
                {projectStatus.isEligible && (
                  <Button 
                    type="primary" 
                    onClick={() => navigate('/project-proposal')}
                    style={{ marginTop: '16px' }}
                  >
                    จัดการโครงงาน
                  </Button>
                )}
                <Tooltip title={projectStatus.message}>
                  <div style={{ marginTop: '8px', fontSize: '14px', color: 'rgba(0,0,0,0.45)' }}>
                    หน่วยกิตเฉพาะ: {userData.majorCredits || 0}
                  </div>
                </Tooltip>
              </Card>
            </Col>
          </Row>
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