// DeadlineComplianceReportRecharts.js
import React, { useMemo, useEffect } from 'react';
import { 
  Card, Row, Col, Typography, Select, Space, Alert, Table, Tag, Tabs, 
  Skeleton, Empty, Statistic, Badge 
} from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  WarningOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { useDeadlineCompliance } from './hooks/useDeadlineCompliance';
import {
  DEADLINE_COLORS,
  getComplianceColor,
  formatPercent,
  renderBarLabel,
  BarChartTooltip,
  LineChartTooltip,
  PieChartTooltip,
  renderPieLabel,
  preparePieData
} from './charts/deadlineRechartsConfigs';
import dayjs from '../../../utils/dayjs';

const { Title, Text } = Typography;

const DeadlineComplianceReportRecharts = () => {
  const currentYear = useMemo(() => {
    const now = new Date();
    return now.getFullYear() + 543;
  }, []);

  const { data, loading, error, filters, updateFilters, refresh } = useDeadlineCompliance({
    academicYear: currentYear.toString()
  });

  // Debug log
  useEffect(() => {
    if (data) {
      console.log('Deadline Compliance Data (Recharts):', {
        summary: data.summary,
        deadlineStatsCount: data.deadlineStats?.length || 0,
        trendCount: data.trend?.length || 0
      });
    }
  }, [data]);

  // เตรียมข้อมูลสำหรับกราฟ
  const barChartData = useMemo(() => {
    return (data?.deadlineStats || []).map(stat => ({
      deadline: stat.name || 'ไม่ระบุ',
      rate: parseFloat(stat.complianceRate) || 0,
      onTime: stat.onTime || 0,
      total: stat.total || 0,
      fill: getComplianceColor(parseFloat(stat.complianceRate) || 0)
    }));
  }, [data?.deadlineStats]);

  const lineChartData = useMemo(() => {
    return (data?.trend || []).map(item => ({
      week: item.week || '',
      complianceRate: parseFloat(item.complianceRate) || 0,
      onTime: item.onTime || 0,
      total: item.totalSubmissions || 0
    }));
  }, [data?.trend]);

  const pieChartData = useMemo(() => {
    return preparePieData(data?.summary || {});
  }, [data?.summary]);

  // Deadline Stats Table Columns
  const deadlineColumns = [
    {
      title: 'ชื่อ Deadline',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.isCritical && (
            <Tag color="red" icon={<ExclamationCircleOutlined />}>Critical</Tag>
          )}
        </Space>
      )
    },
    {
      title: 'วันกำหนดส่ง',
      dataIndex: 'deadlineAt',
      key: 'deadlineAt',
      render: (date) => dayjs(date).tz().format('DD MMM BBBB HH:mm'),
      sorter: (a, b) => new Date(a.deadlineAt) - new Date(b.deadlineAt)
    },
    {
      title: 'ประเภท',
      dataIndex: 'relatedTo',
      key: 'relatedTo',
      filters: [
        { text: 'ฝึกงาน', value: 'internship' },
        { text: 'โครงงานพิเศษ 1', value: 'project1' },
        { text: 'ปริญญานิพนธ์', value: 'project2' },
        { text: 'ทั่วไป', value: 'general' }
      ],
      onFilter: (value, record) => record.relatedTo === value,
      render: (type) => {
        const colorMap = {
          internship: 'blue',
          project1: 'green',
          project2: 'purple',
          general: 'default'
        };
        const labelMap = {
          internship: 'ฝึกงาน',
          project1: 'โครงงาน 1',
          project2: 'ปริญญานิพนธ์',
          general: 'ทั่วไป'
        };
        return <Tag color={colorMap[type]}>{labelMap[type] || type}</Tag>;
      }
    },
    {
      title: 'อัตราส่งตรงเวลา',
      dataIndex: 'complianceRate',
      key: 'complianceRate',
      sorter: (a, b) => parseFloat(a.complianceRate) - parseFloat(b.complianceRate),
      render: (rate) => {
        const rateNum = parseFloat(rate);
        let color = 'success';
        if (rateNum < 60) color = 'error';
        else if (rateNum < 80) color = 'warning';
        
        return (
          <Badge 
            status={color} 
            text={`${rate}%`}
          />
        );
      }
    },
    {
      title: 'ส่งแล้ว / ทั้งหมด',
      key: 'submission',
      render: (_, record) => (
        <Text>{record.onTime + record.late} / {record.expectedTotal}</Text>
      )
    },
    {
      title: 'สถานะ',
      key: 'status',
      render: (_, record) => {
        if (record.isOverdue) {
          return (
            <Tag color="red" icon={<WarningOutlined />}>
              เลยกำหนด {record.daysOverdue} วัน
            </Tag>
          );
        }
        if (record.daysUntil <= 7) {
          return (
            <Tag color="orange" icon={<ClockCircleOutlined />}>
              เหลือ {record.daysUntil} วัน
            </Tag>
          );
        }
        return <Tag color="green">ปกติ</Tag>;
      }
    }
  ];

  // Upcoming Deadlines Table
  const upcomingColumns = [
    {
      title: 'ชื่อ Deadline',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          {text}
          {record.isCritical && <Tag color="red">Critical</Tag>}
        </Space>
      )
    },
    {
      title: 'วันกำหนดส่ง',
      dataIndex: 'deadlineAt',
      key: 'deadlineAt',
      render: (date) => dayjs(date).tz().format('DD MMM BBBB HH:mm')
    },
    {
      title: 'เหลือเวลา',
      dataIndex: 'daysUntil',
      key: 'daysUntil',
      render: (days) => (
        <Tag color={days <= 3 ? 'red' : 'orange'}>
          {days} วัน
        </Tag>
      )
    }
  ];

  const relatedToOptions = [
    { value: '', label: 'ทั้งหมด' },
    { value: 'internship', label: 'ฝึกงาน' },
    { value: 'project1', label: 'โครงงานพิเศษ 1' },
    { value: 'project2', label: 'โครงงานพิเศษ 2' },
    { value: 'general', label: 'ทั่วไป' }
  ];

  const yearOptions = useMemo(() => {
    const years = [];
    for (let i = 0; i < 5; i++) {
      years.push({ 
        value: (currentYear - i).toString(), 
        label: (currentYear - i).toString() 
      });
    }
    return years;
  }, [currentYear]);

  const semesterOptions = [
    { value: '', label: 'ทั้งหมด' },
    { value: 1, label: 'ภาค 1' },
    { value: 2, label: 'ภาค 2' },
    { value: 3, label: 'ภาคฤดูร้อน' }
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Title level={3} style={{ margin: 0 }}>รายงานการปฏิบัติตามกำหนดการ</Title>
            </Space>
          </Col>
          <Col>
            <Space>
              <Select
                value={filters.relatedTo}
                style={{ width: 150 }}
                onChange={(value) => updateFilters({ relatedTo: value })}
                options={relatedToOptions}
              />
              <Select
                value={filters.academicYear}
                style={{ width: 120 }}
                onChange={(value) => updateFilters({ academicYear: value })}
                options={yearOptions}
              />
              <Select
                value={filters.semester}
                style={{ width: 120 }}
                onChange={(value) => updateFilters({ semester: value })}
                options={semesterOptions}
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
                title="กำหนดการทั้งหมด"
                value={data?.summary?.totalDeadlines || 0}
                prefix={<CalendarOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="อัตราส่งตรงเวลา"
                value={data?.summary?.onTimePercentage || 0}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
                prefix={<CheckCircleOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="กำลังจะถึง (7 วัน)"
                value={data?.summary?.upcomingCount || 0}
                valueStyle={{ color: '#faad14' }}
                prefix={<ClockCircleOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="เลยกำหนดแล้ว"
                value={data?.summary?.overdueCount || 0}
                valueStyle={{ color: '#ff4d4f' }}
                prefix={<WarningOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Tabs
          defaultActiveKey="overview"
          items={[
            {
              key: 'overview',
              label: 'ภาพรวม',
              children: (
                <Row gutter={[16, 16]}>
                  {/* Bar Chart */}
                  <Col xs={24} lg={14}>
                    <Card size="small" title="อัตราการส่งตรงเวลาแต่ละกำหนดการ">
                      {loading ? (
                        <Skeleton active />
                      ) : barChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={barChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="deadline" 
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
                            <Tooltip content={<BarChartTooltip />} />
                            <Bar 
                              dataKey="rate" 
                              label={renderBarLabel}
                            >
                              {barChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <Empty description="ไม่มีข้อมูล" />
                      )}
                    </Card>
                  </Col>

                  {/* Pie Chart */}
                  <Col xs={24} lg={10}>
                    <Card size="small" title="สัดส่วนการส่งงาน">
                      {loading ? (
                        <Skeleton active />
                      ) : pieChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={renderPieLabel}
                              outerRadius={100}
                              innerRadius={60}
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                              ))}
                            </Pie>
                            <Tooltip content={<PieChartTooltip />} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <Empty description="ไม่มีข้อมูล" />
                      )}
                    </Card>
                  </Col>

                  {/* Line Chart */}
                  <Col span={24}>
                    <Card size="small" title="แนวโน้มการปฏิบัติตาม (รายสัปดาห์)">
                      {loading ? (
                        <Skeleton active />
                      ) : lineChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={lineChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="week" style={{ fontSize: 11 }} />
                            <YAxis 
                              domain={[0, 100]}
                              tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip content={<LineChartTooltip />} />
                            <Line 
                              type="monotone" 
                              dataKey="complianceRate" 
                              stroke={DEADLINE_COLORS.primary}
                              strokeWidth={2}
                              dot={{ fill: DEADLINE_COLORS.primary, r: 4 }}
                              label={{ 
                                position: 'top',
                                formatter: (value) => formatPercent(value),
                                style: { fontSize: 11 }
                              }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      ) : (
                        <Empty description="ไม่มีข้อมูล" />
                      )}
                    </Card>
                  </Col>
                </Row>
              )
            },
            {
              key: 'deadlines',
              label: 'รายละเอียดกำหนดการ',
              children: (
                <Card size="small">
                  <Table
                    size="small"
                    loading={loading}
                    dataSource={data?.deadlineStats || []}
                    columns={deadlineColumns}
                    rowKey="id"
                    pagination={{ pageSize: 20 }}
                    scroll={{ x: 1200 }}
                  />
                </Card>
              )
            },
            {
              key: 'upcoming',
              label: `กำลังจะถึง (${data?.upcoming?.length || 0})`,
              children: (
                <Card size="small">
                  <Table
                    size="small"
                    loading={loading}
                    dataSource={data?.upcoming || []}
                    columns={upcomingColumns}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: <Empty description="ไม่มี Deadline ที่กำลังจะถึง" /> }}
                  />
                </Card>
              )
            },
            {
              key: 'overdue',
              label: `เลยกำหนด (${data?.overdue?.length || 0})`,
              children: (
                <Card size="small">
                  <Alert
                    type="warning"
                    message={`มี ${data?.overdue?.length || 0} Deadline ที่เลยกำหนดแล้ว`}
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Table
                    size="small"
                    loading={loading}
                    dataSource={data?.overdue || []}
                    columns={[
                      ...upcomingColumns.slice(0, 2),
                      {
                        title: 'เลยกำหนดมาแล้ว',
                        dataIndex: 'daysOverdue',
                        key: 'daysOverdue',
                        render: (days) => (
                          <Tag color="red">{days} วัน</Tag>
                        )
                      }
                    ]}
                    rowKey="id"
                    pagination={false}
                    locale={{ emptyText: <Empty description="ไม่มี Deadline ที่เลยกำหนด" /> }}
                  />
                </Card>
              )
            },
            {
              key: 'lateSubmissions',
              label: `นักศึกษาที่ส่งช้า (${data?.lateSubmissions?.length || 0})`,
              children: (
                <Card size="small">
                  <Alert
                    type="error"
                    message={`มีนักศึกษา ${data?.lateSubmissions?.length || 0} คน ที่ส่งเอกสารช้า/เลยกำหนด`}
                    description=""
                    showIcon
                    style={{ marginBottom: 16 }}
                  />
                  <Table
                    size="small"
                    loading={loading}
                    dataSource={data?.lateSubmissions || []}
                    columns={[
                      {
                        title: 'รหัสนักศึกษา',
                        dataIndex: 'studentId',
                        key: 'studentId',
                        width: 120,
                        render: (text) => <Text strong>{text}</Text>
                      },
                      {
                        title: 'ชื่อ-นามสกุล',
                        key: 'fullName',
                        render: (_, record) => (
                          <Text>{record.firstName} {record.lastName}</Text>
                        )
                      },
                      {
                        title: 'เอกสาร/Deadline',
                        dataIndex: 'deadlineName',
                        key: 'deadlineName',
                        render: (text, record) => (
                          <Space direction="vertical" size={0}>
                            <Text>{text}</Text>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {record.documentType || record.documentSubtype}
                            </Text>
                          </Space>
                        )
                      },
                      {
                        title: 'กำหนดส่ง',
                        dataIndex: 'deadlineAt',
                        key: 'deadlineAt',
                        render: (date) => dayjs(date).tz().format('DD/MM/BBBB HH:mm'),
                        sorter: (a, b) => new Date(a.deadlineAt) - new Date(b.deadlineAt)
                      },
                      {
                        title: 'ส่งเมื่อ',
                        dataIndex: 'submittedAt',
                        key: 'submittedAt',
                        render: (date) => dayjs(date).tz().format('DD/MM/BBBB HH:mm'),
                        sorter: (a, b) => new Date(a.submittedAt) - new Date(b.submittedAt)
                      },
                      {
                        title: 'ส่งช้า',
                        dataIndex: 'daysLate',
                        key: 'daysLate',
                        render: (days, record) => {
                          const hoursLate = record.hoursLate || 0;
                          if (days > 0) {
                            return <Tag color="red">{days} วัน {hoursLate % 24} ชม.</Tag>;
                          } else if (hoursLate > 0) {
                            return <Tag color="orange">{hoursLate} ชั่วโมง</Tag>;
                          }
                          return <Tag color="volcano">ส่งช้า</Tag>;
                        },
                        sorter: (a, b) => (a.hoursLate || 0) - (b.hoursLate || 0)
                      },
                      {
                        title: 'สถานะ',
                        dataIndex: 'status',
                        key: 'status',
                        render: (status) => {
                          const statusMap = {
                            'late': { color: 'orange', text: 'ส่งช้า (ใน Grace)' },
                            'very_late': { color: 'red', text: 'ส่งช้ามาก' },
                            'overdue': { color: 'volcano', text: 'เลยกำหนด' }
                          };
                          const config = statusMap[status] || { color: 'default', text: status };
                          return <Tag color={config.color}>{config.text}</Tag>;
                        }
                      }
                    ]}
                    rowKey={(record) => `${record.studentId}-${record.documentId}`}
                    pagination={{ 
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total) => `ทั้งหมด ${total} รายการ`
                    }}
                    scroll={{ x: 1400 }}
                    locale={{ emptyText: <Empty description="ไม่มีนักศึกษาที่ส่งช้า" /> }}
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

export default DeadlineComplianceReportRecharts;
