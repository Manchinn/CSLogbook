import React, { useState } from 'react';
import { Button, TimePicker, message, Modal, Form, Input } from 'antd';
import { ClockCircleOutlined, EditOutlined, CheckOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useInternship } from '../../../../contexts/InternshipContext';

const QuickActions = ({ selectedDate, refreshData }) => {
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [checkOutModalVisible, setCheckOutModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { internshipService } = useInternship();

  const handleCheckIn = async (time) => {
    try {
      setCheckingIn(true);
      const timeString = time.format('HH:mm');
      const formattedDate = selectedDate.format('YYYY-MM-DD');
      
      await internshipService.checkIn(formattedDate, timeString);
      message.success('บันทึกเวลาเข้างานเรียบร้อย');
      refreshData();
    } catch (error) {
      message.error(error.message);
    } finally {
      setCheckingIn(false);
    }
  };

  const showCheckOutModal = () => {
    setCheckOutModalVisible(true);
  };

  const handleCheckOut = async (values) => {
    try {
      setCheckingOut(true);
      const formattedDate = selectedDate.format('YYYY-MM-DD');
      
      const data = {
        workDate: formattedDate,
        timeOut: values.timeOut.format('HH:mm'),
        logTitle: values.logTitle,
        workDescription: values.workDescription,
        learningOutcome: values.learningOutcome,
        problems: values.problems || '',
        solutions: values.solutions || ''
      };
      
      await internshipService.checkOut(data);
      message.success('บันทึกเวลาออกงานและรายละเอียดเรียบร้อย');
      setCheckOutModalVisible(false);
      refreshData();
    } catch (error) {
      message.error(error.message);
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="quick-actions">
      <div className="check-in">
        <TimePicker 
          format="HH:mm" 
          placeholder="เวลาเข้างาน"
          defaultValue={dayjs('08:30', 'HH:mm')}
          minuteStep={5}
        />
        <Button 
          type="primary" 
          icon={<ClockCircleOutlined />} 
          loading={checkingIn}
          onClick={() => handleCheckIn(dayjs('08:30', 'HH:mm'))}
        >
          เข้างาน
        </Button>
      </div>

      <Button 
        type="primary" 
        icon={<EditOutlined />}
        onClick={showCheckOutModal}
      >
        ออกงาน + บันทึกรายละเอียด
      </Button>

      <Modal
        title="บันทึกเวลาออกงานและรายละเอียด"
        open={checkOutModalVisible}
        onCancel={() => setCheckOutModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form form={form} onFinish={handleCheckOut} layout="vertical">
          <Form.Item 
            name="timeOut" 
            label="เวลาออกงาน"
            rules={[{ required: true, message: 'กรุณาระบุเวลาออกงาน' }]}
            initialValue={dayjs('17:30', 'HH:mm')}
          >
            <TimePicker format="HH:mm" minuteStep={5} />
          </Form.Item>
          
          <Form.Item 
            name="logTitle" 
            label="หัวข้องาน"
            rules={[{ required: true, message: 'กรุณาระบุหัวข้องาน' }]}
          >
            <Input placeholder="สรุปงานที่ทำในวันนี้" />
          </Form.Item>
          
          <Form.Item 
            name="workDescription" 
            label="รายละเอียดงาน" 
            rules={[{ required: true, message: 'กรุณาระบุรายละเอียดงาน' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Form.Item 
            name="learningOutcome" 
            label="สิ่งที่ได้เรียนรู้" 
            rules={[{ required: true, message: 'กรุณาระบุสิ่งที่ได้เรียนรู้' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Form.Item 
            name="problems" 
            label="ปัญหาที่พบ"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Form.Item 
            name="solutions" 
            label="วิธีการแก้ไข"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={checkingOut}
              icon={<CheckOutlined />}
            >
              บันทึกข้อมูล
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuickActions;