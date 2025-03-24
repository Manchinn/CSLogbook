import React, { useEffect } from 'react';
import { Card, Row, Col, Statistic, Tag, Tooltip, Button } from 'antd';
import { BookOutlined, ProjectOutlined } from '@ant-design/icons';
import { isEligibleForInternship, isEligibleForProject } from "../../utils/studentUtils";
import './styles.css';

const StudentInfo = React.memo(({ student, onEdit, canEdit }) => {
  const [eligibility, setEligibility] = React.useState({
    internship: false,
    project: false
  });

  useEffect(() => {
    if (student) {
      const internshipEligible = isEligibleForInternship(student.totalCredits, student.majorCredits);
      const projectEligible = isEligibleForProject(student.totalCredits, student.majorCredits);
      
      setEligibility({
        internship: internshipEligible,
        project: projectEligible
      });

      console.log('Credits:', {
        total: student.totalCredits,
        major: student.majorCredits,
        isEligibleInternship: internshipEligible,
        isEligibleProject: projectEligible
      });
    }
  }, [student]);

  const getMessageString = (message) => {
    if (!message) return "ไม่พบข้อความ";
    if (typeof message === "object") {
      console.log("Message object:", message);
      return message.message || "ไม่พบข้อความ";
    }
    return message;
  };

  const getEligibilityMessage = (isEligible, type) => {
    const eligible = type === 'internship' ? eligibility.internship : eligibility.project;
    
    if (eligible) {
      return type === 'internship' 
        ? getMessageString(student.internshipMessage) || "คุณมีสิทธิ์ฝึกงาน"
        : getMessageString(student.projectMessage) || "คุณมีสิทธิ์ทำโครงงานพิเศษ";
    }
    return type === 'internship'
      ? getMessageString(student.internshipMessage) || "คุณยังไม่มีสิทธิ์ฝึกงาน"
      : getMessageString(student.projectMessage) || "คุณยังไม่มีสิทธิ์ทำโครงงานพิเศษ";
  };

  return (
    <Card className='infoCard'
      title="ข้อมูลการศึกษา"
      extra={canEdit && <Button type="primary" onClick={onEdit}>แก้ไขข้อมูล</Button>}
    >
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Statistic
            title="หน่วยกิตรวมสะสม"
            value={student.totalCredits || 0}
            suffix="หน่วยกิต"
            prefix={<BookOutlined />}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="หน่วยกิตภาควิชา"
            value={student.majorCredits || 0}
            suffix="หน่วยกิต"
            prefix={<ProjectOutlined />}
          />
        </Col>
      </Row>
      <Row style={{ marginTop: 24 }}>
        <Col span={12}>
          <Tooltip title={getEligibilityMessage(eligibility.internship, 'internship')}>
            <Tag color={eligibility.internship ? "green" : "red"}>
              {eligibility.internship ? "มีสิทธิ์ฝึกงาน" : "ยังไม่มีสิทธิ์ฝึกงาน"}
            </Tag>
          </Tooltip>
        </Col>
        <Col span={12}>
          <Tooltip title={getEligibilityMessage(eligibility.project, 'project')}>
            <Tag color={eligibility.project ? "green" : "red"}>
              {eligibility.project ? "มีสิทธิ์ทำโครงงานพิเศษ" : "ยังไม่มีสิทธิ์ทำโครงงานพิเศษ"}
            </Tag>
          </Tooltip>
        </Col>
      </Row>
    </Card>
  );
});

export default StudentInfo;