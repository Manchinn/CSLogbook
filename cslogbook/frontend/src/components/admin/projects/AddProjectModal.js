import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal, Form, Input, Select, Button, Space, Alert, 
  Typography, Row, Col, Card, Tag, Spin, message
} from 'antd';
import {
  SaveOutlined, SearchOutlined, UserOutlined,
  BookOutlined, TeamOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { projectManagementService } from '../../../services/admin/projectManagementService';

const { Title, Text } = Typography;
const { Option } = Select;

/**
 * AddProjectModal - Modal สำหรับเพิ่มโครงงานพิเศษใหม่
 */
const AddProjectModal = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [studentSearchLoading, setStudentSearchLoading] = useState(false);
  const [student2SearchLoading, setStudent2SearchLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudent2, setSelectedStudent2] = useState(null);
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

  // Search student by code
  const handleStudentSearch = async (studentCode) => {
    if (!studentCode || studentCode.length < 3) {
      setSelectedStudent(null);
      return;
    }

    setStudentSearchLoading(true);
    try {
      const response = await projectManagementService.findStudentByCode(studentCode);
      if (response.success) {
        setSelectedStudent(response.data);
        
        // แสดงข้อมูลนักศึกษาที่พบ
        message.success(`พบนักศึกษา: ${response.data.user.firstName} ${response.data.user.lastName}`);
        
        // ตรวจสอบสิทธิ์และโครงงานที่มีอยู่
        if (!response.data.isEligibleProject) {
          message.warning('นักศึกษาคนนี้ยังไม่มีสิทธิ์ทำโครงงานพิเศษ');
        }
        
        if (response.data.hasActiveProject) {
          message.warning('นักศึกษาคนนี้มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว');
        }
      } else {
        setSelectedStudent(null);
        message.error(response.message || 'ไม่พบนักศึกษา');
      }
    } catch (error) {
      console.error('Error searching student:', error);
      setSelectedStudent(null);
      message.error('เกิดข้อผิดพลาดในการค้นหานักศึกษา');
    } finally {
      setStudentSearchLoading(false);
    }
  };

  // Search student 2 by code
  const handleStudent2Search = async (studentCode) => {
    if (!studentCode || studentCode.length < 3) {
      setSelectedStudent2(null);
      return;
    }

    // ตรวจสอบว่าไม่ใช่นักศึกษาคนเดียวกัน
    if (selectedStudent && selectedStudent.studentCode === studentCode) {
      message.error('ไม่สามารถเลือกนักศึกษาคนเดียวกันได้');
      return;
    }

    setStudent2SearchLoading(true);
    try {
      const response = await projectManagementService.findStudentByCode(studentCode);
      if (response.success) {
        setSelectedStudent2(response.data);
        
        // แสดงข้อมูลนักศึกษาที่พบ
        message.success(`พบนักศึกษาคนที่ 2: ${response.data.user.firstName} ${response.data.user.lastName}`);
        
        // ตรวจสอบสิทธิ์และโครงงานที่มีอยู่
        if (!response.data.isEligibleProject) {
          message.warning('นักศึกษาคนที่ 2 ยังไม่มีสิทธิ์ทำโครงงานพิเศษ');
        }
        
        if (response.data.hasActiveProject) {
          message.warning('นักศึกษาคนที่ 2 มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว');
        }
      } else {
        setSelectedStudent2(null);
        message.error(response.message || 'ไม่พบนักศึกษาคนที่ 2');
      }
    } catch (error) {
      console.error('Error searching student 2:', error);
      setSelectedStudent2(null);
      message.error('เกิดข้อผิดพลาดในการค้นหานักศึกษาคนที่ 2');
    } finally {
      setStudent2SearchLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    if (!selectedStudent) {
      message.error('กรุณาค้นหาและเลือกนักศึกษาก่อน');
      return;
    }

    if (!selectedStudent.isEligibleProject) {
      message.error('นักศึกษาคนที่ 1 ยังไม่มีสิทธิ์ทำโครงงานพิเศษ');
      return;
    }

    if (selectedStudent.hasActiveProject) {
      message.error('นักศึกษาคนที่ 1 มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว');
      return;
    }

    // ตรวจสอบนักศึกษาคนที่ 2 (ถ้ามี)
    if (selectedStudent2) {
      if (!selectedStudent2.isEligibleProject) {
        message.error('นักศึกษาคนที่ 2 ยังไม่มีสิทธิ์ทำโครงงานพิเศษ');
        return;
      }

      if (selectedStudent2.hasActiveProject) {
        message.error('นักศึกษาคนที่ 2 มีโครงงานที่ยังไม่เสร็จสิ้นอยู่แล้ว');
        return;
      }
    }

    setLoading(true);
    try {
      const projectData = {
        studentCode: selectedStudent.studentCode,
        student2Code: selectedStudent2?.studentCode || null, // เพิ่มนักศึกษาคนที่ 2
        projectNameTh: values.projectNameTh,
        projectNameEn: values.projectNameEn,
        projectType: values.projectType,
        advisorId: values.advisorId,
        coAdvisorId: values.coAdvisorId,
        trackCodes: values.trackCodes || []
      };

      const response = await projectManagementService.createProjectManually(projectData);
      
      if (response.success) {
        message.success('เพิ่มโครงงานพิเศษสำเร็จ');
        handleCancel();
        onSuccess();
      } else {
        message.error(response.message || 'เกิดข้อผิดพลาดในการเพิ่มโครงงาน');
      }
    } catch (error) {
      console.error('Error creating project:', error);
      message.error(error.message || 'เกิดข้อผิดพลาดในการเพิ่มโครงงาน');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal cancel
  const handleCancel = () => {
    form.resetFields();
    setSelectedStudent(null);
    setSelectedStudent2(null);
    onCancel();
  };

  // Effects
  useEffect(() => {
    if (visible) {
      loadAdvisors();
      loadTracks();
    }
  }, [visible, loadAdvisors, loadTracks]);

  // Project types
  const projectTypes = [
    { value: 'individual', label: 'โครงงานเดี่ยว' },
    { value: 'group', label: 'โครงงานกลุ่ม' },
    { value: 'research', label: 'โครงงานวิจัย' },
    { value: 'development', label: 'โครงงานพัฒนา' }
  ];

  return (
    <Modal
      title={
        <Space>
          <BookOutlined style={{ color: '#1890ff' }} />
          <span>เพิ่มโครงงานพิเศษใหม่</span>
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
        {/* Student Search Section */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
            <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            ข้อมูลนักศึกษา
          </Title>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="รหัสนักศึกษาคนที่ 1"
                name="studentCode"
                rules={[
                  { required: true, message: 'กรุณาระบุรหัสนักศึกษา' },
                  { min: 8, message: 'รหัสนักศึกษาต้องมีอย่างน้อย 8 หลัก' }
                ]}
              >
                <Input
                  placeholder="กรอกรหัสนักศึกษา เช่น 64070001"
                  suffix={
                    studentSearchLoading ? (
                      <Spin size="small" />
                    ) : (
                      <SearchOutlined />
                    )
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length >= 8) {
                      handleStudentSearch(value);
                    } else {
                      setSelectedStudent(null);
                    }
                  }}
                />
              </Form.Item>

              {/* Student Info Display */}
              {selectedStudent && (
                <Alert
                  type={selectedStudent.isEligibleProject && !selectedStudent.hasActiveProject ? 'success' : 'warning'}
                  showIcon
                  message={
                    <div>
                      <Text strong>
                        {selectedStudent.user.firstName} {selectedStudent.user.lastName}
                      </Text>
                      <Text style={{ marginLeft: 8, color: '#666' }}>
                        ({selectedStudent.studentCode})
                      </Text>
                    </div>
                  }
                  description={
                    <div>
                      <div>ห้องเรียน: {selectedStudent.classroom || 'ไม่ระบุ'}</div>
                      <div>หน่วยกิตรวม: {selectedStudent.totalCredits || 0} หน่วยกิต</div>
                      <div>
                        สิทธิ์ทำโครงงาน: {' '}
                        <Tag color={selectedStudent.isEligibleProject ? 'green' : 'red'}>
                          {selectedStudent.isEligibleProject ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                        </Tag>
                      </div>
                      {selectedStudent.hasActiveProject && (
                        <div>
                          <Text type="warning">
                            ⚠️ มีโครงงานที่ยังไม่เสร็จสิ้น: {selectedStudent.activeProject?.projectNameTh}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                  style={{ marginTop: 8 }}
                />
              )}
            </Col>

            <Col span={12}>
              <Form.Item
                label="รหัสนักศึกษาคนที่ 2 (ไม่บังคับ)"
                name="student2Code"
              >
                <Input
                  placeholder="กรอกรหัสนักศึกษาคนที่ 2 (สำหรับโครงงานกลุ่ม)"
                  suffix={
                    student2SearchLoading ? (
                      <Spin size="small" />
                    ) : (
                      <SearchOutlined />
                    )
                  }
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length >= 8) {
                      handleStudent2Search(value);
                    } else {
                      setSelectedStudent2(null);
                    }
                  }}
                />
              </Form.Item>

              {/* Student 2 Info Display */}
              {selectedStudent2 && (
                <Alert
                  type={selectedStudent2.isEligibleProject && !selectedStudent2.hasActiveProject ? 'success' : 'warning'}
                  showIcon
                  message={
                    <div>
                      <Text strong>
                        {selectedStudent2.user.firstName} {selectedStudent2.user.lastName}
                      </Text>
                      <Text style={{ marginLeft: 8, color: '#666' }}>
                        ({selectedStudent2.studentCode})
                      </Text>
                    </div>
                  }
                  description={
                    <div>
                      <div>ห้องเรียน: {selectedStudent2.classroom || 'ไม่ระบุ'}</div>
                      <div>หน่วยกิตรวม: {selectedStudent2.totalCredits || 0} หน่วยกิต</div>
                      <div>
                        สิทธิ์ทำโครงงาน: {' '}
                        <Tag color={selectedStudent2.isEligibleProject ? 'green' : 'red'}>
                          {selectedStudent2.isEligibleProject ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                        </Tag>
                      </div>
                      {selectedStudent2.hasActiveProject && (
                        <div>
                          <Text type="warning">
                            ⚠️ มีโครงงานที่ยังไม่เสร็จสิ้น: {selectedStudent2.activeProject?.projectNameTh}
                          </Text>
                        </div>
                      )}
                    </div>
                  }
                  style={{ marginTop: 8 }}
                />
              )}
            </Col>
          </Row>
        </Card>

        {/* Project Details Section */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
            <BookOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            รายละเอียดโครงงาน (ไม่บังคับ)
          </Title>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="ชื่อโครงงาน (ภาษาไทย)"
                name="projectNameTh"
              >
                <Input placeholder="ระบุชื่อโครงงานภาษาไทย (ถ้ามี)" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item
                label="ชื่อโครงงาน (ภาษาอังกฤษ)"
                name="projectNameEn"
              >
                <Input placeholder="ระบุชื่อโครงงานภาษาอังกฤษ (ถ้ามี)" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="ประเภทโครงงาน"
                name="projectType"
              >
                <Select placeholder="เลือกประเภทโครงงาน" allowClear>
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
          </Row>
        </Card>

        {/* Advisor Section */}
        <Card size="small" style={{ marginBottom: 16 }}>
          <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
            <TeamOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            อาจารย์ที่ปรึกษา (ไม่บังคับ)
          </Title>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="อาจารย์ที่ปรึกษาหลัก"
                name="advisorId"
              >
                <Select
                  placeholder="เลือกอาจารย์ที่ปรึกษาหลัก"
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

        {/* Info Alert */}
        <Alert
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
          message="หมายเหตุ"
          description={
            <div>
              <div>• นักศึกษาสามารถกรอกรายละเอียดเพิ่มเติมได้ภายหลัง</div>
              <div>• หากไม่ระบุอาจารย์ที่ปรึกษา นักศึกษาจะต้องเลือกเองในภายหลัง</div>
              <div>• ระบบจะตรวจสอบสิทธิ์และโครงงานที่มีอยู่แล้วอัตโนมัติ</div>
            </div>
          }
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
              disabled={!selectedStudent || !selectedStudent.isEligibleProject || selectedStudent.hasActiveProject}
            >
              เพิ่มโครงงานพิเศษ
            </Button>
          </Space>
        </Row>
      </Form>
    </Modal>
  );
};

export default AddProjectModal;