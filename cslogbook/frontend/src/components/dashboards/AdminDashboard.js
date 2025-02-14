import React from 'react';
import { Card, Row, Col, Statistic, Alert, Space, Button } from 'antd';
import { UserOutlined, ProjectOutlined, TeamOutlined } from '@ant-design/icons';

const AdminDashboard = ({ userData, studentStats, loading, navigate }) => {
  const commonCardStyle = {
    width: "100%",
    maxWidth: "90%",
    padding: 10,
    borderRadius: 10,
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    margin: "20px auto",
  };

  const commonAlertStyle = {
    width: "100%",
    maxWidth: "50%",
    marginLeft: "30px",
    borderRadius: '10px',
  };

  const commonSpaceStyle = {
    width: "100%",
    maxWidth: "90%",
    marginLeft: "30px",
  };

  return (
    <Space direction="vertical" size="large" style={commonSpaceStyle}>
      <Alert
        message={`สวัสดี ผู้ดูแลระบบ ${userData.firstName} ${userData.lastName}`}
        type="info"
        showIcon
        style={commonAlertStyle}
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/students')} style={commonCardStyle}>
            <Statistic
              title="จำนวนนักศึกษา"
              value={studentStats.total}
              loading={loading}
              prefix={<TeamOutlined />}
              suffix="คน"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/students')} style={commonCardStyle}>
            <Statistic
              title="มีสิทธิ์ฝึกงาน"
              value={studentStats.internshipEligible}
              loading={loading}
              prefix={<UserOutlined />}
              suffix={`/${studentStats.total} คน`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/students')} style={commonCardStyle}>
            <Statistic
              title="มีสิทธิ์ทำโปรเจค"
              value={studentStats.projectEligible}
              loading={loading}
              prefix={<ProjectOutlined />}
              suffix={`/${studentStats.total} คน`}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Button 
            type="primary" 
            icon={<TeamOutlined />} 
            onClick={() => navigate('/admin/upload')} 
            block
            style={{ height: '40px', fontSize: '16px' }}
          >
            อัปโหลดข้อมูลนักศึกษา (CSV)
          </Button>
        </Col>
      </Row>
    </Space>
  );
};

export default AdminDashboard;
