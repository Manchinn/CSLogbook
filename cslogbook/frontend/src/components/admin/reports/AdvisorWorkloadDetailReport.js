// AdvisorWorkloadDetailReport.js
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, Row, Col, Typography, Space, Alert, Table, Tag, 
  Skeleton, Empty, Modal, Descriptions, Badge, Button, Statistic
} from 'antd';
import { 
  TeamOutlined,
  UserOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { SimpleBarChart } from './charts/RechartsComponents';
import apiClient from '../../../services/apiClient';

const { Title, Text } = Typography;

const AdvisorWorkloadDetailReport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [advisorData, setAdvisorData] = useState([]);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedAdvisor, setSelectedAdvisor] = useState(null);
  const [advisorDetail, setAdvisorDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Load Advisor Workload
  const loadAdvisorLoad = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.get('/reports/advisors/workload');
      console.log('Advisor workload response:', response.data.data); // Debug log
      const advisors = response.data.data?.advisors || [];
      console.log('First advisor:', advisors[0]); // Debug log
      setAdvisorData(advisors);
    } catch (err) {
      setError(err.response?.data?.error || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Load Advisor Detail
  const loadAdvisorDetail = async (teacherId) => {
    if (!teacherId || isNaN(teacherId)) {
      console.error('Invalid teacherId:', teacherId);
      setError('รหัสอาจารย์ไม่ถูกต้อง');
      return;
    }
    try {
      setDetailLoading(true);
      const response = await apiClient.get(`/reports/advisors/${teacherId}/detail`);
      setAdvisorDetail(response.data.data);
    } catch (err) {
      console.error('Error loading advisor detail:', err);
      setError(err.response?.data?.error || 'ไม่สามารถโหลดรายละเอียดอาจารย์ได้');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    loadAdvisorLoad();
  }, []);

  // Workload Balance Chart - แสดงเฉพาะที่ปรึกษาหลักและร่วม
  const workloadChartData = useMemo(() => {
    if (!advisorData || advisorData.length === 0) return [];
    
    return advisorData.map(item => {
      // ใช้ name หรือ teacherCode ที่มาจาก backend
      const advisorName = item.name || item.teacherCode || 'ไม่ระบุ';
      
      return {
        advisor: advisorName,
        'ที่ปรึกษาหลัก': parseInt(item.advisorProjectCount) || 0,
        'ที่ปรึกษาร่วม': parseInt(item.coAdvisorProjectCount) || 0
      };
    });
  }, [advisorData]);

  // Advisor Table Columns
  const advisorColumns = [
    {
      title: 'ชื่ออาจารย์',
      dataIndex: 'name',
      key: 'name',
      fixed: 'left',
      width: 200,
      render: (text, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text || record.teacherCode || 'ไม่ระบุ'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.teacherCode}
          </Text>
        </Space>
      )
    },
    {
      title: 'ที่ปรึกษาหลัก',
      dataIndex: 'advisorProjectCount',
      key: 'advisorProjectCount',
      width: 120,
      sorter: (a, b) => (a.advisorProjectCount || 0) - (b.advisorProjectCount || 0),
      render: (count) => (
        <Badge 
          count={count || 0} 
          showZero 
          style={{ backgroundColor: count > 5 ? '#ff4d4f' : '#52c41a' }}
        />
      )
    },
    {
      title: 'ที่ปรึกษาร่วม',
      dataIndex: 'coAdvisorProjectCount',
      key: 'coAdvisorProjectCount',
      width: 120,
      sorter: (a, b) => (a.coAdvisorProjectCount || 0) - (b.coAdvisorProjectCount || 0),
      render: (count) => (
        <Badge 
          count={count || 0} 
          showZero 
          style={{ backgroundColor: count > 5 ? '#ff4d4f' : '#722ed1' }}
        />
      )
    },
    {
      title: 'รวมทั้งหมด',
      key: 'total',
      width: 120,
      sorter: (a, b) => {
        const totalA = (a.advisorProjectCount || 0) + (a.coAdvisorProjectCount || 0);
        const totalB = (b.advisorProjectCount || 0) + (b.coAdvisorProjectCount || 0);
        return totalA - totalB;
      },
      render: (_, record) => {
        const total = (record.advisorProjectCount || 0) + (record.coAdvisorProjectCount || 0);
        let color = 'success';
        if (total > 10) color = 'error';
        else if (total > 7) color = 'warning';
        
        return <Badge status={color} text={<Text strong>{total}</Text>} />;
      }
    },
    {
      title: '',
      key: 'actions',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => {
            console.log('Selected advisor record:', record); // Debug log
            setSelectedAdvisor(record);
            setDetailModalVisible(true);
            loadAdvisorDetail(record.teacherId);
          }}
        >
          รายละเอียด
        </Button>
      )
    }
  ];

  // Summary Stats
  const summaryStats = useMemo(() => {
    if (!advisorData.length) return { totalAdvisors: 0, totalProjects: 0, avgLoad: 0, maxLoad: 0 };
    
    const totalAdvisors = advisorData.length;
    const totalProjects = advisorData.reduce((sum, item) => 
      sum + (item.advisorProjectCount || 0) + (item.coAdvisorProjectCount || 0), 0
    );
    const avgLoad = totalProjects / totalAdvisors;
    const maxLoad = Math.max(...advisorData.map(item => 
      (item.advisorProjectCount || 0) + (item.coAdvisorProjectCount || 0)
    ));

    return { totalAdvisors, totalProjects, avgLoad, maxLoad };
  }, [advisorData]);

  return (
    <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '24px' }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Header */}
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <Title level={3} style={{ margin: 0 }}>รายงานภาระงานอาจารย์ที่ปรึกษา</Title>
            </Space>
          </Col>
          <Col>
            <ReloadOutlined 
              onClick={loadAdvisorLoad} 
              style={{ fontSize: 18, cursor: 'pointer', color: '#1890ff' }}
              spin={loading}
            />
          </Col>
        </Row>

        {error && <Alert type="error" message={error} showIcon />}

        {/* Summary Cards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="อาจารย์ที่ปรึกษา"
                value={summaryStats.totalAdvisors}
                prefix={<TeamOutlined />}
                loading={loading}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="โครงงานทั้งหมด"
                value={summaryStats.totalProjects}
                prefix={<UserOutlined />}
                loading={loading}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="ภาระงานเฉลี่ย"
                value={summaryStats.avgLoad}
                precision={1}
                suffix="โครงงาน/คน"
                loading={loading}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="ภาระงานสูงสุด"
                value={summaryStats.maxLoad}
                suffix="โครงงาน"
                loading={loading}
                valueStyle={{ color: summaryStats.maxLoad > 10 ? '#ff4d4f' : '#faad14' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Charts */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card size="small" title="ภาระงานอาจารย์ที่ปรึกษา (แยกตามบทบาท)">
              {loading ? (
                <Skeleton active />
              ) : workloadChartData.length > 0 ? (
                <SimpleBarChart
                  data={workloadChartData}
                  xKey="advisor"
                  barKeys={['ที่ปรึกษาหลัก', 'ที่ปรึกษาร่วม']}
                  height={400}
                  showLabel
                  showLegend
                />
              ) : (
                <Empty description="ไม่มีข้อมูล" />
              )}
            </Card>
          </Col>
        </Row>

        {/* Advisor Table */}
        <Card size="small" title="รายละเอียดอาจารย์ที่ปรึกษา">
          <Table
            size="small"
            loading={loading}
            dataSource={advisorData}
            columns={advisorColumns}
            rowKey="teacherId"
            pagination={{ pageSize: 20, showTotal: (total) => `ทั้งหมด ${total} คน` }}
            scroll={{ x: 1000 }}
          />
        </Card>
      </Space>

      {/* Advisor Detail Modal */}
      <Modal
        title={
          <Space>
            <UserOutlined />
            <Text>รายละเอียดภาระงาน: {selectedAdvisor?.name || selectedAdvisor?.teacherCode}</Text>
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedAdvisor(null);
          setAdvisorDetail(null);
        }}
        footer={null}
        width={1000}
      >
        {detailLoading ? (
          <Skeleton active />
        ) : advisorDetail ? (
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {/* Teacher Info */}
            <Descriptions bordered column={2} size="small">
              <Descriptions.Item label="รหัสอาจารย์">
                {advisorDetail.teacher?.teacherCode}
              </Descriptions.Item>
              <Descriptions.Item label="ชื่อ">
                {advisorDetail.teacher?.name}
              </Descriptions.Item>
              <Descriptions.Item label="อีเมล">
                {advisorDetail.teacher?.email}
              </Descriptions.Item>
            </Descriptions>

            {/* Summary */}
            <Row gutter={16}>
              <Col span={8}>
                <Card>
                  <Statistic 
                    title="โครงงานทั้งหมด" 
                    value={advisorDetail.summary?.totalProjects || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic 
                    title="ที่ปรึกษาหลัก" 
                    value={advisorDetail.summary?.advisorProjectsCount || 0}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card>
                  <Statistic 
                    title="ที่ปรึกษาร่วม" 
                    value={advisorDetail.summary?.coAdvisorProjectsCount || 0}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Projects Table */}
            {advisorDetail.projects?.length > 0 && (
              <Card size="small" title={`โครงงานที่ดูแล (${advisorDetail.projects.length} โครงงาน)`}>
                <Table
                  size="small"
                  dataSource={advisorDetail.projects}
                  columns={[
                    {
                      title: 'ชื่อโครงงาน',
                      dataIndex: 'projectName',
                      key: 'projectName',
                      ellipsis: true,
                      width: 300
                    },
                    {
                      title: 'นักศึกษา',
                      dataIndex: 'members',
                      key: 'members',
                      width: 200,
                      render: (members) => (
                        <Space direction="vertical" size={0}>
                          {members?.map((member, idx) => (
                            <Text key={idx} style={{ fontSize: 12 }}>
                              {member.studentCode} - {member.name}
                            </Text>
                          ))}
                        </Space>
                      )
                    },
                    {
                      title: 'บทบาท',
                      dataIndex: 'role',
                      key: 'role',
                      width: 120,
                      render: (role) => {
                        const roleConfig = {
                          'advisor': { status: 'success', text: 'ที่ปรึกษาหลัก' },
                          'co-advisor': { status: 'processing', text: 'ที่ปรึกษาร่วม' }
                        };
                        const config = roleConfig[role] || { status: 'default', text: role };
                        return <Badge status={config.status} text={config.text} />;
                      }
                    },
                    {
                      title: 'สถานะ',
                      dataIndex: 'status',
                      key: 'status',
                      width: 120,
                      render: (status) => {
                        const statusConfig = {
                          'draft': { color: 'default', text: 'แบบร่าง' },
                          'pending': { color: 'warning', text: 'รออนุมัติ' },
                          'advisor_assigned': { color: 'processing', text: 'บันทึกที่ปรึกษา' },
                          'approved': { color: 'success', text: 'อนุมัติแล้ว' },
                          
                          'in_progress': { color: 'processing', text: 'กำลังดำเนินการ' },
                          'completed': { color: 'success', text: 'เสร็จสิ้น' },
                          'rejected': { color: 'error', text: 'ไม่อนุมัติ' }
                        };
                        const config = statusConfig[status] || { color: 'blue', text: status };
                        return <Tag color={config.color}>{config.text}</Tag>;
                      }
                    }
                  ]}
                  rowKey="projectId"
                  pagination={{ pageSize: 10, size: 'small', showSizeChanger: false }}
                  scroll={{ y: 300 }}
                />
              </Card>
            )}
          </Space>
        ) : (
          <Empty description="ไม่มีข้อมูล" />
        )}
      </Modal>
    </div>
  );
};

export default AdvisorWorkloadDetailReport;
