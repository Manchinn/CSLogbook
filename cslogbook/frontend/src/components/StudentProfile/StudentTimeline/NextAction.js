import React, { useState, useEffect } from 'react';
import { Card, Typography, Button, Space } from 'antd';
import { 
  StarOutlined, FormOutlined, ExperimentOutlined, 
  SearchOutlined, UserOutlined, FileTextOutlined, 
  BookOutlined, CheckCircleOutlined, BankOutlined
} from '@ant-design/icons';
import { 
  getInternshipRequirements, 
  getProjectRequirements,
  isEligibleForInternship,
  isEligibleForProject 
} from '../../../utils/studentUtils';

const { Text } = Typography;

// คอมโพเนนต์สำหรับแสดงคำแนะนำการดำเนินการถัดไป
const NextAction = ({ student, progress }) => {
  const [requirements, setRequirements] = useState({
    internship: null,
    project: null
  });

  // ดึงข้อกำหนดจาก student object หรือ API
  useEffect(() => {
    if (student?.requirements) {
      setRequirements(student.requirements);
    }
  }, [student]);

  const { nextAction, internshipEligible, projectEligible, 
          internshipStatus, projectStatus, isEnrolledInternship, 
          isEnrolledProject, totalCredits, studentId, studentCode } = student;

  // ใช้ utils function แทนการ hardcode
  const internshipReqs = getInternshipRequirements(requirements.internship);
  const projectReqs = getProjectRequirements(requirements.project);
  
  // ตัวแปรเพื่อคำนวณว่าควรแนะนำให้ทำอะไรต่อไป
  let recommendedAction = nextAction;
  let actionContent = null;

  // ฟังก์ชันช่วยสำหรับสร้าง URL ที่ถูกต้อง (ตาม Sidebar.js)
  const getRouteUrl = (routeName, params = {}) => {
    const routes = {
      // Routes สำหรับการฝึกงาน (ตาม Sidebar.js)
      'internship-eligibility': '/internship-eligibility',
      'internship-requirements': '/internship-requirements',
      'internship-registration': '/internship-registration',
      'internship-cs05': '/internship-registration/cs05',
      'internship-logbook': '/internship-logbook',
      'internship-companyinfo': '/internship-logbook/companyinfo',
      'internship-timesheet': '/internship-logbook/timesheet',
      'internship-summary': '/internship-summary',
      'internship-status': '/status-check/internship',
      
      // Routes สำหรับโครงงาน (ตาม Sidebar.js)
      'project-eligibility': '/project-eligibility',
      'project-requirements': '/project-requirements',
      'project-proposal': '/project-proposal',
      'project-logbook': '/project-logbook',
      'project-status': '/status-check/project',
      
      // Routes อื่นๆ (ตาม Sidebar.js)
      'student-profile': `/student-profile/${studentCode || studentId}`,
      'dashboard': '/admin/dashboard',
      'status-check': '/status-check'
    };

    let url = routes[routeName] || '/admin/dashboard';
    
    // เพิ่มพารามิเตอร์ถ้ามี
    if (params.studentId && url.includes(':studentId')) {
      url = url.replace(':studentId', params.studentId);
    }
    if (params.studentCode && url.includes(':studentCode')) {
      url = url.replace(':studentCode', params.studentCode);
    }
    
    return url;
  };

  // หากค่า nextAction เป็น none หรือไม่ระบุ ให้พิจารณาจากสถานะอื่นๆ
  if (!nextAction || nextAction === 'none') {
    // ถ้ามีสิทธิ์ฝึกงานแต่ยังไม่ได้ลงทะเบียน
    if (internshipEligible && !isEnrolledInternship && internshipStatus !== 'completed') {
      recommendedAction = 'register_internship';
    }
    // ถ้าฝึกงานอยู่ ให้บันทึก logbook
    else if (isEnrolledInternship && internshipStatus === 'in_progress') {
      recommendedAction = 'daily_log';
    }
    // ถ้าผ่านฝึกงานแล้ว และมีสิทธิ์ทำโครงงาน แต่ยังไม่ได้ลงทะเบียน
    else if (internshipStatus === 'completed' && projectEligible && !isEnrolledProject) {
      recommendedAction = 'register_project';
    }
    // ถ้าทำโครงงานอยู่
    else if (isEnrolledProject && projectStatus === 'in_progress') {
      recommendedAction = 'continue_project';
    }
    // ถ้ายังไม่มีสิทธิ์ฝึกงาน แต่หน่วยกิตใกล้เคียงแล้ว
    else if (!internshipEligible && totalCredits > (internshipReqs.MIN_TOTAL_CREDITS - 10)) {
      recommendedAction = 'almost_ready_internship';
    }
    // ถ้ามีขั้นตอนที่ต้องดำเนินการจาก progress
    else if (progress?.internship?.steps?.some(step => 
      step.status === 'awaiting_student_action' || step.status === 'in_progress')) {
      recommendedAction = 'continue_internship_step';
    }
    else if (progress?.project?.steps?.some(step => 
      step.status === 'awaiting_student_action' || step.status === 'in_progress')) {
      recommendedAction = 'continue_project_step';
    }
  }

  // สร้างเนื้อหาตามการกระทำที่แนะนำ
  switch (recommendedAction) {
    case 'register_internship':
      actionContent = (
        <Space direction="vertical">
          <Text>คุณมีสิทธิ์ลงทะเบียนฝึกงานแล้ว</Text>
          <Text type="secondary">ดำเนินการลงทะเบียนและเตรียมเอกสารที่จำเป็น</Text>
          <Space>
            <Button 
              type="primary" 
              icon={<FormOutlined />} 
              href={getRouteUrl('internship-cs05')}
            >
              ลงทะเบียนฝึกงาน
            </Button>
            <Button 
              icon={<FileTextOutlined />} 
              href={getRouteUrl('internship-eligibility')}
            >
              ตรวจสอบคุณสมบัติ
            </Button>
          </Space>
        </Space>
      );
      break;

    case 'daily_log':
      actionContent = (
        <Space direction="vertical">
          <Text>ดำเนินการบันทึกรายงานการฝึกงานประจำวัน</Text>
          <Text type="secondary">อย่าลืมบันทึกกิจกรรมและความรู้ที่ได้รับเป็นประจำ</Text>
          <Space>
            <Button 
              type="primary" 
              icon={<BookOutlined />} 
              href={getRouteUrl('internship-timesheet')}
            >
              บันทึกรายงาน
            </Button>
            <Button 
              icon={<CheckCircleOutlined />} 
              href={getRouteUrl('internship-status')}
            >
              ดูสถานะฝึกงาน
            </Button>
          </Space>
        </Space>
      );
      break;

    case 'register_project':
      actionContent = (
        <Space direction="vertical">
          <Text>ยินดีด้วย! คุณผ่านการฝึกงานแล้ว และมีสิทธิ์ลงทะเบียนโครงงานพิเศษ</Text>
          <Text type="secondary">เตรียมหัวข้อและอาจารย์ที่ปรึกษาก่อนลงทะเบียน</Text>
          <Space>
            <Button 
              type="primary" 
              icon={<ExperimentOutlined />} 
              href={getRouteUrl('project-proposal')}
            >
              เสนอหัวข้อโครงงาน
            </Button>
            <Button 
              icon={<FileTextOutlined />} 
              href={getRouteUrl('project-eligibility')}
            >
              ตรวจสอบคุณสมบัติ
            </Button>
          </Space>
        </Space>
      );
      break;

    case 'continue_project':
      actionContent = (
        <Space direction="vertical">
          <Text>ดำเนินการโครงงานพิเศษต่อ</Text>
          <Text type="secondary">ติดตามความคืบหน้าและประสานงานกับอาจารย์ที่ปรึกษา</Text>
          <Space>
            <Button 
              type="primary" 
              icon={<ExperimentOutlined />} 
              href={getRouteUrl('project-logbook')}
            >
              บันทึก Logbook โครงงาน
            </Button>
            <Button 
              icon={<FileTextOutlined />} 
              href={getRouteUrl('project-status')}
            >
              ดูสถานะโครงงาน
            </Button>
          </Space>
        </Space>
      );
      break;

    case 'continue_internship_step':
      // หาขั้นตอนที่ต้องดำเนินการจาก progress
      const pendingInternshipStep = progress?.internship?.steps?.find(step => 
        step.status === 'awaiting_student_action' || step.status === 'in_progress'
      );
      
      actionContent = (
        <Space direction="vertical">
          <Text>มีขั้นตอนการฝึกงานที่ต้องดำเนินการ</Text>
          {pendingInternshipStep && (
            <Text type="secondary">{pendingInternshipStep.title || pendingInternshipStep.description}</Text>
          )}
          <Button 
            type="primary" 
            icon={<FormOutlined />} 
            href={pendingInternshipStep?.actionLink || getRouteUrl('internship-status')}
          >
            {pendingInternshipStep?.actionText || 'ดำเนินการต่อ'}
          </Button>
        </Space>
      );
      break;

    case 'continue_project_step':
      // หาขั้นตอนที่ต้องดำเนินการจาก progress
      const pendingProjectStep = progress?.project?.steps?.find(step => 
        step.status === 'awaiting_student_action' || step.status === 'in_progress'
      );
      
      actionContent = (
        <Space direction="vertical">
          <Text>มีขั้นตอนโครงงานที่ต้องดำเนินการ</Text>
          {pendingProjectStep && (
            <Text type="secondary">{pendingProjectStep.title || pendingProjectStep.description}</Text>
          )}
          <Button 
            type="primary" 
            icon={<ExperimentOutlined />} 
            href={pendingProjectStep?.actionLink || getRouteUrl('project-status')}
          >
            {pendingProjectStep?.actionText || 'ดำเนินการต่อ'}
          </Button>
        </Space>
      );
      break;

    case 'almost_ready_internship':
      actionContent = (
        <Space direction="vertical">
          <Text>เกือบถึงเกณฑ์การฝึกงานแล้ว!</Text>
          <Text type="secondary">
            คุณมีหน่วยกิตสะสม {totalCredits} หน่วยกิต ใกล้ถึงเกณฑ์การฝึกงาน ({internshipReqs.MIN_TOTAL_CREDITS} หน่วยกิต) แล้ว
          </Text>
          <Space>
            <Button 
              type="primary" 
              icon={<SearchOutlined />} 
              href={getRouteUrl('internship-eligibility')}
            >
              ตรวจสอบคุณสมบัติ
            </Button>
            <Button 
              icon={<FileTextOutlined />} 
              href={getRouteUrl('internship-requirements')}
            >
              ดูข้อกำหนดฝึกงาน
            </Button>
          </Space>
        </Space>
      );
      break;

    default:
      // ตรวจสอบสถานะเพิ่มเติม เพื่อแสดงข้อความที่เหมาะสม
      if (totalCredits >= 127 && projectStatus === 'completed' && internshipStatus === 'completed') {
        actionContent = (
          <Space direction="vertical">
            <Text>ยินดีด้วย! คุณน่าจะพร้อมสำหรับการจบการศึกษาแล้ว</Text>
            <Text type="secondary">กรุณาตรวจสอบเงื่อนไขการจบการศึกษาอื่นๆ เพิ่มเติม</Text>
            <Space>
              <Button 
                type="primary" 
                icon={<BankOutlined />} 
                href={getRouteUrl('status-check')}
              >
                ตรวจสอบสถานะเอกสาร
              </Button>
              <Button 
                icon={<UserOutlined />} 
                href={getRouteUrl('student-profile')}
              >
                ดูโปรไฟล์
              </Button>
            </Space>
          </Space>
        );
      } else if (!internshipEligible && !projectEligible) {
        actionContent = (
          <Space direction="vertical">
            <Text>ยังไม่มีสิทธิ์ในการฝึกงานหรือทำโครงงาน</Text>
            <Text type="secondary">
              ต้องมีหน่วยกิตอย่างน้อย {internshipReqs.MIN_TOTAL_CREDITS} หน่วยกิตสำหรับฝึกงาน 
              และ {projectReqs.MIN_TOTAL_CREDITS} หน่วยกิตสำหรับโครงงาน
            </Text>
            <Text type="secondary">ปัจจุบันคุณมี {totalCredits} หน่วยกิต</Text>
            <Space>
              <Button 
                icon={<FileTextOutlined />} 
                href={getRouteUrl('internship-requirements')}
              >
                ดูข้อกำหนดฝึกงาน
              </Button>
              <Button 
                icon={<FileTextOutlined />} 
                href={getRouteUrl('project-requirements')}
              >
                ดูข้อกำหนดโครงงาน
              </Button>
            </Space>
          </Space>
        );
      } else {
        actionContent = (
          <Space direction="vertical">
            <Text>ไม่มีการดำเนินการที่ต้องทำในขณะนี้</Text>
            <Button 
              icon={<CheckCircleOutlined />} 
              href={getRouteUrl('student-profile')}
            >
              ดูโปรไฟล์
            </Button>
          </Space>
        );
      }
  }
  
  return (
    <Card size="small" variant='borderless' style={{ backgroundColor: '#f9f0ff', marginBottom: 16 }}>
      <Space align="start">
        <StarOutlined style={{ fontSize: '20px', color: '#722ed1' }} />
        <div>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>คำแนะนำการดำเนินการถัดไป</Text>
          {actionContent}
        </div>
      </Space>
    </Card>
  );
};

export default NextAction;