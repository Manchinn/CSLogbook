// คอมโพเนนต์ย่อยสำหรับการตั้งค่าปีการศึกษา/ภาคเรียน
import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Select, Card, Divider, 
  Typography, Row, Col, InputNumber, DatePicker, message 
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';
import moment from 'moment-timezone';

const { Title, Text } = Typography;
const { Option } = Select;

const AcademicSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsService.getAcademicSettings();
      if (response.success) {
        form.setFieldsValue({
          currentSemester: response.data.currentSemester,
          currentAcademicYear: response.data.currentAcademicYear,
          registrationStartDate: response.data.registrationStartDate ? 
            moment(response.data.registrationStartDate) : null,
          registrationEndDate: response.data.registrationEndDate ? 
            moment(response.data.registrationEndDate) : null,
        });
      } else {
        message.error('ไม่สามารถดึงข้อมูลการตั้งค่าได้');
      }
    } catch (error) {
      console.error('Error fetching academic settings:', error);
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const response = await settingsService.updateAcademicSettings(values);
      if (response.success) {
        message.success('บันทึกการตั้งค่าสำเร็จ');
      } else {
        message.error('ไม่สามารถบันทึกการตั้งค่าได้');
      }
    } catch (error) {
      console.error('Error saving academic settings:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="academic-settings">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          currentSemester: 1,
          currentAcademicYear: new Date().getFullYear() + 543
        }}
      >
        <Card className="setting-card">
          <Title level={5}>ปีการศึกษาและภาคเรียนปัจจุบัน</Title>
          <Text type="secondary">
            ปีการศึกษาและภาคเรียนปัจจุบันจะใช้เป็นค่าตั้งต้นสำหรับการสมัครฝึกงานและโครงงาน
          </Text>
          
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item
                name="currentSemester"
                label="ภาคเรียนปัจจุบัน"
                rules={[{ required: true, message: 'กรุณาเลือกภาคเรียน' }]}
              >
                <Select>
                  <Option value={1}>ภาคเรียนที่ 1</Option>
                  <Option value={2}>ภาคเรียนที่ 2</Option>
                  <Option value={3}>ภาคฤดูร้อน</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="currentAcademicYear"
                label="ปีการศึกษา"
                rules={[{ required: true, message: 'กรุณากรอกปีการศึกษา' }]}
              >
                <InputNumber 
                  style={{ width: '100%' }} 
                  min={2500} 
                  max={2600}
                  placeholder="ปี พ.ศ."
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card className="setting-card" style={{ marginTop: 16 }}>
          <Title level={5}>ช่วงเวลาลงทะเบียน</Title>
          <Text type="secondary">
            กำหนดช่วงเวลาที่นักศึกษาสามารถลงทะเบียนฝึกงานและโครงงานได้
          </Text>
          
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}>
              <Form.Item
                name="registrationStartDate"
                label="วันที่เริ่มลงทะเบียน"
                rules={[{ required: true, message: 'กรุณาเลือกวันที่เริ่มลงทะเบียน' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="registrationEndDate"
                label="วันที่สิ้นสุดลงทะเบียน"
                rules={[{ required: true, message: 'กรุณาเลือกวันที่สิ้นสุดลงทะเบียน' }]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
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

export default AcademicSettings;