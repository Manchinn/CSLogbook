import React, { useEffect } from 'react';
import { Modal, Form, Input, TimePicker, Row, Col, InputNumber, DatePicker, Alert } from 'antd';
import dayjs from 'dayjs';
import { calculateWorkHours } from '../../../../utils/timeUtils';

const EditModal = ({ visible, loading, entry, form, onOk, onCancel }) => {
  const title = "บันทึกข้อมูลการฝึกงาน";
  
  const handleSubmit = () => {
    const timeOut = form.getFieldValue('timeOut');
    
    if (!timeOut) {
      form.validateFields(['workDate', 'timeIn'])
        .then(values => {
          onOk({ ...values, mode: 'checkin' });
        });
    } else {
      form.validateFields()
        .then(values => {
          onOk({ ...values, mode: 'complete' });
        });
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      width={700}
    >
      <Form 
        form={form} 
        layout="vertical"
        onValuesChange={(changedValues) => {
          if (changedValues.timeIn || changedValues.timeOut) {
            const values = form.getFieldsValue(['timeIn', 'timeOut']);
            const { timeIn, timeOut } = values;
            
            if (timeIn && timeOut) {
              const hours = calculateWorkHours(
                timeIn.format("HH:mm"),
                timeOut.format("HH:mm")
              );
              form.setFieldsValue({ workHours: hours });
            }
          }
        }}
      >
        <Alert
          message="การบันทึกข้อมูลฝึกงาน"
          description={
            <>
              <p>- หากต้องการเพียงบันทึกเวลาเข้างาน ให้กรอกเฉพาะ "เวลาเข้างาน" และกด OK</p>
              <p>- หากต้องการบันทึกข้อมูลครบถ้วน ให้กรอกข้อมูลทั้งหมดรวมถึง "เวลาออกงาน" และรายละเอียดงาน</p>
            </>
          }
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />

        <Form.Item 
          name="workDate" 
          label="วันที่" 
        >
          <DatePicker disabled format="DD/MM/YYYY" style={{ width: '100%' }} />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              name="timeIn" 
              label="เวลาเข้างาน" 
              rules={[{ required: true, message: 'กรุณาเลือกเวลาเข้างาน' }]}
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item 
              name="timeOut" 
              label="เวลาออกงาน (ถ้ามี)" 
              tooltip="หากต้องการบันทึกครบถ้วน ต้องระบุเวลาออกงาน"
            >
              <TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item 
          name="workHours" 
          label="จำนวนชั่วโมง" 
          dependencies={["timeIn", "timeOut"]}
        >
          <InputNumber disabled min={0} max={24} step={0.5} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item 
          name="logTitle" 
          label="หัวข้องาน" 
          tooltip="จำเป็นต้องกรอกเมื่อบันทึกข้อมูลครบถ้วน"
        >
          <Input placeholder="กรอกเมื่อต้องการบันทึกข้อมูลครบถ้วน" />
        </Form.Item>

        <Form.Item 
          name="workDescription" 
          label="รายละเอียดงาน"
          tooltip="จำเป็นต้องกรอกเมื่อบันทึกข้อมูลครบถ้วน"
        >
          <Input.TextArea 
            rows={4} 
            placeholder="กรอกเมื่อต้องการบันทึกข้อมูลครบถ้วน"
          />
        </Form.Item>

        <Form.Item 
          name="learningOutcome" 
          label="สิ่งที่ได้เรียนรู้"
          tooltip="จำเป็นต้องกรอกเมื่อบันทึกข้อมูลครบถ้วน"
        >
          <Input.TextArea 
            rows={4} 
            placeholder="กรอกเมื่อต้องการบันทึกข้อมูลครบถ้วน"
          />
        </Form.Item>

        <Form.Item name="problems" label="ปัญหาที่พบ (ถ้ามี)">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item name="solutions" label="วิธีการแก้ไข (ถ้ามี)">
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditModal;