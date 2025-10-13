import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, Form, Input, Select, Button, Space, Alert, 
  Typography, Row, Col, Card, Tag, message
} from 'antd';
import {
  SaveOutlined, BookOutlined, TeamOutlined, 
  InfoCircleOutlined, EditOutlined
} from '@ant-design/icons';
import { projectManagementService } from '../../../services/admin/projectManagementService';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

/**
 * EditProjectModal - Modal สำหรับแก้ไขโครงงานพิเศษ
 */
const EditProjectModal = ({ visible, onCancel, onSuccess, projectData }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [advisors, setAdvisors] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [advisorsLoading, setAdvisorsLoading] = useState(false);

  // Load advisors and tracks
  const loadAdvisors = useCallback(async () => {
    setAdvisorsLoading(true);
    try {
      const response = await projectManagementService.getAvailableAdvisors();
      if (response.success) {
        setAdvisors(response.data);
      }
    } catch (error) {
      console.error('Error loading advisors:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดรายชื่ออาจารย์');
    } finally {
      setAdvisorsLoading(false);
    }
  }, []);

  const loadTracks = useCallback(async () => {
    try {
      const response = await projectManagementService.getAvailableTracks();
      if (response.success) {
        setTracks(response.data);
      }
    } catch (error) {
      console.error('Error loading tracks:', error);
      message.error('เกิดข้อผิดพลาดในการโหลดรายการ tracks');
    }
  }, []);

  // Handle form submission
  const handleSubmit = async (values) => {
    if (!projectData?.projectId) {
      message.error('ไม่พบข้อมูลโครงงาน');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        projectNameTh: values.projectNameTh,
        projectNameEn: values.projectNameEn,
        projectType: values.projectType,
        advisorId: values.advisorId,
        coAdvisorId: values.coAdvisorId,
        trackCodes: values.trackCodes || [],
        objective: values.objective,
        status: values.status
      };

      const response = await projectManagementService.updateProject(
        projectData.projectId, 
        updateData
      );
      
      if (response.success) {
        message.success('อัปเดตโครงงานสำเร็จ');
        handleCancel();
        onSuccess();
      } else {
        message.error(response.message || 'เกิดข้อผิดพลาดในการอัปเดตโครงงาน');
      }
    } catch (error) {
      console.error('Error updating project:', error);
      message.error(error.message || 'เกิดข้อผิดพลาดในการอัปเดตโครงงาน');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal cancel
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Initialize form with project data
  useEffect(() => {
    if (visible && projectData) {
      loadAdvisors();
      loadTracks();
      
      // Set form values
      form.setFieldsValue({
        projectNameTh: projectData.projectNameTh,
        projectNameEn: projectData.projectNameEn,
        projectType: projectData.projectType,
        advisorId: projectData.advisorId,
        coAdvisorId: projectData.coAdvisorId,
        trackCodes: projectData.projectTracks?.map(track => track.trackCode) || [],
        objective: projectData.objective,
        status: projectData.status
      });
    }
  }, [visible, projectData, form, loadAdvisors, loadTracks]);

  // Project types
  const projectTypes = [
    { value: 'govern', label: 'องค์กรภายนอก' },
    { value: 'private', label: 'ภาควิชา' },
    { value: 'research', label: 'งานวิจัย' }
  ];

  // Status options
  const statusOptions = [
    { value: 'draft', label: 'ร่าง', color: 'default' },
    { value: 'submitted', label: 'ส่งแล้ว', color: 'processing' },
    { value: 'under_review', label: 'กำลังพิจารณา', color: 'warning' },
    { value: 'approved', label: 'อนุมัติแล้ว', color: 'success' },
    { value: 'rejected', label: 'ไม่อนุมัติ', color: 'error' },
    { value: 'completed', label: 'เสร็จสิ้น', color: 'success' },
    { value: 'cancelled', label: 'ยกเลิก', color: 'error' }
  ];

  return (
    <Modal
      title={
        <Space>
          <EditOutlined style={{ color: '#1890ff' }} />
          <span>แก้ไขโครงงานพิเศษ</span>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        preserve={false}
      >
        {/* Project Info Display */}
        {projectData && (
          <Alert
            type="info"
            showIcon
            message={
              <div>
                {projectData.projectMembers && projectData.projectMembers.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <Text>นักศึกษา: </Text>
                    {projectData.projectMembers.map((member, index) => (
                      <Tag key={member.id} color="blue" style={{ marginRight: 4 }}>
                        {member.student?.user?.firstName} {member.student?.user?.lastName}
                        ({member.student?.studentCode})
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Project Details Section */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
            <BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            รายละเอียดโครงงาน
          </Title>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="ชื่อโครงงาน (ภาษาไทย)"
                name="projectNameTh"
                rules={[
                  { required: true, message: 'กรุณาระบุชื่อโครงงานภาษาไทย' }
                ]}
              >
                <Input placeholder="ระบุชื่อโครงงานภาษาไทย" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="ชื่อโครงงาน (ภาษาอังกฤษ)"
                name="projectNameEn"
                rules={[
                  { required: true, message: 'กรุณาระบุชื่อโครงงานภาษาอังกฤษ' }
                ]}
              >
                <Input placeholder="ระบุชื่อโครงงานภาษาอังกฤษ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="ประเภทโครงงาน"
                name="projectType"
                rules={[
                  { required: true, message: 'กรุณาเลือกประเภทโครงงาน' }
                ]}
              >
                <Select placeholder="เลือกประเภทโครงงาน">
                  {projectTypes.map(type => (
                    <Option key={type.value} value={type.value}>
                      {type.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="สถานะ"
                name="status"
                rules={[
                  { required: true, message: 'กรุณาเลือกสถานะ' }
                ]}
              >
                <Select placeholder="เลือกสถานะ">
                  {statusOptions.map(status => (
                    <Option key={status.value} value={status.value}>
                      <Tag color={status.color} style={{ marginRight: 8 }}>
                        {status.label}
                      </Tag>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="สาย/แทร็ก"
                name="trackCodes"
              >
                <Select
                  mode="multiple"
                  placeholder="เลือกสาย/แทร็ก"
                  allowClear
                >
                  {tracks.map(track => (
                    <Option key={track.code} value={track.code}>
                      {track.code} - {track.nameTh}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="วัตถุประสงค์"
                name="objective"
              >
                <TextArea
                  rows={4}
                  placeholder="ระบุวัตถุประสงค์ของโครงงาน"
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Advisor Section */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
            <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            อาจารย์ที่ปรึกษา
          </Title>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="อาจารย์ที่ปรึกษาหลัก"
                name="advisorId"
                rules={[
                  { required: true, message: 'กรุณาเลือกอาจารย์ที่ปรึกษาหลัก' }
                ]}
              >
                <Select
                  placeholder="เลือกอาจารย์ที่ปรึกษาหลัก"
                  loading={advisorsLoading}
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {advisors.map(advisor => (
                    <Option key={advisor.teacherId} value={advisor.teacherId}>
                      {advisor.user.firstName} {advisor.user.lastName} ({advisor.position})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="อาจารย์ที่ปรึกษาร่วม"
                name="coAdvisorId"
              >
                <Select
                  placeholder="เลือกอาจารย์ที่ปรึกษาร่วม"
                  loading={advisorsLoading}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {advisors.map(advisor => (
                    <Option key={advisor.teacherId} value={advisor.teacherId}>
                      {advisor.user.firstName} {advisor.user.lastName} ({advisor.position})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Warning Alert */}
        <Alert
          type="warning"
          showIcon
          icon={<InfoCircleOutlined />}
          message="คำเตือน"
          description="การแก้ไขข้อมูลโครงงานอาจส่งผลต่อการทำงานของระบบอื่นๆ กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนบันทึก"
          style={{ marginBottom: 16 }}
        />

        {/* Form Actions */}
        <Row justify="end">
          <Space>
            <Button onClick={handleCancel}>
              ยกเลิก
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
            >
              บันทึกการแก้ไข
            </Button>
          </Space>
        </Row>
      </Form>
    </Modal>
  );
};

export default EditProjectModal;