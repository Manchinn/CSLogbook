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
  Table,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'utils/dayjs';
import { fetchProjectPairs } from 'features/project/services/projectPairsService';
import { studentService } from 'features/user-management/services/studentService';
import AddProjectModal from 'features/project/components/admin-view/ProjectManagement/AddProjectModal';
import '../StudentList/styles.css';

const { Title, Text, Paragraph } = Typography;

const statusConfig = {
  draft: { label: 'ร่าง', color: 'default' },
  advisor_assigned: { label: 'มีอาจารย์ที่ปรึกษาแล้ว', color: 'geekblue' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'processing' },
  completed: { label: 'เสร็จสิ้น', color: 'success' },
  archived: { label: 'เก็บถาวร', color: 'magenta' }
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
    projectType: [],
    academicYear: '',
    semester: ''
  });
  const [drawerState, setDrawerState] = useState({ open: false, project: null });
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    academicYears: [],
    semesters: []
  });

  const loadProjectPairs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchProjectPairs({
        projectStatus: filters.status,
        documentStatus: filters.documentStatus,
        trackCodes: filters.trackCodes,
        projectType: filters.projectType,
        academicYear: filters.academicYear,
        semester: filters.semester
      });

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
  }, [filters]);

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const options = await studentService.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Error loading filter options:', error);
        // ใช้ค่าเริ่มต้นถ้าไม่สามารถดึงข้อมูลได้
        setFilterOptions({
          academicYears: [
            {
              value: new Date().getFullYear() + 543,
              label: `${new Date().getFullYear() + 543}`,
            },
          ],
          semesters: [
            { value: 1, label: "ภาคเรียนที่ 1" },
            { value: 2, label: "ภาคเรียนที่ 2" },
            { value: 3, label: "ภาคฤดูร้อน" },
          ],
        });
      }
    };

    loadFilterOptions();
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

  // Handler functions สำหรับ AddProjectModal
  const handleAddProject = useCallback(() => {
    setAddModalVisible(true);
  }, []);

  const handleAddModalCancel = useCallback(() => {
    setAddModalVisible(false);
  }, []);

  const handleAddModalSuccess = useCallback(() => {
    setAddModalVisible(false);
    loadProjectPairs(); // Refresh data หลังเพิ่มโครงงานสำเร็จ
    message.success('เพิ่มโครงงานพิเศษสำเร็จ');
  }, [loadProjectPairs]);

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
      title: 'หมวดโครงงานพิเศษ',
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
    <div className="admin-student-container project-pairs-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div>
          <Title level={3} className="title">ข้อมูลคู่โปรเจค</Title>
          <Text type="secondary">สรุปข้อมูลโครงงานและสมาชิกสำหรับเจ้าหน้าที่ภาควิชาวิทยาการคอมพิวเตอร์</Text>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          size="large"
          onClick={handleAddProject}
        >
          เพิ่มโครงงานพิเศษ
        </Button>
      </div>
      <div className="statistics-chips">
        <div className="statistic-item" key="total-projects">
          <Space direction="vertical" size={0}>
            <Text type="secondary">จำนวนโครงงานทั้งหมด</Text>
            <Title level={4} style={{ margin: 0 }}>{summary.total}</Title>
          </Space>
        </div>
        {statusSummaryItems.map((item) => (
          <div className="statistic-item" key={item.statusKey}>
            <Space direction="vertical" size={0}>
              <Text type="secondary">{item.label}</Text>
              <Title level={4} style={{ margin: 0 }}>{item.value}</Title>
            </Space>
          </div>
        ))}
      </div>

      <Card variant="borderless" style={{ padding: 0 }}>
        <div className="filter-section">
          {/* แถวแรก: Search, Academic Year, Semester */}
          <Row gutter={[16, 16]} style={{ width: '100%', marginBottom: '16px' }}>
            {/* Search Input */}
            <Col xs={24} sm={24} md={16} lg={12} xl={16}>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder="ค้นหาชื่อโครงงาน รหัสนักศึกษา หรืออาจารย์ที่ปรึกษา"
                value={filters.query}
                onChange={(event) => setFilters((prev) => ({ ...prev, query: event.target.value }))}
              />
            </Col>
            
            {/* Academic Year & Semester - ให้พื้นที่มากขึ้น */}
            <Col xs={12} sm={12} md={4} lg={6} xl={4}>
              <Select
                value={filters.academicYear}
                placeholder="ปีการศึกษา"
                allowClear
                options={filterOptions.academicYears?.map((year) => ({
                  label: year.label || `ปีการศึกษา ${year.value}`,
                  value: year.value
                })) || []}
                onChange={(value) => setFilters((prev) => ({ ...prev, academicYear: value }))}
                style={{ width: '100%' }}
                size="middle"
              />
            </Col>
            <Col xs={12} sm={12} md={4} lg={6} xl={4}>
              <Select
                value={filters.semester}
                placeholder="ภาคเรียน"
                allowClear
                options={filterOptions.semesters?.map((semester) => ({
                  label: semester.label || `ภาคเรียนที่ ${semester.value}`,
                  value: semester.value
                })) || []}
                onChange={(value) => setFilters((prev) => ({ ...prev, semester: value }))}
                style={{ width: '100%' }}
                size="middle"
              />
            </Col>
          </Row>

          {/* แถวที่สอง: Status, Track, Project Type, Refresh Button */}
          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            {/* Status Filter */}
            <Col xs={24} sm={12} md={8} lg={6} xl={6}>
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
                size="middle"
                maxTagCount="responsive"
              />
            </Col>
            
            {/* Track Filter */}
            <Col xs={24} sm={12} md={8} lg={6} xl={6}>
              <Select
                mode="multiple"
                value={filters.trackCodes}
                placeholder="หมวดโครงงานพิเศษ"
                allowClear
                options={trackOptions}
                onChange={(value) => setFilters((prev) => ({ ...prev, trackCodes: value }))}
                style={{ width: '100%' }}
                size="middle"
                maxTagCount="responsive"
              />
            </Col>
            
            {/* Project Type Filter */}
            <Col xs={24} sm={12} md={8} lg={6} xl={6}>
              <Select
                mode="multiple"
                value={filters.projectType}
                placeholder="ประเภทโครงงาน"
                allowClear
                options={projectTypeOptions}
                onChange={(value) => setFilters((prev) => ({ ...prev, projectType: value }))}
                style={{ width: '100%' }}
                size="middle"
                maxTagCount="responsive"
              />
            </Col>
            
            {/* Refresh Button */}
            <Col xs={24} sm={12} md={8} lg={6} xl={6}>
              <Button
                block
                icon={<ReloadOutlined />}
                onClick={loadProjectPairs}
                loading={loading}
                size="middle"
              >
                รีเฟรช
              </Button>
            </Col>
          </Row>
        </div>

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
      </Card>

      <Drawer
        className="student-drawer"
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
              <Descriptions.Item label="สถานะโครงงาน">
                {getStatusTag(drawerState.project.status)}
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
              <Descriptions.Item label="หมวดโครงงานพิเศษ">
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
      {/* Add Project Modal */}
    <AddProjectModal
      visible={addModalVisible}
      onCancel={handleAddModalCancel}
      onSuccess={handleAddModalSuccess}
    />
    </div>
  );
};

export default ProjectPairsPage;
