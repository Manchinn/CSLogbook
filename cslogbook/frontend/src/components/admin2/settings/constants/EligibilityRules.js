import React, { useState, useEffect } from 'react';
import { 
  Form, InputNumber, Button, Card, Divider, 
  Typography, Row, Col, message, Spin
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
          // ฝึกงาน
          internshipMinYear: response.data.internship.minYear,
          internshipMinCredits: response.data.internship.minCredits,
          internshipMinHours: response.data.internship.minHours,
          
          // โครงงานพิเศษ
          projectMinYear: response.data.project.minYear,
          projectMinCredits: response.data.project.minCredits,
          projectMinMajorCredits: response.data.project.minMajorCredits
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
      
      const response = await settingsService.updateEligibilitySettings({
        internship: {
          minYear: values.internshipMinYear,
          minCredits: values.internshipMinCredits,
          minHours: values.internshipMinHours
        },
        project: {
          minYear: values.projectMinYear,
          minCredits: values.projectMinCredits,
          minMajorCredits: values.projectMinMajorCredits
        }
      });
      
      if (response.success) {
        message.success('บันทึกการตั้งค่าเกณฑ์สำเร็จ');
      } else {
        message.error(response.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error('Error saving eligibility settings:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !form.getFieldsValue().internshipMinYear) {
    return <Spin tip="กำลังโหลดข้อมูล..." />;
  }

  return (
    <div className="eligibility-settings">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          internshipMinYear: 3,
          internshipMinCredits: 81,
          internshipMinHours: 240,
          projectMinYear: 4,
          projectMinCredits: 95,
          projectMinMajorCredits: 57
        }}
      >
        {/* เกณฑ์การฝึกงาน */}
        <Card className="settings-card">
          <Title level={5}>เกณฑ์การฝึกงาน</Title>
          <Text type="secondary">
            กำหนดเกณฑ์คุณสมบัติขั้นต่ำสำหรับการฝึกงานของนักศึกษา
          </Text>
          
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Form.Item
                name="internshipMinYear"
                label="ชั้นปีขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกชั้นปีขั้นต่ำ' }]}
              >
                <InputNumber min={1} max={8} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="internshipMinCredits"
                label="หน่วยกิตรวมขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกหน่วยกิตรวมขั้นต่ำ' }]}
              >
                <InputNumber min={0} max={150} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="internshipMinHours"
                label="จำนวนชั่วโมงฝึกงานขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกจำนวนชั่วโมง' }]}
              >
                <InputNumber min={0} max={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* เกณฑ์โครงงานพิเศษ */}
        <Card className="settings-card">
          <Title level={5}>เกณฑ์โครงงานพิเศษ</Title>
          <Text type="secondary">
            กำหนดเกณฑ์คุณสมบัติขั้นต่ำสำหรับการทำโครงงานพิเศษของนักศึกษา
          </Text>
          
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Form.Item
                name="projectMinYear"
                label="ชั้นปีขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกชั้นปีขั้นต่ำ' }]}
              >
                <InputNumber min={1} max={8} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="projectMinCredits"
                label="หน่วยกิตรวมขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกหน่วยกิตรวมขั้นต่ำ' }]}
              >
                <InputNumber min={0} max={150} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="projectMinMajorCredits"
                label="หน่วยกิตภาควิชาขั้นต่ำ"
                rules={[{ required: true, message: 'กรุณากรอกหน่วยกิตภาควิชาขั้นต่ำ' }]}
              >
                <InputNumber min={0} max={150} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
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