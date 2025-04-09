import React, { useState, useEffect } from 'react';
import { 
  Form, Button, Card, Typography, Divider, 
  Row, Col, InputNumber, Input, Select, Table, Tag, message
} from 'antd';
import { SaveOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';
import SettingsLayout from './SettingsLayout';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const CurriculumSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    id: '',
    code: '',
    name: '',
    credits: 3,
    type: 'major'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await settingsService.getCurriculumSettings();
      if (response.success) {
        form.setFieldsValue({
          // ข้อมูลหลักสูตร
          curriculumName: response.data.curriculumName || 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์',
          curriculumYear: response.data.curriculumYear || 2563,
          curriculumTotalCredits: response.data.curriculumTotalCredits || 127,
          departmentPrefix: response.data.departmentPrefix || '0406'
        });
        
        if (response.data.courses) {
          setCourses(response.data.courses);
        }
      } else {
        message.error('ไม่สามารถดึงข้อมูลค่าคงที่ได้');
      }
    } catch (error) {
      console.error('Error fetching curriculum settings:', error);
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      // เพิ่มรายวิชาเข้าไปในค่าที่จะบันทึก
      values.courses = courses;
      
      const response = await settingsService.updateCurriculumSettings(values);
      if (response.success) {
        message.success('บันทึกค่าคงที่หลักสูตรสำเร็จ');
      } else {
        message.error('ไม่สามารถบันทึกค่าคงที่ได้');
      }
    } catch (error) {
      console.error('Error saving curriculum settings:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SettingsLayout 
      title="ค่าคงที่หลักสูตร" 
      onSave={handleSave} 
      onReset={fetchSettings}
      loading={loading}
    >
      <div className="curriculum-settings">
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            curriculumName: 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์',
            curriculumYear: 2563,
            curriculumTotalCredits: 127,
            departmentPrefix: '0406'
          }}
        >
          <Card className="setting-card">
            <Title level={5}>ข้อมูลหลักสูตร</Title>
            <Text type="secondary">
              กำหนดข้อมูลพื้นฐานของหลักสูตร
            </Text>
            
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={16}>
                <Form.Item
                  name="curriculumName"
                  label="ชื่อหลักสูตร"
                  rules={[{ required: true, message: 'กรุณากรอกชื่อหลักสูตร' }]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="curriculumYear"
                  label="ปีหลักสูตร (พ.ศ.)"
                  rules={[{ required: true, message: 'กรุณากรอกปีหลักสูตร' }]}
                >
                  <InputNumber min={2500} max={2600} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="curriculumTotalCredits"
                  label="จำนวนหน่วยกิตตลอดหลักสูตร"
                  rules={[{ required: true, message: 'กรุณากรอกจำนวนหน่วยกิต' }]}
                >
                  <InputNumber min={120} max={150} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="departmentPrefix"
                  label="รหัสนำหน้ารายวิชาภาควิชา"
                  rules={[{ required: true, message: 'กรุณากรอกรหัสนำหน้า' }]}
                  tooltip="รหัสนำหน้ารายวิชาภาควิชา เช่น 0406 สำหรับวิชาคอมพิวเตอร์"
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Form>
      </div>
    </SettingsLayout>
  );
};

export default CurriculumSettings;