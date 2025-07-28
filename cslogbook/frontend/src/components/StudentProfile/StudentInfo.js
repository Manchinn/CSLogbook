import React, { useEffect } from "react";
import { Card, Row, Col, Statistic, Tag, Tooltip, Button } from "antd";
import { BookOutlined, ProjectOutlined } from "@ant-design/icons";
import {
  isEligibleForInternship,
  isEligibleForProject,
} from "../../utils/studentUtils";
import "./styles.css";

const StudentInfo = React.memo(({ student, onEdit, canEdit }) => {
  const [eligibility, setEligibility] = React.useState({
    internship: false,
    project: false,
  });

  useEffect(() => {
    if (student) {
      // รับค่าข้อกำหนดจาก backend ถ้ามี
      const internshipRequirements = student.requirements?.internship || null;
      const projectRequirements = student.requirements?.project || null;

      // ส่งพารามิเตอร์ครบถ้วนและถูกต้อง
      const internshipEligible = isEligibleForInternship(
        student.studentYear,
        student.totalCredits || 0,
        student.majorCredits || 0,
        internshipRequirements
      );

      const projectEligible = isEligibleForProject(
        student.studentYear,
        student.totalCredits || 0,
        student.majorCredits || 0,
        projectRequirements
      );

      setEligibility({
        internship: internshipEligible.eligible,
        project: projectEligible.eligible,
        internshipMessage: internshipEligible.message,
        projectMessage: projectEligible.message,
      });

      // Debug log
      console.log("Credits and Eligibility:", {
        totalCredits: student.totalCredits,
        majorCredits: student.majorCredits,
        studentYear: student.studentYear,
        internshipEligible,
        projectEligible,
      });
    }
  }, [student]);

  const getEligibilityMessage = (isEligible, type) => {
    // ใช้ข้อความจาก state หากมี
    if (type === "internship") {
      return (
        eligibility.internshipMessage ||
        (eligibility.internship
          ? "คุณมีสิทธิ์ฝึกงาน"
          : "คุณยังไม่มีสิทธิ์ฝึกงาน")
      );
    } else {
      return (
        eligibility.projectMessage ||
        (eligibility.project
          ? "คุณมีสิทธิ์ทำโครงงานพิเศษ"
          : "คุณยังไม่มีสิทธิ์ทำโครงงานพิเศษ")
      );
    }
  };

  return (
    <Card
      className="infoCard"
      title="ข้อมูลการศึกษา"
      extra={
        canEdit && (
          <Button type="primary" onClick={onEdit}>
            แก้ไขข้อมูล
          </Button>
        )
      }
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
      <Row style={{ marginTop: 12 }}>
        <Col span={12}>
          <Tooltip
            title={getEligibilityMessage(eligibility.internship, "internship")}
          >
            <Tag color={eligibility.internship ? "green" : "red"}>
              {eligibility.internship
                ? "มีสิทธิ์ฝึกงาน"
                : "ยังไม่มีสิทธิ์ฝึกงาน"}
            </Tag>
          </Tooltip>
        </Col>
        <Col span={12}>
          <Tooltip
            title={getEligibilityMessage(eligibility.project, "project")}
          >
            <Tag color={eligibility.project ? "green" : "red"}>
              {eligibility.project
                ? "มีสิทธิ์ทำโครงงานพิเศษ"
                : "ยังไม่มีสิทธิ์ทำโครงงานพิเศษ"}
            </Tag>
          </Tooltip>
        </Col>
      </Row>
    </Card>
  );
});

export default StudentInfo;
