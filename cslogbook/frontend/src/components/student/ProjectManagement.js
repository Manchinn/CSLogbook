import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Select, 
  message, 
  Typography,
  Row,
  Col,
  Descriptions,
  Divider,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  EyeOutlined, 
  TeamOutlined,
  ProjectOutlined,
  UserAddOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { studentProjectService } from '../../services/studentProjectService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const ProjectManagement = () => {
  const { userData } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [form] = Form.useForm();
  const [memberForm] = Form.useForm();

  // โหลดข้อมูลโครงงานของนักศึกษา
  const loadProjects = async () => {
    try {
      setLoading(true);
      const response = await studentProjectService.getMyProjects();
      setProjects(response.data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      message.error('ไม่สามารถโหลดข้อมูลโครงงานได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // แก้ไขโครงงาน
  const handleEdit = (project) => {
    setSelectedProject(project);
    form.setFieldsValue({
      title: project.title,
      objective: project.objective,
      description: project.description,
      track: project.track
    });
    setEditModalVisible(true);
  };

  // ดูรายละเอียดโครงงาน
  const handleView = async (project) => {
    try {
      const response = await studentProjectService.getProjectById(project.id);
      setSelectedProject(response.data);
      setViewModalVisible(true);
    } catch (error) {
      console.error('Error loading project details:', error);
      message.error('ไม่สามารถโหลดรายละเอียดโครงงานได้');
    }
  };

  // เพิ่มสมาชิก
  const handleAddMember = (project) => {
    setSelectedProject(project);
    memberForm.resetFields();
    setAddMemberModalVisible(true);
  };

  // เปิดใช้งานโครงงาน
  const handleActivate = async (project) => {
    try {
      await studentProjectService.activateProject(project.id);
      message.success('เปิดใช้งานโครงงานสำเร็จ');
      loadProjects();
    } catch (error) {
      console.error('Error activating project:', error);
      message.error('ไม่สามารถเปิดใช้งานโครงงานได้');
    }
  };

  // บันทึกการแก้ไข
  const handleSaveEdit = async (values) => {
    try {
      await studentProjectService.updateProject(selectedProject.id, values);
      message.success('อัปเดตโครงงานสำเร็จ');
      setEditModalVisible(false);
      loadProjects();
    } catch (error) {
      console.error('Error updating project:', error);
      message.error('ไม่สามารถอัปเดตโครงงานได้');
    }
  };

  // บันทึกสมาชิกใหม่
  const handleSaveMember = async (values) => {
    try {
      await studentProjectService.addMember(selectedProject.id, values);
      message.success('เพิ่มสมาชิกสำเร็จ');
      setAddMemberModalVisible(false);
      loadProjects();
    } catch (error) {
      console.error('Error adding member:', error);
      message.error('ไม่สามารถเพิ่มสมาชิกได้');
    }
  };

  // สถานะโครงงาน
  const getStatusTag = (status) => {
    const statusMap = {
      draft: { color: 'default', text: 'ฉบับร่าง' },
      advisor_assigned: { color: 'blue', text: 'รอเริ่มดำเนินงาน' },
      in_progress: { color: 'processing', text: 'กำลังดำเนินการ' },
      completed: { color: 'success', text: 'เสร็จสิ้น' },
      archived: { color: 'purple', text: 'ถูกเก็บถาวร' }
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  // คอลัมน์ตาราง
  const columns = [
    {
      title: 'ชื่อโครงงาน',
      dataIndex: 'title',
      key: 'title',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'แทร็ก',
      dataIndex: 'track',
      key: 'track',
      render: (track) => track ? <Tag color="blue">{track}</Tag> : '-'
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'สมาชิก',
      dataIndex: 'members',
      key: 'members',
      render: (members) => (
        <Space>
          <TeamOutlined />
          <Text>{Array.isArray(members) ? members.length : 0} คน</Text>
        </Space>
      )
    },
    {
      title: 'การดำเนินการ',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="link" 
            icon={<EyeOutlined />} 
            onClick={() => handleView(record)}
          >
            ดู
          </Button>
          {record.status === 'draft' && (
            <>
              <Button 
                type="link" 
                icon={<EditOutlined />} 
                onClick={() => handleEdit(record)}
              >
                แก้ไข
              </Button>
              <Button 
                type="link" 
                icon={<UserAddOutlined />} 
                onClick={() => handleAddMember(record)}
              >
                เพิ่มสมาชิก
              </Button>
              <Button 
                type="primary" 
                size="small"
                icon={<CheckCircleOutlined />} 
                onClick={() => handleActivate(record)}
              >
                เปิดใช้งาน
              </Button>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <div style={{ marginBottom: '16px' }}>
          <Title level={4}>
            <ProjectOutlined style={{ marginRight: '8px' }} />
            จัดการโครงงานพิเศษ
          </Title>
          <Text type="secondary">
            จัดการและแก้ไขรายละเอียดโครงงานพิเศษของคุณ
          </Text>
        </div>

        {projects.length === 0 && !loading && (
          <Alert
            message="ไม่พบโครงงานพิเศษ"
            description="คุณยังไม่มีโครงงานพิเศษในระบบ กรุณาติดต่อเจ้าหน้าที่ภาควิชาเพื่อสร้างโครงงาน"
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
        )}

        <Table
          columns={columns}
          dataSource={projects}
          loading={loading}
          rowKey="id"
          pagination={false}
        />
      </Card>

      {/* Modal แก้ไขโครงงาน */}
      <Modal
        title="แก้ไขรายละเอียดโครงงาน"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveEdit}
        >
          <Form.Item
            name="title"
            label="ชื่อโครงงาน"
            rules={[{ required: true, message: 'กรุณากรอกชื่อโครงงาน' }]}
          >
            <Input placeholder="ชื่อโครงงานพิเศษ" />
          </Form.Item>

          <Form.Item
            name="track"
            label="แทร็ก"
          >
            <Select placeholder="เลือกแทร็ก">
              <Option value="Software Engineering">Software Engineering</Option>
              <Option value="Data Science">Data Science</Option>
              <Option value="Computer Networks">Computer Networks</Option>
              <Option value="Artificial Intelligence">Artificial Intelligence</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="objective"
            label="วัตถุประสงค์"
          >
            <TextArea rows={4} placeholder="วัตถุประสงค์ของโครงงาน" />
          </Form.Item>

          <Form.Item
            name="description"
            label="รายละเอียด"
          >
            <TextArea rows={6} placeholder="รายละเอียดของโครงงาน" />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                บันทึก
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                ยกเลิก
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal ดูรายละเอียดโครงงาน */}
      <Modal
        title="รายละเอียดโครงงาน"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            ปิด
          </Button>
        ]}
        width={800}
      >
        {selectedProject && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="ชื่อโครงงาน">
                {selectedProject.title}
              </Descriptions.Item>
              <Descriptions.Item label="แทร็ก">
                {selectedProject.track || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="สถานะ">
                {getStatusTag(selectedProject.status)}
              </Descriptions.Item>
              <Descriptions.Item label="วัตถุประสงค์">
                {selectedProject.objective || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="รายละเอียด">
                {selectedProject.description || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Divider>สมาชิกในโครงงาน</Divider>
            
            {selectedProject.members && selectedProject.members.length > 0 ? (
              <Row gutter={[16, 16]}>
                {selectedProject.members.map((member, index) => (
                  <Col span={12} key={index}>
                    <Card size="small">
                      <Space>
                        <TeamOutlined />
                        <div>
                          <Text strong>{member.name || member.studentCode}</Text>
                          <br />
                          <Text type="secondary">{member.studentCode}</Text>
                        </div>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : (
              <Text type="secondary">ไม่มีสมาชิกในโครงงาน</Text>
            )}
          </div>
        )}
      </Modal>

      {/* Modal เพิ่มสมาชิก */}
      <Modal
        title="เพิ่มสมาชิกโครงงาน"
        open={addMemberModalVisible}
        onCancel={() => setAddMemberModalVisible(false)}
        footer={null}
      >
        <Form
          form={memberForm}
          layout="vertical"
          onFinish={handleSaveMember}
        >
          <Form.Item
            name="studentCode"
            label="รหัสนักศึกษา"
            rules={[{ required: true, message: 'กรุณากรอกรหัสนักศึกษา' }]}
          >
            <Input placeholder="รหัสนักศึกษา เช่น 64070001" />
          </Form.Item>

          <Form.Item
            name="role"
            label="บทบาท"
            initialValue="member"
          >
            <Select>
              <Option value="member">สมาชิก</Option>
              <Option value="leader">หัวหน้าโครงงาน</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                เพิ่มสมาชิก
              </Button>
              <Button onClick={() => setAddMemberModalVisible(false)}>
                ยกเลิก
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectManagement;