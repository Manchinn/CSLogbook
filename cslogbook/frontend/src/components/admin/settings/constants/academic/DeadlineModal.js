import React from 'react';
import { Modal, Form, Input, DatePicker, TimePicker, Select, Row, Col, Divider, Alert } from 'antd';
import moment from 'moment';

const { Option } = Select;

// Modal สำหรับเพิ่ม/แก้ไขกำหนดการสำคัญ (วันเดียว หรือ ช่วงหลายวัน)
export default function DeadlineModal({
  visible,
  onCancel,
  onSave,
  formState,
  setFormState,
  loading,
  error,
  editing,
  thLocale
}) {
  return (
    <Modal
      title={editing ? 'แก้ไขกำหนดการ' : 'เพิ่มกำหนดการใหม่'}
      open={visible}
      onOk={onSave}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="บันทึก"
      cancelText="ยกเลิก"
      destroyOnClose
    >
      <Form layout="vertical">
        <Form.Item label="ชื่อกิจกรรม" required>
          <Input
            value={formState.name}
            onChange={e => setFormState({ ...formState, name: e.target.value })}
            placeholder="เช่น วันสอบโครงงานพิเศษ 1"
          />
        </Form.Item>
        <Form.Item label="วันที่ (หากไม่ใช้ช่วงเวลา)" required={!(formState.windowStartDate && formState.windowEndDate)}>
          <DatePicker
            style={{ width: '100%' }}
            value={formState.date}
            onChange={date => setFormState({ ...formState, date })}
            format={v => v ? moment(v).add(543,'year').format('D MMMM YYYY') : ''}
            locale={thLocale}
            placeholder="เลือกวันที่ (หรือกำหนดช่วงด้านล่าง)"
            disabled={!!(formState.windowStartDate && formState.windowEndDate)}
          />
        </Form.Item>
        <Form.Item label="เวลา (ถ้าเป็นวันเดียว)">
          <TimePicker
            style={{ width: '100%' }}
            value={formState.time}
            onChange={time => setFormState({ ...formState, time })}
            format="HH:mm"
            placeholder="เลือกเวลา (ไม่ระบุ=23:59)"
            disabled={!!(formState.windowStartDate && formState.windowEndDate)}
          />
        </Form.Item>
        <Form.Item label="ประเภทกิจกรรม">
          <Select
            value={formState.relatedTo}
            onChange={value => setFormState({ ...formState, relatedTo: value })}
          >
            <Option value="project">โครงงาน/ปริญญานิพนธ์</Option>
            <Option value="internship">ฝึกงาน/สหกิจศึกษา</Option>
            <Option value="general">ทั่วไป</Option>
          </Select>
        </Form.Item>
        <Form.Item label="ภาคเรียน">
          <Select
            value={formState.semester}
            onChange={v => setFormState({ ...formState, semester: v })}
          >
            <Option value={1}>ภาคเรียนที่ 1</Option>
            <Option value={2}>ภาคเรียนที่ 2</Option>
            <Option value={3}>ภาคฤดูร้อน</Option>
          </Select>
        </Form.Item>
        <Form.Item label="ปีการศึกษา">
          <Input
            value={formState.academicYear}
            onChange={e => setFormState({ ...formState, academicYear: e.target.value })}
            placeholder="เช่น 2567"
          />
        </Form.Item>
        <Divider orientation="left" plain>หรือกำหนดเป็นช่วงเวลา</Divider>
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label="เริ่ม (วัน)">
              <DatePicker
                style={{ width:'100%' }}
                value={formState.windowStartDate}
                onChange={v => setFormState({ ...formState, windowStartDate: v })}
                format={v => v ? moment(v).add(543,'year').format('D MMM YYYY') : ''}
                locale={thLocale}
                placeholder="เลือกวันเริ่ม"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="สิ้นสุด (วัน)">
              <DatePicker
                style={{ width:'100%' }}
                value={formState.windowEndDate}
                onChange={v => setFormState({ ...formState, windowEndDate: v })}
                format={v => v ? moment(v).add(543,'year').format('D MMM YYYY') : ''}
                locale={thLocale}
                placeholder="เลือกวันสิ้นสุด"
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="ทั้งวัน?">
              <Select
                value={formState.allDay ? 'yes' : 'no'}
                onChange={v => setFormState({ ...formState, allDay: v === 'yes' })}
                disabled={!(formState.windowStartDate && formState.windowEndDate)}
              >
                <Option value="no">ไม่</Option>
                <Option value="yes">ใช่</Option>
              </Select>
            </Form.Item>
          </Col>
          {formState.windowStartDate && formState.windowEndDate && !formState.allDay && (
            <>
              <Col span={8}>
                <Form.Item label="เวลาเริ่ม">
                  <TimePicker
                    style={{ width:'100%' }}
                    value={formState.windowStartTime}
                    onChange={v => setFormState({ ...formState, windowStartTime: v })}
                    format="HH:mm"
                  />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="เวลาสิ้นสุด">
                  <TimePicker
                    style={{ width:'100%' }}
                    value={formState.windowEndTime}
                    onChange={v => setFormState({ ...formState, windowEndTime: v })}
                    format="HH:mm"
                  />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
        {error && <Alert type="error" message={error} />}
      </Form>
    </Modal>
  );
}
