import React, { useEffect, useState, useMemo } from 'react';
import { Table, Typography, Tag, Space, Alert, Spin, Button } from 'antd';
import importantDeadlineStudentService from '../../../../services/student/importantDeadlineStudentService';

// หน้าจอ: สอบหัวข้อ (ดึงจาก important_deadlines ที่เกี่ยวกับ project1 / project และตีความว่าเป็นช่วง "สอบเสนอหัวข้อ")
// หมายเหตุ: ตอนนี้ยังไม่มี flag เฉพาะ จึงใช้ heuristic จากชื่อ / deadlineType / relatedTo

const classifyTopicExam = (d) => {
  const name = (d.name || '').toLowerCase();
  // ชื่อที่มีคำว่า 'สอบหัวข้อ' หรือ 'สอบเสนอ' หรือ 'topic exam' ถือว่าเกี่ยวข้อง
  if (name.includes('สอบหัวข้อ') || name.includes('สอบเสนอ') || name.includes('topic exam')) return true;
  // เผื่อกรณีในอนาคตใช้ deadlineType=MILESTONE + relatedTo=project1
  if (d.relatedTo && ['project','project1'].includes(d.relatedTo) && d.deadlineType === 'MILESTONE' && name.includes('สอบ')) return true;
  return false;
};

const columns = [
  {
    title: 'ชื่อกำหนดการ',
    dataIndex: 'name',
    key: 'name',
    render: (text, record) => (
      <Space direction="vertical" size={0} style={{ width: '100%' }}>
        <span style={{ fontWeight: 500 }}>{text}</span>
        <span style={{ fontSize: 12, color: '#666' }}>{record.description || '-'}</span>
      </Space>
    )
  },
  {
    title: 'รูปแบบ',
    key: 'form',
    render: (_, r) => r.isWindow ? <Tag color="geekblue">ช่วงเวลา</Tag> : <Tag color="blue">เดี่ยว</Tag>
  },
  {
    title: 'ช่วง/Deadline',
    key: 'time',
    render: (_, r) => {
      if (r.isWindow) {
        return (
          <div style={{ fontSize: 12 }}>
            <div>เริ่ม: {r.windowStartDate} {r.windowStartTime}</div>
            <div>สิ้นสุด: {r.windowEndDate} {r.windowEndTime}</div>
          </div>
        );
      }
      return <span>{r.deadlineDate} {r.deadlineTime}</span>;
    }
  },
  {
    title: 'สถานะ',
    key: 'status',
    render: (_, r) => {
      // ใช้ status / daysLeft ที่ backend enrich
      const tags = [];
      if (r.status) {
        const colorMap = { UPCOMING: 'green', OPEN: 'blue', CLOSED: 'red', PAST: 'default' };
        tags.push(<Tag color={colorMap[r.status] || 'default'} key="st">{r.status}</Tag>);
      }
      if (typeof r.daysLeft === 'number') {
        tags.push(<Tag key="dl" color="purple">เหลือ {r.daysLeft} วัน</Tag>);
      }
      if (r.submission?.submitted) {
        tags.push(<Tag key="sub" color={r.submission.late ? 'gold' : 'cyan'}>{r.submission.late ? 'ส่งช้า' : 'มีการส่ง'}</Tag>);
      }
      return <Space size={4}>{tags}</Space>;
    }
  },
  {
    title: 'การดำเนินการ',
    key: 'actions',
    render: (_, r) => (
      <Space>
        <Button size="small" disabled>จองเวลา (เร็วๆนี้)</Button>
        <Button size="small" disabled>บันทึกผล (เร็วๆนี้)</Button>
      </Space>
    )
  }
];

const TopicExamPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterYear] = useState(undefined); // เผื่อ UI เลือกปีอนาคต

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const res = await importantDeadlineStudentService.getStudentDeadlines(filterYear ? { academicYear: filterYear } : undefined);
        const list = res?.data?.data || res?.data?.deadlines || []; // รองรับโครงสร้าง response
        if (!mounted) return;
        setData(list);
      } catch (e) {
        if (!mounted) return;
        setError(e.message || 'โหลดกำหนดการไม่สำเร็จ');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [filterYear]);

  const topicExamDeadlines = useMemo(() => {
    return data.filter(d => d && classifyTopicExam(d));
  }, [data]);

  return (
    <div style={{ padding: 8 }}>
      <Typography.Title level={4} style={{ marginTop: 0 }}>ตารางสอบเสนอหัวข้อ</Typography.Title>
      <Typography.Paragraph style={{ marginTop: -4 }} type="secondary">
        แสดงจาก Important Deadlines ที่เข้าข่ายเกี่ยวกับ "สอบเสนอหัวข้อ" (heuristic ชั่วคราว)
      </Typography.Paragraph>
      {error && <Alert type="error" showIcon message={error} style={{ marginBottom: 16 }} />}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>
      ) : topicExamDeadlines.length === 0 ? (
        <Alert type="info" showIcon message="ยังไม่มีกำหนดการสอบเสนอหัวข้อในระบบ" />
      ) : (
        <Table
          size="small"
            rowKey={r => r.id}
          columns={columns}
          dataSource={topicExamDeadlines}
          pagination={{ pageSize: 8 }}
        />
      )}
    </div>
  );
};

export default TopicExamPage;
