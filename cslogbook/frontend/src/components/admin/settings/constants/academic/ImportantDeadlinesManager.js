import React, { useState } from 'react';
import { Card, Typography, Button, Collapse, Spin, Row, Col, Tag, Alert, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, CalendarOutlined } from '@ant-design/icons';
import moment from 'moment';
import th_TH from 'antd/lib/locale/th_TH';
import useImportantDeadlines from '../../../../../hooks/admin/useImportantDeadlines';
import * as importantDeadlineService from '../../../../../services/admin/importantDeadlineService';
import DeadlineModal from './DeadlineModal';

const { Title, Text } = Typography;

// คอมโพเนนต์จัดการกำหนดการสำคัญ แยกออกเพื่อให้ไฟล์หลักเล็กลง
export default function ImportantDeadlinesManager({ academicYear }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [modalError, setModalError] = useState('');
  const initialForm = {
    name: '',
    date: null,           // วันเดียว (optional หากใช้ช่วงเวลา)
    time: null,           // เวลาของวันเดียว
    windowStartDate: null,
    windowStartTime: null,
    windowEndDate: null,
    windowEndTime: null,
    allDay: false,
    relatedTo: 'general',
    semester: 1,
    academicYear: academicYear || '',
  isGlobal: true,
  // ฟิลด์ใหม่
  deadlineType: 'SUBMISSION',
  isPublished: false,
  publishAt: null,
  visibilityScope: 'ALL',
  acceptingSubmissions: true,
  allowLate: true,
  gracePeriodMinutes: 1440,
  lockAfterDeadline: false
  };
  const [formState, setFormState] = useState(initialForm);
  const [saving, setSaving] = useState(false);

  const { deadlines, loading: deadlinesLoading, fetchDeadlines } = useImportantDeadlines({ academicYear, semester: null });

  const openAdd = (semester) => {
    setEditing(null);
  setFormState({ ...initialForm, semester, academicYear: academicYear || '' });
    setModalError('');
    setModalVisible(true);
  };
  const openEdit = (d) => {
    setEditing(d);
    setFormState({
      name: d.name,
      date: d.deadlineDate ? moment(d.deadlineDate) : (d.date ? moment(d.date) : null),
      time: d.deadlineTime ? moment(d.deadlineTime, 'HH:mm:ss') : null,
      windowStartDate: d.windowStartDate ? moment(d.windowStartDate) : null,
      windowStartTime: d.windowStartTime ? moment(d.windowStartTime, 'HH:mm:ss') : null,
      windowEndDate: d.windowEndDate ? moment(d.windowEndDate) : null,
      windowEndTime: d.windowEndTime ? moment(d.windowEndTime, 'HH:mm:ss') : null,
      allDay: !!d.allDay,
      relatedTo: d.relatedTo,
      semester: d.semester,
      academicYear: d.academicYear,
  isGlobal: d.isGlobal,
  deadlineType: d.deadlineType || 'SUBMISSION',
  isPublished: d.isPublished || false,
  publishAt: d.publishAt ? moment(d.publishAt) : null,
  visibilityScope: d.visibilityScope || 'ALL',
  acceptingSubmissions: d.acceptingSubmissions !== undefined ? d.acceptingSubmissions : true,
  allowLate: d.allowLate !== undefined ? d.allowLate : true,
  gracePeriodMinutes: d.gracePeriodMinutes || 1440,
  lockAfterDeadline: d.lockAfterDeadline || false
    });
    setModalError('');
    setModalVisible(true);
  };

  const handleSave = async () => {
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
        deadlineTime: formState.time ? formState.time.format('HH:mm:ss') : undefined
      };
  // เพิ่มฟิลด์ใหม่
  payload.deadlineType = formState.deadlineType;
  payload.isPublished = formState.isPublished;
  if (formState.publishAt) payload.publishAt = formState.publishAt.toISOString();
  payload.visibilityScope = formState.visibilityScope;
  payload.acceptingSubmissions = formState.acceptingSubmissions;
  payload.allowLate = formState.allowLate;
  payload.gracePeriodMinutes = formState.gracePeriodMinutes;
  payload.lockAfterDeadline = formState.lockAfterDeadline;
      if (!payload.name) throw new Error('กรุณากรอกชื่อ');

      const hasWindowStart = !!formState.windowStartDate;
      const hasWindowEnd = !!formState.windowEndDate;
      const hasWindow = hasWindowStart && hasWindowEnd;

      // ถ้าใส่เพียงข้างเดียว ให้แจ้งเตือนผู้ใช้
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
        // กรณีมีช่วงเวลาให้ใช้ window เท่านั้น ไม่ต้อง single
        payload.deadlineDate = null;
        delete payload.deadlineTime;
      }
      if (editing) await importantDeadlineService.updateDeadline(editing.id, payload);
      else await importantDeadlineService.createDeadline(payload);
      setModalVisible(false);
      fetchDeadlines();
    } catch (err) {
      setModalError(err.message || 'บันทึกไม่สำเร็จ');
    }
    setSaving(false);
  };

  const handleDelete = (id) => {
    Modal.confirm({
      title: 'ยืนยันการลบกำหนดการ',
      content: 'คุณต้องการลบกำหนดการนี้ใช่หรือไม่?',
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        await importantDeadlineService.deleteDeadline(id);
        fetchDeadlines();
      }
    });
  };

  return (
    <Card className="settings-card">
      <Title level={5}>กำหนดการสำคัญในปีการศึกษา</Title>
      <Text type="secondary">จัดการวันที่สำคัญและ deadline ต่างๆ สำหรับการยื่นเอกสาร สอบ และกิจกรรมสำคัญในแต่ละภาคเรียน</Text>
      <Collapse
        defaultActiveKey={['semester1']}
        style={{ marginTop: 16 }}
        items={[1,2,3].map(sem => ({
          key: `semester${sem}`,
            label: (<span><CalendarOutlined style={{ marginRight:8 }} />กำหนดการภาคเรียนที่ {sem}</span>),
            children: (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => openAdd(sem)} block>เพิ่มกำหนดการใหม่</Button>
                </div>
                {deadlinesLoading && <Spin />}
                {deadlines.filter(d => d.semester === sem).map(d => {
                  const typeLabelMap = {
                    SUBMISSION: { label: 'ส่งเอกสาร', color: 'blue' },
                    ANNOUNCEMENT: { label: 'ประกาศ', color: 'gold' },
                    MANUAL: { label: 'ทำรายการ', color: 'purple' },
                    MILESTONE: { label: 'เหตุการณ์', color: 'cyan' }
                  };
                  const tInfo = typeLabelMap[d.deadlineType] || { label: d.deadlineType, color: 'default' };
                  return (
                  <Card
                    key={d.id}
                    size="small"
                    style={{ marginBottom: 12 }}
                    title={<span>{d.name} <Tag color={tInfo.color}>{tInfo.label}</Tag></span>}
                    extra={<><Button type="link" onClick={() => openEdit(d)}>แก้ไข</Button><Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(d.id)} /></>}
                  >
                    <Row gutter={16}>
                      {d.windowStartDate && d.windowEndDate ? (
                        <Col span={12}>
                          <b>ช่วง:</b>{' '}
                          {moment(d.windowStartDate).add(543,'year').format('D MMM YYYY')} - {moment(d.windowEndDate).add(543,'year').format('D MMM YYYY')}{' '}
                          {d.allDay ? (
                            <Tag color="geekblue" style={{ marginLeft:4 }}>ทั้งวัน</Tag>
                          ) : (
                            <Tag color="blue" style={{ marginLeft:4 }}>
                              {(d.windowStartTime ? moment(d.windowStartTime,'HH:mm:ss').format('HH:mm') : '00:00')} - {(d.windowEndTime ? moment(d.windowEndTime,'HH:mm:ss').format('HH:mm') : '23:59')} น.
                            </Tag>
                          )}
                        </Col>
                      ) : (
                        <Col span={12}>
                          <b>วันที่:</b>{' '}
                          {d.deadlineDate ? moment(d.deadlineDate).add(543,'year').format('D MMMM YYYY') : '-'}
                          {d.deadlineTime ? ` เวลา ${moment(d.deadlineTime,'HH:mm:ss').format('HH:mm')} น.` : ''}
                        </Col>
                      )}
                      <Col span={12}><b>หมวด:</b> {(
                        d.relatedTo === 'project1' ? 'โครงงาน 1' :
                        d.relatedTo === 'project2' ? 'โครงงาน 2' :
                        d.relatedTo === 'project' ? 'โครงงาน (legacy)' :
                        d.relatedTo === 'internship' ? 'ฝึกงาน' : 'ทั่วไป'
                      )}</Col>
                    </Row>
                    <Row gutter={16} style={{ marginTop:4 }}>
                      <Col span={24}><b>ปีการศึกษา:</b> {d.academicYear}</Col>
                    </Row>
                  </Card>);
                })}
              </div>
            )
        }))}
      />
      <Alert
        message="กำหนดการที่ใกล้จะถึง"
        description={<div><Text>ระบบจะแจ้งเตือนนักศึกษาเกี่ยวกับกำหนดการที่สำคัญล่วงหน้า 7 วัน</Text><br /><Text type="secondary">สามารถดูกำหนดการทั้งหมดได้ในหน้าแดชบอร์ด</Text></div>}
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
}
