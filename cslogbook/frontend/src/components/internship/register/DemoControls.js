import React, { useState } from 'react';
import { 
  Card, Space, Button, Select, message, Divider, 
  Typography, Row, Col, Switch, Tag, Progress
} from 'antd';
import { 
  PlayCircleOutlined, SettingOutlined, BugOutlined,
  FileTextOutlined, CheckCircleOutlined, UploadOutlined,
  DownloadOutlined, ClockCircleOutlined, FastForwardOutlined,
  StepForwardOutlined, StepBackwardOutlined, ReloadOutlined,
  FormOutlined, ExclamationCircleOutlined, TrophyOutlined,
  SendOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const DemoControls = ({ 
  // รับ props จาก InternshipRegistrationFlow
  currentStep,
  onStepChange,
  formData,
  onFormDataChange,
  studentData,
  onStudentDataChange
}) => {
  const [selectedStatus, setSelectedStatus] = useState('submitted');

  // ขั้นตอนของการลงทะเบียนฝึกงาน
  const internshipSteps = [
    {
      value: 0,
      label: 'กรอกข้อมูล คพ.05',
      description: 'กรอกข้อมูลบริษัทและนักศึกษา',
      color: 'blue',
      icon: <FormOutlined />
    },
    {
      value: 1,
      label: 'ตรวจสอบข้อมูล',
      description: 'ตรวจสอบความถูกต้องของข้อมูล',
      color: 'orange',
      icon: <CheckCircleOutlined />
    },
    {
      value: 2,
      label: 'ส่งคำร้อง',
      description: 'ยืนยันและส่งคำร้องเข้าระบบ',
      color: 'green',
      icon: <UploadOutlined />
    }
  ];

  // ตัวเลือกสถานะต่างๆ สำหรับการทดสอบ (สำหรับใช้ใน step ที่ 2)
  // แก้ไขส่วน statusOptions ให้มีรายละเอียดมากขึ้น
  const statusOptions = [
    {
      value: 'draft',
      label: 'ร่าง (ยังไม่ส่ง)',
      description: 'ยังไม่ได้ส่งคำร้อง คพ.05',
      color: 'default',
      icon: <FileTextOutlined />,
      nextSteps: ['ตรวจสอบข้อมูลก่อนส่ง', 'แก้ไขข้อมูลหากจำเป็น']
    },
    {
      value: 'submitted',
      label: 'ส่งคำร้องแล้ว',
      description: 'ส่งคำร้อง คพ.05 เรียบร้อยแล้ว',
      color: 'processing',
      icon: <CheckCircleOutlined />,
      nextSteps: ['รอการตรวจสอบจากเจ้าหน้าที่', 'ประมาณ 3-5 วันทำการ']
    },
    {
      value: 'under_review',
      label: 'อยู่ระหว่างการตรวจสอบ',
      description: 'เจ้าหน้าที่ภาควิชากำลังตรวจสอบเอกสาร',
      color: 'warning',
      icon: <ClockCircleOutlined />,
      nextSteps: ['รอผลการพิจารณา', 'อาจต้องแก้ไขเอกสารเพิ่มเติม']
    },
    {
      value: 'revision_required',
      label: 'ต้องแก้ไขเอกสาร',
      description: 'มีข้อมูลที่ต้องปรับปรุงหรือแก้ไข',
      color: 'error',
      icon: <ExclamationCircleOutlined />,
      nextSteps: ['แก้ไขตามคำแนะนำ', 'ส่งเอกสารใหม่อีกครั้ง']
    },
    {
      value: 'approved',
      label: 'อนุมัติแล้ว',
      description: 'หนังสือขอความอนุเคราะห์พร้อมดาวน์โหลด',
      color: 'success',
      icon: <CheckCircleOutlined />,
      nextSteps: ['ดาวน์โหลดหนังสือขอความอนุเคราะห์', 'ติดต่อบริษัทเพื่อขอฝึกงาน']
    },
    {
      value: 'letter_downloaded',
      label: 'ดาวน์โหลดหนังสือแล้ว',
      description: 'ได้รับหนังสือขอความอนุเคราะห์แล้ว',
      color: 'cyan',
      icon: <DownloadOutlined />,
      nextSteps: ['นำหนังสือไปติดต่อบริษัท', 'รอหนังสือตอบรับจากบริษัท']
    },
    {
      value: 'company_contacted',
      label: 'ติดต่อบริษัทแล้ว',
      description: 'ได้นำหนังสือไปติดต่อบริษัทแล้ว',
      color: 'purple',
      icon: <SendOutlined />,
      nextSteps: ['รอการพิจารณาจากบริษัท', 'ติดตามผลการสมัคร']
    },
    {
      value: 'acceptance_received',
      label: 'ได้รับหนังสือตอบรับ',
      description: 'บริษัทตอบรับให้เข้าฝึกงาน',
      color: 'green',
      icon: <CheckCircleOutlined />,
      nextSteps: ['อัปโหลดหนังสือตอบรับ', 'รอหนังสือส่งตัว']
    },
    {
      value: 'acceptance_uploaded',
      label: 'อัปโหลดหนังสือตอบรับแล้ว',
      description: 'ส่งหนังสือตอบรับจากบริษัทแล้ว',
      color: 'lime',
      icon: <UploadOutlined />,
      nextSteps: ['รอการจัดทำหนังสือส่งตัว', 'ประมาณ 2-3 วันทำการ']
    },
    {
      value: 'referral_ready',
      label: 'หนังสือส่งตัวพร้อม',
      description: 'หนังสือส่งตัวพร้อมดาวน์โหลด',
      color: 'gold',
      icon: <FileTextOutlined />,
      nextSteps: ['ดาวน์โหลดหนังสือส่งตัว', 'เตรียมตัวเริ่มฝึกงาน']
    },
    {
      value: 'internship_started',
      label: 'เริ่มฝึกงานแล้ว',
      description: 'รายงานตัวและเริ่มฝึกงานแล้ว',
      color: 'volcano',
      icon: <PlayCircleOutlined />,
      nextSteps: ['ทำงานตามแผนฝึกงาน', 'บันทึกผลการฝึกงาน']
    },
    {
      value: 'completed',
      label: 'ฝึกงานเสร็จสิ้น',
      description: 'ฝึกงานเสร็จสิ้นเรียบร้อย',
      color: 'magenta',
      icon: <TrophyOutlined />,
      nextSteps: ['ส่งรายงานการฝึกงาน', 'ประเมินผลการฝึกงาน']
    }
  ];

  // ข้อมูลตัวอย่างที่แตกต่างกันสำหรับแต่ละขั้นตอน
  const getStepMockData = (stepIndex) => {
    const baseMockData = {
      companyName: 'บริษัท เทคโนโลยีสารสนเทศ จำกัด',
      companyAddress: 'ถนนเทคโนโลยี แขวงนวัตกรรม เขตดิจิทัล กรุงเทพฯ',
      internshipPosition: 'Software Developer, Data Analyst',
      contactEmail: 'hr@techinfo.co.th',
      contactPhone: '0946650259',
      hasTwoStudents: true,
      additionalNotes: 'นักศึกษามีความสนใจในการพัฒนาระบบเว็บแอปพลิเคชัน และการวิเคราะห์ข้อมูล เป็นโครงการพัฒนาระบบ'
    };

    switch (stepIndex) {
      case 0:
        // ขั้นตอนกรอกข้อมูล - ข้อมูลยังไม่ครบ
        return {
          companyName: '',
          companyAddress: '',
          internshipPosition: '',
          contactEmail: '',
          contactPhone: '',
          hasTwoStudents: false,
          additionalNotes: ''
        };
      case 1:
        // ขั้นตอนตรวจสอบ - ข้อมูลครบแล้ว
        return baseMockData;
      case 2:
        // ขั้นตอนส่งคำร้อง - ข้อมูลครบและมี ID
        return {
          ...baseMockData,
          id: 'demo-cs05-001',
          status: selectedStatus,
          submittedAt: new Date().toISOString()
        };
      default:
        return baseMockData;
    }
  };

  // ฟังก์ชันเปลี่ยนขั้นตอน
  const handleStepChange = (newStep) => {
    if (onStepChange) {
      onStepChange(newStep);
    }
    
    // อัปเดตข้อมูลตามขั้นตอนใหม่
    const newFormData = getStepMockData(newStep);
    if (onFormDataChange) {
      onFormDataChange(newFormData);
    }

    const stepInfo = internshipSteps.find(step => step.value === newStep);
    message.success(`เปลี่ยนไปขั้นตอน: ${stepInfo.label}`, 2);
  };

  // ฟังก์ชันเปลี่ยนสถานะ (สำหรับขั้นตอนสุดท้าย)
  const handleStatusChange = (newStatus) => {
    setSelectedStatus(newStatus);
    
    if (currentStep === 2) {
      const updatedData = {
        ...formData,
        status: newStatus,
        submittedAt: new Date().toISOString()
      };
      
      if (onFormDataChange) {
        onFormDataChange(updatedData);
      }

      const statusInfo = statusOptions.find(opt => opt.value === newStatus);
      message.success(`เปลี่ยนสถานะเป็น: ${statusInfo.label}`, 2);
    }
  };

  // ฟังก์ชันเติมข้อมูลในฟอร์มอัตโนมัติ
  const fillFormAutomatically = () => {
    const mockData = getStepMockData(1); // ใช้ข้อมูลขั้นตอนที่ 1 (ข้อมูลครบ)
    
    if (onFormDataChange) {
      onFormDataChange(mockData);
    }
    
    message.success('เติมข้อมูลในฟอร์มอัตโนมัติแล้ว', 2);
  };

  // ฟังก์ชันเปลี่ยนข้อมูลนักศึกษา
  const changeStudentData = () => {
    const alternativeStudents = [
      {
        fullName: 'นายพิศิษฐ์ บวรเลิศสุข',
        studentId: '65160123',
        year: '4',
        faculty: 'คณะเทคโนโลยีสารสนเทศ',
        major: 'วิทยาการคอมพิวเตอร์',
        totalCredits: 120
      },
      {
        fullName: 'นางสาวสมใจ รักเรียน',
        studentId: '65160124',
        year: '3',
        faculty: 'คณะเทคโนโลยีสารสนเทศ',
        major: 'วิทยาการคอมพิวเตอร์',
        totalCredits: 95
      },
      {
        fullName: 'นายสมชาย ใจดี',
        studentId: '65160125',
        year: '4',
        faculty: 'คณะวิศวกรรมศาสตร์',
        major: 'วิศวกรรมคอมพิวเตอร์',
        totalCredits: 115
      }
    ];

    const currentIndex = alternativeStudents.findIndex(s => s.studentId === studentData?.studentId);
    const nextIndex = (currentIndex + 1) % alternativeStudents.length;
    const newStudent = alternativeStudents[nextIndex];

    if (onStudentDataChange) {
      onStudentDataChange(newStudent);
    }

    message.success(`เปลี่ยนข้อมูลนักศึกษาเป็น: ${newStudent.fullName}`, 2);
  };

  // ฟังก์ชันรีเซ็ตข้อมูลทั้งหมด
  const handleReset = () => {
    if (onStepChange) {
      onStepChange(0);
    }
    
    if (onFormDataChange) {
      onFormDataChange({});
    }
    
    setSelectedStatus('draft');
    message.info('รีเซ็ตข้อมูลกลับสู่สถานะเริ่มต้น');
  };

  // ฟังก์ชันจำลองการดำเนินการอัตโนมัติ
  const simulateWorkflow = async () => {
    message.info('เริ่มจำลองขั้นตอนการทำงานอัตโนมัติ...', 2);
    
    // ขั้นตอนที่ 0: เติมข้อมูล
    await new Promise(resolve => setTimeout(resolve, 1500));
    fillFormAutomatically();
    
    // ขั้นตอนที่ 1: ไปหน้าตรวจสอบ
    await new Promise(resolve => setTimeout(resolve, 1500));
    handleStepChange(1);
    
    // ขั้นตอนที่ 2: ส่งคำร้อง
    await new Promise(resolve => setTimeout(resolve, 1500));
    handleStepChange(2);
    
    // เปลี่ยนสถานะเป็นส่งแล้ว
    await new Promise(resolve => setTimeout(resolve, 1000));
    handleStatusChange('submitted');
    
    message.success('จำลองขั้นตอนเสร็จสิ้น!');
  };

  // ฟังก์ชันจำลองไทม์ไลน์แบบสมจริง
  const simulateRealisticTimeline = async () => {
    message.info('🎬 เริ่มจำลองไทม์ไลน์แบบสมจริง...', 3);
    
    // ขั้นตอนที่ 1: ส่งคำร้อง
    await new Promise(resolve => setTimeout(resolve, 1000));
    handleStepChange(2);
    handleStatusChange('submitted');
    message.success('✅ ส่งคำร้อง คพ.05 เรียบร้อย', 2);
    
    // ขั้นตอนที่ 2: รอการตรวจสอบ
    await new Promise(resolve => setTimeout(resolve, 1500));
    handleStatusChange('under_review');
    message.info('⏳ เจ้าหน้าที่กำลังตรวจสอบเอกสาร...', 2);
    
    // ขั้นตอนที่ 3: อนุมัติ
    await new Promise(resolve => setTimeout(resolve, 2000));
    handleStatusChange('approved');
    message.success('🎉 อนุมัติแล้ว! หนังสือขอความอนุเคราะห์พร้อมดาวน์โหลด', 2);
    
    // ขั้นตอนที่ 4: ดาวน์โหลดหนังสือ
    await new Promise(resolve => setTimeout(resolve, 1000));
    handleStatusChange('letter_downloaded');
    message.info('📥 ดาวน์โหลดหนังสือขอความอนุเคราะห์แล้ว', 2);
    
    // ขั้นตอนที่ 5: ติดต่อบริษัท
    await new Promise(resolve => setTimeout(resolve, 1500));
    handleStatusChange('company_contacted');
    message.info('📞 ติดต่อบริษัทด้วยหนังสือขอความอนุเคราะห์', 2);
    
    // ขั้นตอนที่ 6: ได้รับการตอบรับ
    await new Promise(resolve => setTimeout(resolve, 2500));
    handleStatusChange('acceptance_received');
    message.success('💌 บริษัทตอบรับให้เข้าฝึกงาน!', 2);
    
    // ขั้นตอนที่ 7: อัปโหลดหนังสือตอบรับ
    await new Promise(resolve => setTimeout(resolve, 1000));
    handleStatusChange('acceptance_uploaded');
    message.info('📤 อัปโหลดหนังสือตอบรับจากบริษัท', 2);
    
    // ขั้นตอนที่ 8: หนังสือส่งตัวพร้อม
    await new Promise(resolve => setTimeout(resolve, 1500));
    handleStatusChange('referral_ready');
    message.success('📋 หนังสือส่งตัวพร้อมดาวน์โหลด', 2);
    
    // ขั้นตอนที่ 9: เริ่มฝึกงาน
    await new Promise(resolve => setTimeout(resolve, 1000));
    handleStatusChange('internship_started');
    message.success('🚀 เริ่มฝึกงานแล้ว! ขอให้โชคดี', 3);
    
    message.success('🎊 จำลองไทม์ไลน์เสร็จสมบูรณ์!', 3);
  };

  // ฟังก์ชันจำลองปัญหาที่อาจเกิดขึ้น
  const simulateProblems = async () => {
    message.warning('⚠️ จำลองสถานการณ์ที่มีปัญหา...', 2);
    
    // ส่งคำร้อง
    handleStepChange(2);
    handleStatusChange('submitted');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // ตรวจสอบแล้วพบปัญหา
    handleStatusChange('under_review');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // ต้องแก้ไข
    handleStatusChange('revision_required');
    message.error('❌ เอกสารต้องแก้ไข: ข้อมูลบริษัทไม่ครบถ้วน', 3);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // แก้ไขแล้วส่งใหม่
    handleStatusChange('submitted');
    message.info('🔄 ส่งเอกสารที่แก้ไขแล้ว', 2);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // อนุมัติในที่สุด
    handleStatusChange('approved');
    message.success('✅ อนุมัติแล้วหลังจากแก้ไข!', 2);
  };

  // ฟังก์ชันกระโดดไปสถานะใดก็ได้
  const jumpToStatus = (targetStatus) => {
    handleStepChange(2); // ไปขั้นตอนสุดท้าย
    handleStatusChange(targetStatus);
    
    const statusInfo = statusOptions.find(s => s.value === targetStatus);
    message.success(`🎯 กระโดดไปสถานะ: ${statusInfo.label}`, 2);
  };

  return (
    <Card 
      title={
        <Space>
          <BugOutlined style={{ color: '#ff7a00' }} />
          <span style={{ color: '#ff7a00' }}>Demo Controls</span>
          <Tag color="orange">การทดสอบ</Tag>
        </Space>
      }
      size="small"
      style={{ 
        border: '2px dashed #ff7a00',
        backgroundColor: '#fff7e6',
        marginBottom: 16
      }}
    >
      <Row gutter={16}>
        <Col xs={24} md={12}>
          {/* ควบคุมขั้นตอน */}
          <div style={{ marginBottom: 16 }}>
            <Text strong>ขั้นตอนปัจจุบัน:</Text>
            <div style={{ marginTop: 8 }}>
              <Select
                value={currentStep}
                onChange={handleStepChange}
                style={{ width: '100%' }}
                placeholder="เลือกขั้นตอน"
              >
                {internshipSteps.map(step => (
                  <Option key={step.value} value={step.value}>
                    <Space>
                      {step.icon}
                      <span>{step.label}</span>
                      <Tag color={step.color} size="small">
                        Step {step.value + 1}
                      </Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {/* ควบคุมสถานะ (แสดงเฉพาะในขั้นตอนสุดท้าย) */}
          {currentStep === 2 && (
            <div style={{ marginBottom: 16 }}>
              <Text strong>สถานะการส่งคำร้อง:</Text>
              <Select
                value={selectedStatus}
                onChange={handleStatusChange}
                style={{ width: '100%', marginTop: 8 }}
                placeholder="เลือกสถานะ"
              >
                {statusOptions.map(option => (
                  <Option key={option.value} value={option.value}>
                    <Space>
                      {option.icon}
                      <span>{option.label}</span>
                      <Tag color={option.color} size="small">
                        {option.value}
                      </Tag>
                    </Space>
                  </Option>
                ))}
              </Select>
            </div>
          )}
        </Col>

        <Col xs={24} md={12}>
          {/* แสดงสถานะปัจจุบัน */}
          <div style={{ marginBottom: 16 }}>
            <Text strong>สถานะปัจจุบัน:</Text>
            <div style={{ marginTop: 8 }}>
              {(() => {
                const current = internshipSteps.find(step => step.value === currentStep);
                return (
                  <Space direction="vertical" size="small">
                    <Tag color={current?.color} icon={current?.icon}>
                      {current?.label}
                    </Tag>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {current?.description}
                    </Text>
                  </Space>
                );
              })()}
            </div>
          </div>

          {/* แสดงข้อมูลนักศึกษาปัจจุบัน */}
          <div style={{ marginBottom: 16 }}>
            <Text strong>นักศึกษา:</Text>
            <div style={{ marginTop: 4, fontSize: 12 }}>
              {studentData?.fullName || 'ไม่มีข้อมูล'} ({studentData?.studentId || 'N/A'})
            </div>
          </div>
        </Col>
      </Row>

      <Divider style={{ margin: '16px 0' }} />

      {/* แสดงขั้นตอนถัดไปและคำแนะนำ */}
      {currentStep === 2 && (
        <div style={{ marginBottom: 16 }}>
          <Text strong>ขั้นตอนถัดไป:</Text>
          <div style={{ marginTop: 8, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6 }}>
            {(() => {
              const currentStatus = statusOptions.find(s => s.value === selectedStatus);
              return (
                <div>
                  <div style={{ marginBottom: 8 }}>
                    <Tag color={currentStatus?.color} icon={currentStatus?.icon}>
                      {currentStatus?.label}
                    </Tag>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {currentStatus?.description}
                  </Text>
                  {currentStatus?.nextSteps && (
                    <div style={{ marginTop: 8 }}>
                      <Text strong style={{ fontSize: 12 }}>สิ่งที่ต้องทำต่อไป:</Text>
                      <ul style={{ margin: '4px 0', paddingLeft: 16, fontSize: 12 }}>
                        {currentStatus.nextSteps.map((step, index) => (
                          <li key={index}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ปุ่มควบคุมต่างๆ */}
      <div>
        <Text strong>การดำเนินการทดสอบ:</Text>
        <div style={{ marginTop: 12 }}>
          <Space wrap>
            {/* ปุ่มควบคุมขั้นตอน */}
            <Button 
              icon={<StepBackwardOutlined />}
              onClick={() => handleStepChange(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              size="small"
            >
              ขั้นตอนก่อนหน้า
            </Button>
            
            <Button 
              icon={<StepForwardOutlined />}
              onClick={() => handleStepChange(Math.min(2, currentStep + 1))}
              disabled={currentStep === 2}
              size="small"
            >
              ขั้นตอนถัดไป
            </Button>

            {/* ปุ่มเติมข้อมูลอัตโนมัติ */}
            {currentStep === 0 && (
              <Button 
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={fillFormAutomatically}
                size="small"
              >
                เติมข้อมูลอัตโนมัติ
              </Button>
            )}
            
            {/* ปุ่มจำลองขั้นตอนอัตโนมัติ */}
            <Button 
              icon={<FastForwardOutlined />}
              onClick={simulateWorkflow}
              size="small"
              type="default"
            >
              จำลองทั้งขั้นตอน
            </Button>

            {/* ปุ่มเปลี่ยนข้อมูลนักศึกษา */}
            <Button 
              icon={<SettingOutlined />}
              onClick={changeStudentData}
              size="small"
            >
              เปลี่ยนนักศึกษา
            </Button>
            
            {/* ปุ่มรีเซ็ต */}
            <Button 
              danger
              icon={<ReloadOutlined />}
              onClick={handleReset}
              size="small"
            >
              รีเซ็ตทั้งหมด
            </Button>
          </Space>
        </div>
      </div>

      {/* แสดงข้อมูลจำลองที่ใช้ */}
      <Divider style={{ margin: '16px 0' }} />
      
      <div style={{ fontSize: 12, color: '#666' }}>
        <Text strong>ข้อมูลที่กำลังใช้:</Text>
        <div style={{ marginTop: 4 }}>
          <div>• ขั้นตอน: {internshipSteps[currentStep]?.label}</div>
          <div>• บริษัท: {formData?.companyName || 'ยังไม่มีข้อมูล'}</div>
          <div>• ตำแหน่ง: {formData?.internshipPosition || 'ยังไม่มีข้อมูล'}</div>
          <div>• จำนวนนักศึกษา: {formData?.hasTwoStudents ? '2 คน' : '1 คน'}</div>
          {currentStep === 2 && (
            <>
              <div>• สถานะ: {statusOptions.find(s => s.value === selectedStatus)?.label}</div>
              <div>• วันที่ส่งคำร้อง: {formData?.submittedAt ? new Date(formData.submittedAt).toLocaleDateString('th-TH') : 'ยังไม่ได้ส่ง'}</div>
              {formData?.id && <div>• รหัสคำร้อง: {formData.id}</div>}
            </>
          )}
        </div>
        
        {/* แสดงความคืบหน้าแบบ Progress */}
        {currentStep === 2 && (
          <div style={{ marginTop: 12 }}>
            <Text strong style={{ fontSize: 11 }}>ความคืบหน้า:</Text>
            <Progress 
              percent={Math.round((statusOptions.findIndex(s => s.value === selectedStatus) + 1) / statusOptions.length * 100)}
              size="small"
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ marginTop: 4 }}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default DemoControls;