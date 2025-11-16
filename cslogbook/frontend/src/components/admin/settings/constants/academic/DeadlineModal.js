import React, { useMemo } from 'react';
import { Modal, Form, Input, DatePicker, TimePicker, Select, Row, Col, Divider, Alert, Switch, InputNumber, Grid, Typography } from 'antd';
import buddhistLocale from '../../../../../utils/buddhistLocale'; // Import Buddhist Locale

const { Option } = Select;
const { Text } = Typography;

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
      bodyStyle={{ paddingTop: 12 }}
    >
      <Form layout="vertical" style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 4 }}>
        <Divider orientation="left" plain style={{ marginTop: 0 }}>ข้อมูลพื้นฐาน</Divider>
        
        {/* Template Selector */}
        {!editing && (
          <Form.Item 
            label="เลือก Template" 
            tooltip="เลือก template สำเร็จรูปเพื่อความสะดวก"
            extra={
              <>
                <div>ระบบจะช่วยกรอกข้อมูลให้อัตโนมัติ หรือข้ามเพื่อกรอกเอง</div>
                <div style={{ color: '#faad14', marginTop: 4 }}>
                  ⚠️ การฝึกงาน: มี กำหนดการเฉพาะ คพ.05 และ รายงานผล | หนังสือตอบรับไม่มี กำหนดการ
                </div>
              </>
            }
          >
            <Select
              value={formState.templateId || undefined}
              onChange={(templateId) => {
                const { getTemplateById } = require('./deadlineTemplates');
                const template = getTemplateById(templateId);
                if (template && !template.isCustom) {
                  setFormState({
                    ...formState,
                    templateId,
                    name: template.name,
                    relatedTo: template.relatedTo,
                    deadlineType: template.deadlineType,
                    mode: template.useWindowMode ? 'window' : 'single',
                    ...template.defaultSettings,
                    workflowType: template.workflowType,
                    documentSubtype: template.documentSubtype,
                    autoCreateMapping: template.autoCreateMapping
                  });
                } else if (template?.isCustom) {
                  setFormState({
                    ...formState,
                    templateId: null,
                    autoCreateMapping: false
                  });
                }
              }}
              placeholder="เลือก template (หรือข้ามเพื่อกำหนดเอง)"
              allowClear
              showSearch
              optionFilterProp="children"
              size="large"
            >
              {(() => {
                const { TEMPLATE_GROUPS } = require('./deadlineTemplates');
                return TEMPLATE_GROUPS.map(group => (
                  <Select.OptGroup key={group.key} label={group.label}>
                    {group.templates.map(tpl => (
                      <Option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                        {tpl.important && <span style={{ color: '#ff4d4f', marginLeft: 4 }}> (แนะนำ)</span>}
                      </Option>
                    ))}
                  </Select.OptGroup>
                ));
              })()}
            </Select>
            {formState.templateId && (() => {
              const { getTemplateById } = require('./deadlineTemplates');
              const template = getTemplateById(formState.templateId);
              return template?.description && (
                <Alert 
                  message={template.description} 
                  type="info" 
                  showIcon 
                  style={{ marginTop: 8 }}
                />
              );
            })()}
            {formState.autoCreateMapping && (
              <Alert
                message="ระบบจะเชื่อมโยงกับเอกสารอัตโนมัติ และติดตาม Late Tracking"
                type="success"
                showIcon
                style={{ marginTop: 8 }}
              />
            )}
          </Form.Item>
        )}
        
        <Form.Item label="ชื่อกำหนดการ" >
          <Input
            value={formState.name}
            onChange={e => setFormState({ ...formState, name: e.target.value })}
            placeholder="เช่น กรอกคำร้องขอฝึกงาน(คพ.05) / ส่งเอกสารการฝึกงานเพื่อรับใบรับรองการฝึกงาน / วันสอบโครงงานพิเศษ"
          />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item 
              label="ประเภท" 
              tooltip="กำหนดพฤติกรรมของกำหนดการ"
            >
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
            <Form.Item label="หมวดงาน">
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
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="เผยแพร่ทันที">
              <Switch
                checked={formState.isPublished}
                onChange={ck => setFormState({ ...formState, isPublished: ck })}
              />
            </Form.Item>
          </Col>
          <Col span={16}>
            <Form.Item 
              label="กำหนดเวลาเผยแพร่" 
              tooltip="นักศึกษาจะเห็นเมื่อถึงเวลาที่กำหนด"
            >
              <DatePicker
                showTime
                style={{ width:'100%' }}
                value={formState.publishAt}
                onChange={dt => setFormState({ ...formState, publishAt: dt })}
                locale={buddhistLocale}
                placement="bottomLeft"
                placeholder="ไม่ระบุ = เผยแพร่ทันทีเมื่อบันทึก"
              />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item label="ขอบเขต" tooltip="จำกัดผู้ที่เห็นกำหนดการนี้">
          <Select
            value={formState.visibilityScope}
            onChange={v => setFormState({ ...formState, visibilityScope: v })}
          >
            <Option value="ALL">ทั้งหมด</Option>
            <Option value="INTERNSHIP_ONLY">เฉพาะนักศึกษาฝึกงาน</Option>
            <Option value="PROJECT_ONLY">เฉพาะนักศึกษาโครงงาน</Option>
          </Select>
        </Form.Item>
        <Divider orientation="left" plain>วันที่และเวลา</Divider>
        <Alert 
          type="info" 
          showIcon 
          style={{ marginBottom: 16 }} 
          message="กำหนดวันที่เดียว หรือระบุช่วงเวลา (เลือกได้อย่างใดอย่างหนึ่ง)" 
        />
        <Row gutter={16}>
          <Col xs={24} sm={12}>
            <Form.Item 
              label="วันที่" 
              required={!(formState.windowStartDate && formState.windowEndDate)}
              extra={formState.windowStartDate || formState.windowEndDate ? "ปิดการใช้งานเพราะเลือกช่วงเวลาแล้ว" : null}
            >
              <DatePicker
                style={{ width: '100%' }}
                value={formState.date}
                onChange={date => {
                  // เมื่อเลือกวันที่เดียว ให้เคลียร์ช่วงเวลา
                  setFormState({ 
                    ...formState, 
                    date,
                    windowStartDate: null,
                    windowEndDate: null,
                    windowStartTime: null,
                    windowEndTime: null,
                    allDay: false
                  });
                }}
                locale={buddhistLocale}
                placeholder="เลือกวันที่"
                disabled={!!(formState.windowStartDate || formState.windowEndDate)}
                placement="bottomLeft"
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item 
              label="เวลา"
              extra={formState.windowStartDate || formState.windowEndDate ? "ปิดการใช้งานเพราะเลือกช่วงเวลาแล้ว" : null}
            >
              <TimePicker
                style={{ width: '100%' }}
                value={formState.time}
                onChange={time => setFormState({ ...formState, time })}
                format="HH:mm"
                placeholder="ไม่ระบุ = 23:59 น."
                disabled={!!(formState.windowStartDate || formState.windowEndDate)}
              />
            </Form.Item>
          </Col>
        </Row>
        <Text type="secondary" style={{ fontSize: '13px', display: 'block', marginBottom: 12, marginTop: 12 }}>
          หรือกำหนดแบบช่วงเวลา (ใช้สำหรับกิจกรรมที่มีหลายวัน)
        </Text>
        <Row gutter={16}>
          <Col xs={24} sm={10}>
            <Form.Item 
              label="วันเริ่ม"
              extra={formState.date ? "ปิดการใช้งานเพราะเลือกวันที่เดียวแล้ว" : null}
            >
              <DatePicker
                style={{ width:'100%' }}
                value={formState.windowStartDate}
                onChange={v => {
                  // เมื่อเลือกช่วงเวลา ให้เคลียร์วันที่เดียว
                  setFormState({ 
                    ...formState, 
                    windowStartDate: v,
                    date: null,
                    time: null
                  });
                }}
                locale={buddhistLocale}
                placeholder="เลือกวันเริ่ม"
                placement="bottomLeft"
                disabled={!!formState.date}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={10}>
            <Form.Item 
              label="วันสิ้นสุด"
              extra={formState.date ? "ปิดการใช้งานเพราะเลือกวันที่เดียวแล้ว" : null}
            >
              <DatePicker
                style={{ width:'100%' }}
                value={formState.windowEndDate}
                onChange={v => {
                  // เมื่อเลือกช่วงเวลา ให้เคลียร์วันที่เดียว
                  setFormState({ 
                    ...formState, 
                    windowEndDate: v,
                    date: null,
                    time: null
                  });
                }}
                locale={buddhistLocale}
                placeholder="เลือกวันสิ้นสุด"
                placement="bottomLeft"
                disabled={!!formState.date}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={4}>
            <Form.Item label="ทั้งวัน">
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
              <Col xs={24} sm={12}>
                <Form.Item label="เวลาเริ่ม">
                  <TimePicker
                    style={{ width:'100%' }}
                    value={formState.windowStartTime}
                    onChange={v => setFormState({ ...formState, windowStartTime: v })}
                    format="HH:mm"
                    placeholder="00:00"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="เวลาสิ้นสุด">
                  <TimePicker
                    style={{ width:'100%' }}
                    value={formState.windowEndTime}
                    onChange={v => setFormState({ ...formState, windowEndTime: v })}
                    format="HH:mm"
                    placeholder="23:59"
                  />
                </Form.Item>
              </Col>
            </>
          )}
        </Row>
        {formState.deadlineType === 'SUBMISSION' && (
          <>
            <Divider orientation="left" plain>การส่งเอกสาร</Divider>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item label="เปิดรับส่งเอกสาร">
                  <Switch
                    checked={formState.acceptingSubmissions}
                    onChange={v => setFormState({ ...formState, acceptingSubmissions: v })}
                    checkedChildren="เปิด"
                    unCheckedChildren="ปิด"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item label="อนุญาตส่งช้า">
                  <Switch
                    checked={formState.allowLate}
                    onChange={v => setFormState({ ...formState, allowLate: v })}
                    checkedChildren="อนุญาต"
                    unCheckedChildren="ไม่อนุญาต"
                  />
                </Form.Item>
              </Col>
            </Row>
            {formState.allowLate && (
              <>
                <LateSubmissionDuration
                  gracePeriodMinutes={formState.gracePeriodMinutes}
                  setFormState={setFormState}
                  formState={formState}
                />
                <Form.Item label="ล็อกหลังหมดเวลาผ่อนผัน" tooltip="ปิดการส่งหลังพ้นช่วงเวลาผ่อนผัน">
                  <Switch
                    checked={formState.lockAfterDeadline}
                    onChange={v => setFormState({ ...formState, lockAfterDeadline: v })}
                    checkedChildren="ล็อก"
                    unCheckedChildren="ไม่ล็อก"
                  />
                </Form.Item>
              </>
            )}
          </>
        )}
        {formState.deadlineType !== 'SUBMISSION' && (
          <Alert 
            type="info" 
            showIcon 
            style={{ marginTop: 8 }} 
            message="ประเภท 'ประกาศ' จะไม่เปิดรับการส่งเอกสาร" 
          />
        )}
        <Divider orientation="left" plain>ภาคเรียนและปีการศึกษา</Divider>
        <Row gutter={16}>
          <Col xs={24} sm={12}>
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
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="ปีการศึกษา (พ.ศ.)">
              <Input
                value={formState.academicYear}
                onChange={e => setFormState({ ...formState, academicYear: e.target.value })}
                placeholder="เช่น 2567"
              />
            </Form.Item>
          </Col>
        </Row>
        {error && <Alert type="error" message={error} />}
      </Form>
    </Modal>
  );
}
