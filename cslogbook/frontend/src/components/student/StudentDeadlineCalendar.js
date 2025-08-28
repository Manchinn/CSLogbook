import React, { useMemo, useState } from 'react';
import { Calendar, Badge, Select, Spin, Tooltip, Divider, Tag, Card, Typography, Space, Button } from 'antd';
import useAllDeadlines from '../../hooks/useAllDeadlines';
import dayjs from '../../utils/dayjs';
import DeadlineBadge from '../deadlines/DeadlineBadge';
import { computeDeadlineStatus } from '../../utils/deadlineUtils';

export default function StudentDeadlineCalendar() {
  const currentYear = dayjs().year();
  const [academicYear, setAcademicYear] = useState(currentYear);
  const { deadlines, loading } = useAllDeadlines({ academicYear });

  // แบ่งกลุ่มตามระบบ
  const grouped = useMemo(() => {
    const g = { internship: [], project: [], general: [] };
    deadlines.forEach(d => {
      if (d.relatedTo === 'internship') g.internship.push(d);
      else if (d.relatedTo === 'project') g.project.push(d);
      else g.general.push(d);
    });
    return g;
  }, [deadlines]);

  const dateMap = useMemo(() => {
    const map = {};
    deadlines.forEach(d => {
      // ขยายกรณีช่วง (window) ครอบทุกวันในช่วง
      if (d.isWindow && d.windowStartDate && d.windowEndDate) {
        const start = dayjs(`${d.windowStartDate} 00:00:00`);
        const end = dayjs(`${d.windowEndDate} 23:59:59`);
        for (let cur = start; cur.isBefore(end) || cur.isSame(end,'day'); cur = cur.add(1,'day')) {
          const key = cur.format('YYYY-MM-DD');
          if (!map[key]) map[key] = [];
          map[key].push({ ...d, _rangePart: true });
        }
      } else if (d.deadlineDate) {
        if (!map[d.deadlineDate]) map[d.deadlineDate] = [];
        map[d.deadlineDate].push(d);
      }
    });
    return map;
  }, [deadlines]);

  function dateCellRender(value) {
    const dateKey = value.format('YYYY-MM-DD');
    const items = dateMap[dateKey] || [];
    if (!items.length) return null;
    // จัดเรียง: window ก่อน ตามเวลา/ชื่อ
    const sorted = [...items].sort((a,b)=>{
      if (a.isWindow && !b.isWindow) return -1;
      if (!a.isWindow && b.isWindow) return 1;
      const ta = a.deadlineTime || a.windowStartTime || '23:59:59';
      const tb = b.deadlineTime || b.windowStartTime || '23:59:59';
      return ta.localeCompare(tb);
    });
    return sorted.slice(0,4).map(item => {
      const local = item.deadlineDate && item.deadlineTime ? dayjs(`${item.deadlineDate} ${item.deadlineTime}`) : null;
      const st = computeDeadlineStatus(local, null, { isSubmitted:item.isSubmitted, isLate:item.isLate });
      const colorMap = { pending:'blue', dueSoon:'gold', overdue:'red', submitted:'green', late:'orange' };
      const dotStatus = st.code === 'overdue' ? 'error' : (st.code === 'dueSoon' ? 'warning' : 'processing');
      const label = item.isWindow ? (item.allDay ? `${item.name || item.title} (ช่วง)` : `${item.name || item.title} (ช่วงเวลา)`) : (item.name || item.title);
      return (
        <div key={item.id} style={{ marginBottom:2 }}>
          <Tooltip title={item.isWindow ? `${item.name || item.title} · ${item.windowStartDate} → ${item.windowEndDate}${item.allDay?' (ทั้งวัน)':''}` : `${item.name || item.title} · ${local?local.format('D MMM BBBB เวลา HH:mm น.'):''} · ${st.label}`}>
            <Badge color={colorMap[st.code] || 'blue'} status={dotStatus} text={label} />
          </Tooltip>
        </div>
      );
    });
    // ถ้าเกิน 4 รายการ สามารถเพิ่ม indicator เพิ่มเติมในอนาคต
  }

  const headerRender = ({ value, onChange }) => {
    const current = value.clone();
    const year = current.year();
    const month = current.month();
    const months = Array.from({ length: 12 }, (_, i) => dayjs().month(i).format('MMM'));
    return (
      <div style={{ padding:8, display:'flex', gap:12, alignItems:'center' }}>
        <Select size="small" value={month} onChange={m => { const newVal = value.clone().month(m); onChange(newVal); }} style={{ width:100 }}>
          {months.map((mLabel, idx) => <Select.Option key={idx} value={idx}>{mLabel}</Select.Option>)}
        </Select>
        <Select size="small" value={year} onChange={y => { const newVal = value.clone().year(y); onChange(newVal); }} style={{ width:110 }}>
          {[year-1, year, year+1].map(y => <Select.Option key={y} value={y}>{y+543}</Select.Option>)}
        </Select>
        <div style={{ marginLeft:'auto', fontWeight:600 }}>{current.format('MMMM')} {year+543}</div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Card style={{ paddingTop: 16 }}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>📅 ปฏิทินกำหนดส่ง</Typography.Title>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            value={academicYear}
            onChange={setAcademicYear}
            style={{ width: 140 }}
            options={generateYearOptions(academicYear)}
          />
          <Button onClick={() => setAcademicYear(academicYear)} disabled={loading} loading={loading}>
            รีเฟรช
          </Button>
        </Space>
        {loading ? <Spin /> : <Calendar dateCellRender={dateCellRender} headerRender={headerRender} />}
        <Divider />
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
          <Tag color="blue">รอ (ปกติ)</Tag>
          <Tag color="gold">ใกล้ถึงกำหนด (&lt;24ชม.)</Tag>
          <Tag color="red">เกินกำหนด</Tag>
          <Tag color="green">ส่งแล้ว</Tag>
          <Tag color="orange">ส่งช้า</Tag>
        </div>
        <Typography.Title level={5} style={{ marginTop: 0 }}>รายละเอียด (จำแนกตามระบบ)</Typography.Title>
        {['internship','project','general'].map(section => {
          const list = grouped[section];
          if (!list || !list.length) return null;
          const labelMap = { internship: 'ระบบฝึกงาน', project: 'ระบบโครงงานพิเศษ', general: 'ทั่วไป / ภาพรวม' };
          return (
            <div key={section} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, margin: '4px 0 8px' }}>{labelMap[section]} ({list.length})</div>
              {list.map(d => (
                <div key={d.id} style={{ borderBottom:'1px solid #eee', padding:'8px 6px', display:'flex', flexDirection:'column', gap:4 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <strong>{d.name || d.title}{d.isWindow ? (d.allDay ? ' (ช่วงทั้งวัน)' : ' (ช่วงเวลา)') : ''}</strong>
                    <DeadlineBadge deadline={d.deadline_at_local} isSubmitted={d.isSubmitted} isLate={d.isLate} submittedAt={d.submittedAtLocal} />
                  </div>
                  <div style={{ fontSize:12, opacity:0.8 }}>
                    {d.isWindow ? (
                      <>
                        ช่วง: {dayjs(d.windowStartDate).format('D MMM BBBB')} - {dayjs(d.windowEndDate).format('D MMM BBBB')} {d.allDay ? '(ทั้งวัน)' : ''}
                      </>
                    ) : (
                      d.deadline_th || (d.deadline_at_local ? d.deadline_at_local.format('D MMM BBBB เวลา HH:mm น.') : '—')
                    )}
                  </div>
                  {d.description && <div style={{ fontSize:12 }}>{d.description}</div>}
                </div>
              ))}
            </div>
          );
        })}
      </Card>
    </div>
  );
}

function generateYearOptions(currentYear) {
  const years = [];
  for (let y = currentYear + 1; y >= currentYear - 5; y--) {
    years.push({ value: y, label: String(y + 543) });
  }
  return years;
}
