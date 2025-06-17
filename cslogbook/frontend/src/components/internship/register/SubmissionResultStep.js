import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Card, Timeline, Button, Space, Tag, Alert, Row, Col,
  Descriptions, Divider, Steps, Statistic
} from 'antd';
import {
  CheckCircleOutlined, ClockCircleOutlined, FileTextOutlined,
  AuditOutlined, PrinterOutlined, UploadOutlined, FileDoneOutlined,
  DownloadOutlined, HomeOutlined, ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import internshipService from '../../../services/internshipService';

const { Title, Paragraph, Text } = Typography;

const SubmissionResultStep = ({ navigate, formData, existingCS05, studentData, transcriptFile }) => {
  const [currentInternshipStep, setCurrentInternshipStep] = useState(1);
  const [cs05Status, setCs05Status] = useState(existingCS05?.status || 'submitted');
  const [loading, setLoading] = useState(false);

  // ฟังก์ชันแปลงสถานะ CS05 เป็นขั้นตอนฝึกงาน
  const getStepFromStatus = (status) => {
    switch (status) {
      case 'submitted':
      case 'under_review':
        return 1; // การอนุมัติจากเจ้าหน้าที่ภาควิชา
      case 'approved':
      case 'letter_ready':
        return 2; // รอหนังสือขอความอนุเคราะห์
      case 'letter_downloaded':
        return 3; // พิมพ์หนังสือขอความอนุเคราะห์
      case 'acceptance_uploaded':
        return 4; // อัปโหลดหนังสือตอบรับ
      case 'acceptance_approved':
        return 5; // รอหนังสือส่งตัว
      case 'referral_ready':
        return 6; // นักศึกษาพิมพ์หนังสือส่งตัว
      case 'completed':
        return 7; // เสร็จสิ้นทุกขั้นตอน
      default:
        return 1;
    }
  };

  // อัปเดตสถานะขั้นตอนตามสถานะ CS05
  const updateStepFromStatus = (status) => {
    const newStep = getStepFromStatus(status);
    console.log(`[DEBUG] อัปเดตจากสถานะ ${status} เป็นขั้นตอนที่ ${newStep}`);
    setCurrentInternshipStep(newStep);
    setCs05Status(status);
  };

  // โหลดสถานะ CS05 ล่าสุดจาก API
  const fetchLatestCS05Status = async () => {
    try {
      setLoading(true);
      const response = await internshipService.getCurrentCS05();
      
      if (response.success && response.data) {
        const latestStatus = response.data.status;
        console.log('[DEBUG] สถานะ CS05 ล่าสุด:', latestStatus);
        
        // อัปเดตขั้นตอนตามสถานะใหม่
        updateStepFromStatus(latestStatus);
      }
    } catch (error) {
      console.error('Error fetching CS05 status:', error);
    } finally {
      setLoading(false);
    }
  };

  // เรียกใช้เมื่อ component โหลด
  useEffect(() => {
    // ตั้งค่าขั้นตอนเริ่มต้นจากข้อมูลที่มีอยู่
    if (existingCS05?.status) {
      updateStepFromStatus(existingCS05.status);
    }

    // โหลดสถานะล่าสุดจาก API
    fetchLatestCS05Status();

    // ตั้งค่า polling เพื่อตรวจสอบสถานะทุก 30 วินาที
    const pollInterval = setInterval(fetchLatestCS05Status, 30000);

    return () => clearInterval(pollInterval);
  }, [existingCS05?.status]);

  // แสดงข้อมูลตามโครงสร้างที่มาจาก existingCS05 หรือ formData
  const displayData = existingCS05 || formData || {};

  // ขั้นตอนทั้งหมดของการฝึกงาน (7 ขั้นตอน) - อัปเดตให้สะท้อนสถานะปัจจุบัน
  const internshipProcessSteps = [
    {
      title: 'กรอกข้อมูล คพ.05',
      description: 'ส่งคำร้องขอฝึกงาน พร้อมข้อมูลบริษัทและนักศึกษา',
      icon: <FileTextOutlined />,
      status: 'finish', // เสร็จแล้วเสมอ
      color: '#52c41a',
      details: [
        'ข้อมูลบริษัท / หน่วยงาน และสถานที่ตั้ง',
        'ข้อมูลผู้ติดต่อ (HR หรือผู้รับผิดชอบ)',
        'ตำแหน่งที่ขอฝึกงาน',
        'รายชื่อนักศึกษา (ไม่เกิน 2 คน)',
        'ข้อมูลส่วนตัว: ชื่อ-สกุล, ชั้นปี, ห้อง, รหัสนักศึกษา',
        'เบอร์โทรศัพท์และหน่วยกิตสะสม',
        'วันที่เริ่มต้นและสิ้นสุดการฝึกงาน'
      ]
    },
    {
      title: 'การอนุมัติจากเจ้าหน้าที่ภาควิชา',
      description: 'เจ้าหน้าที่ภาควิชาตรวจสอบและส่งให้หัวหน้าภาควิชาเซ็น',
      icon: <AuditOutlined />,
      status: currentInternshipStep > 1 ? 'finish' : 'process',
      color: currentInternshipStep > 1 ? '#52c41a' : '#1890ff',
      details: [
        'เจ้าหน้าที่ภาควิชาตรวจสอบความถูกต้องของข้อมูล',
        'ตรวจสอบคุณสมบัติของนักศึกษา (หน่วยกิต, ชั้นปี)',
        'ส่งเอกสารให้หัวหน้าภาควิชาเพื่อพิจารณาอนุมัติ',
        'ระยะเวลาดำเนินการ: 2-3 วันทำการ'
      ]
    },
    {
      title: 'รอหนังสือขอความอนุเคราะห์',
      description: 'รอการอนุมัติจากหัวหน้าภาควิชา',
      icon: <ClockCircleOutlined />,
      status: currentInternshipStep > 2 ? 'finish' : currentInternshipStep === 2 ? 'process' : 'wait',
      color: currentInternshipStep > 2 ? '#52c41a' : currentInternshipStep === 2 ? '#1890ff' : '#d9d9d9',
      details: [
        'หัวหน้าภาควิชาพิจารณาและลงนามอนุมัติ',
        'จัดทำหนังสือขอความอนุเคราะห์ฝึกงาน',
        'เตรียมเอกสารสำหรับนักศึกษาดาวน์โหลด',
        'ระยะเวลาดำเนินการ: 3-5 วันทำการ'
      ]
    },
    {
      title: 'พิมพ์หนังสือขอความอนุเคราะห์',
      description: 'นักศึกษาดาวน์โหลดและพิมพ์เอกสาร',
      icon: <PrinterOutlined />,
      status: currentInternshipStep > 3 ? 'finish' : currentInternshipStep === 3 ? 'process' : 'wait',
      color: currentInternshipStep > 3 ? '#52c41a' : currentInternshipStep === 3 ? '#1890ff' : '#d9d9d9',
      details: [
        'ดาวน์โหลดหนังสือขอความอนุเคราะห์ฝึกงาน',
        'ดาวน์โหลดแบบฟอร์มหนังสือตอบรับนักศึกษาเข้าฝึกงาน',
        'พิมพ์เอกสารทั้งสองฉบับ',
        'นำเอกสารไปติดต่อบริษัท/หน่วยงาน'
      ]
    },
    {
      title: 'อัปโหลดหนังสือตอบรับนักศึกษาเข้าฝึกงาน',
      description: 'อัปโหลดหนังสือตอบรับจากบริษัท',
      icon: <UploadOutlined />,
      status: currentInternshipStep > 4 ? 'finish' : currentInternshipStep === 4 ? 'process' : 'wait',
      color: currentInternshipStep > 4 ? '#52c41a' : currentInternshipStep === 4 ? '#1890ff' : '#d9d9d9',
      details: [
        'รับหนังสือตอบรับจากบริษัท/หน่วยงาน',
        'อัปโหลดหนังสือตอบรับเข้าสู่ระบบ',
        'เจ้าหน้าที่ภาควิชาตรวจสอบเอกสาร',
        'รอการอนุมัติเพื่อดำเนินการขั้นตอนถัดไป'
      ]
    },
    {
      title: 'รอหนังสือส่งตัว',
      description: 'เจ้าหน้าที่ภาควิชาออกหนังสือส่งตัว',
      icon: <FileDoneOutlined />,
      status: currentInternshipStep > 5 ? 'finish' : currentInternshipStep === 5 ? 'process' : 'wait',
      color: currentInternshipStep > 5 ? '#52c41a' : currentInternshipStep === 5 ? '#1890ff' : '#d9d9d9',
      details: [
        'เจ้าหน้าที่ภาควิชาจัดทำหนังสือส่งตัวนักศึกษา',
        'ตรวจสอบรายละเอียดก่อนออกเอกสาร',
        'เตรียมเอกสารสำหรับนักศึกษาดาวน์โหลด',
        'ระยะเวลาดำเนินการ: 2-3 วันทำการ'
      ]
    },
    {
      title: 'นักศึกษาพิมพ์หนังสือส่งตัว',
      description: 'ดาวน์โหลดและพิมพ์หนังสือส่งตัวเพื่อไปแจ้งให้กับบริษัท',
      icon: <DownloadOutlined />,
      status: currentInternshipStep > 6 ? 'finish' : currentInternshipStep === 6 ? 'process' : 'wait',
      color: currentInternshipStep > 6 ? '#52c41a' : currentInternshipStep === 6 ? '#1890ff' : '#d9d9d9',
      details: [
        'ดาวน์โหลดหนังสือส่งตัวจากระบบ',
        'พิมพ์เอกสารเพื่อนำไปรายงานตัว',
        'นำหนังสือไปแจ้งให้กับบริษัท/หน่วยงาน',
        'เริ่มต้นการฝึกงานตามกำหนดการ'
      ]
    }
  ];

  // รายละเอียดขั้นตอนปัจจุบัน
  const getCurrentStepDetails = () => {
    const currentStep = internshipProcessSteps[currentInternshipStep - 1]; // ลบ 1 เพราะ array เริ่มที่ 0
    return {
      title: currentStep?.title || '',
      description: currentStep?.description || '',
      nextAction: getNextActionText(currentInternshipStep - 1)
    };
  };

  // ข้อความแสดงการกระทำถัดไป
  const getNextActionText = (stepIndex) => {
    switch (stepIndex) {
      case 0:
        return 'คำร้อง คพ.05 ได้รับการบันทึกในระบบเรียบร้อยแล้ว รอเจ้าหน้าที่ภาควิชาตรวจสอบ';
      case 1:
        return 'เจ้าหน้าที่ภาควิชากำลังตรวจสอบข้อมูลและจะส่งให้หัวหน้าภาควิชาพิจารณาอนุมัติ';
      case 2:
        return 'กรุณารอการอนุมัติจากหัวหน้าภาควิชาเพื่อออกหนังสือขอความอนุเคราะห์';
      case 3:
        return 'หนังสือขอความอนุเคราะห์พร้อมแล้ว กรุณาดาวน์โหลดและพิมพ์เพื่อนำไปติดต่อบริษัท';
      case 4:
        return 'กรุณาอัปโหลดหนังสือตอบรับจากบริษัทเพื่อดำเนินการขั้นตอนถัดไป';
      case 5:
        return 'กรุณารอเจ้าหน้าที่ภาควิชาจัดทำหนังสือส่งตัว';
      case 6:
        return 'หนังสือส่งตัวพร้อมแล้ว กรุณาดาวน์โหลดและพิมพ์เพื่อนำไปรายงานตัว';
      default:
        return 'ขั้นตอนการฝึกงานเสร็จสมบูรณ์แล้ว';
    }
  };

  // คำนวณระยะเวลาฝึกงาน
  const calculateInternshipDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const diffInDays = end.diff(start, 'day') + 1;
    const diffInMonths = Math.round(diffInDays / 30);
    
    return `${diffInMonths} เดือน (${diffInDays} วัน)`;
  };

  const stepDetails = getCurrentStepDetails();

  return (
    <div>
      {/* หัวข้อหลักพร้อมแสดงสถานะปัจจุบัน */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <CheckCircleOutlined 
          style={{ fontSize: '64px', color: '#52c41a', marginBottom: 16 }} 
        />
        <Title level={3}>ส่งคำร้องเรียบร้อยแล้ว!</Title>
        <Paragraph>
          คำร้อง คพ.05 ของคุณได้รับการบันทึกในระบบเรียบร้อยแล้ว<br/>
          
          {/* แสดงสถานะปัจจุบัน */}
          {/* <Space style={{ marginTop: 8 }}>
            <Text strong>สถานะปัจจุบัน:</Text>
            <Tag color={cs05Status === 'approved' ? 'success' : 'processing'} style={{ fontSize: '14px' }}>
              {cs05Status === 'submitted' ? '📝 รอตรวจสอบ' :
               cs05Status === 'under_review' ? '🔍 กำลังตรวจสอบ' :
               cs05Status === 'approved' ? '✅ อนุมัติแล้ว' :
               cs05Status === 'rejected' ? '❌ ไม่อนุมัติ' :
               cs05Status}
            </Tag>
          </Space>
          
          <br/> */}
          <Text strong style={{ color: '#1890ff' }}>
            {stepDetails.nextAction}
          </Text>
        </Paragraph>

        {/* เพิ่มปุ่มรีเฟรชสถานะ */}
        {/* <Button 
          type="primary" 
          ghost 
          loading={loading}
          icon={<ReloadOutlined />}
          onClick={fetchLatestCS05Status}
          style={{ marginTop: 16 }}
        >
          ตรวจสอบสถานะล่าสุด
        </Button> */}
      </div>

      {/* ข้อมูลการส่งคำร้อง */}
      {/* <Card 
        title="รายละเอียดการส่งคำร้อง" 
        style={{ marginBottom: 24 }}
        extra={
          <Tag color="success">
            ส่งเมื่อ: {dayjs().format('DD/MM/YYYY HH:mm')}
          </Tag>
        }
      > */}
        {/* แสดงรายละเอียดขั้นตอนปัจจุบัน */}
        {/* <Alert
          message={`ขั้นตอนปัจจุบัน: ${stepDetails.title}`}
          description={stepDetails.nextAction}
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        /> */}
        
        {/* แสดงข้อมูลโดยสรุป */}
        {/* <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="บริษัท/หน่วยงาน">
            {displayData.companyName || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="ตำแหน่งฝึกงาน">
            {displayData.internshipPosition || '-'}
          </Descriptions.Item>
          <Descriptions.Item label="ระยะเวลาฝึกงาน">
            {calculateInternshipDuration(displayData.startDate, displayData.endDate)}
          </Descriptions.Item>
          <Descriptions.Item label="วันที่เริ่มต้น">
            {displayData.startDate ? dayjs(displayData.startDate).format('DD/MM/YYYY') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="วันที่สิ้นสุด">
            {displayData.endDate ? dayjs(displayData.endDate).format('DD/MM/YYYY') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="สถานะ">
            <Tag color={cs05Status === 'approved' ? 'success' : 'processing'}>
              {cs05Status === 'submitted' ? 'รอตรวจสอบ' :
               cs05Status === 'under_review' ? 'กำลังตรวจสอบ' :
               cs05Status === 'approved' ? 'อนุมัติแล้ว' :
               cs05Status === 'rejected' ? 'ไม่อนุมัติ' :
               cs05Status}
            </Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card> */}

      {/* Timeline แสดงขั้นตอนทั้งหมด */}
      <Card title="ขั้นตอนการดำเนินการฝึกงาน (ทั้งหมด 7 ขั้นตอน)" style={{ marginBottom: 24 }}>
        <Timeline>
          {internshipProcessSteps.map((step, index) => (
            <Timeline.Item
              key={index}
              dot={
                <div style={{ 
                  width: 32, 
                  height: 32, 
                  borderRadius: '50%', 
                  backgroundColor: step.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px'
                }}>
                  {index + 1}
                </div>
              }
              color={step.color}
            >
              <div style={{ paddingLeft: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Text strong style={{ fontSize: '16px' }}>{step.title}</Text>
                  <Tag color={
                    step.status === 'finish' ? 'success' : 
                    step.status === 'process' ? 'processing' : 'default'
                  }>
                    {step.status === 'finish' ? 'เสร็จสิ้น' : 
                     step.status === 'process' ? 'กำลังดำเนินการ' : 'รอดำเนินการ'}
                  </Tag>
                </div>
                <Text type="secondary">{step.description}</Text>
                
                {/* แสดงรายละเอียดเพิ่มเติมสำหรับขั้นตอนปัจจุบัน */}
                {index === (currentInternshipStep - 1) && (
                  <Alert
                    message="รายละเอียดขั้นตอนนี้"
                    description={
                      <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex}>{detail}</li>
                        ))}
                      </ul>
                    }
                    type="info"
                    showIcon
                    style={{ marginTop: 12 }}
                  />
                )}
              </div>
            </Timeline.Item>
          ))}
        </Timeline>
      </Card>
    </div>
  );
};

export default SubmissionResultStep;