// คอมโพเนนต์ย่อยสำหรับการตั้งค่าปีการศึกษา/ภาคเรียน
import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Select, Card, Divider, 
  Typography, Row, Col, InputNumber, DatePicker, message, Spin 
} from 'antd';
import { SaveOutlined, ReloadOutlined, PlusOutlined } from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';
import moment from 'moment-timezone';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

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
        const data = response.data;
        
        form.setFieldsValue({
          currentAcademicYear: data.currentAcademicYear,
          currentSemester: data.currentSemester,
          
          // ข้อมูลภาคเรียนที่ 1
          semester1Range: data.semesters?.['1']?.range ? [
            moment(data.semesters['1'].range.start),
            moment(data.semesters['1'].range.end)
          ] : null,
          
          // ข้อมูลภาคเรียนที่ 2
          semester2Range: data.semesters?.['2']?.range ? [
            moment(data.semesters['2'].range.start),
            moment(data.semesters['2'].range.end)
          ] : null,
          
          // ข้อมูลภาคฤดูร้อน
          semester3Range: data.semesters?.['3']?.range ? [
            moment(data.semesters['3'].range.start),
            moment(data.semesters['3'].range.end)
          ] : null,
          
          registrationStartDate: data.registration?.startDate ? 
            moment(data.registration.startDate) : null,
          registrationEndDate: data.registration?.endDate ? 
            moment(data.registration.endDate) : null,
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
      
      // แปลงรูปแบบข้อมูลสำหรับส่งไปยัง backend
      const formattedData = {
        currentAcademicYear: values.currentAcademicYear,
        currentSemester: values.currentSemester,
        semesters: {
          '1': {
            range: values.semester1Range ? {
              start: values.semester1Range[0].format('YYYY-MM-DD'),
              end: values.semester1Range[1].format('YYYY-MM-DD')
            } : null
          },
          '2': {
            range: values.semester2Range ? {
              start: values.semester2Range[0].format('YYYY-MM-DD'),
              end: values.semester2Range[1].format('YYYY-MM-DD')
            } : null
          },
          '3': {
            range: values.semester3Range ? {
              start: values.semester3Range[0].format('YYYY-MM-DD'),
              end: values.semester3Range[1].format('YYYY-MM-DD')
            } : null
          }
        },
        registration: {
          startDate: values.registrationStartDate ? 
            values.registrationStartDate.format('YYYY-MM-DD') : null,
          endDate: values.registrationEndDate ? 
            values.registrationEndDate.format('YYYY-MM-DD') : null
        }
      };
      
      const response = await settingsService.updateAcademicSettings(formattedData);
      if (response.success) {
        message.success('บันทึกการตั้งค่าสำเร็จ');
      } else {
        message.error(response.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      }
    } catch (error) {
      console.error('Error saving academic settings:', error);
      message.error('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !form.getFieldsValue().currentAcademicYear) {
    return <Spin tip="กำลังโหลดข้อมูล..." />;
  }

  return (
    <div className="academic-settings">
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          currentAcademicYear: 2567,
          currentSemester: 1
        }}
      >
        {/* ปีการศึกษาปัจจุบัน */}
        <Card className="settings-card">
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
                  placeholder="เช่น 2567" 
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* ช่วงเวลาของภาคเรียน */}
        <Card className="settings-card">
          <Title level={5}>ช่วงเวลาปีการศึกษา {form.getFieldValue('currentAcademicYear') || '2567'}</Title>
          <Text type="secondary">
            กำหนดช่วงเวลาของแต่ละภาคเรียนในปีการศึกษา
          </Text>
          
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={24}>
              <Form.Item
                name="semester1Range"
                label="ภาคเรียนที่ 1"
                rules={[{ required: true, message: 'กรุณาเลือกช่วงเวลาภาคเรียนที่ 1' }]}
              >
                <RangePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  placeholder={['วันเริ่มต้น', 'วันสิ้นสุด']}
                />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="semester2Range"
                label="ภาคเรียนที่ 2"
                rules={[{ required: true, message: 'กรุณาเลือกช่วงเวลาภาคเรียนที่ 2' }]}
              >
                <RangePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  placeholder={['วันเริ่มต้น', 'วันสิ้นสุด']}
                />
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item
                name="semester3Range"
                label="ภาคฤดูร้อน"
                rules={[{ required: true, message: 'กรุณาเลือกช่วงเวลาภาคฤดูร้อน' }]}
              >
                <RangePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  placeholder={['วันเริ่มต้น', 'วันสิ้นสุด']}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Divider />

        {/* ช่วงเวลาลงทะเบียน */}
        <Card className="settings-card">
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