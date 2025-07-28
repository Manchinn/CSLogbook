import React from 'react';
import { Row, Col, Card, Avatar, Tag, Tooltip, Space } from 'antd';
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import './styles.css';

const StudentAvatar = React.memo(({ student, studentYear }) => {
  const displayYear =
    typeof studentYear === "object"
      ? studentYear.year ?? '-' 
      : (studentYear ?? '-');

  // Debug log เพื่อตรวจสอบข้อมูล
  console.log('StudentAvatar Debug:', {
    student,
    studentYear,
    isEligibleInternship: student?.isEligibleInternship,
    isEnrolledInternship: student?.isEnrolledInternship,
    internshipStatus: student?.internshipStatus
  });

  // ฟังก์ชันตรวจสอบสถานะสิทธิ์การฝึกงาน
  const getInternshipEligibilityStatus = () => {
    // ใช้ข้อมูลจาก backend โดยตรง
    const isEligible = student?.isEligibleInternship; // มีสิทธิ์ฝึกงานหรือไม่
    const isEnrolled = student?.isEnrolledInternship; // ลงทะเบียนฝึกงานแล้วหรือไม่
    const status = student?.internshipStatus; // สถานะการฝึกงาน

    console.log('Eligibility Check:', {
      isEligible,
      isEnrolled,
      status
    });

    // ถ้าไม่มีสิทธิ์ฝึกงาน ไม่แสดง tag
    if (!isEligible) {
      console.log('No eligibility - not showing tag');
      return null;
    }

    // ถ้าลงทะเบียนแล้ว ตรวจสอบสถานะ
    if (isEnrolled) {
      if (status === 'completed') {
        return {
          color: 'green',
          text: 'ฝึกงานเสร็จสิ้น',
          tooltip: 'เสร็จสิ้นแล้ว'
        };
      } else if (status === 'in_progress') {
        return {
          color: 'blue',
          text: 'กำลังฝึกงาน',
          tooltip: 'กำลังดำเนินการ'
        };
      } else if (status === 'pending_approval') {
        return {
          color: 'orange',
          text: 'รออนุมัติการฝึกงาน',
          tooltip: 'ลงทะเบียนแล้ว รอการอนุมัติ'
        };
      } else {
        return {
          color: 'orange',
          text: 'ลงทะเบียนฝึกงานแล้ว',
          tooltip: 'ลงทะเบียนแล้ว รอเริ่มดำเนินการ'
        };
      }
    } else {
      // มีสิทธิ์แต่ยังไม่ได้ลงทะเบียน
      console.log('Eligible but not enrolled - showing gold tag');
      return {
        color: 'gold',
        text: 'มีสิทธิ์ฝึกงาน (ยังไม่ใช้งาน)',
        icon: <ClockCircleOutlined />,
        tooltip: 'มีสิทธิ์แล้ว แต่ยังไม่ได้ลงทะเบียนใช้งาน'
      };
    }
  };

  const internshipStatus = getInternshipEligibilityStatus();

  return (
    <Row gutter={[16, 24]}>
      <Col span={24}>
        <Card className="avatarCard">
          <Avatar size={120} icon={<UserOutlined />} />
          <h2 style={{ marginTop: 16 }}>
            {(student.firstName || student.lastName)
              ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
              : "ไม่ระบุชื่อ-นามสกุล"}
          </h2>
          <p>{student.studentCode}</p>
          <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
            <Tag color="blue">ชั้นปีที่ {displayYear}</Tag>
            {internshipStatus && (
              <Tooltip title={internshipStatus.tooltip}>
                <Tag 
                  color={internshipStatus.color}
                  icon={internshipStatus.icon}
                  style={{ fontSize: '12px', padding: '4px 8px' }}
                >
                  {internshipStatus.text}
                </Tag>
              </Tooltip>
            )}
          </Space>
        </Card>
      </Col>
      <Col span={24}>
        <Card title="ข้อมูลติดต่อ">
          <p>
            <strong>อีเมล:</strong> {(student.email && student.email.trim()) ? student.email : "ไม่ระบุอีเมล"}
          </p>
        </Card>
      </Col>
    </Row>
  );
});

export default StudentAvatar;