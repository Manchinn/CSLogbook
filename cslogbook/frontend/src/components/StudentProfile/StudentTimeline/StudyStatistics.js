import React from 'react';
import { Card, Row, Col, Statistic } from 'antd';

// คอมโพเนนต์สำหรับแสดงสถิติการศึกษา
const StudyStatistics = ({ student }) => {
  return (
    <Card title="สถานะการศึกษา">
      <Row gutter={16}>
        <Col xs={12} md={6}>
          <Statistic 
            title="หน่วยกิตสะสม" 
            value={student.totalCredits} 
            suffix="/ 127" 
            valueStyle={{ color: '#1890ff' }}
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic 
            title="หน่วยกิตภาควิชา" 
            value={student.majorCredits} 
            suffix="/ 57" 
            valueStyle={{ color: student.majorCredits >= 57 ? '#52c41a' : '#faad14' }}
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic 
            title="การฝึกงาน" 
            value={student.internshipStatus === 'completed' ? 'ผ่าน' : 'ไม่ผ่าน'} 
            valueStyle={{ color: student.internshipStatus === 'completed' ? '#52c41a' : '#faad14' }}
          />
        </Col>
        <Col xs={12} md={6}>
          <Statistic 
            title="โครงงานพิเศษ" 
            value={student.projectStatus === 'completed' ? 'ผ่าน' : 'ไม่ผ่าน'} 
            valueStyle={{ color: student.projectStatus === 'completed' ? '#52c41a' : '#faad14' }}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default StudyStatistics;