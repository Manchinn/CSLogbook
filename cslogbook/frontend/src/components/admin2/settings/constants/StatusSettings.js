import React, { useState, useEffect } from 'react';
import { 
  Form, Card, Button, Table, Space, Switch, Typography, Modal, Input, 
  InputNumber, message, Select, Tag, Spin, Popconfirm
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, 
  ReloadOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';

const { Title, Text } = Typography;
const { Option } = Select;

const StatusSettings = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [curriculumMappings, setCurriculumMappings] = useState([]);
  const [curriculums, setCurriculums] = useState([]);

  // ดึงข้อมูลสถานะนักศึกษาจาก API
  const fetchStatuses = async () => {
    setLoading(true);
    try {
      // ดึงข้อมูลหลักสูตร
      const curriculumResponse = await settingsService.getCurriculums();
      if (curriculumResponse.success) {
        setCurriculums(curriculumResponse.data);
        
        // ดึงข้อมูลการกำหนดหลักสูตรตามปีที่เข้าศึกษา
        const mappings = [
          { enrollYear: 2565, curriculumId: 2 }, // CS2565
          { enrollYear: 2564, curriculumId: 2 }, // CS2565
          { enrollYear: 2563, curriculumId: 2 }, // CS2565
          { enrollYear: 2562, curriculumId: 1 }, // CS2560
          { enrollYear: 2561, curriculumId: 1 }  // CS2560
        ];
        
        setCurriculumMappings(mappings);
      }
      
      // ตัวอย่างข้อมูลเพื่อการแสดงผล
      const mockData = [
        {
          id: 1,
          code: 'NORMAL',
          name: 'ปกติ', 
          description: 'นักศึกษาที่มีผลการเรียนและการลงทะเบียนเป็นไปตามข้อกำหนด',
          color: 'green',
          active: true,
          conditions: {
            maxStudyYears: null
          }
        },
        {
          id: 2,
          code: 'PROBATION',
          name: 'รอพินิจ', 
          description: 'นักศึกษาที่มีผลการเรียนต่ำกว่าเกณฑ์ที่กำหนด',
          color: 'orange',
          active: true,
          conditions: {
            maxStudyYears: null
          }
        },
        {
          id: 3,
          code: 'EXTENDED',
          name: 'นักศึกษาตกค้าง', 
          description: 'นักศึกษาที่ศึกษาเกิน 4 ปีแต่ไม่เกิน 8 ปี',
          color: 'blue',
          active: true,
          conditions: {
            maxStudyYears: 8
          }
        },
        {
          id: 4,
          code: 'DISMISSED',
          name: 'พ้นสภาพ', 
          description: 'นักศึกษาที่ศึกษาเกิน 8 ปี หรือมีผลการเรียนต่ำกว่าเกณฑ์ติดต่อกัน 2 ภาคการศึกษา',
          color: 'red',
          active: true,
          conditions: {
            maxStudyYears: 8
          }
        },
        {
          id: 5,
          code: 'INTERNSHIP',
          name: 'ฝึกงาน', 
          description: 'นักศึกษาที่กำลังฝึกงาน',
          color: 'cyan',
          active: true,
          conditions: {
            maxStudyYears: null
          }
        },
        {
          id: 6,
          code: 'PROJECT',
          name: 'ทำโครงงาน', 
          description: 'นักศึกษาที่กำลังทำโครงงานพิเศษ',
          color: 'purple',
          active: true,
          conditions: {
            maxStudyYears: null
          }
        }
      ];
      
      setStatuses(mockData);
      
      // ตั้งค่าค่าเริ่มต้นของฟอร์มการตั้งค่าระบบ
      form.setFieldsValue({
        maxStudyYears: 8,
        maxProbationTimes: 2,
        statusForInternship: ['NORMAL', 'EXTENDED'],
        statusForProject: ['NORMAL', 'EXTENDED']
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('ไม่สามารถดึงข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  // จัดการการแก้ไขสถานะ
  const handleEdit = (status) => {
    setEditingStatus(status);
    editForm.setFieldsValue({
      code: status.code,
      name: status.name,
      description: status.description,
      color: status.color,
      active: status.active,
      maxStudyYears: status.conditions.maxStudyYears
    });
    setEditModalVisible(true);
  };

  // จัดการการลบสถานะ
  const handleDelete = async (statusId) => {
    try {
      setLoading(true);
      // เมื่อมี API จริง ให้ใช้ settingsService เพื่อลบข้อมูล
      // await settingsService.deleteStudentStatus(statusId);
      
      // อัปเดตข้อมูลในหน้าจอ
      setStatuses(statuses.filter(status => status.id !== statusId));
      message.success('ลบสถานะนักศึกษาสำเร็จ');
    } catch (error) {
      console.error('Error deleting student status:', error);
      message.error('ไม่สามารถลบสถานะนักศึกษาได้');
    } finally {
      setLoading(false);
    }
  };

  // จัดการการบันทึกการแก้ไขสถานะ
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);
      
      const updatedStatus = {
        ...editingStatus,
        code: values.code,
        name: values.name,
        description: values.description,
        color: values.color,
        active: values.active,
        conditions: {
          maxStudyYears: values.maxStudyYears
        }
      };
      
      // เมื่อมี API จริง ให้ใช้ settingsService เพื่ออัปเดตข้อมูล
      // await settingsService.updateStudentStatus(updatedStatus);
      
      // อัปเดตข้อมูลในหน้าจอ
      setStatuses(statuses.map(status => 
        status.id === editingStatus.id ? updatedStatus : status
      ));
      
      message.success('อัปเดตสถานะนักศึกษาสำเร็จ');
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating student status:', error);
      message.error('ไม่สามารถอัปเดตสถานะนักศึกษาได้');
    } finally {
      setLoading(false);
    }
  };

  // จัดการการเพิ่มสถานะใหม่
  const handleAdd = () => {
    const newStatus = {
      id: Math.max(...statuses.map(s => s.id), 0) + 1,
      code: '',
      name: '',
      description: '',
      color: 'blue',
      active: true,
      conditions: {
        maxStudyYears: null
      }
    };
    
    setEditingStatus(newStatus);
    editForm.resetFields();
    setEditModalVisible(true);
  };

  // จัดการการบันทึกการตั้งค่าทั่วไป
  const handleSaveSettings = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // เมื่อมี API จริง ให้ใช้ settingsService เพื่อบันทึกการตั้งค่า
      // await settingsService.updateStatusSettings(values);
      
      message.success('บันทึกการตั้งค่าสำเร็จ');
    } catch (error) {
      console.error('Error saving status settings:', error);
      message.error('ไม่สามารถบันทึกการตั้งค่าได้');
    } finally {
      setLoading(false);
    }
  };

  // จัดการการแก้ไขการกำหนดหลักสูตร
  const handleEditMapping = (record, index) => {
    console.log('Edit mapping:', record, index);
  };

  // จัดการการเพิ่มการกำหนดหลักสูตร
  const handleAddMapping = () => {
    const currentYear = new Date().getFullYear() + 543;
    const newMapping = {
      enrollYear: currentYear,
      curriculumId: curriculums.find(c => c.active)?.id || null
    };
    
    setCurriculumMappings([...curriculumMappings, newMapping]);
  };

  // กำหนดคอลัมน์ของตาราง
  const columns = [
    {
      title: 'รหัส',
      dataIndex: 'code',
      key: 'code',
      width: 120
    },
    {
      title: 'สถานะ',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Tag color={record.color}>{text}</Tag>
      )
    },
    {
      title: 'คำอธิบาย',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true
    },
    {
      title: 'เงื่อนไขปีการศึกษา',
      dataIndex: ['conditions', 'maxStudyYears'],
      key: 'maxStudyYears',
      render: (text) => text ? `<= ${text} ปี` : '-'
    },
    {
      title: 'ใช้งาน',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active) => <Switch checked={active} disabled />
    },
    {
      title: 'จัดการ',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="คุณต้องการลบสถานะนี้ใช่หรือไม่?"
            description="การลบสถานะอาจส่งผลต่อข้อมูลนักศึกษาที่มีสถานะนี้"
            onConfirm={() => handleDelete(record.id)}
            okText="ใช่"
            cancelText="ไม่"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Button 
              icon={<DeleteOutlined />} 
              size="small" 
              danger
              disabled={['NORMAL', 'PROBATION', 'DISMISSED'].includes(record.code)}
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div className="status-settings">
      {/* การตั้งค่าทั่วไป */}
      <Card className="settings-card">
        <Title level={5}>ตั้งค่าทั่วไปสำหรับสถานะนักศึกษา</Title>
        <Text type="secondary">
          กำหนดค่าพื้นฐานสำหรับสถานะของนักศึกษาในระบบ
        </Text>
        
        <Form
          form={form}
          layout="vertical"
          className="settings-form"
          style={{ marginTop: 16 }}
        >
          <div className="form-row">
            <Form.Item
              name="maxStudyYears"
              label="จำนวนปีการศึกษาสูงสุด"
              rules={[{ required: true, message: 'กรุณากรอกจำนวนปีการศึกษาสูงสุด' }]}
            >
              <InputNumber min={4} max={12} style={{ width: '100%' }} />
            </Form.Item>
          </div>
          
          <div className="form-actions">
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={handleSaveSettings}
              loading={loading}
            >
              บันทึกการตั้งค่า
            </Button>
          </div>
        </Form>
      </Card>
      
      {/* การเชื่อมโยงสถานะกับหลักสูตร */}
      <Card className="settings-card" style={{ marginTop: 16 }}>
        <Title level={5}>การเชื่อมโยงสถานะกับหลักสูตร</Title>
        <Text type="secondary">
          กำหนดค่าเริ่มต้นของสถานะสำหรับนักศึกษาในแต่ละหลักสูตร
        </Text>
        
        <Form.Item
          name="defaultCurriculumMappings"
          label="การกำหนดหลักสูตรตามปีที่เข้าศึกษา"
        >
          <Table
            size="small"
            pagination={false}
            columns={[
              {
                title: 'ปีที่เข้าศึกษา',
                dataIndex: 'enrollYear',
                key: 'enrollYear',
                width: 120
              },
              {
                title: 'หลักสูตรที่ใช้',
                dataIndex: 'curriculumId',
                key: 'curriculumId',
                render: (curriculumId) => {
                  const curriculum = curriculums.find(c => c.id === curriculumId);
                  return curriculum ? curriculum.shortName : '-';
                }
              },
              {
                title: 'จัดการ',
                key: 'action',
                width: 80,
                render: (_, record, index) => (
                  <Button 
                    icon={<EditOutlined />} 
                    size="small" 
                    onClick={() => handleEditMapping(record, index)}
                  />
                )
              }
            ]}
            dataSource={curriculumMappings}
          />
          <Button 
            icon={<PlusOutlined />} 
            onClick={handleAddMapping}
            style={{ marginTop: 8 }}
          >
            เพิ่มการกำหนดหลักสูตร
          </Button>
        </Form.Item>
      </Card>
      
      {/* รายการสถานะนักศึกษา */}
      <Card 
        className="settings-card" 
        style={{ marginTop: 16 }} 
        title="สถานะนักศึกษาในระบบ"
        extra={
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            เพิ่มสถานะใหม่
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={statuses}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>
      
      {/* Modal สำหรับแก้ไขสถานะ */}
      <Modal
        title={editingStatus?.id ? "แก้ไขสถานะนักศึกษา" : "เพิ่มสถานะนักศึกษา"}
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            ยกเลิก
          </Button>,
          <Button 
            key="save" 
            type="primary" 
            onClick={handleSaveEdit}
            loading={loading}
          >
            บันทึก
          </Button>
        ]}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Form.Item
            name="code"
            label="รหัสสถานะ"
            rules={[{ required: true, message: 'กรุณากรอกรหัสสถานะ' }]}
          >
            <Input placeholder="เช่น GRADUATED, LEAVE_OF_ABSENCE" />
          </Form.Item>
          
          <Form.Item
            name="name"
            label="ชื่อสถานะ"
            rules={[{ required: true, message: 'กรุณากรอกชื่อสถานะ' }]}
          >
            <Input placeholder="เช่น สำเร็จการศึกษา, ลาพักการศึกษา" />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="คำอธิบาย"
          >
            <Input.TextArea rows={3} placeholder="อธิบายรายละเอียดของสถานะนี้" />
          </Form.Item>
          
          <Form.Item
            name="color"
            label="สี"
          >
            <Select>
              <Option value="green">เขียว</Option>
              <Option value="red">แดง</Option>
              <Option value="blue">น้ำเงิน</Option>
              <Option value="orange">ส้ม</Option>
              <Option value="purple">ม่วง</Option>
              <Option value="cyan">ฟ้า</Option>
              <Option value="gray">เทา</Option>
            </Select>
          </Form.Item>
          
          <Form.Item
            name="active"
            label="ใช้งาน"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
          
          <Form.Item
            name="maxStudyYears"
            label="จำนวนปีการศึกษาสูงสุด (ถ้ามี)"
          >
            <InputNumber min={1} max={12} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
      
      <style jsx>{`
        .settings-form {
          margin-top: 16px;
        }
        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 16px;
        }
        .form-actions {
          margin-top: 16px;
          display: flex;
          justify-content: flex-end;
        }
      `}</style>
    </div>
  );
};

export default StatusSettings;