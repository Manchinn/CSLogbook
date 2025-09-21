// frontend/src/components/teacher/topicExam/TopicExamOverview.js
// ปรับให้แสดงเฉพาะ 4 คอลัมน์: ชื่อโครงงาน (TH), รหัสนักศึกษา, ชื่อเต็มนักศึกษา, Remark
// แต่ยังคงส่วนตัวกรองพื้นฐาน (search, status, readyOnly) เพื่อการใช้งานต่อไปได้ หากต้องการตัดออกค่อย refactor เพิ่มเติมภายหลัง
import React, { useMemo } from 'react';
import { Table, Space, Input, Select, Switch, Card, Typography, Button, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTopicExamOverview } from '../../../hooks/useTopicExamOverview';

// ฟังก์ชันสร้าง remark จากข้อมูลโครงงาน (สามารถปรับ rule ภายหลังได้)
function deriveRemark(project) {
  // กติกาเบื้องต้น: ใช้ track ก่อน ถ้าไม่มีใช้ projectType ถ้ายังไม่มีให้เว้นว่าง
  if (project.track) return project.track; // ex: bilingual, ds-track
  if (project.projectType) return project.projectType; // ex: research, dev
  return '';
}

export default function TopicExamOverview() {
  const { Title } = Typography;
  const { records, filters, updateFilters, loading, error, reload } = useTopicExamOverview();

  // แปลง project-level -> member-level rows (flat)
  const flatRows = useMemo(() => {
    if (!records || !Array.isArray(records)) return [];
    const rows = [];
    for (const p of records) {
      if (!p.members || p.members.length === 0) continue; // ข้ามถ้าไม่มีสมาชิก
      const remark = deriveRemark(p);
      const memberCount = p.members.length;
      p.members.forEach((m, idx) => {
        rows.push({
          key: `${p.projectId}_${m.studentId || m.studentCode}`,
          projectId: p.projectId,
          titleTh: p.titleTh,
          studentCode: m.studentCode,
          studentName: m.name,
          remark,
          memberIndex: idx,
          memberCount
        });
      });
    }
    return rows;
  }, [records]);

  // คอลัมน์ใหม่ตาม requirement
  const columns = useMemo(() => [
    {
      title: 'หัวข้อ',
      dataIndex: 'titleTh',
      key: 'titleTh',
      ellipsis: true,
      onCell: (row) => ({
        rowSpan: row.memberIndex === 0 ? row.memberCount : 0
      })
    },
    {
      title: 'รหัสนักศึกษา',
      dataIndex: 'studentCode',
      key: 'studentCode',
      width: 140,
      sorter: (a,b)=> (a.studentCode||'').localeCompare(b.studentCode||'')
    },
    {
      title: 'ชื่อ-นามสกุล',
      dataIndex: 'studentName',
      key: 'studentName',
      width: 220,
      sorter: (a,b)=> (a.studentName||'').localeCompare(b.studentName||'')
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'remark',
      key: 'remark',
      width: 140,
      onCell: (row) => ({
        rowSpan: row.memberIndex === 0 ? row.memberCount : 0
      })
    }
  ], []);

  return (
    <div style={{ padding: 24 }}>
      <Card title={<Space><Title level={4} style={{ margin:0 }}>Topic Exam Overview</Title></Space>} extra={<Space>
        <Tooltip title="Reload">
          <Button icon={<ReloadOutlined />} onClick={reload} loading={loading} />
        </Tooltip>
      </Space>}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input.Search placeholder="ค้นหา (code / title)" allowClear onSearch={val=>updateFilters({ search: val })} style={{ width: 240 }} />
          <Select value={filters.status} onChange={v=>updateFilters({ status: v })} style={{ width: 150 }} options={[
            { value: 'all', label: 'ทุกสถานะ' },
            { value: 'draft', label: 'draft' },
            { value: 'advisor_assigned', label: 'advisor_assigned' },
            { value: 'in_progress', label: 'in_progress' },
            { value: 'completed', label: 'completed' },
            { value: 'archived', label: 'archived' }
          ]} />
          <Space>
            <span style={{ fontSize: 12 }}>Ready Only</span>
            <Switch checked={filters.readyOnly} onChange={v=>updateFilters({ readyOnly: v })} />
          </Space>
        </Space>

        {error && <div style={{ color: 'red', marginBottom: 12 }}>Error: {error}</div>}

        <Table
          dataSource={flatRows}
          columns={columns}
          rowKey={r=>r.key}
          loading={loading}
          pagination={{ pageSize: 40, showTotal: t=>`${t} records` }}
          size="small"
        />
      </Card>
    </div>
  );
}
