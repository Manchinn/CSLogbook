import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, DatePicker, Space, Typography, Divider,
  Row, Col, Radio, InputNumber, Alert, Card, Select, Checkbox,
  Upload, message
} from 'antd';
import { 
  UserOutlined, BankOutlined, PhoneOutlined, HomeOutlined, 
  CalendarOutlined, UploadOutlined, FileTextOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import locale from 'antd/es/date-picker/locale/th_TH';

import TranscriptUpload from '../common/TranscriptUpload'; // นำเข้า component สำหรับอัปโหลด Transcript

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

// ตัวเลือกห้องเรียน
const classroomOptions = [
  { label: 'RA', value: 'RA' },
  { label: 'RB', value: 'RB' },
  { label: 'RC', value: 'RC' },
  { label: 'DA', value: 'DA' },
  { label: 'DB', value: 'DB' },
  { label: 'CSB', value: 'CSB' }
];

const CS05FormStep = ({ 
  studentData, 
  formData, 
  onNext, 
  loading,
  existingCS05,
  transcriptFile,
  setTranscriptFile,
  isSubmitted
}) => {
  const [form] = Form.useForm();
  const [hasTwoStudents, setHasTwoStudents] = useState(formData?.hasTwoStudents || false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // กำหนดค่าเริ่มต้นเมื่อมีข้อมูล
  useEffect(() => {
    if (studentData) {
      // กำหนดค่าข้อมูลนักศึกษา
      form.setFieldsValue({
        studentData: [
          {
            fullName: studentData.fullName,
            studentId: studentData.studentId,
            yearLevel: studentData.year || 3,
            totalCredits: studentData.totalCredits,
            phoneNumber: studentData.phoneNumber || ''
          }
        ]
      });
    }
    
    // กำหนดค่าจากข้อมูล CS05 ที่มีอยู่เดิม (ถ้ามี)
    if (existingCS05) {
      const dateRange = existingCS05.startDate && existingCS05.endDate 
        ? [
            dayjs(existingCS05.startDate),
            dayjs(existingCS05.endDate)
          ] 
        : undefined;
      
      if (dateRange) {
        setStartDate(dateRange[0]);
        setEndDate(dateRange[1]);
      }

      if (existingCS05.transcriptFilename) {
        setTranscriptFile({
          name: existingCS05.transcriptFilename,
          status: 'done',
          uid: '-1'
        });
      }      
      
      form.setFieldsValue({
        companyName: existingCS05.companyName,
        companyAddress: existingCS05.companyAddress,
        contactPerson: existingCS05.contactPerson,
        contactPosition: existingCS05.contactPosition,
        internshipDateRange: dateRange,
        hasTwoStudents: existingCS05.hasTwoStudents || false,
        internshipPosition: existingCS05.internshipPosition,
        jobDescription: existingCS05.jobDescription,
        additionalRequirements: existingCS05.additionalRequirements
      });
      
      setHasTwoStudents(existingCS05.hasTwoStudents || false);
      
      // ถ้ามีข้อมูลนักศึกษาคนที่ 2
      if (existingCS05.hasTwoStudents && existingCS05.studentData?.length > 1) {
        form.setFieldsValue({
          studentData: [
            ...form.getFieldValue('studentData'),
            existingCS05.studentData[1]
          ]
        });
      }
    } else if (formData && Object.keys(formData).length > 0) {
      // กรณีที่มีข้อมูล formData แต่ไม่ใช่จาก existingCS05
      if (formData.internshipDateRange && formData.internshipDateRange.length === 2) {
        const dates = [
          dayjs(formData.internshipDateRange[0]),
          dayjs(formData.internshipDateRange[1])
        ];
        
        setStartDate(dates[0]);
        setEndDate(dates[1]);
        
        form.setFieldsValue({
          internshipDateRange: dates,
          ...formData
        });
      } else {
        form.setFieldsValue(formData);
      }
      
      setHasTwoStudents(formData.hasTwoStudents || false);
    }
  }, [form, studentData, formData, existingCS05]);

  // คำนวณจำนวนวันฝึกงาน
  const calculateInternshipDays = (dates) => {
    if (!dates || dates.length !== 2) return 0;
    
    const start = dates[0];
    const end = dates[1];
    
    if (!start || !end) return 0;
    
    // คำนวณจำนวนวัน (รวมวันเริ่มต้นและวันสิ้นสุด)
    const days = end.diff(start, 'day') + 1;
    return days;
  };

  // อัปเดตจำนวนวันเมื่อเลือกช่วงวันฝึกงาน
  const handleDateRangeChange = (dates) => {
    if (dates && dates.length === 2) {
      setStartDate(dates[0]);
      setEndDate(dates[1]);
    } else {
      setStartDate(null);
      setEndDate(null);
    }
  };

  // ตรวจสอบสถานะการส่งเอกสาร
  const isFieldsDisabled = isSubmitted && existingCS05?.status !== 'rejected';

  // ส่งข้อมูลไปยังขั้นตอนถัดไป
  const handleFormSubmit = (values) => {
    // ตรวจสอบว่ามีไฟล์ transcript หรือไม่
    if (!transcriptFile) {
      message.error('กรุณาอัปโหลดใบแสดงผลการเรียน (Transcript)');
      return;
    }
    
    // แปลง DatePicker values เป็น ISO string
    if (values.internshipDateRange && values.internshipDateRange.length === 2) {
      values.startDate = values.internshipDateRange[0].format('YYYY-MM-DD');
      values.endDate = values.internshipDateRange[1].format('YYYY-MM-DD');
    }

    // เพิ่มจำนวนวันฝึกงาน
    values.internshipDuration = calculateInternshipDays(values.internshipDateRange);
    
    // เพิ่มข้อมูล transcript
    values.transcriptFile = transcriptFile;
    
    onNext(values);
  };

  const internshipDays = calculateInternshipDays([startDate, endDate]);

  return (
    <div className="cs05-form-container">
      <Title level={3} style={{ textAlign: 'center' }}>แบบฟอร์มคำร้องขอฝึกงาน (คพ.05)</Title>
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
        กรุณากรอกข้อมูลให้ครบถ้วนและถูกต้อง เพื่อใช้ในการออกหนังสือขอความอนุเคราะห์ฝึกงาน
      </Text>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleFormSubmit}
        disabled={isFieldsDisabled}
      >
        {/* ส่วนที่ 1: ข้อมูลบริษัท */}
        <Card title="ข้อมูลบริษัท/หน่วยงาน" className="form-card">
          <Row gutter={16}>
            <Col xs={24} md={24}>
              <Form.Item
                name="companyName"
                label="ชื่อบริษัท/หน่วยงาน"
                rules={[
                  { required: true, message: 'กรุณากรอกชื่อบริษัท' },
                  { min: 2, message: 'ชื่อบริษัทต้องมีอย่างน้อย 2 ตัวอักษร' }
                ]}
              >
                <Input prefix={<BankOutlined />} placeholder="ชื่อบริษัทหรือหน่วยงานที่ฝึกงาน" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="companyAddress"
            label="สถานที่ตั้ง"
            rules={[
              { required: true, message: 'กรุณากรอกที่อยู่บริษัท' },
              { min: 10, message: 'ที่อยู่ต้องมีรายละเอียดครบถ้วน' }
            ]}
          >
            <TextArea
              placeholder="ที่อยู่บริษัท เลขที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด รหัสไปรษณีย์"
              autoSize={{ minRows: 2, maxRows: 4 }}
              prefix={<HomeOutlined />}
            />
          </Form.Item>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="contactPerson"
                label="เรียนถึง (ชื่อผู้ติดต่อ/HR)"
                rules={[
                  { required: true, message: 'กรุณากรอกชื่อผู้ติดต่อหรือ HR' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="เช่น คุณสมชาย ใจดี / แผนก HR" 
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="contactPosition"
                label="ตำแหน่ง"
                rules={[
                  { required: true, message: 'กรุณากรอกตำแหน่ง' }
                ]}
              >
                <Input placeholder="เช่น ผู้จัดการฝ่ายบุคคล, HR Manager" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* ส่วนที่ 2: ข้อมูลนักศึกษา */}
        <Card title="ข้อมูลนักศึกษาฝึกงาน" className="form-card" style={{ marginTop: 24 }}>
          <Form.Item name="hasTwoStudents" valuePropName="checked">
            <Checkbox 
              onChange={(e) => setHasTwoStudents(e.target.checked)}
            >
              ฝึกงาน 2 คน (ในบริษัทเดียวกัน)
            </Checkbox>
          </Form.Item>

          <Divider orientation="left">นักศึกษาคนที่ 1</Divider>
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name={['studentData', 0, 'fullName']}
                label="ชื่อ-นามสกุล"
                rules={[
                  { required: true, message: 'กรุณากรอกชื่อ-นามสกุล' }
                ]}
              >
                <Input disabled prefix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name={['studentData', 0, 'yearLevel']}
                label="ชั้นปีที่"
                rules={[
                  { required: true, message: 'กรุณาเลือกชั้นปี' }
                ]}
              >
                <Select placeholder="เลือกชั้นปี" disabled>
                  <Select.Option value={3}>ปี 3</Select.Option>
                  <Select.Option value={4}>ปี 4</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col xs={24} md={6}>
              <Form.Item
                name={['studentData', 0, 'classroom']}
                label="ห้อง"
                rules={[
                  { required: true, message: 'กรุณาเลือกห้อง' }
                ]}
              >
                <Select placeholder="เลือกห้อง">
                  {classroomOptions.map(option => (
                    <Select.Option key={option.value} value={option.value}>
                      {option.label}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={8}>
              <Form.Item
                name={['studentData', 0, 'studentId']}
                label="รหัสประจำตัวนักศึกษา"
                rules={[
                  { required: true, message: 'กรุณากรอกรหัสนักศึกษา' }
                ]}
              >
                <Input disabled />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['studentData', 0, 'phoneNumber']}
                label="เบอร์โทรศัพท์"
                rules={[
                  { required: true, message: 'กรุณากรอกเบอร์โทรศัพท์' },
                  { pattern: /^[0-9-]{9,10}$/, message: 'รูปแบบเบอร์โทรไม่ถูกต้อง' }
                ]}
              >
                <Input prefix={<PhoneOutlined />} placeholder="เช่น 0812345678" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name={['studentData', 0, 'totalCredits']}
                label="หน่วยกิตสะสมทั้งหมด"
                rules={[
                  { required: true, message: 'กรุณากรอกหน่วยกิตสะสม' }
                ]}
              >
                <InputNumber 
                  min={0} 
                  max={200}
                  style={{ width: '100%' }}
                  disabled
                />
              </Form.Item>
            </Col>
          </Row>

          {hasTwoStudents && (
            <>
              <Divider orientation="left">นักศึกษาคนที่ 2</Divider>
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name={['studentData', 1, 'fullName']}
                    label="ชื่อ-นามสกุล"
                    rules={[
                      { required: true, message: 'กรุณากรอกชื่อ-นามสกุล' }
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="ชื่อ-นามสกุลนักศึกษาคนที่ 2" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    name={['studentData', 1, 'yearLevel']}
                    label="ชั้นปีที่"
                    rules={[
                      { required: hasTwoStudents, message: 'กรุณาเลือกชั้นปี' }
                    ]}
                  >
                    <Select placeholder="เลือกชั้นปี">
                      <Select.Option value={2}>ปี 2</Select.Option>
                      <Select.Option value={3}>ปี 3</Select.Option>
                      <Select.Option value={4}>ปี 4</Select.Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col xs={24} md={6}>
                  <Form.Item
                    name={['studentData', 1, 'classroom']}
                    label="ห้อง"
                    rules={[
                      { required: hasTwoStudents, message: 'กรุณาเลือกห้อง' }
                    ]}
                  >
                    <Select placeholder="เลือกห้อง">
                      {classroomOptions.map(option => (
                        <Select.Option key={option.value} value={option.value}>
                          {option.label}
                        </Select.Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['studentData', 1, 'studentId']}
                    label="รหัสประจำตัวนักศึกษา"
                    rules={[
                      { required: hasTwoStudents, message: 'กรุณากรอกรหัสนักศึกษา' }
                    ]}
                  >
                    <Input placeholder="เช่น 6404101000" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['studentData', 1, 'phoneNumber']}
                    label="เบอร์โทรศัพท์"
                    rules={[
                      { required: hasTwoStudents, message: 'กรุณากรอกเบอร์โทรศัพท์' },
                      { pattern: /^[0-9-]{9,10}$/, message: 'รูปแบบเบอร์โทรไม่ถูกต้อง' }
                    ]}
                  >
                    <Input prefix={<PhoneOutlined />} placeholder="เช่น 0812345678" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={8}>
                  <Form.Item
                    name={['studentData', 1, 'totalCredits']}
                    label="หน่วยกิตสะสมทั้งหมด"
                    rules={[
                      { required: hasTwoStudents, message: 'กรุณากรอกหน่วยกิตสะสม' },
                      { 
                        type: 'number', 
                        min: 81, 
                        message: 'ต้องมีหน่วยกิตสะสมไม่น้อยกว่า 81 หน่วยกิต'
                      }
                    ]}
                  >
                    <InputNumber 
                      min={0} 
                      max={200}
                      style={{ width: '100%' }}
                      placeholder="จำนวนหน่วยกิตสะสม (ต้องไม่น้อยกว่า 81)"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </>
          )}
        </Card>

        {/* ส่วนที่ 3: ช่วงเวลาฝึกงาน */}
        <Card title="ช่วงเวลาฝึกงาน" className="form-card" style={{ marginTop: 24 }}>
          <Alert
            message="กำหนดระยะเวลาการฝึกงาน"
            description="ระยะเวลาฝึกงานต้องไม่น้อยกว่า 60 วัน หรือ 240 ชั่วโมง และต้องฝึกงานภายในช่วงปิดภาคเรียนที่ 1 หรือเทียบเท่า"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            name="internshipDateRange"
            label="ช่วงเวลาฝึกงาน"
            rules={[
              { required: true, message: 'กรุณาเลือกช่วงเวลาฝึกงาน' },
              () => ({
                validator(_, value) {
                  if (!value || !value.length) return Promise.resolve();
                  
                  const days = calculateInternshipDays(value);
                  if (days < 60) {
                    return Promise.reject(new Error('ระยะเวลาฝึกงานต้องไม่น้อยกว่า 60 วัน'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <RangePicker 
              style={{ width: '100%' }} 
              format="D MMMM BBBB"
              locale={locale}
              onChange={handleDateRangeChange}
              placeholder={['วันเริ่มต้น', 'วันสิ้นสุด']}
              disabledDate={(current) => {
                // ห้ามเลือกวันที่ในอดีต
                return current && current < dayjs().startOf('day');
              }}
            />
          </Form.Item>
          
          {(startDate && endDate) && (
            <Text type={internshipDays >= 60 ? 'success' : 'danger'}>
              ระยะเวลาการฝึกงาน: {internshipDays} วัน {internshipDays < 60 && '(ไม่ถึง 60 วันตามกำหนด)'}
            </Text>
          )}
        </Card>

        {/* ส่วนที่ 4: ตำแหน่งฝึกงาน */}
        {/* <Card title="รายละเอียดตำแหน่งงาน" className="form-card" style={{ marginTop: 24 }}>
          <Form.Item
            name="internshipPosition"
            label="ตำแหน่งฝึกงาน"
            rules={[
              { required: true, message: 'กรุณากรอกตำแหน่งฝึกงาน' }
            ]}
          >
            <Input placeholder="เช่น ผู้ช่วยโปรแกรมเมอร์, นักพัฒนาเว็บไซต์, ผู้ช่วยนักวิเคราะห์ระบบ" />
          </Form.Item>
          
          <Form.Item
            name="jobDescription"
            label="ลักษณะงานที่จะได้รับมอบหมาย (ถ้ามี)"
          >
            <TextArea
              placeholder="ระบุลักษณะงานที่คาดว่าจะได้รับมอบหมาย"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
          
          <Form.Item
            name="additionalRequirements"
            label="ข้อกำหนดอื่นๆ จากบริษัท (ถ้ามี)"
          >
            <TextArea
              placeholder="เช่น การแต่งกาย, เอกสารที่ต้องเตรียม, ทักษะพิเศษ"
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
        </Card> */}
        
        {/* ส่วนที่ 5: อัปโหลด Transcript */}
        <Card title="ใบแสดงผลการเรียน (Transcript)" className="form-card" style={{ marginTop: 24 }}>
          <Alert
            message="ข้อมูลสำคัญ"
            description="นักศึกษาต้องแนบใบแสดงผลการเรียน (Transcript) เพื่อยืนยันจำนวนหน่วยกิตสะสม โดยต้องมีหน่วยกิตไม่น้อยกว่า 81 หน่วยกิต"
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
          
          <Form.Item
            name="transcript"
            label="ใบแสดงผลการเรียน"
            required
            tooltip="กรุณาอัปโหลดใบแสดงผลการเรียนจากระบบ REG เพื่อยืนยันว่ามีหน่วยกิตเพียงพอ"
            rules={[{ required: true, message: 'กรุณาอัปโหลดใบแสดงผลการเรียนจากระบบ REG' }]}
          >
            <TranscriptUpload
              value={transcriptFile}
              onChange={setTranscriptFile}
              disabled={isFieldsDisabled}
            />
          </Form.Item>
          
          {existingCS05?.transcriptFilename && (
            <Alert
              message="ไฟล์ Transcript ที่อัปโหลดแล้ว"
              description={
                <Button
                  type="link"
                  onClick={() => window.open(`${process.env.REACT_APP_API_URL}/files/${existingCS05.transcriptFilename}`, '_blank')}
                >
                  คลิกที่นี่เพื่อดูไฟล์ ({existingCS05.transcriptFilename})
                </Button>
              }
              type="success"
              showIcon
              icon={<FileTextOutlined />}
            />
          )}
        </Card>

        <div style={{ textAlign: 'right', marginTop: 24 }}>
          <Button type="primary" htmlType="submit" size="large" loading={loading} disabled={isFieldsDisabled}>
            ถัดไป: ตรวจสอบข้อมูล
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default CS05FormStep;