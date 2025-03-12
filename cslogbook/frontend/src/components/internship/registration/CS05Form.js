import React, { useState } from 'react';
import { Form, Input, DatePicker, Button, Typography, message, InputNumber, Space, Card, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { useInternship } from '../../../contexts/InternshipContext';
import InternshipSteps from '../shared/InternshipSteps';
import './InternshipStyles.css';

const { Title, Text, Paragraph } = Typography;

const CS05Form = () => {
  const [form] = Form.useForm();
  const { state, setCS05Data } = useInternship();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await setCS05Data(values);
      message.success('บันทึกข้อมูลเรียบร้อย');
    } catch (error) {
      message.error('เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="internship-container">
      <InternshipSteps />
      <Card className="internship-card">
        <div className="text-center">
          <Title level={4} className="title-text">
            คพ.05
          </Title>
          <Title level={4} className="title-text">
            คำร้องขอให้ภาควิชาฯ ออกหนังสือขอความอนุเคราะห์รับนักศึกษาเข้าฝึกงาน
          </Title>
        </div>

        <Row gutter={[16, 16]}>
          <Col span={24} className="text-right">
            <Paragraph>
              เขียนที่ มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ
            </Paragraph>
            <Paragraph>
              วันที่ {dayjs().format('D MMMM YYYY')}
            </Paragraph>
          </Col>
          
          <Col span={24}>
            <Paragraph className="text-indent">
              <Text className="bold-text">เรื่อง</Text> ขอให้ภาควิชาฯออกหนังสือราชการ
            </Paragraph>
            <Paragraph className="text-indent">
              <Text className="bold-text">เรียน</Text> หัวหน้าภาควิชาวิทยาการคอมพิวเตอร์และสารสนเทศ
            </Paragraph>
          </Col>

          <Col span={24}>
            <Paragraph className="text-indent">
              ด้วยข้าพเจ้า มีความประสงค์ขอให้ภาควิชาฯ ออกหนังสือราชการเพื่อขอความอนุเคราะห์เข้ารับการฝึกงาน 
              ตามรายละเอียดดังนี้ (โปรดเขียนด้วยตัวบรรจง)
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
            <div className="student-info-section">
              <Paragraph>
                ข้าพเจ้า{' '}
                <Form.Item
                  name="fullName"
                  noStyle
                  rules={[{ required: true, message: 'กรุณากรอกชื่อ-นามสกุล' }]}
                >
                  <Input className="inline-input" />
                </Form.Item>
                {' '}รหัสนักศึกษา{' '}
                <Form.Item
                  name="studentId"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <Input className="inline-input"  />
                </Form.Item>
              </Paragraph>

              <Paragraph>
                {' '}ชั้นปีที่{' '}
                <Form.Item
                  name="year"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <InputNumber min={1} max={4} className="inline-input-small" />
                </Form.Item>
                {' '}จำนวนหน่วยกิตทั้งหมดรวมทั้งสิ้น{' '}
                <Form.Item
                  name="totalCredits" // Changed from gpa
                  noStyle
                  rules={[{ required: true }]}
                >
                  <InputNumber min={0} max={150} className="inline-input-small" /> 
                </Form.Item>
              </Paragraph>
            </div>

              <Text>1.ขอความอนุเคราะห์ฝึกงาน ชื่อบริษัท/หน่วยงาน</Text>
              <Form.Item
                name="companyName"
                noStyle
                rules={[{ required: true, message: 'กรุณากรอกชื่อบริษัท' }]}
              >
                <Input className="dotted-underline" />
              </Form.Item>

              <Text>2.สถานที่ตั้ง</Text>
              <Form.Item
                name="companyAddress"
                noStyle
                rules={[{ required: true, message: 'กรุณากรอกที่อยู่' }]}
              >
                <Input.TextArea className="dotted-underline" rows={3} />
              </Form.Item>

            <div className="company-info-section">
              <Paragraph>
                แผนก/ฝ่าย{' '}
                <Form.Item
                  name="department"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <Input className="inline-input" />
                </Form.Item>
              </Paragraph>

              <Paragraph>
                ลักษณะงาน{' '}
                <Form.Item
                  name="jobDescription"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <Input.TextArea className="block-input" rows={3} />
                </Form.Item>
              </Paragraph>
            </div>

            <div className="coordinator-info-section">
              <Paragraph>
                ผู้นิเทศงาน{' '}
                <Form.Item
                  name="supervisorName"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <Input className="inline-input" />
                </Form.Item>
              </Paragraph>

              <Paragraph>
                ตำแหน่ง{' '}
                <Form.Item
                  name="supervisorPosition"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <Input className="inline-input" />
                </Form.Item>
              </Paragraph>

              <Paragraph>
                เบอร์ติดต่อ{' '}
                <Form.Item
                  name="supervisorPhone"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <Input className="inline-input" />
                </Form.Item>
              </Paragraph>

              <Paragraph>
                อีเมล{' '}
                <Form.Item
                  name="supervisorEmail"
                  noStyle
                  rules={[{ required: true, type: 'email' }]}
                >
                  <Input className="inline-input" />
                </Form.Item>
              </Paragraph>
            </div>

            <div className="internship-period-section">
              <Paragraph>
                ระยะเวลาฝึกงาน{' '}
                <Form.Item
                  name="internshipPeriod"
                  noStyle
                  rules={[{ required: true }]}
                >
                  <DatePicker.RangePicker
                    disabledDate={(current) => {
                      return current && current < dayjs().startOf('day');
                    }}
                  />
                </Form.Item>
              </Paragraph>
            </div>

            <div className="note-section">
              <Title level={5}>หมายเหตุ</Title>
              <Text>1. นักศึกษาจะต้องฝึกงานไม่ต่ำกว่า 240 ชั่วโมง</Text>
              <br />
              <Text>
                2. โดยนักศึกษาต้องแนบเอกสารใบแสดงผลการเรียน มาเพื่อยืนยันว่ามีจำนวนหน่วยกิตรวมทั้งหมด
                ณ วันที่ยื่นเอกสารไม่ต่ำกว่า 81 หน่วยกิต (นักศึกษาสามารถพรินต์ผลการเรียนได้จากระบบ REG)
              </Text>
            </div>

            <div className="form-footer">
              <Paragraph className="text-indent">จึงเรียนมาเพื่อโปรดพิจารณา</Paragraph>
            </div>

            <div className="submit-section">
              <Button type="primary" htmlType="submit" loading={loading}>
                บันทึกคำร้อง
              </Button>
            </div>
          </Space>
        </Form>
      </Card>
    </div>
  );
};

export default CS05Form;