import React, { useState, useEffect } from 'react';
import { 
  Steps, Card, Typography, Alert, Space, message,
  Row, Col, Progress, Divider, Tag // ลบ Switch
} from 'antd';
import { 
  FormOutlined, CheckCircleOutlined, SendOutlined, // ลบ BugOutlined
  PhoneOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import internshipService from '../../../services/internshipService';

// นำเข้า Components ย่อยที่สร้างไว้แล้ว
import CS05FormStep from './CS05FormStep';
import ReviewDataStep from './ReviewDataStep';
import SubmissionResultStep from './SubmissionResultStep';
// ลบการ import DemoControls

// นำเข้า CSS ที่มีอยู่แล้ว
import '../shared/InternshipStyles.css';

const { Title } = Typography;

const InternshipRegistrationFlow = () => {
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [formData, setFormData] = useState({});


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
  }, []); 

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

      // ส่งข้อมูลจริง
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

  // เนื้อหาตามขั้นตอน
  const getStepContent = () => {
    const stepProps = {
      studentData,
      formData,
      loading,
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

  // Sidebar ข้อมูลเพิ่มเติม
  const renderSidebarInfo = () => {
    return (
      <div>
        <Space direction="vertical" style={{ width: "100%" }} size="large">
          <Card title="ข้อมูลนักศึกษา" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Typography.Text strong>ชื่อ-นามสกุล:</Typography.Text>
                <div>{studentData?.fullName || 'กำลังโหลดข้อมูล...'}</div>
              </div>
              <div>
                <Typography.Text strong>รหัสนักศึกษา:</Typography.Text>
                <div>{studentData?.studentId || 'กำลังโหลดข้อมูล...'}</div>
              </div>
              <div>
                <Typography.Text strong>คณะ/สาขา:</Typography.Text>
                <div>
                  {studentData ? `${studentData.faculty} / ${studentData.major}` : 'กำลังโหลดข้อมูล...'}
                </div>
              </div>

              <Divider style={{ margin: "12px 0" }} />

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
        </Space>
      </div>
    );
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
            {studentData?.fullName || 'กำลังโหลดข้อมูล...'} - รหัส: {studentData?.studentId || 'กำลังโหลด...'}
          </Title>
        </div>

        {/* ลบส่วนสวิตช์ Demo Mode */}

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
        </Card>

        {/* Layout หลัก */}
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card className="internship-form">
              {getStepContent()}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            {renderSidebarInfo()}

            {/* คำเตือนและข้อมูลสำคัญ */}
            {currentStep === 0 && (
              <Alert
                message="ข้อมูลสำคัญ"
                description={
                  <ul style={{ marginBottom: 0, paddingLeft: 20 }}>
                    <li>กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนส่ง เนื่องจากจะไม่สามารถแก้ไขได้หลังจากส่งแล้ว</li>
                    <li>การฝึกงานต้องมีระยะเวลาอย่างน้อย 60 วัน</li>
                    <li>หากฝึกงาน 2 คน นักศึกษาทั้งคู่ต้องอยู่ในสาขาเดียวกัน</li>
                    <li>ระบบจะส่งอีเมลแจ้งเตือนไปยังอาจารย์ที่ปรึกษาหลังจากส่งคำร้อง</li>
                  </ul>
                }
                type="warning"
                showIcon
                style={{ marginTop: 24 }}
              />
            )}
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default InternshipRegistrationFlow;