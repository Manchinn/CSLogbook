import React, { useState, useEffect } from 'react';
import {
  Modal, Descriptions, Tag, Space, Button, Alert, 
  Typography, Row, Col, Card, Spin, message
} from 'antd';
import {
  BookOutlined, UserOutlined, TeamOutlined, 
  CalendarOutlined, InfoCircleOutlined, EditOutlined,
  FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { projectManagementService } from 'services/admin/projectManagementService';

const { Title, Text, Paragraph } = Typography;

/**
 * ProjectDetailsModal - Modal สำหรับแสดงรายละเอียดโครงงานพิเศษ
 */
const ProjectDetailsModal = ({ visible, onCancel, projectId, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState(null);

  // Load project details
  const loadProjectDetails = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const response = await projectManagementService.getProjectById(projectId);
      if (response.success) {
        setProjectData(response.data);
      } else {
        message.error(response.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลโครงงาน');
      }
    } catch (error) {
      console.error('Error loading project details:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดข้อมูลโครงงาน');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit button click
  const handleEdit = () => {
    if (onEdit && projectData) {
      onEdit(projectData);
    }
  };

  // Effects
  useEffect(() => {
    if (visible && projectId) {
      loadProjectDetails();
    }
  }, [visible, projectId]);

  // Status color mapping
  const getStatusColor = (status) => {
    const statusColors = {
      'draft': 'default',
      'submitted': 'processing',
      'under_review': 'warning',
      'approved': 'success',
      'rejected': 'error',
      'completed': 'success',
      'cancelled': 'error'
    };
    return statusColors[status] || 'default';
  };

  // Status text mapping
  const getStatusText = (status) => {
    const statusTexts = {
      'draft': 'ร่าง',
      'submitted': 'ส่งแล้ว',
      'under_review': 'กำลังพิจารณา',
      'approved': 'อนุมัติแล้ว',
      'rejected': 'ไม่อนุมัติ',
      'completed': 'เสร็จสิ้น',
      'cancelled': 'ยกเลิก'
    };
    return statusTexts[status] || status;
  };

  // Project type text mapping
  const getProjectTypeText = (type) => {
    const typeTexts = {
      'govern': 'องค์กรภายนอก',
      'private': 'ภาควิชา',
      'research': 'งานวิจัย'
    };
    return typeTexts[type] || type;
  };

  return (
    <Modal
      title={
        <Space>
          <BookOutlined style={{ color: '#1890ff' }} />
          <span>รายละเอียดโครงงานพิเศษ</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={
        <Space>
          <Button onClick={onCancel}>
            ปิด
          </Button>
          {projectData && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={handleEdit}
            >
              แก้ไข
            </Button>
          )}
        </Space>
      }
      width={900}
      destroyOnClose
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>กำลังโหลดข้อมูล...</div>
        </div>
      ) : projectData ? (
        <div>
          {/* Project Basic Info */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
              <BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              ข้อมูลพื้นฐาน
            </Title>
            
            <Descriptions column={2} size="small">
              <Descriptions.Item label="สถานะ" span={1}>
                <Tag color={getStatusColor(projectData.status)}>
                  {getStatusText(projectData.status)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="ชื่อโครงงาน (ไทย)" span={2}>
                <Text strong>
                  {projectData.projectNameTh || <Text type="secondary">ยังไม่ระบุ</Text>}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="ชื่อโครงงาน (อังกฤษ)" span={2}>
                <Text>
                  {projectData.projectNameEn || <Text type="secondary">ยังไม่ระบุ</Text>}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="ประเภทโครงงาน" span={1}>
                {projectData.projectType ? (
                  <Tag color="blue">{getProjectTypeText(projectData.projectType)}</Tag>
                ) : (
                  <Text type="secondary">ยังไม่ระบุ</Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="ปีการศึกษา/เทอม" span={1}>
                <Text>{projectData.academicYear}/{projectData.semester}</Text>
              </Descriptions.Item>
            </Descriptions>

            {/* Project Description */}
            {projectData.objective && (
              <div style={{ marginTop: 16 }}>
                <Text strong>วัตถุประสงค์:</Text>
                <Paragraph style={{ marginTop: 8, marginLeft: 16 }}>
                  {projectData.objective}
                </Paragraph>
              </div>
            )}
          </Card>

          {/* Students Info */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
              <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              นักศึกษา ({projectData.projectMembers?.length || 0} คน)
            </Title>
            
            {projectData.projectMembers && projectData.projectMembers.length > 0 ? (
              <Row gutter={[16, 8]}>
                {projectData.projectMembers.map((member, index) => (
                  <Col span={12} key={member.id}>
                    <Card size="small" style={{ backgroundColor: '#fafafa' }}>
                      <Space direction="vertical" size="small" style={{ width: '100%' }}>
                        <div>
                          <Text strong>
                            {member.student?.user?.firstName} {member.student?.user?.lastName}
                          </Text>
                          <Tag color="blue" style={{ marginLeft: 8 }}>
                            {member.student?.studentCode}
                          </Tag>
                        </div>
                        <div>
                          <Text type="secondary">บทบาท: </Text>
                          <Text>{member.role || 'สมาชิก'}</Text>
                        </div>
                        <div>
                          <Text type="secondary">เข้าร่วมเมื่อ: </Text>
                          <Text>{new Date(member.joinedAt).toLocaleDateString('th-TH')}</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Alert
                type="info"
                message="ยังไม่มีนักศึกษาในโครงงานนี้"
                showIcon
              />
            )}
          </Card>

          {/* Advisors Info */}
          <Card size="small" style={{ marginBottom: 16 }}>
            <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
              <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              อาจารย์ที่ปรึกษา
            </Title>
            
            <Row gutter={16}>
              <Col span={12}>
                <div>
                  <Text strong>อาจารย์ที่ปรึกษาหลัก:</Text>
                  <div style={{ marginTop: 8 }}>
                    {projectData.advisor ? (
                      <Space direction="vertical" size="small">
                        <Text>
                          {projectData.advisor.user?.firstName} {projectData.advisor.user?.lastName}
                        </Text>
                        <Text type="secondary">
                          ตำแหน่ง: {projectData.advisor.position}
                        </Text>
                        <Text type="secondary">
                          อีเมล: {projectData.advisor.user?.email}
                        </Text>
                      </Space>
                    ) : (
                      <Text type="secondary">ยังไม่ระบุ</Text>
                    )}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong>อาจารย์ที่ปรึกษาร่วม:</Text>
                  <div style={{ marginTop: 8 }}>
                    {projectData.coAdvisor ? (
                      <Space direction="vertical" size="small">
                        <Text>
                          {projectData.coAdvisor.user?.firstName} {projectData.coAdvisor.user?.lastName}
                        </Text>
                        <Text type="secondary">
                          ตำแหน่ง: {projectData.coAdvisor.position}
                        </Text>
                        <Text type="secondary">
                          อีเมล: {projectData.coAdvisor.user?.email}
                        </Text>
                      </Space>
                    ) : (
                      <Text type="secondary">ไม่มี</Text>
                    )}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>

          {/* Tracks Info */}
          {projectData.projectTracks && projectData.projectTracks.length > 0 && (
            <Card size="small" style={{ marginBottom: 16 }}>
              <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
                <FileTextOutlined style={{ marginRight: 8, color: '#1890ff' }} />
                สาย/แทร็ก
              </Title>
              
              <Space wrap>
                {projectData.projectTracks.map((track, index) => (
                  <Tag key={index} color="green">
                    {track.trackCode} - {track.trackNameTh}
                  </Tag>
                ))}
              </Space>
            </Card>
          )}

          {/* Timeline Info */}
          <Card size="small">
            <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
              <CalendarOutlined style={{ marginRight: 8, color: '#1890ff' }} />
              ข้อมูลเวลา
            </Title>
            
            <Descriptions column={2} size="small">
              <Descriptions.Item label="วันที่สร้าง" span={1}>
                <Space>
                  <ClockCircleOutlined />
                  <Text>{new Date(projectData.createdAt).toLocaleString('th-TH')}</Text>
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="อัปเดตล่าสุด" span={1}>
                <Space>
                  <CheckCircleOutlined />
                  <Text>{new Date(projectData.updatedAt).toLocaleString('th-TH')}</Text>
                </Space>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Additional Info Alert */}
          {(!projectData.projectNameTh || !projectData.advisor) && (
            <Alert
              type="warning"
              showIcon
              icon={<InfoCircleOutlined />}
              message="ข้อมูลยังไม่ครบถ้วน"
              description="นักศึกษาสามารถเข้าสู่ระบบเพื่อกรอกรายละเอียดเพิ่มเติมได้"
              style={{ marginTop: 16 }}
            />
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Text type="secondary">ไม่พบข้อมูลโครงงาน</Text>
        </div>
      )}
    </Modal>
  );
};

export default ProjectDetailsModal;