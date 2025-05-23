// คอมโพเนนต์ย่อยสำหรับการตั้งค่าการแจ้งเตือน
import React, { useState, useEffect } from 'react';
import { 
  Form, Button, Card, Typography, 
  Row, Col, Switch, InputNumber, Table, message 
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';

const { Title, Text } = Typography;

const NotificationSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [notificationTypes, setNotificationTypes] = useState([
    {
      key: 'document_status_change',
      name: 'การเปลี่ยนแปลงสถานะเอกสาร',
      active: true,
      email: true,
      system: true,
      sms: false,
      documentSpecificTime: 24 // เพิ่ม field นี้
    },
    {
      key: 'deadline_reminder',
      name: 'การแจ้งเตือนกำหนดส่ง',
      active: true,
      email: true,
      system: true,
      sms: false
    },
    {
      key: 'admin_action_required',
      name: 'การแจ้งเตือนเพื่อให้ผู้ดูแลระบบดำเนินการ',
      active: true,
      email: true,
      system: true,
      sms: false
    }
  ]);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsService.getNotificationSettings();
      if (response.success) {
        form.setFieldsValue({
          enableEmail: response.data.enableEmail,
          enableSystemNotification: response.data.enableSystemNotification,
          documentReminderDays: response.data.documentReminderDays,
          reviewDueDays: response.data.reviewDueDays
        });
        
        if (response.data.notificationTypes) {
          setNotificationTypes(Object.entries(response.data.notificationTypes).map(([key, value]) => ({
            key,
            name: getNotificationTypeName(key),
            ...value
          })));
        }
      } else {
        message.error('ไม่สามารถดึงข้อมูลการตั้งค่าได้');
      }
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationTypeName = (key) => {
    const names = {
      document_status_change: 'การเปลี่ยนแปลงสถานะเอกสาร',
      deadline_reminder: 'การแจ้งเตือนกำหนดส่ง',
      admin_action_required: 'การแจ้งเตือนเพื่อให้ผู้ดูแลระบบดำเนินการ'
    };
    return names[key] || key;
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // Transform notificationTypes back to object
      const notificationTypesObj = {};
      notificationTypes.forEach(type => {
        const { key, name, ...rest } = type;
        notificationTypesObj[key] = rest;
      });
      
      values.notificationTypes = notificationTypesObj;
      
      const response = await settingsService.updateNotificationSettings(values);
      if (response.success) {
        message.success('บันทึกการตั้งค่าสำเร็จ');
      } else {
        message.error('ไม่สามารถบันทึกการตั้งค่าได้');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotificationType = (key, field, value) => {
    setNotificationTypes(prevTypes => 
      prevTypes.map(type => 
        type.key === key ? { ...type, [field]: value } : type
      )
    );
  };

  const columns = [
    {
      title: 'ประเภทการแจ้งเตือน',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'เปิดใช้งาน',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active, record) => (
        <Switch 
          checked={active} 
          onChange={checked => handleUpdateNotificationType(record.key, 'active', checked)}
        />
      )
    },
    {
      title: 'อีเมล',
      dataIndex: 'email',
      key: 'email',
      width: 100,
      render: (email, record) => (
        <Switch 
          checked={email} 
          disabled={!record.active}
          onChange={checked => handleUpdateNotificationType(record.key, 'email', checked)}
        />
      )
    },
    {
      title: 'ระบบ',
      dataIndex: 'system',
      key: 'system',
      width: 100,
      render: (system, record) => (
        <Switch 
          checked={system} 
          disabled={!record.active}
          onChange={checked => handleUpdateNotificationType(record.key, 'system', checked)}
        />
      )
    },
  ];

  return (
    <div className="notification-settings">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          enableEmail: true,
          enableSystemNotification: true,
          documentReminderDays: 7,
          reviewDueDays: 3
        }}
      >
        <Card className="setting-card">
          <Title level={5}>การตั้งค่าการแจ้งเตือนทั่วไป</Title>
          <Text type="secondary">
            กำหนดการตั้งค่าการแจ้งเตือนทั่วไปของระบบ
          </Text>
          
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item
                name="enableEmail"
                valuePropName="checked"
              >
                <Switch /> <span style={{ marginLeft: 8 }}>เปิดใช้งานการแจ้งเตือนทางอีเมล</span>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="enableSystemNotification"
                valuePropName="checked"
              >
                <Switch /> <span style={{ marginLeft: 8 }}>เปิดใช้งานการแจ้งเตือนในระบบ</span>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card className="setting-card" style={{ marginTop: 16 }}>
          <Title level={5}>กำหนดเวลาการแจ้งเตือน</Title>
          <Text type="secondary">
            กำหนดเวลาสำหรับการส่งการแจ้งเตือนต่างๆ
          </Text>
          
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item
                name="documentReminderDays"
                label="จำนวนวันก่อนถึงกำหนดส่งเอกสารที่จะส่งการแจ้งเตือน"
                rules={[{ required: true, message: 'กรุณากรอกจำนวนวัน' }]}
              >
                <InputNumber min={1} max={30} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="reviewDueDays"
                label="จำนวนวันที่ควรตรวจเอกสารให้เสร็จ"
                rules={[{ required: true, message: 'กรุณากรอกจำนวนวัน' }]}
              >
                <InputNumber min={1} max={15} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card className="setting-card" style={{ marginTop: 16 }}>
          <Title level={5}>ประเภทการแจ้งเตือน</Title>
          <Text type="secondary">
            กำหนดประเภทการแจ้งเตือนและช่องทางการแจ้งเตือนที่ต้องการใช้งาน
          </Text>
          
          <Table 
            columns={columns} 
            dataSource={notificationTypes} 
            rowKey="key" 
            pagination={false}
            style={{ marginTop: 16 }}
          />
        </Card>

        <div className="setting-actions">
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchSettings} 
            disabled={loading}
            style={{ marginRight: 8 }}
          >
            รีเซ็ต
          </Button>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSave} 
            loading={loading}
          >
            บันทึกการตั้งค่า
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default NotificationSettings;