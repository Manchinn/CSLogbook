import React, { useState, useEffect } from 'react';
import { 
  Form, Card, Button, Table, Space, Switch, Modal, Input, 
  InputNumber, message, Select, Tag, Popconfirm
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';

const { Option } = Select;

const StatusSettings = () => {
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [statuses, setStatuses] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);

  // ดึงข้อมูลสถานะนักศึกษาจาก API
  const fetchStatuses = async () => {
    setLoading(true);
    try {
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
      {/* รายการสถานะนักศึกษา */} 
      <Card 
        className="settings-card" 
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