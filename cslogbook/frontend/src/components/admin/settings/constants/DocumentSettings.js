import React, { useState, useEffect, useCallback } from 'react';
import { 
  Form, Button, Card, Typography, Table, Input, Select, Modal,
  Tag, Space, message 
} from 'antd';
import { 
  PlusOutlined, SaveOutlined, ReloadOutlined, 
  ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined, EditOutlined 
} from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';

const { Title, Text } = Typography;
const { Option } = Select;

const DocumentSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);

  // ดึงข้อมูลประเภทเอกสาร
  const fetchDocumentTypes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await settingsService.getDocumentTypes();
      if (response.success) {
        setDocumentTypes(response.data || []);
      } else {
        message.error('ไม่สามารถดึงข้อมูลประเภทเอกสารได้');
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocumentTypes();
  }, [fetchDocumentTypes]);

  // บันทึกประเภทเอกสาร
  const handleSaveDocumentTypes = async () => {
    try {
      setLoading(true);
      const response = await settingsService.updateDocumentTypes(documentTypes);
      if (response.success) {
        message.success('บันทึกประเภทเอกสารสำเร็จ');
        fetchDocumentTypes();
      } else {
        message.error('ไม่สามารถบันทึกประเภทเอกสารได้');
      }
    } catch (error) {
      console.error('Error saving document types:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันเลื่อนรายการขึ้น
  const moveUp = (index) => {
    if (index === 0) return; // ไม่สามารถเลื่อนขึ้นได้ถ้าเป็นรายการแรก
    
    const newItems = [...documentTypes];
    const temp = newItems[index];
    newItems[index] = newItems[index - 1];
    newItems[index - 1] = temp;
    
    // อัปเดตค่า order
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));
    
    setDocumentTypes(updatedItems);
  };

  // ฟังก์ชันเลื่อนรายการลง
  const moveDown = (index) => {
    if (index === documentTypes.length - 1) return; // ไม่สามารถเลื่อนลงได้ถ้าเป็นรายการสุดท้าย
    
    const newItems = [...documentTypes];
    const temp = newItems[index];
    newItems[index] = newItems[index + 1];
    newItems[index + 1] = temp;
    
    // อัปเดตค่า order
    const updatedItems = newItems.map((item, idx) => ({
      ...item,
      order: idx + 1
    }));
    
    setDocumentTypes(updatedItems);
  };

  // เปิด Modal สำหรับเพิ่ม/แก้ไขประเภทเอกสาร
  const showModal = (type = null) => {
    setEditingType(type);
    
    if (type) {
      form.setFieldsValue({
        id: type.id,
        name: type.name,
        category: type.category,
        description: type.description,
        required: type.required
      });
    } else {
      form.resetFields();
      // กำหนดค่าเริ่มต้น
      form.setFieldsValue({
        required: true,
        category: 'internship'
      });
    }
    
    setModalVisible(true);
  };

  // จัดการการบันทึกข้อมูลใน Modal
  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingType) {
        // แก้ไขประเภทเอกสาร
        const updated = documentTypes.map(item => 
          item.id === editingType.id ? { ...item, ...values } : item
        );
        setDocumentTypes(updated);
      } else {
        // เพิ่มประเภทเอกสารใหม่
        const newDocType = {
          ...values,
          order: documentTypes.length + 1
        };
        setDocumentTypes([...documentTypes, newDocType]);
      }
      
      setModalVisible(false);
      message.success(editingType ? 'แก้ไขประเภทเอกสารสำเร็จ' : 'เพิ่มประเภทเอกสารสำเร็จ');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  // ลบประเภทเอกสาร
  const handleDeleteType = (typeId) => {
    Modal.confirm({
      title: 'ยืนยันการลบ',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการลบประเภทเอกสารนี้?',
      okText: 'ลบ',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: () => {
        const newTypes = documentTypes.filter(t => t.id !== typeId);
        
        // อัปเดตค่า order หลังจากลบ
        const updatedTypes = newTypes.map((item, index) => ({
          ...item,
          order: index + 1
        }));
        setDocumentTypes(updatedTypes);
        message.success('ลบประเภทเอกสารสำเร็จ');
      }
    });
  };

  // คอลัมน์สำหรับตาราง
  const columns = [
    {
      title: 'รหัส',
      dataIndex: 'id',
      key: 'id',
      width: 150
    },
    {
      title: 'ชื่อประเภทเอกสาร',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: 'หมวดหมู่',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => {
        let color = category === 'internship' ? 'blue' : 'green';
        let text = category === 'internship' ? 'ฝึกงาน' : 'โครงงาน';
        return <Tag color={color}>{text}</Tag>;
      }
    },
    {
      title: 'บังคับ',
      dataIndex: 'required',
      key: 'required',
      width: 100,
      render: (required) => (
        <Tag color={required ? 'red' : 'default'}>
          {required ? 'บังคับ' : 'ไม่บังคับ'}
        </Tag>
      )
    },
    {
      title: 'จัดการ',
      key: 'action',
      width: 180,
      render: (_, record, index) => (
        <Space>
          <Button 
            icon={<ArrowUpOutlined />} 
            type="text"
            disabled={index === 0}
            onClick={() => moveUp(index)}
          />
          <Button 
            icon={<ArrowDownOutlined />} 
            type="text"
            disabled={index === documentTypes.length - 1}
            onClick={() => moveDown(index)}
          />
          <Button 
            icon={<EditOutlined />} 
            type="text"
            onClick={() => showModal(record)}
          />
          <Button 
            icon={<DeleteOutlined />} 
            type="text"
            danger
            onClick={() => handleDeleteType(record.id)}
          />
        </Space>
      )
    }
  ];

  return (
    <div className="document-settings">
      <Card className="setting-card">
        <Title level={5}>ประเภทเอกสาร</Title>
        <Text type="secondary">
          จัดการประเภทเอกสารที่ใช้ในระบบ
        </Text>
        
        <div style={{ marginTop: 16, marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            เพิ่มประเภทเอกสาร
          </Button>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={documentTypes} 
          rowKey="id"
          pagination={false}
          loading={loading}
        />
      </Card>

      {/* Modal สำหรับเพิ่ม/แก้ไขประเภทเอกสาร */}
      <Modal
        title={editingType ? 'แก้ไขประเภทเอกสาร' : 'เพิ่มประเภทเอกสาร'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={() => setModalVisible(false)}
        okText={editingType ? 'บันทึก' : 'เพิ่ม'}
        cancelText="ยกเลิก"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="id"
            label="รหัสประเภทเอกสาร"
            rules={[
              { required: true, message: 'กรุณากรอกรหัสประเภทเอกสาร' },
              { pattern: /^[a-z_]+$/, message: 'รหัสต้องเป็นตัวอักษรพิมพ์เล็กและขีดล่างเท่านั้น' }
            ]}
            extra="ใช้ตัวอักษรพิมพ์เล็กและขีดล่าง (_) เท่านั้น เช่น internship_request"
          >
            <Input disabled={!!editingType} />
          </Form.Item>

          <Form.Item
            name="name"
            label="ชื่อประเภทเอกสาร"
            rules={[{ required: true, message: 'กรุณากรอกชื่อประเภทเอกสาร' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="category"
            label="หมวดหมู่"
            rules={[{ required: true, message: 'กรุณาเลือกหมวดหมู่' }]}
          >
            <Select>
              <Option value="internship">ฝึกงาน</Option>
              <Option value="project">โครงงาน</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="คำอธิบาย"
          >
            <Input.TextArea rows={3} />
          </Form.Item>

          <Form.Item 
            name="required" 
            valuePropName="checked"
          >
            <Select>
              <Option value={true}>เอกสารบังคับ</Option>
              <Option value={false}>เอกสารไม่บังคับ</Option>
            </Select>
          </Form.Item>
          
        </Form>
      </Modal>

      <div className="setting-actions" style={{ marginTop: 16 }}>
        <Button 
          icon={<ReloadOutlined />} 
          onClick={fetchDocumentTypes}
          style={{ marginRight: 8 }}
        >
          รีเซ็ต
        </Button>
        <Button 
          type="primary" 
          icon={<SaveOutlined />} 
          onClick={handleSaveDocumentTypes}
        >
          บันทึกการตั้งค่า
        </Button>
      </div>
    </div>
  );
};

export default DocumentSettings;