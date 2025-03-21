import React, { useEffect } from 'react';
import { Modal, Form, Input, TimePicker, Row, Col, InputNumber } from 'antd';
import { calculateWorkHours } from '../../../../utils/timeUtils';
const EditModal = ({ visible, loading, entry, form, onOk, onCancel }) => {
  useEffect(() => {
    const timeIn = form.getFieldValue("timeIn");
    const timeOut = form.getFieldValue("timeOut");

    if (timeIn && timeOut) {
      const hours = calculateWorkHours(
        timeIn.format("HH:mm"),
        timeOut.format("HH:mm")
      );
      form.setFieldValue("workHours", hours);
    }
  }, [form.getFieldValue("timeIn"), form.getFieldValue("timeOut")]);

  return (
    <Modal
      title="แก้ไขข้อมูลการฝึกงาน"
      open={visible}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="timeIn" label="เวลาเข้างาน" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="timeOut" label="เวลาออกงาน" rules={[{ required: true }]}>
              <TimePicker format="HH:mm" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="workHours" label="จำนวนชั่วโมง" dependencies={["timeIn", "timeOut"]}>
          <InputNumber disabled min={0} max={24} step={0.5} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="logTitle" label="หัวข้องาน" rules={[{ required: true }]}>
          <Input />
        </Form.Item>

        <Form.Item name="workDescription" label="รายละเอียดงาน" rules={[{ required: true }]}>
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item name="learningOutcome" label="สิ่งที่ได้เรียนรู้" rules={[{ required: true }]}>
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item name="problems" label="ปัญหาที่พบ">
          <Input.TextArea rows={4} />
        </Form.Item>

        <Form.Item name="solutions" label="วิธีการแก้ไข">
          <Input.TextArea rows={4} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditModal;