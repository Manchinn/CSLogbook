import React, { useState, useEffect } from 'react';
import { 
  Steps, Card, Typography, Alert, Space, message, Switch,
  Row, Col, Progress, Divider, Tag // เพิ่มตรงนี้
} from 'antd';
import { 
  FormOutlined, CheckCircleOutlined, SendOutlined, BugOutlined,
  PhoneOutlined // เพิ่มตรงนี้
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import internshipService from '../../../services/internshipService';

// นำเข้า Components ย่อยที่สร้างไว้แล้ว
import CS05FormStep from './CS05FormStep';
import ReviewDataStep from './ReviewDataStep';
import SubmissionResultStep from './SubmissionResultStep';
import DemoControls from './DemoControls'; // เพิ่มบรรทัดนี้

// นำเข้า CSS ที่มีอยู่แล้ว
import '../shared/InternshipStyles.css';

const { Title } = Typography;

const InternshipRegistrationFlow = () => {
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [formData, setFormData] = useState({});
  const [demoMode, setDemoMode] = useState(false);

  // ขั้นตอนการลงทะเบียนฝึกงาน
  const registrationSteps = [
    {
      title: 'กรอกข้อมูล คพ.05',
      description: 'กรอกข้อมูลบริษัทและนักศึกษา',
      icon: <FormOutlined />,
      content: 'form'
    },
    {
      title: 'ตรวจสอบข้อมูล',
      description: 'ตรวจสอบความถูกต้องของข้อมูล',
      icon: <CheckCircleOutlined />,
      content: 'review'
    },
    {
      title: 'ส่งคำร้อง',
      description: 'ยืนยันและส่งคำร้องเข้าระบบ',
      icon: <SendOutlined />,
      content: 'result'
    }
  ];

  // โหลดข้อมูลนักศึกษาเมื่อเริ่มต้น
  useEffect(() => {
    const fetchStudentData = async () => {
      // ถ้าอยู่ใน Demo Mode ให้ข้าม
      if (demoMode) return;
    
      try {
        setLoading(true);
        const response = await internshipService.getStudentProfile();
        
        if (response.success && response.data) {
          const student = response.data;
          
          // ตรวจสอบคุณสมบัติ
          if (student.totalCredits < 81) {
            message.error('หน่วยกิตไม่เพียงพอสำหรับการฝึกงาน (ต้องไม่ต่ำกว่า 81 หน่วยกิต)');
            return;
          }
          
          setStudentData(student);
        }
      } catch (error) {
        console.error('Error fetching student data:', error);
        message.error('ไม่สามารถโหลดข้อมูลนักศึกษาได้');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [demoMode]); // ลบ dispatch ออกจาก dependency

  // ฟังก์ชันสำหรับไปขั้นตอนถัดไป
  const handleNextStep = (data) => {
    console.log('Next step data:', data); // สำหรับ debug
    setFormData({ ...formData, ...data });
    setCurrentStep(currentStep + 1);
  };

  // ฟังก์ชันสำหรับย้อนกลับ
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // ฟังก์ชันส่งข้อมูล
  const handleSubmit = async (finalData) => {
    try {
      setLoading(true);

      // จำลองการส่งข้อมูลใน Demo Mode
      if (demoMode) {
        // จำลองการรอสักครู่
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        message.success('จำลองการส่งคำร้อง คพ.05 เรียบร้อยแล้ว (Demo Mode)');
        
        setCurrentStep(2);
        return;
      }

      // ส่งข้อมูลจริงถ้าไม่ใช่ Demo Mode
      const response = await internshipService.submitCS05WithTranscript(finalData);

      if (response.success) {
        message.success('ส่งคำร้อง คพ.05 เรียบร้อยแล้ว');
        
        setCurrentStep(2);
      } else {
        throw new Error(response.message || 'ไม่สามารถส่งคำร้องได้');
      }
    } catch (error) {
      console.error('Submit error:', error);
      message.error(error.message || 'เกิดข้อผิดพลาดในการส่งคำร้อง');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันจัดการ Demo Mode
  const handleDemoModeChange = (enabled) => {
    setDemoMode(enabled);
    
    if (enabled) {
      // ใส่ข้อมูลจำลองให้ตรงกับตัวอย่าง
      const mockStudentData = {
        fullName: 'นายพิศิษฐ์ บวรเลิศสุข',
        studentId: '65160123',
        year: '4',
        faculty: 'คณะเทคโนโลยีสารสนเทศ',
        major: 'วิทยาการคอมพิวเตอร์',
        totalCredits: 120,
        advisorEmail: 'advisor@university.ac.th',
        advisorPhone: '02-987-6543'
      };
      
      setStudentData(mockStudentData);
      
      // ข้อมูล CS05 จำลองให้ตรงกับตัวอย่าง
      const mockFormData = {
        companyName: 'บริษัท เทคโนโลยีสารสนเทศ จำกัด',
        companyAddress: 'ถนนเทคโนโลยี แขวงนวัตกรรม เขตดิจิทัล กรุงเทพฯ',
        internshipPosition: 'Software Developer, Data Analyst',
        contactEmail: 'hr@techinfo.co.th',
        contactPhone: '0946650259',
        hasTwoStudents: true, // เปลี่ยนเป็น true เพื่อให้แสดง 2 คน
        additionalNotes: 'นักศึกษามีความสนใจในการพัฒนาระบบเว็บแอปพลิเคชัน และการวิเคราะห์ข้อมูล เป็นโครงการพัฒนาระบบ'
      };
      
      setFormData(mockFormData);
      message.info('เปิดโหมดทดสอบ - ใช้ข้อมูลจำลอง');
    } else {
      // รีเซ็ตข้อมูลเมื่อปิด Demo Mode
      setStudentData(null);
      setFormData({});
      setCurrentStep(0);
      message.info('ปิดโหมดทดสอบ - กลับสู่ข้อมูลจริง');
    }
  };

  // เนื้อหาตามขั้นตอน
  const getStepContent = () => {
    const stepProps = {
      studentData,
      formData,
      loading,
      demoMode, // เพิ่มบรรทัดนี้
      onNext: handleNextStep,
      onPrev: handlePrevStep,
      onSubmit: handleSubmit
    };

    switch (currentStep) {
      case 0:
        return (
          <CS05FormStep 
            {...stepProps}
          />
        );
      case 1:
        return (
          <ReviewDataStep 
            {...stepProps}
          />
        );
      case 2:
        return (
          <SubmissionResultStep 
            {...stepProps}
            navigate={navigate}
          />
        );
      default:
        return <CS05FormStep {...stepProps} />;
    }
  };

  return (
    <div style={{ 
      padding: '24px', 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5' 
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* หัวข้อหลัก */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={1}>🎓 ระบบฝึกงานนักศึกษา</Title>
          <Title level={4} type="secondary">
            {studentData?.fullName || 'นายพิศิษฐ์ บวรเลิศสุข'} - รหัส: {studentData?.studentId || '65160123'}
          </Title>
        </div>

        {/* เพิ่มสวิตช์ Demo Mode */}
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <Space>
            <BugOutlined style={{ color: demoMode ? '#ff7a00' : '#d9d9d9' }} />
            <Typography.Text>โหมดทดสอบ:</Typography.Text>
            <Switch
              checked={demoMode}
              onChange={handleDemoModeChange}
              checkedChildren="เปิด"
              unCheckedChildren="ปิด"
            />
          </Space>
        </div>

        {/* Demo Controls */}
        {demoMode && (
          <DemoControls
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            formData={formData}
            onFormDataChange={setFormData}
            studentData={studentData}
            onStudentDataChange={setStudentData}
          />
        )}

        {/* Progress Steps */}
        <Card style={{ marginBottom: 24 }}>
          <Steps 
            current={currentStep} 
            size="small"
            responsive={false}
            items={registrationSteps.map((step, index) => ({
              title: step.title,
              description: step.description,
              icon: step.icon,
              status: index === currentStep ? 'process' : 
                      index < currentStep ? 'finish' : 'wait'
            }))}
          />
          
          {/* Progress Bar */}
          <div style={{ marginTop: 16 }}>
            <Progress
              percent={Math.round((currentStep / (registrationSteps.length - 1)) * 100)}
              status={currentStep === registrationSteps.length - 1 ? "success" : "active"}
              strokeColor={{
                "0%": "#108ee9",
                "100%": "#87d068",
              }}
            />
          </div>

          {demoMode && (
            <Alert
              message="โหมดทดสอบ"
              description="กำลังใช้ข้อมูลจำลองสำหรับการทดสอบ ข้อมูลจะไม่ถูกบันทึกจริง"
              type="info"
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </Card>

        {/* เนื้อหาหลักกับ Sidebar */}
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            {/* เนื้อหาหลัก */}
            <Card className="internship-form">
              {getStepContent()}
            </Card>
          </Col>

          {/* Sidebar ข้อมูลเพิ่มเติม */}
          <Col xs={24} lg={8}>
            <Card title="ข้อมูลการฝึกงาน" size="small">
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Typography.Text strong>สาขา:</Typography.Text>
                  <div>วิทยาการคอมพิวเตอร์</div>
                </div>
                <div>
                  <Typography.Text strong>ภาคการศึกษา:</Typography.Text>
                  <div>1 พฤศจิกายน 2560 ถึง 31 มกราคม 2561</div>
                </div>
                <div>
                  <Typography.Text strong>อาจารย์ที่ปรึกษา:</Typography.Text>
                  <div>อาจารย์ ดร.สมชาย ใจดี</div>
                </div>

                <Divider style={{ margin: "12px 0" }} />

                <div>
                  <Typography.Text strong>สถานะ:</Typography.Text>
                  <div>
                    <Tag color="blue">
                      {currentStep === 0 ? 'กำลังดำเนินการ' :
                       currentStep === 1 ? 'ตรวจสอบข้อมูล' : 
                       'ส่งคำร้องแล้ว'}
                    </Tag>
                  </div>
                </div>

                <div>
                  <Typography.Text strong>หน่วยกิตที่ได้รับ:</Typography.Text>
                  <div>3 หน่วยกิต</div>
                </div>

                <div>
                  <Typography.Text strong>จำนวนนักศึกษา:</Typography.Text>
                  <div>
                    <Tag color={formData?.hasTwoStudents ? "purple" : "default"}>
                      {formData?.hasTwoStudents ? '2 คน' : '1 คน'}
                    </Tag>
                  </div>
                </div>
              </Space>
            </Card>

            <Card title="ติดต่อเจ้าหน้าที่" size="small" style={{ marginTop: 16 }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <div>
                  <Typography.Text strong>เจ้าหน้าที่ภาควิชา:</Typography.Text>
                  <div>คุณสมชาย ใจดี</div>
                  <div>
                    <PhoneOutlined /> 02-555-0000 ต่อ 1234
                  </div>
                </div>
                <div>
                  <Typography.Text strong>อีเมล:</Typography.Text>
                  <div>internship@university.ac.th</div>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* คำเตือนและข้อมูลสำคัญ */}
        {currentStep === 0 && (
          <Alert
            message={demoMode ? "ข้อมูลสำคัญ (โหมดทดสอบ)" : "ข้อมูลสำคัญ"}
            description={
              <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                {!demoMode && (
                  <>
                    <li>กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนส่ง เนื่องจากจะไม่สามารถแก้ไขได้หลังจากส่งแล้ว</li>
                    <li>การฝึกงานต้องมีระยะเวลาอย่างน้อย 60 วัน</li>
                    <li>หากฝึกงาน 2 คน นักศึกษาทั้งคู่ต้องอยู่ในสาขาเดียวกัน</li>
                    <li>ระบบจะส่งอีเมลแจ้งเตือนไปยังอาจารย์ที่ปรึกษาหลังจากส่งคำร้อง</li>
                  </>
                )}
                {demoMode && (
                  <>
                    <li>นี่คือโหมดทดสอบ - ข้อมูลจะไม่ถูกบันทึกจริง</li>
                    <li>สามารถทดสอบฟังก์ชันต่างๆ ได้โดยไม่ต้องกังวลเรื่องข้อมูล</li>
                    <li>ใช้สำหรับตรวจสอบการทำงานของหน้าเว็บและ UI</li>
                    <li>สามารถเปลี่ยนขั้นตอนได้ผ่าน Demo Controls</li>
                  </>
                )}
              </ul>
            }
            type={demoMode ? "info" : "warning"}
            showIcon
            style={{ marginTop: 24 }}
          />
        )}
      </div>
    </div>
  );
};

export default InternshipRegistrationFlow;