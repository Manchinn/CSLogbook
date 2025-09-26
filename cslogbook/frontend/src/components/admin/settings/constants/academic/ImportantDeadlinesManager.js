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
      const payload = {
        name: formState.name,
        relatedTo: formState.relatedTo,
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
        lockAfterDeadline: formState.lockAfterDeadline
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

      if (editing) {
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
      <Title level={5}>กำหนดการสำคัญในปีการศึกษา</Title>
      <Text type="secondary">
        จัดการวันที่สำคัญและ deadline ต่างๆ สำหรับการยื่นเอกสาร สอบ และกิจกรรมสำคัญในแต่ละภาคเรียน
      </Text>
      <Collapse
        defaultActiveKey={["semester1"]}
        style={{ marginTop: 16 }}
        items={[1, 2, 3].map((sem) => ({
          key: `semester${sem}`,
          label: (
            <span>
              <CalendarOutlined style={{ marginRight: 8 }} />กำหนดการภาคเรียนที่ {sem}
            </span>
          ),
          children: (
            <div>
              <div style={{ marginBottom: 16 }}>
                <Button type="dashed" icon={<PlusOutlined />} onClick={() => openAdd(sem)} block>
                  เพิ่มกำหนดการใหม่
                </Button>
              </div>
              {loading && <Spin />}
              {safeDeadlines
                .filter((deadline) => deadline.semester === sem)
                .map((deadline) => {
                  const typeLabelMap = {
                    SUBMISSION: { label: 'ส่งเอกสาร', color: 'blue' },
                    ANNOUNCEMENT: { label: 'ประกาศ', color: 'gold' },
                    MANUAL: { label: 'ทำรายการ', color: 'purple' },
                    MILESTONE: { label: 'เหตุการณ์', color: 'cyan' }
                  };
                  const typeInfo = typeLabelMap[deadline.deadlineType] || {
                    label: deadline.deadlineType,
                    color: 'default'
                  };
                  const effectiveDate = deadline.windowEndDate || deadline.deadlineDate || '-';
                  const effectiveTime = deadline.windowEndTime || deadline.deadlineTime || (deadline.allDay ? '' : '');
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
                        {deadline.windowStartDate && deadline.windowEndDate ? (
                          <Col span={12}>
                            <b>ช่วง:</b>{' '}
                            {moment(deadline.windowStartDate).add(543, 'year').format('D MMM YYYY')} -
                            {' '}
                            {moment(deadline.windowEndDate).add(543, 'year').format('D MMM YYYY')}{' '}
                            {deadline.allDay ? (
                              <Tag color="geekblue" style={{ marginLeft: 4 }}>
                                ทั้งวัน
                              </Tag>
                            ) : (
                              <Tag color="blue" style={{ marginLeft: 4 }}>
                                {(deadline.windowStartTime
                                  ? moment(deadline.windowStartTime, 'HH:mm:ss').format('HH:mm')
                                  : '00:00')} -
                                {(deadline.windowEndTime
                                  ? moment(deadline.windowEndTime, 'HH:mm:ss').format('HH:mm')
                                  : '23:59')}
                                {' '}
                                น.
                              </Tag>
                            )}
                          </Col>
                        ) : (
                          <Col span={12}>
                            <b>วันที่:</b>{' '}
                            {deadline.deadlineDate
                              ? moment(deadline.deadlineDate).add(543, 'year').format('D MMMM YYYY')
                              : '-'}
                            {deadline.deadlineTime
                              ? ` เวลา ${moment(deadline.deadlineTime, 'HH:mm:ss').format('HH:mm')} น.`
                              : ''}
                          </Col>
                        )}
                        <Col span={12}>
                          <b>หมวด:</b>{' '}
                          {deadline.relatedTo === 'project1'
                            ? 'โครงงาน 1'
                            : deadline.relatedTo === 'project2'
                            ? 'โครงงาน 2'
                            : deadline.relatedTo === 'project'
                            ? 'โครงงาน (legacy)'
                            : deadline.relatedTo === 'internship'
                            ? 'ฝึกงาน'
                            : 'ทั่วไป'}
                        </Col>
                      </Row>
                      <Row gutter={16} style={{ marginTop: 4 }}>
                        <Col span={24}>
                          <b>วันสุดท้าย:</b>{' '}
                          {effectiveDate !== '-'
                            ? `${moment(effectiveDate)
                                .add(543, 'year')
                                .format('D MMM YYYY')}${
                                effectiveTime
                                  ? ` ${moment(effectiveTime, 'HH:mm:ss').format('HH:mm')} น.`
                                  : ''
                              }`
                            : '-'}
                          <span style={{ marginLeft: 8 }}>
                            <Tag color={deadline.acceptingSubmissions ? 'green' : 'red'}>
                              {deadline.acceptingSubmissions ? 'เปิดรับ' : 'ปิดรับ'}
                            </Tag>
                            {deadline.deadlineType === 'SUBMISSION' && (
                              <>
                                <Tag color={deadline.allowLate ? 'orange' : 'default'}>
                                  {deadline.allowLate
                                    ? `อนุญาตส่งช้า${deadline.gracePeriodMinutes
                                        ? ` +${Math.round(deadline.gracePeriodMinutes / 60)}ชม.`
                                        : ''}`
                                    : 'ไม่อนุญาตส่งช้า'}
                                </Tag>
                                <Tag color={deadline.lockAfterDeadline ? 'purple' : 'default'}>
                                  {deadline.lockAfterDeadline ? 'ล็อกหลังหมดเวลา' : 'ไม่ล็อก'}
                                </Tag>
                              </>
                            )}
                          </span>
                        </Col>
                      </Row>
                      <Row gutter={16} style={{ marginTop: 4 }}>
                        <Col span={24}>
                          <b>ปีการศึกษา:</b> {deadline.academicYear}
                        </Col>
                      </Row>
                    </Card>
                  );
                })}
            </div>
          )
        }))}
      />
      <Alert
        message="กำหนดการที่ใกล้จะถึง"
        description={
          <div>
            <Text>ระบบจะแจ้งเตือนนักศึกษาเกี่ยวกับกำหนดการที่สำคัญล่วงหน้า 7 วัน</Text>
            <br />
            <Text type="secondary">สามารถดูกำหนดการทั้งหมดได้ในหน้าแดชบอร์ด</Text>
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
