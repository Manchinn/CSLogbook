import React from 'react';
import { Card, Row, Col, Statistic, Alert, Space, Button } from 'antd';
import { UserOutlined, ProjectOutlined, TeamOutlined } from '@ant-design/icons';
import './Dashboard.css';

const AdminDashboard = ({ userData, studentStats, loading, navigate }) => {
  return (
    <Space direction="vertical" size="large" className="common-space-style">
      <Alert
        message={`สวัสดี ผู้ดูแลระบบ ${userData.firstName} ${userData.lastName}`}
        type="info"
        showIcon
        className="common-alert-style"
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/students')} className="common-card-style">
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
          <Card hoverable onClick={() => navigate('/students')} className="common-card-style">
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
          <Card hoverable onClick={() => navigate('/students')} className="common-card-style">
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
            className="ant-btn-primary"
          >
            อัปโหลดข้อมูลนักศึกษา (CSV)
          </Button>
        </Col>
      </Row>
    </Space>
  );
};

export default AdminDashboard;
