// รีแฟกเตอร์: แยก data fetching (hook) + chart configs + constants เพื่อลดความซับซ้อนของ component นี้
import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Select, Space, Table, Tabs, Skeleton, Alert } from 'antd';
import { Line, Pie } from '@ant-design/plots';
import { useSupportStaffReports } from './hooks/useSupportStaffReports';
import { buildWeeklyLineConfig, buildProposalPieConfig } from './charts/configs';
import { academicYearOptions, kpiExtractors } from './constants';

const { Title } = Typography;

const currentAcademicYear = () => {
  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  return now.getMonth() < 5 ? buddhistYear - 1 : buddhistYear; // ถ้าเดือน < มิ.ย. ใช้ปีก่อน
};

const SupportStaffDashboard = () => {
  const {
    year,
    setYear,
    loading,
    error,
    overview,
    logbookCompliance,
    advisorLoad,
    projectStatus
  } = useSupportStaffReports(currentAcademicYear());

  // KPI cards
  const kpiItems = useMemo(() => overview ? kpiExtractors(overview) : [], [overview]);

  // Table data
  const logbookTableData = (logbookCompliance?.weeklyTrend || []).map(w => ({ key: w.week, week: w.week, onTime: w.onTime, late: w.late, missing: w.missing }));
  const advisorData = (advisorLoad?.advisors || []).map((a,i)=>({ key: i, ...a }));

  const advisorColumns = [
    { title: 'อาจารย์', dataIndex: 'name', key: 'name' },
    { title: 'จำนวนนักศึกษา', dataIndex: 'count', key: 'count' }
  ];
  const weekColumns = [
    { title: 'สัปดาห์', dataIndex: 'week', key: 'week' },
    { title: 'ตรงเวลา', dataIndex: 'onTime', key: 'onTime' },
    { title: 'ล่าช้า', dataIndex: 'late', key: 'late' },
    { title: 'ไม่ส่ง', dataIndex: 'missing', key: 'missing' }
  ];

  const yearOptions = academicYearOptions(year);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Row justify="space-between" align="middle">
        <Col><Title level={3}>Support Staff Report Dashboard</Title></Col>
        <Col>
          <Space>
            <span>ปีการศึกษา:</span>
            <Select value={year} style={{ width: 120 }} onChange={setYear} options={yearOptions.map(y => ({ value: y, label: y }))} />
          </Space>
        </Col>
      </Row>

      {error && <Alert type="error" message={error.message || 'โหลดข้อมูลไม่สำเร็จ'} />}

      <Row gutter={[16,16]}>
        {kpiItems.map((item, idx) => (
          <Col xs={12} md={6} key={idx}>
            <Card loading={loading}>
              <Space direction="vertical" size={0}>
                <span style={{color:'#888'}}>{item.title}</span>
                <span style={{fontSize:24,fontWeight:600}}>{item.value}</span>
                {item.extra && <span style={{color:'#999',fontSize:12}}>{item.extra}</span>}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Tabs
        defaultActiveKey="overview"
        items={[
          {
            key: 'overview',
            label: 'Overview',
            children: (
              <Row gutter={[16,16]}>
                <Col xs={24} md={12}>
                  <Card title="Logbook Trend (Weekly)" size="small" bodyStyle={{padding:12}}>
                    {loading ? <Skeleton active /> : <Line {...buildWeeklyLineConfig(logbookCompliance?.weeklyTrend || [])} />}
                  </Card>
                </Col>
                <Col xs={24} md={12}>
                  <Card title="Project Proposal Status" size="small" bodyStyle={{padding:12}}>
                    {loading ? <Skeleton active /> : <Pie {...buildProposalPieConfig(projectStatus?.proposal)} />}
                  </Card>
                </Col>
                <Col span={24}>
                  <Card title="Weekly Logbook Table" size="small">
                    <Table
                      size="small"
                      loading={loading}
                      dataSource={logbookTableData}
                      columns={weekColumns}
                      pagination={false}
                    />
                  </Card>
                </Col>
              </Row>
            )
          },
          {
            key: 'advisor',
            label: 'Advisor Load',
            children: (
              <Card size="small" title="Advisor Workload">
                <Table size="small" loading={loading} dataSource={advisorData} columns={advisorColumns} pagination={{pageSize:10}} />
              </Card>
            )
          }
        ]}
      />
    </Space>
  );
};

export default SupportStaffDashboard;
