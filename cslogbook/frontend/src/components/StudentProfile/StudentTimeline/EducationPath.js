import React from 'react';
import { Card, Steps, Tooltip, Typography } from 'antd';
import { 
  LaptopOutlined, ExperimentOutlined, BookOutlined, 
  UserOutlined, LoadingOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { calculateMainProgress } from './helpers';

const { Step } = Steps;
const { Text } = Typography;

// คอมโพเนนต์สำหรับแสดงเส้นทางการศึกษาหลัก
const EducationPath = ({ student }) => {
  // คำนวณความพร้อมในการจบการศึกษา
  const totalCreditsRequired = student.totalCreditsRequired || 127;
  const majorCreditsRequired = student.majorCreditsRequired || 57;
  
  const isReadyToGraduate = 
    student.totalCredits >= totalCreditsRequired && 
    student.majorCredits >= majorCreditsRequired && 
    student.internshipStatus === 'completed' && 
    student.projectStatus === 'completed';

  // คำนวณสถานะโครงงานพิเศษ
  const projectPhase = determineProjectPhase(student);
  
  // กำหนด icon สถานะตามสถานะการทำงานในขั้นตอนนั้น
  const getStepIcon = (stepType) => {
    if (stepType === 'internship') {
      if (student.internshipStatus === 'completed') return <CheckCircleOutlined />;
      if (student.internshipStatus === 'in_progress') return <LoadingOutlined />;
      return <LaptopOutlined />;
    }
    
    if (stepType === 'project1') {
      if (projectPhase > 0) return <CheckCircleOutlined />;
      if (student.projectStatus === 'in_progress' && projectPhase === 0) return <LoadingOutlined />;
      return <ExperimentOutlined />;
    }
    
    if (stepType === 'project2') {
      if (projectPhase > 1) return <CheckCircleOutlined />;
      if (student.projectStatus === 'in_progress' && projectPhase === 1) return <LoadingOutlined />;
      return <BookOutlined />;
    }
    
    if (stepType === 'graduation') {
      if (isReadyToGraduate) return <CheckCircleOutlined />;
      return <UserOutlined />;
    }
    
    return null;
  };
  
  // กำหนดคำอธิบายสถานะของแต่ละขั้นตอน
  const getStepDescription = (stepType) => {
    if (stepType === 'internship') {
      if (student.internshipStatus === 'completed') return 'เสร็จสิ้น';
      if (student.internshipStatus === 'in_progress') return 'กำลังดำเนินการ';
      if (student.internshipEligible) return 'พร้อมดำเนินการ';
      return 'รอคุณสมบัติ';
    }
    
    if (stepType === 'project1') {
      if (projectPhase > 0) return 'เสร็จสิ้น';
      if (student.projectStatus === 'in_progress' && projectPhase === 0) return 'กำลังดำเนินการ';
      if (student.projectEligible) return 'พร้อมดำเนินการ';
      return 'รอคุณสมบัติ';
    }
    
    if (stepType === 'project2') {
      if (projectPhase > 1) return 'เสร็จสิ้น';
      if (student.projectStatus === 'in_progress' && projectPhase === 1) return 'กำลังดำเนินการ';
      if (projectPhase === 0 && student.projectStatus === 'in_progress') return 'รอดำเนินการ';
      if (student.projectEligible) return 'รอดำเนินการ';
      return 'รอคุณสมบัติ';
    }
    
    if (stepType === 'graduation') {
      if (isReadyToGraduate) return 'พร้อมสำเร็จการศึกษา';
      return 'รอดำเนินการ';
    }
    
    return '';
  };
  
  // สร้างคำอธิบาย tooltip สำหรับแต่ละขั้นตอน
  const getStepTooltip = (stepType) => {
    if (stepType === 'internship') {
      if (!student.internshipEligible) {
        return student.internshipEligibleMessage || 'ต้องมีหน่วยกิตสะสมไม่น้อยกว่า 81 หน่วยกิต';
      }
      if (student.internshipStatus === 'completed') return 'นักศึกษาผ่านการฝึกงานเรียบร้อยแล้ว';
      if (student.internshipStatus === 'in_progress') return 'นักศึกษาอยู่ระหว่างการฝึกงาน';
      return 'นักศึกษามีคุณสมบัติพร้อมฝึกงานแล้ว';
    }
    
    if (stepType === 'project1') {
      if (!student.projectEligible) {
        return student.projectEligibleMessage || 'ต้องมีหน่วยกิตสะสมไม่น้อยกว่า 95 หน่วยกิต และหน่วยกิตวิชาเอกไม่น้อยกว่า 47 หน่วยกิต';
      }
      return 'โครงงานพิเศษ 1 - การพัฒนาและนำเสนอโครงงาน';
    }
    
    if (stepType === 'project2') {
      return 'โครงงานพิเศษ 2 - การทดสอบโครงงานและจัดทำเล่มรายงานฉบับสมบูรณ์';
    }
    
    if (stepType === 'graduation') {
      const remaining = [];
      if (student.totalCredits < totalCreditsRequired) {
        remaining.push(`หน่วยกิตสะสม ${student.totalCredits}/${totalCreditsRequired}`);
      }
      if (student.majorCredits < majorCreditsRequired) {
        remaining.push(`หน่วยกิตวิชาเอก ${student.majorCredits}/${majorCreditsRequired}`);
      }
      if (student.internshipStatus !== 'completed') {
        remaining.push('ยังไม่ผ่านการฝึกงาน');
      }
      if (student.projectStatus !== 'completed') {
        remaining.push('ยังไม่ผ่านโครงงานพิเศษ');
      }
      
      if (remaining.length === 0) {
        return 'นักศึกษามีคุณสมบัติครบถ้วนสำหรับการจบการศึกษา';
      }
      
      return `ยังขาดคุณสมบัติ: ${remaining.join(', ')}`;
    }
    
    return '';
  };
  
  return (
    <Card 
      title="เส้นทางการศึกษาของคุณ" 
      bordered={false}
      bodyStyle={{ padding: '24px' }}
    >
      <Steps 
        current={calculateMainProgress(student)}
        size="default"
        responsive
      >
        <Step 
          title={
            <Tooltip title={getStepTooltip('internship')}>
              <Text>ฝึกงาน</Text>
            </Tooltip>
          }
          description={getStepDescription('internship')} 
          icon={getStepIcon('internship')}
          status={
            student.internshipStatus === 'completed' ? 'finish' :
            student.internshipStatus === 'in_progress' ? 'process' :
            student.internshipEligible ? 'wait' : 'wait'
          }
        />
        <Step 
          title={
            <Tooltip title={getStepTooltip('project1')}>
              <Text>โครงงานพิเศษ 1</Text>
            </Tooltip>
          }
          description={getStepDescription('project1')}
          icon={getStepIcon('project1')}
          disabled={!student.projectEligible}
          status={
            projectPhase > 0 ? 'finish' :
            (student.projectStatus === 'in_progress' && projectPhase === 0) ? 'process' :
            student.projectEligible ? 'wait' : 'wait'
          }
        />
        <Step 
          title={
            <Tooltip title={getStepTooltip('project2')}>
              <Text>โครงงานพิเศษ 2</Text>
            </Tooltip>
          }
          description={getStepDescription('project2')}
          icon={getStepIcon('project2')}
          disabled={!student.projectEligible}
          status={
            projectPhase > 1 ? 'finish' :
            (student.projectStatus === 'in_progress' && projectPhase === 1) ? 'process' :
            'wait'
          }
        />
        <Step 
          title={
            <Tooltip title={getStepTooltip('graduation')}>
              <Text>สำเร็จการศึกษา</Text>
            </Tooltip>
          }
          description={getStepDescription('graduation')}
          icon={getStepIcon('graduation')}
          status={isReadyToGraduate ? 'finish' : 'wait'}
        />
      </Steps>
    </Card>
  );
};

// ฟังก์ชันช่วยกำหนดเฟสของการทำโครงงานพิเศษ (0 = CS1, 1 = CS2)
function determineProjectPhase(student) {
  // ถ้ามีข้อมูล projectPhase โดยตรง
  if (student.projectPhase !== undefined) return student.projectPhase;
  
  // ถ้ามีข้อมูลที่ระบุว่าทำ CS1 หรือ CS2 เสร็จแล้ว
  if (student.hasCompletedCS1 && student.hasCompletedCS2) return 2;
  if (student.hasCompletedCS1) return 1;
  
  // ตรวจสอบจากข้อมูล timeline steps ถ้ามี
  if (student.projectProgress && student.projectProgress.steps) {
    // ถ้ามีขั้นตอน "ส่งเล่มรายงานฉบับสมบูรณ์" เสร็จสิ้นแล้ว เป็นระยะที่ 2 (CS2)
    const completedFinal = student.projectProgress.steps.find(
      step => step.name.includes('ส่งเล่มรายงานฉบับสมบูรณ์') && step.status === 'completed'
    );
    if (completedFinal) return 2;
    
    // ถ้ามีขั้นตอน "สอบหัวข้อโครงงาน" เสร็จสิ้นแล้ว เป็นระยะที่ 1 (CS1)
    const completedProposal = student.projectProgress.steps.find(
      step => step.name.includes('สอบหัวข้อโครงงาน') && step.status === 'completed'
    );
    if (completedProposal) return 1;
  }
  
  // ถ้าขั้นตอนโครงงานยังไม่เริ่ม หรือไม่สามารถบอกได้
  return 0;
}

export default EducationPath;