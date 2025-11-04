// WorkflowProgressReport.js
import React, { useMemo } from 'react';
import { Card, Row, Col, Typography, Select, Space, Alert, Table, Tag, Tabs, Skeleton, Empty, Statistic } from 'antd';
import { 
  WarningOutlined, 
  CheckCircleOutlined, 
  SyncOutlined,
  ClockCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList
} from 'recharts';
import { CHART_COLORS } from './charts/RechartsComponents';
import { useWorkflowProgress } from './hooks/useWorkflowProgress';

const { Title, Text } = Typography;

const WorkflowProgressReport = () => {
  const currentYear = useMemo(() => {
    const now = new Date();
    return now.getFullYear() + 543;
  }, []);

  const { data, blockedStudents, loading, error, filters, updateFilters, refresh } = useWorkflowProgress({
    workflowType: 'internship',
    academicYear: currentYear
  });

  // Prepare Chart Data
  const bottleneckBarData = useMemo(() => {
    if (!data?.bottlenecks) return [];
    return data.bottlenecks.slice(0, 10).map(item => ({
      step: item.stepTitle,
      value: parseFloat(item.stuckPercentage) || 0,
      count: item.stuckCount,
      fill: (parseFloat(item.stuckPercentage) >= 50 ? CHART_COLORS.danger :
            parseFloat(item.stuckPercentage) >= 30 ? CHART_COLORS.warning :
            CHART_COLORS.primary)
    }));
  }, [data?.bottlenecks]);
  
  const statusPieData = useMemo(() => {
    if (!data?.overallStats) return [];
    const labelMap = {
      not_started: 'ยังไม่เริ่ม',
      eligible: 'มีสิทธิ์',
      enrolled: 'ลงทะเบียนแล้ว',
      in_progress: 'กำลังดำเนินการ',
      completed: 'เสร็จสิ้น',
      blocked: 'ติดขัด',
      failed: 'ไม่ผ่าน'
    };
    const colorMap = {
      not_started: '#d9d9d9',
      eligible: CHART_COLORS.success,
      enrolled: CHART_COLORS.primary,
      in_progress: CHART_COLORS.warning,
      completed: CHART_COLORS.success,
      blocked: CHART_COLORS.danger,
      failed: CHART_COLORS.danger
    };
    return data.overallStats.map(stat => ({
      name: labelMap[stat.status] || stat.status,
      value: stat.count,
      fill: colorMap[stat.status] || CHART_COLORS.primary
    }));
  }, [data?.overallStats]);

  // Blocked Students Table Columns
  const blockedColumns = [
    {
      title: 'รหัสนักศึกษา',
      dataIndex: 'studentCode',
      key: 'studentCode',
      width: 120
    },
    {
      title: 'ชื่อ-นามสกุล',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'ขั้นตอนปัจจุบัน',
      dataIndex: 'currentStep',
      key: 'currentStep',
      render: (text) => <Tag color="red">{text}</Tag>
    },
    {
      title: 'สถานะ',
      dataIndex: 'currentStepStatus',
      key: 'status',
      render: (status) => {
        const colorMap = {
          blocked: 'red',
          pending: 'orange',
          in_progress: 'blue'
        };
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
      }
    },
    {
      title: 'ติดอยู่นาน (วัน)',
      dataIndex: 'daysSinceUpdate',
      key: 'days',
      sorter: (a, b) => a.daysSinceUpdate - b.daysSinceUpdate,
      render: (days) => (
        <Text strong style={{ color: days > 30 ? '#ff4d4f' : '#000' }}>
          {days} วัน
        </Text>
      )
    }
  ];

  const workflowOptions = [
    { value: 'internship', label: 'ระบบฝึกงาน' },
    { value: 'project1', label: 'โครงงานพิเศษ 1' },
    { value: 'project2', label: 'โครงงานพิเศษ 2' }
  ];

  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push({ value: currentYear - i, label: (currentYear - i).toString() });
    }
    return years;
  }, [currentYear]);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Title level={3} style={{ margin: 0 }}>รายงานความคืบหน้า Workflow</Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                value={filters.workflowType}
                style={{ width: 180 }}
                onChange={(value) => updateFilters({ workflowType: value })}
                options={workflowOptions}
              />
              <Select
                value={filters.academicYear}
                style={{ width: 120 }}
                onChange={(value) => updateFilters({ academicYear: value })}
                options={yearOptions}
                placeholder="ปีการศึกษา"
              />
              <ReloadOutlined 
                onClick={refresh} 
                style={{ fontSize: 18, cursor: 'pointer', color: '#1890ff' }}
                spin={loading}
              />
            </Space>
          </Col>
        </Row>

        {error && <Alert type="error" message={error} showIcon />}

        {/* Summary Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="นักศึกษาทั้งหมด"
                value={data?.summary?.total || 0}
                prefix={<SyncOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="กำลังดำเนินการ"
                value={data?.summary?.inProgress || 0}
                valueStyle={{ color: '#1890ff' }}
                prefix={<ClockCircleOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="เสร็จสิ้น"
                value={data?.summary?.completed || 0}
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="ติดขัด"
                value={data?.summary?.blocked || 0}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<WarningOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Tabs
          defaultActiveKey="funnel"
          items={[
            {
              key: 'funnel',
              label: '📊 แผนภูมิการไหล (Funnel)',
              children: (
                <Card size="small" title="การไหลของนักศึกษาผ่านแต่ละขั้นตอน (Funnel Analysis)">
                  {loading ? (
                    <Skeleton active />
                  ) : data?.funnelData?.length > 0 ? (
                    <>
                      <div style={{ marginBottom: 16, padding: '8px 16px', background: '#f0f5ff', borderRadius: 4 }}>
                        <Text type="secondary">
                          💡 <strong>แผนภูมิการไหล:</strong> แสดงจำนวนนักศึกษาในแต่ละขั้นตอนของกระบวนการ 
                          เพื่อดูว่านักศึกษาไหลผ่านแต่ละขั้นตอนอย่างไร และขั้นตอนใดที่มีนักศึกษาลดลงมาก
                        </Text>
                      </div>
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={data.funnelData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis 
                            type="category" 
                            dataKey="stepTitle" 
                            width={200}
                            style={{ fontSize: 12 }}
                          />
                          <Tooltip />
                          <Legend />
                        <Bar dataKey="completed" stackId="a" fill={CHART_COLORS.success} name="เสร็จสิ้น" />
                        <Bar dataKey="inProgress" stackId="a" fill={CHART_COLORS.warning} name="กำลังดำเนินการ" />
                        <Bar dataKey="pending" stackId="a" fill={CHART_COLORS.info} name="รอดำเนินการ" />
                        <Bar dataKey="blocked" stackId="a" fill={CHART_COLORS.danger} name="ติดขัด" />
                      </BarChart>
                    </ResponsiveContainer>
                    </>
                  ) : (
                    <Empty description="ไม่มีข้อมูล" />
                  )}
                </Card>
              )
            },
            {
              key: 'bottleneck',
              label: '🔍 จุดคอขวด (Bottleneck)',
              children: (
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={16}>
                    <Card size="small" title="ขั้นตอนที่นักศึกษาติดมากที่สุด (Bottleneck Analysis)">
                      {loading ? (
                        <Skeleton active />
                      ) : bottleneckBarData.length > 0 ? (
                        <>
                          <div style={{ marginBottom: 16, padding: '8px 16px', background: '#fff7e6', borderRadius: 4 }}>
                            <Text type="secondary">
                              💡 <strong>จุดคอขวด:</strong> แสดงเปอร์เซ็นต์ของนักศึกษาที่ติดค้างในแต่ละขั้นตอน 
                              ช่วยระบุขั้นตอนที่มีปัญหาและต้องให้ความสนใจเป็นพิเศษ
                            </Text>
                          </div>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={bottleneckBarData} layout="horizontal">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="step" 
                              angle={-45}
                              textAnchor="end"
                              height={100}
                              interval={0}
                              style={{ fontSize: 11 }}
                            />
                            <YAxis 
                              domain={[0, 100]}
                              tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip 
                              formatter={(value, name, props) => [
                                `${value}% (${props.payload.count} คน)`,
                                'อัตราติดขัด'
                              ]}
                            />
                            <Bar dataKey="value" name="อัตราติดขัด">
                              {bottleneckBarData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                              <LabelList 
                                dataKey="value" 
                                position="top" 
                                formatter={(value, props) => `${value}%`}
                                style={{ fontSize: 11 }}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                        </>
                      ) : (
                        <Empty description="ไม่มีข้อมูล" />
                      )}
                    </Card>
                  </Col>
                  <Col xs={24} lg={8}>
                    <Card size="small" title="สัดส่วนสถานะโดยรวม">
                      {loading ? (
                        <Skeleton active />
                      ) : statusPieData.length > 0 ? (
                        <>
                          <div style={{ marginBottom: 8, padding: '6px 12px', background: '#f6ffed', borderRadius: 4, fontSize: 12 }}>
                            <Text type="secondary">
                              💡 แสดงสัดส่วนสถานะของนักศึกษาทั้งหมด
                            </Text>
                          </div>
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={statusPieData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, value, percent }) => 
                                `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                              }
                              outerRadius={100}
                              innerRadius={60}
                              dataKey="value"
                            >
                              {statusPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                        </>
                      ) : (
                        <Empty description="ไม่มีข้อมูล" />
                      )}
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              key: 'blocked',
              label: `⚠️ นักศึกษาที่ติดขัด (${blockedStudents.length})`,
              children: (
                <Card size="small">
                  <Table
                    size="small"
                    loading={loading}
                    dataSource={blockedStudents}
                    columns={blockedColumns}
                    rowKey="studentId"
                    pagination={{ pageSize: 15 }}
                    locale={{ emptyText: <Empty description="ไม่มีนักศึกษาที่ติดขัด" /> }}
                  />
                </Card>
              )
            }
          ]}
        />
      </Space>
    </div>
  );
};

export default WorkflowProgressReport;
