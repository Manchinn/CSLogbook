import React, { useState, useEffect } from 'react';
import { 
  Form, Button, Card, Typography, Switch, Tabs, Collapse,
  Row, Col, InputNumber, Input, Space, Table, Tag, message, Modal
} from 'antd';
import { 
  PlusOutlined, DeleteOutlined, EditOutlined 
} from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;

const CurriculumSettings = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [curriculums, setCurriculums] = useState([]);
  const [editingCurriculum, setEditingCurriculum] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm] = Form.useForm();

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

  useEffect(() => {
    fetchCurriculums();
  }, []);

  // ฟังก์ชันดึงข้อมูลหลักสูตร
  const fetchCurriculums = async () => {
    setLoading(true);
    try {
      const response = await settingsService.getCurriculums();
      if (response.success) {
        setCurriculums(response.data);
      } else {
        message.error('ไม่สามารถดึงข้อมูลหลักสูตรได้');
      }
    } catch (error) {
      console.error('Error fetching curriculums:', error);
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันรับปีในรูปแบบพุทธศักราช
  const getCurrentThaiYear = () => {
    return new Date().getFullYear() + 543;
  };

  // จัดการการแก้ไขหลักสูตร
  const handleEdit = (curriculum) => {
    setEditingCurriculum(curriculum);
    editForm.setFieldsValue({
      code: curriculum.code,
      name: curriculum.name,
      shortName: curriculum.shortName,
      startYear: curriculum.startYear,
      endYear: curriculum.endYear,
      active: curriculum.active,
      // เกณฑ์ฝึกงาน
      internshipMinYear: curriculum.requirements.internship.minYear,
      internshipMinCredits: curriculum.requirements.internship.minCredits,
      internshipMinMajorCredits: curriculum.requirements.internship.minMajorCredits,
      internshipMinHours: curriculum.requirements.internship.minHours,
      // เกณฑ์โครงงาน
      projectMinYear: curriculum.requirements.project.minYear,
      projectMinCredits: curriculum.requirements.project.minCredits,
      projectMinMajorCredits: curriculum.requirements.project.minMajorCredits
    });
    setEditModalVisible(true);
  };

  // จัดการการลบหลักสูตร
  const handleDelete = async (curriculumId) => {
    try {
      setLoading(true);
      // เมื่อมี API จริง ให้ใช้ settingsService เพื่อลบข้อมูล
      // await settingsService.deleteCurriculum(curriculumId);
      
      // อัปเดตข้อมูลในหน้าจอ
      setCurriculums(curriculums.filter(curriculum => curriculum.id !== curriculumId));
      message.success('ลบหลักสูตรสำเร็จ');
    } catch (error) {
      console.error('Error deleting curriculum:', error);
      message.error('ไม่สามารถลบหลักสูตรได้');
    } finally {
      setLoading(false);
    }
  };

  // จัดการการบันทึกการแก้ไขหลักสูตร
  const handleSaveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setLoading(true);
      
      const updatedCurriculum = {
        ...editingCurriculum,
        code: values.code,
        name: values.name,
        shortName: values.shortName,
        startYear: values.startYear,
        endYear: values.endYear,
        active: values.active,
        requirements: {
          internship: {
            minYear: values.internshipMinYear,
            minCredits: values.internshipMinCredits,
            minMajorCredits: values.internshipMinMajorCredits,
            minHours: values.internshipMinHours
          },
          project: {
            minYear: values.projectMinYear,
            minCredits: values.projectMinCredits,
            minMajorCredits: values.projectMinMajorCredits,
            minHours: null
          }
        }
      };
      
      // เมื่อมี API จริง ให้ใช้ settingsService เพื่ออัปเดตข้อมูล
      // await settingsService.updateCurriculum(updatedCurriculum);
      
      // อัปเดตข้อมูลในหน้าจอ
      setCurriculums(curriculums.map(curriculum => 
        curriculum.id === editingCurriculum.id ? updatedCurriculum : curriculum
      ));
      
      message.success('อัปเดตหลักสูตรสำเร็จ');
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating curriculum:', error);
      message.error('ไม่สามารถอัปเดตหลักสูตรได้');
    } finally {
      setLoading(false);
    }
  };

  // จัดการการเพิ่มหลักสูตรใหม่
  const handleAdd = () => {
    const currentThaiYear = getCurrentThaiYear();
    const newCurriculum = {
      id: Math.max(...curriculums.map(c => c.id), 0) + 1,
      code: `CS${currentThaiYear}`,
      name: '',
      shortName: '',
      startYear: currentThaiYear,
      endYear: null,
      active: true,
      requirements: {
        internship: {
          minYear: 3,
          minCredits: 75,
          minMajorCredits: 27,
          minHours: 240
        },
        project: {
          minYear: 4,
          minCredits: 90,
          minMajorCredits: 54,
          minHours: null
        }
      }
    };
    
    setEditingCurriculum(newCurriculum);
    editForm.resetFields();
    
    // ตั้งค่าเริ่มต้นสำหรับหลักสูตรใหม่
    editForm.setFieldsValue({
      code: newCurriculum.code,
      startYear: newCurriculum.startYear,
      active: true,
      // เกณฑ์ฝึกงาน
      internshipMinYear: 3,
      internshipMinCredits: 75,
      internshipMinMajorCredits: 27,
      internshipMinHours: 240,  
      // เกณฑ์โครงงาน
      projectMinYear: 4,
      projectMinCredits: 90,
      projectMinMajorCredits: 54
    });
    
    setEditModalVisible(true);
  };

  // กำหนดคอลัมน์ของตาราง
  const columns = [
    {
      title: 'รหัสหลักสูตร',
      dataIndex: 'code',
      key: 'code',
      width: 120
    },
    {
      title: 'ชื่อย่อหลักสูตร',
      dataIndex: 'shortName',
      key: 'shortName',
      width: 180
    },
    {
      title: 'ปีที่เริ่มใช้',
      dataIndex: 'startYear',
      key: 'startYear',
      width: 100
    },
    {
      title: 'ปีที่สิ้นสุด',
      dataIndex: 'endYear',
      key: 'endYear',
      width: 100,
      render: (text) => text ? text : 'ปัจจุบัน'
    },
    {
      title: 'สถานะ',
      dataIndex: 'active',
      key: 'active',
      width: 100,
      render: (active) => (
        <Tag color={active ? 'green' : 'gray'}>
          {active ? 'ใช้งาน' : 'ไม่ใช้งาน'}
        </Tag>
      )
    },
    {
      title: 'เกณฑ์ฝึกงาน (หน่วยกิต)',
      dataIndex: ['requirements', 'internship', 'minCredits'],
      key: 'internshipCredits',
      width: 150
    },
    {
      title: 'เกณฑ์โครงงาน (หน่วยกิต)',
      dataIndex: ['requirements', 'project', 'minCredits'],
      key: 'projectCredits',
      width: 150
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
          <Button 
            icon={<DeleteOutlined />} 
            size="small" 
            danger
            onClick={() => handleDelete(record.id)}
            disabled={record.active}
          />
        </Space>
      )
    }
  ];

  return (
    <div className="curriculum-settings">
      <Card className="settings-card">
        <div className="card-title-with-button">
          <Title level={5}>หลักสูตรของสาขาวิชา</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={handleAdd}
          >
            เพิ่มหลักสูตรใหม่
          </Button>
        </div>
        <Text type="secondary">
          กำหนดหลักสูตรที่ใช้ในสาขาวิชาและเกณฑ์ต่างๆ สำหรับแต่ละหลักสูตร
        </Text>
        
        <Table
          columns={columns}
          dataSource={curriculums}
          rowKey="id"
          loading={loading}
          pagination={false}
          style={{ marginTop: 16 }}
          expandable={{
            expandedRowRender: record => (
              <div style={{ padding: '10px' }}>
                <h4 style={{ marginBottom: '10px' }}>{record.name}</h4>
                <Collapse>
                  <Panel header="เกณฑ์การฝึกงาน" key="1">
                    <ul>
                      <li>ชั้นปีขั้นต่ำ: ปี {record.requirements.internship.minYear}</li>
                      <li>หน่วยกิตรวมขั้นต่ำ: {record.requirements.internship.minCredits} หน่วยกิต</li>
                      <li>หน่วยกิตสาขาขั้นต่ำ: {record.requirements.internship.minMajorCredits} หน่วยกิต</li>
                      <li>ชั่วโมงฝึกงานขั้นต่ำ: {record.requirements.internship.minHours} ชั่วโมง</li>
                    </ul>
                  </Panel>
                  <Panel header="เกณฑ์โครงงานพิเศษ" key="2">
                    <ul>
                      <li>ชั้นปีขั้นต่ำ: ปี {record.requirements.project.minYear}</li>
                      <li>หน่วยกิตรวมขั้นต่ำ: {record.requirements.project.minCredits} หน่วยกิต</li>
                      <li>หน่วยกิตสาขาขั้นต่ำ: {record.requirements.project.minMajorCredits} หน่วยกิต</li>
                    </ul>
                  </Panel>
                </Collapse>
              </div>
            ),
          }}
        />
      </Card>

      {/* Modal สำหรับแก้ไขหลักสูตร */}
      <Modal
        title={editingCurriculum?.id ? "แก้ไขหลักสูตร" : "เพิ่มหลักสูตรใหม่"}
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
        width={900}
      >
        <Form
          form={editForm}
          layout="vertical"
        >
          <Tabs defaultActiveKey="1">
            <TabPane tab="ข้อมูลหลักสูตร" key="1">
              <div className="form-row-2">
                <Form.Item
                  name="code"
                  label="รหัสหลักสูตร"
                  rules={[{ required: true, message: 'กรุณากรอกรหัสหลักสูตร' }]}
                >
                  <Input placeholder="เช่น CS2565" />
                </Form.Item>
                
                <Form.Item
                  name="startYear"
                  label="ปีที่เริ่มใช้"
                  rules={[{ required: true, message: 'กรุณากรอกปีที่เริ่มใช้' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={2500} max={2600} />
                </Form.Item>
                
                <Form.Item
                  name="endYear"
                  label="ปีที่สิ้นสุด (ไม่ต้องระบุหากยังใช้อยู่)"
                >
                  <InputNumber style={{ width: '100%' }} min={2500} max={2600} />
                </Form.Item>
              </div>
              
              <Form.Item
                name="name"
                label="ชื่อหลักสูตร"
                rules={[{ required: true, message: 'กรุณากรอกชื่อหลักสูตร' }]}
              >
                <Input placeholder="เช่น หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ ฉบับปรับปรุง พ.ศ. 2565" />
              </Form.Item>
              
              <Form.Item
                name="shortName"
                label="ชื่อย่อหลักสูตร"
                rules={[{ required: true, message: 'กรุณากรอกชื่อย่อหลักสูตร' }]}
              >
                <Input placeholder="เช่น วท.บ. (วิทยาการคอมพิวเตอร์) 2565" />
              </Form.Item>
              
              <Form.Item
                name="active"
                label="สถานะการใช้งาน"
                valuePropName="checked"
              >
                <Switch checkedChildren="ใช้งาน" unCheckedChildren="ไม่ใช้งาน" />
              </Form.Item>
            </TabPane>
            
            <TabPane tab="เกณฑ์การฝึกงาน" key="2">
              <div className="form-row-2">
                <Form.Item
                  name="internshipMinYear"
                  label="ชั้นปีขั้นต่ำ"
                  rules={[{ required: true, message: 'กรุณากรอกชั้นปีขั้นต่ำ' }]}
                >
                  <InputNumber min={1} max={8} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="internshipMinCredits"
                  label="หน่วยกิตรวมขั้นต่ำ"
                  rules={[{ required: true, message: 'กรุณากรอกหน่วยกิตรวมขั้นต่ำ' }]}
                >
                  <InputNumber min={0} max={150} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="internshipMinMajorCredits"
                  label="หน่วยกิตสาขาขั้นต่ำ"
                  rules={[{ required: true, message: 'กรุณากรอกหน่วยกิตสาขาขั้นต่ำ' }]}
                >
                  <InputNumber min={0} max={150} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="internshipMinHours"
                  label="จำนวนชั่วโมงฝึกงานขั้นต่ำ"
                  rules={[{ required: true, message: 'กรุณากรอกจำนวนชั่วโมง' }]}
                >
                  <InputNumber min={0} max={1000} style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </TabPane>
            
            <TabPane tab="เกณฑ์โครงงานพิเศษ" key="3">
              <div className="form-row-2">
                <Form.Item
                  name="projectMinYear"
                  label="ชั้นปีขั้นต่ำ"
                  rules={[{ required: true, message: 'กรุณากรอกชั้นปีขั้นต่ำ' }]}
                >
                  <InputNumber min={1} max={8} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="projectMinCredits"
                  label="หน่วยกิตรวมขั้นต่ำ"
                  rules={[{ required: true, message: 'กรุณากรอกหน่วยกิตรวมขั้นต่ำ' }]}
                >
                  <InputNumber min={0} max={150} style={{ width: '100%' }} />
                </Form.Item>
                
                <Form.Item
                  name="projectMinMajorCredits"
                  label="หน่วยกิตสาขาขั้นต่ำ"
                  rules={[{ required: true, message: 'กรุณากรอกหน่วยกิตสาขาขั้นต่ำ' }]}
                >
                  <InputNumber min={0} max={150} style={{ width: '100%' }} />
                </Form.Item>
              </div>
            </TabPane>
          </Tabs>
        </Form>
      </Modal>
      
      <style jsx>{`
        .card-title-with-button {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .form-row-2 {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
      `}</style>
    </div>
  );
};

export default CurriculumSettings;