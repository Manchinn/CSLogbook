import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Card, Typography, Button, Collapse, Spin, Row, Col, Tag, Alert, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import moment from 'moment';
import th_TH from 'antd/lib/locale/th_TH';
import * as importantDeadlineService from '../../../../../services/admin/importantDeadlineService';
import DeadlineModal from './DeadlineModal';

const { Title, Text } = Typography;

const BASE_FORM_TEMPLATE = {
  name: '',
  date: null,
  time: null,
  windowStartDate: null,
  windowStartTime: null,
  windowEndDate: null,
  windowEndTime: null,
  allDay: false,
  mode: 'single',
  relatedTo: 'general',
  semester: 1,
  academicYear: '',
  isGlobal: true,
  deadlineType: 'SUBMISSION',
  isPublished: false,
  publishAt: null,
  visibilityScope: 'ALL',
  acceptingSubmissions: true,
  allowLate: true,
  gracePeriodMinutes: 1440,
  lockAfterDeadline: false
};

const ImportantDeadlinesManager = ({
  academicYear,
  deadlines = [],
  loading = false,
  onReload
}, ref) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalError, setModalError] = useState('');
  const [formState, setFormState] = useState(BASE_FORM_TEMPLATE);
  const [saving, setSaving] = useState(false);

  // เตรียมค่าเริ่มต้นสำหรับการเพิ่มกำหนดการใหม่ (ผูกปีการศึกษาปัจจุบัน)
  const buildInitialForm = useCallback(
    (semester = 1) => ({
      ...BASE_FORM_TEMPLATE,
      semester,
      academicYear: academicYear || ''
    }),
    [academicYear]
  );

  const openAdd = useCallback(
    (semester = 1) => {
      setEditing(null);
      setFormState(buildInitialForm(semester));
      setModalError('');
      setModalVisible(true);
    },
    [buildInitialForm]
  );

  const openEdit = useCallback((deadline) => {
    if (!deadline) return;
    setEditing(deadline);
    const isWindow = !!(deadline.windowStartDate && deadline.windowEndDate);
    setFormState({
      name: deadline.name,
      date: deadline.deadlineDate ? moment(deadline.deadlineDate) : (deadline.date ? moment(deadline.date) : null),
      time: deadline.deadlineTime ? moment(deadline.deadlineTime, 'HH:mm:ss') : null,
      windowStartDate: deadline.windowStartDate ? moment(deadline.windowStartDate) : null,
      windowStartTime: deadline.windowStartTime ? moment(deadline.windowStartTime, 'HH:mm:ss') : null,
      windowEndDate: deadline.windowEndDate ? moment(deadline.windowEndDate) : null,
      windowEndTime: deadline.windowEndTime ? moment(deadline.windowEndTime, 'HH:mm:ss') : null,
      allDay: !!deadline.allDay,
      mode: isWindow ? 'window' : 'single',
      relatedTo: deadline.relatedTo,
      semester: deadline.semester,
      academicYear: deadline.academicYear,
      isGlobal: deadline.isGlobal,
      deadlineType: deadline.deadlineType || 'SUBMISSION',
      isPublished: deadline.isPublished || false,
      publishAt: deadline.publishAt ? moment(deadline.publishAt) : null,
      visibilityScope: deadline.visibilityScope || 'ALL',
      acceptingSubmissions: deadline.acceptingSubmissions !== undefined ? deadline.acceptingSubmissions : true,
      allowLate: deadline.allowLate !== undefined ? deadline.allowLate : true,
      gracePeriodMinutes: deadline.gracePeriodMinutes || 1440,
      lockAfterDeadline: deadline.lockAfterDeadline || false
    });
    setModalError('');
    setModalVisible(true);
  }, []);

  useImperativeHandle(ref, () => ({
    openAdd,
    openEdit
  }), [openAdd, openEdit]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setModalError('');
    try {
      // ป้องกันกรณี relatedTo หาย/เป็นค่าว่าง ให้ default เป็น 'general'
      const safeRelatedTo = formState.relatedTo || 'general';

      const payload = {
        name: formState.name,
        relatedTo: safeRelatedTo,
        semester: formState.semester,
        academicYear: formState.academicYear,
        isGlobal: formState.isGlobal,
        deadlineDate: formState.date ? formState.date.format('YYYY-MM-DD') : null,
        deadlineTime: formState.time ? formState.time.format('HH:mm:ss') : undefined,
        deadlineType: formState.deadlineType,
        isPublished: formState.isPublished,
        visibilityScope: formState.visibilityScope,
        acceptingSubmissions: formState.acceptingSubmissions,
        allowLate: formState.allowLate,
        gracePeriodMinutes: formState.gracePeriodMinutes,
        lockAfterDeadline: formState.lockAfterDeadline,
        // 🆕 Template metadata สำหรับ auto-create mapping
        templateId: formState.templateId || undefined,
        workflowType: formState.workflowType || undefined,
        documentSubtype: formState.documentSubtype || undefined,
        autoCreateMapping: formState.autoCreateMapping || false
      };

      if (formState.publishAt) {
        payload.publishAt = formState.publishAt.toISOString();
      }

      if (!payload.name) {
        throw new Error('กรุณากรอกชื่อ');
      }

      const hasWindowStart = !!formState.windowStartDate;
      const hasWindowEnd = !!formState.windowEndDate;
      const hasWindow = hasWindowStart && hasWindowEnd;

      if ((hasWindowStart && !hasWindowEnd) || (!hasWindowStart && hasWindowEnd)) {
        throw new Error('กรุณาเลือกทั้งวันเริ่มและวันสิ้นสุด หรือเว้นว่างทั้งคู่');
      }

      if (!hasWindow && !payload.deadlineDate) {
        throw new Error('กรุณาเลือกวันที่ หรือระบุช่วงเวลา');
      }

      if (hasWindow) {
        const startDateStr = formState.windowStartDate.format('YYYY-MM-DD');
        const endDateStr = formState.windowEndDate.format('YYYY-MM-DD');
        payload.windowStartDate = startDateStr;
        payload.windowEndDate = endDateStr;
        if (!formState.allDay) {
          if (formState.windowStartTime) payload.windowStartTime = formState.windowStartTime.format('HH:mm:ss');
          if (formState.windowEndTime) payload.windowEndTime = formState.windowEndTime.format('HH:mm:ss');
        }
        payload.allDay = formState.allDay;
        payload.deadlineDate = null;
        delete payload.deadlineTime;
        try {
          const startIso = `${startDateStr}T${(formState.windowStartTime ? formState.windowStartTime.format('HH:mm:ss') : '00:00:00')}+07:00`;
          const endIso = `${endDateStr}T${(formState.windowEndTime ? formState.windowEndTime.format('HH:mm:ss') : '23:59:59')}+07:00`;
          payload.windowStartAt = new Date(startIso).toISOString();
          payload.windowEndAt = new Date(endIso).toISOString();
        } catch (_) {
          // เพิกเฉยหากแปลงเวลาไม่ได้ เพื่อไม่ให้บล็อกการบันทึก
        }
      }

      if (!hasWindow && payload.deadlineDate && payload.deadlineTime) {
        try {
          const localIso = `${payload.deadlineDate}T${payload.deadlineTime}+07:00`;
          payload.deadlineAt = new Date(localIso).toISOString();
        } catch (_) {
          // เพิกเฉยหากแปลงเวลาไม่ได้
        }
      }

      // ถ้ามี id จริงค่อยถือว่าเป็นโหมดแก้ไข ไม่เช่นนั้นให้สร้างใหม่
      if (editing && editing.id) {
        await importantDeadlineService.updateDeadline(editing.id, payload);
      } else {
        await importantDeadlineService.createDeadline(payload);
      }

      setModalVisible(false);
      if (typeof onReload === 'function') {
        await onReload();
      }
    } catch (err) {
      setModalError(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }, [editing, formState, onReload]);

  const handleDelete = useCallback(
    (id) => {
      Modal.confirm({
        title: 'ยืนยันการลบกำหนดการ',
        content: 'คุณต้องการลบกำหนดการนี้ใช่หรือไม่?',
        okText: 'ลบ',
        okType: 'danger',
        cancelText: 'ยกเลิก',
        onOk: async () => {
          await importantDeadlineService.deleteDeadline(id);
          if (typeof onReload === 'function') {
            await onReload();
          }
        }
      });
    },
    [onReload]
  );

  const safeDeadlines = Array.isArray(deadlines) ? deadlines : [];

  return (
    <Card className="settings-card">
      <Title level={5}>ปฏิทินกำหนดการสำคัญประจำปีการศึกษา</Title>
      <Text type="secondary">
        ดูแลและปรับปรุงกำหนดการหลักสำหรับการส่งเอกสาร การสอบ และกิจกรรมที่ต้องแจ้งล่วงหน้าในแต่ละภาคเรียน
      </Text>
      <Collapse
        defaultActiveKey={["semester1"]}
        style={{ marginTop: 16 }}
        items={[1, 2, 3].map((sem) => ({
          key: `semester${sem}`,
          label: (
            <span>
              <CalendarOutlined style={{ marginRight: 8 }} />ภาคเรียนที่ {sem}
            </span>
          ),
          children: (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => openAdd(sem)} block>
                  เพิ่มกำหนดการสำหรับภาคเรียนนี้
                </Button>
              </div>
              {loading && <Spin />}
              {safeDeadlines
                .filter((deadline) => deadline.semester === sem)
                .map((deadline) => {
                  const typeLabelMap = {
                    SUBMISSION: { label: 'การส่งเอกสาร', color: 'blue' },
                    ANNOUNCEMENT: { label: 'ประกาศถึงผู้เกี่ยวข้อง', color: 'gold' },
                    MANUAL: { label: 'การดำเนินการภายใน', color: 'purple' },
                    MILESTONE: { label: 'เหตุการณ์สำคัญ', color: 'cyan' }
                  };
                  const typeInfo = typeLabelMap[deadline.deadlineType] || {
                    label: deadline.deadlineType,
                    color: 'default'
                  };
                  const effectiveDate = deadline.windowEndDate || deadline.deadlineDate || '-';
                  const effectiveTime = deadline.windowEndTime || deadline.deadlineTime || (deadline.allDay ? '' : '');
                  const hasWindowRange = deadline.windowStartDate && deadline.windowEndDate;
                  const windowRangeText = hasWindowRange
                    ? `${moment(deadline.windowStartDate).add(543, 'year').format('D MMM YYYY')} – ${moment(deadline.windowEndDate)
                        .add(543, 'year')
                        .format('D MMM YYYY')}`
                    : '';
                  const windowTimeText = hasWindowRange && !deadline.allDay
                    ? `${deadline.windowStartTime ? moment(deadline.windowStartTime, 'HH:mm:ss').format('HH:mm') : '00:00'} – ${deadline.windowEndTime ? moment(deadline.windowEndTime, 'HH:mm:ss').format('HH:mm') : '23:59'} น.`
                    : '';
                  const singleDateText = !hasWindowRange && deadline.deadlineDate
                    ? moment(deadline.deadlineDate).add(543, 'year').format('D MMMM YYYY')
                    : '-';
                  const singleTimeText = !hasWindowRange && deadline.deadlineTime
                    ? `${moment(deadline.deadlineTime, 'HH:mm:ss').format('HH:mm')} น.`
                    : '';
                  const finalDeadlineText = effectiveDate !== '-'
                    ? `${moment(effectiveDate).add(543, 'year').format('D MMM YYYY')}${effectiveTime ? ` ${moment(effectiveTime, 'HH:mm:ss').format('HH:mm')} น.` : deadline.allDay ? ' (ทั้งวัน)' : ''}`
                    : '-';
                  const graceHours = deadline.gracePeriodMinutes ? Math.round(deadline.gracePeriodMinutes / 60) : 0;
                  return (
                    <Card
                      key={deadline.id}
                      size="small"
                      style={{ marginBottom: 12 }}
                      title={
                        <span>
                          {deadline.name} <Tag color={typeInfo.color}>{typeInfo.label}</Tag>
                        </span>
                      }
                      extra={
                        <>
                          <Button type="link" onClick={() => openEdit(deadline)}>
                            แก้ไข
                          </Button>
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(deadline.id)}
                          />
                        </>
                      }
                    >
                      <Row gutter={16}>
                        <Col span={12}>
                          <Text strong>ช่วงเวลาหลัก:</Text>{' '}
                          {hasWindowRange ? windowRangeText : singleDateText}
                          {hasWindowRange && deadline.allDay && (
                            <Tag color="geekblue" style={{ marginLeft: 6 }}>
                              ทั้งวัน
                            </Tag>
                          )}
                          {windowTimeText && (
                            <Tag color="blue" style={{ marginLeft: 6 }}>
                              {windowTimeText}
                            </Tag>
                          )}
                          {!hasWindowRange && singleTimeText && (
                            <Tag color="blue" style={{ marginLeft: 6 }}>
                              {singleTimeText}
                            </Tag>
                          )}
                        </Col>
                        <Col span={6}>
                          <Text strong>หมวดงาน:</Text>{' '}
                          {deadline.relatedTo === 'project1'
                            ? 'โครงงาน 1'
                            : deadline.relatedTo === 'project2'
                            ? 'โครงงาน 2'
                            : deadline.relatedTo === 'project'
                            ? 'โครงงาน (เดิม)'
                            : deadline.relatedTo === 'internship'
                            ? 'ฝึกงาน'
                            : 'ทั่วไป'}
                        </Col>
                        <Col span={6}>
                          <Text strong>ปีการศึกษา:</Text>{' '}
                          {deadline.academicYear || '-'}
                        </Col>
                      </Row>
                      <Row gutter={16} style={{ marginTop: 6 }}>
                        <Col span={24}>
                          <Text strong>วันที่ครบกำหนดที่ระบบใช้เตือน:</Text>{' '}
                          {finalDeadlineText}
                        </Col>
                      </Row>
                      <Row gutter={16} style={{ marginTop: 8 }}>
                        <Col span={24}>
                          {/* แสดงสถานะตามประเภทของกำหนดการ */}
                          {deadline.deadlineType === 'SUBMISSION' ? (
                            <>
                              {/* สถานะการรับส่งเอกสาร */}
                              <Tag color={deadline.acceptingSubmissions ? 'green' : 'red'}>
                                {deadline.acceptingSubmissions ? 'เปิดรับส่งเอกสาร' : 'ปิดรับส่งเอกสาร'}
                              </Tag>
                              
                              {/* นโยบายการส่งช้า (Late Policy) */}
                              {deadline.allowLate ? (
                                <>
                                  <Tag color="orange">
                                    อนุญาตส่งช้า {graceHours > 0 ? `${graceHours} ชม.` : '(ไม่จำกัด)'}
                                  </Tag>
                                  <Tag color={deadline.lockAfterDeadline ? 'volcano' : 'gold'}>
                                    {deadline.lockAfterDeadline ? 'ล็อกหลังหมดเวลาผ่อนผัน' : 'ไม่ล็อกหลังหมดเวลา'}
                                  </Tag>
                                </>
                              ) : (
                                <Tag color="default">
                                  ไม่อนุญาตส่งช้า
                                </Tag>
                              )}
                              
                              {/* แสดง Late Tracking Badge */}
                              <Tag color="blue" style={{ borderStyle: 'dashed' }}>
                                Late Tracking: เปิดใช้งาน
                              </Tag>
                            </>
                          ) : (
                            /* กำหนดการประเภทอื่น (ANNOUNCEMENT, MILESTONE, etc.) */
                            <Tag color="geekblue">
                              {deadline.deadlineType === 'ANNOUNCEMENT' ? 'ประกาศ' : 
                               deadline.deadlineType === 'MILESTONE' ? 'เหตุการณ์สำคัญ' : 
                               deadline.deadlineType === 'MANUAL' ? 'ดำเนินการภายใน' : 
                               deadline.deadlineType}
                            </Tag>
                          )}
                        </Col>
                      </Row>
                      
                      {/* แสดงรายละเอียดเพิ่มเติมสำหรับการส่งเอกสาร */}
                      {deadline.deadlineType === 'SUBMISSION' && deadline.allowLate && graceHours > 0 && (
                        <Row gutter={16} style={{ marginTop: 8 }}>
                          <Col span={24}>
                            <Alert
                              type="info"
                              message={
                                <span style={{ fontSize: '12px' }}>
                                  นักศึกษาสามารถส่งได้ถึง{' '}
                                  <strong>
                                    {moment(effectiveDate)
                                      .add(deadline.gracePeriodMinutes || 0, 'minutes')
                                      .add(543, 'year')
                                      .format('D MMM YYYY HH:mm')} น.
                                  </strong>
                                  {' '}(หลังจาก deadline {graceHours} ชั่วโมง) - ระบบจะแท็กว่า "ส่งล่าช้า"
                                </span>
                              }
                              showIcon
                              banner
                              style={{ fontSize: '12px' }}
                            />
                          </Col>
                        </Row>
                      )}
                    </Card>
                  );
                })}
            </div>
          )
        }))}
      />
      <Alert
        message="สรุปกำหนดการที่กำลังจะมาถึง"
        description={
          <div>
            <Text>ระบบจะเตือนนักศึกษาล่วงหน้า 7 วันสำหรับกำหนดการที่ใกล้ถึงวันครบกำหนด</Text>
            <br />
            <Text type="secondary">ผู้ใช้งานสามารถตรวจสอบรายการทั้งหมดได้จากหน้าแดชบอร์ดหลัก</Text>
          </div>
        }
        type="info"
        showIcon
        style={{ marginTop: 16 }}
      />
      <DeadlineModal
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSave={handleSave}
        formState={formState}
        setFormState={setFormState}
        loading={saving}
        error={modalError}
        editing={!!editing}
        thLocale={th_TH}
      />
    </Card>
  );
};

export default forwardRef(ImportantDeadlinesManager);
