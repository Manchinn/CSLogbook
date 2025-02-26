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
    Select
} from 'antd';
import {
    SearchOutlined,
    ReloadOutlined,
    UserOutlined,
    PlusOutlined,
    EditOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './StudentList.css';
import { calculateStudentYear, isEligibleForInternship, isEligibleForProject } from './utils/studentUtils';

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
                message.error('กรุณาเข้าสู่ระบบใหม่');
                navigate('/login');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    const handleAddOrEdit = async (values) => {
        try {
            const studentYear = calculateStudentYear(values.studentID);

            // ตรวจสอบสิทธิ์การฝึกงาน
            const eligibleForInternship = isEligibleForInternship(studentYear, values.totalCredits);

            // ตรวจสอบสิทธิ์การทำโปรเจค
            const eligibleForProject = isEligibleForProject(studentYear, values.totalCredits, values.majorCredits);

            if (eligibleForInternship.message) {
                message.warning(eligibleForInternship.message);
            }
            if (eligibleForProject.message) {
                message.warning(eligibleForProject.message);
            }

            if (editingStudent) {
                await axios.put(`http://localhost:5000/api/students/${editingStudent.studentID}`, {
                    totalCredits: values.totalCredits,
                    majorCredits: values.majorCredits,
                    isEligibleForInternship: eligibleForInternship.eligible,
                    isEligibleForProject: eligibleForProject.eligible
                });
                console.log('Edited student:', values);
                message.success("แก้ไขข้อมูลนักศึกษาเรียบร้อย!");
            } else {
                // Generate username and password based on studentID
                values.username = `s${values.studentID}`;
                values.password = values.studentID;

                await axios.post("http://localhost:5000/api/students", {
                    ...values,
                    isEligibleForInternship: eligibleForInternship.eligible,
                    isEligibleForProject: eligibleForProject.eligible
                });
                console.log('Added student:', values);
                message.success("เพิ่มนักศึกษาเรียบร้อย!");
            }
            fetchStudents();
            setVisible(false);
            setEditingStudent(null);
        } catch (error) {
            console.error('Error saving student data:', error);
            if (error.response?.status === 404) {
                message.error("ไม่พบข้อมูลนักศึกษา");
            } else {
                message.error("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
            }
        }
    };

    const handleDelete = async (studentID) => {
        try {
            await axios.delete(`http://localhost:5000/api/students/${studentID}`);
            console.log('Deleted student ID:', studentID);
            message.success("ลบนักศึกษาเรียบร้อย!");
            fetchStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            message.error("เกิดข้อผิดพลาดในการลบข้อมูล");
        }
    };

    const openModal = (student = null) => {
        setEditingStudent(student);
        setVisible(true);
        form.setFieldsValue(student ? {
            ...student,
            isEligibleForInternship: student.isEligibleForInternship ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์',
            isEligibleForProject: student.isEligibleForProject ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'
        } : { studentID: '', firstName: '', lastName: '', email: '', internshipStatus: '', isEligibleForInternship: 'ไม่มีสิทธิ์', isEligibleForProject: 'ไม่มีสิทธิ์', totalCredits: '', majorCredits: '' });
    };

    const updateSummary = useCallback((data) => {
        const filteredData = data.filter(student =>
            student.studentID?.toLowerCase().includes(searchText.toLowerCase()) ||
            student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
            student.lastName?.toLowerCase().includes(searchText.toLowerCase())
        );
        return {
            total: filteredData.length,
            internshipEligible: filteredData.filter(s => s.isEligibleForInternship).length,
            projectEligible: filteredData.filter(s => s.isEligibleForProject).length
        };
    }, [searchText]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleTableChange = (pagination, filters, sorter) => {
        setSortedInfo(sorter);
    };

    const filteredStudents = students.filter(student =>
        student.studentID?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        student.lastName?.toLowerCase().includes(searchText.toLowerCase())
    );

    const tableHeaderStyle = {
        className: 'table-header'
    };

    const tableCellStyle = {
        className: 'table-cell'
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
            render: isEligibleForInternship => (
                <Tag color={isEligibleForInternship ? 'success' : 'error'} style={{
                    minWidth: '80px',
                    textAlign: 'center',
                    padding: '4px 8px'
                }}>
                    {isEligibleForInternship ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
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
            render: isEligibleForProject => (
                <Tag color={isEligibleForProject ? 'success' : 'error'} style={{
                    minWidth: '80px',
                    textAlign: 'center',
                    padding: '4px 8px'
                }}>
                    {isEligibleForProject ? 'มีสิทธิ์' : 'ไม่มีสิทธิ์'}
                </Tag>
            )
        },
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
        <div className="container-studentlist">
            <Modal
                style={{ top: 30 }}
                open={visible}
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
                    <Form.Item name="totalCredits" label="หน่วยกิตรวม" rules={[{ required: true, message: "กรุณากรอกหน่วยกิตรวม!" }]}>
                        <Input type="number" />
                    </Form.Item>
                    <Form.Item name="majorCredits" label="หน่วยกิตภาควิชา" rules={[{ required: true, message: "กรุณากรอกหน่วยกิตภาควิชา!" }]}>
                        <Input type="number" />
                    </Form.Item>
                </Form>
            </Modal>

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

            <Table
                columns={columns}
                dataSource={filteredStudents}
                rowKey="studentID"
                loading={loading}
                size="middle"
                onChange={handleTableChange}
                scroll={{
                    x: 1000,
                    y: 'calc(100vh - 350px)'
                }}
                sortDirections={['ascend', 'descend', 'ascend']}
            />
        </div>
    );
};

export default StudentList;