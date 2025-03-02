import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Row, Col, message, Spin, Form, InputNumber, Button, Avatar, Tag, Statistic, Tooltip } from 'antd';
import { UserOutlined, BookOutlined, ProjectOutlined } from '@ant-design/icons';
import axios from 'axios';
import { calculateStudentYear, isEligibleForProject, isEligibleForInternship } from './utils/studentUtils';

const StudentProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  const fetchStudent = React.useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        message.error('กรุณาเข้าสู่ระบบ');
        navigate('/login');
        return;
      }

      const response = await axios.get(`http://localhost:5000/api/students/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data) {
        // แปลงค่าเป็นตัวเลข
        const totalCredits = parseInt(response.data.totalCredits) || 0;
        const majorCredits = parseInt(response.data.majorCredits) || 0;
        
        console.log('Received student data:', {
          totalCredits,
          majorCredits,
          raw: response.data
        });

        const studentYear = calculateStudentYear(response.data.studentID);
        const projectEligibility = isEligibleForProject(studentYear, totalCredits, majorCredits);
        const internshipEligibility = isEligibleForInternship(studentYear, totalCredits);

        const studentData = {
          ...response.data,
          totalCredits,
          majorCredits,
          isEligibleForProject: projectEligibility.eligible,
          isEligibleForInternship: internshipEligibility.eligible,
          projectMessage: projectEligibility.message,
          internshipMessage: internshipEligibility.message
        };

        setStudent(studentData);
        
        // Set form values
        form.setFieldsValue({
          totalCredits,
          majorCredits
        });
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      message.error('เกิดข้อผิดพลาดในการดึงข้อมูลนักศึกษา');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, form]);

  // ปรับปรุง useEffect
  useEffect(() => {
    fetchStudent();
  }, [fetchStudent]);

  // เพิ่มการ trigger event storage หลังจาก update localStorage
  const triggerStorageEvent = () => {
    window.dispatchEvent(new Event('storage'));
  };

  // ปรับปรุง handleEdit
  const handleEdit = async (values) => {
    try {
      const { totalCredits, majorCredits } = values;
      
      console.log('Submitting values:', {
        totalCredits,
        majorCredits
      });

      // ตรวจสอบว่าค่าที่จะส่งไปมีครบไหม
      if (totalCredits === undefined || majorCredits === undefined) {
        message.error('ข้อมูลไม่ครบถ้วน');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.put(`http://localhost:5000/api/students/${id}`, 
        {
          totalCredits: parseInt(totalCredits),
          majorCredits: parseInt(majorCredits)
        },
        {
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (response.status === 200) {
        // อัปเดต localStorage หลังจากการแก้ไขสำเร็จ
        const studentYear = calculateStudentYear(student.studentID);
        const projectEligibility = isEligibleForProject(studentYear, totalCredits, majorCredits);
        const internshipEligibility = isEligibleForInternship(studentYear, totalCredits);
        
        localStorage.setItem('isEligibleForProject', projectEligibility.eligible);
        localStorage.setItem('isEligibleForInternship', internshipEligibility.eligible);
        
        message.success('แก้ไขข้อมูลนักศึกษาเรียบร้อย');
        setEditing(false);
        await fetchStudent(); // Refresh data
        
        // trigger storage event
        triggerStorageEvent();
        
        // ไม่จำเป็นต้อง reload ทั้งหน้าแล้ว
        // window.location.reload(); 
      } else {
        message.warning(response.data.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูล');
      }
    } catch (error) {
      console.error('Error updating student data:', error);
      console.log('Error response:', error.response?.data);
      message.error('เกิดข้อผิดพลาดในการแก้ไขข้อมูลนักศึกษา');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!student) {
    return <div>ไม่พบนักศึกษา</div>;
  }

  const studentYear = calculateStudentYear(student.studentID);

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} lg={6}>
          <Row gutter={[0, 24]}>
            <Col span={24}>
              <Card style={{ textAlign: 'center' }}>
                <Avatar size={120} icon={<UserOutlined />} />
                <h2 style={{ marginTop: 16 }}>{student.firstName} {student.lastName}</h2>
                <p>{student.studentID}</p>
                <Tag color="blue">ชั้นปีที่ {studentYear}</Tag>
              </Card>
            </Col>
            <Col span={24}>
              <Card title="ข้อมูลติดต่อ">
                <p><strong>อีเมล:</strong> {student.email}</p>
              </Card>
            </Col>
          </Row>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="ข้อมูลการศึกษา" extra={!editing && <Button type="primary" onClick={() => setEditing(true)}>แก้ไขข้อมูล</Button>}>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic 
                  title="หน่วยกิตรวมสะสม" 
                  value={student.totalCredits || 0}
                  suffix="หน่วยกิต"
                  prefix={<BookOutlined />}
                />
              </Col>
              <Col span={12}>
                <Statistic 
                  title="หน่วยกิตภาควิชา" 
                  value={student.majorCredits || 0}
                  suffix="หน่วยกิต"
                  prefix={<ProjectOutlined />}
                />
              </Col>
            </Row>

            <Row style={{ marginTop: 24 }}>
              <Col span={12}>
                <Tooltip title={student.internshipMessage}>
                  <Tag color={student.isEligibleForInternship ? 'green' : 'red'}>
                    {student.isEligibleForInternship ? 'มีสิทธิ์ฝึกงาน' : 'ยังไม่มีสิทธิ์ฝึกงาน'}
                  </Tag>
                </Tooltip>
              </Col>
              <Col span={12}>
                <Tooltip title={student.projectMessage}>
                  <Tag color={student.isEligibleForProject ? 'green' : 'red'}>
                    {student.isEligibleForProject ? 'มีสิทธิ์ทำโปรเจค' : 'ยังไม่มีสิทธิ์ทำโปรเจค'}
                  </Tag>
                </Tooltip>
              </Col>
            </Row>
          </Card>

          {editing && (
            <Card style={{ marginTop: 24 }}>
              <Form form={form} onFinish={handleEdit} layout="vertical">
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item 
                      name="totalCredits" 
                      label="หน่วยกิตรวมสะสม"
                      rules={[
                        { required: true, message: 'กรุณากรอกหน่วยกิตรวม' },
                        {
                          validator: async (_, value) => {
                            const numValue = parseInt(value);
                            if (isNaN(numValue)) {
                              throw new Error('กรุณากรอกตัวเลข');
                            }
                            if (numValue < 0) {
                              throw new Error('หน่วยกิตต้องไม่ติดลบ');
                            }
                            if (numValue > 142) {
                              throw new Error('หน่วยกิตรวมต้องไม่เกิน 142 หน่วยกิต');
                            }
                          }
                        }
                      ]}
                    >
                      <InputNumber 
                        min={0} 
                        max={142} 
                        style={{ width: '100%' }} 
                      />
                    </Form.Item>
                  </Col>
                  <Col span={12}>
                    <Form.Item 
                      name="majorCredits" 
                      label="หน่วยกิตภาควิชา"
                      dependencies={['totalCredits']}
                      rules={[
                        { required: true, message: 'กรุณากรอกหน่วยกิตภาควิชา' },
                        {
                          validator: async (_, value) => {
                            const numValue = parseInt(value);
                            const totalCredits = form.getFieldValue('totalCredits');
                            
                            if (isNaN(numValue)) {
                              throw new Error('กรุณากรอกตัวเลข');
                            }
                            if (numValue < 0) {
                              throw new Error('หน่วยกิตต้องไม่ติดลบ');
                            }
                            if (numValue > totalCredits) {
                              throw new Error('หน่วยกิตภาควิชาต้องไม่เกินหน่วยกิตรวม');
                            }
                          }
                        }
                      ]}
                    >
                      <InputNumber 
                        min={0} 
                        max={form.getFieldValue('totalCredits')} 
                        style={{ width: '100%' }} 
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item>
                  <Button type="primary" htmlType="submit">บันทึก</Button>
                  <Button onClick={() => setEditing(false)} style={{ marginLeft: 8 }}>ยกเลิก</Button>
                </Form.Item>
              </Form>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default StudentProfile;