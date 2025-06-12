import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Select, DatePicker, Row, Col, 
  Alert, Space, Radio, Divider, message
} from 'antd';
import { 
  BankOutlined, UserOutlined, PhoneOutlined, 
  CalendarOutlined, UploadOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';

// นำเข้า Component ที่มีอยู่แล้ว
import TranscriptUpload from '../common/TranscriptUpload';
import StudentInfoSection from './StudentInfoSection';

const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

dayjs.locale('th');

const CS05FormStep = ({ 
  studentData, 
  formData, 
  loading, 
  onNext 
}) => {
  const [form] = Form.useForm();
  const [hasTwoStudents, setHasTwoStudents] = useState(false);
  const [transcriptFile, setTranscriptFile] = useState(null);

  // โหลดข้อมูลเดิมเมื่อมี
  useEffect(() => {
    if (formData) {
      form.setFieldsValue(formData);
      setHasTwoStudents(formData.hasTwoStudents || false);
      setTranscriptFile(formData.transcriptFile || null);
    }
  }, [formData, form]);

  // ตั้งค่าข้อมูลนักศึกษาเริ่มต้น
  useEffect(() => {
    if (studentData) {
      form.setFieldsValue({
        fullName: studentData.fullName,
        studentId: studentData.studentId,
        totalCredits: studentData.totalCredits,
        year: studentData.year,
        faculty: studentData.faculty,
        major: studentData.major,
      });
    }
  }, [studentData, form]);

  // คำนวณระยะเวลาฝึกงาน
  const calculateInternshipDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return '';
    
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const diffInDays = end.diff(start, 'day') + 1;
    const diffInMonths = Math.round(diffInDays / 30);
    
    return `${diffInMonths} เดือน (${diffInDays} วัน)`;
  };

  // ตรวจสอบระยะเวลาฝึกงาน
  const validateInternshipPeriod = (startDate, endDate) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const workingDays = end.diff(start, 'days') + 1;

    if (workingDays < 60) {
      message.error('ระยะเวลาฝึกงานต้องไม่ต่ำกว่า 60 วัน');
      return false;
    }
    return true;
  };

  // ฟังก์ชันส่งข้อมูลไปขั้นตอนถัดไป
  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      
      // ตรวจสอบระยะเวลาฝึกงาน
      if (values.internshipPeriod) {
        if (!validateInternshipPeriod(values.internshipPeriod[0], values.internshipPeriod[1])) {
          return;
        }
      }

      // ตรวจสอบไฟล์ transcript
      if (!transcriptFile) {
        message.error('กรุณาอัปโหลดใบแสดงผลการเรียน');
        return;
      }

      // เตรียมข้อมูลส่งไปขั้นตอนถัดไป
      const formDataToSend = {
        ...values,
        hasTwoStudents,
        transcriptFile,
        studentData
      };

      onNext(formDataToSend);
    } catch (error) {
      console.error('Validation failed:', error);
      message.error('กรุณากรอกข้อมูลให้ครบถ้วน');
    }
  };

  return (
    <div>
      <Form
        form={form}
        layout="vertical"
        onValuesChange={(changedValues) => {
          // ตรวจสอบการเปลี่ยนแปลงของ internshipPeriod
          if (changedValues.internshipPeriod) {
            const [startDate, endDate] = changedValues.internshipPeriod || [];
            if (startDate && endDate) {
              const duration = calculateInternshipDuration(startDate, endDate);
              console.log('ระยะเวลาฝึกงาน:', duration);
            }
          }
        }}
      >
        {/* ข้อมูลบริษัท */}
        <Divider orientation="left">
          <Space>
            <BankOutlined />
            ข้อมูลบริษัท / หน่วยงาน
          </Space>
        </Divider>
        
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="companyName"
              label="ชื่อบริษัท / หน่วยงาน"
              rules={[{ required: true, message: 'กรุณากรอกชื่อบริษัท' }]}
            >
              <Input 
                placeholder="ชื่อบริษัทหรือหน่วยงานที่ต้องการฝึกงาน"
                prefix={<BankOutlined />}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="internshipPosition"
              label="ตำแหน่งที่ขอฝึกงาน"
              rules={[{ required: true, message: 'กรุณากรอกตำแหน่ง' }]}
            >
              <Input placeholder="เช่น Software Developer, Data Analyst" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="companyAddress"
          label="สถานที่ตั้งบริษัท"
          rules={[{ required: true, message: 'กรุณากรอกที่อยู่บริษัท' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="ที่อยู่สำนักงานบริษัท / หน่วยงาน"
          />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="contactEmail"
              label="อีเมลผู้ติดต่อ"
              rules={[
                { type: 'email', message: 'รูปแบบอีเมลไม่ถูกต้อง' }
              ]}
            >
              <Input placeholder="email@company.com" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              name="contactPhone"
              label="โทรศัพท์ผู้ติดต่อ"
            >
              <Input 
                placeholder="เบอร์โทรศัพท์ผู้ติดต่อ"
                prefix={<PhoneOutlined />}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* ข้อมูลนักศึกษา */}
        <Divider orientation="left">
          <Space>
            <UserOutlined />
            ข้อมูลนักศึกษา
          </Space>
        </Divider>

        <StudentInfoSection 
          studentNumber={1}
          isMainStudent={true}
          title="นักศึกษาคนที่ 1 (ผู้ยื่นคำขอ)"
          studentData={studentData}
        />

        <Form.Item
          name="hasTwoStudents"
          label="จำนวนนักศึกษาที่ขอฝึกงาน"
          style={{ marginBottom: 16 }}
        >
          <Radio.Group 
            value={hasTwoStudents}
            onChange={(e) => {
              setHasTwoStudents(e.target.value);
              if (!e.target.value) {
                // ลบข้อมูลนักศึกษาคนที่ 2 ออกจากฟอร์ม
                const currentValues = form.getFieldsValue();
                const fieldsToReset = [
                  'student2Name', 'student2Id', 'student2Year', 
                  'student2Room', 'student2Phone', 'student2Credits'
                ];
                
                fieldsToReset.forEach(field => {
                  delete currentValues[field];
                });
                
                form.setFieldsValue(currentValues);
              }
            }}
          >
            <Radio value={false}>
              <Space>
                <UserOutlined />
                ฝึกงานคนเดียว (1 คน)
              </Space>
            </Radio>
            <Radio value={true}>
              <Space>
                <UserOutlined />
                <UserOutlined />
                ฝึกงานร่วมกัน (2 คน)
              </Space>
            </Radio>
          </Radio.Group>
        </Form.Item>

        {hasTwoStudents && (
          <>
            <Alert
              message="การฝึกงาน 2 คน"
              description="กรุณากรอกข้อมูลนักศึกษาคนที่ 2 ที่จะร่วมฝึกงานด้วยกัน"
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            <StudentInfoSection 
              studentNumber={2}
              isMainStudent={false}
              title="นักศึกษาคนที่ 2"
              form={form}
            />
          </>
        )}

        {/* ระยะเวลาการฝึกงาน */}
        <Divider orientation="left">
          <Space>
            <CalendarOutlined />
            ระยะเวลาการฝึกงาน
          </Space>
        </Divider>

        <Form.Item
          name="internshipPeriod"
          label="วันที่เริ่มต้นและสิ้นสุดการฝึกงาน"
          rules={[{ required: true, message: 'กรุณาเลือกวันที่เริ่มต้นและสิ้นสุด' }]}
        >
          <RangePicker
            style={{ width: '100%' }}
            placeholder={['วันที่เริ่มฝึกงาน', 'วันที่สิ้นสุดฝึกงาน']}
            format="DD/MM/YYYY"
            disabledDate={(current) => {
              return current && current < dayjs().startOf('day');
            }}
            onChange={(dates) => {
              if (dates && dates.length === 2) {
                const duration = calculateInternshipDuration(dates[0], dates[1]);
                message.info(`ระยะเวลาฝึกงาน: ${duration}`);
              }
            }}
          />
        </Form.Item>

        <Form.Item dependencies={['internshipPeriod']}>
          {({ getFieldValue }) => {
            const dates = getFieldValue('internshipPeriod');
            if (dates && dates.length === 2) {
              const duration = calculateInternshipDuration(dates[0], dates[1]);
              return (
                <Alert
                  message={`ระยะเวลาฝึกงาน: ${duration}`}
                  description={`เริ่ม: ${dates[0].format('DD/MM/YYYY')} ถึง ${dates[1].format('DD/MM/YYYY')}`}
                  type="success"
                  showIcon
                />
              );
            }
            return null;
          }}
        </Form.Item>

        {/* อัปโหลดใบแสดงผลการเรียน */}
        <Divider orientation="left">
          <Space>
            <UploadOutlined />
            เอกสารประกอบ
          </Space>
        </Divider>

        <Form.Item
          name="transcript"
          label="ใบแสดงผลการเรียน"
          rules={[{ required: true, message: 'กรุณาอัปโหลดใบแสดงผลการเรียน' }]}
          tooltip="กรุณาอัปโหลดใบแสดงผลการเรียนจากระบบ REG เพื่อยืนยันว่ามีหน่วยกิตเพียงพอ"
        >
          <TranscriptUpload
            value={transcriptFile}
            onChange={setTranscriptFile}
          />
        </Form.Item>

        <Form.Item
          name="additionalNotes"
          label="หมายเหตุเพิ่มเติม (ถ้ามี)"
        >
          <TextArea 
            rows={3}
            placeholder="ข้อมูลเพิ่มเติมเกี่ยวกับการฝึกงาน เช่น ความต้องการพิเศษ, เงื่อนไข หรือข้อกำหนดอื่นๆ"
          />
        </Form.Item>

        {/* ปุ่มไปขั้นตอนถัดไป */}
        <div style={{ 
          marginTop: 32, 
          textAlign: 'center',
          borderTop: '1px solid #f0f0f0',
          paddingTop: 24 
        }}>
          <Button 
            type="primary" 
            size="large"
            loading={loading}
            onClick={handleNext}
            icon={<CheckCircleOutlined />}
          >
            ตรวจสอบข้อมูล
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CS05FormStep;