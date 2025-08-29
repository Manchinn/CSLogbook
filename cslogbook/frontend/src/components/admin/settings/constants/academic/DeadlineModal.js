import React from 'react';
import { Modal, Form, Input, DatePicker, TimePicker, Select, Row, Col, Divider, Alert, Switch, InputNumber, Grid } from 'antd';
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
  // ใช้ breakpoint ของ Ant Design เพื่อกำหนดความกว้าง modal แบบ responsive
  const { useBreakpoint } = Grid;
  const screens = useBreakpoint();
  // กำหนดความกว้างตาม breakpoint: ใช้ตัวเลข (px) สำหรับ desktop, ใช้ "100%" สำหรับจอเล็ก
  const modalWidth = screens.xl
    ? 960
    : screens.lg
      ? 880
      : screens.md
        ? 760
        : screens.sm
          ? 680
          : '100%';

  return (
    <Modal
      title={editing ? 'แก้ไขกำหนดการ' : 'เพิ่มกำหนดการใหม่'}
      open={visible}
      onOk={onSave}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="บันทึก"
      cancelText="ยกเลิก"
      destroyOnHidden
      centered
      width={modalWidth}
      style={{ top: screens.xs ? 12 : 24, padding: 0, maxWidth: '100%' }}
    >
      <Form layout="vertical" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
        <Divider orientation="left" plain>ข้อมูลพื้นฐาน</Divider>
        <Form.Item label="ชื่อกำหนดการ" required tooltip="ชื่อที่นักศึกษาจะเห็น">
          <Input
            value={formState.name}
            onChange={e => setFormState({ ...formState, name: e.target.value })}
            placeholder="เช่น ส่งแบบฟอร์ม CS05 / ปฐมนิเทศ / วันสอบโครงงาน"
          />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
      <Form.Item label="ประเภทเดดไลน์" tooltip="กำหนดพฤติกรรม: ส่งเอกสาร / ประกาศ / ทำรายการเอง / เหตุการณ์">
              <Select
                value={formState.deadlineType}
                onChange={v => setFormState({ ...formState, deadlineType: v })}
              >
        <Option value="SUBMISSION">ส่งเอกสาร (SUBMISSION)</Option>
        <Option value="ANNOUNCEMENT">ประกาศ (ANNOUNCEMENT)</Option>
        <Option value="MANUAL">ทำรายการเอง (MANUAL)</Option>
        <Option value="MILESTONE">เหตุการณ์ (MILESTONE)</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="หมวด (relatedTo)" tooltip="ใช้แทน relatedWorkflow เดิม (รวม project1, project2)">
              <Select
                value={formState.relatedTo}
                onChange={value => setFormState({ ...formState, relatedTo: value })}
              >
        <Option value="project1">โครงงาน 1 (project1)</Option>
        <Option value="project2">โครงงาน 2 (project2)</Option>
        {formState.relatedTo === 'project' && <Option value="project">โครงงาน (legacy)</Option>}
        <Option value="internship">ฝึกงาน (internship)</Option>
        <Option value="general">ทั่วไป (general)</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Divider orientation="left" plain>การเผยแพร่ (Publish)</Divider>
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label="เผยแพร่ทันที?">
              <Switch
                checked={formState.isPublished}
                onChange={ck => setFormState({ ...formState, isPublished: ck })}
              />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item label="ตั้งเวลาเผยแพร่ (ถ้ามี)" tooltip="ถ้าระบุและยังไม่ถึงเวลา นักศึกษาจะยังไม่เห็น">
              <DatePicker
                showTime
                style={{ width:'100%' }}
                value={formState.publishAt}
                onChange={dt => setFormState({ ...formState, publishAt: dt })}
                locale={thLocale}
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="ขอบเขตการมองเห็น (Visibility)" tooltip="จำกัดผู้เห็นตามประเภท">
          <Select
            value={formState.visibilityScope}
            onChange={v => setFormState({ ...formState, visibilityScope: v })}
          >
            <Option value="ALL">ALL</Option>
            <Option value="INTERNSHIP_ONLY">INTERNSHIP_ONLY</Option>
            <Option value="PROJECT_ONLY">PROJECT_ONLY</Option>
            <Option value="CUSTOM">CUSTOM</Option>
          </Select>
        </Form.Item>
        <Divider orientation="left" plain>วันที่ / ช่วงเวลา</Divider>
        <Alert type="info" showIcon style={{ marginBottom:12 }} message="เลือก 'วันที่เดียว' หรือกำหนดช่วงเวลา (ถ้าใส่ช่วง ระบบจะใช้วันสิ้นสุดเป็น deadline หลัก)" />
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="วันที่ (หากไม่ใช้ช่วง)" required={!(formState.windowStartDate && formState.windowEndDate)}>
              <DatePicker
                style={{ width: '100%' }}
                value={formState.date}
                onChange={date => setFormState({ ...formState, date })}
                format={v => v ? moment(v).add(543,'year').format('D MMMM YYYY') : ''}
                locale={thLocale}
                placeholder="เลือกวันที่"
                disabled={!!(formState.windowStartDate && formState.windowEndDate)}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="เวลา (ของวันที่เดียว)">
              <TimePicker
                style={{ width: '100%' }}
                value={formState.time}
                onChange={time => setFormState({ ...formState, time })}
                format="HH:mm"
                placeholder="ไม่ระบุ = 23:59"
                disabled={!!(formState.windowStartDate && formState.windowEndDate)}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={12}>
          <Col span={8}>
            <Form.Item label="เริ่ม (วัน)">
              <DatePicker
                style={{ width:'100%' }}
                value={formState.windowStartDate}
                onChange={v => setFormState({ ...formState, windowStartDate: v })}
                format={v => v ? moment(v).add(543,'year').format('D MMM YYYY') : ''}
                locale={thLocale}
                placeholder="วันเริ่ม"
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
                placeholder="วันสิ้นสุด"
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
        {formState.deadlineType === 'SUBMISSION' && (
          <>
            <Divider orientation="left" plain>นโยบายการส่ง (Submission Policy)</Divider>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="เปิดรับส่งไฟล์?">
                  <Switch
                    checked={formState.acceptingSubmissions}
                    onChange={v => setFormState({ ...formState, acceptingSubmissions: v })}
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="อนุญาตส่งล่าช้า?">
                  <Switch
                    checked={formState.allowLate}
                    onChange={v => setFormState({ ...formState, allowLate: v })}
                  />
                </Form.Item>
              </Col>
            </Row>
            {formState.allowLate && (
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item label="Grace Period (นาที)" tooltip="เวลาผ่อนผันหลัง deadline หลัก">
                    <InputNumber
                      min={0}
                      style={{ width:'100%' }}
                      value={formState.gracePeriodMinutes}
                      onChange={v => setFormState({ ...formState, gracePeriodMinutes: v })}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="ล็อกหลังหมด grace?" tooltip="ถ้าเปิดจะไม่ให้ส่งหลังพ้น grace">
                    <Switch
                      checked={formState.lockAfterDeadline}
                      onChange={v => setFormState({ ...formState, lockAfterDeadline: v })}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}
            <Alert type="info" showIcon style={{ marginBottom:8 }} message={<span>ช่วงส่งล่าช้า = สิ้นสุด ช่วง / วันที่ + Grace Period{formState.allowLate && formState.gracePeriodMinutes ? ` (${Math.round(formState.gracePeriodMinutes/60)} ชั่วโมง)` : ''}</span>} />
          </>
        )}
  {formState.deadlineType !== 'SUBMISSION' && (
          <Alert type="warning" showIcon style={{ marginTop: 8 }} message={<span>ประเภท {formState.deadlineType} จะไม่เปิดรับไฟล์ (ระบบจะปิดการรับส่งอัตโนมัติ)</span>} />
        )}
        <Divider orientation="left" plain>ภาคเรียน / ปีการศึกษา</Divider>
        <Form.Item label="ภาคเรียน" tooltip="ภาคเรียนที่เดดไลน์นี้อยู่">
          <Select
            value={formState.semester}
            onChange={v => setFormState({ ...formState, semester: v })}
          >
            <Option value={1}>ภาคเรียนที่ 1</Option>
            <Option value={2}>ภาคเรียนที่ 2</Option>
            <Option value={3}>ภาคฤดูร้อน</Option>
          </Select>
        </Form.Item>
        <Form.Item label="ปีการศึกษา" tooltip="ระบุเป็น พ.ศ. (เช่น 2567)">
          <Input
            value={formState.academicYear}
            onChange={e => setFormState({ ...formState, academicYear: e.target.value })}
            placeholder="เช่น 2567"
          />
        </Form.Item>
        {error && <Alert type="error" message={error} />}
      </Form>
    </Modal>
  );
}
