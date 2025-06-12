import React from 'react';
import { 
  Card, Row, Col, Typography, Alert, Button, Space, Divider
} from 'antd';
import { 
  SendOutlined, ArrowLeftOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

const ReviewDataStep = ({ 
  studentData, 
  formData, 
  loading, 
  onPrev, 
  onSubmit 
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
    // เตรียมข้อมูลสำหรับส่ง
    const formDataToSubmit = new FormData();

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
      internshipPosition: formData.internshipPosition,
      contactEmail: formData.contactEmail,
      contactPhone: formData.contactPhone,
      startDate: formData.internshipPeriod[0].format('YYYY-MM-DD'),
      endDate: formData.internshipPeriod[1].format('YYYY-MM-DD'),
      hasTwoStudents: formData.hasTwoStudents,
      additionalNotes: formData.additionalNotes
    };

    // เพิ่มข้อมูลนักศึกษาคนที่ 2 ถ้ามี
    if (formData.hasTwoStudents) {
      submitData.student2 = {
        name: formData.student2Name,
        id: formData.student2Id,
        year: formData.student2Year,
        room: formData.student2Room,
        phone: formData.student2Phone,
        credits: formData.student2Credits
      };
    }

    formDataToSubmit.append('formData', JSON.stringify(submitData));

    // เพิ่มไฟล์ transcript
    if (formData.transcriptFile instanceof File) {
      formDataToSubmit.append('transcript', formData.transcriptFile);
    } else if (formData.transcriptFile?.originFileObj) {
      formDataToSubmit.append('transcript', formData.transcriptFile.originFileObj);
    }

    onSubmit(formDataToSubmit);
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
          <Col span={12}>
            <Text strong>ตำแหน่งที่ขอฝึกงาน:</Text>
            <div>{formData.internshipPosition}</div>
          </Col>
        </Row>
        <Divider />
        <Text strong>ที่อยู่บริษัท:</Text>
        <div>{formData.companyAddress}</div>
        
        {(formData.contactEmail || formData.contactPhone) && (
          <>
            <Divider />
            <Row gutter={16}>
              {formData.contactEmail && (
                <Col span={12}>
                  <Text strong>อีเมลผู้ติดต่อ:</Text>
                  <div>{formData.contactEmail}</div>
                </Col>
              )}
              {formData.contactPhone && (
                <Col span={12}>
                  <Text strong>โทรศัพท์ผู้ติดต่อ:</Text>
                  <div>{formData.contactPhone}</div>
                </Col>
              )}
            </Row>
          </>
        )}
      </Card>

      {/* ข้อมูลนักศึกษา */}
      <Card title="ข้อมูลนักศึกษา" style={{ marginBottom: 16 }}>
        <Text strong>นักศึกษาคนที่ 1 (ผู้ยื่นคำขอ):</Text>
        <Row gutter={16}>
          <Col span={12}>
            <div><Text>ชื่อ-นามสกุล:</Text> {studentData?.fullName}</div>
            <div><Text>รหัสนักศึกษา:</Text> {studentData?.studentId}</div>
            <div><Text>ชั้นปี:</Text> {studentData?.year}</div>
          </Col>
          <Col span={12}>
            <div><Text>คณะ:</Text> {studentData?.faculty}</div>
            <div><Text>สาขา:</Text> {studentData?.major}</div>
            <div><Text>หน่วยกิตสะสม:</Text> {studentData?.totalCredits} หน่วยกิต</div>
          </Col>
        </Row>
        
        {formData.hasTwoStudents && (
          <>
            <Divider />
            <Text strong>นักศึกษาคนที่ 2:</Text>
            <Row gutter={16}>
              <Col span={12}>
                <div><Text>ชื่อ-นามสกุล:</Text> {formData.student2Name}</div>
                <div><Text>รหัสนักศึกษา:</Text> {formData.student2Id}</div>
                <div><Text>ชั้นปี:</Text> {formData.student2Year}</div>
              </Col>
              <Col span={12}>
                <div><Text>ห้อง:</Text> {formData.student2Room}</div>
                <div><Text>เบอร์โทรศัพท์:</Text> {formData.student2Phone}</div>
                <div><Text>หน่วยกิตสะสม:</Text> {formData.student2Credits} หน่วยกิต</div>
              </Col>
            </Row>
          </>
        )}
      </Card>

      {/* ระยะเวลาฝึกงาน */}
      <Card title="ระยะเวลาการฝึกงาน" style={{ marginBottom: 16 }}>
        {formData.internshipPeriod && (
          <div>
            <Text strong>วันที่:</Text>
            <div>
              {formData.internshipPeriod[0]?.format('DD/MM/YYYY')} ถึง {formData.internshipPeriod[1]?.format('DD/MM/YYYY')}
            </div>
            <Text strong>ระยะเวลา:</Text>
            <div>{calculateInternshipDuration(formData.internshipPeriod[0], formData.internshipPeriod[1])}</div>
          </div>
        )}
      </Card>

      {/* เอกสารประกอบ */}
      <Card title="เอกสารประกอบ" style={{ marginBottom: 16 }}>
        <Text strong>ใบแสดงผลการเรียน:</Text>
        <div>
          {formData.transcriptFile ? (
            <span style={{ color: '#52c41a' }}>
              ✓ อัปโหลดแล้ว ({formData.transcriptFile.name || 'ไฟล์ใบแสดงผลการเรียน'})
            </span>
          ) : (
            <span style={{ color: '#ff4d4f' }}>
              ✗ ยังไม่ได้อัปโหลด
            </span>
          )}
        </div>
      </Card>

      {/* หมายเหตุเพิ่มเติม */}
      {formData.additionalNotes && (
        <Card title="หมายเหตุเพิ่มเติม" style={{ marginBottom: 16 }}>
          <div>{formData.additionalNotes}</div>
        </Card>
      )}

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