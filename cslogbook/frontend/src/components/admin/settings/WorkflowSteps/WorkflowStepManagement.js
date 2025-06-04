import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Select, message, Modal, Form, Input,
  InputNumber, Switch, Typography, Tag, Popconfirm, Tooltip, Row, Col,
  Alert, Spin, Empty, Divider
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, 
  ReloadOutlined, SaveOutlined, SearchOutlined,
  BarChartOutlined, SettingOutlined, DragOutlined
} from '@ant-design/icons';
// อัปเดต import path
import workflowStepService from '../../../../services/admin/workflowStepService';
import StepFormModal from './StepFormModal';
import StepUsageModal from './StepUsageModal';
import StepReorderModal from './StepReorderModal';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;

/**
 * คอมโพเนนต์หลักสำหรับจัดการขั้นตอน Workflow Steps
 */
const WorkflowStepManagement = () => {
  // State สำหรับข้อมูลหลัก
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedWorkflowType, setSelectedWorkflowType] = useState('internship');
  const [searchText, setSearchText] = useState('');
  
  // State สำหรับ Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total, range) => `${range[0]}-${range[1]} จาก ${total} รายการ`
  });

  // State สำหรับ Modal ต่างๆ
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isUsageModalVisible, setIsUsageModalVisible] = useState(false);
  const [isReorderModalVisible, setIsReorderModalVisible] = useState(false);
  const [editingStep, setEditingStep] = useState(null);
  const [selectedStepForUsage, setSelectedStepForUsage] = useState(null);

  // ตัวเลือกประเภท workflow
  const workflowTypes = [
    { value: 'internship', label: 'การฝึกงาน', color: 'blue' },
    { value: 'project', label: 'โครงงานพิเศษ', color: 'green' }
  ];

  /**
   * ฟังก์ชันดึงข้อมูลขั้นตอน workflow
   */
  const fetchSteps = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      const queryParams = {
        workflowType: selectedWorkflowType,
        page: pagination.current,
        limit: pagination.pageSize,
        search: searchText,
        ...params
      };

      const response = await workflowStepService.getAllSteps(queryParams);
      
      if (response.success) {
        setSteps(response.data.steps || []);
        setPagination(prev => ({
          ...prev,
          current: response.data.pagination?.currentPage || 1,
          total: response.data.pagination?.totalItems || 0
        }));
      }
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + error.message);
      setSteps([]);
    } finally {
      setLoading(false);
    }
  }, [selectedWorkflowType, searchText, pagination.current, pagination.pageSize]);

  // โหลดข้อมูลเมื่อเริ่มต้นและเมื่อ dependencies เปลี่ยน
  useEffect(() => {
    fetchSteps();
  }, [selectedWorkflowType]);

  /**
   * ฟังก์ชันค้นหา
   */
  const handleSearch = (value) => {
    setSearchText(value);
    setPagination(prev => ({ ...prev, current: 1 }));
    fetchSteps({ search: value, page: 1 });
  };

  /**
   * ฟังก์ชันเปลี่ยน workflow type
   */
  const handleWorkflowTypeChange = (value) => {
    setSelectedWorkflowType(value);
    setSearchText('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  /**
   * ฟังก์ชันเปิด Modal สำหรับสร้าง/แก้ไขขั้นตอน
   */
  const openFormModal = (step = null) => {
    setEditingStep(step);
    setIsFormModalVisible(true);
  };

  /**
   * ฟังก์ชันปิด Modal ฟอร์ม
   */
  const closeFormModal = () => {
    setIsFormModalVisible(false);
    setEditingStep(null);
  };

  /**
   * ฟังก์ชันเปิด Modal สำหรับดูสถิติการใช้งาน
   */
  const openUsageModal = (step) => {
    setSelectedStepForUsage(step);
    setIsUsageModalVisible(true);
  };

  /**
   * ฟังก์ชันเปิด Modal สำหรับจัดเรียงลำดับ
   */
  const openReorderModal = () => {
    setIsReorderModalVisible(true);
  };

  /**
   * ฟังก์ชันลบขั้นตอน
   */
  const handleDeleteStep = async (stepId, stepKey) => {
    try {
      setLoading(true);
      await workflowStepService.deleteStep(stepId);
      message.success(`ลบขั้นตอน "${stepKey}" สำเร็จ`);
      fetchSteps();
    } catch (error) {
      message.error('เกิดข้อผิดพลาดในการลบ: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ฟังก์ชันจัดการการบันทึกข้อมูลจาก Modal
   */
  const handleFormSubmitSuccess = () => {
    closeFormModal();
    fetchSteps();
    message.success(editingStep ? 'อัปเดตขั้นตอนสำเร็จ' : 'สร้างขั้นตอนใหม่สำเร็จ');
  };

  /**
   * ฟังก์ชันจัดการการจัดเรียงลำดับสำเร็จ
   */
  const handleReorderSuccess = () => {
    setIsReorderModalVisible(false);
    fetchSteps();
    message.success('จัดเรียงลำดับขั้นตอนใหม่สำเร็จ');
  };

  /**
   * คอลัมน์ของตาราง
   */
  const columns = [
    {
      title: 'ลำดับ',
      dataIndex: 'stepOrder',
      key: 'stepOrder',
      width: 80,
      align: 'center',
      sorter: (a, b) => a.stepOrder - b.stepOrder,
      render: (order) => (
        <Tag color="blue" style={{ minWidth: '40px', textAlign: 'center' }}>
          {order}
        </Tag>
      )
    },
    {
      title: 'รหัสขั้นตอน',
      dataIndex: 'stepKey',
      key: 'stepKey',
      width: 180,
      ellipsis: true,
      render: (text) => (
        <Tooltip title={text}>
          <Text code style={{ fontSize: '12px' }}>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'ชื่อขั้นตอน',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 180,
      render: (text) => (
        <Tooltip title={text}>
          <Text strong>{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'คำอธิบาย',
      dataIndex: 'descriptionTemplate',
      key: 'descriptionTemplate',
      ellipsis: true,
      width: 220,
      render: (text) => (
        <Tooltip title={text}>
          <Text type="secondary">{text}</Text>
        </Tooltip>
      )
    },
    {
      title: 'การจัดการ',
      key: 'actions',
      width: 180,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="ดูสถิติการใช้งาน">
            <Button
              size="small"
              icon={<BarChartOutlined />}
              onClick={() => openUsageModal(record)}
            />
          </Tooltip>
          <Tooltip title="แก้ไขขั้นตอน">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => openFormModal(record)}
            />
          </Tooltip>
          <Popconfirm
            title="ยืนยันการลบ"
            description={`คุณแน่ใจหรือไม่ที่จะลบขั้นตอน "${record.stepKey}"?`}
            onConfirm={() => handleDeleteStep(record.stepId, record.stepKey)}
            okText="ลบ"
            cancelText="ยกเลิก"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="ลบขั้นตอน">
              <Button
                danger
                size="small"
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Card>
        {/* Header Section */}
        <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
          <Col span={12}>
            <Title level={4} style={{ margin: 0 }}>
              <SettingOutlined style={{ marginRight: 8 }} />
              รายการขั้นตอน Workflow
            </Title>
            <Text type="secondary">
              จัดการและกำหนดขั้นตอนสำหรับการฝึกงานและโครงงานพิเศษ
            </Text>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<DragOutlined />}
                onClick={openReorderModal}
                disabled={steps.length === 0}
              >
                จัดเรียงลำดับ
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchSteps()}
                loading={loading}
              >
                รีเฟรช
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => openFormModal()}
              >
                เพิ่มขั้นตอน
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filter Section */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Space>
              <Text strong>ประเภท Workflow:</Text>
              <Select
                value={selectedWorkflowType}
                onChange={handleWorkflowTypeChange}
                style={{ width: 200 }}
              >
                {workflowTypes.map(type => (
                  <Option key={type.value} value={type.value}>
                    <Tag color={type.color} style={{ margin: 0, marginRight: 8 }}>
                      {type.label}
                    </Tag>
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col span={8}>
            <Search
              placeholder="ค้นหาขั้นตอน (ชื่อ, รหัส, คำอธิบาย)"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => !e.target.value && handleSearch('')}
            />
          </Col>
        </Row>

        <Divider />

        {/* Table Section */}
        {steps.length === 0 && !loading ? (
          <Empty
            description={
              <div>
                <Text>ไม่พบขั้นตอน workflow สำหรับ</Text>
                <Tag color="blue" style={{ margin: '0 4px' }}>
                  {workflowTypes.find(t => t.value === selectedWorkflowType)?.label}
                </Tag>
                {searchText && (
                  <>
                    <Text>ที่ตรงกับคำค้นหา "</Text>
                    <Text strong>{searchText}</Text>
                    <Text>"</Text>
                  </>
                )}
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => openFormModal()}
            >
              เพิ่มขั้นตอนแรก
            </Button>
          </Empty>
        ) : (
          <Table
            columns={columns}
            dataSource={steps}
            rowKey="stepId"
            loading={loading}
            pagination={{
              ...pagination,
              onChange: (page, pageSize) => {
                setPagination(prev => ({ ...prev, current: page, pageSize }));
                fetchSteps({ page, limit: pageSize });
              }
            }}
            scroll={{ x: 1000 }}
            size="middle"
          />
        )}
      </Card>

      {/* Modal สำหรับสร้าง/แก้ไขขั้นตอน */}
      <StepFormModal
        visible={isFormModalVisible}
        editingStep={editingStep}
        selectedWorkflowType={selectedWorkflowType}
        onCancel={closeFormModal}
        onSuccess={handleFormSubmitSuccess}
      />

      {/* Modal สำหรับดูสถิติการใช้งาน */}
      <StepUsageModal
        visible={isUsageModalVisible}
        step={selectedStepForUsage}
        onCancel={() => setIsUsageModalVisible(false)}
      />

      {/* Modal สำหรับจัดเรียงลำดับ */}
      <StepReorderModal
        visible={isReorderModalVisible}
        workflowType={selectedWorkflowType}
        steps={steps}
        onCancel={() => setIsReorderModalVisible(false)}
        onSuccess={handleReorderSuccess}
      />
    </div>
  );
};

export default WorkflowStepManagement;