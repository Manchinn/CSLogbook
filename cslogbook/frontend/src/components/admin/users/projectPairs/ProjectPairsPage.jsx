import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Input,
  List,
  message,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import {
  BarChartOutlined,
  ReloadOutlined,
  SearchOutlined,
  TeamOutlined
} from '@ant-design/icons';
import dayjs from '../../../../utils/dayjs';
import { fetchProjectPairs } from '../../../../services/projectPairsService';

const { Title, Text, Paragraph } = Typography;

const statusConfig = {
  draft: { label: 'ร่าง', color: 'default' },
  advisor_assigned: { label: 'มีอาจารย์ที่ปรึกษาแล้ว', color: 'geekblue' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'processing' },
  completed: { label: 'เสร็จสิ้น', color: 'success' },
  archived: { label: 'เก็บถาวร', color: 'magenta' }
};

const documentStatusConfig = {
  draft: { label: 'ร่างเอกสาร', color: 'default' },
  pending: { label: 'รอตรวจ', color: 'warning' },
  approved: { label: 'อนุมัติแล้ว', color: 'success' },
  rejected: { label: 'ต้องแก้ไข', color: 'error' },
  supervisor_evaluated: { label: 'อาจารย์ประเมินแล้ว', color: 'processing' },
  acceptance_approved: { label: 'ผ่านการตรวจสอบ', color: 'geekblue' },
  referral_ready: { label: 'พร้อมออกหนังสือส่งตัว', color: 'cyan' },
  referral_downloaded: { label: 'ดาวน์โหลดหนังสือแล้ว', color: 'purple' },
  completed: { label: 'จบกระบวนการ', color: 'success' }
};

const projectTypeLabels = {
  govern: 'โครงงานร่วมภาครัฐ',
  private: 'โครงงานร่วมเอกชน',
  research: 'โครงงานวิจัย'
};

const trackLabels = {
  NETSEC: 'Cyber Security',
  WEBMOBILE: 'Web & Mobile',
  SMART: 'Smart System',
  AI: 'Artificial Intelligence',
  GAMEMEDIA: 'Game & Media'
};

const statusOrder = ['draft', 'advisor_assigned', 'in_progress', 'completed', 'archived'];

const getStatusTag = (status) => {
  if (!status) {
    return <Tag>-</Tag>;
  }
  const config = statusConfig[status] || { label: status, color: 'default' };
  return <Tag color={config.color}>{config.label}</Tag>;
};

const getDocumentStatusTag = (status) => {
  if (!status) {
    return <Tag>-</Tag>;
  }
  const config = documentStatusConfig[status] || { label: status, color: 'default' };
  return <Tag color={config.color}>{config.label}</Tag>;
};

const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }
  return dayjs(value).format('DD MMM BBBB HH:mm น.');
};

