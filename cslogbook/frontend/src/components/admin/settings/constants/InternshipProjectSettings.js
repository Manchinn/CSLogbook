import React, { useState, useEffect } from 'react';
import { 
  Form, Button, Card, Typography, 
  Row, Col, InputNumber, Switch, message,
  Tabs
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';

const { Title, Text } = Typography;

const InternshipProjectSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsService.getEligibilitySettings();
      if (response.success) {
        form.setFieldsValue({
          // เกณฑ์ฝึกงาน
          internshipMinYear: response.data.internshipMinYear ,
          internshipMinCredits: response.data.internshipMinCredits ,
          internshipMinHours: response.data.internshipMinHours ,
          internshipMinDays: response.data.internshipMinDays,
          
          // เกณฑ์โครงงานพิเศษ
          projectMinYear: response.data.projectMinYear,
          projectMinTotalCredits: response.data.projectMinTotalCredits ,
          projectMinMajorCredits: response.data.projectMinMajorCredits ,
          projectRequiresInternship: response.data.projectRequiresInternship ,
        });
      } else {
        message.error('ไม่สามารถดึงข้อมูลการตั้งค่าได้');
      }
    } catch (error) {
      console.error('Error fetching eligibility settings:', error);
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const response = await settingsService.updateEligibilitySettings(values);
      if (response.success) {
        message.success('บันทึกการตั้งค่าสำเร็จ');
      } else {
        message.error('ไม่สามารถบันทึกการตั้งค่าได้');
      }
    } catch (error) {
      console.error('Error saving eligibility settings:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const tabItems = [
    {
      key: '1',
      label: 'เกณฑ์การฝึกงาน',
      children: (
        <Card className="setting-card" variant="outlined">
          <Title level={5}>เกณฑ์การมีสิทธิ์ฝึกงาน</Title>
          <Text type="secondary">
            กำหนดเงื่อนไขสำหรับการมีสิทธิ์ฝึกงานของนักศึกษา
          </Text>
          
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item
                name="internshipMinYear"
                label="ชั้นปีขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
              >
                <InputNumber min={1} max={4} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="internshipMinCredits"
                label="หน่วยกิตสะสมขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
                tooltip="จำนวนหน่วยกิตรวมขั้นต่ำที่จำเป็นสำหรับการมีสิทธิ์ฝึกงาน"
              >
                <InputNumber min={0} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="internshipMinHours"
                label="จำนวนชั่วโมงฝึกงานขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
              >
                <InputNumber min={0} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="internshipMinDays"
                label="จำนวนวันฝึกงานขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ),
    },
    {
      key: '2',
      label: 'เกณฑ์การทำโครงงานพิเศษ',
      children: (
        <Card className="setting-card" variant="outlined">
          <Title level={5}>เกณฑ์การมีสิทธิ์ทำโครงงานพิเศษ</Title>
          <Text type="secondary">
            กำหนดเงื่อนไขสำหรับการมีสิทธิ์ทำโครงงานพิเศษของนักศึกษา
          </Text>
          
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item
                name="projectMinYear"
                label="ชั้นปีขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
              >
                <InputNumber min={1} max={6} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="projectMinTotalCredits"
                label="หน่วยกิตสะสมขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
                tooltip="จำนวนหน่วยกิตรวมขั้นต่ำที่จำเป็นสำหรับการมีสิทธิ์ทำโครงงานพิเศษ"
              >
                <InputNumber min={0} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="projectMinMajorCredits"
                label="หน่วยกิตวิชาเอกขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
                tooltip="จำนวนหน่วยกิตวิชาเอกขั้นต่ำสำหรับการมีสิทธิ์ทำโครงงานพิเศษ"
              >
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="projectRequiresInternship"
                valuePropName="checked"
                style={{ marginTop: 32 }}
              >
                <Switch /> <span style={{ marginLeft: 8 }}>ต้องผ่านการฝึกงานก่อนทำโครงงานพิเศษ</span>
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <div className="eligibility-settings">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          internshipMinCredits: 81,
          internshipMinYear: 3,
          internshipMinHours: 240,
          internshipMinDays: 40,
          projectMinTotalCredits: 95,
          projectMinYear: 4,
          projectMinMajorCredits: 57,
          projectRequiresInternship: true
        }}
      >
        <Tabs defaultActiveKey="1" items={tabItems} />

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

export default InternshipProjectSettings;