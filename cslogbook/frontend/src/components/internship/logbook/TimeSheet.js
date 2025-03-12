import React from 'react';
import { Form, TimePicker, Input, Button, Typography, message } from 'antd';
import { useInternship } from '../../../contexts/InternshipContext';
import InternshipSteps from '../shared/InternshipSteps';
import './InternshipStyles.css';

const { Title } = Typography;

const TimeSheet = () => {
  const [form] = Form.useForm();
  const { state, addLogbookEntry } = useInternship();

  const onFinish = async (values) => {
    try {
      await addLogbookEntry({
        ...values,
        date: new Date().toISOString()
      });
      message.success('บันทึกข้อมูลเรียบร้อย');
      form.resetFields();
    } catch (error) {
      message.error('เกิดข้อผิดพลาด');
    }
  };

  return (
    <div className="internship-container">
      <InternshipSteps />
      <div className="internship-card">
        <Title level={3}>บันทึกการฝึกงานประจำวัน</Title>
        <div className="summary-info">
          <p>จำนวนวันทั้งหมด: {state.logbook.totalDays} วัน</p>
          <p>จำนวนชั่วโมงทั้งหมด: {state.logbook.totalHours} ชั่วโมง</p>
        </div>
        <Form 
          form={form}
          onFinish={onFinish}
          layout="vertical"
        >
          <Form.Item name="timeIn" label="เวลาเข้างาน" rules={[{ required: true }]}>
            <TimePicker format="HH:mm" />
          </Form.Item>

          <Form.Item name="workDone" label="งานที่ได้รับมอบหมาย" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item name="problems" label="ปัญหาที่พบ">
            <Input.TextArea rows={4} />
          </Form.Item>

          <Button type="primary" htmlType="submit" className="internship-button">บันทึกข้อมูล</Button>
        </Form>
      </div>
    </div>
  );
};

export default TimeSheet;