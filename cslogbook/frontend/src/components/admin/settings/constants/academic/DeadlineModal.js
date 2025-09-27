import React, { useMemo } from 'react';
import { Modal, Form, Input, DatePicker, TimePicker, Select, Row, Col, Divider, Alert, Switch, InputNumber, Grid } from 'antd';
import moment from 'moment';

const { Option } = Select;

const LateSubmissionDuration = ({ gracePeriodMinutes, setFormState, formState }) => {
  const breakdown = useMemo(() => {
    const total = Number.isFinite(gracePeriodMinutes) ? Math.max(0, gracePeriodMinutes) : 0;
    const days = Math.floor(total / 1440);
    const remainderAfterDays = total - days * 1440;
    const hours = Math.floor(remainderAfterDays / 60);
    const minutes = remainderAfterDays % 60;
    return {
      days,
      hours,
      minutes,
      total
    };
  }, [gracePeriodMinutes]);

  const updateDuration = (field, rawValue) => {
    const safeValue = Number.isFinite(rawValue) ? Math.max(0, Math.floor(rawValue)) : 0;
    const next = {
      days: breakdown.days,
      hours: breakdown.hours,
      minutes: breakdown.minutes,
      [field]: safeValue
    };

    // ปรับค่าให้อยู่ในช่วงมาตรฐาน (ชั่วโมง < 24, นาที < 60)
    let totalMinutes = (next.days || 0) * 1440 + (next.hours || 0) * 60 + (next.minutes || 0);
    totalMinutes = Math.max(0, totalMinutes);

    setFormState({
      ...formState,
      gracePeriodMinutes: totalMinutes
    });
  };

  return (
    <Form.Item
      label="ช่วงเวลาที่สามารถส่งล่าช้าได้"
      tooltip="กำหนดเป็นจำนวนวัน ชั่วโมง และนาทีที่อนุญาตให้ส่งล่าช้า"
      style={{ marginBottom: 0 }}
    >
      <Row gutter={8}>
        <Col span={8}>
          <InputNumber
            min={0}
            precision={0}
            style={{ width: '100%' }}
            value={breakdown.days}
            onChange={value => updateDuration('days', value)}
            formatter={value => `${value ?? 0}`}
            parser={value => parseInt(value || '0', 10)}
            addonAfter="วัน"
          />
        </Col>
        <Col span={8}>
          <InputNumber
            min={0}
            precision={0}
            style={{ width: '100%' }}
            value={breakdown.hours}
            onChange={value => updateDuration('hours', value)}
            formatter={value => `${value ?? 0}`}
            parser={value => parseInt(value || '0', 10)}
            addonAfter="ชั่วโมง"
          />
        </Col>
        <Col span={8}>
          <InputNumber
            min={0}
            precision={0}
            style={{ width: '100%' }}
            value={breakdown.minutes}
            onChange={value => updateDuration('minutes', value)}
            formatter={value => `${value ?? 0}`}
            parser={value => parseInt(value || '0', 10)}
            addonAfter="นาที"
          />
        </Col>
      </Row>
      <div style={{ marginTop: 8, color: '#8c8c8c' }}>
        รวม {breakdown.total.toLocaleString('th-TH')} นาที
      </div>
    </Form.Item>
  );
};

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
        <Form.Item label="ชื่อกำหนดการ" >
          <Input
            value={formState.name}
            onChange={e => setFormState({ ...formState, name: e.target.value })}
            placeholder="เช่น กรอกคำร้องขอฝึกงาน(คพ.05) / ส่งเอกสารการฝึกงานเพื่อรับใบรับรองการฝึกงาน / วันสอบโครงงานพิเศษ"
          />
        </Form.Item>
        <Row gutter={12}>
          <Col span={12}>
      <Form.Item label="ประเภทของกำหนดการ" tooltip="กำหนดพฤติกรรม: ส่งเอกสาร / ประกาศ / ทำรายการเอง / เหตุการณ์">
              <Select
                value={formState.deadlineType}
                onChange={v => setFormState({ ...formState, deadlineType: v })}
              >
        <Option value="SUBMISSION">ส่งเอกสาร</Option>
        <Option value="ANNOUNCEMENT">ประกาศ</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="หมวด" >
              <Select
                value={formState.relatedTo}
                onChange={value => setFormState({ ...formState, relatedTo: value })}
              >
        <Option value="project1">โครงงานพิเศษ 1</Option>
        <Option value="project2">โครงงานพิเศษ 2</Option>
        {formState.relatedTo === 'project' && <Option value="project">โครงงาน (legacy)</Option>}
        <Option value="internship">ฝึกงาน</Option>
        <Option value="general">ทั่วไป</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Divider orientation="left" plain>การเผยแพร่</Divider>
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
        <Form.Item label="ขอบเขตการมองเห็น" tooltip="จำกัดผู้เห็นตามประเภท">
          <Select
            value={formState.visibilityScope}
            onChange={v => setFormState({ ...formState, visibilityScope: v })}
          >
            <Option value="ALL">ทั้งหมด</Option>
            <Option value="INTERNSHIP_ONLY">เฉพาะฝึกงาน</Option>
            <Option value="PROJECT_ONLY">เฉพาะโครงงาน</Option>
          </Select>
        </Form.Item>
        <Divider orientation="left" plain>วันที่ / ช่วงเวลา</Divider>
        <Alert type="info" showIcon style={{ marginBottom:12 }} message="เลือก 'วันที่เดี่ยว' หรือกำหนดแบบช่วงเวลา (ถ้าใส่แบบช่วงเวลา ระบบจะใช้วันสิ้นสุดเป็นวันสุดท้าย)" />
        <Row gutter={12}>
          <Col span={12}>
            <Form.Item label="วันที่ (หากไม่ใช้ช่วงเวลา)" required={!(formState.windowStartDate && formState.windowEndDate)}>
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
            <Divider orientation="left" plain>ตั้งค่าการส่งเอกสาร</Divider>
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
                  <Col span={24}>
                    <LateSubmissionDuration
                      gracePeriodMinutes={formState.gracePeriodMinutes}
                      setFormState={setFormState}
                      formState={formState}
                    />
                  </Col>
                <Col span={12}>
                  <Form.Item label="ล็อกหลังหมดเวลาล่าช้า?" tooltip="ถ้าเปิดจะไม่ให้ส่งหลังเลยเวลาล่าช้า">
                    <Switch
                      checked={formState.lockAfterDeadline}
                      onChange={v => setFormState({ ...formState, lockAfterDeadline: v })}
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}
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
