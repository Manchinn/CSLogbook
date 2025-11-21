// frontend/src/components/teacher/topicExam/TopicExamOverview.js
// ปรับให้แสดงเฉพาะ 4 คอลัมน์: ชื่อโครงงาน (TH), รหัสนักศึกษา, ชื่อเต็มนักศึกษา, Remark
// แต่ยังคงส่วนตัวกรองพื้นฐาน (search, status, readyOnly) เพื่อการใช้งานต่อไปได้ หากต้องการตัดออกค่อย refactor เพิ่มเติมภายหลัง
import React, { useMemo, useCallback } from 'react';
import { Table, Space, Input, Select, Card, Typography, Button, Tooltip } from 'antd';
import { ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
import { useTopicExamOverview } from 'hooks/useTopicExamOverview';
import { downloadTopicExamExport } from 'features/project/services/topicExamService';

const { Title, Text } = Typography;

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
};

export default function TopicExamOverview() {
  const { records, filters, updateFilters, loading, error, reload, meta } = useTopicExamOverview();

  // แปลง project-level -> member-level rows (flat)
  const flatRows = useMemo(() => {
    if (!records || !Array.isArray(records)) return [];
    const rows = [];
    for (const p of records) {
      if (!p.members || p.members.length === 0) continue; // ข้ามถ้าไม่มีสมาชิก
      const memberCount = p.members.length;
      const readyForExport = p.readiness?.readyForExport || false;
      
      p.members.forEach((m, idx) => {
        rows.push({
          key: `${p.projectId}_${m.studentId || m.studentCode}`,
          projectId: p.projectId,
          titleTh: p.titleTh,
          studentCode: m.studentCode,
          studentName: m.name,
          remark: m.remark || '',
          classroom: m.classroom || '',
          memberIndex: idx,
          memberCount,
          readyForExport
        });
      });
    }
    return rows;
  }, [records]);

  // คอลัมน์ใหม่ตาม requirement
  const columns = useMemo(() => [
    {
      title: 'ลำดับ',
      key: 'order',
      width: 70,
      align: 'center',
      onCell: (row) => ({
        rowSpan: row.memberIndex === 0 ? row.memberCount : 0
      }),
      render: (_, row, index) => {
        if (row.memberIndex !== 0) return null;
        // หาลำดับโครงงานจาก flatRows โดยนับเฉพาะแถวแรกของแต่ละโครงงาน
        const projectIndex = flatRows.filter((r, i) => i <= index && r.memberIndex === 0).length;
        return projectIndex;
      }
    },
    {
      title: 'หัวข้อโครงงาน',
      dataIndex: 'titleTh',
      key: 'titleTh',
      ellipsis: true,
      onCell: (row) => ({
        rowSpan: row.memberIndex === 0 ? row.memberCount : 0
      }),
      render: (text, row) => {
        const statusIcon = row.readyForExport ? 
          <Tooltip title="พร้อม Export"><span style={{ color: '#52c41a', marginRight: 8 }}>✓</span></Tooltip> : 
          <Tooltip title="ยังไม่พร้อม Export"><span style={{ color: '#ff4d4f', marginRight: 8 }}>✗</span></Tooltip>;
        return (
          <span>
            {row.memberIndex === 0 && statusIcon}
            {text}
          </span>
        );
      }
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
      width: 250,
      render: (text, row) => {
        const hasClassroom = row.classroom && ['RA', 'RB', 'RC', 'DA', 'DB', 'CSB'].includes(row.classroom);
        if (!hasClassroom) {
          return (
            <span style={{ color: '#ff4d4f' }}>
              ไม่มีข้อมูลห้องเรียน
            </span>
          );
        }
        // ห้อง CSB = โครงงานสองภาษา, ห้องอื่นๆ = โครงงานพิเศษ
        return row.classroom === 'CSB' ? 'โครงงานสองภาษา(CSB)' : 'โครงงานพิเศษ';
      }
    }
  ], [flatRows]);

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
      <Card title={<Space><Title level={4} style={{ margin:0 }}>รายชื่อหัวข้อโครงงานพิเศษ</Title></Space>} extra={<Space>
        <Tooltip title="รีเฟรช">
          <Button icon={<ReloadOutlined />} onClick={reload} loading={loading} />
        </Tooltip>
        <Tooltip title="Export XLSX (เฉพาะโครงงานที่มีข้อมูลครบถ้วน)">
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
            Export
          </Button>
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
          <Input.Search 
            placeholder="ค้นหา(หัวข้อโครงงานพิเศษ)" 
            allowClear 
            onSearch={val=>updateFilters({ search: val })} 
            onChange={e => { if (!e.target.value) updateFilters({ search: '' }); }}
            style={{ width: 240 }} 
          />
        </Space>

        {error && <div style={{ color: 'red', marginBottom: 12 }}>Error: {error}</div>}

        <div style={{ marginBottom: 12, padding: '12px', background: '#f0f7ff', borderRadius: '4px', border: '1px solid #91d5ff' }}>
          <Space direction="vertical" size={4}>
            <Text strong>📋 เกณฑ์การ Export:</Text>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              • โครงงานที่แสดง <span style={{ color: '#52c41a' }}>✓</span> มีข้อมูลครบถ้วน (หัวข้อ + รหัสนักศึกษา + ชื่อ-นามสกุล + ห้องเรียน) และพร้อมสำหรับการ Export
            </Text>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              • โครงงานที่แสดง <span style={{ color: '#ff4d4f' }}>✗</span> ยังขาดข้อมูลห้องเรียนของนักศึกษา ต้องเพิ่มข้อมูลก่อนจึงจะสามารถ Export ได้
            </Text>
            <Text type="secondary" style={{ fontSize: '13px' }}>
              • การกดปุ่ม <strong>Export</strong> จะส่งออกเฉพาะโครงงานที่พร้อมเท่านั้น
            </Text>
          </Space>
        </div>

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
