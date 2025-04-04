import React, { useState, useEffect } from 'react';
import { 
  Form, Card, Button, Table, Space, Switch, Typography, Modal, Input, 
  InputNumber, message, DatePicker, Tabs, Divider, Collapse, Select, Tag
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, 
  CheckCircleOutlined, BookOutlined, UnorderedListOutlined
} from '@ant-design/icons';
import { settingsService } from '../../../../services/admin/settingsService';
import moment from 'moment-timezone';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { RangePicker } = DatePicker;

// เพิ่มฟังก์ชัน getActiveCurriculum สำหรับให้หน้าอื่นเรียกใช้
export const getActiveCurriculum = async (studentEnrollYear) => {
  try {
    // ดึงข้อมูลหลักสูตรทั้งหมด
    const response = await settingsService.getCurriculums();
    const curriculums = response.data;
    
    // หาหลักสูตรที่ active และตรงกับช่วงปีที่นักศึกษาเข้าศึกษา
    const matchedCurriculum = curriculums.find(curriculum => 
      curriculum.active && 
      curriculum.startYear <= studentEnrollYear && 
      (!curriculum.endYear || curriculum.endYear >= studentEnrollYear)
    );
    
    return matchedCurriculum || null;
  } catch (error) {
    console.error('Error finding active curriculum:', error);
    return null;
  }
};

// ฟังก์ชันสำหรับตรวจสอบคุณสมบัติการฝึกงาน/โครงงาน
export const checkStudentEligibility = async (student, activityType) => {
  try {
    // หาหลักสูตรที่นักศึกษาใช้ (จาก curriculumId หรือปีที่เข้าศึกษา)
    let curriculum;
    
    if (student.curriculumId) {
      // กรณีมี curriculumId เก็บในข้อมูลนักศึกษาแล้ว
      const response = await settingsService.getCurriculums();
      curriculum = response.data.find(c => c.id === student.curriculumId);
    } else {
      // กรณียังไม่มี ให้หาจากปีที่เข้าศึกษา
      const enrollYear = parseInt(student.studentCode.substring(0, 2)) + 2500;
      curriculum = await getActiveCurriculum(enrollYear);
    }
    
    if (!curriculum) {
      return { eligible: false, message: "ไม่พบข้อมูลหลักสูตร" };
    }
    
    // ตรวจสอบตามเกณฑ์ของหลักสูตร
    const requirements = curriculum.requirements[activityType];
    
    // ตรวจสอบเงื่อนไขต่างๆ
    const isYearEligible = student.year >= requirements.minYear;
    const isCreditEligible = student.totalCredits >= requirements.minCredits;
    const isMajorCreditEligible = student.majorCredits >= requirements.minMajorCredits;
    
    // ... ตรวจสอบเงื่อนไขอื่นๆ ...
    
    // รวมผลการตรวจสอบ
    if (!isYearEligible || !isCreditEligible || !isMajorCreditEligible) {
      return {
        eligible: false,
        message: "ไม่ผ่านเกณฑ์คุณสมบัติ",
        details: {
          curriculum: curriculum.shortName,
          requirements,
          student: {
            year: student.year,
            totalCredits: student.totalCredits,
            majorCredits: student.majorCredits
          }
        }
      };
    }
    
    return { 
      eligible: true, 
      message: "ผ่านเกณฑ์คุณสมบัติ",
      curriculum: curriculum.shortName
    };
  } catch (error) {
    console.error('Error checking eligibility:', error);
    return { eligible: false, message: "เกิดข้อผิดพลาดในการตรวจสอบ" };
  }
};

const CurriculumSettings = () => {
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [curriculums, setCurriculums] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingCurriculum, setEditingCurriculum] = useState(null);

  // ดึงข้อมูลหลักสูตรจาก API
  const fetchCurriculums = async () => {
    setLoading(true);
    try {
      // เมื่อมี API จริง ให้ใช้ settingsService เพื่อดึงข้อมูล
      // const response = await settingsService.getCurriculums();
      // setCurriculums(response.data);
      
      // ตัวอย่างข้อมูลเพื่อการแสดงผล
      const mockData = [
        {
          id: 1,
          code: 'CS2560',
          name: 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ ฉบับปรับปรุง พ.ศ. 2560',
          shortName: 'วท.บ. (วิทยาการคอมพิวเตอร์) 2560',
          startYear: 2560,
          endYear: 2564,
          active: true,
          requirements: {
            internship: {
              minYear: 3,
              minCredits: 81,
              minMajorCredits: 30,
              minHours: 240
            },
            project: {
              minYear: 4,
              minCredits: 95,
              minMajorCredits: 57,
              minHours: null
            }
          }
        },
        {
          id: 2,
          code: 'CS2565',
          name: 'หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาวิทยาการคอมพิวเตอร์ ฉบับปรับปรุง พ.ศ. 2565',
          shortName: 'วท.บ. (วิทยาการคอมพิวเตอร์) 2565',
          startYear: 2565,
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
        }
      ];
      
      setCurriculums(mockData);
    } catch (error) {
      console.error('Error fetching curriculums:', error);
      message.error('ไม่สามารถดึงข้อมูลหลักสูตรได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurriculums();
  }, []);

  // เพิ่ม effect เพื่อส่งข้อมูลหลักสูตรที่ active ไปให้ส่วนอื่นใช้งาน
  useEffect(() => {
    // เมื่อมีการเปลี่ยนแปลงข้อมูลหลักสูตร ให้ update global state
    if (curriculums.length > 0) {
      const activeCurriculums = curriculums.filter(c => c.active);
      // อาจใช้ context หรือ redux store เพื่อเก็บข้อมูลนี้
    }
  }, [curriculums]);

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
    const newCurriculum = {
      id: Math.max(...curriculums.map(c => c.id), 0) + 1,
      code: `CS${new Date().getFullYear() + 543}`,
      name: '',
      shortName: '',
      startYear: new Date().getFullYear() + 543,
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