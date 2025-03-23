//คอมโพเนนต์ย่อยสำหรับกฎการมีสิทธิ์ฝึกงาน/โครงงาน
import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, Typography, 
  Row, Col, InputNumber, Switch, message 
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';

const { Title, Text } = Typography;

const EligibilityRules = () => {
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
          internshipMinCredits: response.data.internshipMinCredits,
          internshipMinYear: response.data.internshipMinYear,
          projectMinCredits: response.data.projectMinCredits,
          projectMinYear: response.data.projectMinYear,
          projectRequiresInternship: response.data.projectRequiresInternship,
          departmentCreditsRequired: response.data.departmentCreditsRequired,
          departmentMinCredits: response.data.departmentMinCredits,
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

  return (
    <div className="eligibility-settings">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          internshipMinCredits: 85,
          internshipMinYear: 3,
          projectMinCredits: 100,
          projectMinYear: 4,
          projectRequiresInternship: true,
          departmentCreditsRequired: true,
          departmentMinCredits: 18,
        }}
      >
        <Card className="setting-card">
          <Title level={5}>เกณฑ์การมีสิทธิ์ฝึกงาน</Title>
          <Text type="secondary">
            กำหนดเงื่อนไขสำหรับการมีสิทธิ์ฝึกงานของนักศึกษา
          </Text>
          
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item
                name="internshipMinCredits"
                label="จำนวนหน่วยกิตขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
              >
                <InputNumber min={0} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="internshipMinYear"
                label="ชั้นปีขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
              >
                <InputNumber min={1} max={8} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card className="setting-card" style={{ marginTop: 16 }}>
          <Title level={5}>เกณฑ์การมีสิทธิ์ทำโครงงาน</Title>
          <Text type="secondary">
            กำหนดเงื่อนไขสำหรับการมีสิทธิ์ทำโครงงานของนักศึกษา
          </Text>
          
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item
                name="projectMinCredits"
                label="จำนวนหน่วยกิตขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
              >
                <InputNumber min={0} max={200} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="projectMinYear"
                label="ชั้นปีขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
              >
                <InputNumber min={1} max={8} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="projectRequiresInternship"
            valuePropName="checked"
            style={{ marginTop: 16 }}
          >
            <Switch /> <span style={{ marginLeft: 8 }}>ต้องผ่านการฝึกงานก่อนทำโครงงาน</span>
          </Form.Item>
        </Card>

        <Card className="setting-card" style={{ marginTop: 16 }}>
          <Title level={5}>เกณฑ์หน่วยกิตภาควิชา</Title>
          <Text type="secondary">
            กำหนดเงื่อนไขเกี่ยวกับหน่วยกิตภาควิชาสำหรับการมีสิทธิ์ฝึกงานและโครงงาน
          </Text>
          
          <Form.Item
            name="departmentCreditsRequired"
            valuePropName="checked"
            style={{ marginTop: 16 }}
          >
            <Switch /> <span style={{ marginLeft: 8 }}>ต้องมีหน่วยกิตภาควิชาขั้นต่ำตามที่กำหนด</span>
          </Form.Item>
          
          <Form.Item
            name="departmentMinCredits"
            label="จำนวนหน่วยกิตภาควิชาขั้นต่ำ"
            rules={[{ required: true, message: 'กรุณากรอกข้อมูล' }]}
          >
            <InputNumber min={0} max={200} style={{ width: '100%' }} />
          </Form.Item>
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

export default EligibilityRules;