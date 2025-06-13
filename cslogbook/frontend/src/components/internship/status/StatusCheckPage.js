import React, { useState, useEffect } from 'react';
import { 
  Card, Timeline, Tag, Alert, Button, Space,
  Typography, Spin, message, Descriptions
} from 'antd';
import { 
  ClockCircleOutlined, FileTextOutlined,
  PrinterOutlined, UploadOutlined, DownloadOutlined,
  AuditOutlined, FileDoneOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import internshipService from '../../../services/internshipService';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

// ลบการนำเข้า DemoControls

const { Title, Text, Paragraph } = Typography;

dayjs.locale('th');

const StatusCheckPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [cs05Data, setCs05Data] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  
  // กำหนดขั้นตอนทั้งหมดของการฝึกงาน
  const internshipSteps = [
    {
      id: 'cs05_submitted',
      title: 'กรอกข้อมูล คพ.05',
      description: 'ส่งคำร้องขอฝึกงานพร้อมข้อมูลบริษัทและนักศึกษา',
      icon: <FileTextOutlined />,
      requiredStatus: null,
      allowedStatuses: ['submitted', 'under_review', 'approved', 'completed']
    },
    {
      id: 'department_approval',
      title: 'การอนุมัติจากเจ้าหน้าที่ภาควิชา',
      description: 'เจ้าหน้าที่ภาควิชาตรวจสอบและส่งให้หัวหน้าภาควิชาเซ็น',
      icon: <AuditOutlined />,
      requiredStatus: 'submitted',
      allowedStatuses: ['under_review', 'approved', 'completed']
    },
    {
      id: 'letter_preparation',
      title: 'รอหนังสือขอความอนุเคราะห์',
      description: 'รอการอนุมัติจากหัวหน้าภาควิชา',
      icon: <ClockCircleOutlined />,
      requiredStatus: 'under_review',
      allowedStatuses: ['approved', 'completed']
    },
    {
      id: 'download_letter',
      title: 'พิมพ์หนังสือขอความอนุเคราะห์',
      description: 'นักศึกษาดาวน์โหลดและพิมพ์เอกสาร',
      icon: <PrinterOutlined />,
      requiredStatus: 'approved',
      allowedStatuses: ['letter_downloaded', 'company_contacted', 'completed']
    },
    {
      id: 'upload_acceptance',
      title: 'อัปโหลดหนังสือตอบรับนักศึกษาเข้าฝึกงาน',
      description: 'อัปโหลดหนังสือตอบรับจากบริษัท',
      icon: <UploadOutlined />,
      requiredStatus: 'letter_downloaded',
      allowedStatuses: ['acceptance_uploaded', 'acceptance_approved', 'completed']
    },
    {
      id: 'referral_letter_prep',
      title: 'รอหนังสือส่งตัว',
      description: 'เจ้าหน้าที่ภาควิชาออกหนังสือส่งตัว',
      icon: <FileDoneOutlined />,
      requiredStatus: 'acceptance_approved',
      allowedStatuses: ['referral_ready', 'completed']
    },
    {
      id: 'download_referral',
      title: 'นักศึกษาพิมพ์หนังสือส่งตัว',
      description: 'ดาวน์โหลดและพิมพ์หนังสือส่งตัวเพื่อไปแจ้งให้กับบริษัท',
      icon: <DownloadOutlined />,
      requiredStatus: 'referral_ready',
      allowedStatuses: ['completed']
    }
  ];

  // โหลดข้อมูลสถานะปัจจุบัน
  useEffect(() => {
    const fetchInternshipStatus = async () => {
      try {
        setLoading(true);
        
        // ลบเงื่อนไข demoMode และข้อมูลจำลอง
        
        // โหลดข้อมูลจริงจาก API
        const studentResponse = await internshipService.getStudentProfile();
        if (studentResponse.success) {
          setStudentData(studentResponse.data);
        }

        const cs05Response = await internshipService.getCurrentCS05();
        if (cs05Response.success && cs05Response.data) {
          setCs05Data(cs05Response.data);
          const status = cs05Response.data.status;
          const stepIndex = getStepIndexByStatus(status);
          setCurrentStep(stepIndex);
        } else {
          setCurrentStep(-1);
        }
      } catch (error) {
        console.error('Error fetching internship status:', error);
        message.error('ไม่สามารถโหลดข้อมูลสถานะได้');
      } finally {
        setLoading(false);
      }
    };

    fetchInternshipStatus();
  }, []);

  // ลบฟังก์ชัน handleDemoStatusChange และ handleDemoDataChange

  // หาขั้นตอนปัจจุบันจากสถานะ
  const getStepIndexByStatus = (status) => {
    switch (status) {
      case 'draft':
      case 'submitted':
        return 0;
      case 'under_review':
        return 1;
      case 'approved':
        return 2;
      case 'letter_downloaded':
        return 3;
      case 'acceptance_uploaded':
        return 4;
      case 'acceptance_approved':
        return 5;
      case 'referral_ready':
        return 6;
      case 'completed':
        return 6;
      default:
        return 0;
    }
  };

  // ตรวจสอบว่าสามารถเข้าถึงขั้นตอนได้หรือไม่
  const canAccessStep = (stepIndex) => {
    if (!cs05Data) return stepIndex === 0;
    
    const step = internshipSteps[stepIndex];
    const currentStatus = cs05Data.status;
    
    return step.allowedStatuses.includes(currentStatus);
  };

  // รับสถานะการแสดงผลของแต่ละขั้นตอน
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'finish';
    if (stepIndex === currentStep) return 'process';
    return 'wait';
  };

  // รับสีของขั้นตอน
  const getStepColor = (stepIndex) => {
    if (stepIndex < currentStep) return '#52c41a';
    if (stepIndex === currentStep) return '#1890ff';
    return '#d9d9d9';
  };

  // แสดงข้อความการดำเนินการถัดไป
  const getNextActionMessage = () => {
    if (!cs05Data) {
      return 'กรุณาส่งคำร้อง คพ.05 เพื่อเริ่มกระบวนการฝึกงาน';
    }

    switch (cs05Data.status) {
      case 'submitted':
        return 'คำร้องของคุณอยู่ระหว่างการตรวจสอบจากเจ้าหน้าที่ภาควิชา';
      case 'under_review':
        return 'เจ้าหน้าที่ภาควิชากำลังตรวจสอบและรอการอนุมัติจากหัวหน้าภาควิชา';
      case 'approved':
        return 'หนังสือขอความอนุเคราะห์พร้อมแล้ว กรุณาดาวน์โหลดและพิมพ์';
      case 'letter_downloaded':
        return 'กรุณานำหนังสือไปติดต่อบริษัทและอัปโหลดหนังสือตอบรับ';
      case 'acceptance_uploaded':
        return 'เจ้าหน้าที่ภาควิชากำลังตรวจสอบหนังสือตอบรับ';
      case 'acceptance_approved':
        return 'เจ้าหน้าที่ภาควิชากำลังจัดทำหนังสือส่งตัว';
      case 'referral_ready':
        return 'หนังสือส่งตัวพร้อมแล้ว กรุณาดาวน์โหลดและพิมพ์';
      case 'completed':
        return 'กระบวนการฝึกงานเสร็จสิ้นแล้ว สามารถเริ่มฝึกงานได้';
      default:
        return 'กรุณาติดต่อเจ้าหน้าที่ภาควิชาเพื่อสอบถามสถานะ';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text>กำลังโหลดข้อมูลสถานะการฝึกงาน...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 16 }}>
        🔍 ติดตามสถานะการฝึกงาน
      </Title>

      {/* แสดงสถานะปัจจุบัน */}
      <Card style={{ marginBottom: 24 }}>
        <Alert
          message="สถานะปัจจุบัน"
          description={getNextActionMessage()}
          type={cs05Data ? "info" : "warning"}
          showIcon
          style={{ marginBottom: 16 }}
        />

        {/* ข้อมูลคำร้อง CS05 */}
        {cs05Data && (
          <Descriptions 
            title="ข้อมูลคำร้อง คพ.05" 
            bordered 
            column={{ xs: 1, sm: 2, md: 2 }}
            size="small"
          >
            <Descriptions.Item label="บริษัท">
              {cs05Data.companyName}
            </Descriptions.Item>
            <Descriptions.Item label="ตำแหน่ง">
              {cs05Data.internshipPosition}
            </Descriptions.Item>
            <Descriptions.Item label="วันที่ส่งคำร้อง">
              {dayjs(cs05Data.submittedAt).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="ระยะเวลาฝึกงาน">
              {dayjs(cs05Data.startDate).format('DD/MM/YYYY')} - {dayjs(cs05Data.endDate).format('DD/MM/YYYY')}
            </Descriptions.Item>
            <Descriptions.Item label="สถานะ" span={2}>
              <Tag color={getStepColor(currentStep)}>
                {internshipSteps[Math.max(0, currentStep)]?.title || 'ไม่ระบุ'}
              </Tag>
              {/* ลบ Tag โหมดทดสอบ */}
            </Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      {/* Timeline แสดงขั้นตอนทั้งหมด */}
      <Card title="ขั้นตอนการดำเนินการฝึกงาน">
        <Timeline>
          {internshipSteps.map((step, index) => (
            <Timeline.Item
              key={step.id}
              dot={
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: getStepColor(index),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold'
                }}>
                  {index + 1}
                </div>
              }
              color={getStepColor(index)}
            >
              <div style={{ paddingLeft: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                  {step.icon}
                  <Text strong style={{ marginLeft: 8, fontSize: 16 }}>
                    {step.title}
                  </Text>
                  <Tag 
                    color={
                      getStepStatus(index) === 'finish' ? 'success' : 
                      getStepStatus(index) === 'process' ? 'processing' : 'default'
                    }
                    style={{ marginLeft: 8 }}
                  >
                    {getStepStatus(index) === 'finish' ? 'เสร็จสิ้น' : 
                     getStepStatus(index) === 'process' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
                  </Tag>
                </div>
                
                <Paragraph style={{ color: '#666', marginBottom: 8 }}>
                  {step.description}
                </Paragraph>

                {/* แสดงปุ่มดำเนินการสำหรับขั้นตอนที่สามารถทำได้ */}
                {canAccessStep(index) && getStepStatus(index) === 'process' && (
                  <div style={{ marginTop: 12 }}>
                    {index === 0 && !cs05Data && (
                      <Button 
                        type="primary" 
                        icon={<FileTextOutlined />}
                        onClick={() => navigate('/internship-registration/cs05')}
                      >
                        เริ่มกรอกคำร้อง คพ.05
                      </Button>
                    )}
                    {index === 3 && cs05Data?.status === 'approved' && (
                      <Space>
                        <Button 
                          type="primary" 
                          icon={<DownloadOutlined />}
                          onClick={() => navigate('/internship/documents/letter')}
                        >
                          ดาวน์โหลดหนังสือขอความอนุเคราะห์
                        </Button>
                      </Space>
                    )}
                    {index === 4 && cs05Data?.status === 'letter_downloaded' && (
                      <Button 
                        type="primary" 
                        icon={<UploadOutlined />}
                        onClick={() => navigate('/internship/upload/acceptance')}
                      >
                        อัปโหลดหนังสือตอบรับ
                      </Button>
                    )}
                    {index === 6 && cs05Data?.status === 'referral_ready' && (
                      <Button 
                        type="primary" 
                        icon={<DownloadOutlined />}
                        onClick={() => navigate('/internship/documents/referral')}
                      >
                        ดาวน์โหลดหนังสือส่งตัว
                      </Button>
                    )}
                  </div>
                )}

                {/* แสดงข้อความสำหรับขั้นตอนที่ยังไม่สามารถเข้าถึงได้ */}
                {!canAccessStep(index) && getStepStatus(index) === 'wait' && (
                  <Alert
                    message="ยังไม่สามารถดำเนินการได้"
                    description="กรุณาดำเนินการขั้นตอนก่อนหน้าให้เสร็จสิ้นก่อน"
                    type="warning"
                    showIcon
                    size="small"
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>

      {/* ปุ่มดำเนินการ */}
      <div style={{ textAlign: 'center', marginTop: 32 }}>
        <Space size="large">
          {!cs05Data && (
            <Button 
              type="primary" 
              size="large"
              icon={<FileTextOutlined />}
              onClick={() => navigate('/internship-registration/cs05')}
            >
              เริ่มกรอกคำร้อง คพ.05
            </Button>
          )}
          
          <Button 
            size="large"
            icon={<FileTextOutlined />}
            onClick={() => navigate('/internship/documents')}
          >
            จัดการเอกสาร
          </Button>
          
          <Button 
            size="large"
            onClick={() => navigate('/internship')}
          >
            กลับหน้าหลักฝึกงาน
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default StatusCheckPage;