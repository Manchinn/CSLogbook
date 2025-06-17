import React, { useState, useEffect } from 'react';
import { 
  Steps, Card, Typography, Alert, Space, message,
  Row, Col, Progress, Divider, Tag, Spin, Button
} from 'antd';
import { 
  FormOutlined, CheckCircleOutlined, SendOutlined,
  PhoneOutlined 
} from '@ant-design/icons';
// เพิ่ม import สำหรับ TranscriptUpload component
import { useNavigate } from 'react-router-dom';
import internshipService from '../../../services/internshipService';

// นำเข้า Components ย่อยที่สร้างไว้แล้ว
import CS05FormStep from './CS05FormStep';
import ReviewDataStep from './ReviewDataStep';
import SubmissionResultStep from './SubmissionResultStep';

// นำเข้า CSS ที่มีอยู่แล้ว
import '../shared/InternshipStyles.css';

const { Title, Text } = Typography;

const InternshipRegistrationFlow = () => {
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [formData, setFormData] = useState({});
  const [existingCS05, setExistingCS05] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false); // 1. เพิ่มตัวแปร state เพื่อเก็บสถานะว่าส่งฟอร์มแล้วหรือยัง

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
    const fetchData = async () => {
      try {
        setFetchLoading(true);
        
        // 1. ดึงข้อมูลนักศึกษา
        const studentResponse = await internshipService.getStudentInfo();
        console.log('[DEBUG] ข้อมูลนักศึกษา:', studentResponse);
        
        if (studentResponse.success) {
          const student = studentResponse.student;
          
          // ตรวจสอบคุณสมบัติ
          if (!student.isEligible || student.totalCredits < 81) {
            message.error('หน่วยกิตไม่เพียงพอสำหรับการฝึกงาน (ต้องไม่ต่ำกว่า 81 หน่วยกิต)');
            return;
          }
          
          setStudentData(student);
        } else {
          throw new Error(studentResponse.message || 'ไม่สามารถโหลดข้อมูลนักศึกษาได้');
        }
        
        // 2. ตรวจสอบ CS05 ที่มีอยู่แล้ว
        const cs05Response = await internshipService.getCurrentCS05();
        console.log('[DEBUG] ข้อมูลดิบที่ได้จาก API:', cs05Response);
        
        if (cs05Response.success && cs05Response.data) {
          const cs05Data = cs05Response.data;
          
          // รับค่าฟิลด์ใหม่จาก backend
          const formDataWithNewFields = {
            ...cs05Data,
            // รองรับทั้งชื่อฟิลด์เก่าและใหม่
            contactPersonName: cs05Data.contactPersonName || cs05Data.contactPerson,
            contactPersonPosition: cs05Data.contactPersonPosition || cs05Data.contactPosition,
            // ถ้ามี internshipPosition ก็ใช้ ถ้าไม่มีก็เป็น undefined
            internshipPosition: cs05Data.internshipPosition
          };
          
          
          setFormData(formDataWithNewFields);
          setExistingCS05(formDataWithNewFields);
          
          setIsSubmitted(cs05Data.status !== 'rejected');
          
          // ถ้ามีไฟล์ transcript
          if (cs05Data.transcriptFilename) {
            setTranscriptFile({
              name: cs05Data.transcriptFilename,
              status: 'done',
              uid: '-1'
            });
          }
        } else if (cs05Response.success) {
          message.info(cs05Response.message || 'กรุณากรอกข้อมูลคำร้องขอฝึกงาน (คพ.05)');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        message.error(error.message || 'ไม่สามารถโหลดข้อมูลได้');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchData();
  }, []);

  // ฟังก์ชันสำหรับไปขั้นตอนถัดไป
  const handleNextStep = (data) => {
    
    setFormData({ ...formData, ...data });
    console.log('[DEBUG] formData หลังจาก update:', { ...formData, ...data });
    
    setCurrentStep(currentStep + 1);
    
    // หากมีการอัปเดต transcript file
    if (data.transcriptFile) {
      setTranscriptFile(data.transcriptFile);
    }
  };

  // ฟังก์ชันสำหรับย้อนกลับ
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // ฟังก์ชันส่งข้อมูล
  const handleSubmit = async (finalData) => {
    try {
      setLoading(true);
      
      // เช็คว่า finalData.transcriptFile เป็นไฟล์ PDF จริงๆ หรือไม่
      let pdfFileToUpload = null;
      let isPDF = false;
      
      if (finalData.transcriptFile instanceof File) {
        pdfFileToUpload = finalData.transcriptFile;
        isPDF = pdfFileToUpload.type === 'application/pdf';
      } else if (finalData.transcriptFile?.originFileObj) {
        pdfFileToUpload = finalData.transcriptFile.originFileObj;
        isPDF = pdfFileToUpload.type === 'application/pdf';
      }
      
      if (!pdfFileToUpload || !isPDF) {
        message.error('กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น');
        setLoading(false);
        return;
      }
      
      // สร้าง FormData สำหรับส่งข้อมูลพร้อมไฟล์
      const formData = new FormData();
      
      // สร้างข้อมูล JSON สำหรับส่งไปยัง API
      const submitData = {
        documentType: 'internship',
        documentName: 'CS05',
        category: 'proposal',
        studentId: studentData.studentId,
        fullName: studentData.fullName,
        year: studentData.year,
        totalCredits: studentData.totalCredits,
        companyName: finalData.companyName,
        companyAddress: finalData.companyAddress,
        startDate: finalData.startDate,
        endDate: finalData.endDate,
        
        // เปลี่ยนชื่อฟิลด์ให้ตรงกับ backend
        internshipPosition: finalData.internshipPosition || '',
        contactPersonName: finalData.contactPersonName || finalData.contactPerson || '',
        contactPersonPosition: finalData.contactPersonPosition || finalData.contactPosition || '',
        
        hasTwoStudents: finalData.hasTwoStudents || false,
        studentData: finalData.studentData || [],
        // เพิ่มข้อมูลห้องเรียนและเบอร์โทรศัพท์
        classroom: finalData.classroom || finalData.studentData?.[0]?.classroom || '',
        phoneNumber: finalData.phoneNumber || finalData.studentData?.[0]?.phoneNumber || ''
      };
      
      console.log('ข้อมูลที่จะส่งไป backend:', submitData);
      
      // แนบข้อมูล JSON สำหรับส่งไปยัง API
      formData.append('formData', JSON.stringify(submitData));
      
      // แนบไฟล์ transcript โดยตรวจสอบให้ละเอียดกว่าเดิม
      let transcriptFileToUpload = null;
      
      if (finalData.transcriptFile instanceof File) {
        transcriptFileToUpload = finalData.transcriptFile;
      } else if (finalData.transcriptFile?.originFileObj) {
        transcriptFileToUpload = finalData.transcriptFile.originFileObj;
      } else if (finalData.transcript instanceof File) {
        transcriptFileToUpload = finalData.transcript;
      } else if (finalData.transcript?.originFileObj) {
        transcriptFileToUpload = finalData.transcript.originFileObj;
      }
      
      if (transcriptFileToUpload) {
        formData.append('transcript', transcriptFileToUpload);
      } else {
        message.error('ไม่พบไฟล์ที่อัปโหลด กรุณาอัปโหลดไฟล์ใหม่');
        setLoading(false);
        return;
      }

      // ส่งข้อมูลไปยัง backend
      const response = await internshipService.submitCS05WithTranscript(formData);

      if (response.success) {
        message.success('ส่งคำร้อง คพ.05 เรียบร้อยแล้ว');
        setExistingCS05(response.data);
        setIsSubmitted(true);
        setFormSubmitted(true); // เพิ่มบรรทัดนี้
        setCurrentStep(2); // ไปยังหน้า SubmissionResultStep
        
        // บันทึกข้อมูลลงใน localStorage เพื่อให้กลับมาดูได้ในภายหลัง
        localStorage.setItem('cs05_submitted', 'true');
        localStorage.setItem('cs05_data', JSON.stringify(response.data));
        localStorage.setItem('cs05_submission_date', new Date().toISOString());
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
      existingCS05,
      transcriptFile,
      setTranscriptFile,
      isSubmitted,
      onNext: handleNextStep,
      onPrev: handlePrevStep,
      onSubmit: handleSubmit
    };

    console.log('[DEBUG] stepProps ที่ส่งให้ step ที่', currentStep, ':', {
      existingCS05Fields: stepProps.existingCS05 ? Object.keys(stepProps.existingCS05) : [],
    });

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
                <Text strong>ชื่อ-นามสกุล:</Text>
                <div>{studentData?.fullName || 'กำลังโหลดข้อมูล...'}</div>
              </div>
              <div>
                <Text strong>รหัสนักศึกษา:</Text>
                <div>{studentData?.studentId || 'กำลังโหลดข้อมูล...'}</div>
              </div>
              <div>
                <Text strong>คณะ/สาขา:</Text>
                <div>
                  {studentData ? `${studentData.faculty} / ${studentData.department}` : 'กำลังโหลดข้อมูล...'}
                </div>
              </div>

              <Divider style={{ margin: "12px 0" }} />

              <div>
                <Text strong>หน่วยกิตสะสม:</Text>
                <div>
                  {studentData?.totalCredits || 'กำลังโหลดข้อมูล...'} หน่วยกิต
                  {studentData?.totalCredits >= 81 ? (
                    <Tag color="success" style={{ marginLeft: 8 }}>ผ่านเกณฑ์</Tag>
                  ) : (
                    <Tag color="error" style={{ marginLeft: 8 }}>ไม่ผ่านเกณฑ์</Tag>
                  )}
                </div>
              </div>

              <div>
                <Text strong>สถานะ:</Text>
                <div>
                  <Tag color="blue">
                    {currentStep === 0 ? 'กำลังดำเนินการ' :
                     currentStep === 1 ? 'ตรวจสอบข้อมูล' : 
                     'ส่งคำร้องแล้ว'}
                  </Tag>
                </div>
              </div>

              {existingCS05 && (
                <div>
                  <Text strong>สถานะคำร้อง:</Text>
                  <div>
                    <Tag color={existingCS05.status === 'approved' ? 'success' : 'processing'}>
                      {existingCS05.status === 'rejected' ? 'ไม่อนุมัติ (ต้องแก้ไข)' : 
                       existingCS05.status === 'approved' ? 'อนุมัติแล้ว' :
                       existingCS05.status === 'submitted' ? 'ส่งคำร้องแล้ว' : 
                       'รอการพิจารณา'}
                    </Tag>
                  </div>
                </div>
              )}
            </Space>
          </Card>

          <Card title="ติดต่อเจ้าหน้าที่" size="small" style={{ marginTop: 16 }}>
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <Text strong>เจ้าหน้าที่ภาควิชา:</Text>
                <div>คุณสมชาย ใจดี</div>
                <div>
                  <PhoneOutlined /> 02-555-0000 ต่อ 1234
                </div>
              </div>
              <div>
                <Text strong>อีเมล:</Text>
                <div>internship@university.ac.th</div>
              </div>
            </Space>
          </Card>

          {/* เพิ่มปุ่มสำหรับดูสถานะคำร้อง */}
          {isSubmitted && currentStep !== 2 && (
            <Button 
              type="primary" 
              block 
              onClick={() => setCurrentStep(2)}
              style={{ marginTop: 16 }}
            >
              ดูผลการส่งคำร้องล่าสุด
            </Button>
          )}
        </Space>
      </div>
    );
  };

  useEffect(() => {
    // ตรวจสอบว่าเคยส่งฟอร์มแล้วหรือไม่
    const isSubmitted = localStorage.getItem('cs05_submitted') === 'true';
    const savedCS05Data = localStorage.getItem('cs05_data');
    
    if (isSubmitted && savedCS05Data) {
      try {
        const parsedData = JSON.parse(savedCS05Data);
        setExistingCS05(parsedData);
        setIsSubmitted(true);
        setFormSubmitted(true);
        
        // ถ้ามีการระบุใน URL ว่าต้องการดูผลการส่ง
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('view') === 'result') {
          setCurrentStep(2); // ไปที่หน้า SubmissionResultStep
        }
      } catch (error) {
        console.error('Error parsing saved CS05 data:', error);
      }
    }
  }, []);

  if (fetchLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Space direction="vertical" align="center">
          <Spin size="large" />
          <Text>กำลังโหลดข้อมูล...</Text>
        </Space>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      minHeight: '100vh', 
      backgroundColor: '#f0f2f5' 
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

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
                    <li>นักศึกษาต้องแนบใบแสดงผลการเรียน (Transcript) เพื่อยืนยันจำนวนหน่วยกิต</li>
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