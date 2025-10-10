// รีแฟกเตอร์: แยก data fetching (hook) + chart configs + constants เพื่อลดความซับซ้อนของ component นี้
import React, { useMemo, Suspense, useRef } from 'react';
import { Card, Row, Col, Typography, Select, Space, Tabs, Skeleton, Alert, Table } from 'antd';
// import { Line, Pie } from '@ant-design/plots'; // แปลงเป็น lazy
import { LazyLine as Line, LazyPie as Pie } from './charts/LazyPlots';
import { useSupportStaffReports } from './hooks/useSupportStaffReports';
import { buildWeeklyLineConfig, buildProposalPieConfig } from './charts/configs';
import { academicYearOptions } from './constants';

const { Title } = Typography;

const currentAcademicYear = () => {
  const now = new Date();
  const buddhistYear = now.getFullYear() + 543;
  return now.getMonth() < 5 ? buddhistYear - 1 : buddhistYear; // ถ้าเดือน < มิ.ย. ใช้ปีก่อน
};

const SupportStaffDashboard = () => {
  const initialYear = currentAcademicYear();
  const anchorYearRef = useRef(initialYear);
  const {
    year,
    setYear,
    semester,
    setSemester,
    loading,
    error,
    overview,
    logbookCompliance,
    advisorLoad,
    projectStatus,
    internshipEvaluation
  } = useSupportStaffReports(initialYear);

  // Data ที่ยังใช้
  const advisorData = (advisorLoad?.advisors || []).map((a,i)=>({ key: i, ...a }));
  const advisorColumns = [
    { title: 'อาจารย์', dataIndex: 'name', key: 'name' },
    { title: 'จำนวนนักศึกษา', dataIndex: 'count', key: 'count' }
  ];

  const yearOptions = academicYearOptions(anchorYearRef.current);

  // Memo configs เพื่อลด recreation
  const weeklyLineConfig = useMemo(()=> buildWeeklyLineConfig(logbookCompliance?.weeklyTrend || []), [logbookCompliance]);
  const proposalPieConfig = useMemo(()=> buildProposalPieConfig(projectStatus?.proposal), [projectStatus]);

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Row justify="space-between" align="middle">
  <Col><Title level={3}>แผงควบคุมรายงาน</Title></Col>
        <Col>
          <Space>
            <span>ปีการศึกษา:</span>
            <Select value={year} style={{ width: 120 }} onChange={setYear} options={yearOptions.map(y => ({ value: y, label: y }))} />
            <span>ภาคเรียน:</span>
            <Select value={semester} style={{ width: 90 }} onChange={setSemester} options={[1,2].map(s=>({value:s,label:s}))} />
          </Space>
        </Col>
      </Row>

      {error && <Alert type="error" message={error.message || 'โหลดข้อมูลไม่สำเร็จ'} />}

      <Tabs
        defaultActiveKey="internship"
        items={[
          {
            key: 'internship',
            label: 'ฝึกงาน',
            children: (
              <Space direction="vertical" style={{width:'100%'}} size="large">
                {/* KPI ฝึกงานหลัก: รวมสรุปที่จำเป็น (ลดซ้ำจากหน้า InternshipReport) */}
                <Row gutter={[16,16]}>
                  {(() => {
                    const rate = logbookCompliance?.rate;
                    const trend = logbookCompliance?.weeklyTrend || [];
                    const totalEntries = trend.reduce((s,w)=>s+w.onTime+w.late+w.missing,0);
                    const evalSum = internshipEvaluation; // ยังใช้บาง metric
                    const internshipKPIs = [
                      { title:'จำนวนนักศึกษาฝึกงาน', value: evalSum?.totalInterns ?? '-' },
                      { title:'ได้รับการประเมิน', value: evalSum?.evaluatedCount ?? '-' },
                      { title:'ประเมินเสร็จ (%)', value: evalSum ? evalSum.completionPct + '%' : '-' },
                      { title:'ตรงเวลา (%)', value: rate ? rate.onTimePct + '%' : '-' },
                      { title:'ล่าช้า (%)', value: rate ? rate.latePct + '%' : '-' },
                      { title:'ไม่ส่ง (%)', value: rate ? rate.missingPct + '%' : '-' },
                      { title:'จำนวนรายการบันทึก', value: totalEntries }
                    ];
                    return internshipKPIs.map((k,i)=>(
                      <Col xs={12} md={6} lg={3} key={i}>
                        <Card loading={loading} size="small"><Space direction="vertical" size={0}><span style={{color:'#888',fontSize:12}}>{k.title}</span><span style={{fontSize:20,fontWeight:600}}>{k.value}</span></Space></Card>
                      </Col>
                    ));
                  })()}
                </Row>
                <Row gutter={[16,16]}>
                  <Col span={24}>
                    <Card title="แนวโน้ม Logbook (รายสัปดาห์)" size="small" styles={{ body: {padding:12 }}}>
                      {loading ? <Skeleton active /> : (
                        <Suspense fallback={<Skeleton active />}> 
                          <Line {...weeklyLineConfig} />
                        </Suspense>
                      )}
                    </Card>
                  </Col>
                </Row>
              </Space>
            )
          },
          {
            key: 'project',
            label: 'โครงงาน',
            children: (
              <Space direction="vertical" style={{width:'100%'}} size="large">
                <Row gutter={[16,16]}>
                  {(() => {
                    const proposal = projectStatus?.proposal || {};
                    const projectKPIs = [
                      { title:'จำนวนโครงงาน', value: overview?.projectCount ?? '-' },
                      { title:'ส่งเสนอแล้ว', value: proposal.submitted ?? 0 },
                      { title:'อนุมัติแล้ว', value: proposal.approved ?? 0 },
                      { title:'ไม่อนุมัติ', value: proposal.rejected ?? 0 }
                    ];
                    return projectKPIs.map((k,i)=>(
                      <Col xs={12} md={6} key={i}>
                        <Card loading={loading}><Space direction="vertical" size={0}><span style={{color:'#888'}}>{k.title}</span><span style={{fontSize:22,fontWeight:600}}>{k.value}</span></Space></Card>
                      </Col>
                    ));
                  })()}
                </Row>
                <Row gutter={[16,16]}>
                  <Col xs={24} md={12}>
                    <Card title="สถานะข้อเสนอโครงงาน" size="small" styles={{ body: {padding:12 }}}>
                      {loading ? <Skeleton active /> : (
                        <Suspense fallback={<Skeleton active />}> 
                          <Pie {...proposalPieConfig} />
                        </Suspense>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title="สรุปอาจารย์ที่ปรึกษา" size="small">
                      <Table
                        size="small"
                        loading={loading}
                        dataSource={advisorData.slice(0,8)}
                        columns={advisorColumns}
                        pagination={false}
                      />
                    </Card>
                  </Col>
                </Row>
              </Space>
            )
          },
          {
            key: 'advisor',
            label: 'ภาระงานอาจารย์',
            children: (
              <Card size="small" title="ภาระงานอาจารย์ (ทั้งหมด)">
                <Table size="small" loading={loading} dataSource={advisorData} columns={advisorColumns} pagination={{pageSize:10}} />
              </Card>
            )
          }
        ]}
      />
  </Space>
  </div>
  );
};

export default SupportStaffDashboard;
