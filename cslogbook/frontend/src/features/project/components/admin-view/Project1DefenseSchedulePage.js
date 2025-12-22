import React, { useMemo, useCallback, useState } from 'react';
import {
  Card,
  Table,
  Space,
  Typography,
  Button,
  Select,
  Input,
  Switch,
  Tag,
  Drawer,
  Descriptions,
  Divider,
  message,
  Alert,
  Spin
} from 'antd';
import {
  ReloadOutlined,
  CalendarOutlined,
  TeamOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useTopicExamOverview } from 'hooks/useTopicExamOverview';
import projectService from 'features/project/services/projectService';
import dayjs from 'utils/dayjs';

const { Title, Text } = Typography;

// ฟังก์ชันช่วยสร้าง label แสดงกำหนดการนัดสอบ
function formatScheduleLabel(record) {
  if (!record?.defenseScheduledAt) return '-';
  const dt = dayjs(record.defenseScheduledAt);
  return dt.isValid() ? dt.format('DD MMM BBBB HH:mm น.') : '-';
}

const DEFAULT_FILTERS = {
  status: 'in_progress',
  search: '',
  readyOnly: false
};

const Project1DefenseSchedulePage = () => {
  const { records, filters, updateFilters, loading, error, reload, meta } = useTopicExamOverview(DEFAULT_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);
  const [activeDefense, setActiveDefense] = useState(undefined);
  const [defenseCache, setDefenseCache] = useState({}); // เก็บ cache คำขอสอบตาม projectId เพื่อลดการยิง API ซ้ำ
  const [rowLoading, setRowLoading] = useState({}); // เก็บสถานะการโหลดราย project สำหรับแสดง spinner

  const academicYearOptions = useMemo(() => {
    const years = meta?.availableAcademicYears || [];
    return years.map((year) => ({ value: year, label: `${year}` }));
  }, [meta?.availableAcademicYears]);

  const semesterOptions = useMemo(() => {
    if (!filters.academicYear) return [];
    const mapping = meta?.availableSemestersByYear || {};
    const semesters = mapping[filters.academicYear] || [];
    return semesters.map((sem) => ({ value: sem, label: `ภาคเรียนที่ ${sem}` }));
  }, [filters.academicYear, meta?.availableSemestersByYear]);

  const setRowLoadingState = useCallback((projectId, value) => {
    setRowLoading((prev) => ({ ...prev, [projectId]: value }));
  }, []);

  // ดึงข้อมูลคำขอสอบจาก backend แบบ lazy load และเก็บไว้ใน cache
  const fetchDefenseRecord = useCallback(async (projectId, { force = false } = {}) => {
    const hasCache = Object.prototype.hasOwnProperty.call(defenseCache, projectId);
    if (!force && hasCache) {
      return defenseCache[projectId];
    }

    try {
      setRowLoadingState(projectId, true);
      const response = await projectService.getProject1DefenseRequest(projectId);
      const record = response?.data ?? null;
      setDefenseCache((prev) => ({ ...prev, [projectId]: record }));
      return record;
    } catch (err) {
      const messageText = err?.message || 'โหลดข้อมูลคำขอสอบล้มเหลว';
      message.error(messageText);
      return undefined;
    } finally {
      setRowLoadingState(projectId, false);
    }
  }, [defenseCache, setRowLoadingState]);

  const openDrawer = useCallback(async (project) => {
    setActiveProject(project);
    setDrawerOpen(true);
    // โหลดคำขอสอบ (lazy load)
    const record = await fetchDefenseRecord(project.projectId);
    setActiveDefense(record);
  }, [fetchDefenseRecord]);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setActiveProject(null);
    setActiveDefense(undefined);
  }, []);

  const renderMembers = useCallback((members = []) => (
    <Space direction="vertical" size={2}>
      {members.map((member) => (
        <Text key={member.studentId || member.studentCode}>{member.studentCode || '-'} – {member.name || 'ไม่ทราบชื่อ'}</Text>
      ))}
    </Space>
  ), []);

  const renderAdvisor = useCallback((advisor, coAdvisor) => {
    if (!advisor && !coAdvisor) return <Text type="secondary">ยังไม่ระบุ</Text>;
    return (
      <Space direction="vertical" size={0}>
        {advisor && <Text>{advisor.name || '-'}</Text>}
        {coAdvisor && <Text type="secondary">ร่วม: {coAdvisor.name || '-'}</Text>}
      </Space>
    );
  }, []);

  // แสดงสถานะคำขอสอบด้วยแท็กสีเพื่อให้เจ้าหน้าที่เห็นภาพรวมทันที
  const renderDefenseStatus = useCallback((projectId) => {
    if (!Object.prototype.hasOwnProperty.call(defenseCache, projectId)) {
      return <Tag color="default">ยังไม่โหลด</Tag>;
    }
    const record = defenseCache[projectId];
    if (record === null) {
      return <Tag color="default">ยังไม่ยื่น</Tag>;
    }
    if (!record) {
      return <Tag color="default">ไม่ทราบสถานะ</Tag>;
    }
    if (record.status === 'staff_verified') {
      return (
        <Space direction="vertical" size={2}>
          <Tag color="green">ตรวจสอบแล้ว (ติดตามในปฏิทิน)</Tag>
          <Text style={{ fontSize: 12 }}>ตารางสอบจะประกาศในปฏิทินภาควิชา</Text>
        </Space>
      );
    }
    if (record.status === 'scheduled') {
      return (
        <Space direction="vertical" size={2}>
          <Tag color="green">นัดสอบแล้ว (ระบบเดิม)</Tag>
          <Text style={{ fontSize: 12 }}>{formatScheduleLabel(record)}</Text>
          {record.defenseLocation && <Text style={{ fontSize: 12 }}>สถานที่: {record.defenseLocation}</Text>}
        </Space>
      );
    }
    if (record.status === 'advisor_approved') {
      return <Tag color="blue">รอเจ้าหน้าที่ตรวจสอบ</Tag>;
    }
    if (record.status === 'advisor_in_review') {
      return <Tag color="orange">รออาจารย์อนุมัติครบ</Tag>;
    }
    if (record.status === 'completed') {
      return <Tag color="blue">บันทึกผลสอบแล้ว</Tag>;
    }
    return <Tag color="default">{record.status}</Tag>;
  }, [defenseCache]);

  const columns = useMemo(() => [
    {
      title: 'ลำดับ',
      key: 'index',
      width: 60,
      align: 'center',
      render: (_, __, index) => index + 1
    },
    {
      title: 'ชื่อโครงงาน',
      dataIndex: 'titleTh',
      ellipsis: true,
      render: (title, record) => (
        <Space direction="vertical" size={0}>
          <Text>{title || <Text type="secondary">(ยังไม่กรอกชื่อ TH)</Text>}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.titleEn || '(ยังไม่กรอกชื่อ EN)'}</Text>
        </Space>
      )
    },
    {
      title: 'สมาชิก',
      dataIndex: 'members',
      width: 220,
      render: renderMembers
    },
    {
      title: 'อาจารย์',
      key: 'advisor',
      width: 200,
      render: (_, record) => renderAdvisor(record.advisor, record.coAdvisor)
    },
    {
      title: 'สถานะคำขอสอบ',
      key: 'defenseStatus',
      width: 200,
      render: (_, record) => renderDefenseStatus(record.projectId)
    },
    {
      title: 'ดำเนินการ',
      key: 'action',
      width: 220,
      render: (_, project) => {
        const isRowLoading = !!rowLoading[project.projectId];
        return (
          <Space>
            <Button size="small" onClick={() => fetchDefenseRecord(project.projectId, { force: true })} loading={isRowLoading}>
              โหลดสถานะ
            </Button>
            <Button type="primary" size="small" onClick={() => openDrawer(project)} loading={isRowLoading}>
              ดูรายละเอียดคำขอ
            </Button>
          </Space>
        );
      }
    }
  ], [fetchDefenseRecord, openDrawer, renderAdvisor, renderDefenseStatus, renderMembers, rowLoading]);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Card
        title={(
          <Space>
            <CalendarOutlined />
            <Title level={4} style={{ margin: 0 }}>ติดตามคำขอสอบโครงงานพิเศษ 1</Title>
          </Space>
        )}
        extra={(
          <Space>
            <Button icon={<ReloadOutlined />} onClick={reload} loading={loading}>
              รีเฟรช
            </Button>
          </Space>
        )}
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Select
            placeholder="เลือกปีการศึกษา"
            allowClear
            value={filters.academicYear ?? undefined}
            options={academicYearOptions}
            style={{ width: 180 }}
            onChange={(value) => updateFilters({ academicYear: value ?? null, semester: null })}
          />
          <Select
            placeholder="เลือกภาคเรียน"
            allowClear
            disabled={!filters.academicYear || !semesterOptions.length}
            value={filters.semester ?? undefined}
            options={semesterOptions}
            style={{ width: 150 }}
            onChange={(value) => updateFilters({ semester: value ?? null })}
          />
          <Input.Search
            placeholder="ค้นหา (ชื่อ / รหัสโครงงาน)"
            allowClear
            style={{ width: 260 }}
            onSearch={(value) => updateFilters({ search: value })}
          />
          <Select
            value={filters.status}
            onChange={(value) => updateFilters({ status: value })}
            style={{ width: 160 }}
            options={[
              { value: 'all', label: 'ทุกสถานะ' },
              { value: 'draft', label: 'draft' },
              { value: 'advisor_assigned', label: 'advisor_assigned' },
              { value: 'in_progress', label: 'in_progress' },
              { value: 'completed', label: 'completed' },
              { value: 'archived', label: 'archived' }
            ]}
          />
          <Space>
            <Text>เฉพาะหัวข้อพร้อม</Text>
            <Switch checked={filters.readyOnly} onChange={(value) => updateFilters({ readyOnly: value })} />
          </Space>
        </Space>

        {error && <Alert type="error" message={error} closable style={{ marginBottom: 12 }} />}

        <Table
          dataSource={records}
          columns={columns}
          rowKey={(record) => record.projectId}
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          size="small"
        />
      </Card>

      <Drawer
        title={activeProject ? `รายละเอียดคำขอสอบ – ${activeProject.titleTh || activeProject.projectCode}` : 'รายละเอียดคำขอสอบ'}
        width={520}
        open={drawerOpen}
        onClose={closeDrawer}
      >
        {!activeProject && <Text type="secondary">เลือกโครงงานจากตารางเพื่อดูสถานะคำขอสอบ</Text>}

        {activeProject && (
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            <Descriptions size="small" bordered column={1}>
              <Descriptions.Item label="ชื่อโครงงาน (TH)">{activeProject.titleTh || '-'}</Descriptions.Item>
              <Descriptions.Item label="ชื่อโครงงาน (EN)">{activeProject.titleEn || '-'}</Descriptions.Item>
              <Descriptions.Item label="สถานะ">{activeProject.status}</Descriptions.Item>
              <Descriptions.Item label="สมาชิก">
                <Space direction="vertical">
                  {(activeProject.members || []).map((member) => (
                    <Space key={member.studentId || member.studentCode}>
                      <TeamOutlined />
                      <span>{member.studentCode || '-'} – {member.name || '-'}</span>
                    </Space>
                  ))}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            <Divider style={{ margin: '12px 0' }} />

            {rowLoading[activeProject.projectId] && (
              <Spin spinning={true} tip="กำลังโหลดข้อมูลคำขอสอบ...">
        <div style={{ minHeight: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div>{/* Loading content */}</div>
        </div>
      </Spin>
            )}

            {!rowLoading[activeProject.projectId] && activeDefense === null && (
              <Alert
                type="info"
                showIcon
                message="ยังไม่มีคำขอสอบโครงงานพิเศษ 1 จากทีมนี้"
                description="เมื่อนักศึกษายื่นคำขอ (คพ.02) แล้ว หน้านี้จะแสดงสถานะล่าสุดเพื่อให้เจ้าหน้าที่ติดตามและประสานงานต่อ"
              />
            )}

            {!rowLoading[activeProject.projectId] && activeDefense && (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card size="small" bordered>
                  <Space direction="vertical" size={4}>
                    <Space>
                      <ClockCircleOutlined />
                      <Text strong>สถานะคำขอ: {activeDefense.status}</Text>
                    </Space>
                    <Text>ส่งคำขอเมื่อ: {activeDefense.submittedAt ? dayjs(activeDefense.submittedAt).format('DD MMM BBBB HH:mm น.') : '-'}</Text>
                    <Text>หัวหน้าโครงงาน: {activeDefense.formPayload?.students?.find((item) => item.studentId === activeDefense.submittedByStudentId)?.name || '-'}</Text>
                    <Text>ช่องทางติดต่อ:</Text>
                    <div style={{ paddingLeft: 16 }}>
                      {(activeDefense.formPayload?.students || []).map((student) => (
                        <div key={student.studentId || student.studentCode}>
                          {student.name || '-'} – โทร {student.phone || '-'} / อีเมล {student.email || '-'}
                        </div>
                      ))}
                    </div>
                    {activeDefense.status === 'staff_verified' && (
                      <Alert
                        type="success"
                        showIcon
                        message="เจ้าหน้าที่ตรวจสอบแล้ว"
                        description="ตารางสอบและสถานที่จะแสดงผ่านปฏิทินภาควิชา"
                      />
                    )}
                    {activeDefense.status === 'scheduled' && (
                      <Alert
                        type="success"
                        showIcon
                        message={`นัดสอบเมื่อ ${formatScheduleLabel(activeDefense)}`}
                        description={activeDefense.defenseLocation ? `สถานที่: ${activeDefense.defenseLocation}` : undefined}
                      />
                    )}
                  </Space>
                </Card>

                <Alert
                  type="info"
                  showIcon
                  message="การนัดสอบจัดการผ่านปฏิทินภาควิชา"
                  description="โปรดอัปเดตวันเวลาและสถานที่สอบในระบบปฏิทินของภาควิชา จากนั้นแจ้งเตือนทีมโครงงานตามช่องทางที่ภาควิชากำหนด"
                />

                {activeDefense.defenseScheduledAt && (
                  <Descriptions size="small" bordered column={1}>
                    <Descriptions.Item label="ข้อมูลวันที่ในระบบเดิม">
                      {dayjs(activeDefense.defenseScheduledAt).format('DD MMM BBBB HH:mm น.')}
                    </Descriptions.Item>
                    <Descriptions.Item label="สถานที่ (ระบบเดิม)">
                      {activeDefense.defenseLocation || 'ประกาศผ่านช่องทางภายนอก'}
                    </Descriptions.Item>
                    {activeDefense.defenseNote && (
                      <Descriptions.Item label="หมายเหตุ (ระบบเดิม)">
                        {activeDefense.defenseNote}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                )}

                <Alert
                  type="warning"
                  showIcon
                  message="ต้องการแก้ไขข้อมูล?"
                  description="หากจำเป็นต้องแก้ไขคำขอ ให้ติดต่อผู้ดูแลระบบเพื่อปลดล็อกหรือปรับรายละเอียดในระบบปฏิทิน"
                />
              </Space>
            )}
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default Project1DefenseSchedulePage;
