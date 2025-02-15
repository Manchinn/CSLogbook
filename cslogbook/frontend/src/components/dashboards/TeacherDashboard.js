import React from 'react';
import { Card, Row, Col, Statistic, Alert, Space } from 'antd';
import { FileTextOutlined, ProjectOutlined, CheckCircleOutlined } from '@ant-design/icons';
import './Dashboard.css';

const TeacherDashboard = ({ userData, navigate }) => {
  return (
    <Space direction="vertical" size="large" className="common-space-style">
      <Alert
        message={`สวัสดี อาจารย์${userData.firstName} ${userData.lastName}`}
        type="info"
        showIcon
        className="common-alert-style"
      />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/review-documents')} className="common-card-style">
            <Statistic
              title="เอกสารรอตรวจสอบ"
              value={0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/advise-project')} className="common-card-style">
            <Statistic
              title="โปรเจคที่ปรึกษา"
              value={0}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable onClick={() => navigate('/approve-documents')} className="common-card-style">
            <Statistic
              title="รออนุมัติ"
              value={0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default TeacherDashboard;
