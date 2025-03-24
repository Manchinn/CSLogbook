import React from 'react';
import { Row, Col, Divider, Space, Tag } from 'antd';
import { getStatusTags } from '../utils/statusHelpers';

const StudentDetail = ({ student }) => {
  if (!student) return null;
  
  return (
    <div className="student-detail">
      {/* ข้อมูลพื้นฐาน */}
      <Divider orientation="left">ข้อมูลทั่วไป</Divider>
      <Row gutter={[16, 8]}>
        <Col span={24}>
          <p><strong>รหัสนักศึกษา:</strong> {student.studentCode}</p>
        </Col>
        <Col span={24}>
          <p><strong>ชื่อ-นามสกุล:</strong> {student.firstName} {student.lastName}</p>
        </Col>
        <Col span={24}>
          <p><strong>อีเมล:</strong> {student.email || '-'}</p>
        </Col>
      </Row>

      {/* ข้อมูลการศึกษา */}
      <Divider orientation="left">ข้อมูลการศึกษา</Divider>
      <Row gutter={[16, 8]}>
        <Col span={12}>
          <p><strong>หน่วยกิตสะสม:</strong> {student.totalCredits || 0}</p>
        </Col>
        <Col span={12}>
          <p><strong>หน่วยกิตภาควิชา:</strong> {student.majorCredits || 0}</p>
        </Col>
        
        <Col span={24}>
          <p><strong>ชั้นปี:</strong> {
            student.studentCode ? 
              (new Date().getFullYear() + 543) - parseInt(student.studentCode.substring(0, 2)) - 2500 :
              '-'
          }</p>
        </Col>
        
        {student.gpa && (
          <Col span={24}>
            <p><strong>เกรดเฉลี่ย:</strong> {student.gpa.toFixed(2)}</p>
          </Col>
        )}
      </Row>

      {/* ข้อมูลสถานะ */}
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