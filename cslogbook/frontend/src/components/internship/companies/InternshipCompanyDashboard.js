import React, { useState } from 'react';
import { Card, Select, Space, Button, Typography } from 'antd';
import { useAuth } from '../../../contexts/AuthContext';
import useCompanyInternshipStats from '../../../hooks/useCompanyInternshipStats';
import CompanyInternshipStatsTable from './CompanyInternshipStatsTable';

// Dashboard หลักสำหรับ staff / student (ปรับตาม role ภายนอก)
const InternshipCompanyDashboard = ({ defaultAcademicYear, defaultSemester, limit, role }) => {
  // ถ้าไม่ได้ส่ง role เข้ามา ใช้จาก AuthContext
  const { userData } = useAuth();
  const effectiveRole = role || userData?.role;
  const [academicYear, setAcademicYear] = useState(defaultAcademicYear || undefined);
  const [semester, setSemester] = useState(defaultSemester || undefined);

  // ปรับ limit ตามบทบาท หากไม่ได้ส่งมา
  const effectiveLimit = limit || (effectiveRole === 'student' ? 10 : 50);
  const { data, loading, error, reload, fetchCompanyDetail } = useCompanyInternshipStats({ academicYear, semester, limit: effectiveLimit });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
      <Card style={{ marginBottom: 24, paddingTop: 16 }} >
        <Typography.Title level={4} style={{ marginTop: 0 }}>🏢 สถานประกอบการฝึกงาน</Typography.Title>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="ปีการศึกษา"
            style={{ width: 140 }}
            value={academicYear}
            onChange={(v) => setAcademicYear(v)}
            options={generateYearOptions()}
          />
          <Select
            allowClear
            placeholder="ภาคเรียน"
            style={{ width: 120 }}
            value={semester}
            onChange={(v) => setSemester(v)}
            options={[{ value: 1, label: '1' }, { value: 2, label: '2' }, { value: 3, label: '3' }]}
          />
          <Button onClick={reload} type="primary" loading={loading}>รีเฟรช</Button>
        </Space>
        {error && <Typography.Text type="danger" style={{ display: 'block', marginBottom: 12 }}>{error}</Typography.Text>}
    <CompanyInternshipStatsTable
          rows={data?.rows}
            meta={data?.meta}
            loading={loading}
            onView={fetchCompanyDetail}
      role={effectiveRole}
        />
      </Card>
    </div>
  );
};

function generateYearOptions() {
  const current = new Date().getFullYear() + 543; // พ.ศ.
  const years = [];
  for (let y = current; y >= current - 5; y--) {
    years.push({ value: y, label: String(y) });
  }
  return years;
}

export default InternshipCompanyDashboard;
