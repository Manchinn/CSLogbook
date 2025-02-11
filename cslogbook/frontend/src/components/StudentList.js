import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, 
    Input, 
    Space, 
    Typography, 
    Button, 
    Tag, 
    Row, 
    Col, 
    message, 
    Popconfirm, 
    Modal, 
    Form, 
    Select} from 'antd';
import { 
     SearchOutlined,
     ReloadOutlined, 
     UserOutlined, 
     PlusOutlined, 
     EditOutlined, 
     DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

//import StudentForm from "./StudentForm";


const { Title } = Typography;
const { Option } = Select;


const StudentList = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [sortedInfo, setSortedInfo] = useState({});
    const [visible, setVisible] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [form] = Form.useForm();
    
    const navigate = useNavigate();

    // แก้ไขฟังก์ชัน fetchStudents
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('http://localhost:5000/api/students', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const studentOnly = response.data.filter(user => user.role === 'student');
            setStudents(studentOnly);
        } catch (error) {
            console.error('Error fetching students:', error);
            if (error.response?.status === 401) {
                // ถ้า token หมดอายุหรือไม่ถูกต้อง ให้ redirect ไปหน้า login
                message.error('กรุณาเข้าสู่ระบบใหม่');
                navigate('/login');
            }
        } finally { 
            setLoading(false);
        }
    }, [navigate]);

    const handleAddOrEdit = async (values) => {
        try {
            if (editingStudent) {
                await axios.put(`http://localhost:5000/api/students/${editingStudent.studentID}`, values);
                message.success("แก้ไขข้อมูลนักศึกษาเรียบร้อย!");
            } else {
                await axios.post("http://localhost:5000/api/students", values);
                message.success("เพิ่มนักศึกษาเรียบร้อย!");
            }
            fetchStudents();
            setVisible(false);
            setEditingStudent(null);
        } catch (error) {
            message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
    };
    
    const handleDelete = async (studentID) => {
        try {
            await axios.delete(`http://localhost:5000/api/students/${studentID}`);
            message.success("ลบนักศึกษาเรียบร้อย!");
            fetchStudents();
        } catch (error) {
            message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        }
    };

    const openModal = (student = null) => {
        setEditingStudent(student);
        setVisible(true);
        form.setFieldsValue(student || { studentID: '', firstName: '', lastName: '', email: '', internshipStatus: '' });
    };

    // ใช้ useCallback สำหรับ updateSummary
    const updateSummary = useCallback((data) => {
        const filteredData = data.filter(student =>
            student.studentID?.toLowerCase().includes(searchText.toLowerCase()) ||
            student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
            student.lastName?.toLowerCase().includes(searchText.toLowerCase())
        );
        // ส่งค่ากลับแทนการใช้ state
        return {
            total: filteredData.length,
            internshipEligible: filteredData.filter(s => s.isEligibleForInternship).length,
            projectEligible: filteredData.filter(s => s.isEligibleForProject).length
        };
    }, [searchText]); // dependency เป็น searchText เพราะใช้ในการกรอง

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]); // เพิ่ม dependency

    const handleTableChange = (pagination, filters, sorter) => {
        setSortedInfo(sorter);
    };

    const filteredStudents = students.filter(student =>
        student.studentID?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(searchText.toLowerCase())
    );

    const tableHeaderStyle = {
        background: '#fafafa',
        fontWeight: 500,
        padding: '12px 16px',
        borderBottom: '2px solid #f0f0f0',
    };

    const tableCellStyle = {
        padding: '12px 16px',
        fontSize: '14px'
    };

    const currentSummary = updateSummary(students);

    const columns = [
        {
            title: 'รหัสนักศึกษา',
            dataIndex: 'studentID',
            key: 'studentID',
            width: 140,
            fixed: 'left',
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.studentID.localeCompare(b.studentID),
            sortOrder: sortedInfo.columnKey === 'studentID' && sortedInfo.order,
            render: text => <span style={{ fontWeight: 500 }}>{text}</span>
        },
        {
            title: 'ชื่อ',
            dataIndex: 'firstName',
            key: 'firstName',
            width: 150,
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.firstName.localeCompare(b.firstName),
            sortOrder: sortedInfo.columnKey === 'firstName' && sortedInfo.order
        },
        {
            title: 'นามสกุล',
            dataIndex: 'lastName',
            key: 'lastName',
            width: 150,
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.lastName.localeCompare(b.lastName),
            sortOrder: sortedInfo.columnKey === 'lastName' && sortedInfo.order
        },
        {
            title: 'สถานะฝึกงาน',
            dataIndex: 'isEligibleForInternship',
            key: 'internship',
            width: 130,
            align: 'center',
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => Number(a.isEligibleForInternship) - Number(b.isEligibleForInternship),
            sortOrder: sortedInfo.columnKey === 'internship' && sortedInfo.order,
            render: isEligible => (
                <Tag color={isEligible ? 'success' : 'error'} style={{ 
                    minWidth: '80px', 
                    textAlign: 'center',
                    padding: '4px 8px'
                }}>
                    {isEligible ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                </Tag>
            )
        },
        {
            title: 'สถานะโปรเจค',
            dataIndex: 'isEligibleForProject',
            key: 'project',
            width: 130,
            align: 'center',
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => Number(a.isEligibleForProject) - Number(b.isEligibleForProject),
            sortOrder: sortedInfo.columnKey === 'project' && sortedInfo.order,
            render: isEligible => (
                <Tag color={isEligible ? 'success' : 'error'} style={{ 
                    minWidth: '80px', 
                    textAlign: 'center',
                    padding: '4px 8px'
                }}>
                    {isEligible ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                </Tag>
            )
        },/*
        {
            title: 'อีเมล',
            dataIndex: 'email',
            key: 'email',
            width: 300,
            onHeaderCell: () => ({ style: tableHeaderStyle }),
            onCell: () => ({ style: tableCellStyle }),
            sorter: (a, b) => a.email.localeCompare(b.email),
            sortOrder: sortedInfo.columnKey === 'email' && sortedInfo.order,
            render: email => <span style={{ color: '#666' }}>{email}</span>
        },*/
        {
            title: "จัดการ",
            key: "actions",
            width: 130,
            align: 'center',
            render: (record) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => openModal(record)}>
                        แก้ไข
                    </Button>
                    <Popconfirm title="คุณแน่ใจหรือไม่ที่จะลบ?" onConfirm={() => handleDelete(record.studentID)}>
                        <Button icon={<DeleteOutlined />} danger>
                            ลบ
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ 
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            background: '#fff'
        }}>
            {/* หัวข้อ */}
            <Title level={2} style={{ 
                marginTop: 0,
                marginBottom: '2px',
                fontSize: '24px'
            }}>
                รายชื่อนักศึกษา
            </Title>

            <Modal
                visible={visible}
                title={editingStudent ? "แก้ไขข้อมูลนักศึกษา" : "เพิ่มนักศึกษา"}
                okText={editingStudent ? "บันทึก" : "เพิ่ม"}
                cancelText="ยกเลิก"
                onCancel={() => setVisible(false)}
                onOk={() => {
                    form.validateFields()
                        .then(values => {
                            handleAddOrEdit(values);
                            form.resetFields();
                        })
                        .catch(info => console.log("Validation Failed:", info));
                }}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="studentID" label="รหัสนักศึกษา" rules={[{ required: true, message: "กรุณากรอกรหัสนักศึกษา!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="firstName" label="ชื่อ" rules={[{ required: true, message: "กรุณากรอกชื่อนักศึกษา!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="lastName" label="นามสกุล" rules={[{ required: true, message: "กรุณากรอกนามสกุล!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="อีเมล" rules={[{ required: true, type: "email", message: "กรุณากรอกอีเมลที่ถูกต้อง!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="internshipStatus" label="สถานะฝึกงาน" rules={[{ required: true, message: "กรุณาเลือกสถานะฝึกงาน!" }]}>
                        <Select>
                            <Option value="active">กำลังฝึกงาน</Option>
                            <Option value="completed">ฝึกงานเสร็จแล้ว</Option>
                            <Option value="pending">รออนุมัติ</Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* แถวควบคุมและสรุปข้อมูล */}
            <Row justify="space-between" align="middle">
                <Col flex="auto">
                    <Row gutter={40} align="middle">
                        <Col>
                            <Space style={{ fontSize: '14px' }}>
                                <UserOutlined />
                                <span>{currentSummary.total} คน</span>
                            </Space>
                        </Col>
                        <Col>
                            <Space style={{ 
                                fontSize: '14px',
                                color: '#52c41a' 
                            }}>
                                <span>มีสิทธิ์ฝึกงาน {currentSummary.internshipEligible} คน</span>
                            </Space>
                        </Col>
                        <Col>
                            <Space style={{ 
                                fontSize: '14px',
                                color: '#1890ff'
                            }}>
                                <span>มีสิทธิ์ทำโปรเจค {currentSummary.projectEligible} คน</span>
                            </Space>
                        </Col>
                    </Row>
                </Col>
                <Col flex="none">
                    <Space size={16}>
                        <Input
                            placeholder="ค้นหาด้วยรหัสนักศึกษา, ชื่อ หรือนามสกุล"
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ 
                                width: 300,
                                borderRadius: '6px'
                            }}
                        />
                        <Button
                            type="primary"
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                fetchStudents();
                                setSortedInfo({});
                            }}
                            loading={loading}
                            style={{ borderRadius: '6px' }}
                        >
                            รีเฟรชข้อมูล
                        </Button>
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={() => 
                                openModal(null)
                            }
                        >
                            เพิ่มนักศึกษา
                        </Button>
                    </Space>
                </Col>
            </Row>

            {/* ตาราง */}
            <Table
                columns={columns}
                dataSource={filteredStudents}
                rowKey="studentID"
                loading={loading}
                size="middle"
                onChange={handleTableChange}
                scroll={{ 
                    x: 1000,
                    y: 'calc(100vh - 350px)' // ปรับความสูงเนื่องจากลดพื้นที่ด้านบน
                }}
                sortDirections={['ascend', 'descend', 'ascend']} // เพิ่มทิศทางการ sort ที่เป็นไปได้
            />
        </div>
    );
};

export default StudentList;