import React from 'react';
import { Card, Typography, Button, Space } from 'antd';
import {
  StarOutlined,
  FormOutlined,
  ExperimentOutlined,
  SearchOutlined,
  UserOutlined,
  FileTextOutlined,
  BookOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { 
  getInternshipRequirements, 
  getProjectRequirements,
} from '../../../utils/studentUtils';
import { useInternshipStatus } from '../../../contexts/InternshipStatusContext';
import useCertificateStatus from "features/internship/hooks/useCertificateStatus";

const { Text } = Typography;

// คอมโพเนนต์สำหรับแสดงคำแนะนำการดำเนินการถัดไป
const NextAction = ({ student: propStudent, progress: propProgress }) => {
  // ดึงข้อมูลจาก context (ใช้เป็น fallback)
  const {
    cs05Status,
    internshipStatus: contextInternshipStatus,
    student: contextStudent,
    loading,
  } = useInternshipStatus();

  const {
    supervisorEvaluationStatus,
  } = useCertificateStatus();

  // ถ้ายังโหลดข้อมูลอยู่
  if (loading && !propStudent) return null;

  // ใช้ student object จาก props เป็นหลัก ถ้าไม่มีค่อย fallback ไปใช้ context
  const student = propStudent || contextStudent;
  const progress = propProgress || {};
  
  // ใช้ข้อมูล internshipStatus จาก progress ก่อน แล้วค่อย fallback
  const internshipStatus = progress?.internship?.status || contextInternshipStatus || student?.internshipStatus;
  
  // ใช้ student object (รวมข้อมูลจากทั้ง props และ context)
  const requirements = student?.requirements || {};
  const internshipReqs = getInternshipRequirements(requirements.internship);
  const projectReqs = getProjectRequirements(requirements.project);

  // ดึงค่าที่จำเป็นจาก student object
  const {
    nextAction,
    projectStatus,
    isEnrolledInternship,
    isEnrolledProject,
    totalCredits,
    studentId,
    studentCode,
  } = student || {};

  // ตัวแปรเพื่อคำนวณว่าควรแนะนำให้ทำอะไรต่อไป
  let recommendedAction = nextAction;
  let actionContent = null;

  // ฟังก์ชันช่วยสำหรับสร้าง URL ที่ถูกต้อง (ตาม Sidebar.js)
  const getRouteUrl = (routeName, params = {}) => {
    const routes = {
      // Routes สำหรับการฝึกงาน (ตาม Sidebar.js)
      'internship-eligibility': '/internship-eligibility',
      'internship-requirements': '/internship-requirements',
      'internship-registration': '/internship-registration/flow',
      'internship-logbook': '/internship-logbook',
      'internship-companyinfo': '/internship-logbook/companyinfo',
      'internship-timesheet': '/internship-logbook/timesheet',
  'internship-summary': '/internship-summary',
      
      // Routes สำหรับโครงงาน (ตาม Sidebar.js)
      'project-eligibility': '/project-eligibility',
      'project-requirements': '/project-requirements',
      
      // Routes อื่นๆ (ตาม Sidebar.js)
      'student-profile': `/student-profile/${studentCode || studentId}`,
      'dashboard': '/admin/dashboard'
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

  // ปรับ flow: เริ่มจาก cs05Status และ internshipStatus
  if (!nextAction || nextAction === 'none') {
    // ถ้ายังไม่ได้ลงทะเบียนคำร้องฝึกงาน (cs05Status ไม่มีหรือเป็น waiting)
    if (!cs05Status || cs05Status === 'waiting') {
      recommendedAction = 'register_internship';
    }
    // ถ้าฝึกงานอยู่ ให้บันทึก logbook
    else if (isEnrolledInternship && internshipStatus === 'in_progress') {
      recommendedAction = 'daily_log';
    }
    // ถ้าผ่านฝึกงานแล้ว และยังไม่ได้ลงทะเบียนโครงงาน
    else if (internshipStatus === 'completed' && !isEnrolledProject) {
      recommendedAction = 'register_project';
    }
    // ถ้าทำโครงงานอยู่
    else if (isEnrolledProject && projectStatus === 'in_progress') {
      recommendedAction = 'continue_project';
    }
    // ถ้ามีขั้นตอนที่ต้องดำเนินการจาก progress
    else if (internshipStatus?.steps?.some(step => 
      step.status === 'awaiting_student_action' || step.status === 'in_progress')) {
      recommendedAction = 'continue_internship_step';
    }
    else if (projectStatus?.steps?.some(step => 
      step.status === 'awaiting_student_action' || step.status === 'in_progress')) {
      recommendedAction = 'continue_project_step';
    }
  }

  // เพิ่ม logic สำหรับการประเมินฝึกงาน
  if (isEnrolledInternship && internshipStatus === 'completed') {
    // ถ้ายังไม่ได้ประเมิน หรือรอผู้ควบคุมงานประเมิน
    if (supervisorEvaluationStatus === "wait" || !supervisorEvaluationStatus) {
      recommendedAction = 'submit_evaluation';
    } else if (supervisorEvaluationStatus === "pending") {
      recommendedAction = 'waiting_evaluation';
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
              href={getRouteUrl('internship-registration')}
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
          <Button
            type="primary"
            icon={<BookOutlined />}
            href={getRouteUrl('internship-timesheet')}
          >
            บันทึกรายงาน
          </Button>
        </Space>
      );
      break;

    case 'register_project':
      actionContent = (
        <Space direction="vertical">
          <Text>ยินดีด้วย! คุณผ่านการฝึกงานแล้ว และมีสิทธิ์ลงทะเบียนโครงงานพิเศษ</Text>
          <Text type="secondary">โมดูลลงทะเบียนโครงงานกำลังอยู่ระหว่างการปรับปรุง โปรดติดต่อเจ้าหน้าที่ภาคเพื่อติดตามขั้นตอน</Text>
          <Space>
            <Button type="primary" icon={<ExperimentOutlined />} disabled>
              ลงทะเบียนโครงงาน (กำลังปรับปรุง)
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
          <Text type="secondary">ระบบติดตามโครงงานกำลังอยู่ระหว่างการปรับปรุง หากต้องการอัปเดตความคืบหน้าให้ติดต่ออาจารย์ที่ปรึกษาโดยตรง</Text>
          <Space>
            <Button type="primary" icon={<ExperimentOutlined />} disabled>
              บันทึก Logbook โครงงาน (กำลังปรับปรุง)
            </Button>
            <Button icon={<FileTextOutlined />} disabled>
              ดูสถานะโครงงาน (กำลังปรับปรุง)
            </Button>
          </Space>
        </Space>
      );
      break;

    case 'continue_internship_step':
      // หาขั้นตอนที่ต้องดำเนินการจาก progress
      const pendingInternshipStep = internshipStatus?.steps?.find(step => 
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
            href={pendingInternshipStep?.actionLink || getRouteUrl('internship-registration')}
          >
            {pendingInternshipStep?.actionText || 'ดำเนินการต่อ'}
          </Button>
        </Space>
      );
      break;

    case 'continue_project_step':
      // หาขั้นตอนที่ต้องดำเนินการจาก progress
      const pendingProjectStep = projectStatus?.steps?.find(step => 
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
            disabled
          >
            กำลังปรับปรุงระบบโครงงาน
          </Button>
        </Space>
      );
      break;

    case 'submit_evaluation':
      actionContent = (
        <Space direction="vertical">
          <Text>กรุณาส่งแบบประเมินฝึกงานให้ผู้ควบคุมงาน</Text>
          <Text type="secondary">เมื่อบันทึก logbook และสรุปผลครบแล้ว ให้ส่งแบบประเมินฝึกงาน</Text>
          <Button 
            type="primary" 
            icon={<FormOutlined />} 
            href={getRouteUrl('internship-summary')}
          >
            ส่งแบบประเมินฝึกงาน
          </Button>
        </Space>
      );
      break;
    case 'waiting_evaluation':
      actionContent = (
        <Space direction="vertical">
          <Text>รอผู้ควบคุมงานประเมินฝึกงาน</Text>
          <Text type="secondary">ระบบจะอัปเดตสถานะเมื่อผู้ควบคุมงานประเมินเสร็จ</Text>
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
                icon={<FileTextOutlined />}
                href={getRouteUrl('internship-summary')}
              >
                ตรวจสอบสรุปฝึกงาน
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
      } else if (!internshipReqs.MIN_TOTAL_CREDITS || !projectReqs.MIN_TOTAL_CREDITS) {
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