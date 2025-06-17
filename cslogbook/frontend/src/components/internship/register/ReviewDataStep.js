import React from 'react';
import { 
  Card, Row, Col, Typography, Alert, Button, Space, Divider, message
} from 'antd';
import { 
  SendOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ReviewDataStep = ({ 
  studentData, 
  formData, 
  loading, 
  onPrev, 
  onSubmit,
  transcriptFile
}) => {
  // คำนวณระยะเวลาฝึกงาน
  const calculateInternshipDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const diffInDays = end.diff(start, 'day') + 1;
    const diffInMonths = Math.round(diffInDays / 30);
    
    return `${diffInMonths} เดือน (${diffInDays} วัน)`;
  };

  // ฟังก์ชันส่งข้อมูล
  const handleSubmit = () => {
    // ตรวจสอบว่ามีไฟล์ transcript และเป็น PDF หรือไม่
    if (!transcriptFile) {
      message.error('กรุณาอัปโหลดใบแสดงผลการเรียน (Transcript)');
      return;
    }
    
    // ตรวจสอบว่าเป็นไฟล์ PDF หรือไม่ (ถ้าเข้าถึง type ได้)
    if (transcriptFile instanceof File && transcriptFile.type !== 'application/pdf') {
      message.error('กรุณาอัปโหลดเฉพาะไฟล์ PDF เท่านั้น');
      return;
    }
    
    // สร้างข้อมูลสำหรับส่ง
    const submitData = {
      documentType: 'internship',
      documentName: 'CS05',
      category: 'proposal',
      studentId: studentData.studentId,
      fullName: studentData.fullName,
      year: studentData.year,
      totalCredits: studentData.totalCredits,
      companyName: formData.companyName,
      companyAddress: formData.companyAddress,
      startDate: formData.startDate,
      endDate: formData.endDate,
      contactPersonName: formData.contactPersonName,
      contactPersonPosition: formData.contactPersonPosition,
      internshipPosition: formData.internshipPosition,
      jobDescription: formData.jobDescription,
      additionalRequirements: formData.additionalRequirements,
      hasTwoStudents: formData.hasTwoStudents || false,
      studentData: formData.studentData || [],
      classroom: formData.studentData?.[0]?.classroom || '',
      phoneNumber: formData.studentData?.[0]?.phoneNumber || '',
      // ส่งข้อมูล transcript ที่มาจาก props โดยตรง
      transcriptFile: transcriptFile,
    };

    // ส่งข้อมูลไปให้ InternshipRegistrationFlow
    onSubmit(submitData);
  };

  return (
    <div>
      <Alert
        message="ตรวจสอบข้อมูลให้ถูกต้อง"
        description="กรุณาตรวจสอบข้อมูลทั้งหมดให้ถูกต้องก่อนส่งคำร้อง เนื่องจากจะไม่สามารถแก้ไขได้หลังจากส่งแล้ว"
        type="warning"
        showIcon
        style={{ marginBottom: 24 }}
      />

      {/* ข้อมูลบริษัท */}
      <Card title="ข้อมูลบริษัท / หน่วยงาน" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>ชื่อบริษัท:</Text>
            <div>{formData.companyName}</div>
          </Col>
          {formData.internshipPosition && (
            <Col span={12}>
              <Text strong>ตำแหน่งที่ขอฝึกงาน:</Text>
              <div>{formData.internshipPosition}</div>
            </Col>
          )}          
        </Row>
        <Divider />
        <Text strong>ที่อยู่บริษัท:</Text>
        <div>{formData.companyAddress}</div>
        
        <Divider />
        <Row gutter={16}>
          <Col span={12}>
            <Text strong>เรียนถึง (ผู้ติดต่อ):</Text>
            <div>{formData.contactPersonName || 'ไม่ระบุ'}</div>
          </Col>
          <Col span={12}>
            <Text strong>ตำแหน่ง:</Text>
            <div>{formData.contactPersonPosition || 'ไม่ระบุ'}</div>
          </Col>
        </Row>
      </Card>

      {/* ข้อมูลนักศึกษา */}
      <Card title="ข้อมูลนักศึกษา" style={{ marginBottom: 16 }}>
        <Text strong>นักศึกษาคนที่ 1 (ผู้ยื่นคำขอ):</Text>
        <Row gutter={16}>
          <Col span={12}>
            <div><Text>ชื่อ-นามสกุล:</Text> {formData.studentData?.[0]?.fullName || studentData?.fullName}</div>
            <div><Text>รหัสนักศึกษา:</Text> {formData.studentData?.[0]?.studentId || studentData?.studentId}</div>
            <div><Text>ชั้นปี:</Text> {formData.studentData?.[0]?.yearLevel || studentData?.year}</div>
          </Col>
          <Col span={12}>
            <div><Text>ห้อง:</Text> {formData.studentData?.[0]?.classroom || '-'}</div>
            <div><Text>เบอร์โทรศัพท์:</Text> {formData.studentData?.[0]?.phoneNumber || '-'}</div>
            <div><Text>หน่วยกิตสะสม:</Text> {formData.studentData?.[0]?.totalCredits || studentData?.totalCredits} หน่วยกิต</div>
          </Col>
        </Row>
        
        {formData.hasTwoStudents && formData.studentData && formData.studentData.length > 1 && (
          <>
            <Divider />
            <Text strong>นักศึกษาคนที่ 2:</Text>
            <Row gutter={16}>
              <Col span={12}>
                <div><Text>ชื่อ-นามสกุล:</Text> {formData.studentData[1].fullName}</div>
                <div><Text>รหัสนักศึกษา:</Text> {formData.studentData[1].studentId}</div>
                <div><Text>ชั้นปี:</Text> {formData.studentData[1].yearLevel}</div>
              </Col>
              <Col span={12}>
                <div><Text>ห้อง:</Text> {formData.studentData[1].classroom || '-'}</div>
                <div><Text>เบอร์โทรศัพท์:</Text> {formData.studentData[1].phoneNumber || '-'}</div>
                <div><Text>หน่วยกิตสะสม:</Text> {formData.studentData[1].totalCredits || 0} หน่วยกิต</div>
              </Col>
            </Row>
          </>
        )}
      </Card>

      {/* ระยะเวลาฝึกงาน */}
      <Card title="ระยะเวลาการฝึกงาน" style={{ marginBottom: 16 }}>
        {formData.startDate && formData.endDate ? (
          <div>
            <Text strong>วันที่:</Text>
            <div>
              {dayjs(formData.startDate).format('DD/MM/YYYY')} ถึง {dayjs(formData.endDate).format('DD/MM/YYYY')}
            </div>
            <Text strong>ระยะเวลา:</Text>
            <div>{calculateInternshipDuration(formData.startDate, formData.endDate)}</div>
          </div>
        ) : formData.internshipDateRange && formData.internshipDateRange.length === 2 ? (
          <div>
            <Text strong>วันที่:</Text>
            <div>
              {formData.internshipDateRange[0]?.format('DD/MM/YYYY')} ถึง {formData.internshipDateRange[1]?.format('DD/MM/YYYY')}
            </div>
            <Text strong>ระยะเวลา:</Text>
            <div>{calculateInternshipDuration(formData.internshipDateRange[0], formData.internshipDateRange[1])}</div>
          </div>
        ) : (
          <div>ไม่พบข้อมูลช่วงเวลาฝึกงาน</div>
        )}
      </Card>

      {/* เอกสารประกอบ */}
      <Card title="เอกสารประกอบ" style={{ marginBottom: 16 }}>
        <Text strong>ใบแสดงผลการเรียน:</Text>
        <div>
          {transcriptFile ? (
            <span style={{ color: '#52c41a' }}>
              ✓ อัปโหลดแล้ว ({transcriptFile.name || 'ไฟล์ใบแสดงผลการเรียน'})
            </span>
          ) : (
            <span style={{ color: '#ff4d4f' }}>
              ✗ ยังไม่ได้อัปโหลด
            </span>
          )}
        </div>
      </Card>

      {/* ปุ่มควบคุม */}
      <div style={{ 
        marginTop: 32, 
        textAlign: 'center',
        borderTop: '1px solid #f0f0f0',
        paddingTop: 24 
      }}>
        <Space>
          <Button 
            size="large"
            onClick={onPrev}
            icon={<ArrowLeftOutlined />}
          >
            ย้อนกลับ
          </Button>
          
          <Button 
            type="primary" 
            size="large"
            loading={loading}
            onClick={handleSubmit}
            icon={<SendOutlined />}
          >
            ยืนยันส่งคำร้อง
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default ReviewDataStep;