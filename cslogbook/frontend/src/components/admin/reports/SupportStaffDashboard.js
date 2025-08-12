import React, { useEffect, useState, useMemo } from 'react';
import { Card, Row, Col, Typography, Select, Space, Table, Tabs, Skeleton, Alert } from 'antd';
import { getOverview, getInternshipLogbookCompliance, getProjectStatusSummary, getAdvisorLoad } from '../../../services/reportService';
import { Line, Pie } from '@ant-design/plots';

// Config builder สำหรับกราฟเส้น Logbook Trend
const buildWeeklyLineConfig = (trend = []) => {
  const data = trend.flatMap(w => ([
    { category: 'On Time', week: String(w.week), value: w.onTime },
    { category: 'Late', week: String(w.week), value: w.late },
    { category: 'Missing', week: String(w.week), value: w.missing }
  ]));
  return {
    data,
    xField: 'week',
    yField: 'value',
    seriesField: 'category',
    smooth: true,
    height: 260,
    padding: 'auto',
    tooltip: { showMarkers: true },
    legend: { position: 'top' },
    point: { size: 4 },
    animation: false
  };
};

// Config builder สำหรับ Pie Proposal Status
const buildProposalPieConfig = (proposal) => {
  const rows = [
    { type: 'Draft', value: proposal?.draft || 0 },
    { type: 'Submitted', value: proposal?.submitted || 0 },
    { type: 'Approved', value: proposal?.approved || 0 },
    { type: 'Rejected', value: proposal?.rejected || 0 }
  ].filter(r => r.value > 0);
  const data = rows.length ? rows : [{ type: 'No Data', value: 1 }];
  return {
    data,
    angleField: 'value',
    colorField: 'type',
    height: 260,
    innerRadius: 0.6,
    label: { text: 'type', position: 'outside' },
    legend: { position: 'bottom' },
    tooltip: { items: ['type', 'value'] },
    interactions: [{ type: 'element-active' }]
  };
};

const { Title } = Typography;

const currentAcademicYear = () => new Date().getFullYear() + 543; // สมมติ พ.ศ.

const SupportStaffDashboard = () => {
  const [year, setYear] = useState(currentAcademicYear());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [overview, setOverview] = useState(null);
  const [logbookCompliance, setLogbookCompliance] = useState(null);
  const [advisorLoad, setAdvisorLoad] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null); // เก็บ proposal summary

  const fetchData = async (selectedYear) => {
    setLoading(true); setError(null);
    try {
  const [ov, logComp, projStat, advLoad] = await Promise.all([
        getOverview({ year: selectedYear }),
        getInternshipLogbookCompliance({ year: selectedYear }),
        getProjectStatusSummary({ year: selectedYear }),
        getAdvisorLoad({ year: selectedYear })
      ]);
      setOverview(ov);
      setLogbookCompliance(logComp);
      setAdvisorLoad(advLoad);
  setProjectStatus(projStat);
    } catch (e) {
      console.error(e);
      setError(e.message || 'โหลดข้อมูลไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(year); }, [year]);

  const kpiItems = useMemo(() => ([
    { key: 'studentsTotal', label: 'จำนวนนักศึกษา', value: overview?.studentsTotal ?? '-' },
    { key: 'internshipCount', label: 'จำนวนฝึกงาน', value: overview?.internshipCount ?? '-' },
    { key: 'projectCount', label: 'จำนวนโครงงาน', value: overview?.projectCount ?? '-' },
    { key: 'advisorLoad', label: 'อัตราอาจารย์ (เฉลี่ย)', value: overview?.advisorWorkload?.length ? (overview.advisorWorkload.reduce((s,a)=>s+a.count,0)/overview.advisorWorkload.length).toFixed(1) : '-' }
  ]), [overview]);

  const logbookTableData = (logbookCompliance?.weeklyTrend || []).map(w => ({ key: w.week, week: w.week, onTime: w.onTime, late: w.late, missing: w.missing }));

  const advisorColumns = [
    { title: 'อาจารย์', dataIndex: 'name', key: 'name' },
    { title: 'จำนวนนักศึกษา', dataIndex: 'count', key: 'count' }
  ];

  const advisorData = (advisorLoad?.advisors || []).map((a,i)=>({ key: i, ...a }));

  const weekColumns = [
    { title: 'สัปดาห์', dataIndex: 'week', key: 'week' },
    { title: 'ตรงเวลา', dataIndex: 'onTime', key: 'onTime' },
    { title: 'ล่าช้า', dataIndex: 'late', key: 'late' },
    { title: 'ไม่ส่ง', dataIndex: 'missing', key: 'missing' }
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Row justify="space-between" align="middle">
        <Col><Title level={3}>Support Staff Report Dashboard</Title></Col>
        <Col>
          <Space>
            <span>ปีการศึกษา:</span>
            <Select value={year} style={{ width: 120 }} onChange={setYear} options={Array.from({length:5}).map((_,i)=>{ const y=currentAcademicYear()-i; return {value:y,label:y};})} />
          </Space>
        </Col>
      </Row>

      {error && <Alert type="error" message={error} />}

      <Row gutter={[16,16]}>
        {kpiItems.map(item => (
          <Col xs={12} md={6} key={item.key}>
            <Card loading={loading}>
              <Space direction="vertical" size={0}>
                <span style={{color:'#888'}}>{item.label}</span>
                <span style={{fontSize:24,fontWeight:600}}>{item.value}</span>
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
