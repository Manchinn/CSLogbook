import React, { useMemo, useState, useEffect } from 'react';
import { Card, Typography, Space, Spin, Tag, List, Avatar, Row, Col } from 'antd';
import { UserOutlined, TeamOutlined, ProfileOutlined, ClockCircleOutlined } from '@ant-design/icons';
import dayjs from '../../utils/dayjs';
import useStudentProject from '../../hooks/useStudentProject';
import DeadlineAlert from '../common/DeadlineAlert';
import DeadlineCountdown from '../common/DeadlineCountdown';
// import UpcomingDeadlines from '../common/UpcomingDeadlines';
import projectWorkflowStateService from '../../services/projectWorkflowStateService';

const { Title, Text, Paragraph } = Typography;

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const statusMeta = {
  draft: { label: 'ฉบับร่าง', color: 'default' },
  advisor_assigned: { label: 'รอเริ่มดำเนินงาน', color: 'blue' },
  in_progress: { label: 'กำลังดำเนินการ', color: 'processing' },
  completed: { label: 'เสร็จสิ้น', color: 'green' },
  archived: { label: 'ถูกเก็บถาวร', color: 'purple' },
  failed: { label: 'ไม่ผ่าน', color: 'red' },
};

const renderMemberRole = (role) => {
  if (!role) return 'สมาชิก';
  const normalized = String(role).toLowerCase();
  if (normalized === 'leader') return 'หัวหน้าโครงงาน';
  if (normalized === 'member') return 'สมาชิก';
  return role;
};

const renderProjectStatus = (status) => {
  if (!status) return <Tag>ไม่ระบุสถานะ</Tag>;
  const meta = statusMeta[status] || { label: status, color: 'default' };
  return <Tag color={meta.color}>{meta.label}</Tag>;
};

// หา label แสดงผลของอาจารย์จากรายการที่ hook โหลดมา
const findAdvisorLabel = (teacherId, advisorList = []) => {
  if (!teacherId) return null;
  const match = advisorList.find((advisor) => String(advisor.teacherId) === String(teacherId));
  if (!match) return null;
  const thaiName = [match.firstName, match.lastName].filter(Boolean).join(' ').trim();
  if (thaiName) return thaiName;
  if (match.teacherCode) return match.teacherCode;
  return `รหัส ${teacherId}`;
};

// ประกอบชื่ออาจารย์หลักให้เหมาะกับข้อมูลที่มีในระบบ
const buildAdvisorName = (project, advisorList = []) => {
  if (!project) return 'ยังไม่ระบุ';
  const explicitName =
    project.advisorName ||
    project.advisorFullName ||
    project.advisor?.fullName ||
    project.advisor?.displayName ||
    project.advisor?.name;
  if (explicitName) return explicitName;
  const inferred = findAdvisorLabel(project.advisorId, advisorList);
  if (inferred) return inferred;
  if (project.advisorId) return `รหัส ${project.advisorId}`;
  return 'ยังไม่ระบุ';
};

// ชื่ออาจารย์ร่วมอาจไม่มีเสมอ จึงคืน null เมื่อไม่พบ
const buildCoAdvisorName = (project, advisorList = []) => {
  if (!project) return null;
  const explicitName =
    project.coAdvisorName ||
    project.coAdvisorFullName ||
    project.coAdvisor?.fullName ||
    project.coAdvisor?.displayName ||
    project.coAdvisor?.name;
  if (explicitName) return explicitName;
  const inferred = findAdvisorLabel(project.coAdvisorId, advisorList);
  if (inferred) return inferred;
  if (project.coAdvisorId) return `รหัส ${project.coAdvisorId}`;
  return null;
};

const renderTracks = (project) => {
  if (!project?.tracks || project.tracks.length === 0) return <Tag color="default">ยังไม่เลือกหมวด</Tag>;
  return (
    <Space size={4} wrap>
      {project.tracks.map((track) => (
        <Tag key={track.trackCode || track} color="geekblue">
          {track.trackLabel || track.trackCode || track}
        </Tag>
      ))}
    </Space>
  );
};

