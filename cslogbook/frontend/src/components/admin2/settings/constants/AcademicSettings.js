// คอมโพเนนต์ย่อยสำหรับการตั้งค่าปีการศึกษา/ภาคเรียน
import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Select, Card, Divider, Tabs,
  Typography, Row, Col, InputNumber, DatePicker, TimePicker, message 
} from 'antd';
import { 
  SaveOutlined, ReloadOutlined, PlusOutlined, DeleteOutlined 
} from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';
import moment from 'moment-timezone';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

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
        // จัดการกับวันที่ และแปลงเป็น moment object
        const formattedData = {
          ...response.data,
          registrationStartDate: response.data.registrationStartDate ? 
            moment(response.data.registrationStartDate) : null,
          registrationEndDate: response.data.registrationEndDate ? 
            moment(response.data.registrationEndDate) : null,
          semesterOneSchedule: response.data.semesterOneSchedule?.map(item => ({
            ...item,
            date: item.date ? moment(item.date) : null,
            time: item.time ? moment(item.time, 'HH:mm') : null
          })) || [],
          semesterTwoSchedule: response.data.semesterTwoSchedule?.map(item => ({
            ...item,
            date: item.date ? moment(item.date) : null,
            time: item.time ? moment(item.time, 'HH:mm') : null
          })) || []
        };
        
        form.setFieldsValue(formattedData);
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
      
      // แปลง moment object เป็น string ก่อนส่งไปยัง API
      const formattedValues = {
        ...values,
        registrationStartDate: values.registrationStartDate ? 
          values.registrationStartDate.format('YYYY-MM-DD') : null,
        registrationEndDate: values.registrationEndDate ? 
          values.registrationEndDate.format('YYYY-MM-DD') : null,
        semesterOneSchedule: values.semesterOneSchedule?.map(item => ({
          ...item,
          date: item.date ? item.date.format('YYYY-MM-DD') : null,
          time: item.time ? item.time.format('HH:mm') : null
        })) || [],
        semesterTwoSchedule: values.semesterTwoSchedule?.map(item => ({
          ...item,
          date: item.date ? item.date.format('YYYY-MM-DD') : null,
          time: item.time ? item.time.format('HH:mm') : null
        })) || []
      };
      
      const response = await settingsService.updateAcademicSettings(formattedValues);
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
          <Title level={5}>ช่วงเวลาลงทะเบียนและกำหนดการสำคัญ</Title>
          <Text type="secondary">
            กำหนดช่วงเวลาและวันที่สำคัญต่างๆ ในปีการศึกษา
          </Text>
          
          <Tabs defaultActiveKey="1" style={{ marginTop: 16 }}>
            <TabPane tab="ช่วงเวลาลงทะเบียน" key="1">
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
            </TabPane>
            
            <TabPane tab="กำหนดการสำคัญ" key="2">
              <Divider>ภาคเรียนที่ 1</Divider>
              <Form.List name="semesterOneSchedule">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                        <Col span={8}>
                          <Form.Item
                            {...restField}
                            name={[name, 'activity']}
                            rules={[{ required: true, message: 'กรุณากรอกชื่อกิจกรรม' }]}
                          >
                            <Input placeholder="ชื่อกิจกรรม" />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'date']}
                            rules={[{ required: true, message: 'กรุณาเลือกวันที่' }]}
                          >
                            <DatePicker placeholder="วันที่" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'time']}
                          >
                            <TimePicker format="HH:mm" placeholder="เวลา" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'note']}
                          >
                            <Input placeholder="หมายเหตุ" />
                          </Form.Item>
                        </Col>
                        <Col span={1}>
                          <Button 
                            type="link" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => remove(name)} 
                          />
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      เพิ่มกิจกรรม
                    </Button>
                  </>
                )}
              </Form.List>
              
              <Divider>ภาคเรียนที่ 2</Divider>
              <Form.List name="semesterTwoSchedule">
                {(fields, { add, remove }) => (
                  <>
                    {fields.map(({ key, name, ...restField }) => (
                      <Row gutter={16} key={key} style={{ marginBottom: 16 }}>
                        <Col span={8}>
                          <Form.Item
                            {...restField}
                            name={[name, 'activity']}
                            rules={[{ required: true, message: 'กรุณากรอกชื่อกิจกรรม' }]}
                          >
                            <Input placeholder="ชื่อกิจกรรม" />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'date']}
                            rules={[{ required: true, message: 'กรุณาเลือกวันที่' }]}
                          >
                            <DatePicker placeholder="วันที่" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'time']}
                          >
                            <TimePicker format="HH:mm" placeholder="เวลา" style={{ width: '100%' }} />
                          </Form.Item>
                        </Col>
                        <Col span={5}>
                          <Form.Item
                            {...restField}
                            name={[name, 'note']}
                          >
                            <Input placeholder="หมายเหตุ" />
                          </Form.Item>
                        </Col>
                        <Col span={1}>
                          <Button 
                            type="link" 
                            danger 
                            icon={<DeleteOutlined />} 
                            onClick={() => remove(name)} 
                          />
                        </Col>
                      </Row>
                    ))}
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      เพิ่มกิจกรรม
                    </Button>
                  </>
                )}
              </Form.List>
            </TabPane>
          </Tabs>
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