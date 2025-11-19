import React from 'react';
import { Row, Col, Divider, Space, Tag, Empty } from 'antd';
import { getStatusTags } from '../utils/statusHelpers';

import styles from '../StudentList.module.css';

const StudentDetail = ({ student }) => {
  // ถ้าไม่มีข้อมูลนักศึกษา
  if (!student) {
    return <Empty description="ไม่พบข้อมูลนักศึกษา" />;
  }

  return (
    <div className={styles.studentDetail}>
      {/* ข้อมูลพื้นฐาน */}
      <Divider orientation="left">ข้อมูลทั่วไป</Divider>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <p><strong>รหัสนักศึกษา:</strong> {student.studentCode || '-'}</p>
        </Col>
        <Col span={24}>
          <p><strong>ชื่อ-นามสกุล:</strong> {`${student.firstName || ''} ${student.lastName || ''}`}</p>
        </Col>
        <Col span={24}>
          <p><strong>อีเมล:</strong> {student.email || '-'}</p>
        </Col>
      </Row>
      
      {/* ข้อมูลการศึกษา */}
      <Divider orientation="left">ข้อมูลการศึกษา</Divider>
      <Row gutter={[16, 8]}>
        <Col span={12}>
          <p><strong>หน่วยกิตรวม:</strong> {student.totalCredits || 0}</p>
        </Col>
        <Col span={12}>
          <p><strong>หน่วยกิตภาควิชา:</strong> {student.majorCredits || 0}</p>
        </Col>
      </Row>
      
      {/* สถานะการมีสิทธิ์ */}
      <Divider orientation="left">สถานะการมีสิทธิ์</Divider>
      <Row>
        <Col span={24}>
          <Space size={4} wrap>
            {getStatusTags(student).map((tag, index) => (
              <Tag color={tag.color} key={index}>
                {tag.text}
              </Tag>
            ))}
          </Space>
        </Col>
      </Row>
    </div>
  );
};

export default StudentDetail;