import React, { useState } from 'react';
import { Card, Select, Space, Button, Typography } from 'antd';
import { useAuth } from 'contexts/AuthContext';
import useCompanyInternshipStats from 'features/internship/hooks/useCompanyInternshipStats';
import CompanyInternshipStatsTable from './CompanyInternshipStatsTable';

// Dashboard หลักสำหรับ staff / student (ปรับตาม role ภายนอก) - ตัดภาคเรียนออก เหลือเฉพาะปีการศึกษา
// NOTE: เดิมมี prop defaultSemester ถูกนำออกแล้ว
const InternshipCompanyDashboard = ({ defaultAcademicYear, limit, role }) => {
  // ถ้าไม่ได้ส่ง role เข้ามา ใช้จาก AuthContext
  const { userData } = useAuth();
  const effectiveRole = role || userData?.role;
  // ฟังก์ชันหาปีการศึกษาปัจจุบัน (พ.ศ.) ตามเกณฑ์ไทย: ปีการศึกษาเริ่มเดือนสิงหาคม
  const deriveCurrentAcademicYear = () => {
    const now = new Date();
    const buddhistYear = now.getFullYear() + 543; // แปลงเป็น พ.ศ.
    // ถ้าเดือน ม.ค.-ก.ค. (0-6) ยังอยู่ช่วงเทอม 2/3 ของปีการศึกษาเดิมที่เริ่ม ส.ค. ปีก่อน
    // แต่ระบบส่วนใหญ่ถือว่า ช่วง ม.ค.-ก.ค. ยังเป็นปีการศึกษาเดียวกัน (เช่น 2567) ไม่ต้องลบ 1
    // จึงใช้ buddhistYear ตรง ๆ (ถ้าต้องการเลื่อนให้ลบ 1 สามารถเปลี่ยนตรรกะได้)
    return buddhistYear;
  };

  const [academicYear, setAcademicYear] = useState(() => defaultAcademicYear || deriveCurrentAcademicYear());

  // ปรับ limit ตามบทบาท หากไม่ได้ส่งมา
  const effectiveLimit = limit || (effectiveRole === 'student' ? 10 : 50);
  // ไม่ส่ง semester เพื่อให้รวมทุกภาคเรียน
  const { data, loading, error, reload, fetchCompanyDetail } = useCompanyInternshipStats({ academicYear, limit: effectiveLimit });

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