const ProjectDashboard = () => {
  const {
    activeProject,
    advisors,
    projects,
    loading,
  } = useStudentProject();

  const [projectState, setProjectState] = useState(null);
  const [loadingDeadlines, setLoadingDeadlines] = useState(false);

  const members = useMemo(() => (
    Array.isArray(activeProject?.members) ? activeProject.members : []
  ), [activeProject?.members]);

  // โหลด workflow state พร้อม deadlines
  useEffect(() => {
    const projectId = activeProject?.projectId;
    
    // ตรวจสอบว่า projectId เป็นตัวเลขที่ valid - ตรวจสอบให้ละเอียดขึ้น
    if (projectId === undefined || projectId === null) {
      setProjectState(null);
      return;
    }

    // แปลงเป็นตัวเลขและตรวจสอบ
    const numProjectId = Number(projectId);
    if (isNaN(numProjectId) || numProjectId <= 0 || !Number.isInteger(numProjectId)) {
      console.warn('Invalid projectId format:', projectId, 'parsed as:', numProjectId);
      setProjectState(null);
      return;
    }

    const fetchProjectState = async () => {
      try {
        setLoadingDeadlines(true);
        const response = await projectWorkflowStateService.getProjectStateWithDeadlines(
          numProjectId
        );
        setProjectState(response.data);
      } catch (error) {
        // Log error แต่ไม่แสดงให้ user เพื่อไม่รบกวน UX
        // Error 400 จะถูกจัดการโดย backend validation
        console.error('Error fetching project state with deadlines:', error);
        setProjectState(null);
      } finally {
        setLoadingDeadlines(false);
      }
    };
    
    fetchProjectState();
  }, [activeProject?.projectId]);

  const updatedAtText = useMemo(() => {
    if (!activeProject?.updatedAt && !activeProject?.updated_at) return null;
    const ts = activeProject.updatedAt || activeProject.updated_at;
    return dayjs(ts).format('D MMM BBBB เวลา HH:mm น.');
  }, [activeProject?.updatedAt, activeProject?.updated_at]);

  const createdAtText = useMemo(() => {
    if (!activeProject?.createdAt && !activeProject?.created_at) return null;
    const ts = activeProject.createdAt || activeProject.created_at;
    return dayjs(ts).format('D MMM BBBB เวลา HH:mm น.');
  }, [activeProject?.createdAt, activeProject?.created_at]);

  const advisorName = useMemo(() => buildAdvisorName(activeProject, advisors), [activeProject, advisors]);
  const coAdvisorName = useMemo(() => buildCoAdvisorName(activeProject, advisors), [activeProject, advisors]);

  return (
      <Card>
        <Space direction="vertical" size={16} style={containerStyle}>
          <Title level={4} style={{ margin: 0 }}>📘 แผงสรุปโครงงานพิเศษ</Title>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
              <Spin spinning={true} tip="กำลังโหลดข้อมูลโครงงาน">
        <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>{/* Loading content */}</div>
        </div>
      </Spin>
            </div>
          ) : !activeProject ? (
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              ยังไม่พบข้อมูลโครงงานของคุณ หากคุณเพิ่งสมัครหรือส่งคำขอ โปรดรอสักครู่แล้วรีเฟรชอีกครั้ง
            </Paragraph>
          ) : (
            <Space direction="vertical" size={20} style={{ width: '100%' }}>
              {/* Deadline Alerts */}
              {!loadingDeadlines && projectState?.deadlines && (
                <>
                  {/* Overdue Alert */}
                  {projectState.deadlines.overdue && projectState.deadlines.overdue.length > 0 && (
                    <DeadlineAlert 
                      deadlines={projectState.deadlines.overdue} 
                      type="overdue" 
                    />
                  )}

                  {/* Deadline Countdown & Upcoming Deadlines */}
                  <Row gutter={16}>
                    {projectState.deadlines.next && (
                      <Col xs={24} lg={12}>
                        <DeadlineCountdown deadline={projectState.deadlines.next} />
                      </Col>
                    )}
                    {/* {projectState.deadlines.upcoming && projectState.deadlines.upcoming.length > 0 && (
                      <Col xs={24} lg={projectState.deadlines.next ? 12 : 24}>
                        <UpcomingDeadlines 
                          deadlines={projectState.deadlines.upcoming} 
                          maxItems={5}
                          title="Deadline โครงงาน"
                        />
                      </Col>
                    )} */}
                  </Row>
                </>
              )}

              <div>
                <Title level={5} style={{ marginBottom: 8 }}>รายละเอียดโครงงาน</Title>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Text strong>{activeProject.projectNameTh || 'ยังไม่ตั้งชื่อ (TH)'}</Text>
                    <Tag color="default">TH</Tag>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Text>{activeProject.projectNameEn || 'ยังไม่ตั้งชื่อ (EN)'}</Text>
                    <Tag color="default">EN</Tag>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Text strong>สถานะ:</Text>
                    {renderProjectStatus(activeProject.status)}
                    {activeProject.examResult && (
                      <Tag color={activeProject.examResult === 'passed' ? 'green' : 'red'}>
                        ผลสอบ: {activeProject.examResult === 'passed' ? 'ผ่าน' : 'ไม่ผ่าน'}
                      </Tag>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                    <Text strong>หมวด:</Text>
                    {renderTracks(activeProject)}
                  </div>
                  <Space size={12} wrap>
                    <Tag icon={<ProfileOutlined />} color="blue">
                      ปีการศึกษา {activeProject.academicYear || '-'} / ภาคเรียน {activeProject.semester || '-'}
                    </Tag>
                    {createdAtText && (
                      <Tag icon={<ClockCircleOutlined />} color="default">
                        สร้างเมื่อ {createdAtText}
                      </Tag>
                    )}
                    {updatedAtText && (
                      <Tag icon={<ClockCircleOutlined />} color="default">
                        อัปเดตล่าสุด {updatedAtText}
                      </Tag>
                    )}
                  </Space>
                </Space>
              </div>

              <div>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Title level={5} style={{ margin: 0 }}>อาจารย์ที่ปรึกษา</Title>
                  <Space size={6} wrap>
                    <Tag color="processing">อาจารย์หลัก: {advisorName}</Tag>
                    {coAdvisorName && (
                      <Tag color="default">อาจารย์ร่วม: {coAdvisorName}</Tag>
                    )}
                  </Space>
                </Space>
              </div>

              <div>
                <Space align="baseline" size={8} style={{ marginBottom: 8 }}>
                  <Title level={5} style={{ margin: 0 }}>ทีมโครงงาน</Title>
                  <Tag icon={<TeamOutlined />} color="purple">{members.length} คน</Tag>
                </Space>
                <List
                  size="small"
                  bordered
                  dataSource={members}
                  locale={{ emptyText: 'ยังไม่มีสมาชิก' }}
                  renderItem={(member) => {
                    const user = member?.student || member?.user || member;
                    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || `รหัส ${user?.studentCode || '-'}`;
                    return (
                      <List.Item>
                        <Space size={12} align="center">
                          <Avatar icon={<UserOutlined />} />
                          <div>
                            <div style={{ fontWeight: 500 }}>{displayName}</div>
                            <Text type="secondary" style={{ fontSize: 12 }}>{renderMemberRole(member?.role)}</Text>
                          </div>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
              </div>

              {Array.isArray(projects) && projects.length > 1 && (
                <Paragraph type="secondary" style={{ marginBottom: 0 }}>
                  * คุณมีโครงงาน {projects.length} รายการในระบบ ขณะนี้แสดงเฉพาะรายการล่าสุด หากต้องการสลับโปรเจกต์ โปรดติดต่อเจ้าหน้าที่ให้ช่วยดำเนินการชั่วคราว
                </Paragraph>
              )}
            </Space>
          )}
        </Space>
      </Card>
  );
};

export default ProjectDashboard;
