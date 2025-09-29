// frontend/src/components/teacher/topicExam/TopicExamOverview.js
// ปรับให้แสดงเฉพาะ 4 คอลัมน์: ชื่อโครงงาน (TH), รหัสนักศึกษา, ชื่อเต็มนักศึกษา, Remark
// แต่ยังคงส่วนตัวกรองพื้นฐาน (search, status, readyOnly) เพื่อการใช้งานต่อไปได้ หากต้องการตัดออกค่อย refactor เพิ่มเติมภายหลัง
import React, { useMemo, useCallback } from 'react';
import { Table, Space, Input, Select, Switch, Card, Typography, Button, Tooltip } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTopicExamOverview } from '../../../hooks/useTopicExamOverview';
import { downloadTopicExamExport } from '../../../services/topicExamService';

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

// ฟังก์ชันสร้าง remark = ประเภท "โครงการพิเศษ" (ภาคปกติ vs โครงการสองภาษา CSB)
// Assumption: ถ้า track มีคำว่า 'bilingual' หรือ 'csb' (ไม่สนตัวพิมพ์) ถือเป็นโครงการสองภาษา (CSB) มิฉะนั้นเป็นภาคปกติ
function deriveRemark(project) {
  const t = (project.track || '').toLowerCase();
  if (t.includes('bilingual') || t.includes('csb')) {
    return 'โครงการสองภาษา (CSB)';
  }
  return 'โครงงานภาคปกติ';
}

export default function TopicExamOverview() {
  const { Title } = Typography;
  const { records, filters, updateFilters, loading, error, reload, meta } = useTopicExamOverview();

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

  const academicYearOptions = useMemo(() => {
    const years = meta?.availableAcademicYears || [];
    return years.map((year) => ({ label: `${year}`, value: year }));
  }, [meta?.availableAcademicYears]);

  const semesterOptions = useMemo(() => {
    if (!filters.academicYear) return [];
    const mapping = meta?.availableSemestersByYear || {};
    const semesters = mapping[filters.academicYear] || [];
    return semesters.map((sem) => ({ label: `ภาคเรียนที่ ${sem}`, value: sem }));
  }, [filters.academicYear, meta?.availableSemestersByYear]);

  const handleAcademicYearChange = useCallback((value) => {
    updateFilters({ academicYear: value ?? null, semester: null });
  }, [updateFilters]);

  const handleSemesterChange = useCallback((value) => {
    updateFilters({ semester: value ?? null });
  }, [updateFilters]);

  // ฟังก์ชันดาวน์โหลดไฟล์ export (XLSX only)
  const handleExport = async () => {
    try {
      const res = await downloadTopicExamExport({ ...filters, format: 'xlsx' });
      const blob = res.data;
      let filename = 'topic_exam_overview.xlsx';
      const dispo = res.headers && (res.headers['content-disposition'] || res.headers['Content-Disposition']);
      if (dispo) {
        const match = /filename=([^;]+)/i.exec(dispo);
        if (match && match[1]) filename = match[1].replace(/"/g,'');
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export ล้มเหลว: ' + (e.message || 'unknown'));
    }
  };

  return (
    <div style={containerStyle}>
      <Card title={<Space><Title level={4} style={{ margin:0 }}>Topic Exam Overview</Title></Space>} extra={<Space>
        <Tooltip title="Reload">
          <Button icon={<ReloadOutlined />} onClick={reload} loading={loading} />
        </Tooltip>
        <Tooltip title="Export XLSX">
          <Button icon={<DownloadOutlined />} onClick={handleExport} />
        </Tooltip>
      </Space>}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="เลือกปีการศึกษา"
            allowClear
            value={filters.academicYear}
            onChange={handleAcademicYearChange}
            style={{ width: 160 }}
            options={academicYearOptions}
          />
          <Select
            placeholder="เลือกภาคเรียน"
            allowClear
            disabled={!filters.academicYear || !semesterOptions.length}
            value={filters.semester}
            onChange={handleSemesterChange}
            style={{ width: 150 }}
            options={semesterOptions}
          />
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
            <Tooltip title="Ready = หัวข้อที่กรอกชื่อ (ไทย/อังกฤษ) ครบ ไม่บังคับอาจารย์ที่ปรึกษาในขั้นนี้">
              <span style={{ fontSize: 12 }}>เฉพาะหัวข้อพร้อม</span>
            </Tooltip>
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
