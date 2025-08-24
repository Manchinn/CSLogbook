// รีแฟกเตอร์: แยก data fetching (hook) + chart configs + constants เพื่อลดความซับซ้อนของ component นี้
import React, { useMemo, Suspense } from 'react';
import { Card, Row, Col, Typography, Select, Space, Table, Tabs, Skeleton, Alert } from 'antd';
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
  } = useSupportStaffReports(currentAcademicYear());

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

  // Memo configs เพื่อลด recreation
  const weeklyLineConfig = useMemo(()=> buildWeeklyLineConfig(logbookCompliance?.weeklyTrend || []), [logbookCompliance]);
  const proposalPieConfig = useMemo(()=> buildProposalPieConfig(projectStatus?.proposal), [projectStatus]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Row justify="space-between" align="middle">
        <Col><Title level={3}>Support Staff Report Dashboard</Title></Col>
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
            label: 'Internship',
            children: (
              <Space direction="vertical" style={{width:'100%'}} size="large">
                {/* KPI ฝึกงาน: สถานะการประเมิน + Logbook */}
                <Row gutter={[16,16]}>
                  {(() => {
                    const rate = logbookCompliance?.rate;
                    const trend = logbookCompliance?.weeklyTrend || [];
                    const totalEntries = trend.reduce((s,w)=>s+w.onTime+w.late+w.missing,0);
                    const evalSum = internshipEvaluation;
                    const internshipKPIs = [
                      { title:'Interns', value: evalSum?.totalInterns ?? '-' },
                      { title:'Evaluated', value: evalSum?.evaluatedCount ?? '-' },
                      { title:'Completion %', value: evalSum ? evalSum.completionPct + '%' : '-' },
                      { title:'Overall Avg', value: evalSum?.overallAverage ?? '-' },
                      { title:'On Time %', value: rate ? rate.onTimePct + '%' : '-' },
                      { title:'Late %', value: rate ? rate.latePct + '%' : '-' },
                      { title:'Missing %', value: rate ? rate.missingPct + '%' : '-' },
                      { title:'Log Entries', value: totalEntries }
                    ];
                    return internshipKPIs.map((k,i)=>(
                      <Col xs={12} md={6} lg={3} key={i}>
                        <Card loading={loading} size="small"><Space direction="vertical" size={0}><span style={{color:'#888',fontSize:12}}>{k.title}</span><span style={{fontSize:20,fontWeight:600}}>{k.value}</span></Space></Card>
                      </Col>
                    ));
                  })()}
                </Row>
                <Row gutter={[16,16]}>
                  <Col xs={24} md={14}>
                    <Card title="Logbook Trend (Weekly)" size="small" bodyStyle={{padding:12}}>
                      {loading ? <Skeleton active /> : (
                        <Suspense fallback={<Skeleton active />}> 
                          <Line {...weeklyLineConfig} />
                        </Suspense>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} md={10}>
                    <Space direction="vertical" style={{width:'100%'}} size="large">
                      <Card title="Weekly Logbook Table" size="small">
                        <Table size="small" loading={loading} dataSource={logbookTableData} columns={weekColumns} pagination={false} />
                      </Card>
                      <Card title="Internship Evaluation Distribution" size="small" bodyStyle={{padding:12}}>
                        {loading ? <Skeleton active /> : (
                          <Pie
                            data={(internshipEvaluation?.gradeDistribution || []).map(d=>({ type:d.grade, value:d.count }))}
                            angleField="value"
                            colorField="type"
                            radius={0.9}
                            // เอา label inner ออกเพื่อหลีกเลี่ยง error shape.inner
                            label={false}
                            legend={{ position:'bottom' }}
                            tooltip={{ formatter:(datum)=> ({ name: `${datum.type}`, value: datum.value }) }}
                          />
                        )}
                      </Card>
                    </Space>
                  </Col>
                </Row>
                <Row gutter={[16,16]}>
                  <Col span={24}>
                    <Card title="Average Score by Criteria" size="small">
                      <Table
                        size="small"
                        loading={loading}
                        dataSource={(internshipEvaluation?.criteriaAverages || []).map((c,i)=>({ key:c.key||i, criteria:c.label, average:c.avg }))}
                        columns={[{title:'หัวข้อ',dataIndex:'criteria'},{title:'เฉลี่ย',dataIndex:'average'}]}
                        pagination={false}
                        locale={{emptyText:'No Evaluation Data'}}
                      />
                    </Card>
                  </Col>
                </Row>
              </Space>
            )
          },
          {
            key: 'project',
            label: 'Project',
            children: (
              <Space direction="vertical" style={{width:'100%'}} size="large">
                <Row gutter={[16,16]}>
                  {(() => {
                    const proposal = projectStatus?.proposal || {};
                    const projectKPIs = [
                      { title:'Projects', value: overview?.projectCount ?? '-' },
                      { title:'Submitted', value: proposal.submitted ?? 0 },
                      { title:'Approved', value: proposal.approved ?? 0 },
                      { title:'Rejected', value: proposal.rejected ?? 0 }
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
                    <Card title="Project Proposal Status" size="small" bodyStyle={{padding:12}}>
                      {loading ? <Skeleton active /> : (
                        <Suspense fallback={<Skeleton active />}> 
                          <Pie {...proposalPieConfig} />
                        </Suspense>
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card title="Advisor Summary" size="small">
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
            label: 'Advisor Load',
            children: (
              <Card size="small" title="Advisor Workload (All)">
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