const ProjectPairsPage = () => {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [summary, setSummary] = useState({ total: 0, statusCounts: {} });
  const [filters, setFilters] = useState({
    query: '',
    status: [],
    documentStatus: [],
    trackCodes: [],
    projectType: []
  });
  const [drawerState, setDrawerState] = useState({ open: false, project: null });

  const loadProjectPairs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchProjectPairs();
      if (!response.success) {
        message.error('ไม่สามารถดึงข้อมูลคู่โปรเจคได้');
        setProjects([]);
        setSummary({ total: 0, statusCounts: {} });
        return;
      }

      setProjects(response.data);

      const statusCounts = response.data.reduce((acc, item) => {
        const key = item.status || 'unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      setSummary({ total: response.total ?? response.data.length, statusCounts });
    } catch (error) {
      console.error('loadProjectPairs error', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลคู่โปรเจค');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjectPairs();
  }, [loadProjectPairs]);

  const trackOptions = useMemo(() => {
    const uniqueTracks = new Set();
    projects.forEach((project) => {
      (project.tracks || []).forEach((track) => uniqueTracks.add(track));
    });
    return Array.from(uniqueTracks).map((track) => ({
      label: trackLabels[track] || track,
      value: track
    }));
  }, [projects]);

  const projectTypeOptions = useMemo(() => {
    const uniqueTypes = new Set(projects.map((project) => project.projectType).filter(Boolean));
    return Array.from(uniqueTypes).map((type) => ({
      label: projectTypeLabels[type] || type,
      value: type
    }));
  }, [projects]);

  // ฟังก์ชันช่วยสำหรับการกรอง (กรณีตรรกะซับซ้อนจึงใส่คอมเมนต์ภาษาไทย)
  const filteredProjects = useMemo(() => {
    const searchText = filters.query.trim().toLowerCase();

    return projects.filter((project) => {
      // 1) ตรวจสอบคำค้นหาเทียบกับชื่อโครงงาน, โค้ด, ชื่ออาจารย์ และชื่อสมาชิก
      const searchMatches = !searchText
        || [
          project.projectNameTh,
          project.projectNameEn,
          project.projectCode,
          project.advisor?.fullName,
          project.coAdvisor?.fullName,
          ...(project.members || []).flatMap((member) => [
            member.fullName,
            member.studentCode
          ])
        ]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(searchText));

      if (!searchMatches) {
        return false;
      }

      // 2) กรองตามสถานะโครงงาน
      if (filters.status.length && !filters.status.includes(project.status)) {
        return false;
      }

      // 3) กรองตามสถานะเอกสาร
      if (filters.documentStatus.length && !filters.documentStatus.includes(project.documentStatus)) {
        return false;
      }

      // 4) กรองตามแทร็ก (ต้องมีอย่างน้อยหนึ่งรายการที่ตรง)
      if (filters.trackCodes.length) {
        const projectTracks = project.tracks || [];
        const hasTrack = projectTracks.some((track) => filters.trackCodes.includes(track));
        if (!hasTrack) {
          return false;
        }
      }

      // 5) กรองตามประเภทโครงงาน
      if (filters.projectType.length && !filters.projectType.includes(project.projectType)) {
        return false;
      }

      return true;
    });
  }, [filters, projects]);

  const statusSummaryItems = useMemo(() => statusOrder.map((statusKey) => ({
    statusKey,
    label: statusConfig[statusKey]?.label || statusKey,
    value: summary.statusCounts[statusKey] || 0
  })), [summary.statusCounts]);

  const openDrawer = useCallback((project) => {
    setDrawerState({ open: true, project });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerState({ open: false, project: null });
  }, []);

  const columns = useMemo(() => [
    {
      title: 'โครงงาน',
      dataIndex: 'projectNameTh',
      key: 'projectName',
      width: 320,
      sorter: (a, b) => (a.projectNameTh || '').localeCompare(b.projectNameTh || ''),
      render: (_, record) => (
        <Space direction="vertical" size={2}>
          <Text strong>{record.projectNameTh || '-'}</Text>
          {record.projectNameEn && (
            <Text type="secondary">{record.projectNameEn}</Text>
          )}
          <Space size={4} wrap>
            {record.projectCode && <Tag color="default">{record.projectCode}</Tag>}
            {record.projectType && (
              <Tag color="gold">{projectTypeLabels[record.projectType] || record.projectType}</Tag>
            )}
          </Space>
        </Space>
      )
    },
    {
      title: 'สถานะโครงงาน',
      dataIndex: 'status',
      key: 'status',
      width: 160,
      render: (value) => getStatusTag(value)
    },
    {
      title: 'สถานะเอกสาร',
      dataIndex: 'documentStatus',
      key: 'documentStatus',
      width: 160,
      render: (value) => getDocumentStatusTag(value)
    },
    {
      title: 'สมาชิกโครงงาน',
      dataIndex: 'members',
      key: 'members',
      width: 320,
      render: (members) => (
        <Space direction="vertical" size={4}>
          {(members || []).length ? (
            members.map((member) => (
              <Text key={`${member.studentId || member.studentCode || member.email}`}>
                <Tag color={member.role === 'leader' ? 'geekblue' : 'blue'} style={{ marginRight: 6 }}>
                  {member.role === 'leader' ? 'หัวหน้าทีม' : 'สมาชิก'}
                </Tag>
                {member.fullName || '-'}
                {member.studentCode ? ` (${member.studentCode})` : ''}
              </Text>
            ))
          ) : (
            <Text type="secondary">-</Text>
          )}
        </Space>
      )
    },
    {
      title: 'ที่ปรึกษา',
      dataIndex: 'advisor',
      key: 'advisor',
      width: 220,
      render: (advisor, record) => (
        <Space direction="vertical" size={2}>
          <Text>{advisor?.fullName || '-'}</Text>
          {advisor?.position && (
            <Text type="secondary">{advisor.position}</Text>
          )}
          {record.coAdvisor?.fullName && (
            <Tooltip title="อาจารย์ที่ปรึกษาร่วม">
              <Tag color="purple">{record.coAdvisor.fullName}</Tag>
            </Tooltip>
          )}
        </Space>
      )
    },
    {
      title: 'แทร็ก',
      dataIndex: 'tracks',
      key: 'tracks',
      width: 200,
      render: (tracks) => (
        <Space size={4} wrap>
          {(tracks || []).length ? (
            tracks.map((track) => (
              <Tag key={track} color="cyan">{trackLabels[track] || track}</Tag>
            ))
          ) : (
            <Text type="secondary">-</Text>
          )}
        </Space>
      )
    },
    {
      title: 'อัปเดตล่าสุด',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 160,
      sorter: (a, b) => new Date(a.updatedAt || 0) - new Date(b.updatedAt || 0),
      render: (value) => formatDateTime(value)
    },
    {
      title: 'เพิ่มเติม',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Button type="link" onClick={() => openDrawer(record)}>
          ดูรายละเอียด
        </Button>
      )
    }
  ], [openDrawer]);

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      <div>
        <Title level={3} style={{ marginBottom: 0 }}>ข้อมูลคู่โปรเจค</Title>
        <Text type="secondary">สรุปข้อมูลโครงงานและสมาชิกสำหรับเจ้าหน้าที่ภาควิชาวิทยาการคอมพิวเตอร์</Text>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <Statistic
              title="จำนวนโครงงานทั้งหมด"
              value={summary.total}
              prefix={<ProjectPairsHeadlineIcon />}
            />
          </Card>
        </Col>
        {statusSummaryItems.map((item) => (
          <Col xs={24} md={8} lg={4} key={item.statusKey}>
            <Card>
              <Space direction="vertical" size={0}>
                <Text type="secondary">{item.label}</Text>
                <Title level={4} style={{ margin: 0 }}>{item.value}</Title>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={10}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="ค้นหาชื่อโครงงาน รหัสนักศึกษา หรืออาจารย์ที่ปรึกษา"
                value={filters.query}
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              />
            </Col>
            <Col xs={24} lg={3}>
              <Select
                mode="multiple"
                value={filters.status}
                placeholder="สถานะโครงงาน"
                allowClear
                options={statusOrder.map((statusKey) => ({
                  label: statusConfig[statusKey]?.label || statusKey,
                  value: statusKey
                }))}
                onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} lg={3}>
              <Select
                mode="multiple"
                value={filters.documentStatus}
                placeholder="สถานะเอกสาร"
                allowClear
                options={Object.keys(documentStatusConfig).map((statusKey) => ({
                  label: documentStatusConfig[statusKey].label,
                  value: statusKey
                }))}
                onChange={(value) => setFilters((prev) => ({ ...prev, documentStatus: value }))}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} lg={3}>
              <Select
                mode="multiple"
                value={filters.trackCodes}
                placeholder="Track"
                allowClear
                options={trackOptions}
                onChange={(value) => setFilters((prev) => ({ ...prev, trackCodes: value }))}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} lg={3}>
              <Select
                mode="multiple"
                value={filters.projectType}
                placeholder="ประเภทโครงงาน"
                allowClear
                options={projectTypeOptions}
                onChange={(value) => setFilters((prev) => ({ ...prev, projectType: value }))}
                style={{ width: '100%' }}
              />
            </Col>
            <Col xs={24} lg={2}>
              <Button
                block
                icon={<ReloadOutlined />}
                onClick={loadProjectPairs}
                loading={loading}
              >
                รีเฟรช
              </Button>
            </Col>
          </Row>

          <Table
            rowKey={(record) => record.projectId || record.projectCode || `${record.projectNameTh}-${record.createdAt}`}
            dataSource={filteredProjects}
            columns={columns}
            loading={loading}
            scroll={{ x: 1200 }}
            locale={{ emptyText: <Empty description="ไม่พบข้อมูลโครงงาน" /> }}
            pagination={{
              showSizeChanger: true,
              defaultPageSize: 10,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `ทั้งหมด ${total} รายการ`
            }}
          />
        </Space>
      </Card>

      <Drawer
        title={`รายละเอียดโครงงาน: ${drawerState.project?.projectNameTh || '-'}`}
        width={720}
        open={drawerState.open}
        onClose={closeDrawer}
      >
        {drawerState.project ? (
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="ชื่อภาษาอังกฤษ">
                {drawerState.project.projectNameEn || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="รหัสโครงงาน">
                {drawerState.project.projectCode || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="สถานะโครงงาน">
                {getStatusTag(drawerState.project.status)}
              </Descriptions.Item>
              <Descriptions.Item label="สถานะเอกสาร">
                {getDocumentStatusTag(drawerState.project.documentStatus)}
              </Descriptions.Item>
              <Descriptions.Item label="ประเภทโครงงาน">
                {projectTypeLabels[drawerState.project.projectType] || drawerState.project.projectType || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="ที่ปรึกษา">
                {drawerState.project.advisor?.fullName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="ที่ปรึกษาร่วม">
                {drawerState.project.coAdvisor?.fullName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Track">
                {(drawerState.project.tracks || []).length ? (
                  <Space wrap>
                    {drawerState.project.tracks.map((track) => (
                      <Tag key={track} color="cyan">{trackLabels[track] || track}</Tag>
                    ))}
                  </Space>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="สร้างเมื่อ">
                {formatDateTime(drawerState.project.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="อัปเดตล่าสุด">
                {formatDateTime(drawerState.project.updatedAt)}
              </Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">รายละเอียดโครงงาน</Divider>
            <List
              dataSource={[{
                title: 'วัตถุประสงค์',
                content: drawerState.project.objective
              }, {
                title: 'ที่มา / ปัญหา',
                content: drawerState.project.background
              }, {
                title: 'ขอบเขตงาน',
                content: drawerState.project.scope
              }, {
                title: 'ผลลัพธ์ที่คาดหวัง',
                content: drawerState.project.expectedOutcome
              }, {
                title: 'ประโยชน์ที่คาดว่าจะได้รับ',
                content: drawerState.project.benefit
              }, {
                title: 'กระบวนการ/เทคโนโลยีที่ใช้',
                content: drawerState.project.methodology || drawerState.project.tools
              }, {
                title: 'Timeline/หมายเหตุ',
                content: drawerState.project.timelineNote
              }, {
                title: 'ข้อจำกัด/ความเสี่ยง',
                content: drawerState.project.constraints || drawerState.project.risk
              }]
                .filter((item) => item.content)
              }
              renderItem={(item) => (
                <List.Item>
                  <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Text strong>{item.title}</Text>
                    <Paragraph style={{ whiteSpace: 'pre-wrap' }}>{item.content}</Paragraph>
                  </Space>
                </List.Item>
              )}
              locale={{ emptyText: 'ไม่มีรายละเอียดเพิ่มเติม' }}
            />

            <Divider orientation="left">สมาชิกโครงงาน</Divider>
            <List
              dataSource={drawerState.project.members || []}
              renderItem={(member) => (
                <List.Item>
                  <Space direction="vertical" size={2} style={{ width: '100%' }}>
                    <Text strong>
                      {member.fullName || '-'}
                      {member.studentCode ? ` (${member.studentCode})` : ''}
                    </Text>
                    <Space size={4} wrap>
                      <Tag color={member.role === 'leader' ? 'geekblue' : 'blue'}>
                        {member.role === 'leader' ? 'หัวหน้าทีม' : 'สมาชิก'}
                      </Tag>
                      {member.classroom && <Tag color="default">ห้อง {member.classroom}</Tag>}
                      {typeof member.isEligibleProject === 'boolean' && (
                        <Tag color={member.isEligibleProject ? 'success' : 'error'}>
                          {member.isEligibleProject ? 'ผ่านเกณฑ์โครงงาน' : 'ยังไม่ผ่านเกณฑ์โครงงาน'}
                        </Tag>
                      )}
                      {typeof member.isEligibleInternship === 'boolean' && (
                        <Tag color={member.isEligibleInternship ? 'success' : 'error'}>
                          {member.isEligibleInternship ? 'ผ่านเกณฑ์ฝึกงาน' : 'ยังไม่ผ่านเกณฑ์ฝึกงาน'}
                        </Tag>
                      )}
                    </Space>
                    {member.email && <Text type="secondary">อีเมล: {member.email}</Text>}
                    {member.phoneNumber && <Text type="secondary">โทร: {member.phoneNumber}</Text>}
                  </Space>
                </List.Item>
              )}
              locale={{ emptyText: 'ยังไม่มีข้อมูลสมาชิก' }}
            />
          </Space>
        ) : (
          <Empty description="ไม่พบข้อมูลโครงงาน" />
        )}
      </Drawer>
    </Space>
  );
};

const ProjectPairsHeadlineIcon = () => (
  <Space size={4}>
    <TeamOutlined />
    <BarChartOutlined />
  </Space>
);

export default ProjectPairsPage;
