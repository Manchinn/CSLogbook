import React, { useState, useEffect } from "react";
import { Card, Steps, Tooltip, Typography } from "antd";
import {
  LaptopOutlined,
  ExperimentOutlined,
  BookOutlined,
  UserOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import { calculateMainProgress } from "./helpers";
import {
  getInternshipRequirements,
  getProjectRequirements,
} from "utils/studentUtils";
import { useInternshipStatus } from "contexts/InternshipStatusContext";
import { getProjectStateWithDeadlines } from "features/project/services/projectWorkflowStateService";

const { Step } = Steps;
const { Text } = Typography;

// คอมโพเนนต์สำหรับแสดงเส้นทางการศึกษาหลัก
const EducationPath = ({ student, progress }) => {
  const { internshipStatus } = useInternshipStatus();
  const [requirements, setRequirements] = useState({
    internship: null,
    project: null,
  });

  // State สำหรับข้อมูล workflow state
  const [workflowState, setWorkflowState] = useState(null);

  // ดึงข้อกำหนดจาก student object หรือ API
  useEffect(() => {
    if (student?.requirements) {
      setRequirements(student.requirements);
    }
  }, [student]);

  // ดึง project ID จากข้อมูลนักศึกษา
  const projectId = student?.projectId || progress?.project?.projectId;

  // ดึงข้อมูล workflow state เมื่อมี projectId
  useEffect(() => {
    const fetchWorkflowState = async () => {
      if (!projectId) return;

      try {
        const response = await getProjectStateWithDeadlines(projectId);
        if (response.success && response.data) {
          setWorkflowState(response.data);
        }
      } catch (error) {
        console.error('Error fetching workflow state in EducationPath:', error);
      }
    };

    fetchWorkflowState();
  }, [projectId]);

  // ใช้ utils function แทนการ hardcode
  const internshipReqs = getInternshipRequirements(requirements.internship);
  const projectReqs = getProjectRequirements(requirements.project);

  // คำนวณความพร้อมในการจบการศึกษา
  const totalCreditsRequired = student.totalCreditsRequired || 127;
  const majorCreditsRequired = student.majorCreditsRequired || 57;

  const isReadyToGraduate =
    student.totalCredits >= totalCreditsRequired &&
    student.majorCredits >= majorCreditsRequired &&
    student.internshipStatus === "completed" &&
    student.projectStatus === "completed";

  // คำนวณสถานะโครงงานพิเศษ (ใช้ workflow state ถ้ามี)
  const projectPhase = determineProjectPhase(student, workflowState);
  
  // ข้อมูลจากระบบเดิม (fallback)
  const overallStatus = progress?.project?.status || 'not_started';

  // กำหนด icon สถานะตามสถานะการทำงานในขั้นตอนนั้น
  const getStepIcon = (stepType) => {
    if (stepType === "internship") {
      if (internshipStatus === "completed")
        return <CheckCircleOutlined />;
      if (internshipStatus === "in_progress")
        return <LoadingOutlined />;
      return <LaptopOutlined />;
    }

    if (stepType === "project1") {
      // ถ้า phase > 0 หมายถึงผ่าน CS1 แล้ว (อยู่ CS2 หรือเสร็จสิ้น)
      if (projectPhase > 0) return <CheckCircleOutlined />;
      // ถ้า phase = 0 และมี workflow state แสดงว่ากำลังทำ CS1
      if (projectPhase === 0 && (overallStatus === "in_progress" || workflowState))
        return <LoadingOutlined />;
      return <ExperimentOutlined />;
    }

    if (stepType === "project2") {
      // ถ้า phase > 1 หมายถึงเสร็จสิ้นทั้งหมดแล้ว
      if (projectPhase > 1) return <CheckCircleOutlined />;
      // ถ้า phase = 1 แสดงว่ากำลังทำ CS2
      if (projectPhase === 1)
        return <LoadingOutlined />;
      return <BookOutlined />;
    }

    if (stepType === "graduation") {
      if (isReadyToGraduate) return <CheckCircleOutlined />;
      return <UserOutlined />;
    }

    return null;
  };

  // กำหนดคำอธิบายสถานะของแต่ละขั้นตอน
  const getStepDescription = (stepType) => {
    if (stepType === "internship") {
      if (internshipStatus === "completed") return "เสร็จสิ้น";
      if (internshipStatus === "in_progress") return "กำลังดำเนินการ";
      if (student.internshipEligible) return "พร้อมดำเนินการ";
      return "รอคุณสมบัติ";
    }

    if (stepType === "project1") {
      if (projectPhase > 0) return "เสร็จสิ้น";
      // ถ้ามี workflow state และอยู่ใน CS1 phase
      if (projectPhase === 0 && workflowState) {
        const phase = workflowState.currentPhase;
        if (phase === 'TOPIC_EXAM_FAILED') return "สอบหัวข้อไม่ผ่าน";
        return "กำลังดำเนินการ";
      }
      if (projectPhase === 0 && overallStatus === "in_progress")
        return "กำลังดำเนินการ";
      if (student.projectEligible) return "พร้อมดำเนินการ";
      return "รอคุณสมบัติ";
    }

    if (stepType === "project2") {
      if (projectPhase > 1) return "เสร็จสิ้น";
      // ถ้ากำลังทำ CS2
      if (projectPhase === 1) return "กำลังดำเนินการ";
      // ถ้ายังอยู่ CS1 แต่มีโครงงานแล้ว
      if (projectPhase === 0 && workflowState) return "รอดำเนินการ";
      if (projectPhase === 0 && overallStatus === "in_progress")
        return "รอดำเนินการ";
      if (student.projectEligible) return "รอดำเนินการ";
      return "รอคุณสมบัติ";
    }

    if (stepType === "graduation") {
      if (isReadyToGraduate) return "พร้อมสำเร็จการศึกษา";
      return "รอดำเนินการ";
    }

    return "";
  };

  // สร้างคำอธิบาย tooltip สำหรับแต่ละขั้นตอน
  const getStepTooltip = (stepType) => {
    if (stepType === "internship") {
      if (!student.internshipEligible) {
        return (
          student.internshipEligibleMessage ||
          `ต้องมีหน่วยกิตสะสมไม่น้อยกว่า ${internshipReqs.MIN_TOTAL_CREDITS} หน่วยกิต`
        );
      }
      if (internshipStatus === "completed")
        return "นักศึกษาผ่านการฝึกงานเรียบร้อยแล้ว";
      if (internshipStatus === "in_progress")
        return "นักศึกษาอยู่ระหว่างการฝึกงาน";
      return "นักศึกษามีคุณสมบัติพร้อมฝึกงานแล้ว";
    }

    if (stepType === "project1") {
      if (!student.projectEligible) {
        return (
          student.projectEligibleMessage ||
          `ต้องมีหน่วยกิตสะสมไม่น้อยกว่า ${projectReqs.MIN_TOTAL_CREDITS} หน่วยกิต และหน่วยกิตวิชาเอกไม่น้อยกว่า ${projectReqs.MIN_MAJOR_CREDITS} หน่วยกิต`
        );
      }
      return "โครงงานพิเศษ 1 - การพัฒนาและนำเสนอโครงงาน";
    }

    if (stepType === "project2") {
      return "โครงงานพิเศษ 2 - การทดสอบโครงงานและจัดทำเล่มรายงานฉบับสมบูรณ์";
    }

    if (stepType === "graduation") {
      const remaining = [];
      if (student.totalCredits < totalCreditsRequired) {
        remaining.push(
          `หน่วยกิตสะสม ${student.totalCredits}/${totalCreditsRequired}`
        );
      }
      if (student.majorCredits < majorCreditsRequired) {
        remaining.push(
          `หน่วยกิตวิชาเอก ${student.majorCredits}/${majorCreditsRequired}`
        );
      }
      if (internshipStatus !== "completed") {
        remaining.push("ยังไม่ผ่านการฝึกงาน");
      }
      if (student.projectStatus !== "completed") {
        remaining.push("ยังไม่ผ่านโครงงานพิเศษ");
      }

      if (remaining.length === 0) {
        return "นักศึกษามีคุณสมบัติครบถ้วนสำหรับการจบการศึกษา";
      }

      return `ยังขาดคุณสมบัติ: ${remaining.join(", ")}`;
    }

    return "";
  };

  // สร้าง student object ที่มี projectPhase เพื่อส่งไปยัง calculateMainProgress
  const studentWithPhase = {
    ...student,
    projectPhase: projectPhase
  };

  return (
    <Card
      title={
        <span>
          เส้นทางการศึกษาของคุณ
        </span>
      }
      variant="borderless"
      styles={{ padding: "24px" }}
    >
      <Steps current={calculateMainProgress(studentWithPhase)} size="default" responsive>
        <Step
          title={
            <Tooltip title={getStepTooltip("internship")}>
              <Text>ฝึกงาน</Text>
            </Tooltip>
          }
          description={getStepDescription("internship")}
          icon={getStepIcon("internship")}
          status={
            internshipStatus === "completed"
              ? "finish"
              : internshipStatus === "in_progress"
              ? "process"
              : student.internshipEligible
              ? "wait"
              : "wait"
          }
        />
        <Step
          title={
            <Tooltip title={getStepTooltip("project1")}>
              <Text>โครงงานพิเศษ 1</Text>
            </Tooltip>
          }
          description={getStepDescription("project1")}
          icon={getStepIcon("project1")}
          disabled={!student.projectEligible}
          status={
            projectPhase > 0
              ? "finish"
              : (projectPhase === 0 && (workflowState || overallStatus === "in_progress"))
              ? "process"
              : student.projectEligible
              ? "wait"
              : "wait"
          }
        />
        <Step
          title={
            <Tooltip title={getStepTooltip("project2")}>
              <Text>โครงงานพิเศษ 2</Text>
            </Tooltip>
          }
          description={getStepDescription("project2")}
          icon={getStepIcon("project2")}
          disabled={!student.projectEligible}
          status={
            projectPhase > 1
              ? "finish"
              : projectPhase === 1
              ? "process"
              : "wait"
          }
        />
        <Step
          title={
            <Tooltip title={getStepTooltip("graduation")}>
              <Text>สำเร็จการศึกษา</Text>
            </Tooltip>
          }
          description={getStepDescription("graduation")}
          icon={getStepIcon("graduation")}
          status={isReadyToGraduate ? "finish" : "wait"}
        />
      </Steps>
    </Card>
  );
};

// ฟังก์ชันช่วยกำหนดเฟสของการทำโครงงานพิเศษ
// 0 = CS1 (โครงงานพิเศษ 1)
// 1 = CS2 (โครงงานพิเศษ 2) 
// 2 = เสร็จสิ้นทั้งหมด
function determineProjectPhase(student, workflowState) {
  // ใช้ข้อมูลจาก workflow state ก่อน (ถ้ามี)
  if (workflowState && workflowState.currentPhase) {
    const phase = workflowState.currentPhase;
    
    // Phase Mapping จาก ProjectWorkflowState:
    // CS1 phases (โครงงานพิเศษ 1): DRAFT, ADVISOR_ASSIGNED, TOPIC_SUBMISSION, 
    //                              TOPIC_EXAM_PENDING, TOPIC_EXAM_SCHEDULED
    const CS1_PHASES = [
      'DRAFT', 'ADVISOR_ASSIGNED', 'TOPIC_SUBMISSION', 
      'TOPIC_EXAM_PENDING', 'TOPIC_EXAM_SCHEDULED', 'TOPIC_EXAM_FAILED'
    ];
    
    // CS2 phases (โครงงานพิเศษ 2): IN_PROGRESS, THESIS_SUBMISSION, 
    //                              THESIS_EXAM_PENDING, THESIS_EXAM_SCHEDULED
    const CS2_PHASES = [
      'IN_PROGRESS', 'THESIS_SUBMISSION', 
      'THESIS_EXAM_PENDING', 'THESIS_EXAM_SCHEDULED'
    ];
    
    // Completed phases: THESIS_EXAM_PASSED, COMPLETED
    const COMPLETED_PHASES = ['THESIS_EXAM_PASSED', 'COMPLETED'];
    
    if (COMPLETED_PHASES.includes(phase)) {
      return 2; // เสร็จสิ้นทั้งหมด
    } else if (CS2_PHASES.includes(phase)) {
      return 1; // กำลังทำโครงงานพิเศษ 2
    } else if (CS1_PHASES.includes(phase)) {
      return 0; // กำลังทำโครงงานพิเศษ 1
    }
  }

  // Fallback: ใช้ข้อมูลแบบเดิม
  if (student.projectPhase !== undefined) return student.projectPhase;

  if (student.hasCompletedCS1 && student.hasCompletedCS2) return 2;
  if (student.hasCompletedCS1) return 1;

  // ตรวจสอบจากข้อมูล timeline steps ถ้ามี
  if (student.projectProgress && student.projectProgress.steps) {
    const completedFinal = student.projectProgress.steps.find(
      (step) =>
        step.name.includes("ส่งเล่มรายงานฉบับสมบูรณ์") &&
        step.status === "completed"
    );
    if (completedFinal) return 2;

    const completedProposal = student.projectProgress.steps.find(
      (step) =>
        step.name.includes("สอบหัวข้อโครงงาน") && step.status === "completed"
    );
    if (completedProposal) return 1;
  }

  // ถ้าขั้นตอนโครงงานยังไม่เริ่ม
  return 0;
}

export default EducationPath;
