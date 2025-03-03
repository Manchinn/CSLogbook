import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Card, Row, Col, Statistic, Alert, Space, Button } from 'antd';
import { UserOutlined, ProjectOutlined, TeamOutlined } from '@ant-design/icons';
import './Dashboard.css';

const AdminDashboard = React.memo(({ userData, studentStats, loading, navigate }) => {
  const handleCardClick = React.useCallback((route) => {
    navigate(route);
  }, [navigate]);

  const statsCards = useMemo(() => [
    {
      title: "จำนวนนักศึกษา",
      value: studentStats.total,
      icon: <TeamOutlined />,
      suffix: "คน"
    },
    {
      title: "มีสิทธิ์ฝึกงาน",
      value: studentStats.internshipEligible,
      icon: <UserOutlined />,
      suffix: `/${studentStats.total} คน`
    },
    {
      title: "มีสิทธิ์ทำโปรเจค",
      value: studentStats.projectEligible,
      icon: <ProjectOutlined />,
      suffix: `/${studentStats.total} คน`
    }
  ], [studentStats]);

  return (
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
              onClick={() => handleCardClick('/students')} 
              className="common-card-style"
            >
              <Statistic
                title={card.title}
                value={card.value}
                loading={loading}
                prefix={card.icon}
                suffix={card.suffix}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Button 
            type="primary" 
            icon={<TeamOutlined />} 
            onClick={() => navigate('/admin/upload')} 
            block
            className="ant-btn-primary"
          >
            อัปโหลดข้อมูลนักศึกษา (CSV)
          </Button>
        </Col>
      </Row>
    </Space>
  );
});

AdminDashboard.propTypes = {
  userData: PropTypes.shape({
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired
  }).isRequired,
  studentStats: PropTypes.shape({
    total: PropTypes.number.isRequired,
    internshipEligible: PropTypes.number.isRequired,
    projectEligible: PropTypes.number.isRequired
  }).isRequired,
  loading: PropTypes.bool.isRequired,
  navigate: PropTypes.func.isRequired
};

export default AdminDashboard;
