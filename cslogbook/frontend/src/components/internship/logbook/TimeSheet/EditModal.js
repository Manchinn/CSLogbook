import React, { useEffect } from 'react';
import { Modal, Form, Input, TimePicker, Row, Col, InputNumber, DatePicker, Alert } from 'antd';
import dayjs from '../../../../utils/dayjs';
import { calculateWorkHours } from '../../../../utils/timeUtils';
import { DATE_FORMAT_MEDIUM, TIME_FORMAT } from '../../../../utils/constants';

const EditModal = ({ visible, loading, entry, form, onOk, onCancel }) => {
  const title = "บันทึกข้อมูลการฝึกงาน";

  const handleSubmit = () => {
    const timeOut = form.getFieldValue('timeOut');

    if (!timeOut) {
      // แก้ไขให้ validateFields ครอบคลุมทุกฟิลด์ แต่เป็น optional ยกเว้น workDate และ timeIn
      form.validateFields()
        .then(values => {
          // ยังคง mode เป็น checkin แต่รับข้อมูลอื่นๆ ที่ผู้ใช้อาจกรอกด้วย
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
      style={{ top: 20 }}
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
              <p>- หากต้องการเพียงบันทึกเวลาเข้างาน สามารถกรอกเฉพาะ "เวลาเข้างาน" หรือกรอกรายละเอียดเพิ่มเติมด้วยก็ได้</p>
              <p>- หากต้องการบันทึกข้อมูลเป็นวันที่สมบูรณ์ จำเป็นต้องกรอก "เวลาออกงาน" และรายละเอียดให้ครบถ้วน</p>
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
          <div style={{ position: 'relative' }}>
            <DatePicker disabled style={{ width: '100%', opacity: 0, position: 'absolute' }} />
            <Input
              disabled
              value={entry?.workDate ? dayjs(entry.workDate).format("D MMMM BBBB") : '-'}
              style={{ width: '100%' }}
            />
          </div>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="timeIn"
              label="เวลาเข้างาน"
              rules={[{ required: true, message: 'กรุณาเลือกเวลาเข้างาน' }]}
            >
              <TimePicker format={TIME_FORMAT} style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="timeOut"
              label="เวลาออกงาน (ถ้ามี)"
              tooltip="หากต้องการบันทึกครบถ้วน ต้องระบุเวลาออกงาน"
            >
              <TimePicker format={TIME_FORMAT} style={{ width: '100%' }} />
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
          tooltip="สามารถกรอกได้ทั้งกรณีบันทึกเวลาเข้างานอย่างเดียว หรือบันทึกครบถ้วน"
        >
          <Input placeholder="กรอกหัวข้อการปฏิบัติงานในวันนี้" />
        </Form.Item>

        <Form.Item
          name="workDescription"
          label="รายละเอียดงาน"
          tooltip="สามารถกรอกได้ทั้งกรณีบันทึกเวลาเข้างานอย่างเดียว หรือบันทึกครบถ้วน"
        >
          <Input.TextArea
            rows={4}
            placeholder="กรอกรายละเอียดการปฏิบัติงานในวันนี้"
          />
        </Form.Item>

        <Form.Item
          name="learningOutcome"
          label="สิ่งที่ได้เรียนรู้"
          tooltip="สามารถกรอกได้ทั้งกรณีบันทึกเวลาเข้างานอย่างเดียว หรือบันทึกครบถ้วน"
        >
          <Input.TextArea
            rows={4}
            placeholder="กรอกสิ่งที่ได้เรียนรู้จากการปฏิบัติงาน"
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