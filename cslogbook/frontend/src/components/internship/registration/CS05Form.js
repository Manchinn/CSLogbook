import React, { useState, useEffect } from "react";
import {
  Form,
  Input,
  DatePicker,
  Button,
  Typography,
  message,
  InputNumber,
  Space,
  Card,
  Row,
  Col,
  Alert
} from "antd";
import dayjs from "dayjs";
import { useInternship } from "../../../contexts/InternshipContext";
import internshipService from '../../../services/internshipService';
import TranscriptUpload from '../common/TranscriptUpload';
import { UploadOutlined } from '@ant-design/icons';
import "./InternshipStyles.css";

const { Title, Text, Paragraph } = Typography;

const CS05Form = () => {
  const [form] = Form.useForm();
  const { state, setCS05Data } = useInternship();
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState(null);
  const [existingCS05, setExistingCS05] = useState(null);
  const [transcriptFile, setTranscriptFile] = useState(null);

  useEffect(() => {
    const fetchStudentData = async () => {
      setFetchLoading(true);
      try {
        const data = await internshipService.getStudentInfo();
        // ตรวจสอบการได้รับข้อมูล
        console.log('Student Data:', data);
        if (data.success) {
          const { student } = data;

          // ตรวจสอบสิทธิ์การฝึกงาน
          if (!student.isEligible) {
            message.error('หน่วยกิตไม่เพียงพอสำหรับการฝึกงาน (ต้องไม่ต่ำกว่า 81 หน่วยกิต)');
            return;
          }

          setStudentData(student);
          form.setFieldsValue({
            fullName: student.fullName, // ใช้ค่าที่คำนวณจาก backend
            studentId: student.studentId,
            totalCredits: student.totalCredits,
            year: student.year, // ใช้ค่าที่คำนวณจาก backend
            faculty: student.faculty,
            major: student.major
          });
        }
      } catch (error) {
        console.error('Fetch Student Error:', error);
        message.error(error.message);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchStudentData();
  }, [form]);

  useEffect(() => {
    if (formData?.status === 'rejected') {
      message.warning('คำร้องถูกปฏิเสธ กรุณาแก้ไขและส่งใหม่อีกครั้ง');
    }
  }, [formData]);

  useEffect(() => {
    // สร้างตัวแปรเพื่อป้องกันการเรียก API หลังจาก component unmount
    let isMounted = true;

    const checkExistingCS05 = async () => {
      try {
        console.log('Fetching CS05 data...');
        const response = await internshipService.getCurrentCS05();

        // ตรวจสอบว่า component ยังคงอยู่หรือไม่
        if (!isMounted) return;

        if (response.success && response.data) {
          const cs05Data = response.data;
          setFormData(cs05Data);
          setExistingCS05(cs05Data);
          setIsSubmitted(cs05Data.status !== 'rejected');
          setCS05Data(cs05Data);

          // Set form values
          form.setFieldsValue({
            companyName: cs05Data.companyName || '',
            companyAddress: cs05Data.companyAddress || '',
            internshipPeriod: cs05Data.startDate && cs05Data.endDate
              ? [dayjs(cs05Data.startDate), dayjs(cs05Data.endDate)]
              : undefined
          });

          if (cs05Data.transcriptFilename) {
            setTranscriptFile({
              name: cs05Data.transcriptFilename,
              status: 'done',
              uid: '-1'
            });
          }
        }
      } catch (error) {
        if (!isMounted) return;
        console.error('Error fetching CS05:', error);

        if (error.response?.status !== 404) {
          message.error('ไม่สามารถโหลดข้อมูล CS05 กรุณาลองใหม่ภายหลัง');
        }
      }
    };

    checkExistingCS05();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  const validateInternshipPeriod = (startDate, endDate) => {
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const workingDays = end.diff(start, 'days') + 1;

    if (workingDays < 40) {
      message.error('ระยะเวลาฝึกงานต้องไม่ต่ำกว่า 40 วันทำการ');
      return false;
    }
    return true;
  };

  const onFinish = async (values) => {
    if (isSubmitted && formData?.status !== 'rejected') {
      message.warning('ไม่สามารถแก้ไขคำร้องที่ส่งแล้วได้');
      return;
    }

    if (!validateInternshipPeriod(values.internshipPeriod[0], values.internshipPeriod[1])) {
      return;
    }

    // ตรวจสอบว่ามีไฟล์ transcript หรือไม่ (ปรับปรุงการตรวจสอบให้ละเอียดขึ้น)
    if (!transcriptFile) {
      message.error('กรุณาอัปโหลดใบแสดงผลการเรียน (Transcript)');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();

      // เพิ่มข้อมูลฟอร์ม
      const submitData = {
        documentType: 'internship',
        documentName: 'CS05',
        category: 'proposal',
        studentId: studentData.studentId,
        fullName: studentData.fullName,
        year: studentData.year,
        totalCredits: studentData.totalCredits,
        companyName: values.companyName,
        companyAddress: values.companyAddress,
        startDate: values.internshipPeriod[0].format('YYYY-MM-DD'),
        endDate: values.internshipPeriod[1].format('YYYY-MM-DD'),
      };

      // เพิ่มข้อมูลฟอร์มเป็น JSON
      formData.append('formData', JSON.stringify(submitData));

      // เพิ่มไฟล์ transcript (ตรวจสอบว่าเป็น File object หรือไม่)
      if (transcriptFile instanceof File) {
        formData.append('transcript', transcriptFile);
      } else if (transcriptFile.originFileObj) {
        // กรณีที่ได้จาก Upload component ของ Ant Design
        formData.append('transcript', transcriptFile.originFileObj);
      } else {
        // เมื่อมีเฉพาะข้อมูลเก่า แต่ไม่มีไฟล์ใหม่
        message.error('ไม่พบไฟล์ที่อัปโหลด กรุณาอัปโหลดไฟล์ใหม่');
        setLoading(false);
        return;
      }

      const response = await internshipService.submitCS05WithTranscript(formData);

      if (response.success) {
        message.success('บันทึกคำร้องและอัปโหลด Transcript สำเร็จ');
        setCS05Data(response.data);
        setExistingCS05(response.data);
        setIsSubmitted(true);
        setFormData(response.data);
      } else {
        throw new Error(response.message || 'ไม่สามารถบันทึกข้อมูลได้');
      }
    } catch (error) {
      message.error(error.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // เพิ่มการตรวจสอบสถานะ disabled
  const isFieldsDisabled = isSubmitted && existingCS05?.status !== 'rejected';

  return (
    <div className="internship-container">
      <Card className="internship-card">
        <div className="text-center">
          <Title level={4} className="text-right">
            คพ.05
          </Title>
          <Title level={4} className="title-text">
            คำร้องขอให้ภาควิชาฯ ออกหนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน
          </Title>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={24} className="text-right">
            <Paragraph
              style={{ fontSize: "16px" }}
            >
              ภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
            </Paragraph>
            <Paragraph
              style={{ fontSize: "14px" }}
            >วันที่ {dayjs().locale('th').add(543, 'year').format("D MMMM YYYY")}</Paragraph>
          </Col>

          <Col span={24}>
            <Paragraph className="text-indent" style={{ fontSize: "16px" }} >
              <Text className="bold-text" style={{ fontSize: "16px" }}>เรื่อง</Text>{" "}
              ขอให้ภาควิชาฯออกหนังสือราชการ
            </Paragraph>
            <Paragraph className="text-indent" style={{ fontSize: "16px" }}>
              <Text className="bold-text" style={{ fontSize: "16px" }}>เรียน</Text>{" "}
              หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
            </Paragraph>
          </Col>

          <Col span={24}>
            <Paragraph className="text-indent" style={{ fontSize: "16px" }}>
              ด้วยข้าพเจ้า มีความประสงค์ขอให้ภาควิชาฯ
              ออกหนังสือราชการเพื่อขอความอนุเคราะห์เข้ารับการฝึกงาน
              ตามรายละเอียดดังนี้
            </Paragraph>
          </Col>
        </Row>

        <Form
          form={form}
          onFinish={onFinish}
          layout="vertical"
          initialValues={state.registration.cs05.data}
          className="internship-form"
        >
          <Space direction="vertical" size="large" className="form-content">
            <div>
              <Paragraph style={{ fontSize: "16px" }}>
                ข้าพเจ้า{" "}
                <Form.Item
                  name="fullName"
                  noStyle
                >
                  <Input className="inline-input" disabled />
                </Form.Item>{" "}
                รหัสนักศึกษา{" "}
                <Form.Item
                  name="studentId"
                  noStyle
                >
                  <Input className="inline-input" disabled />
                </Form.Item>
              </Paragraph>

              <Paragraph style={{ fontSize: "16px" }}>
                {" "}
                ชั้นปีที่{" "}
                <Form.Item name="year" noStyle rules={[{ required: true }]}>
                  <InputNumber min={1} max={4} className="inline-input-small" disabled />
                </Form.Item>{" "}
                หน่วยกิตสะสมทั้งหมด{" "}
                <Form.Item
                  name="totalCredits" // Changed from gpa
                  noStyle
                >
                  <InputNumber
                    min={0}
                    max={150}
                    className="inline-input-small"
                    disabled
                  />
                </Form.Item>
              </Paragraph>
            </div>

            <Text style={{ fontSize: "16px" }}>1.ขอความอนุเคราะห์ฝึกงาน ชื่อบริษัท/หน่วยงาน</Text>
            <Form.Item
              name="companyName"
              noStyle
              rules={[{ required: true, message: "กรุณากรอกชื่อบริษัท" }]}
            >
              <Input disabled={isFieldsDisabled} />
            </Form.Item>

            <Text style={{ fontSize: "16px" }}>2.สถานที่ตั้ง</Text>
            <Form.Item
              name="companyAddress"
              noStyle
              rules={[{ required: true, message: "กรุณากรอกที่อยู่" }]}
            >
              <Input.TextArea rows={3} disabled={isFieldsDisabled} />
            </Form.Item>
            <div>
              <Paragraph style={{ fontSize: "16px" }}>
                ระยะเวลาฝึกงาน{" "}
                <Form.Item
                  name="internshipPeriod"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <DatePicker.RangePicker
                    disabled={isFieldsDisabled}
                    disabledDate={(current) => current && current < dayjs().startOf("day")}
                    format="D MMMM YYYY"
                  />
                </Form.Item>
              </Paragraph>
            </div>

            <div className="note-section" >
              <Title level={5}>หมายเหตุ</Title>
              <Text>1. นักศึกษาจะต้องฝึกงานไม่ต่ำกว่า 240 ชั่วโมง (ไม่ต่ำว่า 40 วันทำการ ไม่นับ วันหยุดราชการ ขา สาย ลา)</Text>
              <br />
              <Text>
                2. โดยนักศึกษาต้องแนบเอกสารใบแสดงผลการเรียน
                มาเพื่อยืนยันว่ามีจำนวนหน่วยกิตรวมทั้งหมด ณ
                วันที่ยื่นเอกสารไม่ต่ำกว่า 81 หน่วยกิต
                (นักศึกษาสามารถพรินต์ผลการเรียนได้จากระบบ REG)
              </Text>
            </div>

            <div className="form-footer">
              <Paragraph className="text-indent" style={{ fontSize: "16px" }}>
                จึงเรียนมาเพื่อโปรดพิจารณา
              </Paragraph>
            </div>

            <div className="upload-section">
              <Form.Item
                name="transcript"
                label="ใบแสดงผลการเรียน"
                required
                tooltip="กรุณาอัพโหลดใบแสดงผลการเรียนจากระบบ REG เพื่อยืนยันว่ามีหน่วยกิตเพียงพอ"
                rules={[{ required: true, message: 'กรุณาอัพโหลดใบแสดงผลการเรียนจากระบบ REG' }]}
              >
                <TranscriptUpload
                  value={transcriptFile}
                  onChange={setTranscriptFile}
                  disabled={isFieldsDisabled}
                />
              </Form.Item>

              {/* เพิ่มส่วนแสดงลิงก์ดาวน์โหลด transcript ที่อัปโหลดไว้แล้ว */}
              {isSubmitted && formData?.transcriptFilename && (
                <Alert
                  message="ไฟล์ Transcript ที่อัปโหลดแล้ว"
                  description={
                    <Button
                      type="link"
                      onClick={() => window.open(`${process.env.REACT_APP_API_URL}/files/${formData.transcriptFilename}`, '_blank')}
                    >
                      คลิกที่นี่เพื่อดูไฟล์ ({formData.transcriptFilename})
                    </Button>
                  }
                  type="success"
                  showIcon
                  style={{ marginTop: '8px', marginBottom: '16px' }}
                />
              )}

              <Alert
                message="ข้อควรทราบ"
                description="การส่งคำร้องและอัปโหลด Transcript จะดำเนินการพร้อมกันเมื่อคุณกดปุ่ม 'บันทึกคำร้อง' ด้านล่าง"
                type="info"
                showIcon
                style={{ marginBottom: '16px' }}
              />
            </div>

            <div className="submit-section">
              {isSubmitted ? (
                <Alert
                  message={`สถานะคำร้อง: ${formData?.status === 'pending' ? 'รอการพิจารณา' : formData?.status}`}
                  type={formData?.status === 'approved' ? 'success' : 'warning'}
                  showIcon
                />
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  size="large"
                  icon={<UploadOutlined />}
                >
                  บันทึกคำร้องและอัปโหลด Transcript
                </Button>
              )}
            </div>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default CS05Form;
